/**
 * Masa + 4 sandalye — PlateUp tarzı koyu estetik
 * Top-down (yukarıdan bakış) açısıyla
 */
export function drawTable(ctx: CanvasRenderingContext2D, cx: number, cy: number) {

    // ── 4 Sandalye ────────────────────────────────────────────────────────────
    drawChair(ctx, cx - 28, cy - 56, 'up');
    drawChair(ctx, cx + 28, cy - 56, 'up');
    drawChair(ctx, cx - 28, cy + 40, 'down');
    drawChair(ctx, cx + 28, cy + 40, 'down');

    // ── Masa Gölgesi ──────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.roundRect(cx - 44 + 3, cy - 28 + 5, 88, 64, 12);
    ctx.fill();

    // ── Ahşap masa gövdesi — koyu meşe tonu ──────────────────────────────────
    const frameGrad = ctx.createLinearGradient(cx - 42, cy - 32, cx + 42, cy + 30);
    frameGrad.addColorStop(0, '#5c3d1e');
    frameGrad.addColorStop(0.5, '#4a2e10');
    frameGrad.addColorStop(1, '#3a2008');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 42, cy - 32, 84, 62, 10);
    ctx.fill();
    ctx.strokeStyle = '#2a1505';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Ahşap desen: yatay lifler ─────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
        const ly = cy - 22 + i * 13;
        ctx.beginPath();
        ctx.moveTo(cx - 36, ly);
        ctx.bezierCurveTo(cx - 15, ly + 2, cx + 15, ly - 2, cx + 36, ly);
        ctx.stroke();
    }
    ctx.restore();

    // ── Masa üstü yüzey parlaması ─────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.13;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy - 12, 30, 11, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Masa üstü dekor: küçük çiçek vazosu ──────────────────────────────────
    // Vazo
    ctx.beginPath();
    ctx.roundRect(cx - 4, cy - 14, 8, 10, [2, 2, 4, 4]);
    const vazoGrad = ctx.createLinearGradient(cx - 4, cy - 14, cx + 4, cy - 4);
    vazoGrad.addColorStop(0, '#6a9fc0');
    vazoGrad.addColorStop(1, '#3d6e8a');
    ctx.fillStyle = vazoGrad;
    ctx.fill();
    ctx.strokeStyle = '#2a4f68';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Vazo parlama
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(cx - 2, cy - 13, 3, 5, 2);
    ctx.fill();
    // Çiçek
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌿', cx, cy - 19);
}

/**
 * Tek bir sandalye — PlateUp tarzı koyu taupe/gri
 */
function drawChair(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: 'up' | 'down',
) {
    const w = 24, h = 20;

    // ── Gölge ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 3, cy + 4, w, h, 5);
    ctx.fill();

    // ── Oturma yüzeyi ─────────────────────────────────────────────────────────
    const cushionGrad = ctx.createLinearGradient(cx, cy, cx, cy + h);
    cushionGrad.addColorStop(0, '#7c6f8a');
    cushionGrad.addColorStop(1, '#564b66');
    ctx.fillStyle = cushionGrad;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy, w, h, 6);
    ctx.fill();

    // ── Yastık parlama ────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 3, cy + 2, w - 6, 6, 3);
    ctx.fill();

    // ── Kenar çizgisi ─────────────────────────────────────────────────────────
    ctx.strokeStyle = '#3a3045';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy, w, h, 6);
    ctx.stroke();

    // ── Arkalık ───────────────────────────────────────────────────────────────
    const backH = 9;
    if (dir === 'up') {
        const grad2 = ctx.createLinearGradient(cx, cy - backH - 4, cx, cy - 4);
        grad2.addColorStop(0, '#3a2e4a');
        grad2.addColorStop(1, '#564b66');
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy - backH - 4, w - 4, backH, [5, 5, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = '#2a2035';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy - backH - 4, w - 4, backH, [5, 5, 0, 0]);
        ctx.stroke();
        // Dekoratif çubuklar
        ctx.strokeStyle = '#2a2035';
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const lx = cx - 4 + i * 8;
            ctx.beginPath();
            ctx.moveTo(lx, cy - backH - 2);
            ctx.lineTo(lx, cy - 5);
            ctx.stroke();
        }
    } else {
        const grad2 = ctx.createLinearGradient(cx, cy + h + 4, cx, cy + h + backH + 4);
        grad2.addColorStop(0, '#564b66');
        grad2.addColorStop(1, '#3a2e4a');
        ctx.fillStyle = grad2;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy + h + 4, w - 4, backH, [0, 0, 5, 5]);
        ctx.fill();
        ctx.strokeStyle = '#2a2035';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy + h + 4, w - 4, backH, [0, 0, 5, 5]);
        ctx.stroke();
        ctx.strokeStyle = '#2a2035';
        ctx.lineWidth = 1;
        for (let i = 0; i < 2; i++) {
            const lx = cx - 4 + i * 8;
            ctx.beginPath();
            ctx.moveTo(lx, cy + h + 5);
            ctx.lineTo(lx, cy + h + backH + 2);
            ctx.stroke();
        }
    }
}
