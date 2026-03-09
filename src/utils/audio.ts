// BUG-2: Global SFX bayrak — SettingsPanel'den kontrol edilir
let _sfxEnabled = true;
export function setSfxEnabled(v: boolean) { _sfxEnabled = v; }
export function isSfxEnabled() { return _sfxEnabled; }

let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (!_audioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    _audioCtx = new AC();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

/** Yumuşak bir nota çalar — dolgun ve hoş */
function playNote(ctx: AudioContext, freq: number, startTime: number, duration: number, vol: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Düşük geçişli filtre — sert sesleri yumuşatır
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  filter.Q.value = 1;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  // ADSR — saldırı/bırakma zarfı (doğal his)
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.015); // hızlı saldırı
  gain.gain.setValueAtTime(vol, startTime + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** İki nota birden — daha dolgun ses */
function playChord(ctx: AudioContext, freqs: number[], startTime: number, duration: number, vol: number) {
  freqs.forEach(f => playNote(ctx, f, startTime, duration, vol / freqs.length));
}

export function playSound(_audioCtxRef: any, type: string) {
  if (!_sfxEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;

  switch (type) {
    case 'pickup': {
      // Hafif tıklama + yükselen nota — satisfying pickup
      playNote(ctx, 523, now, 0.08, 0.12, 'triangle'); // C5
      playNote(ctx, 784, now + 0.06, 0.1, 0.08, 'sine');  // G5
      break;
    }
    case 'success': {
      // Üçlü akor — neşeli "başarı" jingle
      playNote(ctx, 523, now, 0.15, 0.08, 'triangle');       // C5
      playNote(ctx, 659, now + 0.1, 0.15, 0.08, 'triangle'); // E5
      playNote(ctx, 784, now + 0.2, 0.2, 0.1, 'sine');       // G5
      break;
    }
    case 'fail': {
      // Düşük alçalan iki nota — "boop boop" uyarı
      playNote(ctx, 330, now, 0.15, 0.1, 'triangle');       // E4
      playNote(ctx, 262, now + 0.15, 0.25, 0.08, 'sine');   // C4
      break;
    }
    case 'trash': {
      // Kısa düşük ses — çöpe atma "thunk"
      playNote(ctx, 196, now, 0.12, 0.1, 'triangle');  // G3
      playNote(ctx, 147, now + 0.05, 0.1, 0.06, 'sine'); // D3
      break;
    }
    case 'arrive': {
      // Zil sesi — kapı çanı, müşteri geldi
      playChord(ctx, [659, 784], now, 0.12, 0.1);        // E5+G5
      playChord(ctx, [784, 988], now + 0.12, 0.18, 0.08); // G5+B5
      break;
    }
    default:
      break;
  }
}
