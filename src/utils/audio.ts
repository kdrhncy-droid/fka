// BUG-2: Global SFX bayrak — SettingsPanel'den kontrol edilir
let _sfxEnabled = true;
let _sfxVolume = 0.8;
export function setSfxEnabled(v: boolean) { _sfxEnabled = v; }
export function isSfxEnabled() { return _sfxEnabled; }
export function setSfxVolume(v: number) { _sfxVolume = v; }

let _audioCtx: AudioContext | null = null;
let chopBufferCache: AudioBuffer | null = null;
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

  const actualVol = vol * _sfxVolume;
  
  // ADSR — saldırı/bırakma zarfı (doğal his)
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(actualVol, startTime + 0.015); // hızlı saldırı
  gain.gain.setValueAtTime(actualVol, startTime + duration * 0.6);
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
      // Kısa, hafif "tık" — rahatsız etmez
      playNote(ctx, 660, now, 0.06, 0.06, 'sine');
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
    case 'chop': {
      // Bıçak sesi — noise buffer cache'li
      if (!chopBufferCache || chopBufferCache.sampleRate !== ctx.sampleRate) {
        chopBufferCache = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
        const data = chopBufferCache.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = chopBufferCache;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18 * _sfxVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 1800;
      noise.connect(hpf);
      hpf.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      // Kısa "thud" alt frekans
      playNote(ctx, 180, now, 0.05, 0.12, 'triangle');
      break;
    }
    case 'combo3': {
      // 3x combo — kısa, coşkulu yükselen fanfar
      playNote(ctx, 523, now, 0.07, 0.10, 'triangle');       // C5
      playNote(ctx, 659, now + 0.07, 0.07, 0.10, 'triangle'); // E5
      playNote(ctx, 784, now + 0.14, 0.12, 0.12, 'sine');     // G5
      break;
    }
    case 'combo5': {
      // 5x combo — daha heyecanlı, 4 nota
      playNote(ctx, 523, now, 0.06, 0.12, 'triangle');        // C5
      playNote(ctx, 659, now + 0.06, 0.06, 0.12, 'triangle'); // E5
      playNote(ctx, 784, now + 0.12, 0.06, 0.14, 'triangle'); // G5
      playNote(ctx, 1047, now + 0.18, 0.20, 0.16, 'sine');    // C6
      break;
    }
    case 'combo8': {
      // 8x combo — epik fanfar + bas vuruşu
      playNote(ctx, 131, now, 0.15, 0.18, 'triangle');         // C3 bas
      playNote(ctx, 523, now, 0.07, 0.14, 'triangle');         // C5
      playNote(ctx, 659, now + 0.07, 0.06, 0.14, 'triangle');  // E5
      playNote(ctx, 784, now + 0.13, 0.06, 0.16, 'triangle');  // G5
      playNote(ctx, 1047, now + 0.19, 0.07, 0.18, 'sine');     // C6
      playNote(ctx, 1319, now + 0.26, 0.30, 0.20, 'sine');     // E6 — doruk nota
      break;
    }
    case 'urgent': {
      // Acil uyarı — hızlı titreyen yüksek frekanslı çift nota
      playNote(ctx, 880, now, 0.06, 0.10, 'triangle');         // A5
      playNote(ctx, 1100, now + 0.07, 0.06, 0.10, 'triangle'); // ~C#6
      playNote(ctx, 880, now + 0.14, 0.06, 0.09, 'triangle');  // tekrar
      playNote(ctx, 1100, now + 0.21, 0.10, 0.09, 'triangle');
      break;
    }
    default:
      break;
  }
}
