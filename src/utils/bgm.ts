// ═══════════════════════════════════════════════════════════════════════════════
// BGM (Background Music) Manager
// ─ Dosyaları public/sounds/ klasöründen yükler.
// ─ Hazırlık/Gündüz/Gece evrelerine göre playlist döngüsü yapar.
// ─ Crossfade ile geçiş yapar, ses seviyesi ayarlanabilir.
// ═══════════════════════════════════════════════════════════════════════════════

export type GamePhase = 'prep' | 'day' | 'night';

// ─── Playlist Tanımı ────────────────────────────────────────────────────────
// Senin yaratıcağın dosya isimleri: src'leri public/sounds/ altında.
// Boş string'leri dolu dosya isimleriyle değiştir.
export const BGM_TRACKS: Record<GamePhase, string[]> = {
  prep: [
    '/sounds/Local Forecast - Elevator.mp3',
  ],
  day: [
    '/sounds/Balzan Groove.mp3',
    '/sounds/Fluffing a Duck.mp3',
    '/sounds/Monkeys Spinning Monkeys.mp3',
  ],
  night: [
    '/sounds/Dissappointment.mp3',
    '/sounds/Return of Lazarus.mp3',
  ],
};

// ─── Durum ──────────────────────────────────────────────────────────────────
let currentPhase: GamePhase | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentTrackIndex = 0;
let _bgmVolume = 0.5;
let _bgmEnabled = true;
let _isFading = false;
let _unlocked = false; // Kullanıcı etkileşimi gerçekleşti mi?

// ─── Yardımcı ───────────────────────────────────────────────────────────────
function getRandom(phase: GamePhase): { src: string; index: number } {
  const list = BGM_TRACKS[phase];
  const index = Math.floor(Math.random() * list.length);
  return { src: list[index], index };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Crossfade: mevcut müzik yavaşça solar, yeni müzik başlar
function crossfadeTo(src: string, fadeDuration = 1200 /* ms */) {
  if (_isFading) return;

  const oldAudio = currentAudio;
  const newAudio = new Audio(src);
  newAudio.loop = false;
  newAudio.volume = 0;
  newAudio.addEventListener('ended', onTrackEnded);
  currentAudio = newAudio;

  // Kullanıcı henüz etkileşimde bulunmadıysa audio hazır beklesin, unlock gelince başlar
  if (!_bgmEnabled || !_unlocked) return;

  _isFading = true;
  newAudio.play().catch(() => { _isFading = false; });

  const steps = 40;
  const interval = fadeDuration / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const progress = step / steps;
    if (oldAudio) oldAudio.volume = clamp(_bgmVolume * (1 - progress), 0, 1);
    newAudio.volume = clamp(_bgmVolume * progress, 0, 1);

    if (step >= steps) {
      clearInterval(timer);
      if (oldAudio) { oldAudio.pause(); oldAudio.src = ''; }
      _isFading = false;
    }
  }, interval);
}

// Şarkı bitince aynı playlist'ten sıradaki çal
function onTrackEnded() {
  if (!currentPhase) return;
  const list = BGM_TRACKS[currentPhase];
  currentTrackIndex = (currentTrackIndex + 1) % list.length;
  crossfadeTo(list[currentTrackIndex]);
}

// ─── Dışa Açık API ──────────────────────────────────────────────────────────

/** Oyun evresi değişince çağır (prep → day → night vs.) */
export function setBgmPhase(phase: GamePhase) {
  if (phase === currentPhase) return;
  currentPhase = phase;
  const { src, index } = getRandom(phase);
  currentTrackIndex = index;
  crossfadeTo(src);
}

/** settings.bgmVolume (0–1) değeri değişince çağır */
export function setBgmVolume(volume: number) {
  _bgmVolume = clamp(volume, 0, 1);
  if (currentAudio && !_isFading) {
    currentAudio.volume = _bgmVolume;
  }
}

/** BGM'yi tamamen aç/kapat (toggle) */
export function setBgmEnabled(enabled: boolean) {
  _bgmEnabled = enabled;
  if (!enabled) {
    currentAudio?.pause();
  } else if (_unlocked && currentAudio) {
    currentAudio.play().catch(() => {});
    currentAudio.volume = _bgmVolume;
  } else if (currentPhase) {
    // Hiç müzik yokken açıldıysa (unlock sonrası gelecek)
    setBgmPhase(currentPhase);
  }
}

/** Mevcut müziği durdur (oda bırakma vs.) */
export function stopBgm() {
  currentAudio?.pause();
  currentAudio = null;
  currentPhase = null;
}

/**
 * Kullanıcı ilk etkileşiminde çağır (click, keydown vs.)
 * Autoplay policy'yi aşmak için gerekli.
 */
export function unlockBgm() {
  if (_unlocked) return;
  _unlocked = true;
  // Bekleyen bir phase varsa crossfade ile başlat
  if (_bgmEnabled && currentPhase && currentAudio && currentAudio.paused) {
    currentAudio.volume = 0;
    currentAudio.play().catch(() => {});
    // Fade in
    const steps = 40;
    const interval = 1200 / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (currentAudio) currentAudio.volume = clamp(_bgmVolume * (step / steps), 0, 1);
      if (step >= steps) clearInterval(timer);
    }, interval);
  }
}
