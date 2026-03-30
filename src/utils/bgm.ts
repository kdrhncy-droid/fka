// ═══════════════════════════════════════════════════════════════════════════════
// BGM Manager — Tüm şarkılar sırayla çalar
// ═══════════════════════════════════════════════════════════════════════════════

const PLAYLIST = [
  '/sounds/Local Forecast - Elevator.mp3',
  '/sounds/Balzan Groove.mp3',
  '/sounds/Fluffing a Duck.mp3',
  '/sounds/Monkeys Spinning Monkeys.mp3',
  '/sounds/Dissappointment.mp3',
  '/sounds/Return of Lazarus.mp3',
];

let audio: HTMLAudioElement | null = null;
let index = 0;
let volume = 0.5;
let enabled = true;

function playIndex(i: number) {
  // Öncekini temizle
  if (audio) {
    audio.onended = null;
    audio.pause();
    audio.src = '';
  }

  index = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  audio = new Audio(PLAYLIST[index]);
  audio.volume = volume;
  audio.onended = () => playIndex(index + 1);

  const promise = audio.play();
  if (promise !== undefined) {
    promise.catch((err) => {
      // Autoplay engellendiyse sessizce geç — kullanıcı etkileşimi zaten oldu
      console.warn('[BGM] play() engellendi:', err);
    });
  }
}

/** Oyuna girilince çağır — kullanıcı etkileşimi anında çağrılmalı */
export function startBgm() {
  if (audio && !audio.paused) return; // Zaten çalıyor
  if (!enabled) return;
  playIndex(index);
}

/** settings.bgmVolume (0–1) değişince çağır */
export function setBgmVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
  if (audio) audio.volume = volume;
}

/** BGM aç/kapat */
export function setBgmEnabled(v: boolean) {
  enabled = v;
  if (!v) {
    audio?.pause();
  } else {
    startBgm();
  }
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
