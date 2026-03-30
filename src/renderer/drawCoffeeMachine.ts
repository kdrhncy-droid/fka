import { CoffeeMachine } from '../../shared/types';
import { stk } from './rendererUtils';

export function drawCoffeeMachine(ctx: CanvasRenderingContext2D, machine: CoffeeMachine) {
  const x = machine.x, y = machine.y;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(x + 2, y + 24, 20, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Gövde — koyu kahverengi
  const bodyGrad = ctx.createLinearGradient(x - 18, y - 24, x + 18, y + 24);
  bodyGrad.addColorStop(0, '#78350f');
  bodyGrad.addColorStop(0.5, '#451a03');
  bodyGrad.addColorStop(1, '#1c0a00');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.roundRect(x - 18, y - 24, 36, 48, 6); ctx.fill();
  stk(ctx, '#1c0a00', 2);

  // Ekran
  ctx.fillStyle = '#065f46';
  ctx.beginPath(); ctx.roundRect(x - 12, y - 18, 24, 14, 3); ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 8px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`☕${machine.cups}`, x, y - 11);

  // Çıkış noktası
  ctx.fillStyle = '#92400e';
  ctx.beginPath(); ctx.roundRect(x - 8, y + 2, 16, 8, 2); ctx.fill();
  stk(ctx, '#78350f', 1);

  // Damla
  if (machine.cups > 0) {
    ctx.fillStyle = '#451a03';
    ctx.beginPath(); ctx.arc(x, y + 14, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Parlaklık
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.roundRect(x - 14, y - 20, 8, 36, 3); ctx.fill();

  // Etiket
  ctx.font = 'bold 8px Arial';
  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('KAHVE', x, y + 18);
}
