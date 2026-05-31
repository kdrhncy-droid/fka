import { Server } from "socket.io";
import {
  GameState,
  DAY_TICKS, NIGHT_TICKS,
  CLOSING_THRESHOLD,
  CARD_DAYS,
} from "../shared/types.js";
import { getCardMultipliers, generateMenuChoices, generateCardChoices } from "./cardLogic.js";
import { pickDailyObjectives } from "../shared/objectives.js";
import { MENU_UNLOCK_DAYS } from "../shared/gameData.js";
import { tryQueueSeat, spawnTick } from "./spawnLogic.js";
import { customerTick } from "./customerLogic.js";
import {
  updateCookStations,
  updateChoppingBoards,
  updateSinks,
  updateFryers,
  updateCakeBakers,
  updateCoffeeMachinesAndFridges,
} from "./stationLogic.js";
import { moveStation } from "./stationUtils.js";

export { generateMenuChoices, generateCardChoices, getCardMultipliers, tryQueueSeat };

const SPAWN_GRACE_TICKS = 240;

/** Gece → Hazırlık geçişi. Başarılıysa true döner. */
export function transitionToNextDay(gs: GameState): boolean {
  if (gs.dayPhase !== 'night' || gs.menuChoices || gs.pendingCardChoices) return false;
  gs.day++;
  gs.dayPhase = 'prep';
  gs.dayTimer = DAY_TICKS;
  if (gs.revengeQueue.length > 0) gs.plateStack.count = Math.max(1, gs.plateStack.count - 1);
  return true;
}

/** Hazırlık → Gündüz geçişi. */
export function startDay(gs: GameState): boolean {
  if (gs.dayPhase !== 'prep') return false;
  gs.dayPhase = 'day';
  gs.dayTimer = DAY_TICKS;
  gs.dailyObjectives = pickDailyObjectives(gs.day);
  return true;
}

/** Game over sonrası tüm state'i sıfırlar. */
export function resetGameState(gs: GameState): void {
  gs.isGameOver = false; gs.lives = 3; gs.day = 1;
  gs.customers = []; gs.waitList = []; gs.dirtyTables = [];
  gs.unlockedDishes = [];
  gs.dayPhase = 'prep'; gs.dayTimer = DAY_TICKS;
  gs.score = Math.floor(gs.score * 0.8);
  gs.dirtyTrayCount = 0; gs.revengeQueue = []; gs.pendingRevengeScene = false;
  gs.tableLayout = {
    'table0': { id: 'table0', x: 160, y: 460 },
    'table1': { id: 'table1', x: 380, y: 460 },
    'table2': { id: 'table2', x: 600, y: 460 },
    'table3': { id: 'table3', x: 820, y: 460 },
    'table4': { id: 'table4', x: 1040, y: 460 },
    'table5': { id: 'table5', x: 1200, y: 460 },
  };
  gs.lockedStations = {}; gs.lockedTables = {}; gs._seatCooldown = 0;
  gs.unlockedDishes = ['🥗']; gs.menuChoices = null; gs.hasOrderedTonight = false;
  gs.activeCards = []; gs.pendingCardChoices = null;
  gs.hidePatience = false; gs.hidePersonality = false; gs.comboCount = 0; gs.comboTimer = 0;
  gs.serviceWindow?.forEach(s => { s.item = null; });
  gs.sinks?.forEach(s => { s.input = null; s.progress = 0; s.isWashing = false; s.washingPlayerId = null; });
  gs.plateStack.count = gs.plateStack.maxCount;
  gs.cookStations.forEach(s => { s.input = null; s.output = null; s.isBurned = false; s.burnTimer = 0; });
  gs.fryers?.forEach(f => { f.input = null; f.output = null; f.isBurned = false; f.burnTimer = 0; f.timer = 0; });
  gs.cakeBakers?.forEach(c => { c.input = null; c.output = null; c.isBurned = false; c.burnTimer = 0; c.timer = 0; });
  gs.fridges?.forEach(f => { f.drinks = f.maxDrinks; });
  gs.coffeeMachines?.forEach(cm => { cm.cups = cm.maxCups; });
  gs.choppingBoards?.forEach(b => { b.input = null; b.progress = 0; b.isChopping = false; b.choppingPlayerId = null; });
  Object.values(gs.players).forEach(p => { p.holding = null; });
}

export function gameTick(gs: GameState, io: Server, rid: string) {
  if (gs.isGameOver) return; // game over sonrası tick durur
  const cm = getCardMultipliers(gs);
  gs.hidePatience = cm.hidePatience;
  gs.hidePersonality = cm.hidePersonality;

  updateCookStations(gs, io, rid);
  updateChoppingBoards(gs);
  updateSinks(gs, io, rid);
  updateFryers(gs);
  updateCakeBakers(gs);
  updateCoffeeMachinesAndFridges(gs);

  // Gündüz timer
  if (gs.dayPhase === 'day') {
    if (gs.dayTimer > 0) gs.dayTimer--;

    const activeCustomers = gs.customers.filter(c => !c.isLeaving).length;
    const isStuck = gs.dayTimer <= 0 && activeCustomers === 0 && gs.waitList.length > 0;
    if (isStuck) gs.waitList = [];

    if (gs.dayTimer <= 0 && activeCustomers === 0 && gs.waitList.length === 0) {
      gs.dirtyTables.forEach(dt => { if (dt.tip > 0) gs.score += dt.tip; dt.tip = 0; });

      gs.dayPhase = 'night';
      gs.dayTimer = NIGHT_TICKS;
      gs.hasOrderedTonight = true;
      gs.comboCount = 0;
      gs.comboTimer = 0;

      if (!gs.isGameOver) {
        // Günlük hedefleri tamamla ve bonus hesapla
        if (gs.dailyObjectives) {
          for (const obj of gs.dailyObjectives) {
            if (obj.type === 'no_life_loss' && !obj.failed) {
              obj.completed = true;
              obj.progress = 1;
            }
          }
          const objectiveBonus = gs.dailyObjectives
            .filter(o => o.completed && !o.failed)
            .reduce((sum, o) => sum + o.bonusCoins, 0);
          if (objectiveBonus > 0) gs.score += objectiveBonus;
        }

        if (gs.pendingRevengeScene) {
          gs.pendingRevengeScene = false;
          io.to(rid).emit("revengeScene", { day: gs.day, score: gs.score, lives: gs.lives, dailyObjectives: gs.dailyObjectives ?? [] });
        } else {
          io.to(rid).emit("dayEnd", { day: gs.day, score: gs.score, lives: gs.lives, dailyObjectives: gs.dailyObjectives ?? [] });
        }

        if (MENU_UNLOCK_DAYS.includes(gs.day + 1)) {
          generateMenuChoices(gs);
        } else {
          gs.menuChoices = null;
        }

        if (CARD_DAYS.includes(gs.day + 1)) {
          generateCardChoices(gs);
        } else {
          gs.pendingCardChoices = null;
        }
      }

      if (cm.endDayBonus > 0) gs.score += cm.endDayBonus;
    }
  }

  if (gs.dayPhase === 'night') {
    if (gs.dayTimer > 0) gs.dayTimer--;
  }

  // Combo timer
  if ((gs.comboCount ?? 0) > 0) {
    gs.comboTimer = (gs.comboTimer ?? 0) - 1;
    if (gs.comboTimer <= 0) {
      gs.comboCount = 0;
      gs.comboTimer = 0;
    }
  }

  // kaos_day kartı
  if (gs.activeCards.some(c => c.id === 'kaos_day') && gs.dayPhase === 'day') {
    gs._kaosTimer = (gs._kaosTimer ?? 1800) - 1;
    if (gs._kaosTimer <= 0) {
      gs._kaosTimer = 1800;
      const movableIds = Object.keys(gs.stationLayout).filter(id =>
        !id.startsWith('counter') && !id.startsWith('ingredient') && !id.startsWith('sw')
      );
      if (movableIds.length > 0) {
        const id = movableIds[Math.floor(Math.random() * movableIds.length)];
        const cols = Math.floor(1280 / 40);
        const rows = Math.floor(870 / 40);
        const newX = (Math.floor(Math.random() * (cols - 2)) + 1) * 40 + 20;
        const newY = (Math.floor(Math.random() * Math.min(rows - 2, 8)) + 1) * 40 + 20;
        if (moveStation(gs, id, newX, newY)) {
          io.to(rid).emit('stationMoved', { stationId: id, x: newX, y: newY });
          io.to(rid).emit('sound', 'fail');
        }
      }
    }
  }

  if ((gs._seatCooldown ?? 0) > 0) gs._seatCooldown!--;

  if (gs.dayPhase === 'day' && gs.dayTimer > CLOSING_THRESHOLD && gs.dayTimer < (DAY_TICKS - SPAWN_GRACE_TICKS)) {
    spawnTick(gs, io, rid);
  }

  tryQueueSeat(gs, io, rid);

  gs.waitList.forEach(guest => {
    if (guest.dialogTimer && guest.dialogTimer > 0) {
      guest.dialogTimer--;
      if (guest.dialogTimer <= 0) guest.currentDialog = undefined;
    }
  });

  gs._needsQueueSeat = false;
  customerTick(gs, io, rid);
  if (gs._needsQueueSeat) tryQueueSeat(gs, io, rid);

  const positions: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(gs.players)) {
    positions[id] = { x: p.x, y: p.y };
  }
  io.to(rid).emit("positions", positions);

  gs._stateTick = ((gs._stateTick ?? 0) + 1) % 3;
  if (gs._stateTick === 0) {
    io.to(rid).emit("state", gs);
  }
}
