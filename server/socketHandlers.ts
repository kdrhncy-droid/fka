import { Server, Socket } from "socket.io";
import {
  UpgradeKey,
  GAME_HEIGHT,
  INITIAL_OVEN_POSITIONS, ADDITIONAL_OVEN_POSITIONS, OVEN_UPGRADE_COSTS,
  PLATE_STACK_PER_UPGRADE, UPGRADE_DEFS,
  EXTRA_SINK_POSITIONS, EXTRA_CHOP_POSITIONS,
  mkGameState, mkCook, MapId
} from "../shared/types.js";
import { gameTick, tryQueueSeat, transitionToNextDay, startDay, resetGameState } from "./gameLoop.js";
import { registerInteractHandler } from "./interactHandler.js";
import { registerLayoutHandler } from "./layoutHandler.js";
import { registerDevHandlers } from "./devHandlers.js";
import { RoomManager } from "./roomManager.js";

const LOGIC_STEP_MS = 33;

export function registerSocketHandlers(socket: Socket, io: Server) {
  let roomId: string | null = null;
  let playerId: string | null = null;

  function removePlayerFromRoom() {
    if (!roomId || !playerId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    delete gs.players[playerId];
    RoomManager.removePeer(roomId, playerId);
    io.to(roomId).emit("peerMap", RoomManager.getPeerMap(roomId));
    for (const [id, lockerId] of Object.entries(gs.lockedStations)) {
      if (lockerId === playerId) delete gs.lockedStations[id];
    }
    for (const [id, lockerId] of Object.entries(gs.lockedTables)) {
      if (lockerId === playerId) delete gs.lockedTables[id];
    }
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

  // ── Join ──────────────────────────────────────────────────────────────────
  socket.on("join", ({ room, roomId: clientRoomId, name, color, hat, charType, hairColor, hairStyle, outfitStyle, clothingColor, faceShape, nameLabelColor, title, labelEffect, serviceEffect, mapId }) => {
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
          console.error('[GameLoop] Hata:', err);
        }
      }, LOGIC_STEP_MS);
      RoomManager.setInterval(roomId, interval);
    }

    const gs = RoomManager.getRoomState(roomId)!;
    gs.players[socket.id] = {
      id: socket.id, name, color, hat, charType,
      hairColor, hairStyle, outfitStyle, clothingColor, faceShape,
      nameLabelColor, title, labelEffect, serviceEffect,
      x: 640, y: 350, holding: null
    };
    socket.emit("init", { id: socket.id, state: gs });
    io.to(roomId).emit("state", gs);
  });

  // ── Görünüm ───────────────────────────────────────────────────────────────
  socket.on("changeCosmetic", (id: number) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.players[socket.id]) { gs.players[socket.id].charType = id; io.to(roomId).emit("state", gs); }
  });

  socket.on("updateAppearance", (data: { hairColor?: string; hairStyle?: string; outfitStyle?: string; clothingColor?: string; faceShape?: number; color?: string; hat?: string; nameLabelColor?: string; serviceEffect?: string }) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (!gs.players[socket.id]) return;
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
  });

  // ── Hareket ───────────────────────────────────────────────────────────────
  socket.on("move", (pos) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.players[socket.id]) { gs.players[socket.id].x = pos.x; gs.players[socket.id].y = pos.y; }
  });

  // ── Etkileşim + Layout ────────────────────────────────────────────────────
  registerInteractHandler(socket, io, () => roomId, (rid) => RoomManager.getRoomState(rid));
  registerLayoutHandler(socket, io, () => roomId, (rid) => RoomManager.getRoomState(rid));

  // ── Gece Aksiyonları ──────────────────────────────────────────────────────
  socket.on("order", () => { socket.emit("sound", "fail"); });

  socket.on("selectCard", (cardId: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night' || !gs.pendingCardChoices) return;
    const card = gs.pendingCardChoices.find(c => c.id === cardId);
    if (!card) return;
    gs.activeCards.push({ id: card.id, appliedOnDay: gs.day });
    gs.pendingCardChoices = null;
    if (card.id === 'few_plates') { gs.plateStack.maxCount = Math.max(2, gs.plateStack.maxCount - 2); gs.plateStack.count = Math.min(gs.plateStack.count, gs.plateStack.maxCount); }
    if (card.id === 'mystery_guests') gs.hidePatience = true;
    io.to(roomId).emit("state", gs);
    socket.emit("sound", "success");
  });

  socket.on("selectMenu", (dish: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night' && gs.dayPhase !== 'prep') return;
    if (!gs.menuChoices?.includes(dish)) return;
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
      io.to(roomId).emit("state", gs); socket.emit("sound", "success");
    } else { socket.emit("sound", "fail"); }
  });

  socket.on("buyTable", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    const TABLE_POSITIONS = [
      // Başlangıç 6 masa (sıra 1)
      { x: 160, y: 460 }, { x: 380, y: 460 }, { x: 600, y: 460 },
      { x: 820, y: 460 }, { x: 1040, y: 460 }, { x: 1200, y: 460 },
      // Satın alınabilir 9 masa (sıra 2 ve 3)
      { x: 160, y: 590 }, { x: 380, y: 590 }, { x: 600, y: 590 },
      { x: 820, y: 590 }, { x: 1040, y: 590 }, { x: 1200, y: 590 },
      { x: 270, y: 660 }, { x: 640, y: 660 }, { x: 1010, y: 660 },
    ];
    const TABLE_COSTS = [100, 150, 200, 250, 300, 350, 400, 450, 500];
    const MAX_TABLES = 15;
    const currentCount = Object.keys(gs.tableLayout).length;
    if (currentCount >= MAX_TABLES) { socket.emit("sound", "fail"); return; }
    const cost = TABLE_COSTS[Math.min(currentCount - 6, TABLE_COSTS.length - 1)];
    if (gs.score < cost) { socket.emit("sound", "fail"); return; }
    gs.score -= cost;
    const id = `table${currentCount}`;
    gs.tableLayout[id] = { id, x: TABLE_POSITIONS[currentCount].x, y: TABLE_POSITIONS[currentCount].y };
    io.to(roomId).emit("state", gs);
    socket.emit("sound", "success");
  });

  socket.on("buyLife", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    if (gs.lives < 3 && gs.score >= 75) {
      gs.score -= 75; gs.lives++;
      io.to(roomId).emit("state", gs); socket.emit("sound", "success");
    } else { socket.emit("sound", "fail"); }
  });

  socket.on("nextDay", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (transitionToNextDay(gs)) {
      io.to(roomId).emit("state", gs); socket.emit("sound", "success");
    }
  });

  socket.on("openShop", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (startDay(gs)) {
      io.to(roomId).emit("state", gs); socket.emit("sound", "success");
    }
  });

  socket.on("upgrade", (key: UpgradeKey) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'night') return;
    if (!UPGRADE_DEFS[key]) { socket.emit("sound", "fail"); return; }
    const upDef = UPGRADE_DEFS[key];
    const currentLv = gs.upgrades[key];
    if (currentLv >= upDef.max) { socket.emit("sound", "fail"); return; }
    const cost = upDef.costs[currentLv];
    if (gs.score >= cost) {
      gs.score -= cost; gs.upgrades[key]++;
      if (key === 'plateStackMax') { gs.plateStack.maxCount += PLATE_STACK_PER_UPGRADE; gs.plateStack.count = Math.min(gs.plateStack.count + PLATE_STACK_PER_UPGRADE, gs.plateStack.maxCount); }
      if (key === 'extraSink') {
        const idx = gs.upgrades.extraSink - 1; const pos = EXTRA_SINK_POSITIONS[idx];
        if (pos) { const id = `sink${idx + 2}`; gs.sinks.push({ id, x: pos.x, y: pos.y, input: null, progress: 0, isWashing: false, washingPlayerId: null }); gs.stationLayout[id] = { id, x: pos.x, y: pos.y }; }
      }
      if (key === 'extraChopBoard') {
        const idx = gs.upgrades.extraChopBoard - 1; const pos = EXTRA_CHOP_POSITIONS[idx];
        if (pos) { const id = `chop${idx + 2}`; gs.choppingBoards.push({ id, x: pos.x, y: pos.y, input: null, progress: 0, isChopping: false, choppingPlayerId: null }); gs.stationLayout[id] = { id, x: pos.x, y: pos.y }; }
      }
      io.to(roomId).emit("state", gs); socket.emit("sound", "success");
    } else { socket.emit("sound", "fail"); }
  });

  socket.on("requestSync", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    socket.emit("state", RoomManager.getRoomState(roomId)!);
  });

  socket.on("resetDay", () => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (!gs.isGameOver) return;
    resetGameState(gs);
    io.to(roomId).emit("state", gs); socket.emit("sound", "success");
  });

  // ── Doğrama ───────────────────────────────────────────────────────────────
  socket.on("chop_start", (boardId: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    const board = gs.choppingBoards?.find(b => b.id === boardId);
    if (!board || !board.input || board.isChopping || board.input.startsWith('CHOPPED_')) return;
    board.isChopping = true; board.choppingPlayerId = socket.id;
  });

  socket.on("chop_stop", (boardId: string) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    const board = gs.choppingBoards?.find(b => b.id === boardId);
    if (board?.choppingPlayerId === socket.id) { board.isChopping = false; board.choppingPlayerId = null; }
  });

  // ── Dövme ─────────────────────────────────────────────────────────────────
  socket.on("punchCustomer", (customerId) => {
    if (!roomId || !RoomManager.getRoomState(roomId)) return;
    const gs = RoomManager.getRoomState(roomId)!;
    if (gs.dayPhase !== 'day') return;
    const cIdx = gs.customers.findIndex(c => c.id === customerId);
    if (cIdx === -1) return;
    const c = gs.customers[cIdx];
    if (c.isLeaving || (c.beatUpTimer && c.beatUpTimer > 3)) return;

    if (c.personality === 'polite') {
      gs.score = Math.max(0, gs.score - 20);
      c.beatUpTimer = 20;
      c.currentDialog = ["AY!", "Ne yapıyorsunuz!", "İmdat!", "Polis!"][Math.floor(Math.random() * 4)];
      c.dialogTimer = 90;
      socket.emit("sound", "fail");
      io.to(roomId!).emit("punchEffect", { x: c.x, y: c.y, count: 1 });
      return;
    }

    c.beatUpTimer = 30; c.isBeatUp = true;
    c.punchCount = (c.punchCount || 0) + 1;

    if (c.punchCount >= 4 && !c.isLeaving) {
      if (Math.random() < (c.personality === 'recep' ? 0.6 : 0.3)) {
        gs.revengeQueue.push(5400 + Math.floor(Math.random() * 1800));
        gs.pendingRevengeScene = true;
      }
      const leaveDialogs: Record<string, string[]> = {
        rude: ["YETER BE! Gidiyorum!", "Polisi arayacam lan!"],
        recep: ["BÖHÖHÖYT! Anam babam öldüm bittim!", "Yeter vurma lan!"],
        thug: ["KAÇIN LAN!", "Görürsün sen!"]
      };
      c.currentDialog = (leaveDialogs[c.personality] || leaveDialogs.rude)[Math.floor(Math.random() * 2)];
      c.dialogTimer = 120;
      c.isLeaving = true; c.isSeated = false; c.isEating = false; c.beatUpTimer = 0;
      c.targetY = GAME_HEIGHT + 120;
      const ti = gs.dirtyTables.findIndex(t => t.seatX === c.seatX && t.seatY === c.seatY);
      if (ti !== -1) gs.dirtyTables.splice(ti, 1);
      tryQueueSeat(gs, io, roomId!);
    } else {
      const hitDialogs: Record<string, string[]> = {
        rude: ["AH!", "Napiyorsun lan!"], recep: ["Böhöyt!", "Anaaam!"], thug: ["Uyy!", "Vurma be!"]
      };
      c.currentDialog = (hitDialogs[c.personality] || hitDialogs.rude)[Math.floor(Math.random() * 2)];
      c.dialogTimer = 90;
    }
    socket.emit("sound", "pickup");
    io.to(roomId!).emit("punchEffect", { x: c.x, y: c.y, count: c.punchCount });
  });

  // ── Sesli Konuşma ─────────────────────────────────────────────────────────
  socket.on("updatePeerId", (peerId: string) => {
    if (!roomId) return;
    RoomManager.setPeerId(roomId, socket.id, peerId);
    io.to(roomId).emit("peerMap", RoomManager.getPeerMap(roomId));
  });

  // ── Chat ──────────────────────────────────────────────────────────────────
  socket.on("chatMessage", (text: string) => {
    if (!roomId) return;
    const gs = RoomManager.getRoomState(roomId);
    const playerName = gs?.players[socket.id]?.name ?? 'Oyuncu';
    const msg = { id: socket.id, name: playerName, text: String(text).slice(0, 120), ts: Date.now() };
    io.to(roomId).emit("chatMessage", msg);
  });

  // ── Ping ──────────────────────────────────────────────────────────────────
  socket.on("ping_check", (t0: number) => { socket.emit("pong_check", t0); });

  // ── Dev ───────────────────────────────────────────────────────────────────
  registerDevHandlers(socket, io, () => roomId, (rid) => RoomManager.getRoomState(rid));

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on("leave", () => { removePlayerFromRoom(); });
  socket.on("disconnect", () => { removePlayerFromRoom(); });
}
