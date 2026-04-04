import {
  GameState, INGREDIENTS, TRAY_STATION, TRASH_STATION, PLATE_STACK_POS,
  DIRTY_TRAY_POS, SINK_STATION, SERVICE_WINDOW_SLOTS, SERVICE_WINDOW_R,
  RECIPE_DEFS,
} from "../types/game";

const INTERACT_R = 110;
const COOK_R = 145;
const SERVE_R = 125;
const DISTANCE_TOLERANCE = 25; // Yakın objeler için tolerans

interface InteractableCandidate {
  x: number;
  y: number;
  distance: number;
  type: string;
  id?: string;
}

/**
 * Profesyonel hibrit etkileşim sistemi:
 * 1. Tek obje varsa onu seç
 * 2. Birden fazla varsa mesafe + yön kombinasyonu kullan
 */
export function getNearestInteractable(px: number, py: number, gs: GameState, lastMoveX = 0, lastMoveY = 0) {
  const candidates: InteractableCandidate[] = [];

  function addCandidate(x: number, y: number, radius: number, type: string, id?: string) {
    const distance = Math.hypot(px - x, py - y);
    if (distance < radius) {
      candidates.push({ x, y, distance, type, id });
    }
  }

  // Servis penceresi
  if (gs.serviceWindow?.length) {
    SERVICE_WINDOW_SLOTS.forEach(s => addCandidate(s.x, s.y, SERVICE_WINDOW_R, 'serviceWindow'));
  }

  // Lavabolar
  gs.sinks?.forEach(s => {
    const x = gs.stationLayout?.[s.id]?.x ?? s.x;
    const y = gs.stationLayout?.[s.id]?.y ?? s.y;
    addCandidate(x, y, INTERACT_R, 'sink', s.id);
  });

  // Çöp kutusu
  const trashPos = gs.stationLayout?.['trash'] ?? TRASH_STATION;
  addCandidate(trashPos.x, trashPos.y, INTERACT_R, 'trash');

  // Tepsi istasyonu
  const trayPos = gs.stationLayout?.['tray'] ?? TRAY_STATION;
  addCandidate(trayPos.x, trayPos.y, INTERACT_R, 'trayStation');

  // Kirli tepsi sepeti
  const dirtyTrayPos = gs.stationLayout?.['dirty_tray'] ?? DIRTY_TRAY_POS;
  addCandidate(dirtyTrayPos.x, dirtyTrayPos.y, INTERACT_R, 'dirtyTrayBasket');

  // Kirli masalar
  gs.dirtyTables?.forEach((t, idx) => addCandidate(t.seatX, t.seatY, SERVE_R, 'dirtyTable', `dirty_${idx}`));

  // Tabak yığını
  const platePos = gs.stationLayout?.['plate_stack'] ?? PLATE_STACK_POS;
  addCandidate(platePos.x, platePos.y, PLATE_STACK_POS.radius, 'plateStack');

  // Kesme tahtaları
  gs.choppingBoards?.forEach(b => {
    const x = gs.stationLayout?.[b.id]?.x ?? b.x;
    const y = gs.stationLayout?.[b.id]?.y ?? b.y;
    addCandidate(x, y, INTERACT_R, 'choppingBoard', b.id);
  });


  // Fritözler — sadece 🍟 unlock edilmişse
  if (gs.unlockedDishes?.includes('🍟')) {
    gs.fryers?.forEach(f => {
      const x = gs.stationLayout?.[f.id]?.x ?? f.x;
      const y = gs.stationLayout?.[f.id]?.y ?? f.y;
      addCandidate(x, y, INTERACT_R, 'fryer', f.id);
    });
  }

  // Buzdolapları — sadece 🥤 unlock edilmişse
  if (gs.unlockedDishes?.includes('🥤')) {
    gs.fridges?.forEach(f => {
      const x = gs.stationLayout?.[f.id]?.x ?? f.x;
      const y = gs.stationLayout?.[f.id]?.y ?? f.y;
      addCandidate(x, y, INTERACT_R, 'fridge', f.id);
    });
  }

  // Pasta fırınları — sadece 🍰 unlock edilmişse
  if (gs.unlockedDishes?.includes('🍰')) {
    gs.cakeBakers?.forEach(c => {
      const x = gs.stationLayout?.[c.id]?.x ?? c.x;
      const y = gs.stationLayout?.[c.id]?.y ?? c.y;
      addCandidate(x, y, INTERACT_R, 'cakeBaker', c.id);
    });
  }

  // Kahve makineleri — sadece ☕ unlock edilmişse
  if (gs.unlockedDishes?.includes('☕')) {
    gs.coffeeMachines?.forEach(c => {
      const x = gs.stationLayout?.[c.id]?.x ?? c.x;
      const y = gs.stationLayout?.[c.id]?.y ?? c.y;
      addCandidate(x, y, INTERACT_R, 'coffeeMachine', c.id);
    });
  }

  // Fırınlar
  gs.cookStations?.forEach(s => {
    const x = gs.stationLayout?.[s.id]?.x ?? s.x;
    const y = gs.stationLayout?.[s.id]?.y ?? s.y;
    addCandidate(x, y, COOK_R, 'cookStation', s.id);
  });

  // Müşteriler
  gs.customers?.forEach(c => {
    if (c.isSeated && !c.isEating) addCandidate(c.seatX, c.seatY, SERVE_R, 'customer', c.id);
  });

  // Malzemeler — sadece unlock edilmiş yemeklerin malzemeleri
  INGREDIENTS.forEach(ing => {
    const recipeKey = (ing.key in RECIPE_DEFS) ? ing.key : `CHOPPED_${ing.key}`;
    const recipe = RECIPE_DEFS[recipeKey as keyof typeof RECIPE_DEFS];
    // Fırın tarifi varsa o yemek unlock edilmişse göster
    if (recipe && !gs.unlockedDishes?.includes(recipe.output)) return;
    // 🥔 patates — 🍟 unlock edilmişse
    if (ing.key === '🥔' && !gs.unlockedDishes?.includes('🍟')) return;
    // 🧁 tatlı hamuru — 🍰 unlock edilmişse
    if (ing.key === '🧁' && !gs.unlockedDishes?.includes('🍰')) return;
    // Hiç yemek açılmamışsa malzeme etkileşime kapalı
    if (!recipe && !gs.unlockedDishes?.length) return;
    const dynPos = gs.stationLayout?.[`ingredient_${ing.key}`];
    addCandidate(dynPos?.x ?? ing.pos.x, dynPos?.y ?? ing.pos.y, INTERACT_R, 'ingredient', ing.key);
  });

  // ═══ PROFESYONELLİK SEÇİM ALGORİTMASI ═══

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return { x: candidates[0].x, y: candidates[0].y };

  // En yakın mesafeyi bul
  const minDistance = Math.min(...candidates.map(c => c.distance));

  // Tolerans dahilindeki yakın objeleri filtrele
  const closeOnes = candidates.filter(c => c.distance <= minDistance + DISTANCE_TOLERANCE);

  if (closeOnes.length === 1) return { x: closeOnes[0].x, y: closeOnes[0].y };

  // Birden fazla yakın obje varsa hareket yönüne göre seç
  if (Math.abs(lastMoveX) > 0.1 || Math.abs(lastMoveY) > 0.1) {
    const playerDirection = Math.atan2(lastMoveY, lastMoveX);

    const scored = closeOnes.map(candidate => {
      const objDirection = Math.atan2(candidate.y - py, candidate.x - px);
      let angleDiff = objDirection - playerDirection;

      // Açı farkını -π ile π arasına normalize et
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      // Yön skoru: önde olan objeler daha yüksek skor alır
      const directionScore = Math.cos(angleDiff); // 1 (önde) ile -1 (arkada) arası
      const distanceScore = 1 - (candidate.distance / (minDistance + DISTANCE_TOLERANCE));

      // %70 yön, %30 mesafe
      const totalScore = directionScore * 0.7 + distanceScore * 0.3;

      return { ...candidate, score: totalScore };
    });

    // En yüksek skoru seç
    const best = scored.reduce((a, b) => a.score > b.score ? a : b);
    return { x: best.x, y: best.y };
  }

  // Hareket yoksa en yakını seç
  const nearest = candidates.reduce((a, b) => a.distance < b.distance ? a : b);
  return { x: nearest.x, y: nearest.y };
}
