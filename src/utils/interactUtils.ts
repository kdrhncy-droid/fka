import {
  GameState, INGREDIENTS, TRAY_STATION, TRASH_STATION, PLATE_STACK_POS,
  DIRTY_TRAY_POS, SINK_STATION, SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R,
  SPICE_RACK_POS,
} from "../types/game";

const INTERACT_R = 110;
const SERVE_R = 125;

/**
 * Oyuncunun (px, py) koordinatlarına en yakın etkileşim kurulabilir objeyi bulur.
 * Server'daki INTERACTION_CHAIN ile birebir aynı istasyonları kapsar.
 */
export function getNearestInteractable(px: number, py: number, gs: GameState) {
  let nearest: { x: number; y: number } | null = null;
  let minDist = Infinity;

  function check(x: number, y: number, radius = INTERACT_R) {
    const d = Math.hypot(px - x, py - y);
    if (d < radius && d < minDist) {
      minDist = d;
      nearest = { x, y };
    }
  }

  // Servis penceresi
  if (gs.serviceWindow?.length) {
    SERVICE_WINDOW_SLOTS.forEach(s => check(s.x, s.y, SERVICE_WINDOW_R));
  }

  // Lavabolar
  gs.sinks?.forEach(s => {
    const x = gs.stationLayout?.[s.id]?.x ?? s.x;
    const y = gs.stationLayout?.[s.id]?.y ?? s.y;
    check(x, y);
  });

  // Çöp kutusu
  const trashPos = gs.stationLayout?.['trash'] ?? TRASH_STATION;
  check(trashPos.x, trashPos.y);

  // Tepsi istasyonu
  const trayPos = gs.stationLayout?.['tray'] ?? TRAY_STATION;
  check(trayPos.x, trayPos.y);

  // Kirli tepsi sepeti
  const dirtyTrayPos = gs.stationLayout?.['dirty_tray'] ?? DIRTY_TRAY_POS;
  check(dirtyTrayPos.x, dirtyTrayPos.y);

  // Kirli masalar
  gs.dirtyTables?.forEach(t => check(t.seatX, t.seatY, SERVE_R));

  // Tabak yığını
  const platePos = gs.stationLayout?.['plate_stack'] ?? PLATE_STACK_POS;
  check(platePos.x, platePos.y, PLATE_STACK_POS.radius);

  // Kesme tahtaları
  gs.choppingBoards?.forEach(b => {
    const x = gs.stationLayout?.[b.id]?.x ?? b.x;
    const y = gs.stationLayout?.[b.id]?.y ?? b.y;
    check(x, y);
  });

  // Baharat rafı — gün 3'ten sonra
  if (gs.day >= 3) {
    const spicePos = gs.stationLayout?.['spice_rack'] ?? SPICE_RACK_POS;
    check(spicePos.x, spicePos.y);
  }

  // Fritözler
  gs.fryers?.forEach(f => {
    const x = gs.stationLayout?.[f.id]?.x ?? f.x;
    const y = gs.stationLayout?.[f.id]?.y ?? f.y;
    check(x, y);
  });

  // Buzdolapları
  gs.fridges?.forEach(f => {
    const x = gs.stationLayout?.[f.id]?.x ?? f.x;
    const y = gs.stationLayout?.[f.id]?.y ?? f.y;
    check(x, y);
  });

  // Pasta fırınları
  gs.cakeBakers?.forEach(c => {
    const x = gs.stationLayout?.[c.id]?.x ?? c.x;
    const y = gs.stationLayout?.[c.id]?.y ?? c.y;
    check(x, y);
  });

  // Kahve makineleri
  gs.coffeeMachines?.forEach(c => {
    const x = gs.stationLayout?.[c.id]?.x ?? c.x;
    const y = gs.stationLayout?.[c.id]?.y ?? c.y;
    check(x, y);
  });

  // Fırınlar
  gs.cookStations?.forEach(s => {
    const x = gs.stationLayout?.[s.id]?.x ?? s.x;
    const y = gs.stationLayout?.[s.id]?.y ?? s.y;
    check(x, y);
  });

  // Müşteriler
  gs.customers?.forEach(c => {
    if (c.isSeated && !c.isEating) check(c.seatX, c.seatY, SERVE_R);
  });

  // Malzemeler
  INGREDIENTS.forEach(ing => {
    const dynPos = gs.stationLayout?.[`ingredient_${ing.key}`];
    check(dynPos?.x ?? ing.pos.x, dynPos?.y ?? ing.pos.y);
  });

  return nearest;
}
