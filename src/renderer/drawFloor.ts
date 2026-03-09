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

/** Restoran zemini: mutfak tezgahlar + salon ahşap + duvar + kapılar */
export function drawFloor(ctx: CanvasRenderingContext2D) {
  // ── Yemek salonu — sıcak ahşap ────────────────────────────────────────────
  ctx.fillStyle = "#f5e6d0";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Ahşap çizgiler
  ctx.strokeStyle = "#e8d4b8";
  ctx.lineWidth = 1;
  for (let y = WALL_Y1 + 18; y < GAME_HEIGHT; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }
  for (let x = 0; x < GAME_WIDTH; x += 100) {
    for (let row = 0; row < (GAME_HEIGHT - WALL_Y1) / 36; row++) {
      const off = row % 2 === 0 ? 0 : 50;
      const ry = WALL_Y1 + 18 + row * 36;
      ctx.beginPath();
      ctx.moveTo(x + off, ry);
      ctx.lineTo(x + off, ry + 36);
      ctx.stroke();
    }
  }

  // ── Mutfak zemini — koyu karo ──────────────────────────────────────────────
  ctx.fillStyle = "#d4cfc8";
  ctx.fillRect(0, 0, GAME_WIDTH, WALL_Y1);

  const tile = 32;
  for (let ty = 0; ty < WALL_Y1; ty += tile) {
    for (let tx = 0; tx < GAME_WIDTH; tx += tile) {
      if ((Math.floor(tx / tile) + Math.floor(ty / tile)) % 2 === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.05)";
        ctx.fillRect(tx, ty, tile, tile);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(tx, ty, tile, tile);
    }
  }

  // ── Arka duvar (mutfak üstü) ───────────────────────────────────────────────
  ctx.fillStyle = "#a8a29e";
  ctx.fillRect(0, 0, GAME_WIDTH, 8);

  // ── Tezgah — malzeme rafları (üst sıra) ────────────────────────────────────
  INGREDIENTS.forEach((ing) => {
    const { x, y } = ing.pos;
    ctx.fillStyle = "#d6cfc4";
    ctx.beginPath();
    ctx.roundRect(x - 38, y - 30, 76, 60, 8);
    ctx.fill();
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Üst parlama
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x - 35, y - 27, 70, 8);
  });

  // ── Fırın tezgahları artık dinamik çiziliyor (drawCookStation.ts'te) ──────

  // ── Lavabo (dekoratif) ──────────────────────────────────────────────────────
  const sx = SINK_STATION.x,
    sy = SINK_STATION.y;
  ctx.fillStyle = "#d6d3d1";
  ctx.beginPath();
  ctx.roundRect(sx - 42, sy - 33, 84, 66, 10);
  ctx.fill();
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Lavabo çukuru
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.roundRect(sx - 24, sy - 16, 48, 30, 12);
  ctx.fill();
  // Su parlaması
  ctx.fillStyle = "rgba(147,197,253,0.4)";
  ctx.beginPath();
  ctx.ellipse(sx, sy - 2, 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Musluk
  ctx.strokeStyle = "#71717a";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(sx, sy - 16);
  ctx.lineTo(sx, sy - 30);
  ctx.lineTo(sx + 12, sy - 30);
  ctx.stroke();
  ctx.lineCap = "butt";
  // Etiket
  ctx.fillStyle = "#64748b";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("🚿 Lavabo", sx, sy + 24);

  // ── Çöp kutusu tezgahı ──────────────────────────────────────────────────────
  const tx = TRASH_STATION.x,
    tty = TRASH_STATION.y;
  ctx.fillStyle = "#d6d3d1";
  ctx.beginPath();
  ctx.roundRect(tx - 40, tty - 33, 80, 66, 10);
  ctx.fill();
  ctx.strokeStyle = "#a8a29e";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Tabak / Bekletme rafı dekoratif arka plan ──────────────────────────────
  const plates = HOLDING_STATION_POSITIONS;
  if (plates.length > 0) {
    const firstP = plates[0];
    const lastP = plates[plates.length - 1];
    const pw = lastP.x - firstP.x + 100;
    ctx.fillStyle = "#c8c4be";
    ctx.beginPath();
    ctx.roundRect(firstP.x - 50, firstP.y - 33, pw, 66, 8);
    ctx.fill();
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tabak rafı etiketi
    ctx.fillStyle = "#78716c";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Bekletme Rafı", (firstP.x + lastP.x) / 2, firstP.y + 28);
  }

  // ── Ok işaretleri (malzeme → pişirme akışı) ────────────────────────────────
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  INGREDIENTS.forEach((ing) => {
    ctx.beginPath();
    ctx.moveTo(ing.pos.x, ing.pos.y + 33);
    ctx.lineTo(ing.pos.x, ing.pos.y + 58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ing.pos.x - 5, ing.pos.y + 53);
    ctx.lineTo(ing.pos.x, ing.pos.y + 61);
    ctx.lineTo(ing.pos.x + 5, ing.pos.y + 53);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // ── Duvar (Tuğla Doku + Gradient) ──────────────────────────────────────────
  // Ana duvar gradient'i (koyu kahverengi → açık kahverengi)
  const wallGrad = ctx.createLinearGradient(0, WALL_Y1, 0, WALL_Y1 + 40);
  wallGrad.addColorStop(0, '#5c3d2e');
  wallGrad.addColorStop(0.3, '#6b5240');
  wallGrad.addColorStop(0.7, '#6b5240');
  wallGrad.addColorStop(1, '#4a3628');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, WALL_Y1, GAME_WIDTH, 40);

  // Tuğla doku çizgileri (yatay harç)
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  for (let wy = WALL_Y1 + 10; wy < WALL_Y1 + 40; wy += 10) {
    ctx.beginPath();
    ctx.moveTo(0, wy);
    ctx.lineTo(GAME_WIDTH, wy);
    ctx.stroke();
  }
  // Dikey harç çizgileri (tuğla efekti)
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  for (let wx = 0; wx < GAME_WIDTH; wx += 40) {
    const rowOffset = (Math.floor((wx / 40)) % 2 === 0) ? 0 : 20;
    for (let wy = WALL_Y1; wy < WALL_Y1 + 40; wy += 10) {
      ctx.beginPath();
      ctx.moveTo(wx + rowOffset, wy);
      ctx.lineTo(wx + rowOffset, wy + 10);
      ctx.stroke();
    }
  }

  // Üst süpürgelik (duvarın üstü — ince koyu çizgi)
  ctx.fillStyle = '#4a3628';
  ctx.fillRect(0, WALL_Y1, GAME_WIDTH, 4);

  // Alt süpürgelik
  ctx.fillStyle = '#4a3628';
  ctx.fillRect(0, WALL_Y1 + 36, GAME_WIDTH, 4);

  // Kapılar (Servis Pencereleri — ahşap çerçeveli)
  DOOR_RANGES.forEach(([x1, x2]) => {
    const w = x2 - x1;

    // Kapı açıklığı (zemin rengi — geçit)
    ctx.fillStyle = '#e8ddd0';
    ctx.fillRect(x1, WALL_Y1, w, 40);

    // Üst eşik (ahşap çerçeve)
    const frameGrad = ctx.createLinearGradient(0, WALL_Y1, 0, WALL_Y1 + 6);
    frameGrad.addColorStop(0, '#b8864e');
    frameGrad.addColorStop(1, '#a07038');
    ctx.fillStyle = frameGrad;
    ctx.fillRect(x1 - 4, WALL_Y1, w + 8, 6);

    // Alt eşik
    ctx.fillStyle = '#a07038';
    ctx.fillRect(x1 - 4, WALL_Y1 + 34, w + 8, 6);

    // Sol dikey çerçeve
    ctx.fillStyle = '#b8864e';
    ctx.fillRect(x1 - 4, WALL_Y1, 6, 40);
    // Sağ dikey çerçeve
    ctx.fillRect(x2 - 2, WALL_Y1, 6, 40);

    // Sarı ışık şeridi (hoş geldiniz hissi)
    ctx.fillStyle = 'rgba(253,230,138,0.3)';
    ctx.fillRect(x1 + 4, WALL_Y1 + 8, w - 8, 24);

    // Kapı iç gölgesi (derinlik hissi)
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(x1, WALL_Y1 + 6, w, 4);
  });

  // ── Servis Blokları (Ahşap masa renginde) ────────────────────────────────
  COUNTER_POSITIONS.forEach(counter => {
    const { x, y, width, height } = counter;

    // Ahşap servis bloğu
    const blockGrad = ctx.createLinearGradient(x - width / 2, y - height / 2, x + width / 2, y + height / 2);
    blockGrad.addColorStop(0, '#c9a06c');
    blockGrad.addColorStop(1, '#a07038');
    ctx.fillStyle = blockGrad;
    ctx.beginPath();
    ctx.roundRect(x - width / 2, y - height / 2, width, height, 4);
    ctx.fill();

    // Kenar çizgisi
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // ── Dikey Duvar Kaldırıldı (lavabo alanı artık açık) ────────────────────────
  // Lavabo ve çöp alanına serbest erişim

  // ── Giriş kapısı (alt — ahşap çerçeveli) ────────────────────────────────────
  // Alt duvar
  const entranceGrad = ctx.createLinearGradient(0, GAME_HEIGHT - 30, 0, GAME_HEIGHT);
  entranceGrad.addColorStop(0, '#5c3d2e');
  entranceGrad.addColorStop(1, '#4a3628');
  ctx.fillStyle = entranceGrad;
  ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);

  // Giriş açıklığı
  const entranceX = 570, entranceW = 140;
  ctx.fillStyle = '#d4c4b0';
  ctx.fillRect(entranceX, GAME_HEIGHT - 30, entranceW, 30);

  // Giriş çerçevesi
  ctx.fillStyle = '#b8864e';
  ctx.fillRect(entranceX - 4, GAME_HEIGHT - 30, 6, 30);
  ctx.fillRect(entranceX + entranceW - 2, GAME_HEIGHT - 30, 6, 30);
  ctx.fillStyle = '#a07038';
  ctx.fillRect(entranceX - 4, GAME_HEIGHT - 30, entranceW + 8, 5);

  // Sıcak ışık efekti
  ctx.fillStyle = 'rgba(253,230,138,0.2)';
  ctx.fillRect(entranceX + 6, GAME_HEIGHT - 24, entranceW - 12, 18);

  // GİRİŞ etiketi
  ctx.fillStyle = "#fde68a";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GİRİŞ", 640, GAME_HEIGHT - 13);
}
