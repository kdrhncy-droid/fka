import { InteractionHandler, earn, applyCombo } from './utils.js';
import { 
  SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R, EAT_TICKS,
  isTray, getTrayItems, createTray, DIRTY_PLATE, MAX_TRAY_CAPACITY, GameState, Customer, Player
} from "../../shared/types.js";
import { Server } from "socket.io";
import { SERVE_R } from '../../shared/constants.js';

function loseLife(gs: GameState, io: Server, roomId: string, amount = 1, x?: number, y?: number): boolean {
  gs.lives = Math.max(0, gs.lives - amount);
  gs.dailyObjectives?.forEach(obj => { if (obj.type === 'no_life_loss') obj.failed = true; });
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


export const handleServiceWindow: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.serviceWindow?.length) return false;

  // Menzildeki tüm slotları topla, en yakınını seç
  let bestSlot: (typeof gs.serviceWindow)[0] | null = null;
  let bestDef: typeof SERVICE_WINDOW_SLOTS[number] | null = null;
  let bestDist = Infinity;

  for (const slot of gs.serviceWindow) {
    const def = SERVICE_WINDOW_SLOTS.find(s => s.id === slot.id);
    if (!def) continue;
    const dist = Math.hypot(px - def.x, py - def.y);
    if (dist < SERVICE_WINDOW_R && dist < bestDist) {
      bestDist = dist;
      bestSlot = slot;
      bestDef = def;
    }
  }

  if (!bestSlot || !bestDef) return false;

  if (!p.holding && bestSlot.item) {
    p.holding = bestSlot.item; bestSlot.item = null;
    snd('pickup');
  } else if (p.holding && !bestSlot.item) {
    bestSlot.item = p.holding; p.holding = null;
    snd('success');
  } else {
    // El dolu + slot dolu, ya da el boş + slot boş → sessiz fail yerine sesli
    snd('fail');
  }
  return true;
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

    const isDrunk = c.personality === 'drunk';

    if (isTray(p.holding)) {
      // Tepsi servisi
      const items = getTrayItems(p.holding);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (c.wants !== item) continue;

        items.splice(i, 1);
        p.holding = createTray(items);

        const tip = earn(gs.upgrades.earnings, c.maxPatience, c.patience);
        startEating(c, p, tip);
        if (p.serviceEffect) io.to(roomId).emit('serviceEffect', { x: c.seatX, y: c.seatY, effect: p.serviceEffect });
        applyCombo(gs, io, roomId, c.seatX, c.seatY, tip);
        gs.dailyObjectives?.forEach(obj => {
          if (obj.completed || obj.failed) return;
          if (obj.type === 'serve_n') { obj.progress++; if (obj.progress >= obj.target) obj.completed = true; }
          if (obj.type === 'serve_vip' && c.personality === 'vip') { obj.progress++; if (obj.progress >= obj.target) obj.completed = true; }
        });
        snd("success");
        return true;
      }
    } else {
      // Tek yemek servisi
      const correctFood = c.wants === p.holding;
      const drunkAccept = isDrunk && Math.random() < 0.5;

      if (correctFood || drunkAccept) {
        // Doğru servis
        let tip = earn(gs.upgrades.earnings, c.maxPatience, c.patience);
        if (c.personality === 'lucky') tip = Math.round(tip * 4);
        if (c.personality === 'vip') tip = Math.round(tip * 3);
        if (isDrunk) tip = Math.max(1, Math.round(tip * (0.5 + Math.random() * 2.5)));
        if (c.personality === 'inspector') { gs.score += 50; io.to(roomId).emit('inspectorBonus', { x: c.seatX, y: c.seatY }); }
        startEating(c, p, tip, null);
        if (p.serviceEffect) io.to(roomId).emit('serviceEffect', { x: c.seatX, y: c.seatY, effect: p.serviceEffect });
        applyCombo(gs, io, roomId, c.seatX, c.seatY, tip);
        // Şans müşterisi jackpot efekti
        if (c.personality === 'lucky') {
          io.to(roomId).emit('jackpot', { x: c.seatX, y: c.seatY, amount: tip });
        }
        // Hedef takibi
        gs.dailyObjectives?.forEach(obj => {
          if (obj.completed || obj.failed) return;
          if (obj.type === 'serve_n') { obj.progress++; if (obj.progress >= obj.target) obj.completed = true; }
          if (obj.type === 'serve_vip' && c.personality === 'vip') { obj.progress++; if (obj.progress >= obj.target) obj.completed = true; }
        });
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
