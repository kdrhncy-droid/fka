import { Server, Socket } from "socket.io";
import { GameState, DISH_ITEMS, COMBO_TIMEOUT_TICKS, getComboMultiplier, getComboLabel } from "../../shared/types.js";
import { getStationPos } from "../stationUtils.js";

export { getStationPos };

export interface InteractContext {
  gs: GameState;
  p: import("../../shared/types.js").Player;
  px: number;
  py: number;
  socketId: string;
  io: Server;
  roomId: string;
  snd: (type: string) => void;
  emitTip: (x: number, y: number, amount: number) => void;
}

export type InteractionHandler = (ctx: InteractContext) => boolean;

export function earn(lv: number, maxPatience: number, currentPatience: number, specialMult = 1.0) {
  const base = 10 + 5 * lv;
  const ratio = Math.max(0, currentPatience / maxPatience);
  let mult = 0.5;
  if (ratio > 0.8) mult = 2.0;
  else if (ratio > 0.5) mult = 1.5;
  else if (ratio > 0.2) mult = 1.0;
  else mult = 0.5;
  return Math.floor(base * mult * specialMult);
}

export function isDish(item: import("../../shared/types.js").Item): item is string { return !!item && DISH_ITEMS.includes(item as any); }

export function bcastSound(io: Server, roomId: string, socket: Socket, type: string) {
  if (type === 'fail') {
    socket.emit("sound", type);
  } else {
    io.to(roomId).emit("sound", type);
  }
}

export function applyCombo(gs: GameState, io: Server, roomId: string, x: number, y: number, baseTip: number) {
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
