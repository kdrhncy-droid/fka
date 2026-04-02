import { CakeBaker, CAKE_TICKS } from '../../shared/types';
import { stk, drawShadowEllipse, drawStationBody, drawProgressBar, drawLabel, drawEmoji } from './rendererUtils';

export function drawCakeBaker(ctx: CanvasRenderingContext2D, baker: CakeBaker, time: number) {
  const { x, y } = baker;

  drawShadowEllipse(ctx, x + 2, y + 22, 26, 8, 0.22);
  drawStationBody(ctx, x, y, 44, 36, '#f9a8d4', '#ec4899', '#be185d');

  // Cam kapak
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath(); ctx.roundRect(x - 16, y - 12, 32, 20, 4); ctx.fill();
  stk(ctx, '#f9a8d4', 1);

  if (baker.input && baker.timer > 0) {
    const progress = 1 - baker.timer / CAKE_TICKS;
    drawProgressBar(ctx, x, y + 12, 32, 5, progress, `hsl(${320 + progress * 20}, 80%, 65%)`, 'rgba(0,0,0,0.4)');

    const t = time * 0.003;
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(x - 6 + i * 12 + Math.sin(t + i * 2) * 2, y - 20 + Math.sin(t * 1.2 + i) * 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (baker.output) drawEmoji(ctx, baker.isBurned ? '⬛' : baker.output, x, y - 2);
  else if (baker.input) drawEmoji(ctx, baker.input, x, y - 2, 14, 0.7);

  drawLabel(ctx, 'PASTA', x, y + 20, '#fce7f3');
}
