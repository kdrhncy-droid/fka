import { Server, Socket } from "socket.io";
import { GameState } from "../shared/types.js";
import { generateCardChoices } from "./gameLoop.js";
import { RoomManager } from "./roomManager.js";

export function registerDevHandlers(
  socket: Socket,
  io: Server,
  getRoomId: () => string | null,
  getRoomState: (rid: string) => GameState | undefined
) {
  const guard = () => {
    const rid = getRoomId();
    if (!rid) return null;
    return getRoomState(rid) ? { rid, gs: getRoomState(rid)! } : null;
  };

  socket.on("dev:makeNight", () => {
    const r = guard(); if (!r) return;
    r.gs.customers = []; r.gs.waitList = []; r.gs.dirtyTables = [];
    r.gs.dayTimer = 1;
    io.to(r.rid).emit("state", r.gs);
  });

  socket.on("dev:spawnCustomer", (data: { personality?: string }) => {
    const r = guard(); if (!r) return;
    if (r.gs.dayPhase !== 'day') return;
    const pers = (data?.personality ?? 'polite') as any;
    const bodyColors: Record<string, string[]> = {
      polite: ['#3b82f6'], rude: ['#ef4444'], recep: ['#7c3aed'], thug: ['#000000'],
    };
    r.gs.waitList.push({
      id: Math.random().toString(36).slice(2, 9),
      wants: r.gs.unlockedDishes[0] ?? '🥗',
      personality: pers,
      bodyShape: 1, bodyColor: (bodyColors[pers] ?? ['#3b82f6'])[0],
      groupId: undefined,
    });
    io.to(r.rid).emit("state", r.gs);
  });

  socket.on("dev:triggerCards", () => {
    const r = guard(); if (!r) return;
    if (r.gs.dayPhase !== 'night') return;
    generateCardChoices(r.gs);
    io.to(r.rid).emit("state", r.gs);
  });

  socket.on("dev:unlockDish", (dish: string) => {
    const r = guard(); if (!r) return;
    if (!r.gs.unlockedDishes.includes(dish)) r.gs.unlockedDishes.push(dish);
    io.to(r.rid).emit("state", r.gs);
  });

  socket.on("dev:addScore", (amount: number) => {
    const r = guard(); if (!r) return;
    r.gs.score = Math.max(0, r.gs.score + (amount ?? 0));
    io.to(r.rid).emit("state", r.gs);
  });

  socket.on("dev:setLives", (lives: number) => {
    const r = guard(); if (!r) return;
    r.gs.lives = Math.max(1, Math.min(3, lives ?? 3));
    io.to(r.rid).emit("state", r.gs);
  });

  socket.on("dev:triggerRevenge", () => {
    const r = guard(); if (!r) return;
    io.to(r.rid).emit("revengeScene", { day: r.gs.day, score: r.gs.score, lives: r.gs.lives });
  });

  socket.on("dev:runTest", (testType: 'basic' | 'combo' | 'stress' | 'visual') => {
    const r = guard(); if (!r) return;
    console.log(`🤖 Test başlatılıyor: ${testType}`);
    switch (testType) {
      case 'basic':   runBasicTest(r.gs, io, r.rid, socket); break;
      case 'combo':   runComboTest(r.gs, io, r.rid, socket); break;
      case 'stress':  runStressTest(r.gs, io, r.rid, socket); break;
      case 'visual':  runVisualTest(r.gs, io, r.rid, socket); break;
    }
  });
}

// ─── Test Fonksiyonları ───────────────────────────────────────────────────────
function runBasicTest(gs: GameState, io: Server, roomId: string, socket: Socket) {
  let step = 0;
  const steps = [
    () => {
      gs.customers.push({ id: 'test-1', x: 100, y: 300, seatX: 200, seatY: 300, targetY: 300, wants: '🍕', specialRequest: null, patience: 100, maxPatience: 100, isSeated: false, isEating: false, eatTimer: 0, tipAmount: 0, personality: 'polite', bodyShape: 1, bodyColor: '#8B4513', phase: 'entering' });
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ Müşteri spawn edildi");
    },
    () => {
      const c = gs.customers.find(c => c.id === 'test-1');
      if (c) { c.isSeated = true; c.isEating = true; c.eatTimer = 60; gs.score += 15; gs.comboCount++; }
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ Pizza servis edildi");
    },
    () => {
      gs.customers = gs.customers.filter(c => c.id !== 'test-1');
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "🎉 Temel Test tamamlandı!");
    },
  ];
  const run = () => { if (step < steps.length) { steps[step++](); setTimeout(run, 2000); } };
  run();
}

function runComboTest(gs: GameState, io: Server, roomId: string, socket: Socket) {
  let step = 0;
  const steps = [
    () => {
      for (let i = 0; i < 3; i++) {
        gs.customers.push({ id: `combo-${i}`, x: 100 + i * 50, y: 300, seatX: 200 + i * 50, seatY: 300, targetY: 300, wants: '🍕', specialRequest: null, patience: 100, maxPatience: 100, isSeated: false, isEating: false, eatTimer: 0, tipAmount: 0, personality: 'polite', bodyShape: 1, bodyColor: '#8B4513', phase: 'entering' });
      }
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ 3 müşteri spawn edildi");
    },
    () => {
      gs.customers.filter(c => c.id.startsWith('combo-')).forEach(c => { c.isSeated = true; c.isEating = true; c.eatTimer = 60; gs.score += 15; gs.comboCount++; });
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", `🔥 Combo: ${gs.comboCount}`);
    },
    () => {
      gs.customers = gs.customers.filter(c => !c.id.startsWith('combo-'));
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "🎉 Combo Test tamamlandı!");
    },
  ];
  const run = () => { if (step < steps.length) { steps[step++](); setTimeout(run, 3000); } };
  run();
}

function runStressTest(gs: GameState, io: Server, roomId: string, socket: Socket) {
  socket.emit("testLog", "⚡ Stress Test — 10 müşteri spawn ediliyor...");
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      gs.customers.push({ id: `stress-${i}`, x: 50 + (i % 5) * 100, y: 250 + Math.floor(i / 5) * 100, seatX: 200 + (i % 5) * 100, seatY: 300 + Math.floor(i / 5) * 100, targetY: 300 + Math.floor(i / 5) * 100, wants: ['🍕', '🍜', '🌯', '🍟', '🥤'][i % 5] as any, specialRequest: null, patience: 100, maxPatience: 100, isSeated: false, isEating: false, eatTimer: 0, tipAmount: 0, personality: ['polite', 'rude', 'recep', 'thug'][i % 4] as any, bodyShape: (i % 4 + 1) as any, bodyColor: '#8B4513', phase: 'entering' });
      io.to(roomId).emit("state", gs);
    }, i * 200);
  }
  setTimeout(() => {
    gs.customers = gs.customers.filter(c => !c.id.startsWith('stress-'));
    io.to(roomId).emit("state", gs);
    socket.emit("testLog", "🎉 Stress Test tamamlandı!");
  }, 8000);
}

function runVisualTest(gs: GameState, io: Server, roomId: string, socket: Socket) {
  let step = 0;
  const steps = [
    () => { gs.comboCount = 5; gs.comboTimer = 300; io.to(roomId).emit("state", gs); socket.emit("testLog", "🔥 Combo efekti tetiklendi"); },
    () => {
      ['polite', 'rude', 'recep', 'thug'].forEach((p, i) => {
        gs.customers.push({ id: `visual-${p}`, x: 100 + i * 150, y: 200, seatX: 200 + i * 150, seatY: 300, targetY: 300, wants: '🍕', specialRequest: null, patience: 100 - i * 20, maxPatience: 100, isSeated: false, isEating: false, eatTimer: 0, tipAmount: 0, personality: p as any, bodyShape: (i % 4 + 1) as any, bodyColor: '#8B4513', phase: 'entering' });
      });
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "✅ 4 müşteri tipi spawn edildi");
    },
    () => { gs.dayPhase = 'night'; io.to(roomId).emit("state", gs); socket.emit("testLog", "🌙 Gece modu"); },
    () => {
      gs.customers = gs.customers.filter(c => !c.id.startsWith('visual-'));
      gs.dayPhase = 'prep'; gs.comboCount = 0; gs.comboTimer = 0;
      io.to(roomId).emit("state", gs);
      socket.emit("testLog", "🎉 Görsel Test tamamlandı!");
    },
  ];
  const run = () => { if (step < steps.length) { steps[step++](); setTimeout(run, 3000); } };
  run();
}
