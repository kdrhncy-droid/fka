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
export function drawFloor(ctx: CanvasRenderingContext2D, unlockedDishes: string[] = [], ingredientPositions?: Record<string, { x: number; y: number }>, plateStackPos?: { x: number; y: number }, sinkPos?: { x: number; y: number }, choppingBoardPos?: { x: number; y: number }) {

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
    // CHOPPABLE malzemelerin recipe key'i 'CHOPPED_X' formatında
    const recipeKey = (ing.key in RECIPE_DEFS) ? ing.key : `CHOPPED_${ing.key}`;
    const recipe = RECIPE_DEFS[recipeKey as keyof typeof RECIPE_DEFS];
    if (recipe && !unlockedDishes.includes(recipe.output)) {
      return;
    }

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
  // ══════════════════════════════════════════════════════════════════
  drawSideWall(ctx, 0, 30, 0, EXTERIOR_Y);
  drawSideWall(ctx, GAME_WIDTH - 30, 30, 0, EXTERIOR_Y);

  // ══════════════════════════════════════════════════════════════════
  // ÜST DUVAR — yatay tuğla şerit (y=0..30)
  // ══════════════════════════════════════════════════════════════════
  drawTopWall(ctx, 30);
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
