import { Player, CHARACTER_TYPES, CLEAN_PLATE, DIRTY_PLATE, isTray, getTrayItems, isChopped, getChoppedSource, SPICY_DISPLAY } from '../types/game';
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
    const getDisplayItem = (item: string) => {
        if (item === CLEAN_PLATE) return '🍽️';
        if (item === DIRTY_PLATE) return '🧽';
        if (SPICY_DISPLAY[item]) return SPICY_DISPLAY[item];
        return stripChopped(item);
    };
    const heldItem = rawHolding ? getDisplayItem(rawHolding) : rawHolding;
    
    const typeId   = Math.min(p.charType ?? 0, CHARACTER_TYPES.length - 1);
    const charDef  = CHARACTER_TYPES[typeId];
    const bodyColor   = p.clothingColor || p.color || charDef.bodyColor;
    const hairColor   = p.hairColor || '#4b2c20';
    const faceShape   = p.faceShape ?? 0;

    // ── Animasyon state ──────────────────────────────────────────────────────
    if (!playerRenderState.has(p.id)) {
        playerRenderState.set(p.id, { lastX: x, lastY: y, faceRight: true, walkTimer: 0, isMoving: false });
    }
    const st = playerRenderState.get(p.id)!;
    const dx = x - st.lastX, dy = y - st.lastY;
    st.isMoving = dx * dx + dy * dy > 0.5;
    if (Math.abs(dx) > 0.5) st.faceRight = dx > 0;
    if (st.isMoving) {
        st.walkTimer += 0.35;
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

    // ── AYAKLAR ──────────────────────────────────────────────────────────────
    const footY = 22;
    const footX = 8;
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(-footX + (st.isMoving ? -swing : 0), footY, 6, 0, Math.PI * 2); ctx.fill();
    stk(ctx, '#000', 1.5);
    ctx.beginPath(); ctx.arc(footX + (st.isMoving ? swing : 0), footY, 6, 0, Math.PI * 2); ctx.fill();
    stk(ctx, '#000', 1.5);

    // ── GÖVDE ────────────────────────────────────────────────────────────────
    const bodyW = 28;
    const bodyH = 22;
    const bodyY = 2;
    ctx.beginPath(); ctx.roundRect(-bodyW/2, bodyY, bodyW, bodyH, 12);
    const bodyG = ctx.createLinearGradient(0, bodyY, 0, bodyY + bodyH);
    bodyG.addColorStop(0, adjustColor(bodyColor, 20));
    bodyG.addColorStop(1, bodyColor);
    ctx.fillStyle = bodyG; ctx.fill(); stk(ctx, '#000', 2);

    // ── ELLER ────────────────────────────────────────────────────────────────
    const handY = 12;
    const handX = 16;
    const skinTone = '#f5c090';
    ctx.fillStyle = skinTone;
    if (isHolding) {
        ctx.beginPath(); ctx.arc(8, handY, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(22, handY, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    } else {
        const armSwing = st.isMoving ? Math.sin(st.walkTimer) * 5 : 0;
        ctx.beginPath(); ctx.arc(-handX, handY + armSwing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(handX, handY - armSwing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    }

    // ── KAFA (100/15 oranında küçültüldü: 22 -> 18.7) ────────────────────────
    const headR = 18.7;
    const headY = -15;

    // Yüz Şekli Uygulama
    ctx.beginPath();
    if (faceShape === 1) { // Karemsi
        ctx.roundRect(-headR, headY - headR, headR * 2, headR * 2, 8);
    } else if (faceShape === 2) { // Sivri
        ctx.moveTo(0, headY + headR + 2);
        ctx.lineTo(-headR, headY - headR / 2);
        ctx.lineTo(-headR / 2, headY - headR);
        ctx.lineTo(headR / 2, headY - headR);
        ctx.lineTo(headR, headY - headR / 2);
        ctx.closePath();
    } else { // Normal (Yuvarlak)
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
    }
    
    const headG = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, headR);
    headG.addColorStop(0, '#fff1e0'); headG.addColorStop(1, '#f5c090');
    ctx.fillStyle = headG; ctx.fill(); stk(ctx, '#000', 2);

    // ── SAÇ ──────────────────────────────────────────────────────────────────
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(0, headY - 5, headR + 1, Math.PI, 0); // Üst saç
    ctx.lineTo(headR + 1, headY + 2);
    ctx.lineTo(headR - 4, headY + 2);
    ctx.lineTo(headR - 8, headY - 2);
    ctx.lineTo(-headR + 8, headY - 2);
    ctx.lineTo(-headR + 4, headY + 2);
    ctx.lineTo(-headR - 1, headY + 2);
    ctx.closePath();
    ctx.fill();
    stk(ctx, adjustColor(hairColor, -20), 1);

    // Yanaklar
    ctx.fillStyle = 'rgba(255,182,193,0.5)';
    ctx.beginPath(); ctx.arc(-10, headY + 5, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, headY + 5, 4, 0, Math.PI * 2); ctx.fill();

    // Gözler
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(-7, headY + 2, 3, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(7, headY + 2, 3, 4.2, 0, 0, Math.PI * 2); ctx.fill();
    
    // Göz parıltısı
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-6, headY, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, headY, 1.2, 0, Math.PI * 2); ctx.fill();

    // Ağız
    ctx.strokeStyle = '#844'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, headY + 7, 3.5, 0.2, Math.PI - 0.2); ctx.stroke();

    // ── ŞAPKA — kafaya tam uyumlu, her şapka özel konumlandırılmış ──────────
    if (p.hat) {
        ctx.save();
        ctx.scale(dirMul, 1);
        switch (p.hat) {
            case '👑': { // Altın taç — kafanın çevresine oturur
                const crownY = headY - headR + 2;
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.moveTo(-headR * 0.7, crownY);
                ctx.lineTo(-headR * 0.5, crownY - 10);
                ctx.lineTo(-headR * 0.15, crownY - 4);
                ctx.lineTo(0, crownY - 13);
                ctx.lineTo(headR * 0.15, crownY - 4);
                ctx.lineTo(headR * 0.5, crownY - 10);
                ctx.lineTo(headR * 0.7, crownY);
                ctx.closePath(); ctx.fill(); stk(ctx, '#b8860b', 1.5);
                ['#ff4444','#4444ff','#44ff44'].forEach((col, i) => {
                    ctx.fillStyle = col;
                    ctx.beginPath(); ctx.arc(-headR * 0.35 + i * headR * 0.35, crownY - 5, 2, 0, Math.PI * 2); ctx.fill();
                });
                break;
            }
            case '🎩': { // Silindir — kafanın tam üstü, kenarlık kafayı sarar
                const topY = headY - headR;
                ctx.fillStyle = '#1a1a1a';
                ctx.beginPath(); ctx.ellipse(0, topY + 2, headR * 0.9, 4, 0, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#333', 1);
                ctx.beginPath(); ctx.roundRect(-headR * 0.6, topY - 16, headR * 1.2, 18, [4, 4, 0, 0]); ctx.fill(); stk(ctx, '#333', 1);
                ctx.fillStyle = '#444';
                ctx.beginPath(); ctx.roundRect(-headR * 0.55, topY - 4, headR * 1.1, 2, 1); ctx.fill();
                break;
            }
            case '🧢': { // Kep — öne eğik
                const capY = headY - headR;
                ctx.save(); ctx.translate(headR * 0.05, 0); // hafif öne
                ctx.fillStyle = '#2563eb';
                ctx.beginPath(); ctx.ellipse(0, capY + 2, headR * 0.95, 5, 0, Math.PI, 0); ctx.fill(); stk(ctx, '#1d4ed8', 1);
                ctx.beginPath(); ctx.roundRect(-headR * 0.75, capY - 12, headR * 1.5, 14, [8, 8, 0, 0]); ctx.fill(); stk(ctx, '#1d4ed8', 1);
                ctx.fillStyle = '#1d4ed8';
                ctx.beginPath(); ctx.ellipse(headR * 0.5, capY - 5, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                break;
            }
            case '🎀': { // Fiyonk — kafanın tam tepesi
                const bowY = headY - headR - 4;
                ctx.fillStyle = '#ec4899';
                ctx.beginPath(); ctx.ellipse(-9, bowY, 9, 5, -0.4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#be185d', 1);
                ctx.beginPath(); ctx.ellipse(9, bowY, 9, 5, 0.4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#be185d', 1);
                ctx.fillStyle = '#f472b6';
                ctx.beginPath(); ctx.arc(0, bowY, 4.5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#be185d', 1);
                break;
            }
            case '🐱': { // Kedi kulakları — kafanın iki yanı
                const earY = headY - headR + 2;
                ctx.fillStyle = '#f5c090';
                ctx.beginPath(); ctx.moveTo(-headR * 0.55, earY); ctx.lineTo(-headR * 0.7, earY - 13); ctx.lineTo(-headR * 0.25, earY - 5); ctx.closePath(); ctx.fill(); stk(ctx, '#000', 1.5);
                ctx.beginPath(); ctx.moveTo(headR * 0.55, earY); ctx.lineTo(headR * 0.7, earY - 13); ctx.lineTo(headR * 0.25, earY - 5); ctx.closePath(); ctx.fill(); stk(ctx, '#000', 1.5);
                ctx.fillStyle = '#ffb6c1';
                ctx.beginPath(); ctx.moveTo(-headR * 0.55, earY - 2); ctx.lineTo(-headR * 0.65, earY - 11); ctx.lineTo(-headR * 0.3, earY - 5); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(headR * 0.55, earY - 2); ctx.lineTo(headR * 0.65, earY - 11); ctx.lineTo(headR * 0.3, earY - 5); ctx.closePath(); ctx.fill();
                break;
            }
            case '⭐': { // Yıldız — kafanın üstü
                const starY = headY - headR - 6;
                ctx.fillStyle = '#FFD700';
                const pts = 5, outerR = 11, innerR = 4.5;
                ctx.beginPath();
                for (let i = 0; i < pts * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR;
                    const angle = (i * Math.PI) / pts - Math.PI / 2;
                    i === 0 ? ctx.moveTo(Math.cos(angle) * r, starY + Math.sin(angle) * r)
                            : ctx.lineTo(Math.cos(angle) * r, starY + Math.sin(angle) * r);
                }
                ctx.closePath(); ctx.fill(); stk(ctx, '#b8860b', 1);
                break;
            }
            case '👨‍🍳': { // Aşçı şapkası (Toque Blanche) — uzun beyaz silindir
                const toqueY = headY - headR;
                ctx.fillStyle = '#ffffff';
                // Alt bant — kafayı sarar
                ctx.beginPath(); ctx.ellipse(0, toqueY + 2, headR * 0.95, 5, 0, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#ddd', 1);
                // Uzun silindir gövde
                ctx.beginPath(); ctx.roundRect(-headR * 0.7, toqueY - 24, headR * 1.4, 26, [6, 6, 0, 0]); ctx.fill(); stk(ctx, '#ddd', 1.5);
                // Üst kıvrım
                ctx.fillStyle = '#f5f5f5';
                ctx.beginPath(); ctx.ellipse(0, toqueY - 24, headR * 0.7, 4, 0, Math.PI, 0); ctx.fill();
                // Kıvrım çizgileri
                ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 0.8;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(-headR * 0.6, toqueY - 20 + i * 6);
                    ctx.lineTo(headR * 0.6, toqueY - 20 + i * 6);
                    ctx.stroke();
                }
                break;
            }
            default: { // Diğer emojiler için fallback
                ctx.font = `${headR * 1.2}px Arial`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(p.hat, 0, headY - headR - 8);
            }
        }
        ctx.restore();
    }

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

    // ── İSİM ETİKETİ + UNVAN ─────────────────────────────────────────────────
    ctx.scale(dirMul, 1);
    const label = isMe ? `★ ${p.name}` : p.name;
    ctx.font = 'bold 11px Arial';
    const lw = ctx.measureText(label).width + 16;
    const labelBg = isMe ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    const labelY = headY - headR - 30;
    const fx = p.labelEffect;
    const now = Date.now();

    // Etiket arka plan + efekt
    ctx.save();
    if (fx === 'glow') {
        const glowColor = p.nameLabelColor || '#fff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 12 + Math.sin(now / 300) * 4;
    } else if (fx === 'gold') {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
    }
    ctx.fillStyle = labelBg;
    ctx.beginPath(); ctx.roundRect(-lw / 2, labelY, lw, 18, 9); ctx.fill();
    if (fx === 'gold') {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(-lw / 2, labelY, lw, 18, 9); ctx.stroke();
    }
    ctx.restore();

    // Etiket yazısı rengi
    let labelColor = p.nameLabelColor || '#fff';
    if (fx === 'rainbow') {
        const hue = (now / 20) % 360;
        labelColor = `hsl(${hue}, 100%, 70%)`;
    }
    ctx.save();
    if (fx === 'pulse') {
        ctx.globalAlpha = 0.6 + Math.abs(Math.sin(now / 400)) * 0.4;
    }
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, labelY + 9);
    ctx.restore();

    // Unvan — isim etiketinin altında
    if (p.title) {
        ctx.font = 'bold 9px Arial';
        const tw = ctx.measureText(p.title).width + 12;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath(); ctx.roundRect(-tw / 2, labelY + 20, tw, 14, 7); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.title, 0, labelY + 27);
    }

    ctx.restore();
}
