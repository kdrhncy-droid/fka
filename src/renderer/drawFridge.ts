import { Fridge } from '../../shared/types';
import { stk } from './rendererUtils';

export function drawFridge(ctx: CanvasRenderingContext2D, fridge: Fridge) {
  const x = fridge.x, y = fridge.y;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(x + 2, y + 28, 22, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Gövde
  const bodyGrad = ctx.createLinearGradient(x - 18, y - 28, x + 18, y + 28);
  bodyGrad.addColorStop(0, '#bfdbfe');
  bodyGrad.addColorStop(0.5, '#93c5fd');
  bodyGrad.addColorStop(1, '#3b82f6');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.roundRect(x - 18, y - 28, 36, 56, 6); ctx.fill();
  stk(ctx, '#1e40af', 2);

  // Kapı çizgisi
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x - 16, y + 2); ctx.lineTo(x + 16, y + 2); ctx.stroke();

  // Tutamak
  ctx.fillStyle = '#1e3a8a';
  ctx.beginPath(); ctx.roundRect(x + 12, y - 20, 4, 12, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(x + 12, y + 8, 4, 12, 2); ctx.fill();

  // Parlaklık
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.roundRect(x - 14, y - 24, 10, 48, 4); ctx.fill();

  // İkon — sınırsız içecek
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🥤', x, y - 8);

  // Etiket
  ctx.font = 'bold 8px Arial';
  ctx.fillStyle = '#1e40af';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('BUZDOLABI', x, y + 22);
}
