import { WashingSink } from "../types/game";

export function drawSinks(
  ctx: CanvasRenderingContext2D,
  sinks: WashingSink[],
  stationLayout?: Record<string, { x: number; y: number }>,
  movingId?: string | null
) {
  for (const sink of sinks) {
    if (movingId === sink.id) continue;
    const dynX = stationLayout?.[sink.id]?.x ?? sink.x;
    const dynY = stationLayout?.[sink.id]?.y ?? sink.y;

    if (sink.input === '__dirty_plate__') {
      // Kirli tabak (lavabo içine, dynY - 15)
      ctx.fillStyle = '#b0c4de';
      ctx.beginPath(); ctx.ellipse(dynX, dynY - 15, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
      // Leke
      ctx.fillStyle = '#8b4513';
      ctx.beginPath(); ctx.arc(dynX + 4, dynY - 15, 3, 0, Math.PI * 2); ctx.fill();
    } else if (sink.input === '__clean_plate__') {
      // Yıkanmış temiz tabak
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(dynX, dynY - 15, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
      // Parlama efekti
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(dynX - 6, dynY - 17); ctx.lineTo(dynX - 2, dynY - 19); ctx.stroke();
    }

    // Progress bar (Sadece yıkanırken)
    if (sink.progress > 0 && sink.progress < 60) {
      const p = Math.min(1, Math.max(0, sink.progress / 60));
      const barW = 34, barH = 5;
      const bx = dynX - barW / 2, by = dynY - 35;
      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.beginPath(); ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 3); ctx.fill();
      // Fill
      ctx.fillStyle = '#0ea5e9'; // Su mavisi
      ctx.beginPath(); ctx.roundRect(bx, by, barW * p, barH, 2); ctx.fill();
    }
  }
}
