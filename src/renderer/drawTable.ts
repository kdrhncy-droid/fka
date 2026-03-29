/**
 * Masa + 4 sandalye — SVG preview kalitesinde canvas çizimi
 * Top-down (yukarıdan bakış) açısıyla
 */
export function drawTable(ctx: CanvasRenderingContext2D, cx: number, cy: number, seats?: 1 | 2 | 3 | 4) {
    const s = seats ?? 4;
    
    // Masa ebatları
    let w = 84, h = 62;
    if (s === 1) { w = 44; h = 44; }
    else if (s === 2) { w = 44; h = 62; }
    else if (s === 3) { w = 64; h = 62; }

    // ── Sandalyeler ───────────────────────────────────────────────────────────
    if (s === 1) {
        drawChair(ctx, cx, cy + 25, 'down'); // yukarı bakacak (alt sandalye)
    } else if (s === 2) {
        drawChair(ctx, cx, cy - 56, 'up');
        drawChair(ctx, cx, cy + 40, 'down');
    } else if (s === 3) {
        drawChair(ctx, cx, cy - 56, 'up');
        drawChair(ctx, cx - 24, cy + 40, 'down');
        drawChair(ctx, cx + 24, cy + 40, 'down');
    } else {
        drawChair(ctx, cx - 28, cy - 56, 'up');
        drawChair(ctx, cx + 28, cy - 56, 'up');
        drawChair(ctx, cx - 28, cy + 40, 'down');
        drawChair(ctx, cx + 28, cy + 40, 'down');
    }

    // ── Masa Gölgesi ──────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2 + 2, cy - h / 2 + 4, w + 4, h + 2, 12);
    ctx.fill();

    // ── Ahşap masa gövdesi ────────────────────────────────────────────────────
    const frameGrad = ctx.createLinearGradient(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
    frameGrad.addColorStop(0, '#7c5230');
    frameGrad.addColorStop(0.4, '#5c3d1e');
    frameGrad.addColorStop(1, '#3a2008');
    ctx.fillStyle = frameGrad;
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = '#2a1505';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── Ahşap lif çizgileri ───────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    const lineCount = s === 1 ? 3 : 5;
    const lineSpacing = s === 1 ? 9 : 11;
    for (let i = 0; i < lineCount; i++) {
        const ly = cy - (h/2) + 8 + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2 + 6, ly);
        ctx.bezierCurveTo(cx - w / 4, ly + 2, cx + w / 4, ly - 2, cx + w / 2 - 6, ly);
        ctx.stroke();
    }
    ctx.restore();

    // ── Masa yüzey parlaması ──────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - w/4 + 4, cy - h/4 + 2, w/3, h/6, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dekorasyon (Sadece yeterince yer varsa veya ortada)
    const decorX = s <= 2 ? cx : cx - 10;
    
    // ── Vazo ─────────────────────────────────────────────────────────────────
    const vazoGrad = ctx.createLinearGradient(decorX - 4, cy - 6, decorX + 4, cy + 4);
    vazoGrad.addColorStop(0, '#5b9ec9');
    vazoGrad.addColorStop(1, '#2e6a8a');
    ctx.fillStyle = vazoGrad;
    ctx.beginPath();
    ctx.roundRect(decorX - 4, cy - 6, 8, 11, [2, 2, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = '#1e4f68';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // vazo parlama
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.beginPath();
    ctx.roundRect(decorX - 2, cy - 5, 3, 6, 2);
    ctx.fill();

    // ── Çiçekler (SVG'deki gibi renkli) ──────────────────────────────────────
    const flowers = [
        { dx: -5, dy: -14, r: 4, color: '#f472b6' },
        { dx:  3, dy: -16, r: 3.5, color: '#fb923c' },
        { dx:  9, dy: -13, r: 3, color: '#facc15' },
    ];
    flowers.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(decorX + f.dx, cy + f.dy, f.r, 0, Math.PI * 2);
        ctx.fill();
    });
    // yaprak
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(decorX + 1, cy - 10, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ── Mum (1 ve 2 kişilikte mum koymaya yer var mı? Var ama dar) ───────────
    if (s >= 3) {
        ctx.fillStyle = '#fef3c7';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.roundRect(cx + 8, cy - 4, 6, 10, 1);
        ctx.fill();
        ctx.stroke();
        // alev
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.ellipse(cx + 11, cy - 6, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.ellipse(cx + 11, cy - 7, 1, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
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
