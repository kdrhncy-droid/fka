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
  DIRTY_TRAY_POS,
  TRAY_STATION,
  TABLE_X_SLOTS,
  TABLE_Y,
  WALL_Y1,
  WALL_Y2,
  isInDoor,
  ENTRANCE,
  OUTSIDE_QUEUE_Y,
  INGREDIENTS,
  HOLDING_STATION_POSITIONS,
  TABLE_HALF_W,
  TABLE_HALF_H,
} from "../types/game";

import { drawFloor } from "../renderer/drawFloor";
import { drawStation } from "../renderer/drawStation";
import { drawTable } from "../renderer/drawTable";
import { drawCustomer } from "../renderer/drawCustomer";
import { drawPlayer } from "../renderer/drawPlayer";
import { drawCookStation } from "../renderer/drawCookStation";
import { drawHoldingStation } from "../renderer/drawHoldingStation";
import { drawCounters } from "../renderer/drawCounter";

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
  audioElementsRef?: React.MutableRefObject<Record<string, HTMLAudioElement>>;
  globalVolume?: number;
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
// Cache version - değiştirince cache yenilenir
const FLOOR_CACHE_VERSION = 9; // Duvar tuğla doku + kapı çerçeve eklendi
let floorCache: OffscreenCanvas | HTMLCanvasElement | null = null;
let floorCacheVersion = 0;

function drawFloorCached(ctx: CanvasRenderingContext2D) {
  // Cache versiyonu değiştiyse yeniden oluştur
  if (floorCacheVersion !== FLOOR_CACHE_VERSION) {
    floorCache = null;
    floorCacheVersion = FLOOR_CACHE_VERSION;
  }

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
  audioElementsRef,
  globalVolume = 1.0,
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

    // Yüzen yazılar (bahşiş toplama efektleri vb.)
    const floatingTexts: { x: number; y: number; text: string; life: number; startY: number }[] = [];
    
    // Vuruş efektleri (yıldızlar)
    interface PunchParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    }
    const punchParticles: PunchParticle[] = [];

    // Socket tipCollector event dinleyicisi
    const handleTipCollected = (data: { x: number; y: number; amount: number }) => {
      floatingTexts.push({
        x: data.x,
        y: data.y - 20,
        text: `+$${data.amount}`,
        life: 60, // 60 frame boyunca yaşasın (yaklaşık 1 sn)
        startY: data.y - 20
      });
    };
    if (socket) socket.on("tipCollected", handleTipCollected);
    
    // Vuruş efekti event dinleyicisi
    const handlePunchEffect = (data: { x: number; y: number; count: number }) => {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const speed = 3 + Math.random() * 2;
        punchParticles.push({
          x: data.x,
          y: data.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          maxLife: 30
        });
      }
    };
    if (socket) socket.on("punchEffect", handlePunchEffect);

    const render = (time: number) => {
      const state = gameStateRef.current;
      const deltaMs = lastFrameTime === 0 ? 1000 / 60 : Math.min(50, time - lastFrameTime);
      lastFrameTime = time;
      const frameScale = deltaMs / (1000 / 60);

      // ── 1. Hareket (WASD + Joystick) + client-side duvar çarpışması ─────
      let dx = 0;
      let dy = 0;

      // Klavye (WASD + Ok Tuşları)
      if (keysRef.current.w || (keysRef.current as any).ArrowUp) dy -= 1;
      if (keysRef.current.s || (keysRef.current as any).ArrowDown) dy += 1;
      if (keysRef.current.a || (keysRef.current as any).ArrowLeft) dx -= 1;
      if (keysRef.current.d || (keysRef.current as any).ArrowRight) dx += 1;

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

        // Masa çarpışması (Server ile aynı mantık - AABB)
        const PR = 16;
        for (const tx of TABLE_X_SLOTS) {
          const left = tx - TABLE_HALF_W, right = tx + TABLE_HALF_W;
          const top = TABLE_Y - TABLE_HALF_H, bottom = TABLE_Y + TABLE_HALF_H;
          if (nx + PR > left && nx - PR < right && ny + PR > top && ny - PR < bottom) {
            const overlapL = (nx + PR) - left;
            const overlapR = right - (nx - PR);
            const overlapT = (ny + PR) - top;
            const overlapB = bottom - (ny - PR);
            const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
            if (minOverlap === overlapL) nx = left - PR;
            else if (minOverlap === overlapR) nx = right + PR;
            else if (minOverlap === overlapT) ny = top - PR;
            else ny = bottom + PR;
          }
        }

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
      const stock = state.stock ?? { "🍞": 0, "🥩": 0, "🥬": 0 };

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

      // Tepsi İstasyonu
      drawStation(ctx, TRAY_STATION.x, TRAY_STATION.y, "#8b5a2b", "🍽️", "Tepsi");

      // Çöp kutusu (Sağ alt köşe, ufak boyutlu)
      const trx = TRASH_STATION.x;
      const try_ = TRASH_STATION.y;

      // Küçük gri zemin
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(trx, try_ + 10, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Çöp kutusu gövde
      ctx.fillStyle = "#94a3b8"; // slate-400
      ctx.beginPath();
      ctx.moveTo(trx - 12, try_ - 15);
      ctx.lineTo(trx + 12, try_ - 15);
      ctx.lineTo(trx + 10, try_ + 10);
      ctx.lineTo(trx - 10, try_ + 10);
      ctx.closePath();
      ctx.fill();

      // Çöp kutusu üst kapak
      ctx.fillStyle = "#64748b"; // slate-500
      ctx.beginPath();
      ctx.ellipse(trx, try_ - 15, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Detay çizgiler
      ctx.strokeStyle = "#475569"; // slate-600
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trx - 6, try_ - 10); ctx.lineTo(trx - 5, try_ + 5);
      ctx.moveTo(trx, try_ - 10); ctx.lineTo(trx, try_ + 5);
      ctx.moveTo(trx + 6, try_ - 10); ctx.lineTo(trx + 5, try_ + 5);
      ctx.stroke();

      // Üstünde çöp yazısı kalsın ama küçük
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("ÇÖP", trx, try_ + 20);

      // Kirli Sepeti (Tabak yığını)
      const tcx = DIRTY_TRAY_POS.x;
      const tcy = DIRTY_TRAY_POS.y;

      // Tepsi arka planı
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.roundRect(tcx - 22, tcy - 16, 44, 32, 4);
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 2;
      ctx.stroke();

      // İçindeki tabaklar (max 5-6 tane üst üste görünsün ki çok taşıp çirkin durmasın)
      const displayCount = Math.min(6, state.dirtyTrayCount || 0);
      for (let i = 0; i < displayCount; i++) {
        const py = tcy + 4 - i * 4;
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.beginPath();
        ctx.ellipse(tcx + 1, py + 3, 18, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.ellipse(tcx, py, 18, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = "#92400e";
        ctx.beginPath();
        ctx.arc(tcx - 4, py - 1, 2.5, 0, Math.PI * 2);
        ctx.arc(tcx + 3, py + 1, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Üstünde kaç tane olduğunu yazan sayı
      if ((state.dirtyTrayCount || 0) > 0) {
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(state.dirtyTrayCount), tcx, tcy + 22);
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("SEPET", tcx, tcy);
      }

      // Bekletme İstasyonları (Prep Counters / Tabaklar)
      const hs = state.holdingStations;
      if (hs) {
        // Tabak rafları (üstte)
        for (const pos of HOLDING_STATION_POSITIONS) {
          const item = hs.find((s) => s.id === pos.id);
          drawHoldingStation(ctx, pos.x, pos.y, item);
        }

        // Servis masaları (duvarda)
        drawCounters(ctx, hs);
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

      const sp = state.players;
      if (sp) {
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

      // Proximity Audio (Mesafe bazlı ses)
      if (audioElementsRef && audioElementsRef.current && myId && sp[myId]) {
        const lp = localPlayerRef.current;
        Object.entries(audioElementsRef.current).forEach(([socketId, el]) => {
          const audioEl = el as HTMLAudioElement;
          const otherPlayer = sp[socketId];
          if (!otherPlayer) {
            audioEl.volume = 0;
            return;
          }
          const dist = Math.hypot(lp.x - otherPlayer.x, lp.y - otherPlayer.y);
          const MAX_HEAR_DIST = 350; // 350 piksel öteyi duyamazsın
          let vol = 1 - (dist / MAX_HEAR_DIST);
          if (vol < 0) vol = 0;
          if (vol > 1) vol = 1;

          audioEl.volume = vol * globalVolume;
        });
      }

      // Yüzen yazılar (floating texts) render
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];

        ctx.save();
        ctx.globalAlpha = ft.life / 60; // Giderek soluklaş
        ctx.translate(ft.x, ft.y);

        // Zıplama/Yukarı kayma animasyonu
        const progress = 1 - (ft.life / 60);
        ctx.translate(0, -progress * 30);

        // Yazı stili
        ctx.fillStyle = "#22c55e"; // emerald-500
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";

        // Gölge (outline)
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, 0, 0);
        ctx.fillText(ft.text, 0, 0);

        ctx.restore();

        ft.life--;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      // Vuruş efektleri render
      for (let i = punchParticles.length - 1; i >= 0; i--) {
        const p = punchParticles[i];
        
        ctx.save();
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.translate(p.x, p.y);
        
        // Yıldız çiz
        ctx.fillStyle = "#fbbf24"; // amber-400
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⭐", 0, 0);
        
        ctx.restore();
        
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Yerçekimi
        p.life--;
        
        if (p.life <= 0) punchParticles.splice(i, 1);
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
    return () => {
      cancelAnimationFrame(frameId);
      if (socket) {
        socket.off("tipCollected", handleTipCollected);
        socket.off("punchEffect", handlePunchEffect);
      }
    };
  }, [isJoined, myId, socket]);
}
