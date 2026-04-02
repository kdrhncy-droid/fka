import { InteractionHandler, earn, applyCombo } from './utils.js';
import { 
  SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R, SPECIAL_REQUEST_TIP_MULT, EAT_TICKS,
  isTray, getTrayItems, createTray, DIRTY_PLATE, MAX_TRAY_CAPACITY, GameState
} from "../../shared/types.js";
import { Server } from "socket.io";

const SERVE_R = 125;

/** Can azalt, 0'a düşünce game over tetikle. true dönerse game over oldu. */
function loseLife(gs: GameState, io: Server, roomId: string, amount = 1, x?: number, y?: number): boolean {
  gs.lives = Math.max(0, gs.lives - amount);
  if (x !== undefined && y !== undefined) {
    io.to(roomId).emit('loseHeart', { x, y, amount });
  }
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
    if (c.isSeated && !c.isEating && Math.hypot(px - c.seatX, py - c.seatY) < SERVE_R) {
      const specialMult = c.specialRequest ? (SPECIAL_REQUEST_TIP_MULT[c.specialRequest] ?? 1.0) : 1.0;

      // Acı istek kontrolü
      const customerWantsSpicy = c.specialRequest === 'spicy';
      const playerHasSpicy = p.holding?.startsWith('SPICY_');
      const baseFood = playerHasSpicy ? p.holding.replace('SPICY_', '') : p.holding;

      // Doğru yemek mi?
      const correctFood = !isTray(p.holding) && c.wants === baseFood;

      // Sarhoş müşteri: yanlış yemek de kabul eder ama %50 ihtimalle
      const isDrunk = c.personality === 'drunk';
      const drunkAccept = isDrunk && !isTray(p.holding) && Math.random() < 0.5;

      if (correctFood || drunkAccept) {
        // Acı istek uyumsuzluğu kontrolü (sarhoş için atla)
        if (!isDrunk && customerWantsSpicy && !playerHasSpicy) {
          loseLife(gs, io, roomId, 1, c.seatX, c.seatY);
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          c.tipAmount = 0;
          snd("fail");
          return true;
        } else if (!isDrunk && !customerWantsSpicy && playerHasSpicy) {
          loseLife(gs, io, roomId, 1, c.seatX, c.seatY);
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          c.tipAmount = 0;
          snd("fail");
          return true;
        } else {
          // Doğru servis
          let tip = earn(gs.upgrades.earnings, c.maxPatience, c.patience, specialMult);

          // VIP: 3x bahşiş
          if (c.personality === 'vip') tip = Math.round(tip * 3);
          // Sarhoş: 0-3x rastgele bahşiş
          if (isDrunk) tip = Math.round(tip * Math.random() * 3);
          // Inspector: +50 bonus puan
          if (c.personality === 'inspector') { gs.score += 50; io.to(roomId).emit('inspectorBonus', { x: c.seatX, y: c.seatY }); }

          c.tipAmount = tip;
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          if (c.specialRequest) io.to(roomId).emit('specialServed', { x: c.seatX, y: c.seatY, request: c.specialRequest });
          if (p.serviceEffect) io.to(roomId).emit('serviceEffect', { x: c.seatX, y: c.seatY, effect: p.serviceEffect });
          applyCombo(gs, io, roomId, c.seatX, c.seatY, tip);
          snd("success");
          return true;
        }
      } else if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemIsSpicy = item.startsWith('SPICY_');
          const itemBase = itemIsSpicy ? item.replace('SPICY_', '') : item;

          if (c.wants === itemBase) {
            // Acı istek uyumsuzluğu kontrolü
            if (customerWantsSpicy && !itemIsSpicy) {
              loseLife(gs, io, roomId, 1, c.seatX, c.seatY);
              items.splice(i, 1); p.holding = createTray(items);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
              c.tipAmount = 0;
              snd("fail");
              return true;
            } else if (!customerWantsSpicy && itemIsSpicy) {
              loseLife(gs, io, roomId, 1, c.seatX, c.seatY);
              items.splice(i, 1); p.holding = createTray(items);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
              c.tipAmount = 0;
              snd("fail");
              return true;
            } else {
              // Doğru servis
              items.splice(i, 1); p.holding = createTray(items);
              c.tipAmount = earn(gs.upgrades.earnings, c.maxPatience, c.patience, specialMult);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
              if (c.specialRequest) io.to(roomId).emit('specialServed', { x: c.seatX, y: c.seatY, request: c.specialRequest });
              if (p.serviceEffect) io.to(roomId).emit('serviceEffect', { x: c.seatX, y: c.seatY, effect: p.serviceEffect });
              applyCombo(gs, io, roomId, c.seatX, c.seatY, c.tipAmount ?? 0);
              snd("success");
              return true;
            }
          }
        }
      } else {
        // Yanlış yemek — VIP ve inspector için 2 can kaybı
        if (c.personality === 'vip' || c.personality === 'inspector') {
          loseLife(gs, io, roomId, 2, c.seatX, c.seatY);
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          c.tipAmount = 0;
          io.to(roomId).emit('wrongServe', { x: c.seatX, y: c.seatY, personality: c.personality });
          snd("fail");
          return true;
        }
      }
    }
  }
  return false;
};
