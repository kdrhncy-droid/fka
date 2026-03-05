import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { MARKET_NAME } from "./src/constants";

// ─── Shared'dan import (tek kaynak) ──────────────────────────────────────────
import {
  type StockKey,
  type UpgradeKey,
  type Player,
  type Customer,
  type WaitingGuest,
  type CookStation,
  type Upgrades,
  type GameState,
  GAME_WIDTH,
  GAME_HEIGHT,
  DAY_TICKS,
  NIGHT_TICKS,
  CLOSING_THRESHOLD,
  WALL_Y1,
  WALL_Y2,
  isInDoor,
  UTIL_WALL_X1,
  UTIL_WALL_X2,
  isInUtilDoor,
  INGREDIENTS,
  COOK_STATION_DEFS,
  TRASH_STATION,
  SEAT_SLOTS,
  DISH_ITEMS,
  UPGRADE_DEFS,
  BURN_TICKS,
  BURNED_FOOD,
} from "./shared/types";

// ─── Server-Only Sabitler ────────────────────────────────────────────────────
const INTERACT_R = 90;
const SERVE_R = 100;
const EAT_TICKS = 90;
const INTERACT_COOLDOWN = 200; // ms

// ─── Room Yönetimi ───────────────────────────────────────────────────────────
const rooms: Record<string, GameState> = {};

function mkCook(): CookStation { return { input: null, timer: 0, output: null }; }

function mkRoom(): GameState {
  return {
    players: {}, customers: [], waitList: [],
    score: 0, stock: { '🫓': 10, '🥩': 10, '🥬': 10 },
    marketName: MARKET_NAME, dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, stockMax: 0 }, day: 1,
    cookStations: { pizza: mkCook(), grill: mkCook(), salad: mkCook() },
  };
}

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────
function patLimit(lv: number) { return 1200 + 300 * lv; } // Biraz daha sabırsız oldular (eskiden 1500 + 400dü)
function earn(lv: number) { return 10 + 5 * lv; }
function cap(lv: number) { return 15 + 5 * lv; }

function tryQueueSeat(gs: GameState, io: Server, rid: string) {
  while (gs.waitList.length > 0) {
    const occupied = new Set(gs.customers.map(c => `${c.seatX},${c.seatY}`));
    const free = SEAT_SLOTS.filter(s => !occupied.has(`${s.x},${s.y}`));
    if (!free.length) break;
    const guest = gs.waitList.shift()!;
    const seat = free[Math.floor(Math.random() * free.length)];
    const maxP = patLimit(gs.upgrades.patience);
    gs.customers.push({
      id: guest.id, seatX: seat.x, seatY: seat.y,
      x: seat.x, y: GAME_HEIGHT + 60, targetY: seat.y,
      wants: guest.wants, patience: maxP, maxPatience: maxP,
      isSeated: false, isEating: false, eatTimer: 0,
    });
    io.to(rid).emit("sound", "arrive");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER
// ═══════════════════════════════════════════════════════════════════════════════
async function startServer() {
  const app = express(), httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: "*" } });
  const PORT = process.env.PORT || 3000;
  app.get("/api/health", (_, res) => res.json({ status: "ok" }));

  io.on("connection", (socket) => {
    let roomId: string | null = null;
    let lastInteract = 0; // BUG-1: cooldown tracking

    socket.on("join", (d: { name: string; color: string; hat: string; roomId: string; marketName: string }) => {
      roomId = d.roomId || "default";
      if (!rooms[roomId]) { rooms[roomId] = mkRoom(); if (d.marketName) rooms[roomId].marketName = d.marketName; }
      const gs = rooms[roomId]; socket.join(roomId);
      gs.players[socket.id] = {
        id: socket.id,
        x: GAME_WIDTH / 2 + (Math.random() - .5) * 120,
        y: 340 + (Math.random() - .5) * 50,
        holding: null, color: d.color, name: d.name || "Oyuncu", hat: d.hat || "",
      };
      socket.emit("init", { id: socket.id, state: gs });
    });

    socket.on("move", ({ x, y }: { x: number; y: number }) => {
      if (!roomId || !rooms[roomId]?.players[socket.id]) return;
      const p = rooms[roomId].players[socket.id];
      let nx = Math.max(20, Math.min(GAME_WIDTH - 20, x));
      let ny = Math.max(20, Math.min(GAME_HEIGHT - 20, y));
      // Yatay duvar (mutfak↔salon)
      const wasAbove = p.y < WALL_Y1, wasBelow = p.y > WALL_Y2;
      if (((wasAbove && ny >= WALL_Y1) || (wasBelow && ny <= WALL_Y2)) && !isInDoor(nx))
        ny = wasAbove ? WALL_Y1 - 1 : WALL_Y2 + 1;
      // Dikey duvar (mutfak↔lavabo) — sadece mutfak alanında (y < WALL_Y1)
      if (ny < WALL_Y1) {
        const wasLeft = p.x < UTIL_WALL_X1, wasRight = p.x > UTIL_WALL_X2;
        if (((wasLeft && nx >= UTIL_WALL_X1) || (wasRight && nx <= UTIL_WALL_X2)) && !isInUtilDoor(ny))
          nx = wasLeft ? UTIL_WALL_X1 - 1 : UTIL_WALL_X2 + 1;
      }
      p.x = nx; p.y = ny;
    });

    socket.on("interact", () => {
      if (!roomId || !rooms[roomId]) return;
      // BUG-1: 200ms cooldown
      const now = Date.now();
      if (now - lastInteract < INTERACT_COOLDOWN) return;
      lastInteract = now;
      const gs = rooms[roomId], p = gs.players[socket.id]; if (!p) return;
      const { x: px, y: py } = p;

      // Çöp (Yanmış yemek atılırsa ceza kestir)
      if (Math.hypot(px - TRASH_STATION.x, py - TRASH_STATION.y) < INTERACT_R) {
        if (p.holding === BURNED_FOOD) {
          gs.score = Math.max(0, gs.score - 2); // Kömür atma cezası
          io.to(roomId!).emit("sound", "fail");
        } else {
          socket.emit("sound", "trash");
        }
        p.holding = null;
        return;
      }

      // Pişirme istasyonları
      for (const [id, def] of Object.entries(COOK_STATION_DEFS) as [keyof typeof COOK_STATION_DEFS, typeof COOK_STATION_DEFS[keyof typeof COOK_STATION_DEFS]][]) {
        const st = gs.cookStations[id];
        if (Math.hypot(px - def.pos.x, py - def.pos.y) < INTERACT_R) {
          if (p.holding === def.input && !st.input && !st.output) {
            // Yemeği koy
            st.input = p.holding; st.timer = def.time; p.holding = null;
            st.isBurned = false; st.burnTimer = 0;
            socket.emit("sound", "pickup");
          } else if (!p.holding && st.output && !st.isBurned) {
            // Normal (pişmiş) yemeği al
            p.holding = st.output; st.output = null; st.burnTimer = 0;
            socket.emit("sound", "success");
          } else if (!p.holding && st.isBurned) {
            // YANMIŞ yemeği (kömür) al
            p.holding = BURNED_FOOD; st.output = null; st.isBurned = false; st.burnTimer = 0;
            socket.emit("sound", "trash");
          }
          return;
        }
      }

      // Müşteriye servis
      if (p.holding) {
        const ci = gs.customers.findIndex(c =>
          c.isSeated && !c.isEating && c.wants === p.holding &&
          Math.hypot(px - c.seatX, py - c.seatY) < SERVE_R
        );
        if (ci !== -1) {
          gs.score += earn(gs.upgrades.earnings);
          gs.customers[ci].isEating = true; gs.customers[ci].eatTimer = EAT_TICKS;
          gs.customers[ci].wants = null; p.holding = null;
          io.to(roomId!).emit("sound", "success");
        }
        return;
      }

      // Malzeme al
      for (const s of INGREDIENTS) {
        if (Math.hypot(px - s.pos.x, py - s.pos.y) < INTERACT_R && gs.stock[s.key] > 0) {
          p.holding = s.key; gs.stock[s.key]--; socket.emit("sound", "pickup"); return;
        }
      }
    });

    socket.on("order", () => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId]; if (gs.dayPhase !== 'night') return;
      const c = cap(gs.upgrades.stockMax);
      (['🫓', '🥩', '🥬'] as StockKey[]).forEach(k => { gs.stock[k] = c; });
      io.to(roomId!).emit("sound", "success");
    });

    socket.on("upgrade", (id: UpgradeKey) => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId]; if (gs.dayPhase !== 'night') return;
      const def = UPGRADE_DEFS[id]; if (!def) return;
      const lv = gs.upgrades[id]; if (lv >= def.max) return;
      const cost = def.costs[lv]; if (gs.score < cost) { socket.emit("sound", "fail"); return; }
      gs.score -= cost; gs.upgrades[id]++;
      socket.emit("sound", "success");
    });

    // Dükkanı aç — prep → day geçişi
    socket.on("openShop", () => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId]; if (gs.dayPhase !== 'prep') return;
      gs.dayPhase = 'day'; gs.dayTimer = DAY_TICKS;
      io.to(roomId!).emit("sound", "arrive");
    });

    socket.on("nextDay", () => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId]; if (gs.dayPhase !== 'night') return;
      gs.dayPhase = 'prep'; gs.dayTimer = DAY_TICKS; gs.day++;
      gs.customers = []; gs.waitList = [];
      gs.cookStations = { pizza: mkCook(), grill: mkCook(), salad: mkCook() };
      io.to(roomId!).emit("sound", "arrive");
    });

    socket.on("disconnect", () => {
      if (!roomId || !rooms[roomId]) return;
      delete rooms[roomId].players[socket.id];
      if (!Object.keys(rooms[roomId].players).length) delete rooms[roomId];
    });
  });

  // ─── Game Loop (30fps) ─────────────────────────────────────────────────────
  setInterval(() => {
    for (const rid of Object.keys(rooms)) {
      const gs = rooms[rid];
      if (!gs.stock) gs.stock = { '🫓': 10, '🥩': 10, '🥬': 10 };

      // Pişirme & Yanma timer
      for (const [id, def] of Object.entries(COOK_STATION_DEFS) as [keyof typeof COOK_STATION_DEFS, typeof COOK_STATION_DEFS[keyof typeof COOK_STATION_DEFS]][]) {
        const st = gs.cookStations[id];
        if (st.input && st.timer > 0) {
          // Pişiyor
          st.timer--;
          if (st.timer === 0) {
            st.output = def.output; st.input = null;
            st.isBurned = false;
            st.burnTimer = BURN_TICKS; // Yanma süreci başlar
          }
        } else if (st.output && st.burnTimer !== undefined && st.burnTimer > 0 && !st.isBurned) {
          // Pişti, bekliyor, yanmaya yaklaşıyor
          st.burnTimer--;
          if (st.burnTimer === 0) {
            st.isBurned = true; // Kömür oldu
            io.to(rid).emit("sound", "fail");
          }
        }
      }

      // Prep fazında timer işlemez — oyuncu dükkanı açana kadar bekle
      if (gs.dayPhase === 'prep') {
        // Pişirme devam eder (hazırlık yapabilsin) ama timer yok, müşteri yok
      }

      // Gündüz timer
      if (gs.dayPhase === 'day') {
        gs.dayTimer--;
        if (gs.dayTimer <= 0) {
          gs.dayPhase = 'night'; gs.dayTimer = NIGHT_TICKS;
          const c = cap(gs.upgrades.stockMax);
          (['🫓', '🥩', '🥬'] as StockKey[]).forEach(k => {
            gs.stock[k] = Math.min(c, gs.stock[k] + 5);
          });
        }
      }

      // Gece timer — sadece UI göstergesi, otomatik geçiş YOK
      // Sadece nextDay butonu ile prep fazına geçilir (çift day++ bug'ını önler)
      if (gs.dayPhase === 'night') {
        if (gs.dayTimer > 0) gs.dayTimer--;
      }

      // Spawn — sadece gündüz + kapanışa yakın durur
      if (gs.dayPhase === 'day' && gs.dayTimer > CLOSING_THRESHOLD) {
        const dayProgress = 1 - gs.dayTimer / DAY_TICKS;
        const spawnRate = 0.003 + dayProgress * 0.004;
        if (Math.random() < spawnRate && gs.customers.length + gs.waitList.length < 10) {
          gs.waitList.push({
            id: Math.random().toString(36).slice(2, 9),
            wants: DISH_ITEMS[Math.floor(Math.random() * DISH_ITEMS.length)],
          });
        }
      }
      tryQueueSeat(gs, io, rid);

      // Müşteri güncelle
      for (let i = gs.customers.length - 1; i >= 0; i--) {
        const c = gs.customers[i];
        if (c.isEating) {
          c.eatTimer--;
          if (c.eatTimer <= 0) { gs.customers.splice(i, 1); tryQueueSeat(gs, io, rid); }
          continue;
        }
        if (!c.isSeated) {
          c.y = Math.max(c.targetY, c.y - 3);
          if (c.y <= c.targetY) c.isSeated = true;
        } else {
          // BUG-6: sadece gündüz patience azalır (gece/prep'te dondur)
          if (gs.dayPhase === 'day') {
            c.patience--;
            if (c.patience <= 0) {
              gs.score = Math.max(0, gs.score - 5);
              gs.customers.splice(i, 1);
              io.to(rid).emit("sound", "fail");
              tryQueueSeat(gs, io, rid);
            }
          }
        }
      }

      io.to(rid).emit("state", gs);
    }
  }, 1000 / 30);

  // ─── Static / Vite ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else { app.use(express.static("dist")); }

  httpServer.listen(PORT as number, "0.0.0.0", () => console.log(`Server → port ${PORT}`));
}
startServer();
