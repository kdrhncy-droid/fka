import { Customer } from '../types/game';
import { stk, lighten, darken, drawShadowEllipse } from './rendererUtils';
import { PERS_COLORS } from '../../shared/customerColors';

type CRS = {
    lastX: number; lastY: number;
    faceRight: boolean;
    bobPhase: number; bobAmount: number;
    beatUpShake: number;
    eatPhase: number;
    drunkPhase: number;
};

const crs = new Map<string, CRS>();

export function cleanupCRS(activeIds: Set<string>) {
    for (const key of crs.keys()) {
        if (!activeIds.has(key)) crs.delete(key);
    }
}

function getCRS(id: string, x: number, y: number): CRS {
    if (!crs.has(id)) crs.set(id, {
        lastX: x, lastY: y, faceRight: true,
        bobPhase: 0, bobAmount: 0, beatUpShake: 0, eatPhase: 0, drunkPhase: 0,
    });
    return crs.get(id)!;
}

function chibiBodyProps(shape: 1 | 2 | 3 | 4) {
    switch (shape) {
        case 2: return { bw: 32, bh: 22, hr: 20.4 };
        case 3: return { bw: 22, bh: 26, hr: 17   };
        case 4: return { bw: 28, bh: 18, hr: 18.7 };
        default:return { bw: 26, bh: 22, hr: 18.7 };
    }
}

// Kişiliğe göre sabit renk ve ten rengi — shared/customerColors.ts'ten import edilir

const FALLBACK_HAIR = ['#2d1b0e','#1a1a1a','#5c3317','#8b4513','#2c2c54','#1a3a1a'];
function fallbackHair(id: string): string {
    const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return FALLBACK_HAIR[h % FALLBACK_HAIR.length];
}

export function drawCustomer(ctx: CanvasRenderingContext2D, customer: Customer, tableLayout?: Record<string, { id: string; x: number; y: number }>, hidePatience = false, hidePersonality = false) {
    const { id, x, y, seatX, seatY, wants, patience, maxPatience, isSeated, isEating, beatUpTimer, currentDialog } = customer;
    const pers = hidePersonality ? 'polite' : customer.personality;
    const shape = customer.bodyShape ?? 1;

    // Kişiliğe göre renk — yoksa bodyColor fallback
    const pc = PERS_COLORS[pers];
    const bodyColor = pc?.body ?? customer.bodyColor ?? '#475569';
    const skinColor = pc?.skin ?? '#f5c090';
    const hairCol   = pc?.hair ?? fallbackHair(id);

    // Masa yönü
    let tableY = 500;
    if (tableLayout) {
        let minD = Infinity;
        for (const t of Object.values(tableLayout)) {
            const d = Math.hypot(t.x - seatX, t.y - seatY);
            if (d < minD && d < 75) { minD = d; tableY = t.y; }
        }
        if (minD === Infinity) tableY = seatY < 500 ? seatY + 47 : seatY - 47;
    } else {
        tableY = seatY < 500 ? seatY + 47 : seatY - 47;
    }
    const facingBack = isSeated && !(seatY < tableY);
    const st = getCRS(id, x, y);

    const dx = x - st.lastX;
    const moving = !isSeated && (dx * dx + (y - st.lastY) ** 2 > 0.8);
    if (moving) {
        st.bobPhase += 0.35; st.bobAmount = Math.min(1, st.bobAmount + 0.25);
        if (Math.abs(dx) > 0.2) st.faceRight = dx > 0;
    } else {
        st.bobAmount = Math.max(0, st.bobAmount - 0.2);
        st.bobPhase = st.bobAmount > 0 ? st.bobPhase + 0.25 : 0;
    }
    if (isEating) st.eatPhase += 0.2;
    if (pers === 'drunk') st.drunkPhase += 0.06;
    if (beatUpTimer && beatUpTimer > 0 && st.beatUpShake <= 0) st.beatUpShake = 25;
    if (st.beatUpShake > 0) st.beatUpShake--;
    st.lastX = x; st.lastY = y;

    const shakeX  = st.beatUpShake > 0 ? Math.sin(st.beatUpShake * 2) * 3 : 0;
    const bobY    = Math.abs(Math.sin(st.bobPhase)) * 5 * st.bobAmount;
    const swing   = moving ? Math.sin(st.bobPhase) * 6 : 0;
    const eatBob  = isEating ? Math.sin(st.eatPhase) * 4 : 0;
    const drunkWobble = pers === 'drunk' ? Math.sin(st.drunkPhase) * 8 : 0;
    const drunkTilt   = pers === 'drunk' ? Math.sin(st.drunkPhase * 0.7) * 0.15 : 0;

    const { bw, bh, hr } = chibiBodyProps(shape);

    ctx.save();
    ctx.translate(x + shakeX + drunkWobble, y);
    if (st.beatUpShake > 0) ctx.globalAlpha = 0.9;
    if (pers === 'drunk') ctx.rotate(drunkTilt);

    // ✨ Şans müşterisi altın parıltı halkası
    if (pers === 'lucky') {
        const pulse = 0.65 + Math.sin(Date.now() / 180) * 0.35;
        const gy = isSeated ? -20 : -10;
        const gr = ctx.createRadialGradient(0, gy, 10, 0, gy, 42);
        gr.addColorStop(0, `rgba(251,191,36,${0.22 * pulse})`);
        gr.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(0, gy, 42, 0, Math.PI * 2); ctx.fill();
    }

    if (!isSeated) drawShadowEllipse(ctx, 0, 25, 18, 8, 0.2);

    ctx.translate(0, -bobY + eatBob);
    if (!isSeated) ctx.scale(st.faceRight ? 1 : -1, 1);

    // ── AYAKLAR ──────────────────────────────────────────────────────────────
    if (!isSeated) {
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.ellipse(-8 + swing, 22, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.ellipse(8 - swing, 22, 6, 4, 0, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    } else {
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.roundRect(-bw/2, facingBack ? -15 : 12, bw, 6, 3); ctx.fill(); stk(ctx, '#000', 1.5);
    }

    // ── GÖVDE ────────────────────────────────────────────────────────────────
    const bodyY = isSeated ? (facingBack ? -bh/2 - 8 : -bh/2 - 2) : -bh/2 + 2;
    ctx.beginPath(); ctx.roundRect(-bw/2, bodyY, bw, bh, 10);
    const bg = ctx.createLinearGradient(0, bodyY, 0, bodyY + bh);
    bg.addColorStop(0, st.beatUpShake > 0 ? '#ef4444' : lighten(bodyColor, 20));
    bg.addColorStop(1, st.beatUpShake > 0 ? '#dc2626' : bodyColor);
    ctx.fillStyle = bg; ctx.fill(); stk(ctx, '#000', 2);

    // Recep çizgili gömlek
    if (pers === 'recep') {
        ctx.strokeStyle = '#ff6633'; ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const lx = -bw/2 + 4 + i * (bw / 4);
            ctx.beginPath(); ctx.moveTo(lx, bodyY + 3); ctx.lineTo(lx, bodyY + bh - 3); ctx.stroke();
        }
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-5, bodyY + 2); ctx.lineTo(0, bodyY + 8); ctx.lineTo(5, bodyY + 2); ctx.stroke();
    }
    // Inspector beyaz önlük çizgisi
    if (pers === 'inspector') {
        ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, bodyY + 4); ctx.lineTo(0, bodyY + bh - 4); ctx.stroke();
        ctx.fillStyle = '#aaa';
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, bodyY + 6 + i * 5, 1.5, 0, Math.PI * 2); ctx.fill(); }
    }

    // ── ELLER ────────────────────────────────────────────────────────────────
    const handY = bodyY + bh / 2;
    const handX = bw / 2 + 4;
    ctx.fillStyle = skinColor;
    if (isEating) {
        ctx.beginPath(); ctx.arc(-handX + 5, handY + 5, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
        ctx.beginPath(); ctx.arc(handX - 5, handY + 5, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
        ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-handX + 5, handY + 5); ctx.lineTo(-handX + 5, handY + 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(handX - 5, handY + 5); ctx.lineTo(handX - 5, handY + 14); ctx.stroke();
    } else if (!isSeated) {
        const armSwing = Math.sin(st.bobPhase) * 4;
        ctx.beginPath(); ctx.arc(-handX, handY + armSwing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
        ctx.beginPath(); ctx.arc(handX, handY - armSwing, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
    } else {
        ctx.beginPath(); ctx.arc(-handX + 4, handY + 2, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
        ctx.beginPath(); ctx.arc(handX - 4, handY + 2, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
    }
    // Inspector clipboard
    if (pers === 'inspector' && isSeated) {
        ctx.fillStyle = '#8B4513';
        ctx.beginPath(); ctx.roundRect(handX + 2, handY - 8, 12, 16, 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(handX + 3, handY - 7, 10, 14, 1); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(handX + 5, handY - 4 + i * 4); ctx.lineTo(handX + 11, handY - 4 + i * 4); ctx.stroke(); }
    }

    // ── KAFA ─────────────────────────────────────────────────────────────────
    const headY = bodyY - hr + 4;

    if (facingBack) {
        ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
        ctx.fillStyle = hairCol; ctx.fill(); stk(ctx, '#000', 2);
    } else {
        // Kafa taban
        ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
        const hg = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, hr);
        hg.addColorStop(0, lighten(skinColor, 15)); hg.addColorStop(1, skinColor);
        ctx.fillStyle = hg; ctx.fill(); stk(ctx, '#000', 2);

        // Saç
        ctx.fillStyle = hairCol;
        if (pers === 'recep') {
            // Düz kesilmiş kısa saç
            ctx.beginPath(); ctx.roundRect(-hr * 0.85, headY - hr * 0.95, hr * 1.7, hr * 0.45, [4, 4, 0, 0]); ctx.fill();
        } else if (pers === 'thug') {
            // Şapka altında saç yok — şapka sonra çizilecek
        } else {
            ctx.beginPath(); ctx.arc(0, headY, hr, Math.PI, 0); ctx.fill();
            ctx.beginPath(); ctx.arc(0, headY - hr + 5, hr * 0.8, Math.PI, 0); ctx.fill();
        }

        const eyeY = headY + 2;
        const eyeX = hr * 0.35;

        // ── YÜZ — kişiliğe göre ───────────────────────────────────────────
        if (pers === 'thug') {
            // Yüz bandı (göz hizası)
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.beginPath(); ctx.roundRect(-hr * 0.75, eyeY - 5, hr * 1.5, 9, 2); ctx.fill();
            // Kırmızı gözler
            ctx.fillStyle = '#cc0000';
            ctx.beginPath(); ctx.arc(-eyeX, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2); ctx.fill();
            // Yara izi
            ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(hr * 0.3, headY - 4); ctx.lineTo(hr * 0.5, headY + 4); ctx.stroke();
            // Düz ağız
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-5, headY + hr * 0.45); ctx.lineTo(5, headY + hr * 0.45); ctx.stroke();
        } else if (pers === 'drunk') {
            // X gözler
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5;
            [[-eyeX, eyeY], [eyeX, eyeY]].forEach(([ex, ey]) => {
                ctx.beginPath(); ctx.moveTo(ex - 4, ey - 4); ctx.lineTo(ex + 4, ey + 4); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ex + 4, ey - 4); ctx.lineTo(ex - 4, ey + 4); ctx.stroke();
            });
            // Kırmızı yanak
            ctx.fillStyle = 'rgba(255,100,120,0.5)';
            ctx.beginPath(); ctx.ellipse(-hr * 0.55, headY + 5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(hr * 0.55, headY + 5, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
            // Eğri ağız
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, headY + hr * 0.45);
            ctx.quadraticCurveTo(-2, headY + hr * 0.55, 2, headY + hr * 0.38);
            ctx.quadraticCurveTo(5, headY + hr * 0.28, 7, headY + hr * 0.45);
            ctx.stroke();
        } else {
            // Normal oval gözler
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.ellipse(-eyeX, eyeY, 2.8, 4.2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 2.8, 4.2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(-eyeX + 1, eyeY - 1.5, 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(eyeX + 1, eyeY - 1.5, 1.1, 0, Math.PI * 2); ctx.fill();

            // Kaşlar
            if (pers === 'rude') {
                ctx.fillStyle = '#111';
                ctx.save(); ctx.translate(-eyeX, eyeY - 7); ctx.rotate(-0.35);
                ctx.fillRect(-5, -2, 10, 3); ctx.restore();
                ctx.save(); ctx.translate(eyeX, eyeY - 7); ctx.rotate(0.35);
                ctx.fillRect(-5, -2, 10, 3); ctx.restore();
                // Ekstra kızgın çizgi
                ctx.strokeStyle = '#8B0000'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(-hr * 0.6, headY - hr * 0.3); ctx.lineTo(-hr * 0.1, headY - hr * 0.15); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(hr * 0.6, headY - hr * 0.3); ctx.lineTo(hr * 0.1, headY - hr * 0.15); ctx.stroke();
            } else if (pers === 'recep') {
                ctx.fillStyle = '#111';
                ctx.beginPath(); ctx.roundRect(-eyeX - 5, headY - hr * 0.25, hr * 0.5, 4, 2); ctx.fill();
                ctx.beginPath(); ctx.roundRect(eyeX - hr * 0.5 + 5, headY - hr * 0.25, hr * 0.5, 4, 2); ctx.fill();
            } else if (pers === 'inspector') {
                ctx.fillStyle = '#333';
                ctx.fillRect(-eyeX - 5, eyeY - 9, 10, 2.5);
                ctx.fillRect(eyeX - 5, eyeY - 9, 10, 2.5);
            } else if (pers === 'vip') {
                ctx.fillStyle = '#5c3317';
                ctx.save(); ctx.translate(-eyeX, eyeY - 8); ctx.rotate(0.15);
                ctx.fillRect(-5, -1.5, 10, 2.5); ctx.restore();
                ctx.save(); ctx.translate(eyeX, eyeY - 8); ctx.rotate(-0.15);
                ctx.fillRect(-5, -1.5, 10, 2.5); ctx.restore();
            } else {
                // polite — pembe yanak
                ctx.fillStyle = 'rgba(255,182,193,0.4)';
                ctx.beginPath(); ctx.arc(-hr * 0.6, headY + 5, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(hr * 0.6, headY + 5, 3.5, 0, Math.PI * 2); ctx.fill();
            }

            // Ağız
            const mouthY = headY + hr * 0.45;
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
            ctx.beginPath();
            if (pers === 'polite') {
                ctx.arc(0, mouthY - 3, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
            } else if (pers === 'rude') {
                ctx.arc(0, mouthY + 3, 6, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
            } else if (pers === 'recep') {
                ctx.fillStyle = '#8B0000';
                ctx.beginPath(); ctx.arc(0, mouthY - 2, 7, 0, Math.PI); ctx.fill(); stk(ctx, '#333', 1.5);
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(-5, mouthY - 2, 10, 4, 1); ctx.fill();
            } else if (pers === 'vip') {
                ctx.moveTo(-5, mouthY + 1); ctx.quadraticCurveTo(0, mouthY - 3, 6, mouthY - 1); ctx.stroke();
            } else if (pers === 'inspector') {
                ctx.moveTo(-5, mouthY); ctx.lineTo(5, mouthY); ctx.stroke();
            } else {
                ctx.arc(0, mouthY - 2, 4, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
            }
        }

        // Recep büyük burun
        if (pers === 'recep') {
            ctx.fillStyle = darken(skinColor, 20);
            ctx.beginPath(); ctx.arc(0, headY + hr * 0.2, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, 'rgba(0,0,0,0.3)', 1);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath(); ctx.ellipse(-2.5, headY + hr * 0.25, 1.5, 1, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(2.5, headY + hr * 0.25, 1.5, 1, 0, 0, Math.PI * 2); ctx.fill();
        }

        // ── AKSESUARLAR ───────────────────────────────────────────────────
        if (pers === 'thug') {
            // Şapka
            ctx.fillStyle = '#111';
            ctx.beginPath(); ctx.ellipse(0, headY - hr + 4, hr * 1.1, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.roundRect(-hr * 0.8, headY - hr * 1.7, hr * 1.6, hr * 0.9, [4, 4, 0, 0]); ctx.fill();
            stk(ctx, '#333', 1);
        } else if (pers === 'vip') {
            // Taç
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-hr * 0.7, headY - hr + 2);
            ctx.lineTo(-hr * 0.5, headY - hr - 10);
            ctx.lineTo(-hr * 0.15, headY - hr - 4);
            ctx.lineTo(0, headY - hr - 13);
            ctx.lineTo(hr * 0.15, headY - hr - 4);
            ctx.lineTo(hr * 0.5, headY - hr - 10);
            ctx.lineTo(hr * 0.7, headY - hr + 2);
            ctx.closePath(); ctx.fill(); stk(ctx, '#b8860b', 1.5);
            ['#ff4444','#4444ff','#44ff44'].forEach((col, i) => {
                ctx.fillStyle = col;
                ctx.beginPath(); ctx.arc(-hr * 0.35 + i * hr * 0.35, headY - hr - 5, 2, 0, Math.PI * 2); ctx.fill();
            });
            // Monokel
            ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(hr * 0.35, headY + 2, 6, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(hr * 0.35 + 6, headY + 2); ctx.lineTo(hr * 0.35 + 9, headY + 8); ctx.stroke();
        } else if (pers === 'lucky') {
            // 🍀 Dört yapraklı yonca şapka
            const lcx = 0, lcy = headY - hr - 8;
            ctx.font = '18px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🍀', lcx, lcy);
            // Altın parıldayan yıldız
            const starPulse = 0.7 + Math.sin(Date.now() / 130) * 0.3;
            ctx.globalAlpha = starPulse;
            ctx.font = '10px Arial'; ctx.fillText('✨', lcx + 12, lcy - 8);
            ctx.globalAlpha = 1;
        } else if (pers === 'inspector') {
            // Gözlük
            ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
            const ex2 = hr * 0.35, ey2 = headY + 2;
            ctx.beginPath(); ctx.arc(-ex2, ey2, 5.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(ex2, ey2, 5.5, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-ex2 + 5.5, ey2); ctx.lineTo(ex2 - 5.5, ey2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-ex2 - 5.5, ey2); ctx.lineTo(-ex2 - 10, ey2 - 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex2 + 5.5, ey2); ctx.lineTo(ex2 + 10, ey2 - 2); ctx.stroke();
        }
    }

    // UI — ayna efektini önle
    if (!isSeated && !st.faceRight) ctx.scale(-1, 1);

    // ── UI KATMANI — dialog ve yemek balonu (kafa üstü) ─────────────────────
    const headTopExtra = (pers === 'vip') ? 18 : (pers === 'thug') ? 14 : (pers === 'lucky') ? 16 : 0;
    const uiBaseY = headY - hr - 14 - headTopExtra;

    const isAngry = (patience / maxPatience) < 0.3;
    const angryShake = isAngry ? Math.sin(Date.now() / 40) * 1.5 : 0;

    // Dialog balonu — her zaman kafa üstünde
    if (currentDialog) {
        drawDialogBubble(ctx, currentDialog, angryShake, uiBaseY - 4, '#fff', isAngry ? '#ef4444' : bodyColor, '#222');
    } else if (wants && isSeated && !isEating) {
        // Yemek balonu
        const bx = angryShake;
        const by = uiBaseY - 18;
        const bubbleR = 14;
        ctx.fillStyle = isAngry && Math.floor(Date.now() / 200) % 2 === 0 ? '#fee2e2' : '#fff';
        ctx.beginPath(); ctx.arc(bx, by, bubbleR, 0, Math.PI * 2); ctx.fill();
        stk(ctx, isAngry ? '#ef4444' : bodyColor, 1.8);
        ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(wants, bx, by);
    }

    // ── SABIR BARI — müşterinin altında, sandalye seviyesinde ───────────────
    if (isSeated && !isEating && patience < maxPatience && !hidePatience) {
        const pct = patience / maxPatience;
        const barW = 50;
        const barH = 7;
        // Oturma yönüne göre bar pozisyonu: arkaya bakıyorsa üstte, öne bakıyorsa altta
        const barOffsetY = facingBack ? -(bh + hr + 28) : (bh / 2 + 22);
        const bx = -barW / 2;
        const by = barOffsetY;

        // Kritik pulse efekti
        const pulse = isAngry ? 1 + Math.sin(Date.now() / 120) * 0.08 : 1;
        ctx.save();
        if (isAngry) ctx.scale(pulse, 1);

        // Arka plan
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.roundRect(bx - 1, by - 1, barW + 2, barH + 2, 4); ctx.fill();

        // Bar rengi
        let barColor = pct > 0.6 ? '#22c55e' : pct > 0.3 ? '#eab308' : '#ef4444';
        if (isAngry && Math.floor(Date.now() / 150) % 2 === 0) barColor = '#fca5a5';
        ctx.fillStyle = barColor;
        ctx.beginPath(); ctx.roundRect(bx, by, Math.max(2, barW * pct), barH, 3); ctx.fill();

        // Çerçeve
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 3); ctx.stroke();

        // Emoji göstergesi
        const emoji = pct > 0.6 ? '😊' : pct > 0.3 ? '😐' : '😡';
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, bx + barW + 4, by + barH / 2);

        ctx.restore();
    }

    ctx.restore();
}

function drawDialogBubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bgColor: string, borderColor: string, textColor: string) {
    const maxWidth = 160, padding = 10, lineHeight = 16;
    ctx.font = 'bold 13px Arial';
    const words = text.split(' ');
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
        const test = cur ? cur + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth - padding * 2) { if (cur) lines.push(cur); cur = w; }
        else cur = test;
    }
    if (cur) lines.push(cur);
    const bw2 = Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2;
    const bh2 = lines.length * lineHeight + padding * 1.5;
    const dbx = x - bw2 / 2, dby = y - bh2;
    ctx.fillStyle = bgColor;
    ctx.beginPath(); ctx.roundRect(dbx, dby, bw2, bh2, 8); ctx.fill();
    ctx.strokeStyle = borderColor; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((line, i) => ctx.fillText(line, x, dby + padding * 0.75 + i * lineHeight));
}
