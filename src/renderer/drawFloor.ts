import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_Y1,
  DOOR_RANGES,
  INGREDIENTS,
  TRASH_STATION,
  SINK_STATION,
  HOLDING_STATION_POSITIONS,
  COUNTER_POSITIONS,
} from "../types/game";

/** Restoran zemini — PlateUp tarzı koyu mutfak + sıcak ahşap salon */
export function drawFloor(ctx: CanvasRenderingContext2D) {

  // ══════════════════════════════════════════════════════════════════
  // SALON — sıcak açık ahşap parke (PlateUp dining room tonu)
  // ══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#e8d8b8';
  ctx.fillRect(0, WALL_Y1, GAME_WIDTH, GAME_HEIGHT - WALL_Y1);

  // Parke yatay bantlar
  const plankH = 36;
  for (let ry = 0; ry < Math.ceil((GAME_HEIGHT - WALL_Y1) / plankH); ry++) {
    const py = WALL_Y1 + ry * plankH;
    const isAlt = ry % 2 === 0;
    if (isAlt) {
      ctx.fillStyle = 'rgba(180,130,70,0.06)';
      ctx.fillRect(0, py, GAME_WIDTH, plankH);
    }
    ctx.strokeStyle = 'rgba(150,100,50,0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(GAME_WIDTH, py); ctx.stroke();

    // Dikey tahta bölücüler (ofsetli)
    const off = ry % 2 === 0 ? 0 : 55;
    ctx.strokeStyle = 'rgba(150,100,50,0.07)';
    for (let px = off; px < GAME_WIDTH; px += 110) {
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + plankH); ctx.stroke();
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // MUTFAK ZEMİNİ — PlateUp tarzı: koyu antrasit karo, net çizgiler
  // ══════════════════════════════════════════════════════════════════

  // Zemin tabanı — koyu gri/antrasit
  ctx.fillStyle = '#2e2e2e';
  ctx.fillRect(0, 0, GAME_WIDTH, WALL_Y1);

  // Karo ızgarası (PlateUp: büyük, net, koyu-açık geçişli)
  const tile = 48;
  for (let ty = 0; ty < WALL_Y1; ty += tile) {
    for (let tx = 0; tx < GAME_WIDTH; tx += tile) {
      const even = (Math.floor(tx / tile) + Math.floor(ty / tile)) % 2 === 0;

      // Karo dolgu — iki ton arası hafif fark
      ctx.fillStyle = even ? '#343434' : '#2a2a2a';
      ctx.fillRect(tx + 1, ty + 1, tile - 2, tile - 2);

      // Karo yüzey parlaması (üst sol köşede hafif ışık)
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(tx + 1, ty + 1, tile - 2, (tile - 2) * 0.4);

      // Karo kenar (ince parlak çizgi — plastik/porselen his)
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(tx + 1, ty + 1, tile - 2, tile - 2);
    }
  }

  // Karo fugaları (koyu-siyah çizgi ızgarası üstte)
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  for (let ty = 0; ty <= WALL_Y1; ty += tile) {
    ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(GAME_WIDTH, ty); ctx.stroke();
  }
  for (let tx = 0; tx <= GAME_WIDTH; tx += tile) {
    ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, WALL_Y1); ctx.stroke();
  }

  // Mutfak zemin genel parlaması (üstte az, altta çok — ışık kaynağı üstte)
  const kitShine = ctx.createLinearGradient(0, 0, 0, WALL_Y1);
  kitShine.addColorStop(0, 'rgba(255,255,255,0.05)');
  kitShine.addColorStop(0.4, 'rgba(255,255,255,0.02)');
  kitShine.addColorStop(1, 'rgba(0,0,0,0.08)');
  ctx.fillStyle = kitShine;
  ctx.fillRect(0, 0, GAME_WIDTH, WALL_Y1);

  // ══════════════════════════════════════════════════════════════════
  // ARKA DUVAR (üst kenar) — açık bej/krem
  // ══════════════════════════════════════════════════════════════════
  ctx.fillStyle = '#d8d0c0';
  ctx.fillRect(0, 0, GAME_WIDTH, 10);
  ctx.fillStyle = '#c0b8a8';
  ctx.fillRect(0, 8, GAME_WIDTH, 2);

  // ══════════════════════════════════════════════════════════════════
  // ARA DUVAR (mutfak–salon sınırı)
  // ══════════════════════════════════════════════════════════════════
  // Duvar bandı
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(0, WALL_Y1 - 14, GAME_WIDTH, 14);

  // Üst gölge (mutfak tarafı)
  const wtop = ctx.createLinearGradient(0, WALL_Y1 - 14, 0, WALL_Y1);
  wtop.addColorStop(0, 'rgba(0,0,0,0.08)');
  wtop.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = wtop;
  ctx.fillRect(0, WALL_Y1 - 14, GAME_WIDTH, 14);

  // Alt gölge (salon tarafı)
  const wbot = ctx.createLinearGradient(0, WALL_Y1, 0, WALL_Y1 + 18);
  wbot.addColorStop(0, 'rgba(30,15,5,0.22)');
  wbot.addColorStop(1, 'rgba(30,15,5,0)');
  ctx.fillStyle = wbot;
  ctx.fillRect(0, WALL_Y1, GAME_WIDTH, 18);

  // ── KAPILAR ────────────────────────────────────────────────────────────────
  DOOR_RANGES.forEach(([x0, x1]: [number, number]) => {
    const dw = x1 - x0;
    const dg = ctx.createLinearGradient(x0, WALL_Y1 - 14, x0, WALL_Y1);
    dg.addColorStop(0, '#9b7040');
    dg.addColorStop(1, '#7a5228');
    ctx.fillStyle = dg;
    ctx.fillRect(x0, WALL_Y1 - 14, dw, 14);

    ctx.strokeStyle = '#5a3818'; ctx.lineWidth = 2;
    ctx.strokeRect(x0 + 1, WALL_Y1 - 13, dw - 2, 12);

    ctx.fillStyle = '#d4a830';
    ctx.beginPath(); ctx.arc(x0 + dw - 8, WALL_Y1 - 7, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8922a'; ctx.lineWidth = 1; ctx.stroke();
  });

  // ══════════════════════════════════════════════════════════════════
  // MALZEMELİK RAFLAR — karanlık zemine uyumlu metalik görünüm
  // ══════════════════════════════════════════════════════════════════
  INGREDIENTS.forEach((ing) => {
    const { x, y } = ing.pos;

    // Tezgah gölgesi
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.roundRect(x - 37, y - 27, 74, 54, 10); ctx.fill();

    // Tezgah gövdesi (metalik koyu ton)
    const rg = ctx.createLinearGradient(x - 36, y - 26, x + 36, y + 26);
    rg.addColorStop(0, '#5a5a5a');
    rg.addColorStop(0.5, '#484848');
    rg.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.roundRect(x - 36, y - 26, 72, 52, 10); ctx.fill();
    ctx.strokeStyle = '#282828'; ctx.lineWidth = 2; ctx.stroke();

    // Üst metal parlama
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.roundRect(x - 32, y - 24, 64, 10, [8, 8, 0, 0]); ctx.fill();

    // Alt gölge çizgisi
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 32, y + 22, 64, 2);
  });

  // ══════════════════════════════════════════════════════════════════
  // LAVABO — metalik/endüstriyel görünüm
  // ══════════════════════════════════════════════════════════════════
  const sx = SINK_STATION.x, sy = SINK_STATION.y;

  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.roundRect(sx - 45, sy - 33, 90, 66, 12); ctx.fill();

  const stg = ctx.createLinearGradient(sx - 44, sy - 32, sx + 44, sy + 32);
  stg.addColorStop(0, '#525252'); stg.addColorStop(1, '#3c3c3c');
  ctx.fillStyle = stg;
  ctx.beginPath(); ctx.roundRect(sx - 44, sy - 32, 88, 64, 12); ctx.fill();
  ctx.strokeStyle = '#242424'; ctx.lineWidth = 2; ctx.stroke();

  const si = ctx.createRadialGradient(sx, sy, 2, sx, sy, 26);
  si.addColorStop(0, '#6aaccc'); si.addColorStop(0.6, '#4888aa'); si.addColorStop(1, '#2c6888');
  ctx.fillStyle = si;
  ctx.beginPath(); ctx.roundRect(sx - 26, sy - 18, 52, 30, 14); ctx.fill();
  ctx.strokeStyle = '#1e5068'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.fillStyle = 'rgba(160,220,255,0.30)';
  ctx.beginPath(); ctx.ellipse(sx - 6, sy - 5, 14, 8, -0.3, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#707070'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(sx, sy - 18); ctx.lineTo(sx, sy - 32); ctx.lineTo(sx + 14, sy - 32); ctx.stroke();
  ctx.fillStyle = '#909090';
  ctx.beginPath(); ctx.ellipse(sx + 14, sy - 32, 5, 3, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#a0a8a0';
  ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('🚿 Lavabo', sx, sy + 18);

  // ══════════════════════════════════════════════════════════════════
  // ÇÖP KUTUSU — gerçek kova şekli
  // ══════════════════════════════════════════════════════════════════
  const tx = TRASH_STATION.x, ty2 = TRASH_STATION.y;

  // Zemin gölgesi
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(tx + 2, ty2 + 28, 22, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Kova gövdesi (hafif trapez — altta dar, üstte geniş)
  ctx.beginPath();
  ctx.moveTo(tx - 20, ty2 - 14);
  ctx.lineTo(tx + 20, ty2 - 14);
  ctx.lineTo(tx + 16, ty2 + 26);
  ctx.lineTo(tx - 16, ty2 + 26);
  ctx.closePath();
  const kovGrad = ctx.createLinearGradient(tx - 20, ty2, tx + 20, ty2);
  kovGrad.addColorStop(0, '#607a6e');
  kovGrad.addColorStop(0.45, '#718f81');
  kovGrad.addColorStop(1, '#4a6058');
  ctx.fillStyle = kovGrad;
  ctx.fill();
  ctx.strokeStyle = '#2e4a3e'; ctx.lineWidth = 2; ctx.stroke();

  // Dikey çizgi detaylar
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5; ctx.lineCap = 'butt';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(tx + i * 8, ty2 - 12);
    ctx.lineTo(tx + i * 6, ty2 + 24);
    ctx.stroke();
  }

  // Kapak (lid)
  const lidGrad = ctx.createLinearGradient(tx - 23, ty2 - 27, tx + 23, ty2 - 15);
  lidGrad.addColorStop(0, '#859e92'); lidGrad.addColorStop(1, '#506860');
  ctx.fillStyle = lidGrad;
  ctx.beginPath(); ctx.roundRect(tx - 22, ty2 - 27, 44, 14, [6, 6, 0, 0]); ctx.fill();
  ctx.strokeStyle = '#2e4a3e'; ctx.lineWidth = 2; ctx.stroke();

  // Kapak tutacağı
  ctx.fillStyle = '#3a5248';
  ctx.beginPath(); ctx.roundRect(tx - 7, ty2 - 35, 14, 10, 4); ctx.fill();
  ctx.strokeStyle = '#223830'; ctx.lineWidth = 1.5; ctx.stroke();

  // Etiket
  ctx.fillStyle = '#d0e8e0';
  ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('🗑️ Çöp', tx, ty2 + 28);

  // ══════════════════════════════════════════════════════════════════
  // TABAK BEKLETME RAFLARI — metalik
  // ══════════════════════════════════════════════════════════════════
  const plates = HOLDING_STATION_POSITIONS;
  if (plates.length > 0) {
    const fp = plates[0], lp = plates[plates.length - 1];
    const pw = lp.x - fp.x + 100;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.roundRect(fp.x - 52, fp.y - 30, pw + 4, 60, 10); ctx.fill();

    const pg = ctx.createLinearGradient(fp.x - 50, fp.y - 28, fp.x - 50, fp.y + 28);
    pg.addColorStop(0, '#565656'); pg.addColorStop(1, '#3e3e3e');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(fp.x - 50, fp.y - 28, pw, 56, 10); ctx.fill();
    ctx.strokeStyle = '#282828'; ctx.lineWidth = 1.8; ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.roundRect(fp.x - 46, fp.y - 26, pw - 8, 10, [8, 8, 0, 0]); ctx.fill();
  }

  // ══════════════════════════════════════════════════════════════════
  // SERVİS TEZGAHI — metalik / açık
  // ══════════════════════════════════════════════════════════════════
  if (COUNTER_POSITIONS && COUNTER_POSITIONS.length > 0) {
    const cp0 = COUNTER_POSITIONS[0], cpN = COUNTER_POSITIONS[COUNTER_POSITIONS.length - 1];
    const cw = cpN.x - cp0.x + 90;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.roundRect(cp0.x - 46, cp0.y - 28, cw + 4, 56, 10); ctx.fill();

    const cg = ctx.createLinearGradient(cp0.x - 44, cp0.y - 26, cp0.x - 44, cp0.y + 26);
    cg.addColorStop(0, '#585858'); cg.addColorStop(1, '#404040');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.roundRect(cp0.x - 44, cp0.y - 26, cw, 52, 10); ctx.fill();
    ctx.strokeStyle = '#282828'; ctx.lineWidth = 1.8; ctx.stroke();

    ctx.fillStyle = '#303030';
    ctx.fillRect(cp0.x - 40, cp0.y + 24, cw - 8, 2);
  }
}
