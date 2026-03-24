/**
 * Masa + 4 sandalye — SVG preview kalitesinde canvas çizimi
 * Top-down (yukarıdan bakış) açısıyla
 */
export function drawTable(ctx: CanvasRenderingContext2D, cx: number, cy: number) {

    // ── 4 Sandalye ────────────────────────────────────────────────────────────
    drawChair(ctx, cx - 28, cy - 56, 'up');
    drawChair(ctx, cx + 28, cy - 56, 'up');
    drawChair(ctx, cx - 28, cy + 40, 'down');
    drawChair(ctx, cx + 28, cy + 40, 'down');

    // ── Masa Gölgesi ──────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.roundRect(cx - 44 + 4, cy - 28 + 6, 88, 64, 12);
    ctx.fill();

    // ── Ahşap masa gövdesi ────────────────────────────────────────────────────
    const frameGrad = ctx.createLinearGradient(cx - 42, cy - 32, cx + 42, cy + 30);
    frameGrad.addColorStop(0, '#7c5230');
    frameGrad.addColorStop(0.4, '#5c3d1e');
    frameGrad.addColorStop(1, '#3a2008');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 42, cy - 32, 84, 62, 10);
    ctx.fill();
    ctx.strokeStyle = '#2a1505';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Ahşap lif çizgileri ───────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const ly = cy - 24 + i * 11;
        ctx.beginPath();
        ctx.moveTo(cx - 36, ly);
        ctx.bezierCurveTo(cx - 15, ly + 2, cx + 15, ly - 2, cx + 36, ly);
        ctx.stroke();
    }
    ctx.restore();

    // ── Masa yüzey parlaması ──────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 14, 28, 10, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Vazo ─────────────────────────────────────────────────────────────────
    const vazoGrad = ctx.createLinearGradient(cx - 4, cy - 14, cx + 4, cy - 4);
    vazoGrad.addColorStop(0, '#5b9ec9');
    vazoGrad.addColorStop(1, '#2e6a8a');
    ctx.fillStyle = vazoGrad;
    ctx.beginPath();
    ctx.roundRect(cx - 4, cy - 14, 8, 11, [2, 2, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = '#1e4f68';
    ctx.lineWidth = 1;
    ctx.stroke();
    // vazo parlama
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath();
    ctx.roundRect(cx - 2, cy - 13, 3, 6, 2);
    ctx.fill();

    // ── Çiçekler (SVG'deki gibi renkli) ──────────────────────────────────────
    const flowers = [
        { dx: -5, dy: -22, r: 4, color: '#f472b6' },
        { dx:  3, dy: -24, r: 3.5, color: '#fb923c' },
        { dx:  9, dy: -21, r: 3, color: '#facc15' },
    ];
    flowers.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(cx + f.dx, cy + f.dy, f.r, 0, Math.PI * 2);
        ctx.fill();
    });
    // yaprak
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(cx + 1, cy - 18, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Mum ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(cx + 14, cy - 12, 6, 10, 1);
    ctx.fill();
    ctx.stroke();
    // alev
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(cx + 17, cy - 14, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(cx + 17, cy - 15, 1, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Tek bir sandalye — SVG preview kalitesinde
 */
function drawChair(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: 'up' | 'down',
) {
    const w = 26, h = 20;
    const backH = 10;

    // ── Gölge ─────────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 3, cy + 5, w, h, 5);
    ctx.fill();

    if (dir === 'up') {
        // arkalık önce (arkada kalır)
        const backGrad = ctx.createLinearGradient(cx, cy - backH - 4, cx, cy - 4);
        backGrad.addColorStop(0, '#3a2e4a');
        backGrad.addColorStop(1, '#564b66');
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy - backH - 4, w - 4, backH, [5, 5, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = '#2a2035';
        ctx.lineWidth = 1;
        ctx.stroke();
        // arkalık çubuklar
        for (let i = 0; i < 3; i++) {
            const lx = cx - 5 + i * 5;
            ctx.strokeStyle = '#2a2035';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lx, cy - backH - 2);
            ctx.lineTo(lx, cy - 5);
            ctx.stroke();
        }
    }

    // ── Oturma yüzeyi ─────────────────────────────────────────────────────────
    const cushionGrad = ctx.createLinearGradient(cx, cy, cx, cy + h);
    cushionGrad.addColorStop(0, '#9d8baf');
    cushionGrad.addColorStop(1, '#564b66');
    ctx.fillStyle = cushionGrad;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = '#3a3045';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // yastık parlama
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 3, cy + 2, w - 6, 7, 3);
    ctx.fill();

    // düğme
    ctx.fillStyle = '#3a2e4a';
    ctx.strokeStyle = '#2a2035';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy + h - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (dir === 'down') {
        // arkalık sonra (önde kalır)
        const backGrad2 = ctx.createLinearGradient(cx, cy + h + 4, cx, cy + h + backH + 4);
        backGrad2.addColorStop(0, '#564b66');
        backGrad2.addColorStop(1, '#3a2e4a');
        ctx.fillStyle = backGrad2;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy + h + 4, w - 4, backH, [0, 0, 5, 5]);
        ctx.fill();
        ctx.strokeStyle = '#2a2035';
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
            const lx = cx - 5 + i * 5;
            ctx.strokeStyle = '#2a2035';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(lx, cy + h + 5);
            ctx.lineTo(lx, cy + h + backH + 2);
            ctx.stroke();
        }
    }
}
