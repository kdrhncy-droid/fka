import { CookStation, RECIPE_DEFS, BURN_TICKS, BURNED_FOOD } from '../types/game';

// Duman parçacıkları için basit bir state
const smokeParticles: { x: number; y: number; age: number; vx: number; vy: number; size: number }[] = [];

function updateSmoke(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number) {
    // Yeni parçacık ekle
    if (Math.random() < intensity) {
        smokeParticles.push({
            x: x + (Math.random() - 0.5) * 20,
            y: y - 10,
            age: 0,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -0.8 - Math.random() * 0.5,
            size: 4 + Math.random() * 6
        });
    }

    // Parçacıkları güncelle ve çiz
    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.age += 0.02;
        p.size += 0.1;

        if (p.age > 1) {
            smokeParticles.splice(i, 1);
            continue;
        }

        ctx.globalAlpha = (1 - p.age) * 0.4;
        ctx.fillStyle = intensity > 0.5 ? '#333' : '#ddd'; // Yandığında koyu duman
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

export function drawCookStation(
    ctx: CanvasRenderingContext2D,
    station: CookStation,
    time: number,
) {
    const { x, y } = station;
    const w = 76, h = 58;

    // ── 3D Fırın / İstasyon Görünümü ──────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + h / 2 + 5, w * 0.55, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    let frontColorA = '#4b5563';
    let frontColorB = '#1f2937';
    let topColorA   = '#6b7280';
    let topColorB   = '#374151';
    let winColor    = '#0f172a';
    let glowColor   = '';
    let borderColor = '#111827';

    if (station.input) {
        frontColorA = '#c2410c';
        frontColorB = '#7c2d12';
        topColorA   = '#f97316';
        topColorB   = '#ea580c';
        winColor    = '#431407';
        glowColor   = 'rgba(251,146,60,0.35)';
        borderColor = '#7c2d12';
        updateSmoke(ctx, x, y - 20, 0.1);
    } else if (station.isBurned) {
        frontColorA = '#1c1917';
        frontColorB = '#0c0a09';
        topColorA   = '#292524';
        topColorB   = '#1c1917';
        winColor    = '#000';
        borderColor = '#0c0a09';
        updateSmoke(ctx, x, y - 20, 0.6);
    } else if (station.output) {
        frontColorA = '#166534';
        frontColorB = '#14532d';
        topColorA   = '#22c55e';
        topColorB   = '#16a34a';
        glowColor   = 'rgba(74,222,128,0.25)';
        borderColor = '#14532d';
    }

    const topDepth = 22;
    const boxY = y - h / 2 + 10;

    // ── Ön yüz ───────────────────────────────────────────────────────────────
    const frontGrad = ctx.createLinearGradient(x, boxY, x, boxY + h - 10);
    frontGrad.addColorStop(0, frontColorA);
    frontGrad.addColorStop(1, frontColorB);
    ctx.fillStyle = frontGrad;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, boxY, w, h - 10, 8);
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // kontrol düğmeleri (üst panel)
    const btnY = boxY + 6;
    [x - 18, x, x + 18].forEach((bx, i) => {
        const colors = ['#ef4444', '#374151', '#374151'];
        const inner  = ['#fca5a5', '#6b7280', '#6b7280'];
        ctx.fillStyle = colors[i];
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, btnY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = inner[i];
        ctx.beginPath();
        ctx.arc(bx, btnY, 2, 0, Math.PI * 2);
        ctx.fill();
    });

    // ── Üst yüz (trapez) ─────────────────────────────────────────────────────
    const topGrad = ctx.createLinearGradient(x, boxY - topDepth, x, boxY);
    topGrad.addColorStop(0, topColorA);
    topGrad.addColorStop(1, topColorB);
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, boxY);
    ctx.lineTo(x - w / 2 + 12, boxY - topDepth);
    ctx.lineTo(x + w / 2 - 12, boxY - topDepth);
    ctx.lineTo(x + w / 2, boxY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // üst yüz parlama
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 12, boxY - topDepth);
    ctx.lineTo(x - w / 2 + 30, boxY - topDepth);
    ctx.lineTo(x - w / 2 + 18, boxY - topDepth * 0.5);
    ctx.lineTo(x - w / 2 + 1, boxY - topDepth * 0.5);
    ctx.closePath();
    ctx.fill();

    // ── Cam kapı ─────────────────────────────────────────────────────────────
    const winW = w * 0.65;
    const winH = (h - 10) * 0.45;
    const winY = boxY + 14;

    ctx.fillStyle = winColor;
    ctx.beginPath();
    ctx.roundRect(x - winW / 2, winY, winW, winH, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (glowColor) {
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.roundRect(x - winW / 2, winY, winW, winH, 4);
        ctx.fill();
    }

    // cam sol parlama
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(x - winW / 2, winY);
    ctx.lineTo(x + winW / 2 - 12, winY);
    ctx.lineTo(x + winW / 2 - 26, winY + winH);
    ctx.lineTo(x - winW / 2, winY + winH);
    ctx.closePath();
    ctx.fill();

    // ── Kol ──────────────────────────────────────────────────────────────────
    const kolY = boxY + h - 14;
    ctx.fillStyle = '#4b5563';
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 16, kolY, 32, 5, 2.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(x, kolY + 2.5, 4, 0, Math.PI * 2);
    ctx.fill();

    const contentY = boxY - topDepth / 2;

    if (station.input && station.timer > 0) {
        const recipe = RECIPE_DEFS[station.input as keyof typeof RECIPE_DEFS];
        if (!recipe) return;
        
        const progress = 1 - station.timer / recipe.time;
        const radius = 16;
        // Gösterilecek emoji — CHOPPED_ prefix'ini soy
        const displayInput = station.input.startsWith('CHOPPED_')
            ? station.input.replace('CHOPPED_', '')
            : station.input;

        // Progress Ring (Geliştirilmiş)
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(x, contentY - 30, radius, 0, Math.PI * 2);
        ctx.stroke();

        const grad = ctx.createLinearGradient(x - radius, contentY - 30, x + radius, contentY - 30);
        grad.addColorStop(0, '#fbbf24');
        grad.addColorStop(1, '#f59e0b');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, contentY - 30, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.stroke();

        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayInput, x, contentY - 30);

        // İlerleme yüzdesi
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(`${Math.round(progress * 100)}%`, x, contentY - 10);
        ctx.fillText(`${Math.round(progress * 100)}%`, x, contentY - 10);

    } else if (station.isBurned) {
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(BURNED_FOOD, x, contentY - 25);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText('YANDI!', x, contentY - 5);
        ctx.fillText('YANDI!', x, contentY - 5);

    } else if (station.output) {
        const pulse = 1 + Math.sin(time / 150) * 0.1;
        ctx.save();
        ctx.translate(x, contentY - 30);
        ctx.scale(pulse, pulse);
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(station.output, 0, 0);
        ctx.restore();

        // Tabak ipucu
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🍽️ tabakla al', x, contentY - 10);

        if (station.burnTimer !== undefined && station.burnTimer > 0) {
            const burnPct = Math.max(0, 1 - station.burnTimer / BURN_TICKS);
            
            // Tehlike Barı (Geliştirilmiş)
            const barW = 40;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.roundRect(x - barW / 2, contentY - 10, barW, 8, 4);
            ctx.fill();

            const barColor = burnPct > 0.8 ? '#ef4444' : (burnPct > 0.5 ? '#f97316' : '#facc15');
            ctx.fillStyle = barColor;
            ctx.beginPath();
            ctx.roundRect(x - barW / 2 + 1, contentY - 9, (barW - 2) * burnPct, 6, 3);
            ctx.fill();

            if (burnPct > 0.7 && Math.floor(time / 200) % 2 === 0) {
                ctx.font = '16px Arial';
                ctx.fillText('🔥', x + 25, contentY - 35);
            }
        }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Fırın ${station.id.replace('oven', '')}`, x, y + h / 2 - 2);
}
