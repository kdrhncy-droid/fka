import { Socket } from "socket.io-client";
import { playSound } from "../utils/audio";

export interface FloatingText {
  x: number; y: number;
  text: string;
  life: number;
  color?: string;
  size?: number;
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
    floatingTexts.push({ x: data.x, y: data.y - 20, text: `+${data.amount}`, life: 60 });
  };

  const handlePunch = (data: { x: number; y: number }) => {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const speed = 3 + Math.random() * 2;
      punchParticles.push({ x: data.x, y: data.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30, maxLife: 30 });
    }
  };

  const handleCombo = (data: { x: number; y: number; count: number; bonus: number; label: string }) => {
    floatingTexts.push({
      x: data.x,
      y: data.y - 40,
      text: `${data.label} +${data.bonus}`,
      life: 80,
      color: data.count >= 8 ? '#f97316' : data.count >= 5 ? '#eab308' : '#f59e0b',
      size: data.count >= 5 ? 24 : 20,
    });

    // Combo milestone floating label + ses
    if (data.count === 3) {
      floatingTexts.push({ x: data.x, y: data.y - 65, text: 'COMBO! 🔥', life: 70, color: '#fbbf24', size: 18 });
      playSound(null, 'combo3');
    } else if (data.count === 5) {
      floatingTexts.push({ x: data.x, y: data.y - 65, text: 'ON FIRE! 🔥🔥', life: 80, color: '#f97316', size: 22 });
      playSound(null, 'combo5');
    } else if (data.count === 8) {
      floatingTexts.push({ x: data.x, y: data.y - 65, text: '🔥🔥🔥 UNSTOPPABLE!', life: 100, color: '#ef4444', size: 26 });
      playSound(null, 'combo8');
      // Ekran flash — altın/turuncu
      screenFlash.push({ life: 18, maxLife: 18, color: '#f97316' });
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
    const maxLife = ft.size ? 80 : 60; // combo text daha uzun yaşar
    ctx.save();
    ctx.globalAlpha = ft.life / maxLife;
    ctx.translate(ft.x, ft.y - (1 - ft.life / maxLife) * 30);
    ctx.fillStyle = ft.color ?? "#22c55e";
    ctx.font = `bold ${ft.size ?? 20}px Arial`;
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, 0, 0);
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
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.emoji, p.x, p.y);
    ctx.restore();
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
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
