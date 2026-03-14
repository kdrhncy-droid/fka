import { Player, CHARACTER_TYPES, CLEAN_PLATE, DIRTY_PLATE, isTray, getTrayItems } from '../types/game';

const playerRenderState = new Map<string, {
    lastX: number; lastY: number;
    faceRight: boolean;
    walkTimer: number;
    isMoving: boolean;
}>();

function stk(ctx: CanvasRenderingContext2D, color = '#1a0f0f', w = 3) {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}

function adjustColor(hex: string, amt: number): string {
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

export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    p: Player,
    isMe: boolean,
) {
    const rawHolding = p.holding;
    const isHolding = !!rawHolding;
    const heldItem = rawHolding === CLEAN_PLATE ? '🍽️' : rawHolding === DIRTY_PLATE ? '🧽' : rawHolding;
    
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

    // ── Aura (sadece ben) ────────────────────────────────────────────────────
    if (isMe) {
        const aura = ctx.createRadialGradient(0, 18, 2, 0, 18, 32);
        aura.addColorStop(0, 'rgba(120,190,255,0.50)');
        aura.addColorStop(1, 'rgba(120,190,255,0)');
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.ellipse(0, 18, 32, 13, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ── Zemin gölgesi — ayakların tam altında, bobY'den bağımsız ─────────────
    const shSc = 1 - bobY / 30;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 30, 18 * shSc, 6 * shSc, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Karakter zıplama + eğilme başlıyor ──────────────────────────────────
    ctx.translate(0, -bobY);
    ctx.rotate(tilt);
    ctx.scale(dirMul, 1);

    // ── BACAKLAR ─────────────────────────────────────────────────────────────
    // Sol bacak
    ctx.beginPath(); ctx.roundRect(-10 + swing, 14, 9, 16, 4);
    ctx.fillStyle = '#1e1e1e'; ctx.fill(); stk(ctx, '#111', 2.5);
    // Sol ayakkabı
    ctx.beginPath(); ctx.ellipse(-5 + swing, 31, 8, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0f0f'; ctx.fill(); stk(ctx, '#000', 2);

    // Sağ bacak
    ctx.beginPath(); ctx.roundRect(1 - swing, 14, 9, 16, 4);
    ctx.fillStyle = '#282828'; ctx.fill(); stk(ctx, '#111', 2.5);
    // Sağ ayakkabı
    ctx.beginPath(); ctx.ellipse(6 - swing, 31, 8, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0f0f0f'; ctx.fill(); stk(ctx, '#000', 2);

    // ── GÖVDE ────────────────────────────────────────────────────────────────
    ctx.beginPath(); ctx.roundRect(-16, -4, 32, 20, 10);
    const bodyG = ctx.createLinearGradient(-16, -4, 16, 16);
    bodyG.addColorStop(0, adjustColor(bodyColor, 30));
    bodyG.addColorStop(1, bodyColor);
    ctx.fillStyle = bodyG; ctx.fill(); stk(ctx);

    // Yaka aksesuar şeridi
    ctx.beginPath(); ctx.roundRect(-13, -4, 26, 7, [10, 10, 0, 0]);
    ctx.fillStyle = accentColor; ctx.globalAlpha = 0.88; ctx.fill(); ctx.globalAlpha = 1;

    // Gövde parlaması
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.roundRect(-10, -2, 20, 7, 4); ctx.fill();

    // ── KOLLAR + ELLER (PlateUp Tarzı) ────────────────────────────────────────
    const skinTone = '#f5c090';
    const armSwing = st.isMoving ? Math.sin(st.walkTimer + Math.PI) * 5 : 0;

    if (isHolding) {
        // Eşya tutarken kollar öne doğru uzanır
        // Arka kol (sol)
        ctx.beginPath(); ctx.roundRect(-14, 2, 16, 8, 4);
        ctx.fillStyle = adjustColor(bodyColor, -15); ctx.fill(); stk(ctx);
        // Sol el
        ctx.beginPath(); ctx.arc(2, 6, 5, 0, Math.PI * 2);
        ctx.fillStyle = skinTone; ctx.fill(); stk(ctx, '#c8845a', 2);

        // Ön kol (sağ)
        ctx.beginPath(); ctx.roundRect(4, 2, 16, 8, 4);
        ctx.fillStyle = bodyColor; ctx.fill(); stk(ctx);
        // Sağ el
        ctx.beginPath(); ctx.arc(20, 6, 5, 0, Math.PI * 2);
        ctx.fillStyle = skinTone; ctx.fill(); stk(ctx, '#c8845a', 2);
    } else {
        // Boşta kollar yanlarda sallanır
        // Arka kol (sol)
        ctx.beginPath(); ctx.roundRect(-23, -1 - armSwing, 8, 14, 4);
        ctx.fillStyle = adjustColor(bodyColor, -15); ctx.fill(); stk(ctx);
        // Sol el
        ctx.beginPath(); ctx.arc(-19, 14 - armSwing, 5, 0, Math.PI * 2);
        ctx.fillStyle = skinTone; ctx.fill(); stk(ctx, '#c8845a', 2);

        // Ön kol (sağ)
        ctx.beginPath(); ctx.roundRect(15, -1 + armSwing, 8, 14, 4);
        ctx.fillStyle = bodyColor; ctx.fill(); stk(ctx);
        // Sağ el
        ctx.beginPath(); ctx.arc(19, 14 + armSwing, 5, 0, Math.PI * 2);
        ctx.fillStyle = skinTone; ctx.fill(); stk(ctx, '#c8845a', 2);
    }

    // ── BAŞ ──────────────────────────────────────────────────────────────────
    const HR = 13;
    const headY = -4 - HR - 3;

    // Boyun
    ctx.beginPath(); ctx.roundRect(-5, -7, 10, 6, 3);
    ctx.fillStyle = '#f5c090'; ctx.fill();

    // Kafa
    ctx.beginPath(); ctx.arc(0, headY, HR, 0, Math.PI * 2);
    const headG = ctx.createRadialGradient(-3, headY - 3, 1, 0, headY, HR);
    headG.addColorStop(0, '#fde8cc'); headG.addColorStop(1, '#f0b880');
    ctx.fillStyle = headG; ctx.fill(); stk(ctx);

    // Yanaklar
    ctx.fillStyle = 'rgba(255,130,100,0.28)';
    ctx.beginPath(); ctx.ellipse(-HR * 0.55, headY + 2, HR * 0.35, HR * 0.26, -0.15, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(HR * 0.55, headY + 2, HR * 0.35, HR * 0.26, 0.15, 0, Math.PI * 2); ctx.fill();

    // Gözler
    ctx.fillStyle = '#1a0a0a';
    ctx.beginPath(); ctx.ellipse(-HR * 0.38, headY - 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(HR * 0.38, headY - 1, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    // Göz parıltısı
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    ctx.beginPath(); ctx.ellipse(-HR * 0.30, headY - 3, 1.4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(HR * 0.46, headY - 3, 1.4, 1.8, 0, 0, Math.PI * 2); ctx.fill();

    // Gülümseme
    ctx.strokeStyle = '#7a3020'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, headY + 4, 5, 0.2, Math.PI - 0.2); ctx.stroke();

    // ── ŞAPKA ────────────────────────────────────────────────────────────────
    ctx.font = '15px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(charDef.hat as string, 0, headY - HR - 8);

    // ── TUTULAN EŞYA (PlateUp Tarzı - Önde) ───────────────────────────────────
    if (isHolding) {
        const itemX = 12;
        const itemY = 6;
        const itemBob = Math.sin(st.walkTimer) * 2; // Yürürken eşya da zıplasın

        ctx.save();
        ctx.translate(itemX, itemY + itemBob);

        if (isTray(rawHolding)) {
            // Tepsi görseli
            ctx.fillStyle = '#cbd5e1'; // Açık gri tepsi
            ctx.beginPath(); ctx.roundRect(-18, -2, 36, 12, 4); ctx.fill();
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();

            const items = getTrayItems(rawHolding);
            if (items.length > 0) {
                ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                // Eşyaları tepsi üzerinde yanyana diz
                items.forEach((item, idx) => {
                    const offset = (idx - (items.length - 1) / 2) * 12;
                    ctx.fillText(item, offset, -4);
                });
            } else {
                ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🪣', 0, -4);
            }
        } else if (heldItem === '🍽️' || heldItem === '🧽') {
            // Tabak görseli
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.5; ctx.stroke();
            
            ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(heldItem, 0, -2);
        } else {
            // Normal eşya balonu (biraz daha şık)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.stroke();
            
            ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(heldItem as string, 0, 0);
        }
        ctx.restore();
    }

    // ── İSİM ETİKETİ ─────────────────────────────────────────────────────────
    ctx.scale(dirMul, 1);
    const label = isMe ? `★ ${p.name}` : p.name;
    ctx.font = 'bold 10px Arial';
    const lw = ctx.measureText(label).width + 14;
    ctx.fillStyle = isMe ? 'rgba(20,50,110,0.85)' : 'rgba(20,20,20,0.75)';
    ctx.beginPath(); ctx.roundRect(-lw / 2, headY - HR - 26, lw, 16, 8); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, headY - HR - 18);

    ctx.restore();
}
