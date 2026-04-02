import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_Y1,
  DOOR_RANGES,
  INGREDIENTS,
  SINK_STATION,
  PLATE_STACK_POS,
  RECIPE_DEFS,
  EXTERIOR_Y,
} from "../types/game";

/** Metalik tezgah tabanı — gölge + gradient gövde + üst parlama */
function drawWorkstationBase(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  hw: number, hh: number,
  radius = 10,
  shadowAlpha = 0.30,
) {
  // Gölge
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
  ctx.beginPath(); ctx.roundRect(x - hw - 1, y - hh - 1, (hw + 1) * 2, (hh + 1) * 2, radius + 2); ctx.fill();

  // Metalik gövde
  const g = ctx.createLinearGradient(x - hw, y - hh, x + hw, y + hh);
  g.addColorStop(0, '#565656'); g.addColorStop(0.5, '#484848'); g.addColorStop(1, '#3a3a3a');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.roundRect(x - hw, y - hh, hw * 2, hh * 2, radius); ctx.fill();
  ctx.strokeStyle = '#282828'; ctx.lineWidth = 1.8; ctx.stroke();

  // Üst parlama
  ctx.fillStyle = 'rgba(255,255,255,0.11)';
  ctx.beginPath(); ctx.roundRect(x - hw + 4, y - hh + 2, (hw - 4) * 2, 10, [radius, radius, 0, 0]); ctx.fill();
}

/** Restoran zemini — PlateUp tarzı koyu mutfak + sıcak ahşap salon */
export function drawFloor(ctx: CanvasRenderingContext2D, unlockedDishes: string[] = [], ingredientPositions?: Record<string, { x: number; y: number }>, plateStackPos?: { x: number; y: number }, sinkPos?: { x: number; y: number }, choppingBoardPos?: { x: number; y: number }, mapId?: string) {

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
    // Gizli malzemelerin raflarını da gizle
    const recipeKey = (ing.key in RECIPE_DEFS) ? ing.key : `CHOPPED_${ing.key}`;
    const recipe = RECIPE_DEFS[recipeKey as keyof typeof RECIPE_DEFS];
    if (recipe && !unlockedDishes.includes(recipe.output)) return;
    // 🥔 patates — fritöz sistemi, RECIPE_DEFS'te yok, 🍟 unlock kontrolü
    if (ing.key === '🥔' && !unlockedDishes.includes('🍟')) return;
    // 🧁 tatlı hamuru — pasta fırını sistemi, 🍰 unlock kontrolü
    if (ing.key === '🧁' && !unlockedDishes.includes('🍰')) return;

    const pos = ingredientPositions?.[ing.key] ?? ing.pos;
    const { x, y } = pos;

    drawWorkstationBase(ctx, x, y, 36, 26, 10, 0.35);

    // Alt gölge çizgisi
    ctx.fillStyle = '#222';
    ctx.fillRect(x - 32, y + 22, 64, 2);
  });

  // ══════════════════════════════════════════════════════════════════
  // LAVABO — metalik/endüstriyel görünüm
  // ══════════════════════════════════════════════════════════════════
  {
    const sx = (sinkPos ?? SINK_STATION).x, sy = (sinkPos ?? SINK_STATION).y;

    drawWorkstationBase(ctx, sx, sy, 44, 32, 12, 0.30);

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
  }

  // ══════════════════════════════════════════════════════════════════
  // TABAK YIĞINI İSTASYONU (PLATE STACK BASE)
  // ══════════════════════════════════════════════════════════════════
  if (PLATE_STACK_POS) {
    const pos = plateStackPos ?? PLATE_STACK_POS;
    const { x, y } = pos;
    drawWorkstationBase(ctx, x, y, 42, 28, 10, 0.28);
    ctx.fillStyle = '#171717';
    ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('TABAKLAR', x, y + 20);
  }



  // ══════════════════════════════════════════════════════════════════
  // DIŞ ALAN — kaldırım + yol + çimen
  // EXTERIOR_Y (720) → GAME_HEIGHT (870)
  // ══════════════════════════════════════════════════════════════════
  drawExterior(ctx);

  // ══════════════════════════════════════════════════════════════════
  // SOL / SAĞ DUVARLAR — mutfak + salon boyunca (y=0 → EXTERIOR_Y)
  drawSideWall(ctx, 0, 30, 0, EXTERIOR_Y);
  drawSideWall(ctx, GAME_WIDTH - 30, 30, 0, EXTERIOR_Y);

  // ÜST DUVAR
  drawTopWall(ctx, 30);

  // ══════════════════════════════════════════════════════════════════
  // SALON DEKORASYONLARı — duvarların üstüne çizilmeli
  // ══════════════════════════════════════════════════════════════════
  drawSalonDecorations(ctx);
}

/**
 * Dış alan: restoranın ön cephesi (kalın duvar + tek gerçekçi kapı),
 * taş döşeme kaldırım, yaya yolu, çimen şeritleri, ağaçlar.
 * EXTERIOR_Y (720) → GAME_HEIGHT (870)
 */
function drawExterior(ctx: CanvasRenderingContext2D) {
  const W = GAME_WIDTH;

  // Tek kapı — ortada
  const DOOR_X0 = 580, DOOR_X1 = 700, DOOR_W = 120;

  // ══════════════════════════════════════════════════════════════════
  // ÖN DUVAR — kalın tuğla, EXTERIOR_Y → EXTERIOR_Y+30
  // ══════════════════════════════════════════════════════════════════
  const WALL_TOP = EXTERIOR_Y;
  const WALL_BOT = EXTERIOR_Y + 30;

  // Duvar gövdesi
  const wallGrad = ctx.createLinearGradient(0, WALL_TOP, 0, WALL_BOT);
  wallGrad.addColorStop(0, '#9a7858');
  wallGrad.addColorStop(1, '#7a5838');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, WALL_TOP, W, WALL_BOT - WALL_TOP);

  // Tuğla desen
  const brickH = 9, brickW = 36;
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let row = 0; row * brickH < WALL_BOT - WALL_TOP; row++) {
    const by = WALL_TOP + row * brickH;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
    const off = row % 2 === 0 ? 0 : brickW / 2;
    for (let bx = off; bx < W; bx += brickW) {
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + brickH); ctx.stroke();
    }
  }
  // Duvar üst parlama
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(0, WALL_TOP, W, 3);
  // Duvar alt gölgesi
  const wallShadow = ctx.createLinearGradient(0, WALL_BOT, 0, WALL_BOT + 14);
  wallShadow.addColorStop(0, 'rgba(0,0,0,0.38)');
  wallShadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = wallShadow;
  ctx.fillRect(0, WALL_BOT, W, 14);

  // Kapı boşluğunu salon rengiyle doldur (duvarı kes)
  ctx.fillStyle = '#d4c4a0';
  ctx.fillRect(DOOR_X0, WALL_TOP, DOOR_W, WALL_BOT - WALL_TOP);

  // Gerçekçi kapı
  drawFrontDoor(ctx, DOOR_X0, DOOR_X1, WALL_TOP, WALL_BOT);

  // ══════════════════════════════════════════════════════════════════
  // KALDIRM — taş döşeme (WALL_BOT → SIDEWALK_END)
  // ══════════════════════════════════════════════════════════════════
  const SIDEWALK_END = WALL_BOT + 78;

  const swGrad = ctx.createLinearGradient(0, WALL_BOT, 0, SIDEWALK_END);
  swGrad.addColorStop(0, '#c2bcb2');
  swGrad.addColorStop(1, '#aeaaa0');
  ctx.fillStyle = swGrad;
  ctx.fillRect(0, WALL_BOT, W, SIDEWALK_END - WALL_BOT);

  // Taş döşeme levhaları
  const stoneW = 88, stoneH = 36;
  ctx.strokeStyle = 'rgba(70,60,50,0.20)';
  ctx.lineWidth = 2;
  for (let row = 0; row * stoneH < SIDEWALK_END - WALL_BOT; row++) {
    const sy2 = WALL_BOT + row * stoneH;
    ctx.beginPath(); ctx.moveTo(0, sy2); ctx.lineTo(W, sy2); ctx.stroke();
    const off = row % 2 === 0 ? 0 : stoneW / 2;
    for (let sx2 = off; sx2 < W; sx2 += stoneW) {
      ctx.beginPath(); ctx.moveTo(sx2, sy2); ctx.lineTo(sx2, sy2 + stoneH); ctx.stroke();
      // Levha parlaması
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(sx2 + 3, sy2 + 3, stoneW - 6, stoneH * 0.35);
    }
  }

  // Kaldırım bordürü
  const bordurGrad = ctx.createLinearGradient(0, SIDEWALK_END - 5, 0, SIDEWALK_END + 6);
  bordurGrad.addColorStop(0, '#888078');
  bordurGrad.addColorStop(0.5, '#686058');
  bordurGrad.addColorStop(1, '#504840');
  ctx.fillStyle = bordurGrad;
  ctx.fillRect(0, SIDEWALK_END - 5, W, 11);

  // Kapı önü yol şeridi (kapıdan kaldırıma)
  const pathCX = (DOOR_X0 + DOOR_X1) / 2;
  const pathW2 = DOOR_W - 16;
  ctx.fillStyle = 'rgba(195,185,165,0.55)';
  ctx.fillRect(pathCX - pathW2 / 2, WALL_BOT, pathW2, SIDEWALK_END - WALL_BOT);

  // ══════════════════════════════════════════════════════════════════
  // YAYA YOLU — kare taş döşeme (SIDEWALK_END → GAME_HEIGHT)
  // ══════════════════════════════════════════════════════════════════
  const ROAD_END = GAME_HEIGHT;

  const roadGrad = ctx.createLinearGradient(0, SIDEWALK_END, 0, ROAD_END);
  roadGrad.addColorStop(0, '#686460');
  roadGrad.addColorStop(1, '#545250');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(0, SIDEWALK_END, W, ROAD_END - SIDEWALK_END);

  // Kare taş deseni
  const pave = 26;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1.5;
  for (let py = SIDEWALK_END; py < ROAD_END; py += pave) {
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    for (let px = 0; px < W; px += pave) {
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + pave); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(px + 1, py + 1, pave - 2, (pave - 2) * 0.3);
    }
  }
  // Yaya yolu kenar çizgileri
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, SIDEWALK_END + 3); ctx.lineTo(W, SIDEWALK_END + 3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, ROAD_END - 3); ctx.lineTo(W, ROAD_END - 3); ctx.stroke();

  // ── Ağaçlar ───────────────────────────────────────────────────────────────
  const treeY = WALL_BOT + (SIDEWALK_END - WALL_BOT) / 2 + 4;
  [90, 210, 370, 910, 1070, 1185].forEach(tx2 => {
    if (tx2 > DOOR_X0 - 55 && tx2 < DOOR_X1 + 55) return;
    drawTree(ctx, tx2, treeY);
  });

  // ── Sokak lambaları ────────────────────────────────────────────────────────
  drawStreetLamp(ctx, 28, WALL_BOT + 6);
  drawStreetLamp(ctx, W - 28, WALL_BOT + 6);

  // ── Restoran tabelası ─────────────────────────────────────────────────────
  drawSignBoard(ctx, DOOR_X0, DOOR_X1, WALL_TOP);

  // ── Kapı önü paspas ───────────────────────────────────────────────────────
  const doorMid = (DOOR_X0 + DOOR_X1) / 2;
  drawDoormat(ctx, doorMid, WALL_BOT + 8);

  // ── Çiçek saksıları (kapı yanları) ────────────────────────────────────────
  drawFlowerPot(ctx, DOOR_X0 - 18, WALL_BOT + 14);
  drawFlowerPot(ctx, DOOR_X1 + 18, WALL_BOT + 14);

  // ── Bekleme bankı (kapı sağı) ─────────────────────────────────────────────
  drawBench(ctx, DOOR_X1 + 80, WALL_BOT + 20);
}

/** Gerçekçi çift kanatlı cam kapı */
function drawFrontDoor(
  ctx: CanvasRenderingContext2D,
  x0: number, x1: number,
  wallTop: number, wallBot: number,
) {
  const mid = (x0 + x1) / 2;
  const h = wallBot - wallTop;

  // Dış çerçeve (koyu ahşap)
  ctx.fillStyle = '#3e2810';
  ctx.fillRect(x0 - 5, wallTop, 7, h);
  ctx.fillRect(x1 - 2, wallTop, 7, h);
  ctx.fillRect(x0 - 5, wallTop, x1 - x0 + 12, 5);

  // Sol kanat
  const lg = ctx.createLinearGradient(x0, 0, mid - 2, 0);
  lg.addColorStop(0, '#7a5c3a'); lg.addColorStop(0.5, '#8e6e4a'); lg.addColorStop(1, '#6a4c2a');
  ctx.fillStyle = lg;
  ctx.fillRect(x0 + 2, wallTop + 5, mid - x0 - 4, h - 5);

  // Sağ kanat
  const rg = ctx.createLinearGradient(mid + 2, 0, x1, 0);
  rg.addColorStop(0, '#6a4c2a'); rg.addColorStop(0.5, '#8e6e4a'); rg.addColorStop(1, '#7a5c3a');
  ctx.fillStyle = rg;
  ctx.fillRect(mid + 2, wallTop + 5, x1 - mid - 4, h - 5);

  // Cam paneller
  ctx.fillStyle = 'rgba(150,205,235,0.50)';
  ctx.fillRect(x0 + 5, wallTop + 7, mid - x0 - 10, h - 10);
  ctx.fillRect(mid + 5, wallTop + 7, x1 - mid - 10, h - 10);

  // Cam çerçeve
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 5, wallTop + 7, mid - x0 - 10, h - 10);
  ctx.strokeRect(mid + 5, wallTop + 7, x1 - mid - 10, h - 10);

  // Cam parlaması
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x0 + 6, wallTop + 8, 5, h - 12);
  ctx.fillRect(mid + 6, wallTop + 8, 5, h - 12);

  // Orta çizgi
  ctx.strokeStyle = '#2e1808'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(mid, wallTop + 4); ctx.lineTo(mid, wallBot); ctx.stroke();

  // Kapı kolları (altın)
  ctx.fillStyle = '#d4a830';
  ctx.beginPath(); ctx.roundRect(mid - 11, wallTop + h / 2 - 3, 8, 6, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(mid + 3, wallTop + h / 2 - 3, 8, 6, 2); ctx.fill();
  ctx.strokeStyle = '#a07820'; ctx.lineWidth = 1; ctx.stroke();
}


/** Salon dekorasyonları — bitkiler, tablolar, menü panosu */
function drawSalonDecorations(ctx: CanvasRenderingContext2D) {
  const WALL_Y = 340; // WALL_Y1

  // ── Köşe saksı bitkiler ────────────────────────────────────────────────────
  // Sol üst, sağ üst, sol alt, sağ alt
  drawIndoorPlant(ctx, 55, WALL_Y + 30);
  drawIndoorPlant(ctx, GAME_WIDTH - 55, WALL_Y + 30);
  drawIndoorPlant(ctx, 55, 660);
  drawIndoorPlant(ctx, GAME_WIDTH - 55, 660);

  // ── Duvar tabloları ────────────────────────────────────────────────────────
  drawWallPainting(ctx, 55, 460, 0);   // sol duvar
  drawWallPainting(ctx, 55, 560, 1);
  drawWallPainting(ctx, GAME_WIDTH - 55, 460, 2); // sağ duvar
  drawWallPainting(ctx, GAME_WIDTH - 55, 560, 3);

  // ── Menü panosu (kapı yanı, sol) ──────────────────────────────────────────
  drawMenuBoard(ctx, 100, WALL_Y + 55);
}

/** İç mekan saksı bitkisi */
function drawIndoorPlant(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath(); ctx.ellipse(0, 18, 14, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Saksı
  ctx.fillStyle = '#c1440e';
  ctx.beginPath();
  ctx.moveTo(-12, 2); ctx.lineTo(12, 2);
  ctx.lineTo(9, 18); ctx.lineTo(-9, 18);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8B2e08'; ctx.lineWidth = 1; ctx.stroke();

  // Saksı üst kenar
  ctx.fillStyle = '#d4561a';
  ctx.beginPath(); ctx.roundRect(-13, 0, 26, 5, 2); ctx.fill();

  // Toprak
  ctx.fillStyle = '#5c3317';
  ctx.beginPath(); ctx.ellipse(0, 2, 11, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Büyük yapraklar
  const leaves = [
    { cp1x: -18, cp1y: -20, cp2x: -22, cp2y: -8, ex: -10, ey: -2, col: '#3a7818' },
    { cp1x: 18, cp1y: -20, cp2x: 22, cp2y: -8, ex: 10, ey: -2, col: '#3a7818' },
    { cp1x: -10, cp1y: -28, cp2x: 2, cp2y: -30, ex: 4, ey: -14, col: '#4a9a28' },
    { cp1x: 10, cp1y: -28, cp2x: -2, cp2y: -30, ex: -4, ey: -14, col: '#4a9a28' },
    { cp1x: 0, cp1y: -32, cp2x: 8, cp2y: -28, ex: 2, ey: -18, col: '#6ab840' },
  ];
  leaves.forEach(l => {
    ctx.fillStyle = l.col;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(l.cp1x, l.cp1y, l.cp2x, l.cp2y, l.ex, l.ey);
    ctx.bezierCurveTo(l.cp2x * 0.3, l.cp2y * 0.3, l.cp1x * 0.3, l.cp1y * 0.3, 0, 0);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.5; ctx.stroke();
  });

  ctx.restore();
}

/** Duvar tablosu — 4 farklı soyut desen */
function drawWallPainting(ctx: CanvasRenderingContext2D, cx: number, cy: number, variant: number) {
  ctx.save();
  ctx.translate(cx, cy);

  const fw = 36, fh = 28;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.roundRect(-fw / 2 + 2, -fh / 2 + 2, fw, fh, 3); ctx.fill();

  // Çerçeve
  ctx.fillStyle = '#3e2810';
  ctx.beginPath(); ctx.roundRect(-fw / 2 - 3, -fh / 2 - 3, fw + 6, fh + 6, 4); ctx.fill();
  ctx.strokeStyle = '#5c3a18'; ctx.lineWidth = 1; ctx.stroke();

  // İç alan (krem)
  ctx.fillStyle = '#f5f0e8';
  ctx.beginPath(); ctx.roundRect(-fw / 2, -fh / 2, fw, fh, 2); ctx.fill();

  // Soyut içerik — varianta göre
  ctx.save();
  ctx.beginPath(); ctx.roundRect(-fw / 2, -fh / 2, fw, fh, 2); ctx.clip();

  if (variant === 0) {
    // Güneş batımı
    const sg = ctx.createLinearGradient(0, -fh / 2, 0, fh / 2);
    sg.addColorStop(0, '#87CEEB'); sg.addColorStop(0.6, '#FFB347'); sg.addColorStop(1, '#FF6B35');
    ctx.fillStyle = sg; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath(); ctx.arc(0, 4, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.roundRect(-fw / 2, 6, fw, fh / 2, [0, 0, 2, 2]); ctx.fill();
  } else if (variant === 1) {
    // Soyut geometri
    ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(-10 + i * 7, -4 + (i % 2) * 8, 5 + i, 0, Math.PI * 2); ctx.fill();
    });
  } else if (variant === 2) {
    // Dağ manzarası
    const mg = ctx.createLinearGradient(0, -fh / 2, 0, fh / 2);
    mg.addColorStop(0, '#87CEEB'); mg.addColorStop(1, '#98FB98');
    ctx.fillStyle = mg; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
    ctx.fillStyle = '#6b8e6b';
    ctx.beginPath(); ctx.moveTo(-fw / 2, fh / 2); ctx.lineTo(-8, -6); ctx.lineTo(4, 2); ctx.lineTo(14, -10); ctx.lineTo(fw / 2, fh / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(8, -8, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    // Çiçek deseni
    ctx.fillStyle = '#fef9f0'; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
    [[-8, -6], [6, -4], [-2, 6], [10, 4], [-12, 4]].forEach(([fx, fy]) => {
      ctx.fillStyle = '#e91e8c';
      ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath(); ctx.arc(fx, fy, 1.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#4a9a28'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 3, fy + 5); ctx.stroke();
    });
  }

  ctx.restore();

  // Çerçeve üst parlaması
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath(); ctx.roundRect(-fw / 2, -fh / 2, fw, 4, [2, 2, 0, 0]); ctx.fill();

  ctx.restore();
}

/** Menü panosu */
function drawMenuBoard(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  const bw = 72, bh = 52;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.roundRect(-bw / 2 + 2, -bh / 2 + 2, bw, bh, 4); ctx.fill();

  // Tahta zemin
  const bg = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
  bg.addColorStop(0, '#4a2e10'); bg.addColorStop(1, '#3a2008');
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 4); ctx.fill();
  ctx.strokeStyle = '#2e1808'; ctx.lineWidth = 1.5; ctx.stroke();

  // Köşe vidaları
  ctx.fillStyle = '#888';
  [[-bw / 2 + 5, -bh / 2 + 5], [bw / 2 - 5, -bh / 2 + 5],
   [-bw / 2 + 5, bh / 2 - 5], [bw / 2 - 5, bh / 2 - 5]].forEach(([vx, vy]) => {
    ctx.beginPath(); ctx.arc(vx, vy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 0.5; ctx.stroke();
  });

  // Başlık
  ctx.fillStyle = '#fde68a'; ctx.font = 'bold 9px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('📋 MENÜ', 0, -bh / 2 + 11);

  // Ayırıcı çizgi
  ctx.strokeStyle = 'rgba(255,220,100,0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-bw / 2 + 8, -bh / 2 + 18); ctx.lineTo(bw / 2 - 8, -bh / 2 + 18); ctx.stroke();

  // Menü satırları
  const lines = ['🥗 Salata', '🍔 Burger', '🍕 Pizza', '🍜 Çorba'];
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '7px Arial';
  lines.forEach((line, i) => {
    ctx.fillText(line, 0, -bh / 2 + 26 + i * 8);
  });

  ctx.restore();
}

/** Restoran tabelası — kapı üstünde */
function drawSignBoard(ctx: CanvasRenderingContext2D, doorX0: number, doorX1: number, wallTop: number) {
  const cx = (doorX0 + doorX1) / 2;
  const sw = 200, sh = 22, sy = wallTop - 28;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.roundRect(cx - sw / 2 + 3, sy + 3, sw, sh, 6); ctx.fill();

  // Tabela zemini
  const sg = ctx.createLinearGradient(cx - sw / 2, sy, cx + sw / 2, sy + sh);
  sg.addColorStop(0, '#1a1a2e'); sg.addColorStop(1, '#16213e');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.roundRect(cx - sw / 2, sy, sw, sh, 6); ctx.fill();

  // Altın çerçeve
  ctx.strokeStyle = '#d4a830'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.roundRect(cx - sw / 2, sy, sw, sh, 6); ctx.stroke();

  // Köşe yıldızlar
  ctx.fillStyle = '#d4a830'; ctx.font = '9px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('★', cx - sw / 2 + 12, sy + sh / 2);
  ctx.fillText('★', cx + sw / 2 - 12, sy + sh / 2);

  // Yazı
  ctx.fillStyle = '#fde68a'; ctx.font = 'bold 12px Arial';
  ctx.fillText('🍽️  FKA MARKET', cx, sy + sh / 2);

  // Alt ışık halesi
  const halo = ctx.createLinearGradient(0, sy + sh, 0, sy + sh + 16);
  halo.addColorStop(0, 'rgba(255,240,100,0.18)');
  halo.addColorStop(1, 'rgba(255,240,100,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - sw / 2, sy + sh, sw, 16);

  // Tabela askı ipleri
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - sw / 2 + 20, sy); ctx.lineTo(cx - sw / 2 + 20, wallTop); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + sw / 2 - 20, sy); ctx.lineTo(cx + sw / 2 - 20, wallTop); ctx.stroke();
}

/** Kapı önü paspas */
function drawDoormat(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.roundRect(cx - 48, cy - 3, 96, 14, 3); ctx.fill();

  // Paspas zemini
  const mg = ctx.createLinearGradient(cx - 46, cy - 2, cx + 46, cy + 10);
  mg.addColorStop(0, '#4a3828'); mg.addColorStop(1, '#3a2818');
  ctx.fillStyle = mg;
  ctx.beginPath(); ctx.roundRect(cx - 46, cy - 2, 92, 12, 3); ctx.fill();

  // Desen çizgileri
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const lx = cx - 36 + i * 18;
    ctx.beginPath(); ctx.moveTo(lx, cy); ctx.lineTo(lx, cy + 8); ctx.stroke();
  }

  // Kenar
  ctx.strokeStyle = '#2e2018'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(cx - 46, cy - 2, 92, 12, 3); ctx.stroke();
}

/** Çiçek saksısı */
function drawFlowerPot(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 14, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Saksı gövdesi (trapez)
  ctx.fillStyle = '#c1440e';
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
  ctx.lineTo(8, 14); ctx.lineTo(-8, 14);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8B2e08'; ctx.lineWidth = 1; ctx.stroke();

  // Saksı üst kenar
  ctx.fillStyle = '#d4561a';
  ctx.beginPath(); ctx.roundRect(-11, -2, 22, 5, 2); ctx.fill();

  // Toprak
  ctx.fillStyle = '#5c3317';
  ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Yapraklar
  ctx.fillStyle = '#4a9a28';
  ctx.beginPath(); ctx.moveTo(0, -2); ctx.bezierCurveTo(-12, -14, -16, -8, -8, -4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -2); ctx.bezierCurveTo(12, -14, 16, -8, 8, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6ab840';
  ctx.beginPath(); ctx.moveTo(0, -2); ctx.bezierCurveTo(-6, -18, 0, -20, 4, -10); ctx.closePath(); ctx.fill();

  // Çiçekler
  const flowers = [[-6, -16, '#ff6b9d'], [4, -18, '#ff9f43'], [-2, -22, '#ff6b9d']] as const;
  flowers.forEach(([fx, fy, col]) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(fx, fy, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8';
    ctx.beginPath(); ctx.arc(fx, fy, 1.2, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();
}

/** Bekleme bankı */
function drawBench(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 16, 40, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Bacaklar
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.roundRect(-34, 8, 6, 12, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(28, 8, 6, 12, 2); ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();

  // Oturma yüzeyi — 3 tahta
  const woodColors = ['#8B6914', '#9a7520', '#8B6914'];
  woodColors.forEach((col, i) => {
    const bg = ctx.createLinearGradient(-36, -4 + i * 4, 36, 0 + i * 4);
    bg.addColorStop(0, col); bg.addColorStop(1, '#6b4f10');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(-36, -4 + i * 4, 72, 5, 1); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.5; ctx.stroke();
  });

  // Metal bağlantılar
  ctx.fillStyle = '#888';
  [[-28, 0], [28, 0]].forEach(([bx, by]) => {
    ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill();
  });

  ctx.restore();
}

/** Top-down ağaç */
function drawTree(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(cx + 3, cy + 4, 14, 8, 0, 0, Math.PI * 2); ctx.fill();
  const tg = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 14);
  tg.addColorStop(0, '#6ab840'); tg.addColorStop(0.6, '#4e9a28'); tg.addColorStop(1, '#3a7818');
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(120,200,60,0.25)';
  ctx.beginPath(); ctx.arc(cx - 4, cy - 4, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b4226';
  ctx.beginPath(); ctx.arc(cx, cy + 2, 3, 0, Math.PI * 2); ctx.fill();
}

/** Üst yatay duvar — ön duvarla aynı tuğla desen */
function drawTopWall(ctx: CanvasRenderingContext2D, h: number) {
  const W = GAME_WIDTH;

  // Duvar gövdesi
  const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
  wallGrad.addColorStop(0, '#9a7858');
  wallGrad.addColorStop(1, '#7a5838');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, W, h);

  // Tuğla desen
  const brickH = 9, brickW = 36;
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let row = 0; row * brickH < h; row++) {
    const by = row * brickH;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
    const off = row % 2 === 0 ? 0 : brickW / 2;
    for (let bx = off; bx < W; bx += brickW) {
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + brickH); ctx.stroke();
    }
  }

  // Alt gölge
  const shadow = ctx.createLinearGradient(0, h, 0, h + 12);
  shadow.addColorStop(0, 'rgba(0,0,0,0.30)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(0, h, W, 12);
}

/** Sol/sağ yan duvar — ön duvarla aynı tuğla desen, sadece belirtilen y aralığında */
function drawSideWall(ctx: CanvasRenderingContext2D, x: number, w: number, yStart: number, yEnd: number) {
  const H = yEnd - yStart;

  // Duvar gövdesi
  const wallGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  wallGrad.addColorStop(0, '#9a7858');
  wallGrad.addColorStop(1, '#7a5838');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(x, yStart, w, H);

  // Tuğla desen
  const brickH = 9, brickW = 36;
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 1;
  for (let row = 0; row * brickH < H; row++) {
    const by = yStart + row * brickH;
    ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + w, by); ctx.stroke();
    const off = row % 2 === 0 ? 0 : brickW / 2;
    for (let bx = x + off; bx < x + w; bx += brickW) {
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + brickH); ctx.stroke();
    }
  }

  // İç kenar gölgesi
  const innerEdge = ctx.createLinearGradient(x, 0, x + w, 0);
  if (x === 0) {
    innerEdge.addColorStop(0, 'rgba(0,0,0,0)');
    innerEdge.addColorStop(1, 'rgba(0,0,0,0.30)');
  } else {
    innerEdge.addColorStop(0, 'rgba(0,0,0,0.30)');
    innerEdge.addColorStop(1, 'rgba(0,0,0,0)');
  }
  ctx.fillStyle = innerEdge;
  ctx.fillRect(x, yStart, w, H);
}

/** Sokak lambası */
function drawStreetLamp(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = '#505050'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy + 28); ctx.lineTo(cx, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
  ctx.fillStyle = '#e8d060';
  ctx.beginPath(); ctx.ellipse(cx + 10, cy, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a09040'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,100,0.12)';
  ctx.beginPath(); ctx.arc(cx + 10, cy, 16, 0, Math.PI * 2); ctx.fill();
}
