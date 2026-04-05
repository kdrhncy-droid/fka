/**
 * İstasyon Kayıt Defteri
 *
 * Yeni bir istasyon veya malzeme eklendiğinde SADECE bu dosyaya dokunmak yeterli.
 * Render, etkileşim, layout editor hepsi buradan okur.
 */

/** İstasyon ID → gerekli yemek */
export const STATION_UNLOCK_MAP: Record<string, string> = {
  fryer1:      '🍟',
  fridge1:     '🥤',
  cakebaker1:  '🍰',
  coffee1:     '☕',
};

/** Malzeme key → gerekli yemek */
export const INGREDIENT_UNLOCK_MAP: Record<string, string> = {
  '🥔': '🍟',
  '🧁': '🍰',
};

/** İstasyon açık mı? */
export function isStationUnlocked(stationId: string, unlockedDishes: string[]): boolean {
  const required = STATION_UNLOCK_MAP[stationId];
  return !required || unlockedDishes.includes(required);
}

/** Malzeme alınabilir mi? */
export function isIngredientUnlocked(key: string, unlockedDishes: string[]): boolean {
  const required = INGREDIENT_UNLOCK_MAP[key];
  return !required || unlockedDishes.includes(required);
}
