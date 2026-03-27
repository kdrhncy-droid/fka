import { GAME_WIDTH, GAME_HEIGHT } from "../types/game";
import { drawFloor } from "./drawFloor";
import { drawTable } from "./drawTable";

const FLOOR_CACHE_VERSION = 9;
let floorCache: OffscreenCanvas | HTMLCanvasElement | null = null;
let floorCacheVersion = 0;
let cachedUnlockedDishes = "";

export function drawFloorCached(
  ctx: CanvasRenderingContext2D,
  unlockedDishes: string[] = [],
  forceRedraw = false,
  ingredientPositions?: Record<string, { x: number; y: number }>,
  tablePositions?: Record<string, { id: string; x: number; y: number }>,
  movingTableId?: string | null,
  plateStackPos?: { x: number; y: number },
  sinkPos?: { x: number; y: number },
  choppingBoardPos?: { x: number; y: number }
) {
  const currentDishesStr = [...unlockedDishes].sort().join(',');
  const ingPosStr = ingredientPositions
    ? Object.entries(ingredientPositions).map(([k, v]) => `${k}:${v.x},${v.y}`).join(';')
    : '';
  const tablePosStr = tablePositions
    ? Object.entries(tablePositions).map(([k, v]) => `${k}:${v.x},${v.y}`).join(';')
    : '';
  const platePosStr = plateStackPos ? `${plateStackPos.x},${plateStackPos.y}` : '';
  const sinkPosStr = sinkPos ? `${sinkPos.x},${sinkPos.y}` : '';
  const chopPosStr = choppingBoardPos ? `${choppingBoardPos.x},${choppingBoardPos.y}` : '';
  
  if (forceRedraw || floorCacheVersion !== FLOOR_CACHE_VERSION || cachedUnlockedDishes !== currentDishesStr + ingPosStr + tablePosStr + platePosStr + sinkPosStr + chopPosStr) {
    floorCache = null; 
    floorCacheVersion = FLOOR_CACHE_VERSION; 
    cachedUnlockedDishes = currentDishesStr + ingPosStr + tablePosStr + platePosStr + sinkPosStr + chopPosStr;
  }
  
  if (!floorCache) {
    floorCache = typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(GAME_WIDTH, GAME_HEIGHT)
      : Object.assign(document.createElement("canvas"), { width: GAME_WIDTH, height: GAME_HEIGHT });
    const offCtx = floorCache.getContext("2d");
    if (offCtx) {
      drawFloor(offCtx as unknown as CanvasRenderingContext2D, unlockedDishes, ingredientPositions, plateStackPos, sinkPos, choppingBoardPos);
      const tables = tablePositions ? Object.values(tablePositions) : [];
      tables.forEach((t) => {
        if (movingTableId === t.id) {
          (offCtx as unknown as CanvasRenderingContext2D).save();
          (offCtx as unknown as CanvasRenderingContext2D).globalAlpha = 0.4;
          drawTable(offCtx as unknown as CanvasRenderingContext2D, t.x, t.y);
          (offCtx as unknown as CanvasRenderingContext2D).restore();
        } else {
          drawTable(offCtx as unknown as CanvasRenderingContext2D, t.x, t.y);
        }
      });
    }
  }
  ctx.drawImage(floorCache, 0, 0);
}
