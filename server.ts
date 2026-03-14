import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { MARKET_NAME } from "./src/constants";

// ─── Shared'dan import (tek kaynak) ──────────────────────────────────────────
import {
  type StockKey,
  type UpgradeKey,
  type CookStation,
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
  EAT_TICKS,
  HOLDING_STATION_POSITIONS,
  COUNTER_POSITIONS,
  DIRTY_TRAY_POS,
  TRAY_STATION,
  isTray,
  getTrayItems,
  createTray,
  MAX_TRAY_CAPACITY,
  TABLE_HALF_W,
  TABLE_HALF_H,
} from "./shared/types";
import { DIALOGUES, Personality, DialogTrigger } from "./shared/dialogues";

// ─── Server-Only Sabitler ────────────────────────────────────────────────────
const INTERACT_R = 90;
const TRASH_INTERACT_R = 56;
const SERVE_R = 100;
const INTERACT_COOLDOWN = 200; // ms
const LOGIC_STEP_MS = 1000 / 30;

// Masa pozisyonları (çarpışma için — client ile aynı)
const TABLE_X_SLOTS = [190, 390, 640, 890, 1090];
const TABLE_Y = 500;

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

  // Tabak rafları ve servis bloklarını birleştir
  const allHoldingStations = [
    ...HOLDING_STATION_POSITIONS.map(p => ({ id: p.id, items: [CLEAN_PLATE], type: p.type, maxItems: 1 })),
    ...COUNTER_POSITIONS.map(p => ({ id: p.id, items: [], type: p.type, maxItems: 1 })),
  ];

  return {
    players: {}, customers: [], waitList: [],
    holdingStations: allHoldingStations,
    dirtyTables: [],
    score: 0, stock: { '🍞': 10, '🥩': 10, '🥬': 10 },
    marketName: MARKET_NAME, dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, stockMax: 0 }, day: 1, hasOrderedTonight: false,
    cookStations: initialOvens,
    dirtyTrayCount: 0,
    lives: 3,
    isGameOver: false,
    revengeQueue: [],
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

    // Voice Chat - PeerJS ID'lerini dağıt
    socket.on("updatePeerId", (peerId: string) => {
      if (!roomId || !rooms[roomId]?.players[socket.id]) return;
      const gs = rooms[roomId];
      gs.players[socket.id].peerId = peerId;
      // Odadakilere yeni kullanıcının peer idsini haber ver
      io.to(roomId).emit("peerMap",
        Object.fromEntries(Object.values(gs.players).filter(p => p.peerId).map(p => [p.id, p.peerId]))
      );
    });

    // 👕 Kostüm Değiştir
    socket.on("changeCosmetic", (charType: number) => {
      if (!roomId || !rooms[roomId]?.players[socket.id]) return;
      if (typeof charType !== 'number' || charType < 0 || charType > 7) return;
      rooms[roomId].players[socket.id].charType = charType;
    });

    socket.on("move", ({ x, y }: { x: number; y: number }) => {
      if (!roomId || !rooms[roomId]?.players[socket.id]) return;
      const p = rooms[roomId].players[socket.id];
      let nx = Math.max(20, Math.min(GAME_WIDTH - 20, x));
      let ny = Math.max(20, Math.min(GAME_HEIGHT - 20, y));

      // Yatay duvar (mutfak↔salon)
      const wasAbove = p.y < WALL_Y1, wasBelow = p.y > WALL_Y2;

      // Duvardan geçmeye çalışıyor mu?
      if ((wasAbove && ny >= WALL_Y1) || (wasBelow && ny <= WALL_Y2)) {
        if (isInDoor(nx)) {
          // Kapıda - geçebilir
        } else {
          ny = wasAbove ? WALL_Y1 - 1 : WALL_Y2 + 1;
        }
      }

      // Masa çarpışması (AABB)
      const PR = 16; // Oyuncu çarpışma yarıçapı
      for (const tx of TABLE_X_SLOTS) {
        const left = tx - TABLE_HALF_W, right = tx + TABLE_HALF_W;
        const top = TABLE_Y - TABLE_HALF_H, bottom = TABLE_Y + TABLE_HALF_H;
        // Oyuncu masayla kesişiyor mu?
        if (nx + PR > left && nx - PR < right && ny + PR > top && ny - PR < bottom) {
          // Hangi yönden itileceğini bul (en az penetrasyon yönü)
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

      // Tepsi İstasyonu
      if (Math.hypot(px - TRAY_STATION.x, py - TRAY_STATION.y) < INTERACT_R) {
        if (!p.holding) {
          p.holding = createTray([]);
          socket.emit("sound", "pickup");
          return;
        } else if (isTray(p.holding) && getTrayItems(p.holding).length === 0) {
          p.holding = null;
          socket.emit("sound", "pickup");
          return;
        } else {
          // Elde başka item varsa tepsi alınamaz
          socket.emit("sound", "fail");
          return;
        }
      }

      // Çöp (Yanmış yemek atılırsa ceza kestir, tabaklar yok edilmesin)
      if (Math.hypot(px - TRASH_STATION.x, py - TRASH_STATION.y) < 90) {
        if (!p.holding) return;

        if (isTray(p.holding)) {
          const items = getTrayItems(p.holding);
          if (items.length > 0) {
            const top = items[items.length - 1];
            if (top === CLEAN_PLATE || top === DIRTY_PLATE) socket.emit("sound", "fail");
            else {
              if (top === BURNED_FOOD) gs.score = Math.max(0, gs.score - 2);
              items.pop();
              p.holding = createTray(items);
              socket.emit("sound", "trash");
            }
          }
          return;
        }

        if (p.holding === CLEAN_PLATE || p.holding === DIRTY_PLATE) {
          socket.emit("sound", "fail");
          return;
        }
        if (p.holding === BURNED_FOOD) {
          gs.score = Math.max(0, gs.score - 2);
          p.holding = null;
          io.to(roomId!).emit("sound", "fail");
        } else if (isDish(p.holding)) {
          // Yemekli tabak çöpe → yemek gider, tabak elde kalır
          p.holding = CLEAN_PLATE;
          socket.emit("sound", "trash");
        } else {
          // Ham malzeme vs.
          p.holding = null;
          socket.emit("sound", "trash");
        }
        return;
      }

      // Kirli Sepeti (Lavabonun yanındaki yığın alanı)
      if (Math.hypot(px - DIRTY_TRAY_POS.x, py - DIRTY_TRAY_POS.y) < 90) {
        // Kirli tabak bırakma
        if (p.holding === DIRTY_PLATE) {
          gs.dirtyTrayCount++;
          p.holding = null;
          socket.emit("sound", "pickup");
          return;
        }
        else if (isTray(p.holding)) {
          // Tepsideki tüm kirli tabakları sepete dök
          const items = getTrayItems(p.holding);
          const dirtyCount = items.filter(i => i === DIRTY_PLATE).length;
          if (dirtyCount > 0) {
            gs.dirtyTrayCount += dirtyCount;
            p.holding = createTray(items.filter(i => i !== DIRTY_PLATE));
            socket.emit("sound", "success");
            return;
          }
        }
        // Kirli tabak alma
        else if (!p.holding && gs.dirtyTrayCount > 0) {
          gs.dirtyTrayCount--;
          p.holding = DIRTY_PLATE;
          socket.emit("sound", "pickup");
          return;
        }
      }

      // Lavabo: kirli tabak temizlenir
      if (Math.hypot(px - SINK_STATION.x, py - SINK_STATION.y) < 90) {
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
        const dt = gs.dirtyTables[dirtyIdx];
        if (!p.holding) {
          p.holding = DIRTY_PLATE;
          // Bahşiş topla
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

      // Bekletme İstasyonları (tabak rafı / plating counter) ve Servis Masaları
      for (const station of gs.holdingStations) {
        let stationDef: any;
        let inRange = false;

        if (station.type === 'plate') {
          stationDef = HOLDING_STATION_POSITIONS.find(pos => pos.id === station.id);
          if (stationDef) {
            const dist = Math.hypot(px - stationDef.x, py - stationDef.y);
            inRange = dist < INTERACT_R;
          }
        } else {
          stationDef = COUNTER_POSITIONS.find(pos => pos.id === station.id);
          if (stationDef) {
            // Blok etkileşimi - daha hassas
            const xDist = Math.abs(px - stationDef.x);
            const yDist = Math.abs(py - stationDef.y);
            inRange = xDist < 50 && yDist < 70;
          }
        }

        if (!stationDef || !inRange) continue;

        // ═══ TEPSİ ETKİLEŞİMLERİ ═══
        if (isTray(p.holding)) {
          const items = getTrayItems(p.holding);

          // Tepsiden bloğa koyma (blok boşsa)
          if (items.length > 0 && station.items.length === 0) {
            const item = items.pop()!;
            station.items.push(item);
            p.holding = createTray(items);
            socket.emit("sound", "pickup");
            return;
          }

          // Bloktan tepsiye alma (tepside yer varsa)
          if (station.items.length > 0 && items.length < MAX_TRAY_CAPACITY) {
            const item = station.items.pop()!;
            items.push(item);
            p.holding = createTray(items);
            socket.emit("sound", "pickup");
            return;
          }
        }

        // ═══ TEK ITEM ETKİLEŞİMLERİ ═══

        // Boş elle bloktan alma
        if (!p.holding && station.items.length > 0) {
          p.holding = station.items.pop()!;
          socket.emit("sound", "pickup");
          return;
        }

        // Bloğa koyma (blok boşsa)
        if (p.holding && station.items.length === 0) {
          station.items.push(p.holding);
          p.holding = null;
          socket.emit("sound", "success");
          return;
        }

        // Blok doluysa hata
        if (p.holding && station.items.length > 0) {
          socket.emit("sound", "fail");
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
          // Tepside temiz tabak varsa yemek alma
          else if (isTray(p.holding) && station.output && !station.isBurned) {
            const items = getTrayItems(p.holding);
            const cpIdx = items.indexOf(CLEAN_PLATE);
            if (cpIdx !== -1) {
              items[cpIdx] = station.output;
              p.holding = createTray(items);
              station.output = null; station.burnTimer = 0;
              socket.emit("sound", "success");
            } else {
              socket.emit("sound", "fail"); // Tepside temiz tabak yok
            }
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
        let served = false;
        for (let ci = 0; ci < gs.customers.length; ci++) {
          const c = gs.customers[ci];
          if (c.isSeated && !c.isEating && Math.hypot(px - c.seatX, py - c.seatY) < SERVE_R) {
            if (!isTray(p.holding) && c.wants === p.holding) {
              // Score artık serve'de değil, bahşiş toplama'da eklenir
              c.tipAmount = earn(gs.upgrades.earnings);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
              served = true; break;
            } else if (isTray(p.holding)) {
              const items = getTrayItems(p.holding);
              const wIdx = items.indexOf(c.wants as string);
              if (wIdx !== -1) {
                items.splice(wIdx, 1);
                p.holding = createTray(items);
                c.tipAmount = earn(gs.upgrades.earnings);
                c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
                served = true; break;
              }
            }
          }
        }
        if (served) {
          io.to(roomId!).emit("sound", "success");
          return;
        }
      }

      // Malzeme al
      for (const s of INGREDIENTS) {
        if (Math.hypot(px - s.pos.x, py - s.pos.y) < INTERACT_R && gs.stock[s.key] > 0) {
          // Eğer elde tabak varsa, malzeme alınmasın!
          if (p.holding === CLEAN_PLATE || isDish(p.holding)) {
            socket.emit("sound", "fail");
            return;
          }
          // Boş elle veya başka bir şeyle malzeme alınabilir
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
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId]; if (gs.dayPhase !== 'night') return;
      if (gs.hasOrderedTonight) { socket.emit("sound", "fail"); return; }
      const c = cap(gs.upgrades.stockMax);
      (['🍞', '🥩', '🥬'] as StockKey[]).forEach(k => { gs.stock[k] = c; });
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

    // Gece mağazasında can satın alma
    socket.on("buyLife", () => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId];
      if (gs.dayPhase !== 'night') return;
      const LIFE_COST = 75;
      if (gs.lives >= 3) { socket.emit("sound", "fail"); return; }
      if (gs.score < LIFE_COST) { socket.emit("sound", "fail"); return; }
      gs.score -= LIFE_COST;
      gs.lives = Math.min(3, gs.lives + 1);
      socket.emit("sound", "success");
    });

    // Müşteri Dövme — sadece gündüz, sadece rude/recep tipleri geçerli hedef
    socket.on("punchCustomer", (customerId: string) => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId];
      if (gs.dayPhase !== 'day') return;

      const cIdx = gs.customers.findIndex(c => c.id === customerId);
      if (cIdx === -1) return;
      const c = gs.customers[cIdx];

      // Adam zaten dükkanı terk ediyorsa vurulmaz
      if (c.isLeaving) return;

      // Cooldown kontrolü — beatUpTimer>30 ise vuramazsın (art arda spam koruması)
      if (c.beatUpTimer && c.beatUpTimer > 30) return;

      if (c.personality === 'polite') {
        // Yanlış hedef — kibar müşteriye vurmak para cezası
        gs.score -= 20;
        socket.emit("sound", "fail");
        return;
      }

      // Doğru hedef — rude / recep
      c.beatUpTimer = 60; // 2 saniye sarsıntı
      c.isBeatUp = true;
      c.punchCount = (c.punchCount || 0) + 1;

      const MAX_PUNCHES = 4;

      if (c.punchCount >= MAX_PUNCHES) {
        // 4. vuruşta kaçar ve intikam yemini edebilir
        const revengeChance = c.personality === 'recep' ? 0.6 : 0.3;
        if (Math.random() < revengeChance) {
          // 3 ile 4 dakika arası (30fps: 5400 - 7200 frame)
          const delay = 5400 + Math.floor(Math.random() * 1800);
          gs.revengeQueue.push(delay);
        }

        const leaveDialogs: Record<string, string[]> = {
          rude: ["YETER BE! Gidiyorum!", "Polisi arayacam lan!", "Mahvettiniz beni, lanet olsun!"],
          recep: ["BÖHÖHÖYT! Anam babam öldüm bittim!", "Yeter vurma lan, gidiyom amk!", "Kırılmadık kemik bırakmadın be!"]
        };
        const dialogPool = leaveDialogs[c.personality] || leaveDialogs.rude;
        c.currentDialog = dialogPool[Math.floor(Math.random() * dialogPool.length)];
        c.dialogTimer = 60;

        c.isLeaving = true;
        c.isSeated = false; // Ayağa kalk! Maskelenme bug'ını düzeltir.
        c.beatUpTimer = 0;  // Titremeyi kes!
        c.targetY = 900;
        tryQueueSeat(gs, io, roomId!);
      } else {
        // 1-3 vuruş arası sadece complain bekle
        const hitDialogs: Record<string, string[]> = {
          rude: ["AH!", "Napiyorsun lan!", "Yavaş vur amk!"],
          recep: ["Böhöyt!", "Anaaam!", "Vurma lan dümbelek!"]
        };
        const dialogPool = hitDialogs[c.personality] || hitDialogs.rude;
        c.currentDialog = dialogPool[Math.floor(Math.random() * dialogPool.length)];
        c.dialogTimer = 30; // Kısa complains
      }

      socket.emit("sound", "pickup"); // Vurma sesi
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

    // ─── Disconnect: Oyuncuyu odadan çıkar ────────────────────────────────────
    socket.on("disconnect", () => {
      if (!roomId || !rooms[roomId]) return;
      console.log(`[Server] Player ${socket.id} disconnected from room ${roomId}`);
      delete rooms[roomId].players[socket.id];
      // Oda boşsa sil
      if (!Object.keys(rooms[roomId].players).length) {
        console.log(`[Server] Room ${roomId} is now empty, deleting...`);
        delete rooms[roomId];
      } else {
        // Kalan oyunculara state'i gönder
        io.to(roomId).emit("state", rooms[roomId]);
      }
    });

    // ─── State Re-sync: Ön plana gelen oyuncu state'i ister ──────────────────
    socket.on("requestSync", () => {
      if (!roomId || !rooms[roomId]) return;
      console.log(`[Server] Player ${socket.id} requesting state sync`);
      const gs = rooms[roomId];
      socket.emit("state", gs);
    });

    socket.on("resetDay", () => {
      if (!roomId || !rooms[roomId]) return;
      const gs = rooms[roomId];
      if (!gs.isGameOver) return;

      // Oyunu baştan başlat ama upgrade ve skor kalsın, canları doldur
      gs.isGameOver = false;
      gs.lives = 3;
      gs.dayPhase = 'prep';
      gs.dayTimer = DAY_TICKS;
      gs.customers = [];
      gs.waitList = [];
      gs.hasOrderedTonight = false;
      gs.dirtyTables = []; // Kalan kirli masaları temizle
      gs.revengeQueue = []; // İntikam çetelerini sustur
      gs.dirtyTrayCount = 0;
      gs.cookStations.forEach(station => {
        station.input = null;
        station.timer = 0;
        station.output = null;
        station.isBurned = false;
        station.burnTimer = 0;
      });
      io.to(roomId).emit("sound", "arrive");
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
        if (!gs) continue;
        if (!gs.stock) gs.stock = { '🍞': 10, '🥩': 10, '🥬': 10 };

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
            (['🍞', '🥩', '🥬'] as StockKey[]).forEach(k => {
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
          // Günden güne artan zorluk (ilk günlerde az, ilerledikçe artan baz oran)
          const baseRate = 0.001 + Math.min(gs.day * 0.0005, 0.005);
          const dayProgress = 1 - gs.dayTimer / DAY_TICKS;

          // 👥 OYUNCU SAYISINA GÖRE ZORLUK ÖLÇEKLENDİRME
          const playerCount = Object.keys(gs.players).length || 1;
          const spawnMultiplier = 1 + (playerCount - 1) * 0.6; // 1: 1.0, 2: 1.6, 3: 2.2, 4: 2.8
          const queueLimit = 10 + (playerCount - 1) * 3;     // 1: 10, 2: 13, 3: 16, 4: 19

          const currentRate = (baseRate + (dayProgress * 0.001)) * spawnMultiplier;

          if (Math.random() < currentRate && gs.customers.length + gs.waitList.length < queueLimit) {
            const personalities: Personality[] = ['polite', 'rude', 'recep'];
            const pers = personalities[Math.floor(Math.random() * personalities.length)];
            let dialog: string | undefined;
            let timer: number | undefined;

            if (Math.random() < 0.3) {
              const list = DIALOGUES[pers].entry;
              dialog = list[Math.floor(Math.random() * list.length)];
              timer = 90; // 3 seconds at 30fps
            }

            // Rastgele görsel özellikler ata
            const bodyShapes = [1, 2, 3, 4] as const;
            const bodyColors: Record<Personality, string[]> = {
              polite: ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6'],
              rude: ['#f59e0b', '#ef4444', '#f97316', '#dc2626'],
              recep: ['#7c3aed', '#b91c1c', '#1d4ed8', '#064e3b'],
              thug: ['#000000', '#1c1917', '#7f1d1d', '#57534e'], // siyah ve koyu kızıl tonlar
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

          // Revenge Queue İşleme (İntikam Çetesi Spawnu)
          for (let i = gs.revengeQueue.length - 1; i >= 0; i--) {
            gs.revengeQueue[i]--;
            if (gs.revengeQueue[i] <= 0) {
              gs.revengeQueue.splice(i, 1); // Süresi dolanı çıkar

              // 3-4 Thug spawnla
              const thugCount = 3 + Math.floor(Math.random() * 2);
              for (let j = 0; j < thugCount; j++) {
                const bodyShapes = [2, 4] as const; // Thuglar iri/tombul olur
                const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
                const bodyColors = ['#000000', '#1c1917', '#7f1d1d', '#57534e']; // Siyah-kırmızı
                const bodyColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];

                const list = DIALOGUES.thug.revenge;
                const dialog = list[Math.floor(Math.random() * list.length)];

                gs.waitList.push({
                  id: Math.random().toString(36).slice(2, 9),
                  wants: DISH_ITEMS[Math.floor(Math.random() * DISH_ITEMS.length)],
                  personality: 'thug',
                  currentDialog: dialog,
                  dialogTimer: 150, // Konuşma balonu 5sn dursun (uzun)
                  bodyShape,
                  bodyColor,
                });
              }
              // Uyarı sesi çal
              io.to(rid).emit("sound", "fail"); // Kötü bir şey geldiği belli olsun
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

          // Beat-up timer: efekt bittikten sonra sıfırla
          if (c.beatUpTimer && c.beatUpTimer > 0) {
            c.beatUpTimer--;
            if (c.beatUpTimer <= 0) {
              c.beatUpTimer = 0;
            }
          }

          if (c.isLeaving) {
            c.y += 3; // Aşağı doğru yürü
            if (c.y >= GAME_HEIGHT + 60) {
              gs.customers.splice(i, 1);
            }
            continue;
          }

          if (c.isEating) {
            c.eatTimer--;

            // Yemek yerken / Beklerken arada bir konuşma tetikleme (%0.1 şans her frame)
            if (!c.currentDialog && Math.random() < 0.001) {
              const list = DIALOGUES[c.personality].eating;
              c.currentDialog = list[Math.floor(Math.random() * list.length)];
              c.dialogTimer = 90;
            }

            if (c.eatTimer <= 0) {
              gs.dirtyTables.push({ seatX: c.seatX, seatY: c.seatY, tip: c.tipAmount || 0 });

              // Mutlu çıkış
              c.isLeaving = true;
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
            c.y = Math.max(c.targetY, c.y - 3);
            if (c.y <= c.targetY) c.isSeated = true;
          } else {
            // Wait/Seated random dialog
            if (!c.currentDialog && Math.random() < 0.001) {
              const list = DIALOGUES[c.personality].waiting;
              c.currentDialog = list[Math.floor(Math.random() * list.length)];
              c.dialogTimer = 90;
            }

            // BUG-6: sadece gündüz patience azalır (gece/prep'te dondur)
            if (gs.dayPhase === 'day') {
              const playerCount = Object.keys(gs.players).length || 1;
              const patienceDrain = 1 + (playerCount - 1) * 0.25; // 1: 1.0, 2: 1.25, 3: 1.5, 4: 1.75

              // KESİN DÜZELTME: patienceDrain 1.25 ise -> Kesin 1 azalt, %25 ihtimalle +1 daha azalt.
              const baseDrain = Math.floor(patienceDrain);
              const extraChance = patienceDrain - baseDrain;
              const actualDrain = baseDrain + (Math.random() < extraChance ? 1 : 0);

              c.patience -= actualDrain;

              if (c.patience <= 0) {
                gs.score -= 10;
                gs.lives -= 1;
                io.to(rid).emit("sound", "fail");

                if (gs.lives <= 0) {
                  gs.isGameOver = true;
                  gs.customers = [];
                  gs.waitList = [];
                  io.to(rid).emit("sound", "fail"); // Maybe game over sound later
                  break; // Stop updating other customers
                }

                // Sinirli çıkış
                c.isLeaving = true;
                c.targetY = GAME_HEIGHT + 60;
                const list = DIALOGUES[c.personality].leaving_angry;
                c.currentDialog = list[Math.floor(Math.random() * list.length)];
                c.dialogTimer = 90;

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
