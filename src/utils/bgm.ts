// ═══════════════════════════════════════════════════════════════════════════════
// BGM Manager — Web Audio API gain ile iOS dahil tüm platformlarda ses kontrolü
// HTMLAudioElement.volume iOS'ta çalışmaz, gainNode kullanıyoruz.
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
let targetVolume = 0.5;
let enabled = true;
let userHasInteracted = false;

// Web Audio API nesneleri
let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

function getAudioCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function connectGain(el: HTMLAudioElement) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // Önceki source'u temizle
  if (sourceNode) {
    try { sourceNode.disconnect(); } catch (_) {}
    sourceNode = null;
  }

  // GainNode bir kez oluştur
  if (!gainNode) {
    gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);
  }
  gainNode.gain.value = enabled ? targetVolume : 0;

  try {
    sourceNode = ctx.createMediaElementSource(el);
    sourceNode.connect(gainNode);
  } catch (_) {
    // Aynı element iki kez bağlanamaz — güvenli geç
  }
}

function resumeCtx() {
  if (audioCtx?.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function unlockIOSAudio() {
  if (userHasInteracted) return;
  userHasInteracted = true;
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  // Sessiz buffer — iOS pipeline'ı aç
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (_) {}
}

function playIndex(i: number) {
  if (!enabled) return;

  if (audio) {
    audio.onended = null;
    audio.pause();
    // Eski source'u temizle
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch (_) {}
      sourceNode = null;
    }
    audio.src = '';
  }

  index = ((i % PLAYLIST.length) + PLAYLIST.length) % PLAYLIST.length;
  audio = new Audio(PLAYLIST[index]);
  audio.preload = 'auto';
  // HTMLAudioElement.volume — desktop için fallback (iOS'ta etkisiz)
  audio.volume = 1;

  connectGain(audio);
  resumeCtx();

  audio.onended = () => playIndex(index + 1);
  const p = audio.play();
  if (p !== undefined) p.catch((e) => console.warn('[BGM] play() engellendi:', e));
}

export function startBgm() {
  unlockIOSAudio();
  if (!enabled) return;
  if (audio && !audio.paused) return;
  playIndex(index);
}

export function setBgmVolume(v: number) {
  targetVolume = Math.max(0, Math.min(1, v));
  if (gainNode && enabled) {
    gainNode.gain.value = targetVolume;
  }
  // Desktop fallback
  if (audio) audio.volume = 1; // gain hallediyor, element volume 1'de kalır
}

export function setBgmEnabled(v: boolean) {
  enabled = v;
  if (gainNode) {
    gainNode.gain.value = v ? targetVolume : 0;
  }
  if (!v) {
    audio?.pause();
  } else if (audio && audio.paused) {
    resumeCtx();
    const p = audio.play();
    if (p !== undefined) p.catch(() => {});
  }
}

export function stopBgm() {
  if (audio) {
    audio.onended = null;
    audio.pause();
    if (sourceNode) {
      try { sourceNode.disconnect(); } catch (_) {}
      sourceNode = null;
    }
    audio.src = '';
    audio = null;
  }
}

// Geriye dönük uyumluluk
export type GamePhase = 'prep' | 'day' | 'night';
export function setBgmPhase(_phase: GamePhase) {}
export function unlockBgm() {}
