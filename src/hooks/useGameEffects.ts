import { Socket } from "socket.io-client";

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

export function setupGameEffects(socket: Socket | null) {
  const floatingTexts: FloatingText[] = [];
  const punchParticles: PunchParticle[] = [];

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
    // Combo bonus floating text — daha büyük ve farklı renk
    floatingTexts.push({
      x: data.x,
      y: data.y - 40,
      text: `${data.label} +${data.bonus}`,
      life: 80,
      color: data.count >= 8 ? '#f97316' : data.count >= 5 ? '#eab308' : '#f59e0b',
      size: data.count >= 5 ? 24 : 20,
    });
  };

  if (socket) {
    socket.on("tipCollected", handleTip);
    socket.on("punchEffect", handlePunch);
    socket.on("comboServe", handleCombo);
  }

  const cleanup = () => {
    if (socket) {
      socket.off("tipCollected", handleTip);
      socket.off("punchEffect", handlePunch);
      socket.off("comboServe", handleCombo);
    }
  };

  return { floatingTexts, punchParticles, cleanup };
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
