import { Server } from "socket.io";
import {
  GameState, Personality,
  DAY_TICKS, NIGHT_TICKS,
  RECIPE_DEFS, BURN_TICKS, EAT_TICKS, BURNED_FOOD,
  DISH_ITEMS, getSeatSlots, DISH_UNLOCK_POOL,
  GAME_HEIGHT, EXTERIOR_Y,
  CLOSING_THRESHOLD,
  CHOP_TICKS, CHOP_PREFIX,
} from "../shared/types.js";
import { DIALOGUES } from "../shared/dialogues.js";

const SPAWN_GRACE_TICKS = 240;
const DOOR_X = 640;
const DOOR_ENTRY_Y = GAME_HEIGHT - 20;

function patLimit(lv: number, day: number, playerCount: number) {
  // Sabır limiti — günden güne biraz azalır ama çok düşmez
  const basePatience = playerCount === 1 ? 2400 : 2000;
  const perLv = playerCount === 1 ? 400 : 350;
  const perDay = playerCount === 1 ? 25 : 35;
  return Math.max(600, basePatience + perLv * lv - perDay * day);
}

export function generateMenuChoices(gs: GameState): void {
  const locked = [...DISH_UNLOCK_POOL].filter((d: string) => !gs.unlockedDishes.includes(d));
  if (locked.length === 0) { gs.menuChoices = null; return; }
  const shuffled = locked.sort(() => Math.random() - 0.5);
  gs.menuChoices = shuffled.slice(0, Math.min(2, locked.length));
}

export function tryQueueSeat(gs: GameState, io: Server, rid: string) {
  if (gs.dayPhase !== "day") return;
  if ((gs._seatCooldown ?? 0) > 0) return;
  if (gs.waitList.length === 0) return;

  const occupied = new Set([
    ...gs.customers.map(c => `${c.seatX},${c.seatY}`),
    ...gs.dirtyTables.map(t => `${t.seatX},${t.seatY}`),
  ]);
  const freeSeats = getSeatSlots(gs.tableLayout).filter(s => !occupied.has(`${s.x},${s.y}`));
  if (!freeSeats.length) return;

  // İlk misafirin grubunu belirle — tüm grup üyeleri aynı anda oturur
  const firstGuest = gs.waitList[0];
  const groupId = firstGuest.groupId;
  const groupToSeat = groupId
    ? gs.waitList.filter(g => g.groupId === groupId)
    : [firstGuest];

  const canSeat = Math.min(groupToSeat.length, freeSeats.length);
  if (canSeat <= 0) return;

  const playerCount = Object.keys(gs.players).length || 1;
  const maxP = patLimit(gs.upgrades.patience, gs.day, playerCount);

  for (let i = 0; i < canSeat; i++) {
    const guest = groupToSeat[i];
    const idx = gs.waitList.indexOf(guest);
    if (idx !== -1) gs.waitList.splice(idx, 1);

    const seat = freeSeats[i];
    gs.customers.push({
      id: guest.id, seatX: seat.x, seatY: seat.y,
      x: DOOR_X, y: DOOR_ENTRY_Y, targetY: EXTERIOR_Y - 10,
      wants: guest.wants, patience: maxP, maxPatience: maxP,
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
  // Grup büyüklüğüne göre cooldown: solo 85 tick, 2 kişi 100 tick, 3 kişi 115 tick
  gs._seatCooldown = 70 + canSeat * 15;
}

export function gameTick(gs: GameState, io: Server, rid: string) {
  // Fırınları güncelle
  gs.cookStations.forEach(s => {
    if (s.input && s.timer > 0) {
      s.timer--;
      if (s.timer <= 0) {
        const recipe = RECIPE_DEFS[s.input as keyof typeof RECIPE_DEFS];
        s.output = recipe ? recipe.output : s.input;
        s.input = null;
        // safeOven lv2: hiç yanmaz, lv1: 2x süre, lv0: normal
        const safeOvenLv = gs.upgrades.safeOven ?? 0;
        if (safeOvenLv >= 2) {
          s.burnTimer = Infinity; // yanmaz
        } else {
          s.burnTimer = BURN_TICKS * (safeOvenLv >= 1 ? 2 : 1);
        }
      }
    } else if (s.output && s.burnTimer !== undefined && s.burnTimer > 0 && s.burnTimer !== Infinity) {
      s.burnTimer--;
      if (s.burnTimer <= 0) {
        s.isBurned = true;
        s.output = BURNED_FOOD;
      }
    }
  });

  // Kesme tahtaları güncelle
  if (gs.choppingBoards) {
    gs.choppingBoards.forEach(board => {
      // Kesici oyuncu tahtadan uzaklaştıysa otomatik durdur
      if (board.isChopping && board.choppingPlayerId) {
        const cutter = gs.players[board.choppingPlayerId];
        if (!cutter || Math.hypot(cutter.x - board.x, cutter.y - board.y) > 110) {
          board.isChopping = false;
          board.choppingPlayerId = null;
        }
      }

      if (board.isChopping && board.input && board.progress < CHOP_TICKS) {
        board.progress++;
        if (board.progress >= CHOP_TICKS) {
          board.input = CHOP_PREFIX + board.input;
          board.isChopping = false;
          board.choppingPlayerId = null;
        }
      }
    });
  }

  // Menü seçimi sadece belirli günlerde çıkar
  const MENU_UNLOCK_DAYS = [3, 10, 13, 20, 24, 28];

  // Gündüz timer
  if (gs.dayPhase === 'day') {
    if (gs.dayTimer > 0) gs.dayTimer--;
    if (gs.dayTimer <= 0 && gs.customers.filter(c => !c.isLeaving).length === 0 && gs.waitList.length === 0) {
      // Kapanış saatinde kalan kirli tabakları otomatik temizle
      gs.dirtyTables = [];
      // Elde kirli tabak tutan oyuncuların elini boşalt (hazırlık fazında sorun çıkmaması için)
      Object.values(gs.players).forEach((player: any) => {
        if (player.holding === '__dirty_plate__') player.holding = null;
      });
      gs.dayPhase = 'night';
      gs.dayTimer = NIGHT_TICKS;
      gs.hasOrderedTonight = false;
      // Sadece belirli günlerde yemek seçim ekranı çıkar
      if (MENU_UNLOCK_DAYS.includes(gs.day + 1)) {
        generateMenuChoices(gs);
      } else {
        gs.menuChoices = null;
      }
    }
  }

  if (gs.dayPhase === 'night') {
    if (gs.dayTimer > 0) gs.dayTimer--;
    // Menü seçimi yoksa ve timer bittiyse otomatik sonraki güne geç
    if (gs.dayTimer <= 0 && !gs.menuChoices) {
      gs.day++; gs.dayPhase = 'prep'; gs.dayTimer = DAY_TICKS;
    }
  }

  // Oturma cooldown sayacını düşür
  if ((gs._seatCooldown ?? 0) > 0) gs._seatCooldown!--;

  // Spawn
  if (gs.dayPhase === 'day' && gs.dayTimer > CLOSING_THRESHOLD && gs.dayTimer < (DAY_TICKS - SPAWN_GRACE_TICKS)) {
    spawnTick(gs, io, rid);
  }

  tryQueueSeat(gs, io, rid);

  // WaitList dialog timer
  gs.waitList.forEach(guest => {
    if (guest.dialogTimer && guest.dialogTimer > 0) {
      guest.dialogTimer--;
      if (guest.dialogTimer <= 0) guest.currentDialog = undefined;
    }
  });

  // Müşteri tick
  customerTick(gs, io, rid);

  // Pozisyonları ayrı hafif event olarak gönder (her tick)
  const positions: Record<string, { x: number; y: number }> = {};
  for (const [id, p] of Object.entries(gs.players)) {
    positions[id] = { x: p.x, y: p.y };
  }
  io.to(rid).emit("positions", positions);

  // Ağır state'i daha seyrek gönder (her 3 tick'te bir = ~100ms)
  gs._stateTick = ((gs._stateTick ?? 0) + 1) % 3;
  if (gs._stateTick === 0) {
    io.to(rid).emit("state", gs);
  }
}

function spawnTick(gs: GameState, io: Server, rid: string) {
  const availableDishes = gs.unlockedDishes.length > 0 ? gs.unlockedDishes : [...DISH_ITEMS];
  const playerCount = Object.keys(gs.players).length || 1;
  const isSolo = playerCount === 1;

  // Spawn hızı: günden güne artar ama imkansız olmaz
  // Gün 1: ~12-15 müşteri/gün, Gün 10: ~22-28 müşteri/gün
  const baseRate = 0.0013 + Math.min(gs.day * 0.00045, 0.006);
  const dayProgress = 1 - gs.dayTimer / DAY_TICKS;
  // Oyuncu sayısına göre ölçekleme: 1p=1x, 2p=1.7x, 3p=2.4x, 4p=3.1x
  const spawnMultiplier = 1 + (playerCount - 1) * 0.7;
  const queueLimit = (6 + gs.day) * Math.ceil(spawnMultiplier);
  const currentRate = (baseRate + dayProgress * 0.001) * spawnMultiplier;

  if (Math.random() < currentRate && gs.customers.length + gs.waitList.length < queueLimit) {
    // Grup mu, tekil mi? Gün ilerledikçe grup şansı artar
    const groupChance = Math.min(0.20 + gs.day * 0.04, 0.50); // gün 1: %24, gün 8+: %52
    const isGroup = Math.random() < groupChance;
    const groupSize = isGroup ? 2 + Math.floor(Math.random() * (isSolo ? 2 : 3)) : 1; // solo: 2-3, multi: 2-4

    // Kuyruğa sığıyor mu kontrol et
    const available = queueLimit - gs.customers.length - gs.waitList.length;
    const actualSize = Math.min(groupSize, available);
    if (actualSize <= 0) return;

    // Grup üyelerini tanımlamak için ortak groupId (solo: undefined)
    const groupId = actualSize > 1 ? Math.random().toString(36).slice(2, 9) : undefined;

    for (let g = 0; g < actualSize; g++) {
      const personalities: Personality[] = isSolo
        ? ['polite', 'polite', 'rude']
        : ['polite', 'rude', 'recep'];
      const pers = personalities[Math.floor(Math.random() * personalities.length)];
      let dialog: string | undefined;
      let timer: number | undefined;
      if (g === 0 && Math.random() < 0.3) {
        const list = DIALOGUES[pers].entry;
        dialog = list[Math.floor(Math.random() * list.length)];
        timer = 90;
      }
      const bodyShapes = [1, 2, 3, 4] as const;
      const bodyColors: Record<Personality, string[]> = {
        polite: ['#3b82f6', '#0ea5e9', '#6366f1', '#8b5cf6'],
        rude: ['#f59e0b', '#ef4444', '#f97316', '#dc2626'],
        recep: ['#7c3aed', '#b91c1c', '#1d4ed8', '#064e3b'],
        thug: ['#000000', '#1c1917', '#7f1d1d', '#57534e'],
      };
      const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
      const bodyColor = bodyColors[pers][Math.floor(Math.random() * bodyColors[pers].length)];
      gs.waitList.push({
        id: Math.random().toString(36).slice(2, 9),
        wants: availableDishes[Math.floor(Math.random() * availableDishes.length)],
        personality: pers,
        currentDialog: dialog, dialogTimer: timer,
        bodyShape, bodyColor,
        groupId, // Grup üyelerini birbirine bağlar
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
      const thugGroupId = Math.random().toString(36).slice(2, 9); // Tüm thug'lar aynı gruptan
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
          currentDialog: dialog, dialogTimer: 150,
          bodyShape, bodyColor,
          groupId: thugGroupId,
        });
      }
      io.to(rid).emit("sound", "fail");
    }
  }
}

function customerTick(gs: GameState, io: Server, rid: string) {
  for (let i = gs.customers.length - 1; i >= 0; i--) {
    const c = gs.customers[i];

    if (c.dialogTimer && c.dialogTimer > 0) {
      c.dialogTimer--;
      if (c.dialogTimer <= 0) c.currentDialog = undefined;
    }
    if (c.beatUpTimer && c.beatUpTimer > 0) {
      c.beatUpTimer--;
      if (c.beatUpTimer <= 0) { c.beatUpTimer = 0; c.isBeatUp = false; }
    }

    if (c.isLeaving) {
      c.isSeated = false; c.isEating = false;
      // Önce kapıya (EXTERIOR_Y), sonra dışarı çık
      if (c.y < EXTERIOR_Y) {
        c.y = Math.min(EXTERIOR_Y, c.y + 4);
        c.x = c.doorX ?? 640; // kapıya doğru x'i hizala
      } else {
        c.y += 4;
      }
      if (c.y >= GAME_HEIGHT + 60) gs.customers.splice(i, 1);
      continue;
    }

    // Giriş fazı: dışarıdan kapıya doğru geliyor
    if (c.phase === 'entering') {
      if (c.y > (EXTERIOR_Y - 10)) {
        c.y = Math.max(EXTERIOR_Y - 10, c.y - 3);
      } else {
        // Kapıdan geçti, koltuğa yönlen (x ışınlama yok, smooth geçiş)
        c.phase = 'seating';
        c.targetY = c.seatY;
        // c.x burada değiştirilmiyor — aşağıdaki !isSeated bloğu x'i de smooth taşır
      }
      continue;
    }

    if (c.isEating) {
      c.eatTimer--;
      if (!c.currentDialog && Math.random() < 0.001) {
        const list = DIALOGUES[c.personality].eating;
        c.currentDialog = list[Math.floor(Math.random() * list.length)];
        c.dialogTimer = 90;
      }
      if (c.eatTimer <= 0) {
        gs.dirtyTables.push({ seatX: c.seatX, seatY: c.seatY, tip: c.tipAmount || 0 });
        c.isLeaving = true; c.isSeated = false; c.targetY = GAME_HEIGHT + 60;
        if (Math.random() < 0.4) {
          const list = DIALOGUES[c.personality].leaving_happy;
          c.currentDialog = list[Math.floor(Math.random() * list.length)];
          c.dialogTimer = 90;
        }
        tryQueueSeat(gs, io, rid);
      }
      continue;
    }

    if (!c.isSeated) {
      // Y hareketi
      if (c.y > c.targetY) c.y = Math.max(c.targetY, c.y - 3);
      else if (c.y < c.targetY) c.y = Math.min(c.targetY, c.y + 3);
      // X hareketi (smooth, ışınlama yok)
      if (c.x < c.seatX) c.x = Math.min(c.seatX, c.x + 3);
      else if (c.x > c.seatX) c.x = Math.max(c.seatX, c.x - 3);
      // Hedefe ulaştı mı?
      if (Math.abs(c.x - c.seatX) < 2 && Math.abs(c.y - c.targetY) < 2) {
        c.x = c.seatX; c.y = c.targetY;
        c.isSeated = true; c.phase = 'seated';
      }
    } else {
      if (!c.currentDialog && Math.random() < 0.001) {
        const list = DIALOGUES[c.personality].waiting;
        c.currentDialog = list[Math.floor(Math.random() * list.length)];
        c.dialogTimer = 90;
      }
      if (gs.dayPhase === 'day') {
        const playerCount = Object.keys(gs.players).length || 1;
        let patienceDrain = 1 + (playerCount - 1) * 0.1;
        if (gs.dayTimer <= DAY_TICKS * 0.25) patienceDrain *= 1.2;
        const baseDrain = Math.floor(patienceDrain);
        const actualDrain = baseDrain + (Math.random() < (patienceDrain - baseDrain) ? 1 : 0);

        if (!c.isEating && c.wants) {
          c.patience -= actualDrain;
          if (c.patience <= 0) {
          gs.score = Math.max(0, gs.score - 10);
            gs.lives -= 1;
            io.to(rid).emit("sound", "fail");
            if (gs.lives <= 0) {
              gs.isGameOver = true;
              gs.dayPhase = 'night'; // game over ekranı için night fazında kal
              gs.customers = []; gs.waitList = []; gs.dirtyTables = [];
              io.to(rid).emit("state", gs);
              io.to(rid).emit("sound", "fail");
              break;
            }
            c.isLeaving = true; c.isSeated = false; c.targetY = GAME_HEIGHT + 60;
            const list = DIALOGUES[c.personality].leaving_angry;
            c.currentDialog = list[Math.floor(Math.random() * list.length)];
            c.dialogTimer = 90;
            tryQueueSeat(gs, io, rid);
          }
        }
      }
    }
  }
}
