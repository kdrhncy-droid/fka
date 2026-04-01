import { Server } from "socket.io";
import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { 
  GameState, UpgradeKey,
  DAY_TICKS, NIGHT_TICKS, GAME_HEIGHT,
  INITIAL_OVEN_POSITIONS, ADDITIONAL_OVEN_POSITIONS, OVEN_UPGRADE_COSTS,
  PLATE_STACK_PER_UPGRADE,
  UPGRADE_DEFS,
  EXTRA_SINK_POSITIONS, EXTRA_CHOP_POSITIONS, WASH_TICKS,
  mkGameState, mkCook, MapId
} from "./shared/types.js";
import { gameTick, tryQueueSeat, generateCardChoices } from "./server/gameLoop.js";
import { registerInteractHandler } from "./server/interactHandler.js";
import { registerLayoutHandler } from "./server/layoutHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (err) => {
  console.error('[Server] Yakalanmayan hata:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Yakalanmayan Promise reddi:', reason);
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// ─── Sabitler ────────────────────────────────────────────────────────────────
const LOGIC_STEP_MS = 33;

// ─── Room Manager ────────────────────────────────────────────────────────────
class RoomManager {
  private static states = new Map<string, GameState>();
  private static intervals = new Map<string, NodeJS.Timeout>();
  private static peerMaps = new Map<string, Record<string, string>>(); // rid -> { socketId: peerId }

  static getPeerMap(rid: string): Record<string, string> { return this.peerMaps.get(rid) || {}; }
  static setPeerId(rid: string, socketId: string, peerId: string) {
    const map = this.peerMaps.get(rid) || {};
    map[socketId] = peerId;
    this.peerMaps.set(rid, map);
  }
  static removePeer(rid: string, socketId: string) {
    const map = this.peerMaps.get(rid);
    if (map) { delete map[socketId]; if (Object.keys(map).length === 0) this.peerMaps.delete(rid); }
  }

  static getRoomState(rid: string): GameState | undefined { return this.states.get(rid); }
  static setRoomState(rid: string, gs: GameState) { this.states.set(rid, gs); }
  static deleteRoom(rid: string) {
    this.states.delete(rid);
    this.peerMaps.delete(rid);
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

  // Oyuncuyu odadan temizleyen yardımcı
  function removePlayerFromRoom() {
    if (roomId && playerId && RoomManager.getRoomState(roomId)) {
      const gs = RoomManager.getRoomState(roomId)!;
      delete gs.players[playerId];
      // Peer haritasından kaldır ve güncel haritayı yayınla
      RoomManager.removePeer(roomId, playerId);
      io.to(roomId).emit("peerMap", RoomManager.getPeerMap(roomId));
      // Oyuncunun kilitlediği istasyon/masaları serbest bırak
      for (const [id, lockerId] of Object.entries(gs.lockedStations)) {
        if (lockerId === playerId) delete gs.lockedStations[id];
      }
      for (const [id, lockerId] of Object.entries(gs.lockedTables)) {
        if (lockerId === playerId) delete gs.lockedTables[id];
      }
      // Kesme tahtası ve lavabodaki oyuncu ID'sini temizle
      gs.choppingBoards?.forEach(b => {
        if (b.choppingPlayerId === playerId) { b.isChopping = false; b.choppingPlayerId = null; }
      });
      gs.sinks?.forEach(s => {
        if (s.washingPlayerId === playerId) { s.isWashing = false; s.washingPlayerId = null; }
      });
      if (Object.keys(gs.players).length === 0) {
        RoomManager.deleteRoom(roomId);
      } else {
        io.to(roomId).emit("state", gs);
      }
      socket.leave(roomId);
      roomId = null;
    }
  }

  socket.on("join", ({ room, roomId: clientRoomId, name, color, hat, charType, hairColor, hairStyle, outfitStyle, clothingColor, faceShape, nameLabelColor, title, labelEffect, serviceEffect, mapId }) => {
    // Önceki odadan temizle (aynı socket yeni odaya geçiyorsa)
    removePlayerFromRoom();

    roomId = room || clientRoomId;
    playerId = socket.id;
    socket.join(roomId);

    if (!RoomManager.getRoomState(roomId)) {
      RoomManager.setRoomState(roomId, mkGameState((mapId as MapId) || 'classic'));

      const stableRoomId = roomId;
      const interval = setInterval(() => {
        try {
          const gs = RoomManager.getRoomState(stableRoomId);
          if (!gs) return;
          if (gs.isGameOver) { io.to(stableRoomId).emit("state", gs); return; }
          gameTick(gs, io, stableRoomId);
        } catch (err) {
          console.error('[GameLoop] Hata yakalandı, oyun devam ediyor:', err);
        }
      }, LOGIC_STEP_MS);
      RoomManager.setInterval(roomId, interval);
    }

    const gs = RoomManager.getRoomState(roomId)!;
    gs.players[socket.id] = {
      id: socket.id, name, color, hat, charType,
      hairColor, hairStyle, outfitStyle, clothingColor, faceShape, nameLabelColor, title, labelEffect, serviceEffect,
      x: 640, y: 350, holding: null
    };
    socket.emit("init", { id: socket.id, state: gs });
    io.to(roomId).emit("state", gs);
  });

  socket.on("changeCosmetic", (id: number) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.players[socket.id]) {
      gs.players[socket.id].charType = id;
      io.to(roomId).emit("state", gs);
    }
  });

  socket.on("updateAppearance", (data: { hairColor?: string, hairStyle?: string, outfitStyle?: string, clothingColor?: string, faceShape?: number, color?: string, hat?: string, nameLabelColor?: string, serviceEffect?: string }) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.players[socket.id]) {
      const p = gs.players[socket.id];
      if (typeof data.hairColor === 'string') p.hairColor = data.hairColor.slice(0, 20);
      if (typeof data.hairStyle === 'string') p.hairStyle = data.hairStyle.slice(0, 20);
      if (typeof data.outfitStyle === 'string') p.outfitStyle = data.outfitStyle.slice(0, 20);
      if (typeof data.clothingColor === 'string') p.clothingColor = data.clothingColor.slice(0, 20);
      if (typeof data.faceShape === 'number') p.faceShape = Math.floor(data.faceShape) % 3;
      if (typeof data.color === 'string') p.color = data.color.slice(0, 20);
      if (typeof data.hat === 'string') p.hat = data.hat.slice(0, 10);
      if (typeof data.nameLabelColor === 'string') p.nameLabelColor = data.nameLabelColor.slice(0, 20);
      if (typeof data.serviceEffect === 'string') p.serviceEffect = data.serviceEffect.slice(0, 20);
      io.to(roomId).emit("state", gs);
    }
  });

  socket.on("move", (pos) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.players[socket.id]) {
      gs.players[socket.id].x = pos.x;
      gs.players[socket.id].y = pos.y;
    }
  });

    registerInteractHandler(socket, io, () => roomId, (rid) => RoomManager.getRoomState(rid));
    registerLayoutHandler(socket, io, () => roomId, (rid) => RoomManager.getRoomState(rid));

  socket.on("order", () => {
    socket.emit("sound", "fail");
  });

  // ─── Kart Seç (Kart Sistemi) ─────────────────────────────────────────────
  socket.on("selectCard", (cardId: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    if (!gs.pendingCardChoices) return;
    const card = gs.pendingCardChoices.find(c => c.id === cardId);
    if (!card) return;

    gs.activeCards.push({ id: card.id, appliedOnDay: gs.day });
    gs.pendingCardChoices = null;

    // Anlık etki gerektiren kartlar
    if (card.id === 'few_plates') {
      gs.plateStack.maxCount = Math.max(2, gs.plateStack.maxCount - 2);
      gs.plateStack.count = Math.min(gs.plateStack.count, gs.plateStack.maxCount);
    }
    if (card.id === 'mystery_guests') {
      gs.hidePatience = true;
    }

    io.to(roomId).emit("state", gs);
    socket.emit("sound", "success");
  });

  // ─── Yeni Yemek Seç (Plate Up tarzı gece menüsü) ─────────────────────────
  socket.on("selectMenu", (dish: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    if (!gs.menuChoices || !gs.menuChoices.includes(dish)) return;

    gs.unlockedDishes.push(dish);
    gs.menuChoices = null;
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
    if (ovenIdx < 0 || ovenIdx >= OVEN_UPGRADE_COSTS.length) { socket.emit("sound", "fail"); return; }
    const cost = OVEN_UPGRADE_COSTS[ovenIdx];

    if (gs.score >= cost) {
      gs.score -= cost;
      const pos = ADDITIONAL_OVEN_POSITIONS[ovenIdx];
      gs.cookStations.push(mkCook(`oven${currentOvens + 1}`, pos.x, pos.y));
      gs.stationLayout[`oven${currentOvens + 1}`] = { id: `oven${currentOvens + 1}`, x: pos.x, y: pos.y };
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
    // menuChoices veya pendingCardChoices varsa seçim yapılmadan geçilmesin
    if (gs.dayPhase === 'night' && !gs.menuChoices && !gs.pendingCardChoices) {
      gs.day++;
      gs.dayPhase = 'prep';
      gs.dayTimer = DAY_TICKS;
      
      // İntikam sahnesi hasar efektleri (eğer önceki gün sahne gösterildiyse)
      if (gs.revengeQueue.length > 0) {
        // Başlangıç tabak sayısı -1
        gs.plateStack.count = Math.max(1, gs.plateStack.count - 1);
        // O gün müşteri spawn hızı +%20 (dedikodu yayıldı)
        // Bu efekt gameLoop.ts'de spawnTick'te uygulanacak
      }
      
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
    // Input validation — geçersiz key reddet
    if (!UPGRADE_DEFS[key]) { socket.emit("sound", "fail"); return; }
    
    const upDef = UPGRADE_DEFS[key];
    const currentLv = gs.upgrades[key];
    if (currentLv >= upDef.max) { socket.emit("sound", "fail"); return; }
    
    const cost = upDef.costs[currentLv];
    if (gs.score >= cost) {
      gs.score -= cost;
      gs.upgrades[key]++;
      // Tabak kapasitesi upgrade'i plateStack.maxCount ve count'u da günceller
      if (key === 'plateStackMax') {
        gs.plateStack.maxCount += PLATE_STACK_PER_UPGRADE;
        gs.plateStack.count = Math.min(gs.plateStack.count + PLATE_STACK_PER_UPGRADE, gs.plateStack.maxCount);
      }
      // Ekstra lavabo ekle
      if (key === 'extraSink') {
        const sinkIdx = gs.upgrades.extraSink - 1; // yeni seviye - 1 = index
        const pos = EXTRA_SINK_POSITIONS[sinkIdx];
        if (pos) {
          const sinkId = `sink${sinkIdx + 2}`;
          gs.sinks.push({ id: sinkId, x: pos.x, y: pos.y, input: null, progress: 0, isWashing: false, washingPlayerId: null });
          gs.stationLayout[sinkId] = { id: sinkId, x: pos.x, y: pos.y };
        }
      }
      // Ekstra kesme tahtası ekle
      if (key === 'extraChopBoard') {
        const chopIdx = gs.upgrades.extraChopBoard - 1;
        const pos = EXTRA_CHOP_POSITIONS[chopIdx];
        if (pos) {
          const chopId = `chop${chopIdx + 2}`;
          gs.choppingBoards.push({ id: chopId, x: pos.x, y: pos.y, input: null, progress: 0, isChopping: false, choppingPlayerId: null });
          gs.stationLayout[chopId] = { id: chopId, x: pos.x, y: pos.y };
        }
      }
      io.to(roomId).emit("state", gs);
      socket.emit("sound", "success");
    } else {
      socket.emit("sound", "fail");
    }
  });

  socket.on("requestSync", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    socket.emit("state", gs);
  });

  socket.on("resetDay", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (!gs.isGameOver) return;

    gs.isGameOver = false;
    gs.lives = 3;
    gs.day = 1;
    gs.customers = [];
    gs.waitList = [];
    gs.dirtyTables = [];
    gs.dayPhase = 'prep';
    gs.dayTimer = DAY_TICKS;
    gs.score = Math.floor(gs.score * 0.8);
    gs.dirtyTrayCount = 0;
    gs.revengeQueue = [];
    gs.pendingRevengeScene = false;
    gs.lockedStations = {};
    gs.lockedTables = {};
    gs._seatCooldown = 0;
    gs.menuChoices = null;
    gs.hasOrderedTonight = false;
    gs.activeCards = [];
    gs.pendingCardChoices = null;
    gs.hidePatience = false;
    gs.comboCount = 0;
    gs.comboTimer = 0;
    // Servis penceresini temizle
    gs.serviceWindow?.forEach(s => { s.item = null; });
    // Lavaboları temizle
    gs.sinks?.forEach(s => { s.input = null; s.progress = 0; s.isWashing = false; s.washingPlayerId = null; });
    // Tabakları tam kapasiteye geri doldur
    gs.plateStack.count = gs.plateStack.maxCount;
    // Fırınları temizle
    gs.cookStations.forEach(s => { s.input = null; s.output = null; s.isBurned = false; s.burnTimer = 0; });
    // Fritözleri temizle
    gs.fryers?.forEach(f => { f.input = null; f.output = null; f.isBurned = false; f.burnTimer = 0; f.timer = 0; });
    gs.cakeBakers?.forEach(c => { c.input = null; c.output = null; c.isBurned = false; c.burnTimer = 0; c.timer = 0; });
    gs.fridges?.forEach(fridge => { fridge.drinks = fridge.maxDrinks; });
    gs.coffeeMachines?.forEach(cm => { cm.cups = cm.maxCups; });
    // Kesme tahtalarını temizle
    gs.choppingBoards?.forEach(b => { b.input = null; b.progress = 0; b.isChopping = false; b.choppingPlayerId = null; });
    // Oyuncuların elindeki itemları temizle
    Object.values(gs.players).forEach(p => { p.holding = null; });
    io.to(roomId).emit("state", gs);
    socket.emit("sound", "success");
  });

  // ─── Kesme Tahtası ────────────────────────────────────────────────────────
  socket.on("chop_start", (boardId: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    const board = gs.choppingBoards?.find(b => b.id === boardId);
    if (!board || !board.input || board.isChopping) return;
    // Zaten doğranmışsa tekrar doğrama
    if (board.input.startsWith('CHOPPED_')) return;
    board.isChopping = true;
    board.choppingPlayerId = socket.id;
  });

  socket.on("chop_stop", (boardId: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    const board = gs.choppingBoards?.find(b => b.id === boardId);
    if (!board) return;
    if (board.choppingPlayerId === socket.id) {
      board.isChopping = false;
      board.choppingPlayerId = null;
    }
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
      gs.score = Math.max(0, gs.score - 20);
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

    if (c.punchCount >= MAX_PUNCHES && !c.isLeaving) {
      const revengeChance = c.personality === 'recep' ? 0.6 : 0.3;
      if (Math.random() < revengeChance) {
        gs.revengeQueue.push(5400 + Math.floor(Math.random() * 1800));
        gs.pendingRevengeScene = true; // gün bitince sahne göster
      }
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

  // ─── Dev Araçları ────────────────────────────────────────────────────────
  socket.on("dev:makeNight", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    gs.customers = []; gs.waitList = []; gs.dirtyTables = [];
    gs.dayTimer = 1;
    io.to(roomId).emit("state", gs);
  });

  socket.on("dev:spawnCustomer", (data: { personality?: string; specialRequest?: string }) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'day') return;
    const pers = (data?.personality ?? 'polite') as any;
    const bodyColors: Record<string, string[]> = {
      polite: ['#3b82f6'], rude: ['#ef4444'], recep: ['#7c3aed'], thug: ['#000000'],
    };
    gs.waitList.push({
      id: Math.random().toString(36).slice(2, 9),
      wants: gs.unlockedDishes[0] ?? '🥗',
      personality: pers,
      bodyShape: 1, bodyColor: (bodyColors[pers] ?? ['#3b82f6'])[0],
      groupId: undefined,
    });
    // specialRequest için müşteri oturduğunda atanacak — waitList'te yok
    io.to(roomId).emit("state", gs);
  });

  socket.on("dev:triggerCards", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    generateCardChoices(gs);
    io.to(roomId).emit("state", gs);
  });

  socket.on("dev:unlockDish", (dish: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (!gs.unlockedDishes.includes(dish)) gs.unlockedDishes.push(dish);
    io.to(roomId).emit("state", gs);
  });

  socket.on("dev:addScore", (amount: number) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    gs.score = Math.max(0, gs.score + (amount ?? 0));
    io.to(roomId).emit("state", gs);
  });

  socket.on("dev:setLives", (lives: number) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    gs.lives = Math.max(1, Math.min(3, lives ?? 3));
    io.to(roomId).emit("state", gs);
  });

  // İntikam sahnesini anında tetikle (test için)
  socket.on("dev:triggerRevenge", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    io.to(roomId).emit("revengeScene", { day: gs.day, score: gs.score, lives: gs.lives });
  });

  // ─── Test Otomasyonu ─────────────────────────────────────────────────────
  socket.on("dev:runTest", (testType: 'basic' | 'combo' | 'stress' | 'visual') => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    
    console.log(`🤖 Test başlatılıyor: ${testType}`);
    
    switch(testType) {
      case 'basic':
        runBasicTest(gs, io, roomId, socket);
        break;
      case 'combo':
        runComboTest(gs, io, roomId, socket);
        break;
      case 'stress':
        runStressTest(gs, io, roomId, socket);
        break;
      case 'visual':
        runVisualTest(gs, io, roomId, socket);
        break;
    }
  });

  socket.on("leave", () => {
    removePlayerFromRoom();
  });

  // ─── Sesli Konuşma: Peer ID Yönetimi ────────────────────────────────────
  socket.on("updatePeerId", (peerId: string) => {
    if (!roomId) return;
    RoomManager.setPeerId(roomId, socket.id, peerId);
    // Odadaki herkese güncel peer haritasını gönder
    io.to(roomId).emit("peerMap", RoomManager.getPeerMap(roomId));
  });

  // ─── Chat ────────────────────────────────────────────────────────────────
  socket.on("chatMessage", (text: string) => {
    if (!roomId) return;
    const gs = RoomManager.getRoomState(roomId);
    const playerName = gs?.players[socket.id]?.name ?? 'Oyuncu';
    const msg = { id: socket.id, name: playerName, text: String(text).slice(0, 120), ts: Date.now() };
    io.to(roomId).emit("chatMessage", msg);
  });

  socket.on("ping_check", (t0: number) => {
    socket.emit("pong_check", t0);
  });
  socket.on("disconnect", () => {
    removePlayerFromRoom();
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// ─── Render Free Tier Keep-Alive ─────────────────────────────────────────────
// Render ücretsiz planda 15 dakika hareketsizlikte sunucuyu uyutuyor.
// Her 10 dakikada bir kendi kendine ping atarak uyanık tutar.
if (process.env.NODE_ENV === 'production') {
  const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
  setInterval(async () => {
    try {
      await fetch(`${RENDER_URL}/ping`);
    } catch (_) { /* sessizce geç */ }
  }, 10 * 60 * 1000); // 10 dakika
}

app.get('/ping', (_req, res) => res.send('pong'));

// ─── Test Otomasyonu Fonksiyonları ──────────────────────────────────────────

function runBasicTest(gs: GameState, io: Server, roomId: string, socket: any) {
  console.log('🎯 Temel Test başlatılıyor...');
  
  let step = 0;
  const testSteps = [
    () => {
      // 1. Müşteri spawn et
      console.log('  1. Müşteri spawn ediliyor...');
      gs.customers.push({
        id: 'test-customer-1',
        x: 100, y: 300,
        seatX: 200, seatY: 300, targetY: 300,
        wants: '🍕',
        specialRequest: null,
        patience: 100,
        maxPatience: 100,
        isSeated: false,
        isEating: false,
        eatTimer: 0,
        tipAmount: 0,
        personality: 'polite',
        bodyShape: 1,
        bodyColor: '#8B4513',
        phase: 'entering'
      });
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ Müşteri spawn edildi");
    },
    () => {
      // 2. Müşteriye pizza ver
      console.log('  2. Pizza hazırlanıyor...');
      const customer = gs.customers.find(c => c.id === 'test-customer-1');
      if (customer) {
        customer.isSeated = true;
        customer.isEating = true;
        customer.eatTimer = 60; // 1 saniye yeme süresi
        gs.score += 15;
        gs.comboCount++;
        socket.emit("testLog", "✅ Pizza servis edildi");
      }
      io.to(roomId).emit("state", gs);
    },
    () => {
      // 3. Müşteriyi gönder
      console.log('  3. Müşteri gönderiliyor...');
      gs.customers = gs.customers.filter(c => c.id !== 'test-customer-1');
      socket.emit("testLog", "✅ Müşteri gönderildi");
      socket.emit("testLog", `💰 Skor: ${gs.score}, Combo: ${gs.comboCount}`);
      io.to(roomId).emit("state", gs);
    }
  ];
  
  const runStep = () => {
    if (step < testSteps.length) {
      testSteps[step]();
      step++;
      setTimeout(runStep, 2000); // 2 saniye bekle
    } else {
      console.log('🎯 Temel Test tamamlandı!');
      socket.emit("testLog", "🎉 Temel Test tamamlandı!");
    }
  };
  
  runStep();
}

function runComboTest(gs: GameState, io: Server, roomId: string, socket: any) {
  console.log('🔥 Combo Test başlatılıyor...');
  
  let step = 0;
  const testSteps = [
    () => {
      // 1. 3 müşteri spawn et
      console.log('  1. 3 müşteri spawn ediliyor...');
      for (let i = 0; i < 3; i++) {
        gs.customers.push({
          id: `test-combo-${i}`,
          x: 100 + i * 50, y: 300,
          seatX: 200 + i * 50, seatY: 300, targetY: 300,
          wants: '🍕',
          specialRequest: null,
          patience: 100,
          maxPatience: 100,
          isSeated: false,
          isEating: false,
          eatTimer: 0,
          tipAmount: 0,
          personality: 'polite',
          bodyShape: 1,
          bodyColor: '#8B4513',
          phase: 'entering'
        });
      }
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ 3 müşteri spawn edildi");
    },
    () => {
      // 2. Hızlıca 3 servis yap (combo için)
      console.log('  2. Hızlı servis yapılıyor...');
      gs.customers.forEach((customer, i) => {
        if (customer.id.startsWith('test-combo-')) {
          customer.isSeated = true;
          customer.isEating = true;
          customer.eatTimer = 60;
          gs.score += 15;
          gs.comboCount++;
          setTimeout(() => {
            socket.emit("testLog", `✅ Müşteri ${i+1} servis edildi`);
          }, i * 500);
        }
      });
      io.to(roomId).emit("state", gs);
    },
    () => {
      // 3. Combo sonuçlarını kontrol et
      console.log('  3. Combo sonuçları kontrol ediliyor...');
      socket.emit("testLog", `🔥 Combo Count: ${gs.comboCount}`);
      socket.emit("testLog", `💰 Skor: ${gs.score}`);
      
      // Müşterileri temizle
      gs.customers = gs.customers.filter(c => !c.id.startsWith('test-combo-'));
      io.to(roomId).emit("state", gs);
      
      setTimeout(() => {
        socket.emit("testLog", "🎉 Combo Test tamamlandı!");
      }, 1000);
    }
  ];
  
  const runStep = () => {
    if (step < testSteps.length) {
      testSteps[step]();
      step++;
      setTimeout(runStep, 3000); // 3 saniye bekle
    }
  };
  
  runStep();
}

function runStressTest(gs: GameState, io: Server, roomId: string, socket: any) {
  console.log('⚡ Stress Test başlatılıyor...');
  
  socket.emit("testLog", "⚡ Stress Test başlatıldı - 10 müşteri spawn ediliyor...");
  
  // 10 müşteri birden spawn et
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      gs.customers.push({
        id: `stress-test-${i}`,
        x: 50 + (i % 5) * 100, 
        y: 250 + Math.floor(i / 5) * 100,
        seatX: 200 + (i % 5) * 100, 
        seatY: 300 + Math.floor(i / 5) * 100,
        targetY: 300 + Math.floor(i / 5) * 100,
        wants: ['🍕', '🍜', '🌯', '🍟', '🥤'][i % 5] as any,
        specialRequest: i % 3 === 0 ? 'spicy' : null,
        patience: 100,
        maxPatience: 100,
        isSeated: false,
        isEating: false,
        eatTimer: 0,
        tipAmount: 0,
        personality: ['polite', 'rude', 'recep', 'thug'][i % 4] as any,
        bodyShape: (i % 4 + 1) as any,
        bodyColor: ['#8B4513', '#D2691E', '#CD853F', '#F4A460'][i % 4],
        phase: 'entering'
      });
      
      socket.emit("testLog", `👥 Müşteri ${i+1}/10 spawn edildi`);
      io.to(roomId).emit("state", gs);
    }, i * 200); // 200ms aralıklarla spawn et
  }
  
  // 5 saniye sonra temizle
  setTimeout(() => {
    gs.customers = gs.customers.filter(c => !c.id.startsWith('stress-test-'));
    io.to(roomId).emit("state", gs);
    socket.emit("testLog", "🧹 Stress Test temizlendi");
    socket.emit("testLog", "🎉 Stress Test tamamlandı!");
  }, 8000);
}

function runVisualTest(gs: GameState, io: Server, roomId: string, socket: any) {
  console.log('👁️ Görsel Test başlatılıyor...');
  
  let step = 0;
  const testSteps = [
    () => {
      socket.emit("testLog", "🎨 Görsel efektler test ediliyor...");
      // Combo efekti tetikle
      gs.comboCount = 5;
      gs.comboTimer = 300; // 5 saniye combo timer
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "🔥 Combo efekti tetiklendi");
    },
    () => {
      // Farklı müşteri tipleri spawn et
      socket.emit("testLog", "👥 Farklı müşteri tipleri spawn ediliyor...");
      const personalities = ['polite', 'rude', 'recep', 'thug'];
      personalities.forEach((personality, i) => {
        gs.customers.push({
          id: `visual-test-${personality}`,
          x: 100 + i * 150, y: 200,
          seatX: 200 + i * 150, seatY: 300, targetY: 300,
          wants: '🍕',
          specialRequest: i === 0 ? 'spicy' : i === 1 ? 'extra' : i === 2 ? 'quick' : null,
          patience: 100 - i * 20,
          maxPatience: 100,
          isSeated: false,
          isEating: false,
          eatTimer: 0,
          tipAmount: 0,
          personality: personality as any,
          bodyShape: (i % 4 + 1) as any,
          bodyColor: ['#8B4513', '#D2691E', '#CD853F', '#F4A460'][i],
          phase: 'entering'
        });
      });
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ 4 farklı müşteri tipi spawn edildi");
    },
    () => {
      // Gece moduna geç
      socket.emit("testLog", "🌙 Gece moduna geçiliyor...");
      gs.dayPhase = 'night';
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ Gece modu aktif");
    },
    () => {
      // Temizlik
      socket.emit("testLog", "🧹 Test temizleniyor...");
      gs.customers = gs.customers.filter(c => !c.id.startsWith('visual-test-'));
      gs.dayPhase = 'prep';
      gs.comboCount = 0;
      gs.comboTimer = 0;
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "🎉 Görsel Test tamamlandı!");
    }
  ];
  
  const runStep = () => {
    if (step < testSteps.length) {
      testSteps[step]();
      step++;
      setTimeout(runStep, 3000);
    }
  };
  
  runStep();
}