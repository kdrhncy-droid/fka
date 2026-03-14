import { Customer, TABLE_Y, EAT_TICKS } from '../types/game';

type CRS = {
    lastX: number; lastY: number;
    faceRight: boolean;
    bobPhase: number; bobAmount: number;
    beatUpShake: number;
    eatPhase: number;
};

const crs = new Map<string, CRS>();

function getCRS(id: string, x: number, y: number): CRS {
    if (!crs.has(id)) crs.set(id, {
        lastX: x, lastY: y, faceRight: true,
        bobPhase: 0, bobAmount: 0, beatUpShake: 0, eatPhase: 0,
    });
    return crs.get(id)!;
}

// Vücut şekli parametreleri
function bodyProps(shape: 1 | 2 | 3 | 4) {
    switch (shape) {
        case 2: return { bw: 28, bh: 20, hr: 16, neck: 2, leg: 11, feet: 9  }; // tombul
        case 3: return { bw: 16, bh: 12, hr: 11, neck: 5, leg: 20, feet: 6  }; // uzun ince
        case 4: return { bw: 25, bh: 17, hr: 13, neck: 1, leg: 9,  feet: 8  }; // kısa tıknaz
        default:return { bw: 21, bh: 15, hr: 13, neck: 3, leg: 15, feet: 7  }; // normal
    }
}

function stk(ctx: CanvasRenderingContext2D, color = '#1a0a0a', w = 3) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
}

const HAIR_COLORS = ['#2d1b0e','#1a1a1a','#5c3317','#8b4513','#2c2c54','#1a3a1a'];
function hairColor(id: string): string {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return HAIR_COLORS[hash % HAIR_COLORS.length];
}

function adj(hex: string, amt: number): string {
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
const lighten = (h: string, a: number) => adj(h, a);
const darken  = (h: string, a: number) => adj(h, -a);

// Dialog balonu çizme yardımcı fonksiyonu
function drawDialogBubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bgColor: string, borderColor: string, textColor: string) {
    const maxWidth = 180;
    const padding = 10;
    const lineHeight = 15;

    ctx.font = 'bold 11px Arial';
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth - padding * 2) {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        } else { currentLine = testLine; }
    }
    if (currentLine) lines.push(currentLine);

    const bubbleW = Math.min(maxWidth, Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2);
    const bubbleH = lines.length * lineHeight + padding * 2;
    const dbx = x - bubbleW / 2;
    const dby = y - 80 - bubbleH;

    // Gölge
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath(); ctx.roundRect(dbx + 2, dby + 2, bubbleW, bubbleH, 8); ctx.fill();

    // Arka plan
    ctx.fillStyle = bgColor;
    ctx.beginPath(); ctx.roundRect(dbx, dby, bubbleW, bubbleH, 8); ctx.fill();
    ctx.strokeStyle = borderColor; ctx.lineWidth = 1.5; ctx.stroke();

    // Ok ucu (aşağı bakan üçgen)
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.moveTo(x - 6, dby + bubbleH); ctx.lineTo(x + 6, dby + bubbleH); ctx.lineTo(x, dby + bubbleH + 8);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = borderColor; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 6, dby + bubbleH); ctx.lineTo(x, dby + bubbleH + 8); ctx.lineTo(x + 6, dby + bubbleH);
    ctx.stroke();

    // Metin
    ctx.fillStyle = textColor;
    ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((line, i) => { ctx.fillText(line, x, dby + padding + i * lineHeight); });
}

export function drawCustomer(ctx: CanvasRenderingContext2D, customer: Customer) {
    const { id, x, y, seatY, wants, patience, maxPatience, isSeated, isEating, eatTimer, beatUpTimer, currentDialog } = customer;
    const shape = customer.bodyShape ?? 1;
    const bodyColor = customer.bodyColor ?? '#475569';
    // facingUp: seatY < TABLE_Y → müşteri masanın üstündeki koltukta → aşağı (masaya/bize) bakıyor → ÖNDEN
    // facingUp: seatY > TABLE_Y → masanın altındaki koltukta → yukarı (masaya) bakıyor → ARKADAN
    const facingUp   = seatY !== undefined ? seatY < TABLE_Y : true;
    const facingBack = isSeated && !facingUp; // Arkasını dönerek oturuyor (yukarı bakıyor)
    const st = getCRS(id, x, y);

    const dx = x - st.lastX, dy = y - st.lastY;
    const moving = !isSeated && (dx * dx + dy * dy > 0.8);

    if (moving) {
        st.bobPhase  += 0.26;
        st.bobAmount  = Math.min(1, st.bobAmount + 0.16);
        if (Math.abs(dx) > 0.2) st.faceRight = dx > 0;
    } else {
        st.bobAmount = Math.max(0, st.bobAmount - 0.20);
        if (st.bobAmount > 0) st.bobPhase += 0.16;
        else st.bobPhase = 0;
    }
    if (isEating) st.eatPhase += 0.18;

    if (beatUpTimer && beatUpTimer > 0 && st.beatUpShake <= 0) st.beatUpShake = 28;
    if (st.beatUpShake > 0) st.beatUpShake--;
    st.lastX = x; st.lastY = y;

    const shakeX   = st.beatUpShake > 0 ? Math.sin(st.beatUpShake * 2) * 2 : 0;
    const bobY     = Math.abs(Math.sin(st.bobPhase)) * 4 * st.bobAmount;
    const tilt     = Math.sin(st.bobPhase) * 0.06 * st.bobAmount;
    const legSwing = moving ? Math.sin(st.bobPhase) * 6 : 0;
    const beatUp   = st.beatUpShake > 0;
    const eatPct   = isEating ? eatTimer / EAT_TICKS : 0;
    const eatBob   = isEating ? Math.sin(st.eatPhase) * 3 : 0; // Yemek yerken baş aşağı yukarı

    const { bw, bh, hr, neck, leg, feet } = bodyProps(shape);
    const hair = hairColor(id);
    const skin = '#f5c090';

    ctx.save();
    ctx.translate(x + shakeX, y);
    if (beatUp) ctx.globalAlpha = 0.88;

    // ── Zemin gölgesi (ayakta) ────────────────────────────────────────────────
    if (!isSeated) {
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath(); ctx.ellipse(0, 18, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.translate(0, -bobY + eatBob);
    ctx.rotate(tilt);
    if (!isSeated) ctx.scale(st.faceRight ? 1 : -1, 1);

    // ── BACAKLAR (ayakta) ─────────────────────────────────────────────────────
    if (!isSeated) {
        // Sol bacak
        ctx.beginPath(); ctx.roundRect(-bw / 2 - 2 + legSwing, bh / 2 + neck + 2, bw / 2 + 1, leg, [0, 0, 4, 4]);
        ctx.fillStyle = '#1a1a2e'; ctx.fill(); stk(ctx);
        // Sol ayak
        ctx.beginPath(); ctx.ellipse(-bw / 4 + legSwing, bh / 2 + neck + leg + 5, feet + 2, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill(); stk(ctx, '#000', 2);
        // Sağ bacak
        ctx.beginPath(); ctx.roundRect(1 - legSwing, bh / 2 + neck + 2, bw / 2 + 1, leg, [0, 0, 4, 4]);
        ctx.fillStyle = '#252540'; ctx.fill(); stk(ctx);
        // Sağ ayak
        ctx.beginPath(); ctx.ellipse(bw / 4 - legSwing, bh / 2 + neck + leg + 5, feet + 2, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill(); stk(ctx, '#000', 2);
    } else {
        // Oturmuş bacaklar (kısa, yatay)
        const legDir = facingBack ? -1 : 1; // Arkadaysa bacaklar diğer yönde
        ctx.beginPath(); ctx.roundRect(-bw / 2, legDir > 0 ? 10 : -18, bw, 8, 4);
        ctx.fillStyle = '#1a1a2e'; ctx.fill(); stk(ctx);
    }

    // ── GÖVDE ────────────────────────────────────────────────────────────────
    const bodyY = isSeated ? (facingBack ? -bh / 2 - 10 : -bh / 2 - 4) : -bh / 2;

    ctx.beginPath(); ctx.roundRect(-bw / 2 - 2, bodyY, bw + 4, bh + 4, 9);
    const bg = ctx.createLinearGradient(-bw / 2, bodyY, bw / 2, bodyY + bh);
    bg.addColorStop(0, beatUp ? '#ef4444' : lighten(bodyColor, 28));
    bg.addColorStop(1, beatUp ? '#dc2626' : bodyColor);
    ctx.fillStyle = bg; ctx.fill(); stk(ctx);

    // Kıyafet düğme çizgisi
    if (!facingBack) {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, bodyY + 3); ctx.lineTo(0, bodyY + bh - 2); ctx.stroke();
    }

    // Parlaklık
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath(); ctx.roundRect(-bw / 2, bodyY, bw, 6, [9, 9, 0, 0]); ctx.fill();

    // ── KOLLAR + ELLER ────────────────────────────────────────────────────────
    const armSwing = moving ? Math.sin(st.bobPhase + Math.PI) * 5 : 0;
    // Yemek yerken ön kol masaya uzanır
    const eatArmOffset = isEating ? Math.abs(Math.sin(st.eatPhase)) * 8 : 0;

    // Arka kol
    ctx.beginPath(); ctx.roundRect(-bw / 2 - 10, bodyY - 1 - armSwing, 9, bh - 2, 5);
    ctx.fillStyle = darken(bodyColor, 18); ctx.fill(); stk(ctx);
    // Arka el
    ctx.beginPath(); ctx.arc(-bw / 2 - 6, bodyY + bh - 3 - armSwing, 5, 0, Math.PI * 2);
    ctx.fillStyle = skin; ctx.fill(); stk(ctx, '#c8845a', 2);

    // Ön kol (yemek yerken masaya uzanır)
    ctx.beginPath(); ctx.roundRect(bw / 2 + 1, bodyY - 1 + armSwing + eatArmOffset, 9, bh - 2, 5);
    ctx.fillStyle = bodyColor; ctx.fill(); stk(ctx);
    // Ön el
    ctx.beginPath(); ctx.arc(bw / 2 + 5, bodyY + bh - 3 + armSwing + eatArmOffset, 5, 0, Math.PI * 2);
    ctx.fillStyle = skin; ctx.fill(); stk(ctx, '#c8845a', 2);

    // ── BAŞ ──────────────────────────────────────────────────────────────────
    const headY = bodyY - neck - hr - 2;

    // Boyun
    ctx.beginPath(); ctx.roundRect(-5, bodyY - neck, 10, neck + 4, 3);
    ctx.fillStyle = facingBack ? '#d4946e' : skin; ctx.fill();

    // ── ARKADAN GÖRÜNÜM ───────────────────────────────────────────────────────
    if (facingBack) {
        // Kafa (arkadan — sadece kafa şekli, saç yoğun)
        ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
        ctx.fillStyle = hair; ctx.fill(); stk(ctx);

        // Ense (boyun/cilt)
        ctx.beginPath(); ctx.arc(0, headY + hr - 3, hr * 0.45, 0, Math.PI);
        ctx.fillStyle = '#d4946e'; ctx.fill();

        // Saç detayı — ense çizgileri
        ctx.strokeStyle = darken(hair, 20); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-hr * 0.3, headY + 2); ctx.lineTo(-hr * 0.2, headY + hr - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, headY + 4); ctx.lineTo(0, headY + hr - 3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(hr * 0.3, headY + 2); ctx.lineTo(hr * 0.2, headY + hr - 4); ctx.stroke();

        // Kulaklar (her iki yanda görünür)
        ctx.beginPath(); ctx.ellipse(-hr - 1, headY + 2, 4, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f0b882'; ctx.fill(); stk(ctx, '#c8845a', 1.5);
        ctx.beginPath(); ctx.ellipse(hr + 1, headY + 2, 4, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f0b882'; ctx.fill(); stk(ctx, '#c8845a', 1.5);

    } else {
        // ── ÖNDEN GÖRÜNÜM ─────────────────────────────────────────────────────
        ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
        const hg = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, hr);
        hg.addColorStop(0, '#fde8cc'); hg.addColorStop(1, '#f0b882');
        ctx.fillStyle = hg; ctx.fill(); stk(ctx);

        // Saç
        ctx.beginPath(); ctx.arc(0, headY, hr, Math.PI, 0);
        ctx.fillStyle = hair; ctx.fill();
        ctx.beginPath(); ctx.arc(0, headY - hr + 4, hr * 0.7, Math.PI, 0);
        ctx.fillStyle = hair; ctx.fill();

        // Kulaklar
        ctx.beginPath(); ctx.ellipse(-hr - 1, headY + 2, 4, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f0b882'; ctx.fill(); stk(ctx, '#c8845a', 1.5);
        ctx.beginPath(); ctx.ellipse(hr + 1, headY + 2, 4, 6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f0b882'; ctx.fill(); stk(ctx, '#c8845a', 1.5);

        // Yanaklar
        ctx.fillStyle = 'rgba(255,130,100,0.25)';
        ctx.beginPath(); ctx.ellipse(-hr * 0.55, headY + 2, hr * 0.38, hr * 0.28, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hr * 0.55, headY + 2, hr * 0.38, hr * 0.28, 0.2, 0, Math.PI * 2); ctx.fill();

        // Gözler & Ağız
        const patiencePct = Math.max(0, patience / maxPatience);
        ctx.fillStyle = '#1a0a0a';

        if (patiencePct < 0.25 && !isEating) {
            // Kızgın
            ctx.beginPath(); ctx.ellipse(-hr * 0.38, headY - 1, 4, 3.5, 0.35, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(hr * 0.38, headY - 1, 4, 3.5, -0.35, 0, Math.PI * 2); ctx.fill();
            // Çatık kaşlar
            ctx.strokeStyle = '#1a0a0a'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(-hr * 0.55, headY - 6); ctx.lineTo(-hr * 0.18, headY - 3); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(hr * 0.55, headY - 6); ctx.lineTo(hr * 0.18, headY - 3); ctx.stroke();
            // Ters ağız
            ctx.beginPath(); ctx.arc(0, headY + 7, 5, Math.PI, 0); ctx.stroke();
        } else if (isEating) {
            // Yeme animasyonu — göz kırpma
            const blink = Math.sin(Date.now() / 200) > 0.5;
            if (blink) {
                ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(-hr * 0.42, headY); ctx.lineTo(-hr * 0.18, headY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(hr * 0.18, headY); ctx.lineTo(hr * 0.42, headY); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.ellipse(-hr * 0.30, headY, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(hr * 0.30, headY, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
            }
            // Mutlu ağız (açık, yiyor)
            ctx.strokeStyle = '#7a3020'; ctx.lineWidth = 2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(0, headY + 5, 6, 0.1, Math.PI - 0.1); ctx.stroke();
            // Ağız içi (açık ağız efekti)
            ctx.fillStyle = '#8B0000';
            ctx.beginPath(); ctx.arc(0, headY + 7, 3.5, 0, Math.PI); ctx.fill();
            // Yemek balonu
            ctx.globalAlpha = 0.9;
            ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('😋', hr + 8, headY - hr);
            ctx.globalAlpha = beatUp ? 0.88 : 1;
        } else {
            // Normal
            ctx.beginPath(); ctx.ellipse(-hr * 0.34, headY - 1, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(hr * 0.34, headY - 1, 3.5, 4.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.beginPath(); ctx.ellipse(-hr * 0.28, headY - 3, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(hr * 0.40, headY - 3, 1.5, 2, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#7a3020'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(0, headY + 5, 5, 0.2, Math.PI - 0.2); ctx.stroke();
        }
    }

    // ── Beat-up efekti ────────────────────────────────────────────────────────
    if (beatUp) {
        ctx.globalAlpha = Math.min(1, st.beatUpShake / 10);
        ctx.font = '16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💫', hr + 4, headY - hr - 4);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // ── SİPARİŞ BALONU & SABIR ÇUBUĞU ──────────────────────────────────────
    // isLeaving ise sadece dialog balonu göster, sipariş balonu ve sabrı gösterme
    if (customer.isLeaving) {
        if (currentDialog) {
            drawDialogBubble(ctx, currentDialog, x, y, '#fef2f2', '#ef4444', '#7f1d1d');
        }
        return;
    }

    if (customer.isBeatUp || !wants) return;

    const bar    = Math.max(0, patience / maxPatience);
    const barClr = bar > 0.5 ? '#22c55e' : bar > 0.25 ? '#f59e0b' : '#ef4444';

    // Balon pozisyonu
    const bx   = x + (isSeated ? 38 : 36);
    const by   = y + (isSeated ? (facingBack ? -70 : 18) : -52);
    const barY = y + (isSeated ? (facingBack ? -78 : 52) : 20);

    // Balon rengi — sabır azaldıkça kırmızıya kayar
    const bubbleBg = bar > 0.5 ? '#ffffff'
                   : bar > 0.25 ? '#fffbeb'
                   : '#fff1f2';

    const BW = 46, BH = 46, BR = 12;

    // Balon gölgesi
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.beginPath(); ctx.roundRect(bx - BW / 2 + 3, by - BH / 2 + 3, BW, BH, BR); ctx.fill();

    // Balon arka plan
    ctx.fillStyle = bubbleBg;
    ctx.beginPath(); ctx.roundRect(bx - BW / 2, by - BH / 2, BW, BH, BR); ctx.fill();
    ctx.strokeStyle = barClr; ctx.lineWidth = 2.5; ctx.stroke();

    // İnce iç parlama
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.roundRect(bx - BW / 2 + 4, by - BH / 2 + 4, BW - 8, 10, [BR, BR, 0, 0]); ctx.fill();

    // Ok ucu (balon → karakter)
    const tailX = bx - BW / 2;
    const tipX  = x + 14;
    const tipY  = isSeated && !facingBack ? y + 6 : y - 6;
    const tailTop = by + (isSeated && !facingBack ? -BH / 2 + 4 : BH / 2 - 4);

    ctx.fillStyle = bubbleBg;
    ctx.beginPath();
    ctx.moveTo(tailX, tailTop - 5);
    ctx.quadraticCurveTo(tailX - 6, tailTop + 8, tipX, tipY);
    ctx.quadraticCurveTo(tailX + 2, tailTop + 6, tailX + 10, tailTop + 2);
    ctx.closePath();
    ctx.fill();

    // Ok ucu kenar çizgisi
    ctx.strokeStyle = barClr; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailTop - 5);
    ctx.quadraticCurveTo(tailX - 6, tailTop + 8, tipX, tipY);
    ctx.quadraticCurveTo(tailX + 2, tailTop + 6, tailX + 10, tailTop + 2);
    ctx.stroke();

    // Sipariş emojisi
    ctx.font = '26px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(wants ?? '?', bx, by + 1);

    // Sabır çubuğu
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.roundRect(x - 24, barY, 48, 8, 4); ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath(); ctx.roundRect(x - 24, barY, 48, 7, 3); ctx.fill();
    ctx.fillStyle = barClr;
    ctx.beginPath(); ctx.roundRect(x - 24, barY, 48 * bar, 7, 3); ctx.fill();

    // ── DIALOG BALONU ──────────────────────────────────────────────────────────
    if (currentDialog) {
        drawDialogBubble(ctx, currentDialog, x, y, '#fffbeb', '#f59e0b', '#1c1917');
    }
}
