import { CakeBaker, CAKE_TICKS } from '../../shared/types';
import { stk } from './rendererUtils';

export function drawCakeBaker(ctx: CanvasRenderingContext2D, baker: CakeBaker, time: number) {
  const x = baker.x, y = baker.y;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(x + 2, y + 22, 26, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Gövde — pembe/pastel
  const bodyGrad = ctx.createLinearGradient(x - 22, y - 18, x + 22, y + 18);
  bodyGrad.addColorStop(0, '#f9a8d4');
  bodyGrad.addColorStop(1, '#ec4899');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.roundRect(x - 22, y - 18, 44, 36, 6); ctx.fill();
  stk(ctx, '#be185d', 2);

  // Cam kapak
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.roundRect(x - 16, y - 12, 32, 20, 4); ctx.fill();
  stk(ctx, '#f9a8d4', 1);

  // Pişirme progress
  if (baker.input && baker.timer > 0) {
    const progress = 1 - baker.timer / CAKE_TICKS;
    const barW = 32;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.roundRect(x - barW / 2, y + 12, barW, 5, 2); ctx.fill();
    ctx.fillStyle = `hsl(${320 + progress * 20}, 80%, 65%)`;
    ctx.beginPath(); ctx.roundRect(x - barW / 2, y + 12, barW * progress, 5, 2); ctx.fill();

    // Buhar animasyonu
    const steamT = time * 0.003;
    for (let i = 0; i < 2; i++) {
      const sx = x - 6 + i * 12 + Math.sin(steamT + i * 2) * 2;
      const sy = y - 20 + Math.sin(steamT * 1.2 + i) * 3;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Output
  if (baker.output) {
    ctx.font = '18px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(baker.isBurned ? '⬛' : baker.output, x, y - 2);
  }

  if (baker.input) {
    ctx.font = '14px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.7;
    ctx.fillText(baker.input, x, y - 2);
    ctx.globalAlpha = 1;
  }

  // Etiket
  ctx.font = 'bold 9px Arial';
  ctx.fillStyle = '#fce7f3';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('PASTA', x, y + 20);
}
