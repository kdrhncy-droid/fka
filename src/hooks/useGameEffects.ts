import { Socket } from "socket.io-client";
import { playSound } from "../utils/audio";

export interface FloatingText {
  x: number; y: number;
  text: string;
  life: number;
  maxLife?: number;
  color?: string;
  size?: number;
  maxScale?: number;
}

export interface PunchParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
}

export interface SparkleParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  emoji: string;
  size?: number;
}

export interface ServiceParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  emoji: string;
  rot: number; rotV: number;
  scale: number;
}

export interface ScreenFlash {
  life: number;
  maxLife: number;
  color: string;
}

export function setupGameEffects(socket: Socket | null) {
  const floatingTexts: FloatingText[] = [];
  const punchParticles: PunchParticle[] = [];
  const sparkleParticles: SparkleParticle[] = [];
  const serviceParticles: ServiceParticle[] = [];
  // Tek seferlik ekran flash — mutable nesne olarak tutulur
  const screenFlash: ScreenFlash[] = [];

  const spawnServiceEffect = (x: number, y: number, effect: string) => {
    const configs: Record<string, { emojis: string[]; count: number; speed: number; life: number }> = {
      star:    { emojis: ['⭐','✨','💫'], count: 8,  speed: 4, life: 50 },
      heart:   { emojis: ['❤️','💕','💖'], count: 6,  speed: 2.5, life: 60 },
      fire:    { emojis: ['🔥','✨'],       count: 7,  speed: 3, life: 45 },
      coin:    { emojis: ['🪙','💰'],       count: 6,  speed: 3, life: 55 },
      rainbow: { emojis: ['🌈','✨','⭐','💫'], count: 10, speed: 4.5, life: 55 },
    };
    const cfg = configs[effect];
    if (!cfg) return;
    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2 - Math.PI / 2;
      const speed = cfg.speed * (0.7 + Math.random() * 0.6);
      serviceParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: cfg.life, maxLife: cfg.life,
        emoji: cfg.emojis[i % cfg.emojis.length],
        rot: Math.random() * Math.PI * 2,
        rotV: (Math.random() - 0.5) * 0.2,
        scale: 0.8 + Math.random() * 0.6,
      });
    }
  };

  const handleServiceEffect = (data: { x: number; y: number; effect: string }) => {
    spawnServiceEffect(data.x, data.y, data.effect);
  };

  const handleTip = (data: { x: number; y: number; amount: number }) => {
    const amt = data.amount;

    // Tip miktarına göre kalite belirleme
    let qColor: string;
    let qLabel: string;
    let qSize: number;
    let qMaxScale: number;
    let flashColor: string | null = null;
    let flashLife = 0;
    let sparkleCount: number;
    let sparkleEmojis: string[];

    if (amt >= 36) {
      qColor = '#fde047'; qLabel = '✨ PERFECT!'; qSize = 44; qMaxScale = 2.4;
      flashColor = '#fbbf24'; flashLife = 14;
      sparkleCount = 12; sparkleEmojis = ['✨', '⭐', '💫', '🌟', '🪙'];
    } else if (amt >= 22) {
      qColor = '#86efac'; qLabel = '👏 GREAT!'; qSize = 36; qMaxScale = 1.9;
      flashColor = '#22c55e'; flashLife = 9;
      sparkleCount = 8; sparkleEmojis = ['✨', '💫', '⭐'];
    } else if (amt >= 12) {
      qColor = '#4ade80'; qLabel = 'GOOD'; qSize = 28; qMaxScale = 1.5;
      sparkleCount = 5; sparkleEmojis = ['✨', '💫'];
    } else {
      qColor = '#a3e635'; qLabel = ''; qSize = 22; qMaxScale = 1.2;
      sparkleCount = 3; sparkleEmojis = ['✨'];
    }

    // Ana puan rakamı — büyük pop-in
    floatingTexts.push({
      x: data.x, y: data.y - 28,
      text: `+${amt}`,
      life: 90, maxLife: 90,
      color: '#ffffff',
      size: qSize,
      maxScale: qMaxScale,
    });

    // Kalite etiketi (OK için gösterme)
    if (qLabel) {
      floatingTexts.push({
        x: data.x, y: data.y - 68,
        text: qLabel,
        life: 72, maxLife: 72,
        color: qColor,
        size: amt >= 36 ? 22 : 17,
        maxScale: 1.7,
      });
    }

    // Sparkle patlaması
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (i / sparkleCount) * Math.PI * 2 - Math.PI / 2;
      const speed = 2.5 + Math.random() * 3;
      sparkleParticles.push({
        x: data.x + (Math.random() - 0.5) * 16,
        y: data.y - 18,
        vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
        vy: Math.sin(angle) * speed - 1,
        life: 55, maxLife: 55,
        emoji: sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)],
        size: amt >= 36 ? 22 : 16,
      });
    }

    // Ekran flash (perfect ve great için)
    if (flashColor) screenFlash.push({ life: flashLife, maxLife: flashLife, color: flashColor });
  };

  const handlePunch = (data: { x: number; y: number }) => {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      punchParticles.push({ x: data.x, y: data.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30, maxLife: 30 });
    }
  };

  const handleCombo = (data: { x: number; y: number; count: number; bonus: number; label: string }) => {
    const cnt = data.count;

    // Bonus puan yazısı — combo sayısına göre büyüyor
    const bonusColor = cnt >= 12 ? '#ef4444' : cnt >= 8 ? '#f97316' : cnt >= 5 ? '#fbbf24' : '#f59e0b';
    const bonusSize  = cnt >= 12 ? 30 : cnt >= 8 ? 26 : cnt >= 5 ? 23 : 20;
    floatingTexts.push({
      x: data.x, y: data.y - 40,
      text: `${data.label} +${data.bonus}`,
      life: 90, maxLife: 90,
      color: bonusColor,
      size: bonusSize,
      maxScale: cnt >= 5 ? 1.7 : 1.3,
    });

    // Milestone efektleri — sadece milestone'da tetikleniyor
    if (cnt === 3) {
      floatingTexts.push({ x: data.x, y: data.y - 75, text: '🔥 COMBO!', life: 75, maxLife: 75, color: '#fbbf24', size: 24, maxScale: 1.9 });
      playSound(null, 'combo3');
      for (let i = 0; i < 5; i++) {
        sparkleParticles.push({ x: data.x + (Math.random()-0.5)*25, y: data.y-20, vx: (Math.random()-0.5)*4, vy: -3-Math.random()*2, life: 45, maxLife: 45, emoji: '🔥', size: 18 });
      }
    } else if (cnt === 5) {
      floatingTexts.push({ x: data.x, y: data.y - 80, text: '🔥🔥 ON FIRE!', life: 88, maxLife: 88, color: '#f97316', size: 30, maxScale: 2.2 });
      playSound(null, 'combo5');
      screenFlash.push({ life: 14, maxLife: 14, color: '#f97316' });
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2;
        sparkleParticles.push({ x: data.x, y: data.y-25, vx: Math.cos(angle)*4, vy: Math.sin(angle)*4-1, life: 55, maxLife: 55, emoji: i % 2 === 0 ? '🔥' : '✨', size: 20 });
      }
    } else if (cnt === 8) {
      floatingTexts.push({ x: data.x, y: data.y - 85, text: '🔥🔥🔥 UNSTOPPABLE!', life: 100, maxLife: 100, color: '#ef4444', size: 34, maxScale: 2.5 });
      playSound(null, 'combo8');
      screenFlash.push({ life: 22, maxLife: 22, color: '#ef4444' });
      for (let i = 0; i < 14; i++) {
        const angle = (i / 14) * Math.PI * 2;
        sparkleParticles.push({ x: data.x + (Math.random()-0.5)*20, y: data.y-30, vx: Math.cos(angle)*6*(0.7+Math.random()*0.6), vy: Math.sin(angle)*6-1, life: 65, maxLife: 65, emoji: ['🔥','💥','✨','⭐','🌟'][i % 5], size: 22 });
      }
    } else if (cnt === 12) {
      floatingTexts.push({ x: data.x, y: data.y - 90, text: '🌋 LEGENDARY!!!', life: 120, maxLife: 120, color: '#fde047', size: 38, maxScale: 3.0 });
      screenFlash.push({ life: 30, maxLife: 30, color: '#fbbf24' });
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        sparkleParticles.push({ x: data.x + (Math.random()-0.5)*30, y: data.y-30, vx: Math.cos(angle)*8*(0.6+Math.random()*0.8), vy: Math.sin(angle)*8-2, life: 80, maxLife: 80, emoji: ['🔥','💥','✨','⭐','🌟','💫','🌋'][i % 7], size: 24 });
      }
    }
  };

  // ✨ Yemek pişince sparkle
  const handleCookDone = (data: { x: number; y: number }) => {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2;
      sparkleParticles.push({
        x: data.x, y: data.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
        life: 40, maxLife: 40,
        emoji: '✨',
      });
    }
  };

  // ❤️ Müşteri mutlu ayrılınca
  const handleHappyLeave = (data: { x: number; y: number }) => {
    for (let i = 0; i < 4; i++) {
      sparkleParticles.push({
        x: data.x + (Math.random() - 0.5) * 20,
        y: data.y - 10,
        vx: (Math.random() - 0.5) * 2,
        vy: -2 - Math.random() * 2,
        life: 50, maxLife: 50,
        emoji: '❤️',
      });
    }
  };

  // 💔 Müşteri sabırsızlıktan kaçınca
  const handleSadLeave = (data: { x: number; y: number }) => {
    floatingTexts.push({
      x: data.x,
      y: data.y - 20,
      text: '💔',
      life: 80,
      color: '#ef4444',
      size: 26,
    });
    for (let i = 0; i < 5; i++) {
      sparkleParticles.push({
        x: data.x + (Math.random() - 0.5) * 24,
        y: data.y - 10,
        vx: (Math.random() - 0.5) * 2.5,
        vy: -2.5 - Math.random() * 2,
        life: 55, maxLife: 55,
        emoji: '💔',
      });
    }
  };

  // 💔 Can kaybı animasyonu
  const handleLoseHeart = (data: { x: number; y: number; amount: number }) => {
    const text = data.amount >= 2 ? `💔💔 -${data.amount}` : '💔 -1';
    floatingTexts.push({
      x: data.x,
      y: data.y - 20,
      text,
      life: 90,
      color: '#ef4444',
      size: data.amount >= 2 ? 22 : 18,
    });
    // Kırmızı ekran flash — can kaybı
    screenFlash.push({ life: 14, maxLife: 14, color: '#ef4444' });
  };

  // 🚨 Acil müşteri uyarısı — sabır kritik seviyede
  const handleUrgentCustomer = (data: { x: number; y: number }) => {
    playSound(null, 'urgent');
    floatingTexts.push({
      x: data.x,
      y: data.y - 30,
      text: '⚠️',
      life: 55,
      color: '#ef4444',
      size: 22,
    });
  };

  // 🎰 Şans müşterisi jackpot!
  const handleJackpot = (data: { x: number; y: number; amount: number }) => {
    // Altın mega ekran flash
    screenFlash.push({ life: 28, maxLife: 28, color: '#fbbf24' });
    // Ana JACKPOT yazısı
    floatingTexts.push({
      x: data.x,
      y: data.y - 25,
      text: '🎰 JACKPOT!',
      life: 150,
      color: '#fbbf24',
      size: 30,
    });
    // Puan miktarı
    floatingTexts.push({
      x: data.x,
      y: data.y - 60,
      text: `+${data.amount} 🪙`,
      life: 120,
      color: '#22c55e',
      size: 20,
    });
    // Para yağmuru
    for (let i = 0; i < 14; i++) {
      sparkleParticles.push({
        x: data.x + (Math.random() - 0.5) * 70,
        y: data.y - 20,
        vx: (Math.random() - 0.5) * 4.5,
        vy: -3.5 - Math.random() * 3,
        life: 65, maxLife: 65,
        emoji: ['🪙', '💰', '✨', '🍀'][Math.floor(Math.random() * 4)],
      });
    }
    playSound(null, 'combo8');
  };

  if (socket) {
    socket.on("tipCollected", handleTip);
    socket.on("punchEffect", handlePunch);
    socket.on("comboServe", handleCombo);
    socket.on("cookDone", handleCookDone);
    socket.on("happyLeave", handleHappyLeave);
    socket.on("sadLeave", handleSadLeave);
    socket.on("serviceEffect", handleServiceEffect);
    socket.on("loseHeart", handleLoseHeart);
    socket.on("urgentCustomer", handleUrgentCustomer);
    socket.on("jackpot", handleJackpot);
  }

  const cleanup = () => {
    if (socket) {
      socket.off("tipCollected", handleTip);
      socket.off("punchEffect", handlePunch);
      socket.off("comboServe", handleCombo);
      socket.off("cookDone", handleCookDone);
      socket.off("happyLeave", handleHappyLeave);
      socket.off("sadLeave", handleSadLeave);
      socket.off("serviceEffect", handleServiceEffect);
      socket.off("loseHeart", handleLoseHeart);
      socket.off("urgentCustomer", handleUrgentCustomer);
      socket.off("jackpot", handleJackpot);
    }
  };

  return { floatingTexts, punchParticles, sparkleParticles, serviceParticles, screenFlash, cleanup };
}

export function renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const ft = texts[i];
    // maxLife ilk render'da otomatik set edilir — eski pushlar için güvenli fallback
    if (ft.maxLife === undefined) ft.maxLife = ft.life;
    const ml = ft.maxLife;
    const t = ft.life / ml; // 1 (yeni) → 0 (ölü)

    // Alpha: ilk %5'te fade-in, son %30'da fade-out
    let alpha: number;
    if (t > 0.95) alpha = (1 - t) / 0.05;
    else if (t < 0.30) alpha = t / 0.30;
    else alpha = 1;

    // Pop-in scale: doğum anında maxScale'den 1.0'a 12 frame'de iner
    const maxSc = ft.maxScale ?? 1.0;
    let scale = 1.0;
    if (maxSc > 1.0) {
      const ageFrames = (1 - t) * ml;
      if (ageFrames < 12) {
        const p = ageFrames / 12;
        // easeOutBack benzeri: büyük başla, 1.0'da hafif overshoot
        scale = maxSc + (1.0 - maxSc) * p;
      }
    }

    // Y: yukarı süzülme
    const yOffset = -(1 - t) * 45;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(ft.x, ft.y + yOffset);
    if (scale !== 1.0) ctx.scale(scale, scale);
    const sz = ft.size ?? 20;
    ctx.font = `bold ${sz}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = Math.max(2, sz / 7);
    ctx.strokeText(ft.text, 0, 0);
    ctx.fillStyle = ft.color ?? '#22c55e';
    ctx.fillText(ft.text, 0, 0);
    ctx.restore();

    ft.life--;
    if (ft.life <= 0) texts.splice(i, 1);
  }
}

export function renderPunchParticles(ctx: CanvasRenderingContext2D, particles: PunchParticle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.translate(p.x, p.y);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⭐", 0, 0);
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function renderSparkleParticles(ctx: CanvasRenderingContext2D, particles: SparkleParticle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const t = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = t > 0.7 ? 1 : t / 0.7;
    ctx.font = `${p.size ?? 16}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, p.x, p.y);
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.vx *= 0.97;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function renderServiceParticles(ctx: CanvasRenderingContext2D, particles: ServiceParticle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    const t = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = t > 0.7 ? 1 : t / 0.7;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.scale * (0.5 + t * 0.5), p.scale * (0.5 + t * 0.5));
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, 0, 0);
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.vx *= 0.96;
    p.rot += p.rotV;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

export function renderScreenFlash(
  ctx: CanvasRenderingContext2D,
  flashes: ScreenFlash[],
  w: number,
  h: number
) {
  for (let i = flashes.length - 1; i >= 0; i--) {
    const f = flashes[i];
    const t = f.life / f.maxLife;
    // Sinüs eğrisi: hızlı çıkış, yavaş sönme — daha organik his
    const alpha = Math.sin(t * Math.PI) * 0.28;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = f.color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
    f.life--;
    if (f.life <= 0) flashes.splice(i, 1);
  }
}
