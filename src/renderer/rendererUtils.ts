/** Ortak renderer yardımcıları — drawPlayer ve drawCustomer tarafından kullanılır */

export function stk(ctx: CanvasRenderingContext2D, color = '#1a0a0a', w = 3) {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}

export function adjustColor(hex: string, amt: number): string {
    try {
        const c = hex.replace('#', '');
        const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
        const n = parseInt(full, 16);
        const r = Math.min(255, Math.max(0, (n >> 16) + amt));
        const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amt));
        const b = Math.min(255, Math.max(0, (n & 0xff) + amt));
        return `rgb(${r},${g},${b})`;
    } catch { return hex; }
}

export const lighten = (h: string, a: number) => adjustColor(h, a);
export const darken  = (h: string, a: number) => adjustColor(h, -a);

export function drawShadowEllipse(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    rx: number, ry: number,
    alpha = 0.22,
) {
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
}

/** Gradient + fill + stroke ile istasyon gövdesi */
export function drawStationBody(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    colorTop: string, colorBot: string,
    borderColor: string,
    radius = 6,
    borderWidth = 2,
) {
    const g = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
    g.addColorStop(0, colorTop);
    g.addColorStop(1, colorBot);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, radius); ctx.fill();
    stk(ctx, borderColor, borderWidth);
}

/** Progress bar — arka plan + dolgu */
export function drawProgressBar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    width: number, height = 5,
    progress: number,
    color: string,
    bgColor = 'rgba(0,0,0,0.5)',
    radius = 2,
) {
    ctx.fillStyle = bgColor;
    ctx.beginPath(); ctx.roundRect(cx - width / 2, cy, width, height, radius); ctx.fill();
    if (progress > 0) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(cx - width / 2, cy, width * progress, height, radius); ctx.fill();
    }
}

/** Üst parlama şeridi */
export function drawShine(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    alpha = 0.12,
    radius = 4,
) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}

/** Ortalanmış etiket */
export function drawLabel(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    color = '#f0ddb8',
    fontSize = 9,
    bold = true,
) {
    ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
}

/** Emoji çiz (ortalanmış) */
export function drawEmoji(
    ctx: CanvasRenderingContext2D,
    emoji: string,
    x: number, y: number,
    size = 18,
    alpha = 1,
) {
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
    ctx.globalAlpha = 1;
}
