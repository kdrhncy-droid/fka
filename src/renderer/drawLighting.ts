import { GAME_WIDTH, GAME_HEIGHT, DAY_TICKS, NIGHT_TICKS } from "../types/game";

/**
 * dayPhase + dayTimer'a göre canvas üzerine renk overlay çizer.
 * Gündüz: şeffaf (etki yok)
 * Gün sonu (CLOSING): turuncu/akşam tonu
 * Gece: koyu mavi + yıldızlar + ay
 */
export function drawLighting(
  ctx: CanvasRenderingContext2D,
  dayPhase: 'prep' | 'day' | 'night',
  dayTimer: number,
) {
  if (dayPhase === 'prep') {
    // Prep: sabah tonu — hafif sıcak sarı
    ctx.fillStyle = 'rgba(255, 220, 120, 0.08)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    return;
  }

  if (dayPhase === 'day') {
    // Gün ortası: temiz, overlay yok
    // Gün sonuna yaklaşınca (son %25) akşam tonu başlar
    const progress = dayTimer / DAY_TICKS; // 1 = yeni başladı, 0 = bitti
    if (progress < 0.25) {
      // 0.25 → 0: giderek koyulaşan akşam
      const t = 1 - progress / 0.25; // 0..1
      const alpha = t * 0.28;
      ctx.fillStyle = `rgba(200, 100, 30, ${alpha.toFixed(3)})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    return;
  }

  if (dayPhase === 'night') {
    // Gece: koyu mavi overlay
    const progress = dayTimer / NIGHT_TICKS; // 1 = gece başladı, 0 = sabah
    // Gece başında hızlıca koyulaşır, sabaha doğru açılır
    const alpha = progress > 0.8
      ? 0.52                          // tam gece
      : progress < 0.15
        ? progress / 0.15 * 0.52      // sabah açılışı
        : 0.52;

    ctx.fillStyle = `rgba(5, 10, 60, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Yıldızlar — sadece tam gece (progress > 0.3)
    if (progress > 0.3) {
      const starAlpha = Math.min(1, (progress - 0.3) / 0.3) * 0.7;
      ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha.toFixed(3)})`;
      [[80,25],[200,55],[420,18],[660,42],[870,22],[1100,48],[1220,70],[320,35],[740,60],[950,30]].forEach(([sx, sy]) => {
        ctx.beginPath(); ctx.arc(sx, sy, 1.5, 0, Math.PI * 2); ctx.fill();
      });
    }

    // Ay ikonu
    ctx.globalAlpha = Math.min(1, progress * 2);
    ctx.font = '32px Arial'; ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    ctx.fillText('🌙', GAME_WIDTH - 16, 14);
    ctx.globalAlpha = 1;
  }
}
