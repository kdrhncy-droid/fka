import { InteractionHandler } from './utils.js';
import { CLEAN_PLATE, DIRTY_PLATE, CHOPPABLE, isChopped } from "../../shared/types.js";
import { getStationPos } from './utils.js';
import { INTERACT_R } from '../../shared/constants.js';

export const handleSinks: InteractionHandler = ({ gs, p, px, py, socketId, snd }) => {
  if (!gs.sinks) return false;
  for (const sink of gs.sinks) {
    const { x: dynX, y: dynY } = getStationPos(gs, sink);
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding) {
        if (sink.input === CLEAN_PLATE) {
          p.holding = CLEAN_PLATE;
          sink.input = null; sink.progress = 0; sink.isWashing = false; sink.washingPlayerId = null;
          snd("pickup");
        } else if (sink.input === DIRTY_PLATE && !sink.isWashing) {
          sink.isWashing = true; sink.washingPlayerId = socketId;
        }
      } else if (p.holding === DIRTY_PLATE && !sink.input) {
        sink.input = DIRTY_PLATE; sink.progress = 0;
        sink.isWashing = true; sink.washingPlayerId = socketId; 
        p.holding = null;
        snd("success");
      } else {
        snd("fail");
      }
      return true;
    }
  }
  return false;
};

export const handleChoppingBoards: InteractionHandler = ({ gs, p, px, py, snd }) => {
  if (!gs.choppingBoards) return false;
  for (const board of gs.choppingBoards) {
    const { x: dynX, y: dynY } = getStationPos(gs, board);
    if (Math.hypot(px - dynX, py - dynY) < INTERACT_R) {
      if (!p.holding) {
        if (board.input && !isChopped(board.input)) {
          p.holding = board.input; board.input = null; board.progress = 0; board.isChopping = false; board.choppingPlayerId = null; snd("pickup");
        } else if (board.input && isChopped(board.input)) {
          p.holding = board.input; board.input = null; board.progress = 0; board.isChopping = false; board.choppingPlayerId = null; snd("success");
        }
      } else if (p.holding === CLEAN_PLATE && board.input && isChopped(board.input)) {
        snd("fail");
      } else if (CHOPPABLE.includes(p.holding as any) && !board.input) {
        board.input = p.holding; board.progress = 0; board.isChopping = false; board.choppingPlayerId = null; p.holding = null; snd("success");
      } else {
        snd("fail");
      }
      return true;
    }
  }
  return false;
};
