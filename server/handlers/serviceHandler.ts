import { InteractionHandler, earn, applyCombo } from './utils.js';
import { 
  SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R, SPECIAL_REQUEST_TIP_MULT, EAT_TICKS,
  isTray, getTrayItems, createTray, DIRTY_PLATE, MAX_TRAY_CAPACITY, GameState, Customer, Player
} from "../../shared/types.js";
import { Server } from "socket.io";

const SERVE_R = 125;

function loseLife(gs: GameState, io: Server, roomId: string, amount = 1, x?: number, y?: number): boolean {
  gs.lives = Math.max(0, gs.lives - amount);
  if (x !== undefined && y !== undefined) io.to(roomId).emit('loseHeart', { x, y, amount });
  if (gs.lives <= 0) {
    gs.isGameOver = true;
    gs.dayPhase = 'night';
    gs.customers = []; gs.waitList = []; gs.dirtyTables = [];
    io.to(roomId).emit("state", gs);
    io.to(roomId).emit("sound", "fail");
    return true;
  }
  return false;
}

/** Müşteriyi yeme moduna al, elindekini bırak */
function startEating(c: Customer, p: Player, tip: number, holdingOverride?: string | null) {
  c.isEating = true;
  c.eatTimer = EAT_TICKS;
  c.wants = null;
  c.tipAmount = tip;
  if (holdingOverride !== undefined) p.holding = holdingOverride;
}

/** Acı istek uyumsuzluğu kontrolü. Uyumsuzsa true döner. */
function spicyMismatch(customerWantsSpicy: boolean, itemIsSpicy: boolean): boolean {
  return (customerWantsSpicy && !itemIsSpicy) || (!customerWantsSpicy && itemIsSpicy);
}

export const handleServiceWindow: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.serviceWindow?.length) return false;
  for (const slot of gs.serviceWindow) {
    const def = SERVICE_WINDOW_SLOTS.find(s => s.id === slot.id);
    if (!def) continue;
    if (Math.hypot(px - def.x, py - def.y) < SERVICE_WINDOW_R) {
      if (!p.holding && slot.item) {
        p.holding = slot.item; slot.item = null;
        snd('pickup');
      } else if (p.holding && !slot.item) {
        slot.item = p.holding; p.holding = null;
        snd('success');
      }
      return true;
    }
  }
  return false;
};

export const handleDirtyTables: InteractionHandler = ({ gs, p, px, py, snd, emitTip }) => {
  const dirtyIdx = gs.dirtyTables.findIndex(t => Math.hypot(px - t.seatX, py - t.seatY) < SERVE_R);
  if (dirtyIdx !== -1) {
    const dt = gs.dirtyTables[dirtyIdx];
    if (!p.holding) {
      p.holding = DIRTY_PLATE;
      if (dt.tip > 0) { gs.score += dt.tip; emitTip(dt.seatX, dt.seatY, dt.tip); }
      gs.dirtyTables.splice(dirtyIdx, 1); snd("pickup");
    } else if (isTray(p.holding)) {
      const items = getTrayItems(p.holding);
      if (items.length < MAX_TRAY_CAPACITY) {
        items.push(DIRTY_PLATE); p.holding = createTray(items);
        if (dt.tip > 0) { gs.score += dt.tip; emitTip(dt.seatX, dt.seatY, dt.tip); }
        gs.dirtyTables.splice(dirtyIdx, 1); snd("pickup");
      }
    }
    return true;
  }
  return false;
};

// (Types'ten geliyor)

export const handleCustomers: InteractionHandler = ({ gs, p, px, py, snd, io, roomId }) => {
  if (!p.holding) return false;
  for (let ci = 0; ci < gs.customers.length; ci++) {
    const c = gs.customers[ci];
    if (!c.isSeated || c.isEating || Math.hypot(px - c.seatX, py - c.seatY) >= SERVE_R) continue;

    const specialMult = c.specialRequest ? (SPECIAL_REQUEST_TIP_MULT[c.specialRequest] ?? 1.0) : 1.0;
    const customerWantsSpicy = c.specialRequest === 'spicy';
    const isDrunk = c.personality === 'drunk';

    if (isTray(p.holding)) {
      // Tepsi servisi
      const items = getTrayItems(p.holding);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemIsSpicy = item.startsWith('SPICY_');
        const itemBase = itemIsSpicy ? item.replace('SPICY_', '') : item;
        if (c.wants !== itemBase) continue;

        items.splice(i, 1);
        p.holding = createTray(items);

        if (!isDrunk && spicyMismatch(customerWantsSpicy, itemIsSpicy)) {
          loseLife(gs, io, roomId, 1, c.seatX, c.seatY);
          startEating(c, p, 0);
          snd("fail");
        } else {
          const tip = earn(gs.upgrades.earnings, c.maxPatience, c.patience, specialMult);
          startEating(c, p, tip);
          if (c.specialRequest) io.to(roomId).emit('specialServed', { x: c.seatX, y: c.seatY, request: c.specialRequest });
          if (p.serviceEffect) io.to(roomId).emit('serviceEffect', { x: c.seatX, y: c.seatY, effect: p.serviceEffect });
          applyCombo(gs, io, roomId, c.seatX, c.seatY, tip);
          snd("success");
        }
        return true;
      }
    } else {
      // Tek yemek servisi
      const playerIsSpicy = p.holding?.startsWith('SPICY_');
      const baseFood = playerIsSpicy ? p.holding!.replace('SPICY_', '') : p.holding;
      const correctFood = c.wants === baseFood;
      const drunkAccept = isDrunk && Math.random() < 0.5;

      if (correctFood || drunkAccept) {
        if (!isDrunk && spicyMismatch(customerWantsSpicy, !!playerIsSpicy)) {
          loseLife(gs, io, roomId, 1, c.seatX, c.seatY);
          startEating(c, p, 0, null);
          snd("fail");
          return true;
        }
        // Doğru servis
        let tip = earn(gs.upgrades.earnings, c.maxPatience, c.patience, specialMult);
        if (c.personality === 'vip') tip = Math.round(tip * 3);
        if (isDrunk) tip = Math.round(tip * Math.random() * 3);
        if (c.personality === 'inspector') { gs.score += 50; io.to(roomId).emit('inspectorBonus', { x: c.seatX, y: c.seatY }); }
        startEating(c, p, tip, null);
        if (c.specialRequest) io.to(roomId).emit('specialServed', { x: c.seatX, y: c.seatY, request: c.specialRequest });
        if (p.serviceEffect) io.to(roomId).emit('serviceEffect', { x: c.seatX, y: c.seatY, effect: p.serviceEffect });
        applyCombo(gs, io, roomId, c.seatX, c.seatY, tip);
        snd("success");
        return true;
      } else {
        // Yanlış yemek — VIP ve inspector için 2 can kaybı
        if (c.personality === 'vip' || c.personality === 'inspector') {
          loseLife(gs, io, roomId, 2, c.seatX, c.seatY);
          startEating(c, p, 0, null);
          io.to(roomId).emit('wrongServe', { x: c.seatX, y: c.seatY, personality: c.personality });
          snd("fail");
          return true;
        }
      }
    }
  }
  return false;
};
