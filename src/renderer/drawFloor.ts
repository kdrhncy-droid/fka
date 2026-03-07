import {
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_Y1,
  DOOR_RANGES,
  INGREDIENTS,
  TRASH_STATION,
  SINK_STATION,
  UTIL_WALL_X1,
  UTIL_WALL_X2,
  UTIL_DOOR_RANGE,
  HOLDING_STATION_POSITIONS,
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

  // ── Dekoratif arka duvar kaplamasi (sağ panel + sol panel) ────────────────
  // Sol mutfak paneli: Malzeme + ocak tezgahları
  ctx.fillStyle = "#e7e5e4";
  ctx.beginPath();
  ctx.roundRect(10, 10, 805, 215, 12);
  ctx.fill();
  ctx.strokeStyle = "#c4b5a4";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Sağ mutfak paneli: Çöp, Lavabo, Tabaklar
  ctx.fillStyle = "#e7e5e4";
  ctx.beginPath();
  ctx.roundRect(840, 10, 430, 215, 12);
  ctx.fill();
  ctx.strokeStyle = "#c4b5a4";
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Tezgah — malzeme rafları (üst sıra) ────────────────────────────────────
  INGREDIENTS.forEach((ing) => {
    const { x, y } = ing.pos;
    ctx.fillStyle = "#d6cfc4";
    ctx.beginPath();
    ctx.roundRect(x - 55, y - 33, 110, 66, 8);
    ctx.fill();
    ctx.strokeStyle = "#a8a29e";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Üst parlama
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(x - 52, y - 30, 104, 10);
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

  // ── Duvar ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = "#6b5240";
  ctx.fillRect(0, WALL_Y1, GAME_WIDTH, 18);

  // Kapılar (servis pencereleri)
  DOOR_RANGES.forEach(([x1, x2]) => {
    const w = x2 - x1;
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x1, WALL_Y1, w, 18);
    ctx.fillStyle = "#d97706";
    ctx.fillRect(x1, WALL_Y1, w, 3);
  });

  // ── Dikey Duvar Kaldırıldı (lavabo alanı artık açık) ────────────────────────
  // Lavabo ve çöp alanına serbest erişim

  // ── Giriş kapısı (alt) ────────────────────────────────────────────────────
  ctx.fillStyle = "#78350f";
  ctx.fillRect(0, GAME_HEIGHT - 30, GAME_WIDTH, 30);
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(570, GAME_HEIGHT - 30, 140, 30);
  ctx.fillStyle = "#92400e";
  ctx.font = "bold 13px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GİRİŞ", 640, GAME_HEIGHT - 15);
}
