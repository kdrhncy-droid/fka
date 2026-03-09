import { Player, CHARACTER_TYPES, CLEAN_PLATE, DIRTY_PLATE, isTray, getTrayItems } from '../types/game';

/**
 * Oyuncu çizer — karakter tipine göre farklı görünüm
 */
// ─── LOCAL STATE FOR ANIMATION ───────────────────────────────────────────────
// Karakterlerin yürüdüğünü anlamak ve sağa/sola döndüklerini bilmek için
// geçici (sadece görsel) bir state tutuyoruz.
const playerRenderState = new Map<string, { lastX: number; lastY: number; faceRight: boolean; walkTimer: number; isMoving: boolean }>();

export function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    p: Player,
    isMe: boolean,
) {
    const heldItem = p.holding === CLEAN_PLATE ? '🍽️' : p.holding === DIRTY_PLATE ? '🧽' : p.holding;
    const typeId = Math.min(p.charType ?? 0, CHARACTER_TYPES.length - 1);
    const charDef = CHARACTER_TYPES[typeId];
    const bodyColor = p.color || charDef.bodyColor;
    const accentColor = charDef.accent;

    // ── Animasyon State Yönetimi ──────────────────────────────────────────────
    if (!playerRenderState.has(p.id)) {
        playerRenderState.set(p.id, { lastX: x, lastY: y, faceRight: true, walkTimer: 0, isMoving: false });
    }
    const state = playerRenderState.get(p.id)!;

    // Hareket ediyor mu? (Son frame'e göre konumu değişti mi?)
    const dx = x - state.lastX;
    const dy = y - state.lastY;
    const distSq = dx * dx + dy * dy;

    state.isMoving = distSq > 0.5; // Çok ufak titremeleri yoksay

    // Yön belirleme (Sadece belirgin bir yatay hareket varsa yön değişir)
    if (Math.abs(dx) > 0.5) {
        state.faceRight = dx > 0;
    }

    // Yürüme Sayacı (Zıp zıp efekti için zamanlayıcı artar)
    if (state.isMoving) {
        state.walkTimer += 0.3; // Hız faktörü
    } else {
        // Durduğunda yavaşça merkeze dön (hemen 0'lanmasın küt diye durmasın)
        state.walkTimer = state.walkTimer % (Math.PI * 2);
        if (state.walkTimer > 0) {
            state.walkTimer += 0.3;
            if (state.walkTimer >= Math.PI * 2) state.walkTimer = 0;
        }
    }

    // Son konumu kaydet (bir sonraki frame için)
    state.lastX = x;
    state.lastY = y;

    // ── Matematiksel Zıplama (Bobbing Y calculation) ───────────────────────────
    // Sadece yürüyorlarsa aşağı yukarı zıplasınlar
    const bobbingY = state.isMoving || state.walkTimer > 0 ? Math.abs(Math.sin(state.walkTimer)) * 6 : 0;

    // Sadece yürüyorlarsa sağa sola sallansınlar (penguen yürüyüşü açısı)
    const tiltAngle = state.isMoving ? Math.sin(state.walkTimer) * 0.15 : 0;

    // Yön katsayısı (1 = Sağa, -1 = Sola)
    const directionMul = state.faceRight ? 1 : -1;

    // ─────────────────────────────────────────────────────────────────────────

    ctx.save();
    ctx.translate(x, y);

    // ── 0. Zemin Gölgesi (Aura ve gölge) ──────────────────────────────────────────────────
    // Aura ve Zemin Gölgesi zıplamaz, yerde kalır!
    if (isMe) {
        ctx.fillStyle = 'rgba(99,179,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 18, 28, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Gölge karakter zıpladıkça küçülüp büyür
    const shadowScale = 1 - (bobbingY / 30);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 20 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── AŞAĞIDAKİ HER ŞEY (Karakterin kendisi) Zıplama (bobbingY) ve Eğilmeden (tilt) etkilenir ──
    ctx.translate(0, -bobbingY); // Zıplama
    ctx.rotate(tiltAngle);       // Yalpalamak

    // Dönme Efekti (Sağa/Sola aynalama)
    // Sadece Yüzü ve Gövdeyi döndürüyoruz ki gözler ve eller yön değiştirsin
    ctx.scale(directionMul, 1);

    // ── 1. Kapsül Gövde (Vücut) ────────────────────────────────────────────────────────
    const bodyWidth = 32;
    const bodyHeight = 28;
    const bodyRadius = 16;

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2 + 8, bodyWidth, bodyHeight - 8, [0, 0, bodyRadius, bodyRadius]);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2 - 12, bodyWidth, 20, [bodyRadius, bodyRadius, 0, 0]);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(-bodyWidth / 2 + 4, -bodyHeight / 2 - 8, 6, bodyHeight - 4, 10);
    ctx.fill();

    // ── 2. Eller / Kollar ────────────────────────────────────────────────
    ctx.fillStyle = '#fce7c3';

    // Elde tabak varsa kollar zıplamayla ileri geri hareket edebilir
    const handSwing = state.isMoving && !heldItem ? Math.sin(state.walkTimer) * 5 : 0;

    if (heldItem) {
        ctx.beginPath(); ctx.arc(-10, -5, 6, 0, Math.PI * 2); ctx.fill(); // Arka El
        ctx.beginPath(); ctx.arc(10, -5, 6, 0, Math.PI * 2); ctx.fill();  // Ön El
    } else {
        // Yürürken zıt kollar sallanır
        ctx.beginPath(); ctx.arc(-18 + handSwing, 5, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(18 - handSwing, 5, 6, 0, Math.PI * 2); ctx.fill();
    }

    // ── 3. Elde tutulan obje (ellerin hemen üstünde/önünde) ──────────────────────────
    // Yüzümüzü directionMul ile çevirmiştik ama yazının ters dönmemesi lazım!!
    if (heldItem) {
        ctx.save();
        ctx.scale(directionMul, 1); // Yazı düz okunsun diye ters yönde bir daha çeviriyoruz

        // objenin duracağı yer X olarak karakterin yüzüne göre önde (sağında)
        const holdX = directionMul > 0 ? 12 : -12;

        if (isTray(p.holding)) {
            // -- TEPSİ VE ÜZERİNDEKİLER --
            const items = getTrayItems(p.holding);

            // Tepsi hafif sallanma efekti (yürürken)
            const trayTilt = state.isMoving ? Math.sin(state.walkTimer * 1.5) * 0.08 : 0;
            ctx.save();
            ctx.translate(holdX, -8);
            ctx.rotate(trayTilt);

            // Tepsi gölgesi (derinlik hissi)
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.beginPath();
            ctx.ellipse(0, 4, 26, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tepsi ana gövde (metalik görünüm için gradient)
            const trayGradient = ctx.createRadialGradient(0, -2, 5, 0, 0, 25);
            trayGradient.addColorStop(0, '#e2e8f0');
            trayGradient.addColorStop(0.5, '#cbd5e1');
            trayGradient.addColorStop(1, '#94a3b8');
            ctx.fillStyle = trayGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tepsi kenar çizgisi (parlak metal efekti)
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // İç kenar highlight (3D efekti)
            ctx.strokeStyle = '#f1f5f9';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, -1, 22, 6, 0, 0.2, Math.PI - 0.2);
            ctx.stroke();

            // Tepsi tutma yerleri (iki yanda)
            [-24, 24].forEach(handleX => {
                ctx.fillStyle = '#94a3b8';
                ctx.beginPath();
                ctx.ellipse(handleX, 0, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#64748b';
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Tepsi içindeki objeleri yığarak çiz
            if (items.length === 0) {
                // Boş tepsi - hafif bir işaret göster
                ctx.fillStyle = 'rgba(100, 116, 139, 0.3)';
                ctx.font = 'italic 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('boş', 0, 0);
            } else {
                items.forEach((item, i) => {
                    const stackOffset = items.length > 1 ? 8 : 6; // Çok item varsa daha sık yığ
                    const drawY = -8 - (i * stackOffset);

                    // Her item için hafif bir gölge
                    ctx.fillStyle = 'rgba(0,0,0,0.1)';
                    ctx.beginPath();
                    ctx.ellipse(0, drawY + 2, 14, 4, 0, 0, Math.PI * 2);
                    ctx.fill();

                    if (item === DIRTY_PLATE || item === CLEAN_PLATE) {
                        // Tabak çizimi (3D görünüm)
                        const plateGradient = ctx.createRadialGradient(0, drawY - 1, 2, 0, drawY, 16);
                        if (item === DIRTY_PLATE) {
                            plateGradient.addColorStop(0, '#f8fafc');
                            plateGradient.addColorStop(1, '#e2e8f0');
                        } else {
                            plateGradient.addColorStop(0, '#ffffff');
                            plateGradient.addColorStop(1, '#f8fafc');
                        }
                        ctx.fillStyle = plateGradient;
                        ctx.beginPath();
                        ctx.ellipse(0, drawY, 16, 5, 0, 0, Math.PI * 2);
                        ctx.fill();

                        // Tabak kenarı
                        ctx.strokeStyle = item === DIRTY_PLATE ? '#94a3b8' : '#cbd5e1';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();

                        // Kirli tabakta leke efekti
                        if (item === DIRTY_PLATE) {
                            ctx.fillStyle = 'rgba(146, 64, 14, 0.4)';
                            ctx.beginPath();
                            ctx.arc(-5, drawY - 1, 2, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.arc(4, drawY + 1, 1.5, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.beginPath();
                            ctx.arc(0, drawY + 2, 1.2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    } else {
                        // Yemek veya diğer itemler - emoji olarak göster
                        const icon = item === CLEAN_PLATE ? '🍽️' : item === DIRTY_PLATE ? '🧽' : item;
                        
                        // Yemek altına beyaz tabak çiz
                        if (icon !== '🍽️' && icon !== '🧽' && icon !== '🫓' && icon !== '🥩' && icon !== '🥬') {
                            const plateGradient = ctx.createRadialGradient(0, drawY + 2, 2, 0, drawY + 3, 16);
                            plateGradient.addColorStop(0, '#ffffff');
                            plateGradient.addColorStop(1, '#f8fafc');
                            ctx.fillStyle = plateGradient;
                            ctx.beginPath();
                            ctx.ellipse(0, drawY + 3, 16, 5, 0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.strokeStyle = '#cbd5e1';
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                        }

                        // Emoji çiz
                        ctx.font = '18px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(icon, 0, drawY - 4);
                    }
                });

                // Item sayısı göstergesi (sağ üst köşede badge)
                if (items.length > 1) {
                    ctx.fillStyle = '#3b82f6';
                    ctx.beginPath();
                    ctx.arc(20, -12, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 10px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(items.length.toString(), 20, -12);
                }
            }

            ctx.restore(); // Tepsi transform'unu sıfırla
        } else {
            // -- TEKLİ OBJE --
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.beginPath(); ctx.ellipse(holdX, -6, 18, 5, 0, 0, Math.PI * 2); ctx.fill();

            ctx.fillStyle = 'white';
            ctx.beginPath(); ctx.ellipse(holdX, -8, 18, 8, 0, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.font = '22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(heldItem, holdX, -12);
        }

        ctx.restore();
    }

    // ── 4. Ayrı Duran Kafa ──────────────────────────────────────────────────
    // Kafa yürürken biraz daha dalgalanır
    const headBobY = state.isMoving ? Math.cos(state.walkTimer) * 2 : 0;
    const headY = -30 + headBobY;

    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath(); ctx.ellipse(0, -22, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#fce7c3';
    ctx.beginPath(); ctx.arc(0, headY, 15, 0, Math.PI * 2); ctx.fill();

    // ── 5. Yüz İfadeleri ────────────────────────────────────────────────────────────────
    // Yüze de hafif bakış yönü veriyoruz (Tam ortada değil, baktığı yöne doğru kayık)
    const faceOffsetX = 4; // Yüz biraz baktığı yöne kaysın (Çünkü zaten scale(directionMul,1) ile çevirdik, hep pozitif vereceğiz)

    const eyeY = headY - 2;
    [-4, 6].forEach(ox => {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.ellipse(ox + faceOffsetX, eyeY, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(ox + faceOffsetX + 1, eyeY - 1.5, 1.2, 0, Math.PI * 2); ctx.fill();
    });

    ctx.strokeStyle = '#7c3f00';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(faceOffsetX, headY + 5, 4, 0.2, Math.PI - 0.2); ctx.stroke();

    // ── 6. Şapka (Emoji) ────────────────────────────────────────────────────────────────
    ctx.save();
    ctx.scale(directionMul, 1); // Emojiler aynalanmasın (Pizza falan ters durmasın)
    const hat = p.hat ?? '';
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(hat, directionMul * faceOffsetX, headY - 15);
    ctx.restore();

    ctx.restore(); // Tüm transformasyonları sıfırla (İsim etiketi düz kalsın diye)

    // ── 7. İsim Etiketi (Zıplamaz, Adamın altında sabit durur) ──────────────────────
    const nameW = ctx.measureText(p.name).width + 16;

    // Arka plan - Kendi karakterin mavimsi, diğerleri koyu gri
    if (isMe) {
        // Kendi karakterin - Mavi gradient
        const gradient = ctx.createLinearGradient(x - nameW / 2, y + 26, x + nameW / 2, y + 44);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.95)'); // blue-500
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.95)');  // blue-600
        ctx.fillStyle = gradient;
    } else {
        // Diğer oyuncular - Koyu gri
        ctx.fillStyle = 'rgba(30, 41, 59, 0.95)'; // slate-800
    }
    
    ctx.beginPath();
    ctx.roundRect(x - nameW / 2, y + 26, nameW, 18, 6);
    ctx.fill();

    // Kenar çizgisi (daha belirgin)
    ctx.strokeStyle = isMe ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // İsim yazısı - Her zaman beyaz ve kalın
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Yazı gölgesi (daha okunabilir)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(p.name, x, y + 36);
    
    // Gölgeyi sıfırla
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
}

