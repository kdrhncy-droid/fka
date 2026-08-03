import { InteractionHandler, isDish } from './utils.js';
import { 
  CLEAN_PLATE, DIRTY_PLATE, isTray, getTrayItems, createTray,
  TRASH_STATION, TRAY_STATION, MAX_TRAY_CAPACITY, PLATE_STACK_POS,
} from "../../shared/types.js";
import { getStationPos } from './utils.js';

const INTERACT_R = 110;

export const handleTrash: InteractionHandler = ({ gs, p, px, py, snd }) => {
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

export const handleTrayStation: InteractionHandler = ({ gs, p, px, py, snd }) => {
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

export const handleDirtyTrayBasket: InteractionHandler = ({ gs, p, px, py, snd }) => {
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

export const handlePlateStack: InteractionHandler = ({ gs, p, px, py, snd }) => {
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


