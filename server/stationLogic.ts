import { Server } from "socket.io";
import {
  GameState,
  RECIPE_DEFS, BURN_TICKS, BURNED_FOOD,
  CHOP_TICKS, CHOP_PREFIX,
  WASH_TICKS, DIRTY_PLATE, CLEAN_PLATE,
  FRYER_BURN_TICKS,
  CAKE_BURN_TICKS,
} from "../shared/types.js";
import { getCardMultipliers } from "./cardLogic.js";
import { getStationPos } from "./stationUtils.js";

export function updateCookStations(gs: GameState, io: Server, rid: string) {
  const cm = getCardMultipliers(gs);
  gs.cookStations.forEach(s => {
    if (s.input && s.timer > 0) {
      const mult = (typeof s.input === 'string' && s.input.startsWith(CHOP_PREFIX)) ? cm.choppedCookMult : cm.cookMult;
      s.timer -= mult <= 1 ? Math.ceil(1 / mult) : 1;
      if (s.timer <= 0) {
        const recipe = RECIPE_DEFS[s.input as keyof typeof RECIPE_DEFS];
        s.output = recipe ? recipe.output : s.input;
        s.input = null;
        const safeOvenLv = gs.upgrades.safeOven ?? 0;
        if (safeOvenLv >= 2) {
          s.burnTimer = Infinity;
        } else {
          s.burnTimer = Math.round(BURN_TICKS * cm.burnMult * (safeOvenLv >= 1 ? 2 : 1));
        }
        io.to(rid).emit('cookDone', { x: s.x, y: s.y });
      }
    } else if (s.output && s.burnTimer !== undefined && s.burnTimer > 0 && s.burnTimer !== Infinity) {
      s.burnTimer--;
      if (s.burnTimer <= 0) {
        s.isBurned = true;
        s.output = BURNED_FOOD;
      }
    }
  });
}

export function updateChoppingBoards(gs: GameState) {
  if (!gs.choppingBoards) return;
  const cm = getCardMultipliers(gs);
  gs.choppingBoards.forEach(board => {
    if (board.isChopping && board.choppingPlayerId) {
      const cutter = gs.players[board.choppingPlayerId];
      const { x: bDynX, y: bDynY } = getStationPos(gs, board);
      if (!cutter || Math.hypot(cutter.x - bDynX, cutter.y - bDynY) > 110) {
        board.isChopping = false;
        board.choppingPlayerId = null;
      }
    }
    const chopTicksNeeded = Math.round(CHOP_TICKS * cm.chopMult);
    if (board.isChopping && board.input && board.progress < chopTicksNeeded) {
      board.progress++;
      if (board.progress >= chopTicksNeeded) {
        board.input = CHOP_PREFIX + board.input;
        board.isChopping = false;
        board.choppingPlayerId = null;
      }
    }
  });
}

export function updateSinks(gs: GameState, io: Server, rid: string) {
  if (!gs.sinks) return;
  gs.sinks.forEach(sink => {
    if (sink.isWashing && sink.washingPlayerId) {
      const washer = gs.players[sink.washingPlayerId];
      const { x: sDynX, y: sDynY } = getStationPos(gs, sink);
      if (!washer || Math.hypot(washer.x - sDynX, washer.y - sDynY) > 110) {
        sink.isWashing = false;
        sink.washingPlayerId = null;
      }
    }
    if (sink.isWashing && sink.input === DIRTY_PLATE && sink.progress < WASH_TICKS) {
      sink.progress++;
      if (sink.progress >= WASH_TICKS) {
        sink.input = CLEAN_PLATE;
        sink.isWashing = false;
        sink.washingPlayerId = null;
        io.to(rid).emit("sound", "success");
      }
    }
  });
}

export function updateFryers(gs: GameState, io: Server, rid: string) {
  if (!gs.fryers) return;
  const speedBonus = gs.upgrades.fryerSpeed ?? 0;
  gs.fryers.forEach(f => {
    if (f.input && f.timer > 0) {
      f.timer -= 1 + speedBonus;
      if (f.timer <= 0) {
        f.output = '🍟';
        f.input = null;
        f.burnTimer = FRYER_BURN_TICKS;
        io.to(rid).emit('cookDone', { x: f.x, y: f.y });
      }
    } else if (f.output && f.burnTimer !== undefined && f.burnTimer > 0) {
      f.burnTimer--;
      if (f.burnTimer <= 0) { f.isBurned = true; f.output = '⬛'; }
    }
  });
}

export function updateCakeBakers(gs: GameState, io: Server, rid: string) {
  if (!gs.cakeBakers) return;
  gs.cakeBakers.forEach(c => {
    if (c.input && c.timer > 0) {
      c.timer--;
      if (c.timer <= 0) { c.output = '🍰'; c.input = null; c.burnTimer = CAKE_BURN_TICKS; io.to(rid).emit('cookDone', { x: c.x, y: c.y }); }
    } else if (c.output && c.burnTimer !== undefined && c.burnTimer > 0) {
      c.burnTimer--;
      if (c.burnTimer <= 0) { c.isBurned = true; c.output = '⬛'; }
    }
  });
}

