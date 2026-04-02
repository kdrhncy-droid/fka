import { Fridge } from '../../shared/types';
import { drawShadowEllipse, drawStationBody, drawShine, drawLabel, drawEmoji } from './rendererUtils';

export function drawFridge(ctx: CanvasRenderingContext2D, fridge: Fridge) {
  const { x, y } = fridge;

  drawShadowEllipse(ctx, x + 2, y + 28, 22, 7, 0.2);
  drawStationBody(ctx, x, y, 36, 56, '#bfdbfe', '#3b82f6', '#1e40af');
  drawShine(ctx, x - 14, y - 24, 10, 48, 0.25, 4);

  // Kapı çizgisi
  ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 16, y + 2); ctx.lineTo(x + 16, y + 2); ctx.stroke();

  // Tutamaklar
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath(); ctx.roundRect(x + 12, y - 20, 4, 12, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + 12, y + 8, 4, 12, 2); ctx.fill();

  drawEmoji(ctx, '🥤', x, y - 8, 16);
  drawLabel(ctx, 'BUZDOLABI', x, y + 22, '#1e40af', 8);
}
