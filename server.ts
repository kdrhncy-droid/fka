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
  type Item,
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
  RECIPE_DEFS,
  INITIAL_OVEN_POSITIONS,
  ADDITIONAL_OVEN_POSITIONS,
  OVEN_UPGRADE_COSTS,
  TRASH_STATION,
  SINK_STATION,
  SEAT_SLOTS,
  DISH_ITEMS,
  UPGRADE_DEFS,
  BURN_TICKS,
  BURNED_FOOD,
  CLEAN_PLATE,
  DIRTY_PLATE,
  HOLDING_STATION_POSITIONS,
} from "./shared/types";

// ─── Server-Only Sabitler ────────────────────────────────────────────────────
const INTERACT_R = 90;
const TRASH_INTERACT_R = 56;
const SERVE_R = 100;
const EAT_TICKS = 90;
const INTERACT_COOLDOWN = 200; // ms
const LOGIC_STEP_MS = 1000 / 30;

// ─── Room Yönetimi ───────────────────────────────────────────────────────────
const rooms: Record<string, GameState> = {};

function mkCook(id: string, x: number, y: number): CookStation { 
    return { input: null, timer: 0, output: null, id, x, y }; 
}

function mkRoom(): GameState {
  // Başlangıçta sadece 1 fırın
  const initialOvens = INITIAL_OVEN_POSITIONS.map((pos, i) => 
    mkCook(`oven${i + 1}`, pos.x, pos.y)
  );

  return {
    players: {}, customers: [], waitList: [],
    holdingStations: HOLDING_STATION_POSITIONS.map(p => ({ id: p.id, item: CLEAN_PLATE })),
    dirtyTables: [],
    score: 0, stock: { '🫓': 10, '🥩': 10, '🥬': 10 },
    marketName: MARKET_NAME, dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, stockMax: 0 }, day: 1, hasOrderedTonight: false,
    cookStations: initialOvens,
  };
}

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────
function patLimit(lv: number) { return 1200 + 300 * lv; } // Biraz daha sabırsız oldular (eskiden 1500 + 400dü)
function earn(lv: number) { return 10 + 5 * lv; }
function cap(lv: number) { return 15 + 5 * lv; }
function isDish(item: Item): item is string { return !!item && DISH_ITEMS.includes(item as any); }

function tryQueueSeat(gs: GameState, io: Server, rid: string) {
  if (gs.dayPhase !== "day") return;
  while (gs.waitList.length > 0) {
    const occupied = new Set([
      ...gs.customers.map(c => `${c.seatX},${c.seatY}`),
      ...gs.dirtyTables.map(t => `${t.seatX},${t.seatY}`),
    ]);
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

    socket.on("join", (d: { name: string; color: string; hat: string; charType?: number; roomId: string; marketName: string }) => {
      roomId = d.roomId || "default";
      if (!rooms[roomId]) { rooms[roomId] = mkRoom(); if (d.marketName) rooms[roomId].marketName = d.marketName; }
      const gs = rooms[roomId]; socket.join(roomId);
      gs.players[socket.id] = {
        id: socket.id,
        x: GAME_WIDTH / 2 + (Math.random() - .5) * 120,
        y: 340 + (Math.random() - .5) * 50,
        holding: null, color: d.color, name: d.name || "Oyuncu", hat: d.hat || "", charType: d.charType ?? 0,
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
      // Dikey duvar kontrolü kaldırıldı - lavabo alanı artık açık
      p.x = nx; p.y = ny;
    });

    socket.on("interact", () => {
      if (!roomId || !rooms[roomId]) return;
      // BUG-1: 200ms cooldown
      const now = Date.now();
      if (now - lastInteract < INTERACT_COOLDOWN) return;
      lastInteract = now;
      const gs = rooms[roomId], p = gs.players[socket.id]; if (!p) return;
      if (gs.dayPhase === "night") return;
      const { x: px, y: py } = p;

      // Çöp (Yanmış yemek atılırsa ceza kestir, tabaklar yok edilmesin)
      if (Math.hypot(px - TRASH_STATION.x, py - TRASH_STATION.y) < TRASH_INTERACT_R) {
        if (p.holding === CLEAN_PLATE || p.holding === DIRTY_PLATE) {
          socket.emit("sound", "fail");
          return;
        }
        if (p.holding === BURNED_FOOD) {
          gs.score = Math.max(0, gs.score - 2);
          io.to(roomId!).emit("sound", "fail");
        } else {
          socket.emit("sound", "trash");
        }
        p.holding = null;
        return;
      }

      // Lavabo: kirli tabak temizlenir
      if (Math.hypot(px - SINK_STATION.x, py - SINK_STATION.y) < INTERACT_R) {
        if (p.holding === DIRTY_PLATE) {
          p.holding = CLEAN_PLATE;
          socket.emit("sound", "success");
        }
        return;
      }

      // Kirli masa: boş elle tabak topla
      const dirtyIdx = gs.dirtyTables.findIndex(t =>
        Math.hypot(px - t.seatX, py - t.seatY) < SERVE_R
      );
      if (dirtyIdx !== -1) {
        if (!p.holding) {
          p.holding = DIRTY_PLATE;
          gs.dirtyTables.splice(dirtyIdx, 1);
          socket.emit("sound", "pickup");
        }
        return;
      }

      // Bekletme İstasyonları (tabak rafı / plating counter)
      for (const plate of gs.holdingStations) {
        const def = HOLDING_STATION_POSITIONS.find(pos => pos.id === plate.id);
        if (!def || Math.hypot(px - def.x, py - def.y) >= INTERACT_R) continue;

        if (!p.holding && plate.item) {
          p.holding = plate.item;
          plate.item = null;
          socket.emit("sound", "pickup");
          return;
        }

        if (p.holding === CLEAN_PLATE && !plate.item) {
          plate.item = CLEAN_PLATE;
          p.holding = null;
          socket.emit("sound", "pickup");
          return;
        }

        if (isDish(p.holding) && plate.item === CLEAN_PLATE) {
          plate.item = p.holding;
          p.holding = null;
          socket.emit("sound", "success");
          return;
        }
      }

      // Universal fırınlar - her fırında her yemek yapılabilir
      for (const station of gs.cookStations) {
        if (Math.hypot(px - station.x, py - station.y) < INTERACT_R) {
          // Malzeme koyma - herhangi bir malzeme kabul edilir
          if (INGREDIENTS.some(ing => ing.key === p.holding) && !station.input && !station.output) {
            const recipe = RECIPE_DEFS[p.holding as keyof typeof RECIPE_DEFS];
            if (recipe) {
              station.input = p.holding; 
              station.timer = recipe.time; 
              p.holding = null;
              station.isBurned = false; 
              station.burnTimer = 0;
              socket.emit("sound", "pickup");
            }
          } 
          // Temiz tabakla yemek alma
          else if (p.holding === CLEAN_PLATE && station.output && !station.isBurned) {
            p.holding = station.output; 
            station.output = null; 
            station.burnTimer = 0;
            socket.emit("sound", "success");
          } 
          // Yanmış yemek alma
          else if (!p.holding && station.isBurned) {
            p.holding = BURNED_FOOD; 
            station.output = null; 
            station.isBurned = false; 
            station.burnTimer = 0;
            socket.emit("sound", "trash");
          } 
          // Hata durumu - tabaksız yemek almaya çalışma
          else if (!p.holding && station.output && !station.isBurned) {
            socket.emit("sound", "fail");
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
      if (gs.hasOrderedTonight) { socket.emit("sound", "fail"); return; }
      const c = cap(gs.upgrades.stockMax);
      (['🫓', '🥩', '🥬'] as StockKey[]).forEach(k => { gs.stock[k] = c; });
      gs.hasOrderedTonight = true;
      io.to(roomId!).emit("sound", "success");
    });

    socket.on("buyOven", () => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId]; 
      if (gs.dayPhase !== 'night') return;
      
      const currentOvenCount = gs.cookStations.length;
      const maxOvens = INITIAL_OVEN_POSITIONS.length + ADDITIONAL_OVEN_POSITIONS.length;
      
      // Max fırın kontrolü
      if (currentOvenCount >= maxOvens) {
        socket.emit("sound", "fail");
        return;
      }
      
      const ovenIndex = currentOvenCount - INITIAL_OVEN_POSITIONS.length;
      
      // Array bounds kontrolü
      if (ovenIndex < 0 || ovenIndex >= OVEN_UPGRADE_COSTS.length) {
        socket.emit("sound", "fail");
        return;
      }
      
      const cost = OVEN_UPGRADE_COSTS[ovenIndex];
      
      if (gs.score < cost) {
        socket.emit("sound", "fail");
        return;
      }
      
      // Pozisyon kontrolü
      if (ovenIndex >= ADDITIONAL_OVEN_POSITIONS.length) {
        socket.emit("sound", "fail");
        return;
      }
      
      gs.score -= cost;
      const newPos = ADDITIONAL_OVEN_POSITIONS[ovenIndex];
      gs.cookStations.push(mkCook(`oven${currentOvenCount + 1}`, newPos.x, newPos.y));
      socket.emit("sound", "success");
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
      gs.hasOrderedTonight = false;
      gs.cookStations.forEach(station => {
        station.input = null;
        station.timer = 0;
        station.output = null;
        station.isBurned = false;
        station.burnTimer = 0;
      });
      io.to(roomId!).emit("sound", "arrive");
    });

    socket.on("disconnect", () => {
      if (!roomId || !rooms[roomId]) return;
      delete rooms[roomId].players[socket.id];
      if (!Object.keys(rooms[roomId].players).length) delete rooms[roomId];
    });
  });

  // ─── Game Loop (30fps) ─────────────────────────────────────────────────────
  let lastLogicAt = Date.now();
  let lagMs = 0;

  setInterval(() => {
    const now = Date.now();
    lagMs = Math.min(LOGIC_STEP_MS * 5, lagMs + (now - lastLogicAt));
    lastLogicAt = now;

    let steps = 0;
    while (lagMs >= LOGIC_STEP_MS && steps < 5) {
      lagMs -= LOGIC_STEP_MS;
      steps++;
      for (const rid of Object.keys(rooms)) {
      const gs = rooms[rid];
      if (!gs.stock) gs.stock = { '🫓': 10, '🥩': 10, '🥬': 10 };

      // Universal fırın sistemi - pişirme & yanma timer
      for (const station of gs.cookStations) {
        if (station.input && station.timer > 0) {
          // Pişiyor
          station.timer--;
          if (station.timer === 0) {
            const recipe = RECIPE_DEFS[station.input as keyof typeof RECIPE_DEFS];
            if (recipe) {
              station.output = recipe.output; 
              station.input = null;
              station.isBurned = false;
              station.burnTimer = BURN_TICKS; // Yanma süreci başlar
            }
          }
        } else if (station.output && station.burnTimer !== undefined && station.burnTimer > 0 && !station.isBurned) {
          // Pişti, bekliyor, yanmaya yaklaşıyor
          station.burnTimer--;
          if (station.burnTimer === 0) {
            station.isBurned = true; // Kömür oldu
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
        if (gs.dayTimer > 0) gs.dayTimer--;
        if (gs.dayTimer <= 0 && gs.customers.length === 0 && gs.waitList.length === 0) {
          gs.dayPhase = 'night'; gs.dayTimer = NIGHT_TICKS; gs.hasOrderedTonight = false;
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
        // Günden güne artan zorluk (ilk günlerde az, ilerledikçe artan baz oran)
        const baseRate = 0.001 + Math.min(gs.day * 0.0005, 0.005);

        // Gün içindeki ilerlemeye göre hafif artış (öğle yoğunluğu)
        const dayProgress = 1 - gs.dayTimer / DAY_TICKS;
        const currentRate = baseRate + (dayProgress * 0.001);

        if (Math.random() < currentRate && gs.customers.length + gs.waitList.length < 10) {
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
          if (c.eatTimer <= 0) {
            gs.dirtyTables.push({ seatX: c.seatX, seatY: c.seatY });
            gs.customers.splice(i, 1);
            tryQueueSeat(gs, io, rid);
          }
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
    }
  }, LOGIC_STEP_MS);

  // ─── Static / Vite ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else { app.use(express.static("dist")); }

  httpServer.listen(PORT as number, "0.0.0.0", () => console.log(`Server → port ${PORT}`));
}
startServer();
