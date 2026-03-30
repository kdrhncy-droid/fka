import React, { useEffect, useRef } from 'react';
import { stk, adjustColor, drawShadowEllipse } from '../renderer/rendererUtils';

interface Props {
  progress?: number; // 0-100
  message?: string;
}

function drawChibi(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  walkTimer: number,
  faceRight: boolean,
  bodyColor: string,
  hairColor: string,
  holding?: string,
) {
  const dirMul = faceRight ? 1 : -1;
  const bobY = Math.abs(Math.sin(walkTimer)) * 5;
  const swing = Math.sin(walkTimer) * 7;

  ctx.save();
  ctx.translate(x, y);
  drawShadowEllipse(ctx, 0, 28, 18, 7);
  ctx.translate(0, -bobY);
  ctx.scale(dirMul, 1);

  // Ayaklar
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-8 - swing, 22, 6, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
  ctx.beginPath(); ctx.arc(8 + swing, 22, 6, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);

  // Gövde
  ctx.beginPath(); ctx.roundRect(-14, 2, 28, 22, 12);
  const bg = ctx.createLinearGradient(0, 2, 0, 24);
  bg.addColorStop(0, adjustColor(bodyColor, 20));
  bg.addColorStop(1, bodyColor);
  ctx.fillStyle = bg; ctx.fill(); stk(ctx, '#000', 2);

  // Eller
  ctx.fillStyle = '#f5c090';
  if (holding) {
    ctx.beginPath(); ctx.arc(8, 12, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    ctx.beginPath(); ctx.arc(22, 12, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
  } else {
    ctx.beginPath(); ctx.arc(-16, 12 + swing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    ctx.beginPath(); ctx.arc(16, 12 - swing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
  }

  // Kafa
  const headR = 19; const headY = -15;
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2);
  const hg = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, headR);
  hg.addColorStop(0, '#fff1e0'); hg.addColorStop(1, '#f5c090');
  ctx.fillStyle = hg; ctx.fill(); stk(ctx, '#000', 2);

  // Saç
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
  ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
  ctx.lineTo(headR - 8, headY - 2); ctx.lineTo(-headR + 8, headY - 2);
  ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
  ctx.closePath(); ctx.fill(); stk(ctx, adjustColor(hairColor, -20), 1);

  // Yanaklar
  ctx.fillStyle = 'rgba(255,182,193,0.5)';
  ctx.beginPath(); ctx.arc(-10, headY + 5, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(10, headY + 5, 4, 0, Math.PI * 2); ctx.fill();

  // Gözler
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-7, headY + 2, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, headY + 2, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-6, headY, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, headY, 1.2, 0, Math.PI * 2); ctx.fill();

  // Ağız
  ctx.strokeStyle = '#844'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, headY + 7, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();

  // Tutulan eşya
  if (holding) {
    ctx.scale(dirMul, 1);
    ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(holding, dirMul * 22, 8);
  }

  ctx.restore();
}

// Uçuşan yemek parçacıkları
const FOOD_EMOJIS = ['🍕', '🍔', '🥗', '🍜', '🌯', '🍽️', '🥩', '🥬'];
interface FoodParticle { x: number; y: number; vy: number; vx: number; rot: number; vrot: number; emoji: string; size: number; }

export const LoadingScreen: React.FC<Props> = ({ progress = 0, message = 'Yükleniyor...' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<FoodParticle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    // Parçacıkları başlat
    particlesRef.current = Array.from({ length: 12 }, (_, i) => ({
      x: 80 + (i / 12) * (canvas.width - 160),
      y: canvas.height * 0.3 + Math.random() * 100,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.3 - Math.random() * 0.5,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.04,
      emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length],
      size: 22 + Math.random() * 14,
    }));

    const render = (time: number) => {
      const dt = time - timeRef.current;
      timeRef.current = time;
      const W = canvas.width, H = canvas.height;

      // Gökyüzü gradyanı
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      sky.addColorStop(0, '#87ceeb');
      sky.addColorStop(0.6, '#b8e4f7');
      sky.addColorStop(1, '#d4f0a0');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Bulutlar
      const cloudT = time * 0.00008;
      [[0.15, 0.12, 1.0], [0.45, 0.08, 0.7], [0.72, 0.15, 0.85]].forEach(([cx, cy, sc]) => {
        const bx = ((cx + cloudT) % 1.1 - 0.05) * W;
        const by = cy * H;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(bx, by, 38 * sc, 0, Math.PI * 2);
        ctx.arc(bx + 30 * sc, by - 10 * sc, 28 * sc, 0, Math.PI * 2);
        ctx.arc(bx + 55 * sc, by, 32 * sc, 0, Math.PI * 2);
        ctx.fill();
      });

      // Zemin (yeşil çimen)
      const groundY = H * 0.65;
      const ground = ctx.createLinearGradient(0, groundY, 0, H);
      ground.addColorStop(0, '#5a9e3a');
      ground.addColorStop(0.15, '#4a8a2e');
      ground.addColorStop(1, '#3a6e22');
      ctx.fillStyle = ground;
      ctx.fillRect(0, groundY, W, H - groundY);

      // Çimen dalgası
      ctx.fillStyle = '#6ab84a';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let gx = 0; gx <= W; gx += 18) {
        const gy = groundY - Math.sin((gx + time * 0.001) * 0.18) * 5;
        ctx.lineTo(gx, gy);
      }
      ctx.lineTo(W, groundY + 20); ctx.lineTo(0, groundY + 20);
      ctx.closePath(); ctx.fill();

      // Yol (zemin üstü)
      ctx.fillStyle = '#8B7355';
      ctx.fillRect(0, groundY + 10, W, 18);
      ctx.fillStyle = '#7a6245';
      for (let rx = 0; rx < W; rx += 60) {
        ctx.fillRect(rx + ((time * 0.05) % 60) - 30, groundY + 16, 30, 6);
      }

      // Uçuşan yemekler
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.vy += 0.008; // hafif yerçekimi
        // Ekrandan çıkınca sıfırla
        if (p.y > H * 0.7 || p.x < -40 || p.x > W + 40) {
          p.x = 80 + Math.random() * (W - 160);
          p.y = groundY - 20;
          p.vy = -1.5 - Math.random() * 1.5;
          p.vx = (Math.random() - 0.5) * 1.2;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.85;
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();
      });

      // Sol karakter (aşçı, yemek tutuyor)
      const walkT = time * 0.003;
      drawChibi(ctx, W * 0.22, groundY + 5, walkT, true, '#a78bfa', '#4b2c20', '🍕');

      // Sağ karakter (garson, tepsi tutuyor)
      drawChibi(ctx, W * 0.78, groundY + 5, walkT + 1.5, false, '#fbbf24', '#8B4513', '🍽️');

      // Logo / başlık
      ctx.save();
      ctx.textAlign = 'center';
      const titleY = H * 0.28;
      // Gölge
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.font = 'bold 38px Arial';
      ctx.fillText('🍽️ TerraMarket', W / 2 + 3, titleY + 3);
      // Ana yazı
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 8;
      ctx.fillText('🍽️ TerraMarket', W / 2, titleY);
      ctx.shadowBlur = 0;

      // Alt yazı
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Multiplayer Mutfak Oyunu', W / 2, titleY + 38);
      ctx.restore();

      // Yükleme barı
      const barW = Math.min(W * 0.55, 340);
      const barX = (W - barW) / 2;
      const barY = H * 0.82;
      const barH = 18;
      const radius = barH / 2;

      // Bar arka plan
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, radius); ctx.fill();

      // Bar dolgu
      const fillW = (progress / 100) * barW;
      if (fillW > 0) {
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, '#f59e0b');
        barGrad.addColorStop(1, '#10b981');
        ctx.fillStyle = barGrad;
        ctx.beginPath(); ctx.roundRect(barX, barY, Math.max(fillW, radius * 2), barH, radius); ctx.fill();

        // Parlama efekti
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.roundRect(barX + 4, barY + 3, Math.max(fillW - 8, 0), barH / 2 - 2, 4); ctx.fill();
      }

      // Bar çerçeve
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, radius); ctx.stroke();

      // Yükleniyor yazısı
      const dots = '.'.repeat(Math.floor(time / 400) % 4);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${message}${dots}`, W / 2, barY + barH + 22);

      // Yüzde
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`${Math.round(progress)}%`, W / 2, barY - 8);

      frameRef.current = requestAnimationFrame(render);
    };

    frameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameRef.current);
  }, [progress, message]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={320}
      style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
    />
  );
};
