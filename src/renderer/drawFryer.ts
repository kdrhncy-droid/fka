import { Fryer, FRYER_TICKS } from '../../shared/types';
import { stk, drawShadowEllipse, drawStationBody, drawProgressBar, drawLabel, drawEmoji } from './rendererUtils';

export function drawFryer(ctx: CanvasRenderingContext2D, fryer: Fryer, time: number) {
  const { x, y } = fryer;

  drawShadowEllipse(ctx, x + 2, y + 22, 26, 8, 0.25);
  drawStationBody(ctx, x, y, 44, 36, '#78716c', '#44403c', '#1c1917');

  // Yağ havuzu
  ctx.fillStyle = '#92400e';
  ctx.beginPath(); ctx.roundRect(x - 16, y - 12, 32, 20, 4); ctx.fill();
  stk(ctx, '#78350f', 1);

  // Yağ parlaması
  ctx.fillStyle = 'rgba(251,191,36,0.3)';
  ctx.beginPath(); ctx.ellipse(x - 4, y - 6, 8, 4, -0.3, 0, Math.PI * 2); ctx.fill();

  if (fryer.input && fryer.timer > 0) {
    const progress = 1 - fryer.timer / FRYER_TICKS;
    drawProgressBar(ctx, x, y + 12, 32, 5, progress, `hsl(${45 + progress * 30}, 90%, 55%)`);

    const t = time * 0.005;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(251,191,36,0.6)';
      ctx.beginPath();
      ctx.arc(x - 10 + i * 10 + Math.sin(t + i) * 3, y - 4 + Math.sin(t * 1.5 + i) * 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (fryer.output) drawEmoji(ctx, fryer.isBurned ? '⬛' : fryer.output, x, y - 2);
  else if (fryer.input) drawEmoji(ctx, fryer.input, x, y - 2, 14, 0.7);

  drawLabel(ctx, 'FRİTÖZ', x, y + 20, '#d6d3d1');
}
