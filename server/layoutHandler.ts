import { Socket, Server } from "socket.io";
import { GameState, GRID_CELL_SIZE, GAME_WIDTH, GAME_HEIGHT, TablePosition, getTableDims, WALL_Y1, WALL_Y2 } from "../shared/types.js";

function snapToGrid(x: number, y: number): { x: number; y: number } {
  const col = Math.floor(x / GRID_CELL_SIZE);
  const row = Math.floor(y / GRID_CELL_SIZE);
  const clampedCol = Math.max(0, Math.min(col, Math.floor(GAME_WIDTH / GRID_CELL_SIZE) - 1));
  const clampedRow = Math.max(0, Math.min(row, Math.floor(GAME_HEIGHT / GRID_CELL_SIZE) - 1));
  return {
    x: clampedCol * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: clampedRow * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
}

function isOccupied(
  x: number, y: number,
  layout: GameState["stationLayout"],
  excludeId: string
): boolean {
  return Object.values(layout).some(
    s => s.id !== excludeId && s.x === x && s.y === y
  );
}

const MIN_TABLE_Y = 320;

function tableOverlaps(
  x: number, y: number, seats: 1 | 2 | 3 | 4 | undefined,
  layout: Record<string, TablePosition>,
  excludeId: string
): boolean {
  const incoming = getTableDims(seats);
  return Object.values(layout).some(t => {
    if (t.id === excludeId) return false;
    const existing = getTableDims(t.seats);
    return Math.abs(t.x - x) < (existing.hw + incoming.hw + 10) &&
           Math.abs(t.y - y) < (existing.hh + incoming.hh + 10);
  });
}

export function registerLayoutHandler(
  socket: Socket,
  io: Server,
  getRoomId: () => string | null,
  getRoomState: (rid: string) => GameState | undefined
): void {
  // Oyuncu disconnect → kilitlediği istasyonları ve masaları serbest bırak
  socket.on("disconnect", () => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    const freed: string[] = [];
    for (const [stationId, lockedBy] of Object.entries(gs.lockedStations)) {
      if (lockedBy === socket.id) {
        delete gs.lockedStations[stationId];
        freed.push(stationId);
      }
    }
    freed.forEach(stationId =>
      io.to(roomId).emit("stationUnlocked", { stationId })
    );
    // Masa kilitleri
    for (const [tableId, lockedBy] of Object.entries(gs.lockedTables)) {
      if (lockedBy === socket.id) {
        delete gs.lockedTables[tableId];
        io.to(roomId).emit("tableUnlocked", { tableId });
      }
    }
  });

  socket.on("lockStation", ({ stationId }: { stationId: string }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.dayPhase !== "prep") return;
    if (!(stationId in gs.stationLayout)) return;

    // Zaten kilitliyse reddet
    if (gs.lockedStations[stationId]) {
      socket.emit("stationLocked", { stationId, lockedBy: gs.lockedStations[stationId] });
      return;
    }

    gs.lockedStations[stationId] = socket.id;
    io.to(roomId).emit("stationLocked", { stationId, lockedBy: socket.id });
  });

  socket.on("moveStation", ({ stationId, x, y }: { stationId: string; x: number; y: number }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.dayPhase !== "prep") return;
    if (!(stationId in gs.stationLayout)) return;
    if (gs.lockedStations[stationId] !== socket.id) return;

    const snapped = snapToGrid(x, y);
    if (isOccupied(snapped.x, snapped.y, gs.stationLayout, stationId)) {
      socket.emit("sound", "fail");
      return;
    }

    gs.stationLayout[stationId].x = snapped.x;
    gs.stationLayout[stationId].y = snapped.y;

    // Fırın ise cookStation koordinatını da güncelle
    const oven = gs.cookStations.find(s => s.id === stationId);
    if (oven) { oven.x = snapped.x; oven.y = snapped.y; }

    // Kesme tahtası ise choppingBoards koordinatını da güncelle
    const board = gs.choppingBoards?.find(b => b.id === stationId);
    if (board) { board.x = snapped.x; board.y = snapped.y; }

    // Fritöz ise fryers koordinatını da güncelle
    const fryer = gs.fryers?.find(f => f.id === stationId);
    if (fryer) { fryer.x = snapped.x; fryer.y = snapped.y; }

    // Buzdolabı ise fridges koordinatını da güncelle
    const fridge = gs.fridges?.find(f => f.id === stationId);
    if (fridge) { fridge.x = snapped.x; fridge.y = snapped.y; }

    // Pasta fırını ise cakeBakers koordinatını da güncelle
    const cakeBaker = gs.cakeBakers?.find(c => c.id === stationId);
    if (cakeBaker) { cakeBaker.x = snapped.x; cakeBaker.y = snapped.y; }

    // Kahve makinesi ise coffeeMachines koordinatını da güncelle
    const coffeeMachine = gs.coffeeMachines?.find(c => c.id === stationId);
    if (coffeeMachine) { coffeeMachine.x = snapped.x; coffeeMachine.y = snapped.y; }

    // Baharat rafı — stationLayout güncellenmesi yeterli (ayrı array yok)

    delete gs.lockedStations[stationId];
    io.to(roomId).emit("stationMoved", { stationId, x: snapped.x, y: snapped.y });
    io.to(roomId).emit("stationUnlocked", { stationId });
    socket.emit("sound", "success");
  });

  socket.on("unlockStation", ({ stationId }: { stationId: string }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.lockedStations[stationId] !== socket.id) return;
    delete gs.lockedStations[stationId];
    io.to(roomId).emit("stationUnlocked", { stationId });
  });

  // ─── Masa Event'leri ──────────────────────────────────────────────────────
  socket.on("lockTable", ({ tableId }: { tableId: string }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.dayPhase !== "prep") return;
    if (!(tableId in gs.tableLayout)) return;
    const t = gs.tableLayout[tableId];
    // Masada müşteri var mı?
    const hasCust = gs.customers.some(c =>
      Math.hypot(c.seatX - t.x, c.seatY - t.y) < 60
    );
    if (hasCust) return;
    // Kirli masa var mı?
    const hasDirty = gs.dirtyTables.some(d =>
      Math.hypot(d.seatX - t.x, d.seatY - t.y) < 60
    );
    if (hasDirty) return;
    // Zaten kilitli mi?
    if (gs.lockedTables[tableId]) {
      socket.emit("tableLocked", { tableId, lockedBy: gs.lockedTables[tableId] });
      return;
    }
    gs.lockedTables[tableId] = socket.id;
    io.to(roomId).emit("tableLocked", { tableId, lockedBy: socket.id });
  });

  socket.on("moveTable", ({ tableId, x, y }: { tableId: string; x: number; y: number }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.dayPhase !== "prep") return;
    if (!(tableId in gs.tableLayout)) return;
    if (gs.lockedTables[tableId] !== socket.id) return;
    const snapped = snapToGrid(x, y);
    // Bölge kısıtları
    if (snapped.y < MIN_TABLE_Y) { socket.emit("sound", "fail"); return; }
    if (snapped.y >= WALL_Y1 && snapped.y <= WALL_Y2) { socket.emit("sound", "fail"); return; }
    if (snapped.y > GAME_HEIGHT - 60) { socket.emit("sound", "fail"); return; }
    // AABB çakışma (kendi kapladığı boyuta göre)
    const t = gs.tableLayout[tableId];
    if (tableOverlaps(snapped.x, snapped.y, t.seats, gs.tableLayout, tableId)) {
      socket.emit("sound", "fail"); return;
    }
    gs.tableLayout[tableId] = { id: tableId, x: snapped.x, y: snapped.y, seats: t.seats };
    delete gs.lockedTables[tableId];
    io.to(roomId).emit("tableMoved", { tableId, x: snapped.x, y: snapped.y, seats: t.seats });
    io.to(roomId).emit("tableUnlocked", { tableId });
    socket.emit("sound", "success");
  });

  socket.on("unlockTable", ({ tableId }: { tableId: string }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.lockedTables[tableId] !== socket.id) return;
    delete gs.lockedTables[tableId];
    io.to(roomId).emit("tableUnlocked", { tableId });
  });

  socket.on("cycleTableSeats", ({ tableId }: { tableId: string }) => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    if (gs.dayPhase !== "prep") return;
    if (!(tableId in gs.tableLayout)) return;
    if (gs.lockedTables[tableId] !== socket.id) return; // Sadece masayı elinde tutan değiştirebilir

    const t = gs.tableLayout[tableId];
    let nextSeats: 1 | 2 | 3 | 4 = 1;
    const current = t.seats ?? 4;
    if (current === 1) nextSeats = 2;
    else if (current === 2) nextSeats = 3;
    else if (current === 3) nextSeats = 4;
    else if (current === 4) nextSeats = 1;

    // Yeni boyutuyla çakışma yapıyor mu?
    if (tableOverlaps(t.x, t.y, nextSeats, gs.tableLayout, tableId)) {
      socket.emit("sound", "fail"); return;
    }

    t.seats = nextSeats;
    // Client'lara 'tableMoved' göndererek seats verisini de yolluyoruz.
    io.to(roomId).emit("tableMoved", { tableId, x: t.x, y: t.y, seats: t.seats });
    socket.emit("sound", "pickup");
  });
}
