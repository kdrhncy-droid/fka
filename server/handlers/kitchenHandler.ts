import { InteractionHandler, isDish } from './utils.js';
import { 
  FRYER_TICKS, CAKE_TICKS, COFFEE_ITEM, CLEAN_PLATE, BURNED_FOOD, 
  CHOPPABLE, CHOP_PREFIX, isTray, getTrayItems, createTray, INGREDIENTS, RECIPE_DEFS, MAX_TRAY_CAPACITY
} from "../../shared/types.js";
import { getStationPos } from './utils.js';

const COOK_R = 145;
const INTERACT_R = 110;

export const handleCookStations: InteractionHandler = ({ gs, p, px, py, snd }) => {
  for (const station of gs.cookStations) {
    const { x: dynX, y: dynY } = getStationPos(gs, station);
    if (Math.hypot(px - dynX, py - dynY) < COOK_R) {
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
        return false; // Doğranmamış malzeme — fırına konamaz, zincir devam etsin
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

export const handleFryers: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.fryers) return false;
  for (const fryer of gs.fryers) {
    const { x: dynX, y: dynY } = getStationPos(gs, fryer);
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

export const handleCakeBakers: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.cakeBakers) return false;
  for (const baker of gs.cakeBakers) {
    const { x: dynX, y: dynY } = getStationPos(gs, baker);
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

export const handleCoffeeMachines: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.coffeeMachines) return false;
  for (const cm of gs.coffeeMachines) {
    const { x: dynX, y: dynY } = getStationPos(gs, cm);
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

export const handleIngredients: InteractionHandler = ({ gs, p, px, py, snd }) => {
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
