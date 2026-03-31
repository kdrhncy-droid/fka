import { Socket } from "socket.io-client";
import { GameState, GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED, WALL_Y1, WALL_Y2, isInDoor, TABLE_HALF_W, TABLE_HALF_H, EXTERIOR_Y } from "../types/game";
import React from "react";

interface Props {
  socket: Socket | null;
  gameStateRef: React.MutableRefObject<GameState>;
  localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
  keysRef: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
}

export function movePlayer(
  time: number,
  lastEmitRef: React.MutableRefObject<number>,
  frameScale: number,
  { socket, gameStateRef, localPlayerRef, keysRef, joystickVectorRef }: Props,
): { dx: number; dy: number } {
  let dx = 0, dy = 0;

  if (keysRef.current.w || (keysRef.current as any).ArrowUp)    dy -= 1;
  if (keysRef.current.s || (keysRef.current as any).ArrowDown)  dy += 1;
  if (keysRef.current.a || (keysRef.current as any).ArrowLeft)  dx -= 1;
  if (keysRef.current.d || (keysRef.current as any).ArrowRight) dx += 1;

  if (dx === 0 && dy === 0) {
    dx = joystickVectorRef.current.x;
    dy = joystickVectorRef.current.y;
  }

  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0.1) {
    const mul = dist > 1 ? 1 / dist : 1;
    dx = dx * mul * PLAYER_SPEED * frameScale;
    dy = dy * mul * PLAYER_SPEED * frameScale;
  }

  if (Math.abs(dx) <= 0.1 && Math.abs(dy) <= 0.1) return { dx: 0, dy: 0 };

  const lp = localPlayerRef.current;
  let nx = Math.max(30, Math.min(GAME_WIDTH - 30, lp.x + dx));
  let ny = Math.max(20, Math.min(GAME_HEIGHT - 20, lp.y + dy));

  const wasAbove = lp.y < WALL_Y1;
  const wasBelow = lp.y > WALL_Y2;
  if ((wasAbove && ny >= WALL_Y1) || (wasBelow && ny <= WALL_Y2)) {
    if (!isInDoor(nx)) ny = wasAbove ? WALL_Y1 - 1 : WALL_Y2 + 1;
  }

  // Ön duvar (salon → dış alan) — sadece kapıdan geçilebilir
  const FRONT_WALL = EXTERIOR_Y;
  const wasInsideSalon = lp.y < FRONT_WALL;
  const wasOutside = lp.y >= FRONT_WALL;
  if ((wasInsideSalon && ny >= FRONT_WALL) || (wasOutside && ny < FRONT_WALL)) {
    // Kapı: x 580-700
    const inFrontDoor = nx >= 580 && nx <= 700;
    if (!inFrontDoor) ny = wasInsideSalon ? FRONT_WALL - 1 : FRONT_WALL + 1;
  }

  const PR = 16;
  
  // Masa collision'ları
  const tableLayout = gameStateRef.current.tableLayout ?? {};
  for (const t of Object.values(tableLayout) as { id: string; x: number; y: number }[]) {
    const left = t.x - TABLE_HALF_W, right = t.x + TABLE_HALF_W;
    const top = t.y - TABLE_HALF_H, bottom = t.y + TABLE_HALF_H;
    if (nx + PR > left && nx - PR < right && ny + PR > top && ny - PR < bottom) {
      const oL = (nx + PR) - left, oR = right - (nx - PR);
      const oT = (ny + PR) - top,  oB = bottom - (ny - PR);
      const min = Math.min(oL, oR, oT, oB);
      if (min === oL) nx = left - PR;
      else if (min === oR) nx = right + PR;
      else if (min === oT) ny = top - PR;
      else ny = bottom + PR;
    }
  }

  lp.x = nx;
  lp.y = ny;

  if (time - lastEmitRef.current > 33 && socket) {
    socket.emit("move", { x: nx, y: ny });
    lastEmitRef.current = time;
  }

  return { dx, dy };
}
