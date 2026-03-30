import { Fryer, FRYER_TICKS } from '../../shared/types';
import { stk } from './rendererUtils';

export function drawFryer(ctx: CanvasRenderingContext2D, fryer: Fryer, time: number) {
  const x = fryer.x, y = fryer.y;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(x + 2, y + 22, 26, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Gövde
  const bodyGrad = ctx.createLinearGradient(x - 22, y - 18, x + 22, y + 18);
  bodyGrad.addColorStop(0, '#78716c');
  bodyGrad.addColorStop(1, '#44403c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.roundRect(x - 22, y - 18, 44, 36, 6); ctx.fill();
  stk(ctx, '#1c1917', 2);

  // Yağ havuzu
  ctx.fillStyle = '#92400e';
  ctx.beginPath(); ctx.roundRect(x - 16, y - 12, 32, 20, 4); ctx.fill();
  stk(ctx, '#78350f', 1);

  // Yağ parlaması
  ctx.fillStyle = 'rgba(251,191,36,0.3)';
  ctx.beginPath(); ctx.ellipse(x - 4, y - 6, 8, 4, -0.3, 0, Math.PI * 2); ctx.fill();

  // Pişirme progress
  if (fryer.input && fryer.timer > 0) {
    const progress = 1 - fryer.timer / FRYER_TICKS;
    const barW = 32;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.roundRect(x - barW / 2, y + 12, barW, 5, 2); ctx.fill();
    ctx.fillStyle = `hsl(${45 + progress * 30}, 90%, 55%)`;
    ctx.beginPath(); ctx.roundRect(x - barW / 2, y + 12, barW * progress, 5, 2); ctx.fill();

    // Kabarcık animasyonu
    const bubbleT = time * 0.005;
    for (let i = 0; i < 3; i++) {
      const bx = x - 10 + i * 10 + Math.sin(bubbleT + i) * 3;
      const by = y - 4 + Math.sin(bubbleT * 1.5 + i) * 4;
      ctx.fillStyle = 'rgba(251,191,36,0.6)';
      ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Output
  if (fryer.output) {
    ctx.font = '18px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fryer.isBurned ? '⬛' : fryer.output, x, y - 2);
  }

  // Input göster
  if (fryer.input) {
    ctx.font = '14px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText(fryer.input, x, y - 2);
    ctx.globalAlpha = 1;
  }

  // Etiket
  ctx.font = 'bold 9px Arial';
  ctx.fillStyle = '#d6d3d1';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('FRİTÖZ', x, y + 20);
}
