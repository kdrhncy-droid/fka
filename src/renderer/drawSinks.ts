import { WashingSink } from "../types/game";
import { drawProgressBar } from './rendererUtils';

const WASH_TICKS = 60;

export function drawSinks(
  ctx: CanvasRenderingContext2D,
  sinks: WashingSink[],
  stationLayout?: Record<string, { x: number; y: number }>,
  movingId?: string | null
) {
  for (const sink of sinks) {
    if (movingId === sink.id) continue;
    const x = stationLayout?.[sink.id]?.x ?? sink.x;
    const y = stationLayout?.[sink.id]?.y ?? sink.y;

    if (sink.input === '__dirty_plate__') {
      ctx.fillStyle = '#b0c4de';
      ctx.beginPath(); ctx.ellipse(x, y - 15, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8b4513';
      ctx.beginPath(); ctx.arc(x + 4, y - 15, 3, 0, Math.PI * 2); ctx.fill();
    } else if (sink.input === '__clean_plate__') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(x, y - 15, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 6, y - 17); ctx.lineTo(x - 2, y - 19); ctx.stroke();
    }

    if (sink.progress > 0 && sink.progress < WASH_TICKS) {
      drawProgressBar(ctx, x, y - 36, 34, 5, sink.progress / WASH_TICKS, '#0ea5e9', 'rgba(0,0,0,0.65)');
    }
  }
}
