import { Server } from "socket.io";
import {
  GameState,
  DAY_TICKS, EAT_TICKS,
  GAME_HEIGHT, EXTERIOR_Y,
} from "../shared/types.js";
import { DIALOGUES } from "../shared/dialogues.js";
import { getCardMultipliers } from "./cardLogic.js";
import { DOOR_X } from "../shared/constants.js";

export function customerTick(gs: GameState, io: Server, rid: string) {
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
      if (c.y < EXTERIOR_Y) {
        c.y = Math.min(EXTERIOR_Y, c.y + 4);
        c.x = c.doorX ?? DOOR_X;
      } else {
        c.y += 4;
      }
      if (c.y >= GAME_HEIGHT + 60) gs.customers.splice(i, 1);
      continue;
    }

    if (c.phase === 'entering') {
      if (c.y > (EXTERIOR_Y - 10)) {
        c.y = Math.max(EXTERIOR_Y - 10, c.y - 3);
      } else {
        c.phase = 'seating';
        c.targetY = c.seatY;
      }
      continue;
    }

    if (c.isEating) {
      const eatCm = getCardMultipliers(gs);
      c.eatTimer -= eatCm.eatSpeedMult < 1 ? Math.ceil(1 / eatCm.eatSpeedMult) : 1;
      if (!c.currentDialog && Math.random() < 0.001) {
        const list = DIALOGUES[c.personality].eating;
        c.currentDialog = list[Math.floor(Math.random() * list.length)];
        c.dialogTimer = 180;
      }
      if (c.eatTimer <= 0) {
        gs.dirtyTables.push({ seatX: c.seatX, seatY: c.seatY, tip: c.tipAmount || 0 });
        c.isLeaving = true; c.isSeated = false; c.targetY = GAME_HEIGHT + 60;
        if (Math.random() < 0.4) {
          const list = DIALOGUES[c.personality].leaving_happy;
          c.currentDialog = list[Math.floor(Math.random() * list.length)];
          c.dialogTimer = 180;
          io.to(rid).emit('happyLeave', { x: c.seatX, y: c.seatY });
        }
        // tryQueueSeat is called from gameTick after customerTick
        gs._needsQueueSeat = true;
      }
      continue;
    }

    if (!c.isSeated) {
      if (c.y > c.targetY) c.y = Math.max(c.targetY, c.y - 3);
      else if (c.y < c.targetY) c.y = Math.min(c.targetY, c.y + 3);
      if (c.x < c.seatX) c.x = Math.min(c.seatX, c.x + 3);
      else if (c.x > c.seatX) c.x = Math.max(c.seatX, c.x - 3);
      if (Math.abs(c.x - c.seatX) < 2 && Math.abs(c.y - c.targetY) < 2) {
        c.x = c.seatX; c.y = c.targetY;
        c.isSeated = true; c.phase = 'seated';
      }
    } else {
      if (!c.currentDialog && Math.random() < 0.001) {
        const list = DIALOGUES[c.personality].waiting;
        c.currentDialog = list[Math.floor(Math.random() * list.length)];
        c.dialogTimer = 180;
      }
      if (gs.dayPhase === 'day') {
        const playerCount = Object.keys(gs.players).length || 1;
        const cm = getCardMultipliers(gs);
        let patienceDrain = playerCount === 1 ? 0.75 : (playerCount <= 2 ? 0.85 : 1.0); // Sabır azalma hızı solo ve küçük gruplar için düşürüldü
        if (gs.dayTimer <= DAY_TICKS * 0.25) patienceDrain *= 1.2;
        patienceDrain = patienceDrain / cm.patienceMult;
        const baseDrain = Math.floor(patienceDrain);
        const actualDrain = baseDrain + (Math.random() < (patienceDrain - baseDrain) ? 1 : 0);

        if (!c.isEating && c.wants) {
          c.patience -= actualDrain;
          // Sabır %15'e düştüğünde bir kez acil uyarı gönder
          if (!c.urgentEmitted && c.patience <= c.maxPatience * 0.15 && c.patience > 0) {
            c.urgentEmitted = true;
            io.to(rid).emit('urgentCustomer', { x: c.seatX, y: c.seatY });
          }
          if (c.patience <= 0) {
            gs.score = Math.max(0, gs.score - 10);
            gs.lives = Math.max(0, gs.lives - 1);
            io.to(rid).emit("sound", "fail");
            io.to(rid).emit("loseHeart", { x: c.seatX, y: c.seatY, amount: 1 });
            if (gs.lives <= 0) {
              gs.isGameOver = true;
              gs.dayPhase = 'night';
              gs.customers = []; gs.waitList = []; gs.dirtyTables = [];
              io.to(rid).emit("state", gs);
              io.to(rid).emit("sound", "fail");
              break;
            }
            c.isLeaving = true; c.isSeated = false; c.targetY = GAME_HEIGHT + 60;
            const list = DIALOGUES[c.personality].leaving_angry;
            c.currentDialog = list[Math.floor(Math.random() * list.length)];
            c.dialogTimer = 180;
            gs._needsQueueSeat = true;
          }
        }
      }
    }
  }
}
