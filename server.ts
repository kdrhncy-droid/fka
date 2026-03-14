import { Server } from "socket.io";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { 
  GameState, Player, Customer, Item, StockKey, UpgradeKey, Personality,
  GAME_WIDTH, GAME_HEIGHT, DAY_TICKS, NIGHT_TICKS, 
  DISH_ITEMS, SEAT_SLOTS, INGREDIENTS, RECIPE_DEFS,
  INITIAL_OVEN_POSITIONS, ADDITIONAL_OVEN_POSITIONS, OVEN_UPGRADE_COSTS,
  HOLDING_STATION_POSITIONS, COUNTER_POSITIONS,
  CLEAN_PLATE, DIRTY_PLATE, BURNED_FOOD, EAT_TICKS,
  MAX_TRAY_CAPACITY, isTray, getTrayItems, createTray,
  SINK_STATION,
  mkGameState,
  mkCook
} from "./shared/types.js";
import { DIALOGUES } from "./shared/dialogues.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Statik dosyaları sun (Vite build sonrası dist klasörü)
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─── Sabitler ────────────────────────────────────────────────────────────────
const LOGIC_STEP_MS = 33; // ~30 FPS
const INTERACT_R = 75;    // Etkileşim yarıçapı
const SERVE_R = 95;       // Servis yarıçapı
const CLOSING_THRESHOLD = 300; // Kapanışa kaç tick kala spawn dursun

const TABLE_X_SLOTS = [190, 390, 640, 890, 1090];
const TABLE_Y = 500;

// ─── Yardımcı Fonksiyonlar ───────────────────────────────────────────────────
function patLimit(lv: number) { return 1200 + 300 * lv; }
function earn(lv: number) { return 10 + 5 * lv; }
function isDish(item: Item): item is string { return !!item && DISH_ITEMS.includes(item as any); }
function cap(lv: number) { return 15 + 5 * lv; }

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
      tipAmount: undefined,
      personality: guest.personality,
      currentDialog: guest.currentDialog,
      dialogTimer: guest.dialogTimer,
      isBeatUp: false,
      isLeaving: false,
      bodyShape: guest.bodyShape,
      bodyColor: guest.bodyColor,
      punchCount: 0,
    });
    io.to(rid).emit("sound", "arrive");
  }
}

// ─── Room Manager ────────────────────────────────────────────────────────────
class RoomManager {
  private static states = new Map<string, GameState>();
  private static intervals = new Map<string, NodeJS.Timeout>();

  static getRoomState(rid: string): GameState | undefined { return this.states.get(rid); }
  static setRoomState(rid: string, gs: GameState) { this.states.set(rid, gs); }
  static deleteRoom(rid: string) {
    this.states.delete(rid);
    if (this.intervals.has(rid)) {
      clearInterval(this.intervals.get(rid)!);
      this.intervals.delete(rid);
    }
  }
  static setInterval(rid: string, interval: NodeJS.Timeout) { this.intervals.set(rid, interval); }
}

io.on("connection", (socket) => {
  let roomId: string | null = null;
  let playerId: string | null = null;

  socket.on("join", ({ room, roomId: clientRoomId, name, color, hat, charType }) => {
    roomId = room || clientRoomId;
    playerId = socket.id;
    socket.join(roomId);

    // İstemciye kendi ID'sini ve mevcut state'i gönder
    socket.emit("init", { id: socket.id, state: RoomManager.getRoomState(roomId) || mkGameState() });

    if (!RoomManager.getRoomState(roomId)) {
      RoomManager.setRoomState(roomId, mkGameState());
      const gs = RoomManager.getRoomState(roomId)!;

      const interval = setInterval(() => {
        const rid = roomId;
        const gs = RoomManager.getRoomState(rid);
        if (!gs || gs.isGameOver) return;

        // Fırınları güncelle
        gs.cookStations.forEach(s => {
          if (s.input && s.timer > 0) {
            s.timer--;
            if (s.timer <= 0) {
              s.output = s.input;
              s.input = null;
              s.burnTimer = BURN_TICKS;
            }
          } else if (s.output && s.burnTimer > 0) {
            s.burnTimer--;
            if (s.burnTimer <= 0) {
              s.isBurned = true;
              s.output = BURNED_FOOD;
            }
          }
        });

        // Gündüz timer
        if (gs.dayPhase === 'day') {
          if (gs.dayTimer > 0) gs.dayTimer--;
          if (gs.dayTimer <= 0 && gs.customers.length === 0 && gs.waitList.length === 0 && gs.dirtyTables.length === 0) {
            gs.dayPhase = 'night'; gs.dayTimer = NIGHT_TICKS; gs.hasOrderedTonight = false;
            const c = cap(gs.upgrades.stockMax);
            (['🍞', '🥩', '🥬', '🥘', '🍢'] as StockKey[]).forEach(k => {
              gs.stock[k] = Math.min(c, gs.stock[k] + 5);
            });
          }
        }

        if (gs.dayPhase === 'night') {
          if (gs.dayTimer > 0) gs.dayTimer--;
        }

        // Spawn
        if (gs.dayPhase === 'day' && gs.dayTimer > CLOSING_THRESHOLD) {
          const baseRate = 0.001 + Math.min(gs.day * 0.0005, 0.005);
          const dayProgress = 1 - gs.dayTimer / DAY_TICKS;
          const playerCount = Object.keys(gs.players).length || 1;
          const spawnMultiplier = 1 + (playerCount - 1) * 0.6;
          const queueLimit = 10 + (playerCount - 1) * 3;
          const currentRate = (baseRate + (dayProgress * 0.001)) * spawnMultiplier;

          if (Math.random() < currentRate && gs.customers.length + gs.waitList.length < queueLimit) {
            const personalities: Personality[] = ['polite', 'rude', 'recep'];
            const pers = personalities[Math.floor(Math.random() * personalities.length)];
            let dialog: string | undefined;
            let timer: number | undefined;

            if (Math.random() < 0.3) {
              const list = DIALOGUES[pers].entry;
              dialog = list[Math.floor(Math.random() * list.length)];
              timer = 90;
            }

            const bodyShapes = [1, 2, 3, 4] as const;
            const bodyColors: Record<Personality, string[]> = {
              polite: ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6'],
              rude: ['#f59e0b', '#ef4444', '#f97316', '#dc2626'],
              recep: ['#7c3aed', '#b91c1c', '#1d4ed8', '#064e3b'],
              thug: ['#000000', '#1c1917', '#7f1d1d', '#57534e'],
            };
            const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
            const colorPool = bodyColors[pers];
            const bodyColor = colorPool[Math.floor(Math.random() * colorPool.length)];

            gs.waitList.push({
              id: Math.random().toString(36).slice(2, 9),
              wants: DISH_ITEMS[Math.floor(Math.random() * DISH_ITEMS.length)],
              personality: pers,
              currentDialog: dialog,
              dialogTimer: timer,
              bodyShape,
              bodyColor,
            });
          }

          // Revenge Queue
          for (let i = gs.revengeQueue.length - 1; i >= 0; i--) {
            gs.revengeQueue[i]--;
            if (gs.revengeQueue[i] <= 0) {
              gs.revengeQueue.splice(i, 1);
              const thugCount = 3 + Math.floor(Math.random() * 2);
              for (let j = 0; j < thugCount; j++) {
                const bodyShapes = [2, 4] as const;
                const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
                const bodyColors = ['#000000', '#1c1917', '#7f1d1d', '#57534e'];
                const bodyColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];
                const list = DIALOGUES.thug.revenge;
                const dialog = list[Math.floor(Math.random() * list.length)];
                gs.waitList.push({
                  id: Math.random().toString(36).slice(2, 9),
                  wants: DISH_ITEMS[Math.floor(Math.random() * DISH_ITEMS.length)],
                  personality: 'thug',
                  currentDialog: dialog,
                  dialogTimer: 150,
                  bodyShape,
                  bodyColor,
                });
              }
              io.to(rid).emit("sound", "fail");
            }
          }
        }
        tryQueueSeat(gs, io, rid);

        // WaitList dialog timer
        gs.waitList.forEach(guest => {
          if (guest.dialogTimer && guest.dialogTimer > 0) {
            guest.dialogTimer--;
            if (guest.dialogTimer <= 0) guest.currentDialog = undefined;
          }
        });

        // Müşteri güncelle
        for (let i = gs.customers.length - 1; i >= 0; i--) {
          const c = gs.customers[i];

          if (c.dialogTimer && c.dialogTimer > 0) {
            c.dialogTimer--;
            if (c.dialogTimer <= 0) c.currentDialog = undefined;
          }

          if (c.beatUpTimer && c.beatUpTimer > 0) {
            c.beatUpTimer--;
            if (c.beatUpTimer <= 0) {
              c.beatUpTimer = 0;
              c.isBeatUp = false;
            }
          }

          if (c.isLeaving) {
            c.isSeated = false;
            c.isEating = false;
            c.y += 4; 
            if (c.y >= GAME_HEIGHT + 60) {
              gs.customers.splice(i, 1);
            }
            continue;
          }

          if (c.isEating) {
            c.eatTimer--;
            if (!c.currentDialog && Math.random() < 0.001) {
              const list = DIALOGUES[c.personality].eating;
              c.currentDialog = list[Math.floor(Math.random() * list.length)];
              c.dialogTimer = 90;
            }
            if (c.eatTimer <= 0) {
              gs.dirtyTables.push({ seatX: c.seatX, seatY: c.seatY, tip: c.tipAmount || 0 });
              c.isLeaving = true;
              c.isSeated = false;
              c.targetY = GAME_HEIGHT + 60;
              if (Math.random() < 0.4) {
                const list = DIALOGUES[c.personality].leaving_happy;
                c.currentDialog = list[Math.floor(Math.random() * list.length)];
                c.dialogTimer = 90;
              }
              tryQueueSeat(gs, io, rid);
            }
            continue;
          }

          if (!c.isSeated) {
            if (c.y > c.targetY) {
              c.y = Math.max(c.targetY, c.y - 3);
              if (c.y <= c.targetY) c.isSeated = true;
            }
          } else {
            if (!c.currentDialog && Math.random() < 0.001) {
              const list = DIALOGUES[c.personality].waiting;
              c.currentDialog = list[Math.floor(Math.random() * list.length)];
              c.dialogTimer = 90;
            }

            if (gs.dayPhase === 'day') {
              const playerCount = Object.keys(gs.players).length || 1;
              const patienceDrain = 1 + (playerCount - 1) * 0.25;
              const baseDrain = Math.floor(patienceDrain);
              const extraChance = patienceDrain - baseDrain;
              const actualDrain = baseDrain + (Math.random() < extraChance ? 1 : 0);

              if (!c.isEating && c.wants) {
                c.patience -= actualDrain;
                if (c.patience <= 0) {
                  gs.score -= 10;
                  gs.lives -= 1;
                  io.to(rid).emit("sound", "fail");
                  if (gs.lives <= 0) {
                    gs.isGameOver = true;
                    gs.customers = [];
                    gs.waitList = [];
                    io.to(rid).emit("sound", "fail");
                    break; 
                  }
                  c.isLeaving = true;
                  c.isSeated = false;
                  c.targetY = GAME_HEIGHT + 60;
                  const list = DIALOGUES[c.personality].leaving_angry;
                  c.currentDialog = list[Math.floor(Math.random() * list.length)];
                  c.dialogTimer = 90;
                  tryQueueSeat(gs, io, rid);
                }
              }
            }
          }
        }
        io.to(rid).emit("state", gs);
      }, LOGIC_STEP_MS);
      RoomManager.setInterval(roomId, interval);
    }

    const gs = RoomManager.getRoomState(roomId)!;
    gs.players[socket.id] = {
      id: socket.id, name, color, hat, charType,
      x: 640, y: 350, holding: null, score: 0
    };
    io.to(roomId).emit("state", gs);
  });

  socket.on("move", (pos) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.players[socket.id]) {
      gs.players[socket.id].x = pos.x;
      gs.players[socket.id].y = pos.y;
    }
  });

  socket.on("interact", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    const p = gs.players[socket.id];
    if (!p) return;
    const px = p.x, py = p.y;

    // Lavabo
    if (Math.hypot(px - SINK_STATION.x, py - SINK_STATION.y) < 90) {
      if (p.holding === DIRTY_PLATE) {
        p.holding = CLEAN_PLATE;
        socket.emit("sound", "success");
      }
      return;
    }

    // Kirli masa
    const dirtyIdx = gs.dirtyTables.findIndex(t => Math.hypot(px - t.seatX, py - t.seatY) < SERVE_R);
    if (dirtyIdx !== -1) {
      const dt = gs.dirtyTables[dirtyIdx];
      if (!p.holding) {
        p.holding = DIRTY_PLATE;
        if (dt.tip > 0) {
          gs.score += dt.tip;
          io.to(roomId!).emit("tipCollected", { x: dt.seatX, y: dt.seatY, amount: dt.tip });
        }
        gs.dirtyTables.splice(dirtyIdx, 1);
        socket.emit("sound", "pickup");
      } else if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);
        if (items.length < MAX_TRAY_CAPACITY) {
          items.push(DIRTY_PLATE);
          p.holding = createTray(items);
          if (dt.tip > 0) {
            gs.score += dt.tip;
            io.to(roomId!).emit("tipCollected", { x: dt.seatX, y: dt.seatY, amount: dt.tip });
          }
          gs.dirtyTables.splice(dirtyIdx, 1);
          socket.emit("sound", "pickup");
        }
      }
      return;
    }

    // Holding Stations
    for (const station of gs.holdingStations) {
      let stationDef: any;
      let inRange = false;
      if (station.type === 'plate') {
        stationDef = HOLDING_STATION_POSITIONS.find(pos => pos.id === station.id);
        if (stationDef) inRange = Math.hypot(px - stationDef.x, py - stationDef.y) < INTERACT_R;
      } else {
        stationDef = COUNTER_POSITIONS.find(pos => pos.id === station.id);
        if (stationDef) inRange = Math.abs(px - stationDef.x) < 50 && Math.abs(py - stationDef.y) < 70;
      }
      if (!stationDef || !inRange) continue;

      if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);
        if (items.length > 0 && station.items.length === 0) {
          station.items.push(items.pop()!);
          p.holding = createTray(items);
          socket.emit("sound", "pickup");
          return;
        }
        if (station.items.length > 0 && items.length < MAX_TRAY_CAPACITY) {
          items.push(station.items.pop()!);
          p.holding = createTray(items);
          socket.emit("sound", "pickup");
          return;
        }
      }
      if (!p.holding && station.items.length > 0) {
        p.holding = station.items.pop()!;
        socket.emit("sound", "pickup");
        return;
      }
      if (p.holding && station.items.length === 0) {
        station.items.push(p.holding);
        p.holding = null;
        socket.emit("sound", "success");
        return;
      }
    }

    // Fırınlar
    for (const station of gs.cookStations) {
      if (Math.hypot(px - station.x, py - station.y) < INTERACT_R) {
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
        } else if (p.holding === CLEAN_PLATE && station.output && !station.isBurned) {
          p.holding = station.output;
          station.output = null; station.burnTimer = 0;
          socket.emit("sound", "success");
        } else if (isTray(p.holding) && station.output && !station.isBurned) {
          const items = getTrayItems(p.holding);
          const cpIdx = items.indexOf(CLEAN_PLATE);
          if (cpIdx !== -1) {
            items[cpIdx] = station.output;
            p.holding = createTray(items);
            station.output = null; station.burnTimer = 0;
            socket.emit("sound", "success");
          }
        } else if (!p.holding && station.isBurned) {
          p.holding = BURNED_FOOD;
          station.output = null; station.isBurned = false; station.burnTimer = 0;
          socket.emit("sound", "trash");
        }
        return;
      }
    }

    // Servis
    if (p.holding) {
      for (let ci = 0; ci < gs.customers.length; ci++) {
        const c = gs.customers[ci];
        if (c.isSeated && !c.isEating && Math.hypot(px - c.seatX, py - c.seatY) < SERVE_R) {
          if (!isTray(p.holding) && c.wants === p.holding) {
            c.tipAmount = earn(gs.upgrades.earnings);
            c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
            io.to(roomId!).emit("sound", "success");
            return;
          } else if (isTray(p.holding)) {
            const items = getTrayItems(p.holding);
            const wIdx = items.indexOf(c.wants as string);
            if (wIdx !== -1) {
              items.splice(wIdx, 1);
              p.holding = createTray(items);
              c.tipAmount = earn(gs.upgrades.earnings);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
              io.to(roomId!).emit("sound", "success");
              return;
            }
          }
        }
      }
    }

    // Malzeme al
    for (const s of INGREDIENTS) {
      if (Math.hypot(px - s.pos.x, py - s.pos.y) < INTERACT_R && gs.stock[s.key] > 0) {
        if (p.holding === CLEAN_PLATE || isDish(p.holding)) {
          socket.emit("sound", "fail");
          return;
        }
        if (!p.holding) {
          p.holding = s.key;
          gs.stock[s.key]--;
          socket.emit("sound", "pickup");
          return;
        }
      }
    }
  });

  socket.on("order", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!; if (gs.dayPhase !== 'night') return;
    if (gs.hasOrderedTonight) { socket.emit("sound", "fail"); return; }
    const c = cap(gs.upgrades.stockMax);
    (['🍞', '🥩', '🥬', '🥘', '🍢'] as StockKey[]).forEach(k => { gs.stock[k] = c; });
    gs.hasOrderedTonight = true; 
    io.to(roomId).emit("state", gs);
    socket.emit("sound", "success");
  });

  socket.on("buyOven", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;

    const currentOvens = gs.cookStations.length;
    const maxOvens = INITIAL_OVEN_POSITIONS.length + ADDITIONAL_OVEN_POSITIONS.length;
    if (currentOvens >= maxOvens) { socket.emit("sound", "fail"); return; }

    const ovenIdx = currentOvens - INITIAL_OVEN_POSITIONS.length;
    const cost = OVEN_UPGRADE_COSTS[ovenIdx];

    if (gs.score >= cost) {
      gs.score -= cost;
      const pos = ADDITIONAL_OVEN_POSITIONS[ovenIdx];
      gs.cookStations.push(mkCook(`oven${currentOvens + 1}`, pos.x, pos.y));
      io.to(roomId).emit("state", gs);
      socket.emit("sound", "success");
    } else {
      socket.emit("sound", "fail");
    }
  });

  socket.on("buyLife", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;

    if (gs.lives < 3 && gs.score >= 75) {
      gs.score -= 75;
      gs.lives++;
      io.to(roomId).emit("state", gs);
      socket.emit("sound", "success");
    } else {
      socket.emit("sound", "fail");
    }
  });

  socket.on("nextDay", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase === 'night') {
      gs.day++; gs.dayPhase = 'prep'; gs.dayTimer = DAY_TICKS;
      io.to(roomId).emit("state", gs);
      socket.emit("sound", "success");
    }
  });

  socket.on("openShop", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase === 'prep') {
      gs.dayPhase = 'day'; gs.dayTimer = DAY_TICKS;
      io.to(roomId).emit("state", gs);
      socket.emit("sound", "success");
    }
  });

  socket.on("upgrade", (key: UpgradeKey) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    
    const upDef = UPGRADE_DEFS[key];
    const currentLv = gs.upgrades[key];
    if (currentLv >= upDef.max) { socket.emit("sound", "fail"); return; }
    
    const cost = upDef.costs[currentLv];
    if (gs.score >= cost) {
      gs.score -= cost;
      gs.upgrades[key]++;
      io.to(roomId).emit("state", gs);
      socket.emit("sound", "success");
    } else {
      socket.emit("sound", "fail");
    }
  });

  socket.on("resetDay", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (!gs.isGameOver) return;

    // Oyunu sıfırla ama skoru ve upgradeleri koru (veya ceza kes)
    gs.isGameOver = false;
    gs.lives = 3;
    gs.customers = [];
    gs.waitList = [];
    gs.dirtyTables = [];
    gs.dayPhase = 'prep';
    gs.dayTimer = DAY_TICKS;
    // Ceza: Skoru %20 düşür
    gs.score = Math.floor(gs.score * 0.8);
    io.to(roomId).emit("state", gs);
    socket.emit("sound", "success");
  });

  socket.on("punchCustomer", (customerId) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'day') return;
    const cIdx = gs.customers.findIndex(c => c.id === customerId);
    if (cIdx === -1) return;
    const c = gs.customers[cIdx];
    if (c.isLeaving) return;
    if (c.beatUpTimer && c.beatUpTimer > 3) return;

    if (c.personality === 'polite') {
      gs.score -= 20;
      c.beatUpTimer = 20;
      c.currentDialog = ["AY!", "Ne yapıyorsunuz!", "İmdat!", "Polis!"][Math.floor(Math.random() * 4)];
      c.dialogTimer = 30;
      socket.emit("sound", "fail");
      io.to(roomId!).emit("punchEffect", { x: c.x, y: c.y, count: 1 });
      return;
    }

    c.beatUpTimer = 30;
    c.isBeatUp = true;
    c.punchCount = (c.punchCount || 0) + 1;
    const MAX_PUNCHES = 4;

    if (c.punchCount >= MAX_PUNCHES) {
      const revengeChance = c.personality === 'recep' ? 0.6 : 0.3;
      if (Math.random() < revengeChance) gs.revengeQueue.push(5400 + Math.floor(Math.random() * 1800));
      const leaveDialogs: Record<string, string[]> = {
        rude: ["YETER BE! Gidiyorum!", "Polisi arayacam lan!", "Mahvettiniz beni!"],
        recep: ["BÖHÖHÖYT! Anam babam öldüm bittim!", "Yeter vurma lan, gidiyom amk!", "Kırılmadık kemik bırakmadın be!"],
        thug: ["KAÇIN LAN!", "Görürsün sen!", "Ah kafam!"]
      };
      const dialogPool = leaveDialogs[c.personality] || leaveDialogs.rude;
      c.currentDialog = dialogPool[Math.floor(Math.random() * dialogPool.length)];
      c.dialogTimer = 60;
      c.isLeaving = true; c.isSeated = false; c.isEating = false; c.beatUpTimer = 0;
      c.targetY = GAME_HEIGHT + 120;
      const tableIdx = gs.dirtyTables.findIndex(t => t.seatX === c.seatX && t.seatY === c.seatY);
      if (tableIdx !== -1) gs.dirtyTables.splice(tableIdx, 1);
      tryQueueSeat(gs, io, roomId!);
    } else {
      const hitDialogs: Record<string, string[]> = {
        rude: ["AH!", "Napiyorsun lan!", "Yavaş vur amk!"],
        recep: ["Böhöyt!", "Anaaam!", "Vurma lan dümbelek!"],
        thug: ["Uyy!", "Vurma be!", "Kafam yarıldı!"]
      };
      const dialogPool = hitDialogs[c.personality] || hitDialogs.rude;
      c.currentDialog = dialogPool[Math.floor(Math.random() * dialogPool.length)];
      c.dialogTimer = 30;
    }
    socket.emit("sound", "pickup");
    io.to(roomId!).emit("punchEffect", { x: c.x, y: c.y, count: c.punchCount });
  });

  socket.on("disconnect", () => {
    if (roomId && playerId && RoomManager.getRoomState(roomId)) {
      const gs = RoomManager.getRoomState(roomId)!;
      delete gs.players[playerId];
      if (Object.keys(gs.players).length === 0) RoomManager.deleteRoom(roomId);
      else io.to(roomId).emit("state", gs);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
