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
    const getDisplayItem = (item: string) => {
        if (item === CLEAN_PLATE) return '🍽️';
        if (item === DIRTY_PLATE) return '🧽';
        return stripChopped(item);
    };
    const heldItem = rawHolding ? getDisplayItem(rawHolding) : rawHolding;
    
    const typeId   = Math.min(p.charType ?? 0, CHARACTER_TYPES.length - 1);
    const charDef  = CHARACTER_TYPES[typeId];
    const bodyColor   = p.clothingColor || p.color || charDef.bodyColor;
    const hairColor   = p.hairColor || '#4b2c20';
    const faceShape   = p.faceShape ?? 0;
    const outfitStyle = p.outfitStyle || 'default';

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

    // ── KIYAFet STİLİ DETAYLARI ───────────────────────────────────────────
    if (outfitStyle === 'chef') {
        // Beyaz önlük
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.roundRect(-bodyW/2 + 4, bodyY + 1, bodyW - 8, bodyH - 2, 8); ctx.fill();
        stk(ctx, '#ddd', 1);
        // Düğmeler
        ctx.fillStyle = '#aaa';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.arc(0, bodyY + 5 + i * 5, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    } else if (outfitStyle === 'waiter') {
        // Siyah yelek
        ctx.fillStyle = 'rgba(20,20,20,0.9)';
        ctx.beginPath(); ctx.roundRect(-bodyW/2 + 5, bodyY + 1, bodyW - 10, bodyH - 2, 6); ctx.fill();
        // Beyaz gömlek kenarları
        ctx.fillStyle = 'rgba(240,240,240,0.9)';
        ctx.beginPath(); ctx.roundRect(-3, bodyY + 2, 6, bodyH - 4, 3); ctx.fill();
        // Papyon
        ctx.fillStyle = '#cc0000';
        ctx.beginPath(); ctx.ellipse(-4, bodyY + 3, 4, 2.5, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, bodyY + 3, 4, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#aa0000';
        ctx.beginPath(); ctx.arc(0, bodyY + 3, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (outfitStyle === 'hoodie') {
        // Kapüşon gövde çizgisi
        ctx.fillStyle = adjustColor(bodyColor, -15);
        ctx.beginPath(); ctx.roundRect(-bodyW/2 + 3, bodyY + 1, bodyW - 6, bodyH - 2, 9); ctx.fill();
        stk(ctx, adjustColor(bodyColor, -30), 1);
        // Kanguru cep
        ctx.fillStyle = adjustColor(bodyColor, -25);
        ctx.beginPath(); ctx.roundRect(-8, bodyY + 10, 16, 9, 4); ctx.fill();
        stk(ctx, adjustColor(bodyColor, -40), 0.8);
        // Kapüşon (kafanın arkasında)
        ctx.fillStyle = adjustColor(bodyColor, -10);
        ctx.beginPath(); ctx.arc(0, bodyY - 2, 10, Math.PI * 0.8, Math.PI * 2.2); ctx.fill();
    } else if (outfitStyle === 'suit') {
        // Ceket
        ctx.fillStyle = adjustColor(bodyColor, -30);
        ctx.beginPath(); ctx.roundRect(-bodyW/2 + 2, bodyY + 1, bodyW - 4, bodyH - 2, 8); ctx.fill();
        stk(ctx, '#000', 1);
        // Beyaz gömlek
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath(); ctx.roundRect(-4, bodyY + 2, 8, bodyH - 4, 3); ctx.fill();
        // Kravat
        ctx.fillStyle = '#1a3a8f';
        ctx.beginPath();
        ctx.moveTo(-2, bodyY + 3); ctx.lineTo(2, bodyY + 3);
        ctx.lineTo(3, bodyY + 14); ctx.lineTo(0, bodyY + 17); ctx.lineTo(-3, bodyY + 14);
        ctx.closePath(); ctx.fill();
        // Ceket yaka
        ctx.fillStyle = adjustColor(bodyColor, -30);
        ctx.beginPath(); ctx.moveTo(-bodyW/2 + 2, bodyY + 1); ctx.lineTo(-4, bodyY + 8); ctx.lineTo(0, bodyY + 5); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(bodyW/2 - 2, bodyY + 1); ctx.lineTo(4, bodyY + 8); ctx.lineTo(0, bodyY + 5); ctx.closePath(); ctx.fill();
    } else if (outfitStyle === 'apron') {
        // Önlük
        ctx.fillStyle = adjustColor(bodyColor, 30);
        ctx.beginPath(); ctx.roundRect(-9, bodyY + 3, 18, bodyH - 4, 4); ctx.fill();
        stk(ctx, adjustColor(bodyColor, -10), 1);
        // Önlük askıları
        ctx.strokeStyle = adjustColor(bodyColor, 30); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(-6, bodyY + 3); ctx.lineTo(-8, bodyY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, bodyY + 3); ctx.lineTo(8, bodyY); ctx.stroke();
        // Cep
        ctx.fillStyle = adjustColor(bodyColor, 20);
        ctx.beginPath(); ctx.roundRect(-5, bodyY + 10, 10, 7, 2); ctx.fill();
        stk(ctx, adjustColor(bodyColor, 0), 0.8);
    } else {
        // Default — orijinal yaka detayı
        ctx.fillStyle = charDef.accent;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.roundRect(-bodyW/2 + 4, bodyY + 2, bodyW - 8, 6, 4); ctx.fill();
        ctx.globalAlpha = 1;
    }

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

    // ── KAFA ─────────────────────────────────────────────────────────────────
    const headR = 18.7;
    const headY = -15;

    // Kafa çizimi
    ctx.beginPath();
    if (faceShape === 1) {
        ctx.roundRect(-headR, headY - headR, headR * 2, headR * 2, 8);
    } else if (faceShape === 2) {
        ctx.moveTo(0, headY + headR + 2);
        ctx.lineTo(-headR, headY - headR / 2);
        ctx.lineTo(-headR / 2, headY - headR);
        ctx.lineTo(headR / 2, headY - headR);
        ctx.lineTo(headR, headY - headR / 2);
        ctx.closePath();
    } else {
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
    }
    const headG = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, headR);
    headG.addColorStop(0, '#fff1e0'); headG.addColorStop(1, '#f5c090');
    ctx.fillStyle = headG; ctx.fill(); stk(ctx, '#000', 2);

    // ── SAÇ (kafadan SONRA çizilir — alın kısmına gelir, doğal görünür) ──────
    const hairStyle = p.hairStyle || 'default';
    ctx.fillStyle = hairColor;
    ctx.strokeStyle = adjustColor(hairColor, -20);
    ctx.lineWidth = 1;

    if (hairStyle === 'short') {
        ctx.beginPath();
        ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 1);
        ctx.lineTo(headR - 5, headY + 1);
        ctx.lineTo(-headR + 5, headY + 1);
        ctx.lineTo(-headR - 1, headY + 1);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

    } else if (hairStyle === 'long') {
        ctx.beginPath();
        ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 2);
        ctx.lineTo(headR + 3, headY + 18);
        ctx.lineTo(headR - 2, headY + 20);
        ctx.lineTo(headR - 6, headY + 14);
        ctx.lineTo(-headR + 6, headY + 14);
        ctx.lineTo(-headR + 2, headY + 20);
        ctx.lineTo(-headR - 3, headY + 18);
        ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = adjustColor(hairColor, -30);
        ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(0, headY - headR); ctx.lineTo(0, headY + 14); ctx.stroke();

    } else if (hairStyle === 'wavy') {
        ctx.beginPath();
        ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 2);
        ctx.bezierCurveTo(headR + 5, headY + 6, headR + 1, headY + 10, headR + 4, headY + 14);
        ctx.bezierCurveTo(headR + 6, headY + 18, headR + 1, headY + 20, headR - 2, headY + 22);
        ctx.lineTo(headR - 6, headY + 14);
        ctx.lineTo(-headR + 6, headY + 14);
        ctx.lineTo(-headR + 2, headY + 22);
        ctx.bezierCurveTo(-headR - 1, headY + 20, -headR - 6, headY + 18, -headR - 4, headY + 14);
        ctx.bezierCurveTo(-headR - 1, headY + 10, -headR - 5, headY + 6, -headR - 1, headY + 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

    } else if (hairStyle === 'afro') {
        ctx.beginPath();
        ctx.arc(0, headY - 4, headR + 8, Math.PI * 0.85, Math.PI * 2.15);
        ctx.arc(0, headY + 2, headR + 1, 0, Math.PI);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = adjustColor(hairColor, -15);
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const r = headR + 4;
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.6, headY - 4 + Math.sin(a) * r * 0.5, 3, 0, Math.PI * 2);
            ctx.fill();
        }

    } else if (hairStyle === 'bun') {
        ctx.beginPath();
        ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
        ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, headY - headR - 5, 7, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        ctx.strokeStyle = adjustColor(hairColor, -25); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, headY - headR - 5, 5, 0.3, Math.PI - 0.3); ctx.stroke();

    } else if (hairStyle === 'spiky') {
        ctx.beginPath();
        ctx.arc(0, headY - 3, headR + 1, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
        ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        const spikes = [[-12], [-6], [0], [6], [12]];
        spikes.forEach(([sx]) => {
            const baseY = headY - headR + 1;
            ctx.beginPath();
            ctx.moveTo(sx - 5, baseY + 2);
            ctx.lineTo(sx, baseY - 10 - Math.abs(sx) * 0.2);
            ctx.lineTo(sx + 5, baseY + 2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        });

    } else if (hairStyle === 'ponytail') {
        ctx.beginPath();
        ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
        ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(headR - 2, headY - 4);
        ctx.bezierCurveTo(headR + 10, headY, headR + 12, headY + 10, headR + 6, headY + 22);
        ctx.bezierCurveTo(headR + 10, headY + 22, headR + 14, headY + 10, headR + 8, headY - 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = adjustColor(hairColor, -40);
        ctx.beginPath(); ctx.arc(headR + 2, headY - 2, 3, 0, Math.PI * 2); ctx.fill();

    } else if (hairStyle === 'mohawk') {
        ctx.beginPath();
        ctx.arc(0, headY - 3, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
        ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, headY - headR + 2);
        ctx.lineTo(-7, headY - headR - 18);
        ctx.lineTo(0, headY - headR - 22);
        ctx.lineTo(7, headY - headR - 18);
        ctx.lineTo(5, headY - headR + 2);
        ctx.closePath(); ctx.fill(); ctx.stroke();

    } else {
        // Default
        ctx.beginPath();
        ctx.arc(0, headY - 5, headR + 1, Math.PI, 0);
        ctx.lineTo(headR + 1, headY + 2); ctx.lineTo(headR - 4, headY + 2);
        ctx.lineTo(headR - 8, headY - 2); ctx.lineTo(-headR + 8, headY - 2);
        ctx.lineTo(-headR + 4, headY + 2); ctx.lineTo(-headR - 1, headY + 2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = adjustColor(hairColor, -20); ctx.lineWidth = 1; ctx.stroke();
    }

    // ── YÜZ DETAYLARI ────────────────────────────────────────────────────────
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

    // ── İSİM ETİKETİ + UNVAN — ayağın altında ───────────────────────────────
    ctx.scale(dirMul, 1);
    const label = isMe ? `★ ${p.name}` : p.name;
    ctx.font = 'bold 11px Arial';
    const lw = ctx.measureText(label).width + 16;
    const labelBg = isMe ? 'rgba(59, 130, 246, 0.9)' : 'rgba(0, 0, 0, 0.7)';
    const labelY = 34; // ayağın altı (footY=22 + ayak r=6 + boşluk)
    const fx = p.labelEffect;
    const now = Date.now();

    // Etiket arka plan + efekt
    ctx.save();
    if (fx === 'glow') {
        ctx.shadowColor = p.nameLabelColor || '#fff';
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
