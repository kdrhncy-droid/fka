import React, { useEffect, useRef, useState } from 'react';
import { stopBgm, startBgm, setBgmEnabled } from '../utils/bgm';
import type { DayEndSummary } from '../hooks/useSocket';

interface Props {
  summary: DayEndSummary;
  onDone: () => void;
  bgmOn: boolean;
}

// ─── Particle types ───────────────────────────────────────────────────────────
interface FP { x:number;y:number;vx:number;vy:number;life:number;decay:number;size:number;hue:number; }
interface EP { x:number;y:number;vx:number;vy:number;life:number;decay:number; }
interface SP { x:number;y:number;vx:number;vy:number;life:number;decay:number;size:number;rot:number; }
interface KP { x:number;y:number;vx:number;vy:number;life:number;decay:number;size:number; }
interface AP { x:number;y:number;vx:number;vy:number;life:number;decay:number;size:number; }

export const RevengeSceneOverlay: React.FC<Props> = ({ onDone, bgmOn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canSkip, setCanSkip] = useState(false);
  const skipRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  useEffect(() => {
    stopBgm();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;

    // ── Audio ────────────────────────────────────────────────────────────────
    let AC: AudioContext | null = null;
    const getAC = () => {
      if (!AC) AC = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      return AC;
    };
    const mg = (val = 0.7) => { const g = getAC().createGain(); g.gain.value = val; g.connect(getAC().destination); return g; };

    const startDrone = () => {
      const gain = mg(0);
      [55, 55.8, 82.4].forEach((f, i) => {
        const o = getAC().createOscillator(); o.type = i < 2 ? 'sawtooth' : 'sine'; o.frequency.value = f;
        const g = getAC().createGain(); g.gain.value = i < 2 ? 0.3 : 0.15;
        const lpf = getAC().createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 300;
        o.connect(lpf); lpf.connect(g); g.connect(gain); o.start();
      });
      gain.gain.setValueAtTime(0, getAC().currentTime);
      gain.gain.linearRampToValueAtTime(0.5, getAC().currentTime + 3);
    };

    const playFootsteps = (delay = 0) => {
      const gain = mg(0.9);
      for (let i = 0; i < 10; i++) {
        const t = getAC().currentTime + delay + i * 0.42 + (Math.random() * 0.06 - 0.03);
        const o = getAC().createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(60, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.18);
        const g = getAC().createGain();
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.8, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g); g.connect(gain); o.start(t); o.stop(t + 0.25);
      }
    };

    const playMolotov = (delay = 0) => {
      const gain = mg(1.0); const t = getAC().currentTime + delay;
      const bufLen = Math.floor(getAC().sampleRate * 0.5);
      const buf = getAC().createBuffer(1, bufLen, getAC().sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) { const env = i < 1000 ? i/1000 : Math.pow(1-(i-1000)/(bufLen-1000),1.5); d[i]=(Math.random()*2-1)*env; }
      const ns = getAC().createBufferSource(); ns.buffer = buf;
      const hpf = getAC().createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 3000;
      const ng = getAC().createGain(); ng.gain.value = 1.2;
      ns.connect(hpf); hpf.connect(ng); ng.connect(gain); ns.start(t);
      const o = getAC().createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
      const g = getAC().createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.connect(g); g.connect(gain); o.start(t); o.stop(t + 0.5);
    };

    const playFireLoop = () => {
      const gain = mg(0); const dur = 30;
      const bufLen = Math.floor(getAC().sampleRate * dur);
      const buf = getAC().createBuffer(1, bufLen, getAC().sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        const t2 = i / getAC().sampleRate; const fade = Math.min(t2 / 2, 1);
        d[i] = (Math.random()*2-1)*0.12*fade;
        if (Math.random()<0.0008) d[i]+=(Math.random()*2-1)*0.7*fade;
        if (Math.random()<0.0002) d[i]+=(Math.random()*2-1)*1.2*fade;
      }
      const ns = getAC().createBufferSource(); ns.buffer = buf;
      const lpf = getAC().createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=1200;
      const lpf2 = getAC().createBiquadFilter(); lpf2.type='highpass'; lpf2.frequency.value=80;
      ns.connect(lpf); lpf.connect(lpf2); lpf2.connect(gain); ns.start();
      gain.gain.setValueAtTime(0, getAC().currentTime);
      gain.gain.linearRampToValueAtTime(0.9, getAC().currentTime + 2);
    };

    const playDistantDog = (delay = 0) => {
      const gain = mg(0.25); const t = getAC().currentTime + delay;
      [0, 0.35, 0.65].forEach(dt => {
        const o = getAC().createOscillator(); o.type = 'sawtooth';
        o.frequency.setValueAtTime(320, t+dt); o.frequency.linearRampToValueAtTime(280, t+dt+0.15);
        const g = getAC().createGain();
        g.gain.setValueAtTime(0,t+dt); g.gain.linearRampToValueAtTime(0.6,t+dt+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+dt+0.2);
        const lpf = getAC().createBiquadFilter(); lpf.type='lowpass'; lpf.frequency.value=600;
        o.connect(lpf); lpf.connect(g); g.connect(gain); o.start(t+dt); o.stop(t+dt+0.25);
      });
    };
    // ── Particles ────────────────────────────────────────────────────────────
    let fireP: FP[] = [], emberP: EP[] = [], smokeP: SP[] = [], sparkP: KP[] = [], ashP: AP[] = [];

    const spawnFire = (cx: number, cy: number, intensity: number, wind = 0) => {
      const n = Math.floor(intensity * 6 + 2);
      for (let i = 0; i < n; i++) {
        const spread = intensity * 55;
        fireP.push({
          x: cx + (Math.random() - 0.5) * spread, y: cy + Math.random() * 8,
          vx: (Math.random() - 0.5) * 1.8 + wind, vy: -(1.8 + Math.random() * 4.5) * Math.sqrt(intensity),
          life: 1, decay: 0.012 + Math.random() * 0.018,
          size: (6 + Math.random() * 18) * intensity, hue: 15 + Math.random() * 25,
        });
      }
      if (Math.random() < intensity * 0.4) {
        emberP.push({
          x: cx + (Math.random() - 0.5) * 30, y: cy,
          vx: (Math.random() - 0.5) * 4, vy: -(3 + Math.random() * 5),
          life: 1, decay: 0.006 + Math.random() * 0.01,
        });
      }
      if (Math.random() < intensity * 0.2) {
        smokeP.push({
          x: cx + (Math.random() - 0.5) * 25, y: cy - 30,
          vx: (Math.random() - 0.5) * 0.6 + wind * 0.3, vy: -(0.4 + Math.random() * 0.8),
          life: 1, decay: 0.003 + Math.random() * 0.004,
          size: 20 + Math.random() * 35, rot: Math.random() * Math.PI * 2,
        });
      }
      if (Math.random() < intensity * 0.08) {
        ashP.push({
          x: cx + (Math.random() - 0.5) * 40, y: cy - 20,
          vx: (Math.random() - 0.5) * 1.5 + wind, vy: -(0.2 + Math.random() * 0.5),
          life: 1, decay: 0.002, size: 1 + Math.random() * 2,
        });
      }
    };

    const spawnExplosionSparks = (cx: number, cy: number) => {
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        sparkP.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
          life: 1, decay: 0.02 + Math.random() * 0.03, size: 2 + Math.random() * 3,
        });
      }
    };

    const updateParticles = () => {
      const update = (arr: any[], fn: (p: any) => void) => {
        for (let i = arr.length - 1; i >= 0; i--) {
          arr[i].life -= arr[i].decay;
          if (arr[i].life <= 0) { arr.splice(i, 1); continue; }
          fn(arr[i]);
        }
      };
      update(fireP, p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.97; p.vy *= 0.98; });
      update(emberP, p => { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.vx *= 0.99; });
      update(smokeP, p => { p.x += p.vx; p.y += p.vy; p.rot += 0.005; });
      update(sparkP, p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.vx *= 0.96; });
      update(ashP, p => { p.x += p.vx; p.y += p.vy; p.vx += (Math.random() - 0.5) * 0.1; });
    };

    const drawParticles = () => {
      // Duman
      smokeP.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life * 0.09;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * (1 + (1 - p.life) * 0.8));
        g.addColorStop(0, 'rgba(60,40,30,1)'); g.addColorStop(1, 'rgba(20,15,10,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(0, 0, p.size * (1 + (1 - p.life) * 0.8), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      // Ateş
      fireP.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life * 0.9;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * p.life);
        g.addColorStop(0, `hsl(${p.hue + 40},100%,95%)`);
        g.addColorStop(0.3, `hsl(${p.hue + 20},100%,65%)`);
        g.addColorStop(0.7, `hsl(${p.hue},100%,45%)`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      // Kıvılcımlar
      sparkP.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life;
        ctx.fillStyle = `hsl(${30 + p.life * 30},100%,${60 + p.life * 30}%)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      // Korlar
      emberP.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life * 0.95;
        ctx.fillStyle = `hsl(${20 + p.life * 20},100%,${50 + p.life * 30}%)`;
        ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      // Kül
      ashP.forEach(p => {
        ctx.save(); ctx.globalAlpha = p.life * 0.4;
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
    };

    // ── Scene State ──────────────────────────────────────────────────────────
    let phase = 'BLACKOUT', timer = 0;
    let blackAlpha = 1, streetAlpha = 0, textAlpha = 0;
    let fireIntensity = 0, lampFlicker = 1, lampTimer = 0;
    let molotovX = 0, molotovY = 0, molotovVX = 0, molotovVY = 0, molotovActive = false;
    let explosionFlash = 0;
    let typeText = '', typeFull = 'Bu sadece bir uyarıydı...', typeIdx = 0, typeTimer = 0;
    let vignetteIntensity = 0.5;
    let cameraShake = { x: 0, y: 0, trauma: 0 };

    const FIRES = [
      { x: 0.5, y: 0.72, intensity: 0, maxI: 1.0 },   // kapı önü
      { x: 0.38, y: 0.58, intensity: 0, maxI: 0.55 }, // sol pencere
      { x: 0.62, y: 0.58, intensity: 0, maxI: 0.45 }, // sağ pencere
    ];

    const THUGS = [
      { px: -0.12, py: 0.82, tx: 0.28, ty: 0.82, spd: 0.0018, scale: 1.05, lean: 0.08 },
      { px: -0.08, py: 0.85, tx: 0.22, ty: 0.85, spd: 0.0014, scale: 0.95, lean: 0.05 },
      { px: -0.16, py: 0.80, tx: 0.34, ty: 0.80, spd: 0.0020, scale: 1.10, lean: 0.10 },
      { px: -0.05, py: 0.87, tx: 0.18, ty: 0.87, spd: 0.0012, scale: 0.88, lean: 0.04 },
    ];
    let thugsVisible = false, thugsLeaving = false;

    let raindrops: { x: number; y: number; spd: number; len: number; alpha: number }[] = [];
    for (let i = 0; i < 120; i++) {
      raindrops.push({ x: Math.random(), y: Math.random(), spd: 0.006 + Math.random() * 0.006, len: 0.02 + Math.random() * 0.03, alpha: 0.08 + Math.random() * 0.12 });
    }

    const addShake = (trauma: number) => { cameraShake.trauma = Math.min(1, cameraShake.trauma + trauma); };
    const updateShake = () => {
      cameraShake.trauma = Math.max(0, cameraShake.trauma - 0.04);
      const s = cameraShake.trauma * cameraShake.trauma;
      cameraShake.x = (Math.random() * 2 - 1) * s * 12;
      cameraShake.y = (Math.random() * 2 - 1) * s * 8;
    };

    const PHASES = {
      BLACKOUT: { dur: 90 }, FADEIN: { dur: 80 }, WAIT: { dur: 60 }, THUGS: { dur: 220 },
      PAUSE: { dur: 60 }, MOLOTOV: { dur: 80 }, FIRE: { dur: 180 }, TEXT: { dur: 260 }, FADEOUT: { dur: 120 },
    };
    const phaseList = ['BLACKOUT', 'FADEIN', 'WAIT', 'THUGS', 'PAUSE', 'MOLOTOV', 'FIRE', 'TEXT', 'FADEOUT'];
    let phaseIdx = 0;

    const currentPhase = () => phaseList[phaseIdx];
    const nextPhase = () => { phaseIdx++; timer = 0; if (phaseIdx >= phaseList.length) phaseIdx = phaseList.length - 1; };
    // ── Drawing Functions ────────────────────────────────────────────────────
    const drawSky = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      g.addColorStop(0, '#02020a'); g.addColorStop(0.6, '#060612'); g.addColorStop(1, '#0a0a18');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.55);
      // Yıldızlar
      ctx.save();
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137.5) % 1) * W, sy = ((i * 97.3) % 0.45) * H;
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(timer * 0.02 + i));
        ctx.globalAlpha = twinkle * 0.6 * (1 - fireIntensity * 0.8);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(sx, sy, 0.6 + ((i % 3) * 0.4), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
      // Ay
      ctx.save(); ctx.globalAlpha = 0.7 * (1 - fireIntensity * 0.5);
      ctx.fillStyle = '#e8e0c0'; ctx.shadowColor = '#ffe8a0'; ctx.shadowBlur = 30;
      ctx.beginPath(); ctx.arc(W * 0.82, H * 0.12, W * 0.028, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#02020a';
      ctx.beginPath(); ctx.arc(W * 0.84, H * 0.11, W * 0.024, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawGround = () => {
      const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
      g.addColorStop(0, '#0e0e12'); g.addColorStop(1, '#080808');
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H * 0.45);
      // Kaldırım taşları
      ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = '#334'; ctx.lineWidth = 1;
      for (let row = 0; row < 4; row++) {
        const y = H * (0.58 + row * 0.1);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        const offset = row % 2 === 0 ? 0 : W * 0.07;
        for (let col = 0; col < 16; col++) {
          const x = col * W * 0.07 + offset;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + H * 0.1); ctx.stroke();
        }
      }
      ctx.restore();
      // Yağmur yansıması
      if (fireIntensity > 0) {
        const ref = ctx.createLinearGradient(0, H * 0.72, 0, H);
        ref.addColorStop(0, `rgba(180,60,0,${fireIntensity * 0.18})`); ref.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ref; ctx.fillRect(0, H * 0.72, W, H * 0.28);
      }
    };

    const drawBuilding = () => {
      const bx = W * 0.25, by = H * 0.08, bw = W * 0.5, bh = H * 0.65;
      // Gölge
      ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(bx - 20, by + bh); ctx.lineTo(bx + bw + 20, by + bh);
      ctx.lineTo(bx + bw + 60, H); ctx.lineTo(bx - 60, H); ctx.fill(); ctx.restore();
      // Ana duvar
      const wallG = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
      wallG.addColorStop(0, '#1c1410'); wallG.addColorStop(0.5, '#181210'); wallG.addColorStop(1, '#100c08');
      ctx.fillStyle = wallG; ctx.fillRect(bx, by, bw, bh);
      // Tuğla dokusu
      ctx.save(); ctx.globalAlpha = 0.18;
      const brickH = H * 0.038, brickW = W * 0.065;
      for (let row = 0; row < Math.ceil(bh / brickH) + 1; row++) {
        const ry = by + row * brickH; const offset = row % 2 === 0 ? 0 : brickW * 0.5;
        for (let col = 0; col < Math.ceil(bw / brickW) + 2; col++) {
          const rx = bx + col * brickW - offset;
          ctx.strokeStyle = row % 3 === 0 ? '#3a2818' : '#2a1e12'; ctx.lineWidth = 1;
          ctx.strokeRect(rx + 1, ry + 1, brickW - 2, brickH - 2);
        }
      }
      ctx.restore();
      // Kenarlar
      ctx.fillStyle = '#0a0806'; ctx.fillRect(bx, by, 8, bh);
      ctx.fillStyle = '#0c0a07'; ctx.fillRect(bx + bw - 8, by, 8, bh);
      // Çatı
      ctx.fillStyle = '#0e0b08'; ctx.fillRect(bx - 10, by, bw + 20, H * 0.025);
      ctx.fillStyle = '#1a1410'; ctx.fillRect(bx - 5, by - H * 0.015, bw + 10, H * 0.018);
      // Tabela
      const sx = bx + bw * 0.1, sy = by + H * 0.04, sw = bw * 0.8, sh = H * 0.07;
      ctx.fillStyle = '#1e1508'; ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#3a2810'; ctx.lineWidth = 3; ctx.strokeRect(sx, sy, sw, sh);
      ctx.strokeStyle = '#2a1c0a'; ctx.lineWidth = 1; ctx.strokeRect(sx + 4, sy + 4, sw - 8, sh - 8);
      ctx.save(); ctx.fillStyle = '#7a5a28';
      ctx.font = `bold ${Math.round(sh * 0.45)}px 'Courier New'`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('LOKANTA', sx + sw / 2, sy + sh / 2); ctx.restore();
    };
    const drawWindow = (x: number, y: number, w: number, h: number, idx: number) => {
      ctx.fillStyle = '#120e0a'; ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
      ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 3; ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
      const fireRef = fireIntensity * 0.4;
      const wg = ctx.createLinearGradient(x, y, x, y + h);
      wg.addColorStop(0, `rgba(${8 + fireRef * 60},${6 + fireRef * 20},${4},1)`);
      wg.addColorStop(1, `rgba(${4 + fireRef * 40},${3 + fireRef * 10},${2},1)`);
      ctx.fillStyle = wg; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#1e1810'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
      if (fireIntensity > 0.1) {
        ctx.save(); ctx.globalAlpha = fireIntensity * 0.5;
        const rg = ctx.createRadialGradient(x + w / 2, y + h, 0, x + w / 2, y + h, w * 0.8);
        rg.addColorStop(0, `rgba(255,${80 + idx * 20},0,0.8)`); rg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rg; ctx.fillRect(x, y, w, h); ctx.restore();
      }
    };

    const drawDoor = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#0e0a06'; ctx.fillRect(x - 6, y - 6, w + 12, h + 6);
      ctx.strokeStyle = '#2a1e10'; ctx.lineWidth = 4; ctx.strokeRect(x - 6, y - 6, w + 12, h + 6);
      ctx.fillStyle = '#0e0a06';
      ctx.beginPath(); ctx.arc(x + w / 2, y, w / 2, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#2a1e10'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + w / 2, y, w / 2, Math.PI, 0); ctx.stroke();
      const dg = ctx.createLinearGradient(x, y, x + w, y);
      dg.addColorStop(0, '#100c08'); dg.addColorStop(0.5, '#181410'); dg.addColorStop(1, '#100c08');
      ctx.fillStyle = dg; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#1e1810'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x + w * 0.1, y + h * 0.05, w * 0.8, h * 0.42);
      ctx.strokeRect(x + w * 0.1, y + h * 0.52, w * 0.8, h * 0.42);
      ctx.fillStyle = '#3a2c18';
      ctx.beginPath(); ctx.arc(x + w * 0.78, y + h * 0.5, w * 0.06, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a3c28'; ctx.lineWidth = 1; ctx.stroke();
      if (FIRES[0].intensity > 0) {
        const fg = ctx.createRadialGradient(x + w / 2, y + h, 0, x + w / 2, y + h, w * 1.2);
        fg.addColorStop(0, `rgba(255,120,0,${FIRES[0].intensity * 0.6})`);
        fg.addColorStop(0.4, `rgba(200,60,0,${FIRES[0].intensity * 0.3})`);
        fg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = fg; ctx.fillRect(x - w, y, w * 3, h * 0.5 + w);
      }
    };

    const drawStreetLamp = () => {
      const lx = W * 0.15, ly = H * 0.2;
      ctx.strokeStyle = '#1a1814'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(lx, H * 0.58); ctx.lineTo(lx, ly); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + W * 0.04, ly - H * 0.03); ctx.stroke();
      ctx.fillStyle = '#1a1814'; ctx.fillRect(lx + W * 0.04 - 8, ly - H * 0.05, 16, H * 0.04);
      const lf = lampFlicker * (0.7 + 0.3 * Math.sin(timer * 0.3));
      if (lf > 0.1) {
        ctx.save();
        const halo = ctx.createRadialGradient(lx + W * 0.04, ly - H * 0.03, 0, lx + W * 0.04, ly - H * 0.03, W * 0.12);
        halo.addColorStop(0, `rgba(255,220,100,${lf * 0.2})`);
        halo.addColorStop(0.4, `rgba(255,180,60,${lf * 0.08})`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(lx + W * 0.04, ly - H * 0.03, W * 0.12, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = lf * 0.06;
        const cone = ctx.createLinearGradient(lx + W * 0.04, ly, lx + W * 0.04, H * 0.58);
        cone.addColorStop(0, 'rgba(255,200,80,1)'); cone.addColorStop(1, 'rgba(255,200,80,0)');
        ctx.fillStyle = cone;
        ctx.beginPath();
        ctx.moveTo(lx + W * 0.04, ly);
        ctx.lineTo(lx - W * 0.08, H * 0.58);
        ctx.lineTo(lx + W * 0.16, H * 0.58);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = lf;
        ctx.fillStyle = `rgba(255,230,140,${lf})`;
        ctx.shadowColor = '#ffe080'; ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(lx + W * 0.04, ly - H * 0.03, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };
    const drawRain = () => {
      ctx.save(); ctx.strokeStyle = 'rgba(160,180,220,0.18)'; ctx.lineWidth = 1;
      raindrops.forEach(r => {
        ctx.globalAlpha = r.alpha * (0.5 + fireIntensity * 0.3);
        ctx.beginPath();
        ctx.moveTo(r.x * W, r.y * H);
        ctx.lineTo(r.x * W - r.len * W * 0.15, (r.y + r.len) * H);
        ctx.stroke();
        r.y += r.spd; r.x -= r.spd * 0.08;
        if (r.y > 1) { r.y = 0; r.x = Math.random(); }
      });
      ctx.restore();
    };

    const drawThug = (t: any) => {
      const x = t.px * W, y = t.py * H, s = t.scale * H * 0.22;
      ctx.save();
      ctx.fillStyle = 'rgba(5,3,2,0.97)';
      ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(x - s * 0.13, y - s * 0.52, s * 0.26, s * 0.38, [s * 0.04, s * 0.04, s * 0.02, s * 0.02]);
      ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.62, s * 0.11, s * 0.13, t.lean * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - s * 0.04, y - s * 0.52, s * 0.08, s * 0.06);
      ctx.save(); ctx.translate(x - s * 0.07, y - s * 0.14);
      ctx.rotate(Math.sin(timer * 0.08 + 1) * 0.08);
      ctx.fillRect(-s * 0.07, 0, s * 0.12, s * 0.38);
      ctx.fillRect(-s * 0.09, s * 0.34, s * 0.16, s * 0.06);
      ctx.restore();
      ctx.save(); ctx.translate(x + s * 0.07, y - s * 0.14);
      ctx.rotate(Math.sin(timer * 0.08) * 0.08);
      ctx.fillRect(-s * 0.05, 0, s * 0.12, s * 0.38);
      ctx.fillRect(-s * 0.07, s * 0.34, s * 0.16, s * 0.06);
      ctx.restore();
      ctx.save(); ctx.translate(x - s * 0.13, y - s * 0.48);
      ctx.rotate(Math.sin(timer * 0.08) * 0.15 + t.lean);
      ctx.fillRect(-s * 0.06, 0, s * 0.1, s * 0.32);
      ctx.restore();
      ctx.save(); ctx.translate(x + s * 0.13, y - s * 0.48);
      ctx.rotate(-Math.sin(timer * 0.08) * 0.15 - t.lean * 0.5);
      ctx.fillRect(-s * 0.04, 0, s * 0.1, s * 0.32);
      ctx.restore();
      if (Math.random() < 0.01) {
        ctx.save(); ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#aac';
        ctx.beginPath(); ctx.arc(x + s * 0.05, y - s * 0.72, s * 0.04, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    };

    const drawMolotov = () => {
      if (!molotovActive) return;
      ctx.save();
      ctx.fillStyle = 'rgba(80,120,60,0.9)';
      ctx.save(); ctx.translate(molotovX, molotovY); ctx.rotate(timer * 0.15);
      ctx.fillRect(-4, -10, 8, 18);
      ctx.fillRect(-2, -14, 4, 6);
      ctx.fillStyle = 'rgba(255,140,0,0.9)';
      ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); ctx.restore();
    };

    const drawExplosionFlash = () => {
      if (explosionFlash <= 0) return;
      ctx.save(); ctx.globalAlpha = explosionFlash * 0.7;
      ctx.fillStyle = `rgba(255,${Math.floor(180 * explosionFlash)},0,1)`;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    };

    const drawVignette = () => {
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(0.6, 'rgba(0,0,0,0.2)');
      v.addColorStop(1, `rgba(0,0,0,${0.7 + vignetteIntensity * 0.3})`);
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    };

    const drawTypewriter = () => {
      if (!typeText) return;
      ctx.save();
      const fsize = Math.round(H * 0.042);
      ctx.font = `bold ${fsize}px 'Courier New'`;
      const tw = ctx.measureText(typeFull).width;
      const px = W / 2 - tw / 2 - 24, py = H * 0.84, pw = tw + 48, ph = fsize * 1.8;
      ctx.globalAlpha = textAlpha * 0.85;
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = 'rgba(180,40,10,0.6)'; ctx.lineWidth = 1;
      ctx.strokeRect(px, py, pw, ph);
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#cc2200';
      ctx.shadowColor = '#ff1100'; ctx.shadowBlur = 18;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(typeText + (typeIdx < typeFull.length ? '█' : ''), px + 24, py + ph / 2);
      ctx.restore();
    };

    const drawCinematicBars = () => {
      const bh = H * 0.07;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, bh);
      ctx.fillRect(0, H - bh, W, bh);
    };

    const drawFireGlow = () => {
      FIRES.forEach(f => {
        if (f.intensity <= 0) return;
        const fx = f.x * W, fy = f.y * H;
        const r = W * 0.35 * f.intensity;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
        g.addColorStop(0, `rgba(255,120,10,${f.intensity * 0.5})`);
        g.addColorStop(0.3, `rgba(220,60,5,${f.intensity * 0.25})`);
        g.addColorStop(0.7, `rgba(150,30,0,${f.intensity * 0.1})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
      });
    };
    // ── Update Scene ─────────────────────────────────────────────────────────
    const updateScene = () => {
      timer++;
      updateShake();
      // Lamba flicker
      lampTimer++;
      if (lampTimer > 20 + Math.random() * 40) {
        lampTimer = 0;
        lampFlicker = Math.random() < 0.15 ? 0 : 0.7 + Math.random() * 0.3;
        if (lampFlicker < 0.3) setTimeout(() => { lampFlicker = 1; }, 60 + Math.random() * 100);
      }
      // Ateş spawn
      FIRES.forEach(f => {
        if (f.intensity > 0) {
          const wind = Math.sin(timer * 0.02) * 0.3;
          spawnFire(f.x * W, f.y * H, f.intensity, wind);
        }
      });
      updateParticles();
      // Molotov hareketi
      if (molotovActive) {
        molotovX += molotovVX; molotovY += molotovVY; molotovVY += 0.4;
        if (molotovY > FIRES[0].y * H) {
          molotovActive = false;
          explosionFlash = 1;
          addShake(0.9);
          spawnExplosionSparks(molotovX, molotovY);
          FIRES[0].intensity = 0.1;
        }
      }
      if (explosionFlash > 0) explosionFlash = Math.max(0, explosionFlash - 0.06);

      const p = currentPhase();
      const pDur = (PHASES as any)[p]?.dur || 120;

      switch (p) {
        case 'BLACKOUT':
          blackAlpha = 1; streetAlpha = 0;
          if (timer > pDur) nextPhase();
          break;
        case 'FADEIN':
          blackAlpha = Math.max(0, 1 - timer / pDur);
          streetAlpha = Math.min(1, timer / pDur);
          vignetteIntensity = 0.8;
          if (timer > pDur) nextPhase();
          break;
        case 'WAIT':
          if (timer === 20) playDistantDog(0.5);
          if (timer > pDur) { thugsVisible = true; nextPhase(); }
          break;
        case 'THUGS':
          if (timer === 10) playFootsteps(0.1);
          THUGS.forEach(t => {
            if (t.px < t.tx) t.px = Math.min(t.tx, t.px + t.spd);
          });
          if (timer > pDur) nextPhase();
          break;
        case 'PAUSE':
          if (timer > pDur) nextPhase();
          break;
        case 'MOLOTOV':
          if (timer === 15) {
            const tx = THUGS[0].px * W, ty = THUGS[0].py * H;
            molotovX = tx + W * 0.05; molotovY = ty - H * 0.15;
            const targetX = FIRES[0].x * W, targetY = FIRES[0].y * H;
            const frames = 35;
            molotovVX = (targetX - molotovX) / frames;
            molotovVY = (targetY - molotovY) / frames - 0.4 * frames / 2;
            molotovActive = true;
            playMolotov(0.5);
          }
          if (timer > pDur) nextPhase();
          break;
        case 'FIRE':
          FIRES[0].intensity = Math.min(FIRES[0].maxI, FIRES[0].intensity + 0.008);
          if (timer > 30) FIRES[1].intensity = Math.min(FIRES[1].maxI, FIRES[1].intensity + 0.005);
          if (timer > 60) FIRES[2].intensity = Math.min(FIRES[2].maxI, FIRES[2].intensity + 0.004);
          fireIntensity = FIRES[0].intensity;
          if (timer === 20) {
            thugsLeaving = true;
            THUGS.forEach(t => { t.spd = -t.spd * 0.6; });
            playFireLoop();
            setCanSkip(true);
          }
          if (thugsLeaving) THUGS.forEach(t => { t.px += t.spd; });
          if (timer > pDur) nextPhase();
          break;
        case 'TEXT':
          textAlpha = Math.min(1, (timer - 20) / 40);
          typeTimer++;
          if (typeTimer % 5 === 0 && typeIdx < typeFull.length) {
            typeText += typeFull[typeIdx]; typeIdx++;
          }
          FIRES.forEach(f => { f.intensity = Math.max(0, f.intensity - 0.0008); });
          fireIntensity = FIRES[0].intensity;
          if (timer > pDur) nextPhase();
          break;
        case 'FADEOUT':
          blackAlpha = Math.min(1, timer / pDur);
          textAlpha = Math.max(0, 1 - timer / pDur * 1.5);
          FIRES.forEach(f => { f.intensity = Math.max(0, f.intensity - 0.005); });
          fireIntensity = FIRES[0].intensity;
          if (timer > pDur) {
            // Sahne bitti — müziği geri aç ve callback çağır
            if (bgmOn) { setBgmEnabled(true); startBgm(); }
            onDoneRef.current();
          }
          break;
      }
    };
    // ── Render ───────────────────────────────────────────────────────────────
    const render = () => {
      ctx.save();
      ctx.translate(cameraShake.x, cameraShake.y);
      ctx.clearRect(-20, -20, W + 40, H + 40);

      if (blackAlpha >= 1 && phase !== 'FADEIN') {
        ctx.fillStyle = '#000'; ctx.fillRect(-20, -20, W + 40, H + 40);
        ctx.restore(); return;
      }

      // Sahne
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawSky();
      drawGround();
      ctx.restore();

      // Ateş parlaması (bina arkasında)
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawFireGlow();
      ctx.restore();

      // Bina
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawBuilding();
      const bx = W * 0.25, by = H * 0.08, bw = W * 0.5, bh = H * 0.65;
      // Pencereler
      drawWindow(bx + bw * 0.1, by + H * 0.16, bw * 0.28, H * 0.14, 0); // sol
      drawWindow(bx + bw * 0.62, by + H * 0.16, bw * 0.28, H * 0.14, 1); // sağ
      // Kapı
      drawDoor(bx + bw * 0.38, by + H * 0.32, bw * 0.24, H * 0.33);
      ctx.restore();

      // Sokak lambası
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawStreetLamp();
      ctx.restore();

      // Yağmur
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawRain();
      ctx.restore();

      // Partiküller
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawParticles();
      ctx.restore();

      // Siluetler
      if (thugsVisible) {
        ctx.save(); ctx.globalAlpha = streetAlpha;
        THUGS.forEach(t => drawThug(t));
        ctx.restore();
      }

      // Molotov
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawMolotov();
      ctx.restore();

      // Patlama flaşı
      drawExplosionFlash();

      // Vignette
      ctx.save(); ctx.globalAlpha = streetAlpha;
      drawVignette();
      ctx.restore();

      // Sinematik barlar
      drawCinematicBars();

      // Yazı
      drawTypewriter();

      // Karartma overlay
      if (blackAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${blackAlpha})`;
        ctx.fillRect(-20, -20, W + 40, H + 40);
      }

      ctx.restore();
    };

    // ── Main Loop ─────────────────────────────────────────────────────────────
    let rafId = 0;
    const loop = () => {
      if (skipRef.current) return;
      updateScene();
      render();
      rafId = requestAnimationFrame(loop);
    };

    // Başlat
    try { startDrone(); } catch (e) { }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      skipRef.current = true;
      try { AC?.close(); } catch {}
      if (bgmOn) { setBgmEnabled(true); startBgm(); }
    };
  }, [bgmOn]);

  return (
    <div
      className="fixed z-50 bg-black flex items-center justify-center"
      style={{ inset: 0, WebkitOverflowScrolling: 'touch' }}
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          maxWidth: '100vw',
          maxHeight: '100dvh',
          objectFit: 'contain',
          touchAction: 'none',
        }}
      />
      {canSkip && (
        <button
          onClick={() => {
            skipRef.current = true;
            if (bgmOn) { setBgmEnabled(true); startBgm(); }
            onDoneRef.current();
          }}
          className="absolute bottom-8 right-6 px-4 py-2 bg-black/60 border border-white/30 text-white/70 text-sm font-bold rounded-xl backdrop-blur-sm active:scale-95 transition-all"
          style={{ zIndex: 10 }}
        >
          Atla ▶
        </button>
      )}
    </div>
  );
};