import { Player, CHARACTER_TYPES, CLEAN_PLATE, DIRTY_PLATE, isTray, getTrayItems, isChopped, getChoppedSource } from '../types/game';
import { stk, adjustColor, drawShadowEllipse } from './rendererUtils';

const playerRenderState = new Map<string, {
    lastX: number; lastY: number;
    faceRight: boolean;
    walkTimer: number;
    isMoving: boolean;
}>();

export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    p: Player,
    isMe: boolean,
) {
    const rawHolding = p.holding;
    const isHolding = !!rawHolding;
    const stripChopped = (item: string) => isChopped(item) ? getChoppedSource(item) : item;
    const heldItem = rawHolding === CLEAN_PLATE ? '🍽️' : rawHolding === DIRTY_PLATE ? '🧽' : rawHolding ? stripChopped(rawHolding) : rawHolding;
    
    const typeId   = Math.min(p.charType ?? 0, CHARACTER_TYPES.length - 1);
    const charDef  = CHARACTER_TYPES[typeId];
    const bodyColor   = p.color || charDef.bodyColor;
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
        st.walkTimer += 0.35; // Biraz daha hızlı yürüme animasyonu
    } else {
        st.walkTimer = st.walkTimer % (Math.PI * 2);
        if (st.walkTimer > 0) { st.walkTimer += 0.35; if (st.walkTimer >= Math.PI * 2) st.walkTimer = 0; }
    }
    st.lastX = x; st.lastY = y;

    const bobY   = (st.isMoving || st.walkTimer > 0) ? Math.abs(Math.sin(st.walkTimer)) * 6 : 0;
    const swing  = st.isMoving ? Math.sin(st.walkTimer) * 8 : 0;
    const dirMul = st.faceRight ? 1 : -1;

    ctx.save();
    ctx.translate(x, y);

    // ── Aura (sadece ben) ────────────────────────────────────────────────────
    if (isMe) {
        const aura = ctx.createRadialGradient(0, 18, 2, 0, 18, 35);
        aura.addColorStop(0, 'rgba(255,255,255,0.4)');
        aura.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.ellipse(0, 18, 35, 15, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ── Zemin gölgesi ────────────────────────────────────────────────────────
    const shSc = 1 - bobY / 40;
    drawShadowEllipse(ctx, 0, 28, 20 * shSc, 8 * shSc);

    // ── Chibi Karakter Çizimi ───────────────────────────────────────────────
    ctx.translate(0, -bobY);
    ctx.scale(dirMul, 1);

    // ── AYAKLAR (Küçük yuvarlaklar) ──────────────────────────────────────────
    const footY = 22;
    const footX = 8;
    
    // Sol Ayak
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-footX + (st.isMoving ? -swing : 0), footY, 6, 0, Math.PI * 2); ctx.fill();
    stk(ctx, '#000', 1.5);

    // Sağ Ayak
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(footX + (st.isMoving ? swing : 0), footY, 6, 0, Math.PI * 2); ctx.fill();
    stk(ctx, '#000', 1.5);

    // ── GÖVDE (Küçük ve tombul) ──────────────────────────────────────────────
    const bodyW = 28;
    const bodyH = 22;
    const bodyY = 2;

    ctx.beginPath(); ctx.roundRect(-bodyW/2, bodyY, bodyW, bodyH, 12);
    const bodyG = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
    bodyG.addColorStop(0, adjustColor(bodyColor, 20));
    bodyG.addColorStop(1, bodyColor);
    ctx.fillStyle = bodyG; ctx.fill(); stk(ctx, '#000', 2);

    // Kıyafet detayı (Yaka/Önlük)
    ctx.fillStyle = accentColor;
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.roundRect(-bodyW/2 + 4, bodyY + 2, bodyW - 8, 6, 4); ctx.fill();
    ctx.globalAlpha = 1;

    // ── ELLER (Küçük yuvarlaklar) ────────────────────────────────────────────
    const handY = 12;
    const handX = 16;
    const skinTone = '#f5c090';

    if (isHolding) {
        // Eşya tutarken eller önde
        ctx.fillStyle = skinTone;
        ctx.beginPath(); ctx.arc(8, handY, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(22, handY, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    } else {
        // Boşta eller yanlarda
        const armSwing = st.isMoving ? Math.sin(st.walkTimer) * 5 : 0;
        ctx.fillStyle = skinTone;
        ctx.beginPath(); ctx.arc(-handX, handY + armSwing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(handX, handY - armSwing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    }

    // ── KAFA (Büyük ve yuvarlak) ─────────────────────────────────────────────
    const headR = 22;
    const headY = -18;

    ctx.beginPath(); ctx.arc(0, headY, headR, 0, Math.PI * 2);
    const headG = ctx.createRadialGradient(-5, headY - 5, 2, 0, headY, headR);
    headG.addColorStop(0, '#fff1e0'); headG.addColorStop(1, '#f5c090');
    ctx.fillStyle = headG; ctx.fill(); stk(ctx, '#000', 2);

    // Yanaklar (Pembe)
    ctx.fillStyle = 'rgba(255,182,193,0.5)';
    ctx.beginPath(); ctx.arc(-12, headY + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, headY + 6, 5, 0, Math.PI * 2); ctx.fill();

    // Gözler (Büyük chibi gözleri)
    ctx.fillStyle = '#222';
    // Sol Göz
    ctx.beginPath(); ctx.ellipse(-8, headY + 2, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Sağ Göz
    ctx.beginPath(); ctx.ellipse(8, headY + 2, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
    
    // Göz parıltısı
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-7, headY, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, headY, 1.5, 0, Math.PI * 2); ctx.fill();

    // Ağız (Küçük bir gülümseme)
    ctx.strokeStyle = '#844'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, headY + 8, 4, 0.2, Math.PI - 0.2); ctx.stroke();

    // ── ŞAPKA ────────────────────────────────────────────────────────────────
    ctx.font = '22px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(charDef.hat as string, 0, headY - headR - 5);

    // ── TUTULAN EŞYA ─────────────────────────────────────────────────────────
    if (isHolding) {
        const itemX = 15;
        const itemY = 12;
        ctx.save();
        ctx.translate(itemX, itemY);
        
        if (isTray(rawHolding)) {
            ctx.fillStyle = '#eee';
            ctx.beginPath(); ctx.roundRect(-15, -4, 30, 10, 3); ctx.fill();
            stk(ctx, '#999', 1);
            const items = getTrayItems(rawHolding);
            ctx.font = '12px Arial';
            items.forEach((item, idx) => {
                ctx.fillText(stripChopped(item), (idx - (items.length-1)/2) * 10, -6);
            });
        } else {
            ctx.font = '18px Arial';
            ctx.fillText(heldItem as string, 0, 0);
        }
        ctx.restore();
    }

    // ── İSİM ETİKETİ ─────────────────────────────────────────────────────────
    ctx.scale(dirMul, 1);
    const label = isMe ? `★ ${p.name}` : p.name;
    ctx.font = 'bold 11px Arial';
    const lw = ctx.measureText(label).width + 16;
    ctx.fillStyle = isMe ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath(); ctx.roundRect(-lw / 2, headY - headR - 35, lw, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, headY - headR - 26);

    ctx.restore();
}
