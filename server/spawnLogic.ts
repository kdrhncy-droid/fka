import { Server } from "socket.io";
import {
  GameState, Personality,
  DAY_TICKS,
  GAME_HEIGHT, EXTERIOR_Y,
} from "../shared/types.js";
import { DIALOGUES } from "../shared/dialogues.js";
import { getCardMultipliers } from "./cardLogic.js";
import { DOOR_X, DOOR_ENTRY_Y } from "../shared/constants.js";

function patLimit(lv: number, day: number, playerCount: number) {
  const basePatience = playerCount === 1 ? 1500 : 1200;
  const perLv = playerCount === 1 ? 300 : 250;
  const perDay = playerCount === 1 ? 15 : 20;
  return Math.max(600, basePatience + perLv * lv - perDay * day);
}

export function tryQueueSeat(gs: GameState, io: Server, rid: string) {
  if (gs.dayPhase !== "day") return;
  if ((gs._seatCooldown ?? 0) > 0) return;
  if (gs.waitList.length === 0) return;

  const occupied = new Set([
    ...gs.customers.filter(c => !c.isLeaving).map(c => `${c.seatX},${c.seatY}`),
    ...gs.dirtyTables.map(t => `${t.seatX},${t.seatY}`),
  ]);

  const firstGuest = gs.waitList[0];
  const groupId = firstGuest.groupId;
  const groupToSeat = groupId
    ? gs.waitList.filter(g => g.groupId === groupId)
    : [firstGuest];

  let selectedSeats: { x: number; y: number }[] | null = null;
  for (const t of Object.values(gs.tableLayout)) {
    const s = t.seats ?? 4;
    const tableSlots: { x: number; y: number }[] = [];
    if (s === 1) tableSlots.push({ x: t.x, y: t.y + 20 });
    else if (s === 2) tableSlots.push({ x: t.x, y: t.y - 42 }, { x: t.x, y: t.y + 30 });
    else if (s === 3) tableSlots.push({ x: t.x, y: t.y - 42 }, { x: t.x - 18, y: t.y + 30 }, { x: t.x + 18, y: t.y + 30 });
    else tableSlots.push({ x: t.x - 20, y: t.y - 42 }, { x: t.x + 20, y: t.y - 42 }, { x: t.x - 20, y: t.y + 30 }, { x: t.x + 20, y: t.y + 30 });

    const tableFree = tableSlots.filter(s => !occupied.has(`${s.x},${s.y}`));
    if (tableFree.length >= groupToSeat.length) {
      selectedSeats = tableFree.slice(0, groupToSeat.length);
      break;
    }
  }

  if (!selectedSeats) return;

  const playerCount = Object.keys(gs.players).length || 1;
  const cm = getCardMultipliers(gs);
  const maxP = Math.round(patLimit(gs.upgrades.patience, gs.day, playerCount) * cm.patienceMult);

  for (let i = 0; i < groupToSeat.length; i++) {
    const guest = groupToSeat[i];
    const idx = gs.waitList.indexOf(guest);
    if (idx !== -1) gs.waitList.splice(idx, 1);

    const seat = selectedSeats[i];

    let patienceMult = 1.0;
    if (guest.personality === 'vip') patienceMult = 1.8;
    else if (guest.personality === 'drunk') patienceMult = 1.5;
    else if (guest.personality === 'inspector') patienceMult = 0.5;
    const adjustedMaxP = Math.round(maxP * patienceMult);

    gs.customers.push({
      id: guest.id, seatX: seat.x, seatY: seat.y,
      x: DOOR_X, y: DOOR_ENTRY_Y, targetY: EXTERIOR_Y - 10,
      wants: guest.wants, patience: adjustedMaxP, maxPatience: adjustedMaxP,
      isSeated: false, isEating: false, eatTimer: 0,
      tipAmount: undefined,
      personality: guest.personality,
      currentDialog: guest.currentDialog,
      dialogTimer: guest.dialogTimer,
      isBeatUp: false, isLeaving: false,
      bodyShape: guest.bodyShape, bodyColor: guest.bodyColor,
      punchCount: 0,
      phase: 'entering',
      doorX: DOOR_X,
    });
  }
  io.to(rid).emit("sound", "arrive");
  gs._seatCooldown = 70 + groupToSeat.length * 15;
}

export function spawnTick(gs: GameState, io: Server, rid: string) {
  const cm = getCardMultipliers(gs);
  const availableDishes = gs.unlockedDishes.length > 0 ? gs.unlockedDishes : null;
  if (!availableDishes) return; // Henüz yemek seçilmemiş, spawn etme
  const playerCount = Object.keys(gs.players).length || 1;
  const isSolo = playerCount === 1;

  const baseRate = 0.0015 + Math.min(gs.day * 0.0003, 0.0060);
  const dayProgress = 1 - gs.dayTimer / DAY_TICKS;
  const revengeBonus = gs.revengeQueue.length > 0 ? 1.2 : 1.0;
  const spawnMultiplier = (1 + (playerCount - 1) * 0.3) * cm.spawnMult * revengeBonus;
  const queueLimit = Math.min(14, (4 + Math.floor(gs.day / 3)) * Math.ceil(spawnMultiplier));
  const currentRate = (baseRate + dayProgress * 0.0008) * spawnMultiplier;

  if (Math.random() < currentRate && gs.customers.length + gs.waitList.length < queueLimit) {
    const groupChance = Math.min(0.05 + gs.day * 0.025, 0.45);
    const isGroup = Math.random() < groupChance;
    const groupSize = isGroup ? 2 + (Math.random() < 0.3 ? 1 : 0) : 1;
    const available = queueLimit - gs.customers.length - gs.waitList.length;
    const actualSize = Math.min(groupSize, available);
    if (actualSize <= 0) return;

    const groupId = actualSize > 1 ? Math.random().toString(36).slice(2, 9) : undefined;

    for (let g = 0; g < actualSize; g++) {
      let personalities: Personality[];
      if (isSolo) {
        personalities = cm.rudeChanceMult > 1
          ? ['polite', 'rude', 'rude']
          : ['polite', 'polite', 'rude'];
      } else {
        personalities = cm.rudeChanceMult > 1
          ? ['rude', 'rude', 'recep']
          : ['polite', 'rude', 'recep'];
      }
      let pers = personalities[Math.floor(Math.random() * personalities.length)] as Personality;

      const roll = Math.random();
      if (gs.day >= 5 && roll < 0.10) pers = 'vip';
      else if (gs.day >= 3 && roll < 0.25) pers = 'drunk';
      else if (gs.day >= 7 && roll < 0.08) pers = 'inspector';

      let dialog: string | undefined;
      let timer: number | undefined;
      if (g === 0 && Math.random() < 0.3) {
        const list = DIALOGUES[pers].entry;
        dialog = list[Math.floor(Math.random() * list.length)];
        timer = 180;
      }

      const bodyShapes = [1, 2, 3, 4] as const;
      const bodyColors: Record<Personality, string[]> = {
        polite: ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6'],
        rude: ['#f59e0b', '#ef4444', '#f97316', '#dc2626'],
        recep: ['#cc3300', '#b91c1c', '#7c2d12', '#991b1b'],
        thug: ['#000000', '#1c1917', '#7f1d1d', '#57534e'],
        vip: ['#b8860b', '#d4a017', '#92700a', '#c9a227'],
        drunk: ['#6b3a1f', '#7c4a2a', '#8b4513', '#5c2e0e'],
        inspector: ['#e8e8e8', '#d1d5db', '#9ca3af', '#f3f4f6'],
      };
      const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
      const bodyColor = bodyColors[pers][Math.floor(Math.random() * bodyColors[pers].length)];

      gs.waitList.push({
        id: Math.random().toString(36).slice(2, 9),
        wants: availableDishes[Math.floor(Math.random() * availableDishes.length)],
        personality: pers,
        currentDialog: dialog, dialogTimer: timer,
        bodyShape, bodyColor,
        groupId,
      });
    }
  }

  // Revenge Queue
  for (let i = gs.revengeQueue.length - 1; i >= 0; i--) {
    gs.revengeQueue[i]--;
    if (gs.revengeQueue[i] <= 0) {
      gs.revengeQueue.splice(i, 1);
      const thugCount = isSolo
        ? 2 + Math.floor(Math.random() * 2)
        : 3 + Math.floor(Math.random() * 2);
      const thugGroupId = Math.random().toString(36).slice(2, 9);
      for (let j = 0; j < thugCount; j++) {
        const bodyShapes = [2, 4] as const;
        const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
        const bodyColors = ['#000000', '#1c1917', '#7f1d1d', '#57534e'];
        const bodyColor = bodyColors[Math.floor(Math.random() * bodyColors.length)];
        const list = DIALOGUES.thug.revenge;
        const dialog = list[Math.floor(Math.random() * list.length)];
        gs.waitList.push({
          id: Math.random().toString(36).slice(2, 9),
          wants: availableDishes[Math.floor(Math.random() * availableDishes.length)],
          personality: 'thug',
          currentDialog: dialog, dialogTimer: 240,
          bodyShape, bodyColor,
          groupId: thugGroupId,
        });
      }
      io.to(rid).emit("sound", "fail");
    }
  }
}
