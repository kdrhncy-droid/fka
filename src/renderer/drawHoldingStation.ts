import { HoldingStation, CLEAN_PLATE } from '../types/game';

/**
 * Bekletme tabağı çizer — porselen tabak + gölge + yemek
 */
export function drawHoldingStation(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    station: HoldingStation | undefined
) {
    const firstItem = station?.items?.[0];
    const hasFood = !!(firstItem && firstItem !== CLEAN_PLATE);
    const hasCleanPlate = firstItem === CLEAN_PLATE;

    // ── Tabak Gölgesi ─────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(x + 2, y + 4, 24, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Tabak dış halka (porselen kenar) ──────────────────────────────────────
    const rimGrad = ctx.createRadialGradient(x, y, 12, x, y, 24);
    rimGrad.addColorStop(0, '#f1f5f9');
    rimGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Tabak iç yüzey ───────────────────────────────────────────────────────
    ctx.fillStyle = hasFood || hasCleanPlate ? '#fefefe' : '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 17, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── İç derinlik çizgisi ───────────────────────────────────────────────────
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 17, 10, 0, 0, Math.PI * 2);
    ctx.stroke();

    // ── Dış kenar halkası ─────────────────────────────────────────────────────
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, 24, 15, 0, 0, Math.PI * 2);
    ctx.stroke();

    // ── Porselen parlaması ────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 5, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── Yemek (varsa) ─────────────────────────────────────────────────────────
    if (hasFood) {
        // Küçük buhar animasyonu yok ama hafif gölge
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 3;
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(firstItem!, x, y - 4);
        ctx.shadowBlur = 0;
    } else if (hasCleanPlate) {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(x, y - 1, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 16, 9, 0, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // Boş tabak: küçük boş işareti
        ctx.fillStyle = '#d1d5db';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('boş', x, y);
    }
}
