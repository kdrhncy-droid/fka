import { GameState } from "../types/game";
import React from "react";

const MAX_HEAR_DIST = 350;

export function updateProximityAudio(
  audioElementsRef: React.MutableRefObject<Record<string, HTMLAudioElement>>,
  localPlayerRef: React.MutableRefObject<{ x: number; y: number }>,
  players: GameState["players"],
  myId: string,
  globalVolume: number,
) {
  if (!players[myId]) return;
  const lp = localPlayerRef.current;

  Object.entries(audioElementsRef.current).forEach(([socketId, el]) => {
    const audioEl = el as HTMLAudioElement;
    const other = players[socketId];
    if (!other) { audioEl.volume = 0; return; }
    const dist = Math.hypot(lp.x - other.x, lp.y - other.y);
    audioEl.volume = Math.max(0, Math.min(1, 1 - dist / MAX_HEAR_DIST)) * globalVolume;
  });
}
