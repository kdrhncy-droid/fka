import { Server } from "socket.io";
import {
  GameState, Personality,
  DAY_TICKS, NIGHT_TICKS,
  RECIPE_DEFS, BURN_TICKS, EAT_TICKS, BURNED_FOOD,
  DISH_ITEMS, getSeatSlots, DISH_UNLOCK_POOL,
  GAME_HEIGHT, EXTERIOR_Y,
  CLOSING_THRESHOLD,
  CHOP_TICKS, CHOP_PREFIX,
  WASH_TICKS, DIRTY_PLATE, CLEAN_PLATE,
  FRYER_TICKS, FRYER_BURN_TICKS, FRIDGE_BASE_CAPACITY,
  CAKE_TICKS, CAKE_BURN_TICKS, COFFEE_BASE_CAPACITY,
  ALL_CARDS, CARD_DAYS, GameCard,
  COMBO_TIMEOUT_TICKS,
  SPECIAL_REQUEST_CHANCE, SPECIAL_REQUESTS,
  QUICK_PATIENCE_DRAIN,
} from "../shared/types.js";
import { DIALOGUES } from "../shared/dialogues.js";

const SPAWN_GRACE_TICKS = 240;
const DOOR_X = 640;
const DOOR_ENTRY_Y = GAME_HEIGHT - 20;

function patLimit(lv: number, day: number, playerCount: number) {
  // Sabır limiti — Day 1, Solo = 1500 tick (Tam 25 saniye)
  const basePatience = playerCount === 1 ? 1500 : 1200;
  // Upgrade başına +300 tick (5 saniye eklenecek). Upgrade sistemi tamamen aktif!
  const perLv = playerCount === 1 ? 300 : 250;
  // Her gün 15/20 tick kısalır ki zorlaşsın
  const perDay = playerCount === 1 ? 15 : 20;
  return Math.max(600, basePatience + perLv * lv - perDay * day);
}

export function generateMenuChoices(gs: GameState): void {
  const locked = [...DISH_UNLOCK_POOL].filter((d: string) => !gs.unlockedDishes.includes(d));
  if (locked.length === 0) { gs.menuChoices = null; return; }
  const shuffled = locked.sort(() => Math.random() - 0.5);
  gs.menuChoices = shuffled.slice(0, Math.min(2, locked.length));
}

export function generateCardChoices(gs: GameState): void {
  const activeIds = new Set(gs.activeCards.map(c => c.id));
  // Gün 8'den önce özel kartları hariç tut
  const earlyExclude = new Set(['turbo_day', 'mystery_guests']);
  const pool = ALL_CARDS.filter(c =>
    !activeIds.has(c.id) &&
    (gs.day >= 8 || !earlyExclude.has(c.id))
  );
  if (pool.length === 0) { gs.pendingCardChoices = null; return; }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  gs.pendingCardChoices = shuffled.slice(0, 2);
}

// Aktif kartlardan kaynaklanan çarpanları hesapla
export function getCardMultipliers(gs: GameState) {
  const has = (id: string) => gs.activeCards.some(c => c.id === id);
  return {
    patienceMult:    has('impatient_crowd') ? 0.80 : has('low_season') ? 1.50 : has('blind_patience') ? 1.15 : 1.0,
    spawnMult:       has('busy_day') ? 1.30 : has('low_season') ? 0.80 : has('rainy_day') ? 1.10 : 1.0,
    burnMult:        has('hot_oven') ? 0.70 : 1.0,
    cookMult:        has('hot_oven') ? 0.70 : has('turbo_day') ? 0.80 : has('chop_pressure') ? 1.0 : 1.0,
    chopMult:        has('chop_pressure') ? 1.25 : 1.0,  // daha yavaş = daha fazla tick
    choppedCookMult: has('chop_pressure') ? 0.60 : 1.0,  // doğranmış daha hızlı pişer
    tipMult:         has('rush_customers') ? 1.25 : has('lucky_day') ? 2.0 : has('mystery_guests') ? 1.30 : 1.0,
    earnBonus:       has('impatient_crowd') ? 3 : 0,
    drinkTipBonus:   has('cold_chain') ? 8 : 0,
    plateBonusScore: has('few_plates') ? 2 : 0,
    upgradeCostMult: has('expensive_day') ? 1.25 : has('busy_day') ? 0.85 : 1.0,
    movementMult:    has('turbo_day') ? 0.85 : 1.0,
    hidePatience:    has('blind_patience'),
    hidePersonality: has('mystery_guests'),
    rudeChanceMult:  has('rude_day') ? 1.40 : 1.0,
    rudePunchBonus:  has('rude_day') ? 15 : 0,
    endDayBonus:     has('expensive_day') ? 50 : 0,
    eatSpeedMult:    has('rush_customers') ? 0.75 : 1.0, // daha hızlı yer = daha az tick
  };
}

export function tryQueueSeat(gs: GameState, io: Server, rid: string) {
  if (gs.dayPhase !== "day") return;
  if ((gs._seatCooldown ?? 0) > 0) return;
  if (gs.waitList.length === 0) return;

  const occupied = new Set([
    ...gs.customers.map(c => `${c.seatX},${c.seatY}`),
    ...gs.dirtyTables.map(t => `${t.seatX},${t.seatY}`),
  ]);

  // İlk misafirin grubunu belirle — tüm grup üyeleri aynı anda oturur
  const firstGuest = gs.waitList[0];
  const groupId = firstGuest.groupId;
  const groupToSeat = groupId
    ? gs.waitList.filter(g => g.groupId === groupId)
    : [firstGuest];

  // Grubu parçalamamak için TAM olarak bu grubun sığabileceği BİR masa bul
  let selectedSeats: { x: number; y: number }[] | null = null;
  for (const t of Object.values(gs.tableLayout)) {
    // Sadece bu masanın koltuklarını al
    const s = t.seats ?? 4;
    const tableSlots: { x: number; y: number }[] = [];
    if (s === 1) tableSlots.push({ x: t.x, y: t.y + 35 });
    else if (s === 2) tableSlots.push({ x: t.x, y: t.y - 50 }, { x: t.x, y: t.y + 40 });
    else if (s === 3) tableSlots.push({ x: t.x, y: t.y - 50 }, { x: t.x - 28, y: t.y + 40 }, { x: t.x + 28, y: t.y + 40 });
    else tableSlots.push({ x: t.x - 28, y: t.y - 50 }, { x: t.x + 28, y: t.y - 50 }, { x: t.x - 28, y: t.y + 40 }, { x: t.x + 28, y: t.y + 40 });
    
    // Boş olan sandalyeleri filtrele
    const tableFree = tableSlots.filter(s => !occupied.has(`${s.x},${s.y}`));
    
    // Yeterli yer varsa masayı kap!
    if (tableFree.length >= groupToSeat.length) {
      selectedSeats = tableFree.slice(0, groupToSeat.length);
      break;
    }
  }

  // Hiçbir masa bu gruba tamamen sığmıyorsa bekle (sıra ilerlemez)
  if (!selectedSeats) return;

  const playerCount = Object.keys(gs.players).length || 1;
  const cm = getCardMultipliers(gs);
  const maxP = Math.round(patLimit(gs.upgrades.patience, gs.day, playerCount) * cm.patienceMult);

  for (let i = 0; i < groupToSeat.length; i++) {
    const guest = groupToSeat[i];
    const idx = gs.waitList.indexOf(guest);
    if (idx !== -1) gs.waitList.splice(idx, 1);

    const seat = selectedSeats[i];
    // Özel istek: gün 3'ten sonra, polite/rude müşterilere %30 ihtimalle
    let specialRequest: 'spicy' | 'extra' | 'quick' | null = null;
    if (gs.day >= 3 && (guest.personality === 'polite' || guest.personality === 'rude') && Math.random() < SPECIAL_REQUEST_CHANCE) {
      specialRequest = SPECIAL_REQUESTS[Math.floor(Math.random() * SPECIAL_REQUESTS.length)] as 'spicy' | 'extra' | 'quick';
    }
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
      specialRequest,
    });
  }
  io.to(rid).emit("sound", "arrive");
  // Grup büyüklüğüne göre cooldown: solo 85 tick, 2 kişi 100 tick, etc...
  gs._seatCooldown = 70 + groupToSeat.length * 15;
}

export function gameTick(gs: GameState, io: Server, rid: string) {
  const cm = getCardMultipliers(gs);

  // Fırınları güncelle
  gs.cookStations.forEach(s => {
    if (s.input && s.timer > 0) {
      // cookMult < 1 = daha hızlı pişer (hot_oven, turbo_day)
      s.timer -= cm.cookMult <= 1 ? Math.ceil(1 / cm.cookMult) : 1;
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
        // ✨ Yemek pişti animasyonu
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
        // chop_pressure kartı: daha yavaş doğrama (daha fazla tick gerekir)
        const chopTicksNeeded = Math.round(CHOP_TICKS * cm.chopMult);
        board.progress++;
        if (board.progress >= chopTicksNeeded) {
          board.input = CHOP_PREFIX + board.input;
          board.isChopping = false;
          board.choppingPlayerId = null;
        }
      }
    });
  }

  // Lavaboları güncelle
  if (gs.sinks) {    gs.sinks.forEach(sink => {
      // Yıkayıcı oyuncu uzaklaştıysa otomatik durdur
      if (sink.isWashing && sink.washingPlayerId) {
        const washer = gs.players[sink.washingPlayerId];
        if (!washer || Math.hypot(washer.x - sink.x, washer.y - sink.y) > 110) {
          sink.isWashing = false;
          sink.washingPlayerId = null;
        }
      }

      // Aktif yıkama ve içinde kirli tabak varsa progress artır
      if (sink.isWashing && sink.input === DIRTY_PLATE && sink.progress < WASH_TICKS) {
        sink.progress++;
        if (sink.progress >= WASH_TICKS) {
          sink.input = CLEAN_PLATE; // Tabağı temizle
          sink.isWashing = false;
          sink.washingPlayerId = null;
          io.to(rid).emit("sound", "success");
        }
      }
    });
  }

  // Fritözleri güncelle
  if (gs.fryers) {
    const speedBonus = gs.upgrades.fryerSpeed ?? 0;
    gs.fryers.forEach(f => {
      if (f.input && f.timer > 0) {
        f.timer -= 1 + speedBonus;
        if (f.timer <= 0) {
          f.output = '🍟';
          f.input = null;
          f.burnTimer = FRYER_BURN_TICKS;
        }
      } else if (f.output && f.burnTimer !== undefined && f.burnTimer > 0) {
        f.burnTimer--;
        if (f.burnTimer <= 0) { f.isBurned = true; f.output = '⬛'; }
      }
    });
  }

  // Pasta fırınlarını güncelle
  if (gs.cakeBakers) {
    gs.cakeBakers.forEach(c => {
      if (c.input && c.timer > 0) {
        c.timer--;
        if (c.timer <= 0) { c.output = '🍰'; c.input = null; c.burnTimer = CAKE_BURN_TICKS; }
      } else if (c.output && c.burnTimer !== undefined && c.burnTimer > 0) {
        c.burnTimer--;
        if (c.burnTimer <= 0) { c.isBurned = true; c.output = '⬛'; }
      }
    });
  }

  // Kahve makinelerini güncelle — sadece gece başında bir kez yenile
  if (gs.dayPhase === 'night' && !gs.hasOrderedTonight && gs.coffeeMachines) {
    gs.coffeeMachines.forEach(cm => {
      cm.maxCups = COFFEE_BASE_CAPACITY + (gs.upgrades.coffeeMachine ?? 0) * 2;
      cm.cups = cm.maxCups;
    });
  }

  // Buzdolabını güncelle — sadece gece başında bir kez yenile
  if (gs.dayPhase === 'night' && !gs.hasOrderedTonight && gs.fridges) {
    gs.fridges.forEach(fridge => {
      fridge.maxDrinks = FRIDGE_BASE_CAPACITY + (gs.upgrades.fridgeCapacity ?? 0) * 3;
      fridge.drinks = fridge.maxDrinks;
    });
  }

  // Menü seçimi sadece belirli günlerde çıkar
  const MENU_UNLOCK_DAYS = [3, 10, 13, 20, 24, 28];

  // Gündüz timer
  if (gs.dayPhase === 'day') {
    if (gs.dayTimer > 0) gs.dayTimer--;
    if (gs.dayTimer <= 0 && gs.customers.filter(c => !c.isLeaving).length === 0 && gs.waitList.length === 0) {
      // Kapanış saatinde toplanmamış tipleri otomatik ekle — ama kirli tabaklar kalır
      gs.dirtyTables.forEach(dt => { if (dt.tip > 0) gs.score += dt.tip; dt.tip = 0; });

      // Gün sonu özet event'i — dayPhase'i hemen değiştir, tekrar tetiklenmesin
      gs.dayPhase = 'night';
      gs.dayTimer = NIGHT_TICKS;
      gs.hasOrderedTonight = true; // gece yenileme bir kez yapılsın
      gs.comboCount = 0;
      gs.comboTimer = 0;

      io.to(rid).emit("dayEnd", {
        day: gs.day,
        score: gs.score,
        lives: gs.lives,
      });

      // Sadece belirli günlerde yemek seçim ekranı çıkar
      if (MENU_UNLOCK_DAYS.includes(gs.day + 1)) {
        generateMenuChoices(gs);
      } else {
        gs.menuChoices = null;
      }

      // Kart günlerinde kart seçimi çıkar
      if (CARD_DAYS.includes(gs.day + 1)) {
        generateCardChoices(gs);
      } else {
        gs.pendingCardChoices = null;
      }

      // Gün sonu bonus (expensive_day kartı)
      if (cm.endDayBonus > 0) {
        gs.score += cm.endDayBonus;
      }
    }
  }

  if (gs.dayPhase === 'night') {
    if (gs.dayTimer > 0) gs.dayTimer--;
    // Menü seçimi ve kart seçimi yoksa otomatik sonraki güne geç
    if (gs.dayTimer <= 0 && !gs.menuChoices && !gs.pendingCardChoices) {
      gs.day++; gs.dayPhase = 'prep'; gs.dayTimer = DAY_TICKS;
    }
  }

  // Combo timer — sıfırlanırsa combo sıfırlanır
  if ((gs.comboCount ?? 0) > 0) {
    gs.comboTimer = (gs.comboTimer ?? 0) - 1;
    if (gs.comboTimer <= 0) {
      gs.comboCount = 0;
      gs.comboTimer = 0;
    }
  }

  // kaos_day kartı — her 1800 tick'te rastgele bir istasyon kayar
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
        gs.stationLayout[id].x = newX;
        gs.stationLayout[id].y = newY;
        // İlgili istasyonun koordinatını da güncelle
        const oven = gs.cookStations.find(s => s.id === id);
        if (oven) { oven.x = newX; oven.y = newY; }
        const board = gs.choppingBoards?.find(b => b.id === id);
        if (board) { board.x = newX; board.y = newY; }
        io.to(rid).emit('stationMoved', { stationId: id, x: newX, y: newY });
        io.to(rid).emit('sound', 'fail');
      }
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
  const cm = getCardMultipliers(gs);
  // 🥤 buzdolabı boşsa menüden çıkar
  const fridgeEmpty = !gs.fridges || gs.fridges.every(f => f.drinks === 0);
  const availableDishes = (gs.unlockedDishes.length > 0 ? gs.unlockedDishes : [...DISH_ITEMS])
    .filter(d => d !== '🥤' || !fridgeEmpty);
  const playerCount = Object.keys(gs.players).length || 1;
  const isSolo = playerCount === 1;

  const baseRate = 0.0015 + Math.min(gs.day * 0.0003, 0.0060);
  const dayProgress = 1 - gs.dayTimer / DAY_TICKS;
  const spawnMultiplier = (1 + (playerCount - 1) * 0.3) * cm.spawnMult;
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
      // rude_day kartı: kaba müşteri oranı artar
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
      const eatCm = getCardMultipliers(gs);
      // eatSpeedMult < 1 = daha hızlı yer (daha az tick)
      c.eatTimer -= eatCm.eatSpeedMult < 1 ? Math.ceil(1 / eatCm.eatSpeedMult) : 1;
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
          // ❤️ Mutlu ayrılma animasyonu
          io.to(rid).emit('happyLeave', { x: c.seatX, y: c.seatY });
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
        const cm = getCardMultipliers(gs);
        let patienceDrain = 1 + (playerCount - 1) * 0.1;
        if (gs.dayTimer <= DAY_TICKS * 0.25) patienceDrain *= 1.2;
        // quick istek: sabır 2x hızlı azalır
        if (c.specialRequest === 'quick') patienceDrain *= QUICK_PATIENCE_DRAIN;
        // patienceMult < 1 = daha sabırsız, > 1 = daha sabırlı
        patienceDrain = patienceDrain / cm.patienceMult;
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
