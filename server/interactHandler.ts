import { Socket, Server } from "socket.io";
import { GameState, INGREDIENTS, SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R, TRASH_STATION, TRAY_STATION, PLATE_STACK_POS, SPICE_RACK_POS } from "../shared/types.js";
import { InteractContext, InteractionHandler, bcastSound } from "./handlers/utils.js";

// Tüm handler dosyalarını içe aktar
import { handleCookStations, handleFryers, handleCakeBakers, handleCoffeeMachines, handleIngredients } from "./handlers/kitchenHandler.js";
import { handleServiceWindow, handleDirtyTables, handleCustomers } from "./handlers/serviceHandler.js";
import { handleTrash, handleTrayStation, handleDirtyTrayBasket, handlePlateStack, handleSpiceRack, handleFridges } from "./handlers/itemHandler.js";
import { handleSinks, handleChoppingBoards } from "./handlers/sinkHandler.js";

const INTERACT_R = 110;
const COOK_R = 145;
const SERVE_R = 125;

interface HandlerCandidate {
  handler: InteractionHandler;
  distance: number;
}

function buildSortedHandlers(px: number, py: number, gs: GameState): InteractionHandler[] {
  const candidates: HandlerCandidate[] = [];

  function track(handler: InteractionHandler, x: number, y: number, radius: number) {
    const d = Math.hypot(px - x, py - y);
    if (d < radius) {
      const existing = candidates.find(c => c.handler === handler);
      if (existing) {
        if (d < existing.distance) existing.distance = d;
      } else {
        candidates.push({ handler, distance: d });
      }
    }
  }

  // Servis penceresi
  if (gs.serviceWindow?.length) {
    SERVICE_WINDOW_SLOTS.forEach(s => track(handleServiceWindow, s.x, s.y, SERVICE_WINDOW_R));
  }

  // Lavabolar
  gs.sinks?.forEach(s => {
    const x = gs.stationLayout?.[s.id]?.x ?? s.x;
    const y = gs.stationLayout?.[s.id]?.y ?? s.y;
    track(handleSinks, x, y, INTERACT_R);
  });

  // Çöp kutusu
  const trashPos = gs.stationLayout['trash'] ?? TRASH_STATION;
  track(handleTrash, trashPos.x, trashPos.y, INTERACT_R);

  // Tepsi istasyonu
  const trayPos = gs.stationLayout['tray'] ?? TRAY_STATION;
  track(handleTrayStation, trayPos.x, trayPos.y, INTERACT_R);

  // Kirli tepsi sepeti
  const dirtyTrayPos = gs.stationLayout['dirty_tray'] ?? { x: 1050, y: 90 };
  track(handleDirtyTrayBasket, dirtyTrayPos.x, dirtyTrayPos.y, INTERACT_R);

  // Kirli masalar
  gs.dirtyTables?.forEach(t => track(handleDirtyTables, t.seatX, t.seatY, SERVE_R));

  // Tabak yığını
  const platePos = gs.stationLayout?.['plate_stack'] ?? PLATE_STACK_POS;
  track(handlePlateStack, platePos.x, platePos.y, PLATE_STACK_POS.radius);

  // Kesme tahtaları
  gs.choppingBoards?.forEach(b => {
    const x = gs.stationLayout?.[b.id]?.x ?? b.x;
    const y = gs.stationLayout?.[b.id]?.y ?? b.y;
    track(handleChoppingBoards, x, y, INTERACT_R);
  });

  // Baharat rafı (gün 3+)
  if (gs.day >= 3) {
    const spicePos = gs.stationLayout?.['spice_rack'] ?? SPICE_RACK_POS;
    track(handleSpiceRack, spicePos.x, spicePos.y, INTERACT_R);
  }

  // Fritözler
  gs.fryers?.forEach(f => {
    const x = gs.stationLayout?.[f.id]?.x ?? f.x;
    const y = gs.stationLayout?.[f.id]?.y ?? f.y;
    track(handleFryers, x, y, INTERACT_R);
  });

  // Buzdolapları
  gs.fridges?.forEach(f => {
    const x = gs.stationLayout?.[f.id]?.x ?? f.x;
    const y = gs.stationLayout?.[f.id]?.y ?? f.y;
    track(handleFridges, x, y, INTERACT_R);
  });

  // Pasta fırınları
  gs.cakeBakers?.forEach(c => {
    const x = gs.stationLayout?.[c.id]?.x ?? c.x;
    const y = gs.stationLayout?.[c.id]?.y ?? c.y;
    track(handleCakeBakers, x, y, INTERACT_R);
  });

  // Kahve makineleri
  gs.coffeeMachines?.forEach(c => {
    const x = gs.stationLayout?.[c.id]?.x ?? c.x;
    const y = gs.stationLayout?.[c.id]?.y ?? c.y;
    track(handleCoffeeMachines, x, y, INTERACT_R);
  });

  // Fırınlar (COOK_R — daha büyük yarıçap)
  gs.cookStations?.forEach(s => {
    const x = gs.stationLayout?.[s.id]?.x ?? s.x;
    const y = gs.stationLayout?.[s.id]?.y ?? s.y;
    track(handleCookStations, x, y, COOK_R);
  });

  // Müşteriler
  gs.customers?.forEach(c => {
    if (c.isSeated && !c.isEating) track(handleCustomers, c.seatX, c.seatY, SERVE_R);
  });

  // Malzemeler
  INGREDIENTS.forEach(ing => {
    const dynPos = gs.stationLayout[`ingredient_${ing.key}`];
    track(handleIngredients, dynPos?.x ?? ing.pos.x, dynPos?.y ?? ing.pos.y, INTERACT_R);
  });

  // Mesafeye göre sırala (en yakın önce)
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates.map(c => c.handler);
}

// ─── ANA KAYIT FONKSİYONU ────────────────────────────────────────────────────

export function registerInteractHandler(
  socket: Socket,
  io: Server,
  getRoomId: () => string | null,
  getRoomState: (rid: string) => GameState | undefined
) {
  socket.on("interact", () => {
    const roomId = getRoomId();
    if (!roomId) return;
    const gs = getRoomState(roomId);
    if (!gs) return;
    const p = gs.players[socket.id];
    if (!p) return;

    const ctx: InteractContext = {
      gs,
      p,
      px: p.x,
      py: p.y,
      socketId: socket.id,
      io,
      roomId,
      snd: (type: string) => bcastSound(io, roomId, socket, type),
      emitTip: (x: number, y: number, amount: number) => {
        io.to(roomId).emit("tipCollected", { x, y, amount });
      }
    };

    // Mesafe bazlı sıralama: en yakın istasyondan başlayarak dene
    const sortedHandlers = buildSortedHandlers(ctx.px, ctx.py, ctx.gs);
    for (const handler of sortedHandlers) {
      if (handler(ctx)) break;
    }
  });
}
