// ═══════════════════════════════════════════════════════════════════════════════
// BGM Manager — Tüm şarkılar sırayla çalar, phase bağımsız
// ═══════════════════════════════════════════════════════════════════════════════

const PLAYLIST = [
  '/sounds/Local Forecast - Elevator.mp3',
  '/sounds/Balzan Groove.mp3',
  '/sounds/Fluffing a Duck.mp3',
  '/sounds/Monkeys Spinning Monkeys.mp3',
  '/sounds/Dissappointment.mp3',
  '/sounds/Return of Lazarus.mp3',
];

let currentAudio: HTMLAudioElement | null = null;
let currentIndex = 0;
let _bgmVolume = 0.5;
let _bgmEnabled = true;
let _started = false;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function playTrack(index: number) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
  }

  currentIndex = index % PLAYLIST.length;
  const audio = new Audio(PLAYLIST[currentIndex]);
  audio.volume = _bgmVolume;
  audio.addEventListener('ended', () => playTrack(currentIndex + 1));
  currentAudio = audio;

  if (_bgmEnabled) {
    audio.play().catch(() => {});
  }
}

/** Oyuna girilince çağır — ilk şarkıyı başlatır */
export function startBgm() {
  if (_started) return;
  _started = true;
  playTrack(0);
}

/** settings.bgmVolume (0–1) değişince çağır */
export function setBgmVolume(volume: number) {
  _bgmVolume = clamp(volume, 0, 1);
  if (currentAudio) currentAudio.volume = _bgmVolume;
}

/** BGM aç/kapat */
export function setBgmEnabled(enabled: boolean) {
  _bgmEnabled = enabled;
  if (!enabled) {
    currentAudio?.pause();
  } else if (currentAudio) {
    currentAudio.play().catch(() => {});
  }
}

/** Oda bırakınca çağır */
export function stopBgm() {
  currentAudio?.pause();
  currentAudio = null;
  _started = false;
}

// Geriye dönük uyumluluk — phase sistemi artık kullanılmıyor
export type GamePhase = 'prep' | 'day' | 'night';
export function setBgmPhase(_phase: GamePhase) {}
export function unlockBgm() {}
