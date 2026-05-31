import { CoffeeMachine } from '../../shared/types';
import { stk, drawShadowEllipse, drawStationBody, drawShine, drawLabel } from './rendererUtils';

export function drawCoffeeMachine(ctx: CanvasRenderingContext2D, machine: CoffeeMachine) {
  const { x, y } = machine;

  drawShadowEllipse(ctx, x + 2, y + 24, 20, 7, 0.2);
  drawStationBody(ctx, x, y, 36, 48, '#78350f', '#1c0a00', '#1c0a00');
  drawShine(ctx, x - 14, y - 20, 8, 36, 0.1, 3);

  // Ekran
  ctx.fillStyle = '#065f46';
  ctx.beginPath(); ctx.roundRect(x - 12, y - 18, 24, 14, 3); ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`☕∞`, x, y - 11);

  // Çıkış noktası
  ctx.fillStyle = '#92400e';
  ctx.beginPath(); ctx.roundRect(x - 8, y + 2, 16, 8, 2); ctx.fill();
  stk(ctx, '#78350f', 1);

  ctx.fillStyle = '#451a03';
  ctx.beginPath(); ctx.arc(x, y + 14, 3, 0, Math.PI * 2); ctx.fill();

  drawLabel(ctx, 'KAHVE', x, y + 18, '#d97706', 8);
}
