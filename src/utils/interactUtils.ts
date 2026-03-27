import { GameState, INGREDIENTS, TRAY_STATION, TRASH_STATION, PLATE_STACK_POS, DIRTY_TRAY_POS } from "../types/game";

/**
 * Oyuncunun (px, py) koordinatlarına en yakın etkileşim kurulabilir objeyi bulur.
 * Etkileşim halkası (yeşil daire) çizimi için kullanılır.
 */
export function getNearestInteractable(px: number, py: number, gs: GameState) {
  let nearest = null;
  let minDist = 110; // INTERACT_R
  const candidates: { x: number; y: number; id?: string }[] = [];
  
  // 1. Dinamik İstasyonlar (cookStations, choppingBoards, sinks)
  if (gs.cookStations) {
    gs.cookStations.forEach(s => {
      const dyn = gs.stationLayout?.[s.id];
      candidates.push({ x: dyn?.x ?? s.x, y: dyn?.y ?? s.y });
    });
  }
  if (gs.choppingBoards) {
    gs.choppingBoards.forEach(b => {
      const dyn = gs.stationLayout?.[b.id];
      candidates.push({ x: dyn?.x ?? b.x, y: dyn?.y ?? b.y });
    });
  }
  if (gs.sinks) {
    gs.sinks.forEach(s => {
      const dyn = gs.stationLayout?.[s.id];
      candidates.push({ x: dyn?.x ?? s.x, y: dyn?.y ?? s.y });
    });
  }

  // 2. Masalar
  if (gs.tableLayout) {
    Object.values(gs.tableLayout).forEach(t => candidates.push({ x: t.x, y: t.y }));
  }

  // 3. Malzemeler
  INGREDIENTS.forEach(ing => {
    const dynPos = gs.stationLayout?.[`ingredient_${ing.key}`];
    candidates.push({ x: dynPos?.x ?? ing.pos.x, y: dynPos?.y ?? ing.pos.y });
  });

  // 4. Diğer Sabit İstasyonlar
  const trayPos = gs.stationLayout?.['tray'] ?? TRAY_STATION;
  candidates.push({ x: trayPos.x, y: trayPos.y });
  const trashPos = gs.stationLayout?.['trash'] ?? TRASH_STATION;
  candidates.push({ x: trashPos.x, y: trashPos.y });
  const platePos = gs.stationLayout?.['plate_stack'] ?? PLATE_STACK_POS;
  candidates.push({ x: platePos.x, y: platePos.y });
  const dirtyTrayPos = gs.stationLayout?.['dirty_tray'] ?? DIRTY_TRAY_POS;
  candidates.push({ x: dirtyTrayPos.x, y: dirtyTrayPos.y });

  candidates.forEach(obj => {
    const d = Math.hypot(px - obj.x, py - obj.y);
    if (d < minDist) { minDist = d; nearest = obj; }
  });
  
  return nearest;
}
