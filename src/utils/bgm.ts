// ═══════════════════════════════════════════════════════════════════════════════
// BGM Manager — Tüm şarkılar sırayla çalar
// ═══════════════════════════════════════════════════════════════════════════════

const PLAYLIST = [
  '/sounds/Local%20Forecast%20-%20Elevator.mp3',
  '/sounds/Balzan%20Groove.mp3',
  '/sounds/Fluffing%20a%20Duck.mp3',
  '/sounds/Monkeys%20Spinning%20Monkeys.mp3',
  '/sounds/Dissappointment.mp3',
  '/sounds/Return%20of%20Lazarus.mp3',
];

let audio: HTMLAudioElement | null = null;
let index = 0;
let volume = 0.5;
let enabled = true; // localStorage'dan gelen değer setBgmEnabled ile set edilir

function playIndex(i: number) {
  if (audio) {
    audio.onended = null;
    audio.pause();
    audio.src = '';
  }
  index = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  audio = new Audio(PLAYLIST[index]);
  audio.volume = volume;
  audio.onended = () => playIndex(index + 1);

  const p = audio.play();
  if (p !== undefined) p.catch((e) => console.warn('[BGM] play() engellendi:', e));
}

/** Kullanıcı oyuna katılınca çağır (gerçek etkileşim anında) */
export function startBgm() {
  if (!enabled) return;
  if (audio && !audio.paused) return; // Zaten çalıyor
  playIndex(index);
}

/** settings.bgmVolume (0–1) değişince çağır */
export function setBgmVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (audio) audio.volume = volume;
}

/**
 * BGM aç/kapat — useSettings'ten çağrılır.
 * startBgm'den ÖNCE çağrılabilir, o yüzden enabled flag'ini set eder.
 */
export function setBgmEnabled(v: boolean) {
  enabled = v;
  if (!v) {
    audio?.pause();
  } else if (audio && audio.paused) {
    // Durdurulmuş şarkıyı devam ettir
    const p = audio.play();
    if (p !== undefined) p.catch(() => {});
  }
  // enabled=true ama audio=null ise startBgm() zaten handle eder
}

/** Oda bırakınca çağır */
export function stopBgm() {
  if (audio) {
    audio.onended = null;
    audio.pause();
    audio.src = '';
    audio = null;
  }
}

// Geriye dönük uyumluluk
export type GamePhase = 'prep' | 'day' | 'night';
export function setBgmPhase(_phase: GamePhase) {}
export function unlockBgm() {}
