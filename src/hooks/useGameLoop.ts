import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  GameState,
  Player,
  WaitingGuest,
  GAME_WIDTH,
  GAME_HEIGHT,
  PLAYER_SPEED,
  TRASH_STATION,
  TABLE_X_SLOTS,
  TABLE_Y,
  WALL_Y1,
  WALL_Y2,
  isInDoor,
  UTIL_WALL_X1,
  UTIL_WALL_X2,
  isInUtilDoor,
  ENTRANCE,
  OUTSIDE_QUEUE_Y,
  INGREDIENTS,
  RECIPE_DEFS,
  HOLDING_STATION_POSITIONS,
} from "../types/game";

import { drawFloor } from "../renderer/drawFloor";
import { drawStation } from "../renderer/drawStation";
import { drawTable } from "../renderer/drawTable";
import { drawCustomer } from "../renderer/drawCustomer";
import { drawPlayer } from "../renderer/drawPlayer";
import { drawCookStation } from "../renderer/drawCookStation";
import { drawHoldingStation } from "../renderer/drawHoldingStation";

interface UseGameLoopProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isJoined: boolean;
  myId: string;
  socket: Socket | null;
  gameStateRef: React.MutableRefObject<GameState>;
  localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
  keysRef: React.MutableRefObject<{
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
  }>;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
}

// ─── Dışarıda bekleyenler (giriş kapısının önünde) ───────────────────────────
function drawWaitList(ctx: CanvasRenderingContext2D, list: WaitingGuest[]) {
  if (list.length === 0) return;

  const cx = ENTRANCE.x;
  const y = OUTSIDE_QUEUE_Y;

  // Arka plan — "Dışarı" pankartı
  ctx.fillStyle = "rgba(120, 53, 15, 0.85)";
  ctx.beginPath();
  ctx.roundRect(cx - 100, y - 18, 200, 20, 6);
  ctx.fill();
  ctx.fillStyle = "#fde68a";
  ctx.font = "bold 11px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`👥 Kapıda Bekleyen: ${list.length}`, cx, y - 8);

  // Müşteri figürleri sıralı
  list.forEach((g, i) => {
    const gx = cx - (list.length - 1) * 16 + i * 32;
    const gy = y + 8;

    // Küçük gövde
    ctx.fillStyle = "#64748b";
    ctx.beginPath();
    ctx.arc(gx, gy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Yüz
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(gx, gy - 2, 7, 0, Math.PI * 2);
    ctx.fill();

    // İstek balonu (mini)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(gx + 10, gy - 14, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g.wants || "?", gx + 10, gy - 14);
  });
}

function drawDirtyTable(ctx: CanvasRenderingContext2D, seatX: number, seatY: number) {
  // Masanın merkezi TABLE_Y = 500. Tabak masanın kenarında dursun.
  const isTopSeat = seatY < TABLE_Y;
  const plateY = isTopSeat ? TABLE_Y - 20 : TABLE_Y + 20;

  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.ellipse(seatX + 1, plateY + 3, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  ctx.ellipse(seatX, plateY, 18, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(seatX, plateY, 18, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#92400e";
  ctx.beginPath();
  ctx.arc(seatX - 4, plateY - 1, 2.5, 0, Math.PI * 2);
  ctx.arc(seatX + 3, plateY + 1, 2, 0, Math.PI * 2);
  ctx.arc(seatX + 8, plateY - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// ─── drawFloor cache — sadece 1 kez çiz, sonra bitmapten kopyala ────────────
let floorCache: OffscreenCanvas | HTMLCanvasElement | null = null;

function drawFloorCached(ctx: CanvasRenderingContext2D) {
  if (!floorCache) {
    if (typeof OffscreenCanvas !== "undefined") {
      floorCache = new OffscreenCanvas(GAME_WIDTH, GAME_HEIGHT);
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = GAME_WIDTH;
      canvas.height = GAME_HEIGHT;
      floorCache = canvas;
    }
    const offCtx = floorCache.getContext("2d");
    if (offCtx) {
      drawFloor(offCtx as unknown as CanvasRenderingContext2D);
      TABLE_X_SLOTS.forEach((tx) =>
        drawTable(offCtx as unknown as CanvasRenderingContext2D, tx, TABLE_Y),
      );
    }
  }
  ctx.drawImage(floorCache, 0, 0);
}

export function useGameLoop({
  canvasRef,
  isJoined,
  myId,
  socket,
  gameStateRef,
  localPlayerRef,
  keysRef,
  joystickVectorRef,
}: UseGameLoopProps) {
  useEffect(() => {
    if (!isJoined) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Floor cache invalidate on mount
    floorCache = null;

    let frameId = 0;
    let lastEmit = 0;
    let lastFrameTime = 0;

    const render = (time: number) => {
      const state = gameStateRef.current;
      const deltaMs = lastFrameTime === 0 ? 1000 / 60 : Math.min(50, time - lastFrameTime);
      lastFrameTime = time;
      const frameScale = deltaMs / (1000 / 60);

      // ── 1. Hareket (WASD + Joystick) + client-side duvar çarpışması ─────
      let dx = 0;
      let dy = 0;

      // Klavye
      if (keysRef.current.w) dy -= 1;
      if (keysRef.current.s) dy += 1;
      if (keysRef.current.a) dx -= 1;
      if (keysRef.current.d) dx += 1;

      // Joystick (eğer klavye yoksa joystick'e bak)
      if (dx === 0 && dy === 0) {
        dx = joystickVectorRef.current.x;
        dy = joystickVectorRef.current.y;
      }

      // Hız Normalizasyonu (Çapraz giderken hızlanmayı engelle)
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.1) {
        // Dist > 1 ise (örneğin W+D basılınca sqrt(2) olur), 1'e sabitle
        // Joystick zaten max 1 veriyor ama güvenliğe alalım.
        const speedMultiplier = dist > 1 ? 1 / dist : 1;
        dx = dx * speedMultiplier * PLAYER_SPEED * frameScale;
        dy = dy * speedMultiplier * PLAYER_SPEED * frameScale;
      }

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        const lp = localPlayerRef.current;
        let nx = Math.max(20, Math.min(GAME_WIDTH - 20, lp.x + dx));
        let ny = Math.max(20, Math.min(GAME_HEIGHT - 20, lp.y + dy));

        // Client-side yatay duvar çarpışması
        const wasAbove = lp.y < WALL_Y1;
        const wasBelow = lp.y > WALL_Y2;
        const goingThrough =
          (wasAbove && ny >= WALL_Y1) || (wasBelow && ny <= WALL_Y2);
        if (goingThrough && !isInDoor(nx)) {
          ny = wasAbove ? WALL_Y1 - 1 : WALL_Y2 + 1;
        }

        // Dikey duvar kontrolü kaldırıldı - lavabo alanı artık açık

        lp.x = nx;
        lp.y = ny;

        if (time - lastEmit > 50 && socket) {
          socket.emit("move", { x: nx, y: ny });
          lastEmit = time;
        }
      }

      // ── 2. Çizim ────────────────────────────────────────────────────────
      // Zemin (cached — FPS boost)
      drawFloorCached(ctx);

      // Masalar

      // Malzeme istasyonları (server ile uyumlu: hamur / et / sebze)
      const stock = state.stock ?? { "🫓": 0, "🥩": 0, "🥬": 0 };

      INGREDIENTS.forEach((ing) => {
        drawStation(
          ctx,
          ing.pos.x,
          ing.pos.y,
          ing.color,
          ing.key,
          ing.label,
          stock[ing.key] ?? 0,
        );
      });

      // Çöp kutusu
      drawStation(
        ctx,
        TRASH_STATION.x,
        TRASH_STATION.y,
        "#d1d5db",
        "🗑️",
        "Çöp",
      );

      // Bekletme İstasyonları (Prep Counters / Tabaklar)
      const hs = state.holdingStations;
      if (hs) {
        for (const pos of HOLDING_STATION_POSITIONS) {
          const item = hs.find((s) => s.id === pos.id);
          drawHoldingStation(ctx, pos.x, pos.y, item);
        }
      }

      // Pişirme istasyonları
      // Universal fırınlar
      const cookStations = state.cookStations;
      if (cookStations) {
        for (const station of cookStations) {
          drawCookStation(ctx, station, time);
        }
      }

      // Müşteriler
      state.customers.forEach((c) => drawCustomer(ctx, c));
      (state.dirtyTables ?? []).forEach((t) => drawDirtyTable(ctx, t.seatX, t.seatY));

      // Kapıda bekleyenler
      drawWaitList(ctx, state.waitList ?? []);

      // Oyuncular
      const sp = state.players;
      if (myId && sp[myId]) {
        Object.values(sp).forEach((p: Player) => {
          const isMe = p.id === myId;
          drawPlayer(
            ctx,
            isMe ? localPlayerRef.current.x : p.x,
            isMe ? localPlayerRef.current.y : p.y,
            p,
            isMe,
          );
        });
      }

      // Gece overlay
      if (state.dayPhase === "night") {
        ctx.fillStyle = "rgba(5,10,60,0.45)";
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        [
          [80, 25],
          [200, 55],
          [420, 18],
          [660, 42],
          [870, 22],
          [1100, 48],
          [1220, 70],
          [320, 35],
          [740, 60],
          [950, 30],
        ].forEach(([sx, sy]) => {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.font = "32px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.fillText("🌙", GAME_WIDTH - 16, 14);
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [isJoined, myId, socket]);
}
