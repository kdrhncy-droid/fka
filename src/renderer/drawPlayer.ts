import { Player, CHARACTER_TYPES, CLEAN_PLATE, DIRTY_PLATE, isTray, getTrayItems } from '../types/game';

const playerRenderState = new Map<string, {
    lastX: number; lastY: number;
    faceRight: boolean;
    walkTimer: number;
    isMoving: boolean;
}>();

function stroke(ctx: CanvasRenderingContext2D, color = '#1a0f0f', w = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
}

function adjustColor(hex: string, amt: number): string {
    try {
        const c = hex.replace('#', '');
        const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
        const num = parseInt(full, 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amt));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amt));
        const b = Math.min(255, Math.max(0, (num & 0xff) + amt));
        return `rgb(${r},${g},${b})`;
    } catch { return hex; }
}

export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    p: Player,
    isMe: boolean,
) {
    const heldItem = p.holding === CLEAN_PLATE ? '🍽️' : p.holding === DIRTY_PLATE ? '🧽' : p.holding;
    const typeId   = Math.min(p.charType ?? 0, CHARACTER_TYPES.length - 1);
    const charDef  = CHARACTER_TYPES[typeId];
    const bodyColor  = p.color || charDef.bodyColor;
    const accentColor = charDef.accent;

    // ── Animasyon state ──────────────────────────────────────────────────────
    if (!playerRenderState.has(p.id)) {
        playerRenderState.set(p.id, { lastX: x, lastY: y, faceRight: true, walkTimer: 0, isMoving: false });
    }
    const st = playerRenderState.get(p.id)!;
    const dx = x - st.lastX, dy = y - st.lastY;
    st.isMoving = dx * dx + dy * dy > 0.5;
    if (Math.abs(dx) > 0.5) st.faceRight = dx > 0;
    if (st.isMoving) {
        st.walkTimer += 0.28;
    } else {
        st.walkTimer = st.walkTimer % (Math.PI * 2);
        if (st.walkTimer > 0) { st.walkTimer += 0.28; if (st.walkTimer >= Math.PI * 2) st.walkTimer = 0; }
    }
    st.lastX = x; st.lastY = y;

    const bobY   = (st.isMoving || st.walkTimer > 0) ? Math.abs(Math.sin(st.walkTimer)) * 5 : 0;
    const tilt   = st.isMoving ? Math.sin(st.walkTimer) * 0.11 : 0;
    const swing  = st.isMoving ? Math.sin(st.walkTimer) * 6 : 0;
    const dirMul = st.faceRight ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);

    // ── Aura (sadece benim karakterim) ──────────────────────────────────────
    if (isMe) {
        const aura = ctx.createRadialGradient(0, 16, 2, 0, 16, 34);
        aura.addColorStop(0, 'rgba(120,190,255,0.50)');
        aura.addColorStop(1, 'rgba(120,190,255,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.ellipse(0, 16, 34, 15, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Zemin gölgesi ────────────────────────────────────────────────────────
    const shSc = 1 - bobY / 32;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 22, 22 * shSc, 8 * shSc, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bobY);
    ctx.rotate(tilt);
    ctx.scale(dirMul, 1);

    // ── BACAKLAR ─────────────────────────────────────────────────────────────
    // Sol
    ctx.beginPath(); ctx.roundRect(-12 + swing, 18, 10, 17, 5);
    ctx.fillStyle = '#232323'; ctx.fill(); stroke(ctx);
    // Sol ayakkabı
    ctx.beginPath(); ctx.ellipse(-7 + swing, 36, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; ctx.fill(); stroke(ctx, '#000', 2);

    // Sağ
    ctx.beginPath(); ctx.roundRect(2 - swing, 18, 10, 17, 5);
    ctx.fillStyle = '#2d2d2d'; ctx.fill(); stroke(ctx);
    // Sağ ayakkabı
    ctx.beginPath(); ctx.ellipse(7 - swing, 36, 8, 4.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; ctx.fill(); stroke(ctx, '#000', 2);

    // ── GÖVDE ────────────────────────────────────────────────────────────────
    ctx.beginPath(); ctx.roundRect(-18, -5, 36, 25, 11);
    const bodyG = ctx.createLinearGradient(-18, -5, 18, 20);
    bodyG.addColorStop(0, adjustColor(bodyColor, 35));
    bodyG.addColorStop(1, bodyColor);
    ctx.fillStyle = bodyG; ctx.fill(); stroke(ctx);

    // Aksesuar şerit (yaka)
    ctx.beginPath(); ctx.roundRect(-15, -5, 30, 8, [11, 11, 0, 0]);
    ctx.fillStyle = accentColor; ctx.globalAlpha = 0.9; ctx.fill(); ctx.globalAlpha = 1;

    // Gövde parlaması
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.beginPath(); ctx.roundRect(-12, -3, 24, 8, 5); ctx.fill();

    // ── KOLLAR ───────────────────────────────────────────────────────────────
    const armSwing = st.isMoving ? Math.sin(st.walkTimer + Math.PI) * 5 : 0;
    // Arka kol (sol)
    ctx.beginPath(); ctx.roundRect(-26, -2 - armSwing, 9, 17, 5);
    ctx.fillStyle = adjustColor(bodyColor, -20); ctx.fill(); stroke(ctx);
    // Ön kol (sağ)
    ctx.beginPath(); ctx.roundRect(17, -2 + armSwing, 9, 17, 5);
    ctx.fillStyle = bodyColor; ctx.fill(); stroke(ctx);

    // ── BAŞ ──────────────────────────────────────────────────────────────────
    // Boyun
    ctx.beginPath(); ctx.roundRect(-6, -12, 12, 9, 3);
    ctx.fillStyle = '#f5c89a'; ctx.fill();

    // Kafa (büyük ve sevimli — PlateUp tarzı)
    ctx.beginPath(); ctx.arc(0, -24, 20, 0, Math.PI * 2);
    const headG = ctx.createRadialGradient(-5, -28, 3, 0, -24, 20);
    headG.addColorStop(0, '#fde8cc');
    headG.addColorStop(1, '#f5c090');
    ctx.fillStyle = headG; ctx.fill(); stroke(ctx);

    // Yanaklar
    ctx.fillStyle = 'rgba(255,140,100,0.30)';
    ctx.beginPath(); ctx.ellipse(-11, -20, 7, 5, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(11, -20, 7, 5, 0.15, 0, Math.PI * 2); ctx.fill();

    // Gözler (sevimli oval)
    ctx.fillStyle = '#1a0f0f';
    ctx.beginPath(); ctx.ellipse(-8, -26, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, -26, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Göz parıltısı
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(-7, -28, 1.8, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9, -28, 1.8, 2, 0, 0, Math.PI * 2); ctx.fill();

    // Gülümseme
    ctx.strokeStyle = '#7a3522';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (st.isMoving) {
        // Koşarken daha büyük gülüş
        ctx.arc(0, -19, 7, 0.15, Math.PI - 0.15);
    } else {
        ctx.arc(0, -20, 6, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // ── ŞAPKA ────────────────────────────────────────────────────────────────
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(charDef.hat as string, 0, -44);

    // ── TUTULAN EŞYA ─────────────────────────────────────────────────────────
    if (heldItem) {
        const ix = 28, iy = -10;
        // Kabarcık
        ctx.fillStyle = 'rgba(255,255,255,0.93)';
        ctx.beginPath(); ctx.arc(ix, iy, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = accentColor; ctx.lineWidth = 2.5; ctx.stroke();

        if (isTray(heldItem)) {
            const items = getTrayItems(heldItem);
            ctx.font = '9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(items.length === 0 ? '🪣' : items[0], ix, iy - 3);
            if (items.length > 1) { ctx.font = '8px Arial'; ctx.fillStyle = '#555'; ctx.fillText(`+${items.length - 1}`, ix, iy + 6); }
        } else {
            ctx.font = '15px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(heldItem, ix, iy);
        }
    }

    // ── İSİM ETİKETİ (yön bağımsız çevir) ─────────────────────────────────
    ctx.scale(dirMul, 1);
    const label = isMe ? `★ ${p.name}` : p.name;
    ctx.font = 'bold 10px Arial';
    const lw = ctx.measureText(label).width + 14;
    ctx.fillStyle = isMe ? 'rgba(20,50,110,0.85)' : 'rgba(20,20,20,0.75)';
    ctx.beginPath(); ctx.roundRect(-lw / 2, -58, lw, 16, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, -50);

    ctx.restore();
}
