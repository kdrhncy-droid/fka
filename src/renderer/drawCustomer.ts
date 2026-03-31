import { Customer } from '../types/game';
import { stk, adjustColor, lighten, darken, drawShadowEllipse } from './rendererUtils';

type CRS = {
    lastX: number; lastY: number;
    faceRight: boolean;
    bobPhase: number; bobAmount: number;
    beatUpShake: number;
    eatPhase: number;
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
        bobPhase: 0, bobAmount: 0, beatUpShake: 0, eatPhase: 0,
    });
    return crs.get(id)!;
}

// Chibi vücut şekli parametreleri (Kafa yarıçapları 100/15 oranında küçültüldü)
function chibiBodyProps(shape: 1 | 2 | 3 | 4) {
    switch (shape) {
        case 2: return { bw: 32, bh: 22, hr: 20.4 }; // Tombul Chibi (24 -> 20.4)
        case 3: return { bw: 22, bh: 26, hr: 17 };   // Uzun Chibi (20 -> 17)
        case 4: return { bw: 28, bh: 18, hr: 18.7 }; // Kısa Chibi (22 -> 18.7)
        default:return { bw: 26, bh: 22, hr: 18.7 }; // Normal Chibi (22 -> 18.7)
    }
}

const HAIR_COLORS = ['#2d1b0e','#1a1a1a','#5c3317','#8b4513','#2c2c54','#1a3a1a'];
function hairColor(id: string): string {
    const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return HAIR_COLORS[hash % HAIR_COLORS.length];
}

export function drawCustomer(ctx: CanvasRenderingContext2D, customer: Customer, tableLayout?: Record<string, { id: string; x: number; y: number }>, hidePatience = false) {
    const { id, x, y, seatX, seatY, wants, patience, maxPatience, isSeated, isEating, eatTimer, beatUpTimer, currentDialog } = customer;
    const shape = customer.bodyShape ?? 1;
    const bodyColor = customer.bodyColor ?? '#475569';
    
    let tableY = 500;
    if (tableLayout) {
      let nearestTable: { id: string; x: number; y: number } | null = null;
      let minD = Infinity;
      for (const t of Object.values(tableLayout)) {
        const d = Math.hypot(t.x - seatX, t.y - seatY);
        if (d < minD && d < 75) {
          minD = d;
          nearestTable = t;
        }
      }
      if (nearestTable) tableY = nearestTable.y;
      else tableY = seatY < 500 ? seatY + 47 : seatY - 47;
    } else {
      tableY = seatY < 500 ? seatY + 47 : seatY - 47;
    }
    const facingUp   = seatY !== undefined ? seatY < tableY : true;
    const facingBack = isSeated && !facingUp;
    const st = getCRS(id, x, y);

    const dx = x - st.lastX, dy = y - st.lastY;
    const moving = !isSeated && (dx * dx + dy * dy > 0.8);

    if (moving) {
        st.bobPhase  += 0.35;
        st.bobAmount  = Math.min(1, st.bobAmount + 0.25);
        if (Math.abs(dx) > 0.2) st.faceRight = dx > 0;
    } else {
        st.bobAmount = Math.max(0, st.bobAmount - 0.2);
        if (st.bobAmount > 0) st.bobPhase += 0.25;
        else st.bobPhase = 0;
    }
    if (isEating) st.eatPhase += 0.2;

    if (beatUpTimer && beatUpTimer > 0 && st.beatUpShake <= 0) st.beatUpShake = 25;
    if (st.beatUpShake > 0) st.beatUpShake--;
    st.lastX = x; st.lastY = y;

    const shakeX   = st.beatUpShake > 0 ? Math.sin(st.beatUpShake * 2) * 3 : 0;
    const bobY     = Math.abs(Math.sin(st.bobPhase)) * 5 * st.bobAmount;
    const swing    = moving ? Math.sin(st.bobPhase) * 6 : 0;
    const eatBob   = isEating ? Math.sin(st.eatPhase) * 4 : 0;

    const { bw, bh, hr } = chibiBodyProps(shape);
    const hair = hairColor(id);
    const skin = '#f5c090';

    ctx.save();
    ctx.translate(x + shakeX, y);
    if (st.beatUpShake > 0) ctx.globalAlpha = 0.9;

    // ── Zemin gölgesi ────────────────────────────────────────────────────────
    if (!isSeated) {
        drawShadowEllipse(ctx, 0, 25, 18, 8, 0.2);
    }

    ctx.translate(0, -bobY + eatBob);
    if (!isSeated) ctx.scale(st.faceRight ? 1 : -1, 1);

    // ── AYAKLAR ──────────────────────────────────────────────────────────────
    if (!isSeated) {
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(-8 + swing, 20, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
        ctx.beginPath(); ctx.arc(8 - swing, 20, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.5);
    } else {
        const legDir = facingBack ? -1 : 1;
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.roundRect(-bw/2, legDir > 0 ? 12 : -15, bw, 6, 3); ctx.fill(); stk(ctx, '#000', 1.5);
    }

    // ── GÖVDE ────────────────────────────────────────────────────────────────
    const bodyY = isSeated ? (facingBack ? -bh/2 - 8 : -bh/2 - 2) : -bh/2 + 2;
    ctx.beginPath(); ctx.roundRect(-bw/2, bodyY, bw, bh, 10);
    const bg = ctx.createLinearGradient(0, bodyY, 0, bodyY + bh);
    bg.addColorStop(0, st.beatUpShake > 0 ? '#ef4444' : lighten(bodyColor, 20));
    bg.addColorStop(1, st.beatUpShake > 0 ? '#dc2626' : bodyColor);
    ctx.fillStyle = bg; ctx.fill(); stk(ctx, '#000', 2);

    // ── ELLER ────────────────────────────────────────────────────────────────
    const handY = bodyY + bh/2;
    const handX = bw/2 + 4;
    ctx.fillStyle = skin;
    if (isEating) {
        ctx.beginPath(); ctx.arc(-handX + 4, handY + 4, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
        ctx.beginPath(); ctx.arc(handX - 4, handY + 4, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
    } else if (!isSeated) {
        const armSwing = Math.sin(st.bobPhase) * 4;
        ctx.beginPath(); ctx.arc(-handX, handY + armSwing, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
        ctx.beginPath(); ctx.arc(handX, handY - armSwing, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1.2);
    }

    // ── KAFA ──────────────────────────────────────────────────────────────────
    const headY = bodyY - hr + 4;
    
    if (facingBack) {
        ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
        ctx.fillStyle = hair; ctx.fill(); stk(ctx, '#000', 2);
    } else {
        ctx.beginPath(); ctx.arc(0, headY, hr, 0, Math.PI * 2);
        const hg = ctx.createRadialGradient(-4, headY - 4, 2, 0, headY, hr);
        hg.addColorStop(0, '#fff1e0'); hg.addColorStop(1, '#f5c090');
        ctx.fillStyle = hg; ctx.fill(); stk(ctx, '#000', 2);

        ctx.fillStyle = hair;
        ctx.beginPath(); ctx.arc(0, headY, hr, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.arc(0, headY - hr + 5, hr * 0.8, Math.PI, 0); ctx.fill();

        ctx.fillStyle = '#222';
        const eyeY = headY + 2;
        const eyeX = hr * 0.35;
        ctx.beginPath(); ctx.ellipse(-eyeX, eyeY, 2.8, 4.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(eyeX, eyeY, 2.8, 4.2, 0, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-eyeX + 1, eyeY - 1.5, 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(eyeX + 1, eyeY - 1.5, 1.1, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = 'rgba(255,182,193,0.4)';
        ctx.beginPath(); ctx.arc(-hr * 0.6, headY + 5, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hr * 0.6, headY + 5, 3.5, 0, Math.PI * 2); ctx.fill();
    }

    // ── SABIR ÇUBUĞU ─────────────────────────────────────────────────────────
    if (isSeated && !isEating && patience < maxPatience && !hidePatience) {
        const barW = 35;
        const barH = 5;
        const bx = -barW / 2;
        const by = headY - hr - 12;
        const pct = patience / maxPatience;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.roundRect(bx, by, barW, barH, 2.5); ctx.fill();
        ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';
        ctx.beginPath(); ctx.roundRect(bx, by, barW * pct, barH, 2.5); ctx.fill();
    }

    if (currentDialog) {
        drawDialogBubble(ctx, currentDialog, 0, headY - hr - 10, '#fff', bodyColor, '#333');
    } else if (wants && isSeated && !isEating) {
        const bx = 0, by = headY - hr - 22;
        const specialReq = customer.specialRequest;
        const specialIcon = specialReq === 'spicy' ? '🌶️' : specialReq === 'extra' ? '➕' : specialReq === 'quick' ? '⚡' : null;
        // Özel istek varsa balonu biraz genişlet
        const bubbleR = specialIcon ? 16 : 12;
        ctx.fillStyle = specialIcon ? (specialReq === 'quick' ? '#fef3c7' : '#fff0f0') : '#fff';
        ctx.beginPath(); ctx.arc(bx, by, bubbleR, 0, Math.PI * 2); ctx.fill();
        stk(ctx, specialIcon ? (specialReq === 'quick' ? '#f59e0b' : '#ef4444') : bodyColor, 1.8);
        ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(wants, bx - (specialIcon ? 5 : 0), by);
        if (specialIcon) {
            ctx.font = '11px Arial';
            ctx.fillText(specialIcon, bx + bubbleR - 2, by - bubbleR + 2);
        }
    }

    ctx.restore();
}

function drawDialogBubble(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, bgColor: string, borderColor: string, textColor: string) {
    const maxWidth = 130;
    const padding = 7;
    const lineHeight = 13;
    ctx.font = 'bold 9px Arial';
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
    const bubbleW = Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2;
    const bubbleH = lines.length * lineHeight + padding * 2;
    const dbx = x - bubbleW / 2;
    const dby = y - bubbleH;
    ctx.fillStyle = bgColor;
    ctx.beginPath(); ctx.roundRect(dbx, dby, bubbleW, bubbleH, 7); ctx.fill();
    ctx.strokeStyle = borderColor; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((line, i) => { ctx.fillText(line, x, dby + padding + i * lineHeight); });
}
