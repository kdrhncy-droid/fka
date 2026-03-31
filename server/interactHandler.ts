import { Socket, Server } from "socket.io";
import {
  GameState, Item, Player,
  DISH_ITEMS, INGREDIENTS, RECIPE_DEFS,
  PLATE_STACK_POS,
  CLEAN_PLATE, DIRTY_PLATE, BURNED_FOOD, EAT_TICKS,
  MAX_TRAY_CAPACITY, isTray, getTrayItems, createTray,
  TRASH_STATION, TRAY_STATION,
  CHOPPABLE, CHOP_PREFIX, isChopped,
  SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R,
  FRYER_TICKS, DRINK_ITEM, CAKE_TICKS, COFFEE_ITEM,
  COMBO_TIMEOUT_TICKS, getComboMultiplier, getComboLabel,
  SPECIAL_REQUEST_TIP_MULT,
  SPICE_RACK_POS, SPICE_RACK_R, SPICY_CONVERSIONS, SPICEABLE_DISHES,
} from "../shared/types.js";

const INTERACT_R = 110;
const SERVE_R = 125;

function earn(lv: number, maxPatience: number, currentPatience: number, specialMult = 1.0) {
  const base = 10 + 5 * lv;
  const ratio = Math.max(0, currentPatience / maxPatience);
  let mult = 0.5;
  if (ratio > 0.8) mult = 2.0;
  else if (ratio > 0.5) mult = 1.5;
  else if (ratio > 0.2) mult = 1.0;
  else mult = 0.5;
  return Math.floor(base * mult * specialMult);
}
function isDish(item: Item): item is string { return !!item && DISH_ITEMS.includes(item as any); }

// Başarılı etkileşim seslerini odaya broadcast et, fail sadece o oyuncuya
function bcastSound(io: Server, roomId: string, socket: Socket, type: string) {
  if (type === 'fail') {
    socket.emit("sound", type);
  } else {
    io.to(roomId).emit("sound", type);
  }
}

// ─── ETKİLEŞİM BAĞLAMI (CONTEXT) ─────────────────────────────────────────────
export interface InteractContext {
  gs: GameState;
  p: Player;
  px: number;
  py: number;
  socketId: string;
  io: Server;
  roomId: string;
  snd: (type: string) => void;
  emitTip: (x: number, y: number, amount: number) => void;
}

// ─── Combo uygula ─────────────────────────────────────────────────────────────
function applyCombo(gs: GameState, io: Server, roomId: string, x: number, y: number, baseTip: number) {
  gs.comboCount = (gs.comboCount ?? 0) + 1;
  gs.comboTimer = COMBO_TIMEOUT_TICKS;

  const mult = getComboMultiplier(gs.comboCount);
  const label = getComboLabel(gs.comboCount);

  if (mult > 1.0) {
    const bonus = Math.floor(baseTip * (mult - 1.0));
    gs.score += bonus;
    io.to(roomId).emit('comboServe', { x, y, count: gs.comboCount, bonus, label });
  }
}

type InteractionHandler = (ctx: InteractContext) => boolean;

// ─── İSTASYON İŞLEYİCİLERİ (HANDLERS) ────────────────────────────────────────

const handleServiceWindow: InteractionHandler = ({ gs, p, px, py, snd }) => {
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

const handleSinks: InteractionHandler = ({ gs, p, px, py, socketId, snd }) => {
  if (!gs.sinks) return false;
  for (const sink of gs.sinks) {
    const dynX = gs.stationLayout?.[sink.id]?.x ?? sink.x;
    const dynY = gs.stationLayout?.[sink.id]?.y ?? sink.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding) {
        if (sink.input === CLEAN_PLATE) {
          p.holding = CLEAN_PLATE;
          sink.input = null; sink.progress = 0; sink.isWashing = false; sink.washingPlayerId = null;
          snd("pickup");
        } else if (sink.input === DIRTY_PLATE && !sink.isWashing) {
          sink.isWashing = true; sink.washingPlayerId = socketId;
        }
      } else if (p.holding === DIRTY_PLATE && !sink.input) {
        sink.input = DIRTY_PLATE; sink.progress = 0; sink.isWashing = false; sink.washingPlayerId = null;
        p.holding = null;
        snd("success");
      } else {
        snd("fail");
      }
      return true;
    }
  }
  return false;
};

const handleTrash: InteractionHandler = ({ gs, p, px, py, snd }) => {
  const trashPos = gs.stationLayout['trash'] ?? TRASH_STATION;
  if (Math.hypot(px - trashPos.x, py - trashPos.y) < INTERACT_R) {
    if (p.holding) {
      if (p.holding === CLEAN_PLATE || p.holding === DIRTY_PLATE) {
        snd("fail"); return true;
      }
      if (isTray(p.holding)) {
        const items = getTrayItems(p.holding);
        if (items.includes(CLEAN_PLATE) || items.includes(DIRTY_PLATE)) {
          snd("fail"); return true;
        }
      }
      p.holding = null;
      snd("trash");
    }
    return true;
  }
  return false;
};

const handleTrayStation: InteractionHandler = ({ gs, p, px, py, snd }) => {
  const trayPos = gs.stationLayout['tray'] ?? TRAY_STATION;
  if (Math.hypot(px - trayPos.x, py - trayPos.y) < INTERACT_R) {
    if (!p.holding) {
      p.holding = createTray([]); snd("pickup");
    } else if (isTray(p.holding)) {
      p.holding = null; snd("success");
    }
    return true;
  }
  return false;
};

const handleDirtyTrayBasket: InteractionHandler = ({ gs, p, px, py, snd }) => {
  const dirtyTrayPos = gs.stationLayout['dirty_tray'] ?? { x: 1050, y: 90 };
  if (Math.hypot(px - dirtyTrayPos.x, py - dirtyTrayPos.y) < INTERACT_R) {
    if (p.holding === DIRTY_PLATE) {
      gs.dirtyTrayCount = (gs.dirtyTrayCount || 0) + 1;
      p.holding = null; snd("success");
    } else if (isTray(p.holding)) {
      const items = getTrayItems(p.holding);
      const dirtyCountInTray = items.filter(i => i === DIRTY_PLATE).length;
      if (dirtyCountInTray > 0) {
        const cleaned = items.filter(i => i !== DIRTY_PLATE);
        p.holding = cleaned.length > 0 ? createTray(cleaned) : null;
        gs.dirtyTrayCount = (gs.dirtyTrayCount || 0) + dirtyCountInTray;
        snd("success");
      } else if (items.length < MAX_TRAY_CAPACITY && (gs.dirtyTrayCount || 0) > 0) {
        items.push(DIRTY_PLATE);
        p.holding = createTray(items);
        gs.dirtyTrayCount--; snd("pickup");
      }
    } else if (!p.holding && (gs.dirtyTrayCount || 0) > 0) {
      p.holding = DIRTY_PLATE;
      gs.dirtyTrayCount = Math.max(0, gs.dirtyTrayCount - 1);
      snd("pickup");
    }
    return true;
  }
  return false;
};

const handleDirtyTables: InteractionHandler = ({ gs, p, px, py, snd, emitTip }) => {
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

const handlePlateStack: InteractionHandler = ({ gs, p, px, py, snd }) => {
  const plateStackPos = gs.stationLayout?.['plate_stack'] ?? PLATE_STACK_POS;
  if (Math.hypot(px - plateStackPos.x, py - plateStackPos.y) < PLATE_STACK_POS.radius) {
    const ps = gs.plateStack;
    if (!p.holding && ps.count > 0) {
      p.holding = CLEAN_PLATE; ps.count--; snd("pickup");
    } else if (p.holding === DIRTY_PLATE) {
      snd("fail");
    } else if (p.holding === CLEAN_PLATE && ps.count < ps.maxCount) {
      p.holding = null; ps.count++; snd("success");
    } else if (isTray(p.holding)) {
      const items = getTrayItems(p.holding);
      const cpIdx = items.indexOf(CLEAN_PLATE);
      if (cpIdx !== -1 && ps.count < ps.maxCount) {
        items.splice(cpIdx, 1);
        p.holding = items.length > 0 ? createTray(items) : null;
        ps.count++; snd("success");
      } else if (ps.count > 0 && items.length < MAX_TRAY_CAPACITY) {
        items.push(CLEAN_PLATE); p.holding = createTray(items);
        ps.count--; snd("pickup");
      }
    }
    return true;
  }
  return false;
};

const handleChoppingBoards: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.choppingBoards) return false;
  for (const board of gs.choppingBoards) {
    const dynX = gs.stationLayout?.[board.id]?.x ?? board.x;
    const dynY = gs.stationLayout?.[board.id]?.y ?? board.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding) {
        if (board.input && !isChopped(board.input)) {
          p.holding = board.input; board.input = null; board.progress = 0; board.isChopping = false; board.choppingPlayerId = null; snd("pickup");
        } else if (board.input && isChopped(board.input)) {
          p.holding = board.input; board.input = null; board.progress = 0; board.isChopping = false; board.choppingPlayerId = null; snd("success");
        }
      } else if (p.holding === CLEAN_PLATE && board.input && isChopped(board.input)) {
        snd("fail");
      } else if (CHOPPABLE.includes(p.holding as any) && !board.input) {
        board.input = p.holding; board.progress = 0; board.isChopping = false; board.choppingPlayerId = null; p.holding = null; snd("success");
      }
      return true;
    }
  }
  return false;
};

const handleCookStations: InteractionHandler = ({ gs, p, px, py, snd }) => {
  for (const station of gs.cookStations) {
    const dynX = gs.stationLayout?.[station.id]?.x ?? station.x;
    const dynY = gs.stationLayout?.[station.id]?.y ?? station.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      const holding = p.holding;
      const isRawChoppable = typeof holding === 'string' && CHOPPABLE.includes(holding as any);
      const isChoppedItem = typeof holding === 'string' && holding.startsWith(CHOP_PREFIX);
      const isNonChoppableIngredient = INGREDIENTS.some(ing => ing.key === holding && !CHOPPABLE.includes(ing.key as any));

      if ((isChoppedItem || isNonChoppableIngredient) && !station.input && !station.output) {
        const recipe = RECIPE_DEFS[holding as keyof typeof RECIPE_DEFS];
        if (recipe) {
          station.input = holding; station.timer = recipe.time;
          p.holding = null; station.isBurned = false; station.burnTimer = 0;
          snd("pickup");
        }
      } else if (isRawChoppable && !station.input && !station.output) {
        snd("fail");
      } else if (p.holding === CLEAN_PLATE && station.output && !station.isBurned) {
        p.holding = station.output;
        station.output = null; station.burnTimer = 0; snd("success");
      } else if (isTray(p.holding) && station.output && !station.isBurned) {
        const items = getTrayItems(p.holding);
        const cpIdx = items.indexOf(CLEAN_PLATE);
        if (cpIdx !== -1) {
          items[cpIdx] = station.output; p.holding = createTray(items);
          station.output = null; station.burnTimer = 0; snd("success");
        }
      } else if (!p.holding && station.isBurned) {
        p.holding = BURNED_FOOD;
        station.output = null; station.isBurned = false; station.burnTimer = 0; snd("trash");
      }
      return true;
    }
  }
  return false;
};

const handleCustomers: InteractionHandler = ({ gs, p, px, py, snd, io, roomId }) => {
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
      
      if (correctFood) {
        // Acı istek uyumsuzluğu kontrolü
        if (customerWantsSpicy && !playerHasSpicy) {
          // Müşteri acı istiyor ama normal yemek verdin - can kaybı
          gs.lives = Math.max(0, gs.lives - 1);
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          c.tipAmount = 0; // Bahşiş yok
          snd("fail");
          return true;
        } else if (!customerWantsSpicy && playerHasSpicy) {
          // Müşteri normal istiyor ama acı verdin - can kaybı
          gs.lives = Math.max(0, gs.lives - 1);
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          c.tipAmount = 0; // Bahşiş yok
          snd("fail");
          return true;
        } else {
          // Doğru servis - normal akış
          c.tipAmount = earn(gs.upgrades.earnings, c.maxPatience, c.patience, specialMult);
          c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null; p.holding = null;
          if (c.specialRequest) io.to(roomId).emit('specialServed', { x: c.seatX, y: c.seatY, request: c.specialRequest });
          applyCombo(gs, io, roomId, c.seatX, c.seatY, c.tipAmount ?? 0);
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
              // Can kaybı
              gs.lives = Math.max(0, gs.lives - 1);
              items.splice(i, 1); p.holding = createTray(items);
              c.isEating = true; c.eatTimer = EAT_TICKS; c.wants = null;
              c.tipAmount = 0;
              snd("fail");
              return true;
            } else if (!customerWantsSpicy && itemIsSpicy) {
              // Can kaybı
              gs.lives = Math.max(0, gs.lives - 1);
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
              applyCombo(gs, io, roomId, c.seatX, c.seatY, c.tipAmount ?? 0);
              snd("success");
              return true;
            }
          }
        }
      }
    }
  }
  return false;
};

const handleIngredients: InteractionHandler = ({ gs, p, px, py, snd }) => {
  for (const s of INGREDIENTS) {
    const dynPos = gs.stationLayout[`ingredient_${s.key}`];
    const posX = dynPos?.x ?? s.pos.x;
    const posY = dynPos?.y ?? s.pos.y;
    if (Math.hypot(px - posX, py - posY) < INTERACT_R) {
      const hasPlate = p.holding === CLEAN_PLATE || (isTray(p.holding) && getTrayItems(p.holding).includes(CLEAN_PLATE));
      if (hasPlate || isDish(p.holding)) {
        snd("fail"); return true;
      }
      // Fırın tarifi varsa unlock kontrolü
      const recipe = RECIPE_DEFS[s.key as keyof typeof RECIPE_DEFS];
      if (recipe && !gs.unlockedDishes.includes(recipe.output)) {
        snd("fail"); return true;
      }
      // 🥔 patates — 🍟 unlock edilmemişse alma
      if (s.key === '🥔' && !gs.unlockedDishes.includes('🍟')) {
        snd("fail"); return true;
      }
      // 🧁 tatlı hamuru — 🍰 unlock edilmemişse alma
      if (s.key === '🧁' && !gs.unlockedDishes.includes('🍰')) {
        snd("fail"); return true;
      }
      if (!p.holding) {
        p.holding = s.key; snd("pickup"); return true;
      }
    }
  }
  return false;
};

const handleFryers: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.fryers) return false;
  for (const fryer of gs.fryers) {
    const dynX = gs.stationLayout?.[fryer.id]?.x ?? fryer.x;
    const dynY = gs.stationLayout?.[fryer.id]?.y ?? fryer.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding) {
        if (fryer.output && !fryer.isBurned) {
          // Tabak gerekli
          snd('fail');
        } else if (fryer.isBurned) {
          p.holding = '⬛'; fryer.output = null; fryer.isBurned = false; fryer.burnTimer = 0; snd('trash');
        }
      } else if (p.holding === '🥔' && !fryer.input && !fryer.output) {
        fryer.input = '🥔'; fryer.timer = FRYER_TICKS; fryer.isBurned = false; fryer.burnTimer = 0;
        p.holding = null; snd('pickup');
      } else if (p.holding === CLEAN_PLATE && fryer.output && !fryer.isBurned) {
        p.holding = fryer.output; fryer.output = null; fryer.burnTimer = 0; snd('success');
      } else if (isTray(p.holding) && fryer.output && !fryer.isBurned) {
        const items = getTrayItems(p.holding);
        const cpIdx = items.indexOf(CLEAN_PLATE);
        if (cpIdx !== -1) {
          items[cpIdx] = fryer.output; p.holding = createTray(items);
          fryer.output = null; fryer.burnTimer = 0; snd('success');
        }
      }
      return true;
    }
  }
  return false;
};

const handleFridges: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.fridges) return false;
  for (const fridge of gs.fridges) {
    const dynX = gs.stationLayout?.[fridge.id]?.x ?? fridge.x;
    const dynY = gs.stationLayout?.[fridge.id]?.y ?? fridge.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding && fridge.drinks > 0) {
        p.holding = DRINK_ITEM; fridge.drinks--; snd('pickup');
      } else if (isTray(p.holding) && fridge.drinks > 0) {
        const items = getTrayItems(p.holding);
        if (items.length < MAX_TRAY_CAPACITY) {
          items.push(DRINK_ITEM); p.holding = createTray(items);
          fridge.drinks--; snd('pickup');
        }
      } else { snd('fail'); }
      return true;
    }
  }
  return false;
};

const handleCakeBakers: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.cakeBakers) return false;
  for (const baker of gs.cakeBakers) {
    const dynX = gs.stationLayout?.[baker.id]?.x ?? baker.x;
    const dynY = gs.stationLayout?.[baker.id]?.y ?? baker.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding) {
        if (baker.output && !baker.isBurned) { snd('fail'); }
        else if (baker.isBurned) { p.holding = '⬛'; baker.output = null; baker.isBurned = false; baker.burnTimer = 0; snd('trash'); }
      } else if (p.holding === '🧁' && !baker.input && !baker.output) {
        baker.input = '🧁'; baker.timer = CAKE_TICKS; baker.isBurned = false; baker.burnTimer = 0;
        p.holding = null; snd('pickup');
      } else if (p.holding === CLEAN_PLATE && baker.output && !baker.isBurned) {
        p.holding = baker.output; baker.output = null; baker.burnTimer = 0; snd('success');
      } else if (isTray(p.holding) && baker.output && !baker.isBurned) {
        const items = getTrayItems(p.holding);
        const cpIdx = items.indexOf(CLEAN_PLATE);
        if (cpIdx !== -1) {
          items[cpIdx] = baker.output; p.holding = createTray(items);
          baker.output = null; baker.burnTimer = 0; snd('success');
        }
      }
      return true;
    }
  }
  return false;
};

const handleCoffeeMachines: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.coffeeMachines) return false;
  for (const cm of gs.coffeeMachines) {
    const dynX = gs.stationLayout?.[cm.id]?.x ?? cm.x;
    const dynY = gs.stationLayout?.[cm.id]?.y ?? cm.y;
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding && cm.cups > 0) {
        p.holding = COFFEE_ITEM; cm.cups--; snd('pickup');
      } else if (isTray(p.holding) && cm.cups > 0) {
        const items = getTrayItems(p.holding);
        if (items.length < MAX_TRAY_CAPACITY) {
          items.push(COFFEE_ITEM); p.holding = createTray(items);
          cm.cups--; snd('pickup');
        }
      } else { snd('fail'); }
      return true;
    }
  }
  return false;
};

// ─── BAHARAT RAFI ────────────────────────────────────────────────────────────
const handleSpiceRack: InteractionHandler = (ctx) => {
  const { gs, p, px, py, snd } = ctx;
  const dynPos = gs.stationLayout?.['spice_rack'];
  const x = dynPos?.x ?? SPICE_RACK_POS.x;
  const y = dynPos?.y ?? SPICE_RACK_POS.y;
  
  if (Math.hypot(px - x, py - y) > SPICE_RACK_R) return false;

  // Elinde yemek var mı?
  if (!p.holding || !isDish(p.holding)) {
    snd('fail');
    return true;
  }

  // Bu yemek acı yapılabilir mi?
  if (!SPICEABLE_DISHES.includes(p.holding as any)) {
    snd('fail');
    return true;
  }

  // Zaten acı mı?
  if (p.holding.startsWith('SPICY_')) {
    snd('fail');
    return true;
  }

  // Acı versiyona dönüştür
  const spicyVersion = SPICY_CONVERSIONS[p.holding];
  if (spicyVersion) {
    p.holding = spicyVersion;
    snd('pickup');
    return true;
  }

  snd('fail');
  return false;
};

const INTERACTION_CHAIN: InteractionHandler[] = [
  handleServiceWindow,
  handleSinks,
  handleTrash,
  handleTrayStation,
  handleDirtyTrayBasket,
  handleDirtyTables,
  handlePlateStack,
  handleChoppingBoards,
  handleSpiceRack,
  handleFryers,
  handleFridges,
  handleCakeBakers,
  handleCoffeeMachines,
  handleCookStations,
  handleCustomers,
  handleIngredients
];

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

    // Zincirdeki işleyicileri sırayla dene. Biri başarılı olursa döngüyü kır.
    for (const handler of INTERACTION_CHAIN) {
      if (handler(ctx)) {
        break;
      }
    }
  });
}

