import { GameState, INGREDIENTS, RECIPE_DEFS, TRAY_STATION, TRASH_STATION } from "../types/game";
import { drawStation } from "./drawStation";

export function drawBasicStations(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  movingId?: string | null
) {
  // Ingredients
  INGREDIENTS.forEach((ing) => {
    const recipeKey = (ing.key in RECIPE_DEFS) ? ing.key : `CHOPPED_${ing.key}`;
    const recipe = RECIPE_DEFS[recipeKey as keyof typeof RECIPE_DEFS];
    if (recipe && !state.unlockedDishes.includes(recipe.output)) return;
    // 🥔 patates — fritöz sistemi, RECIPE_DEFS'te yok, 🍟 unlock kontrolü
    if (ing.key === '🥔' && !state.unlockedDishes.includes('🍟')) return;
    // 🧁 tatlı hamuru — pasta fırını sistemi, 🍰 unlock kontrolü
    if (ing.key === '🧁' && !state.unlockedDishes.includes('🍰')) return;
    if (movingId === `ingredient_${ing.key}`) return;
    
    // stationLayout'tan dinamik koordinat al, yoksa sabit koordinata düş
    const dynPos = state.stationLayout?.[`ingredient_${ing.key}`];
    const px = dynPos?.x ?? ing.pos.x;
    const py = dynPos?.y ?? ing.pos.y;
    drawStation(ctx, px, py, ing.color, ing.key, ing.label);
  });

  // Tepsi
  const trayPos = state.stationLayout?.['tray'] ?? TRAY_STATION;
  if (movingId !== 'tray') drawStation(ctx, trayPos.x, trayPos.y, "#8b5a2b", "🍽️", "Tepsi");

  // Çöp kovası
  const trashPos = state.stationLayout?.['trash'] ?? TRASH_STATION;
  if (movingId !== 'trash') drawStation(ctx, trashPos.x, trashPos.y, "#78716c", "🗑️", "Çöp");
}
