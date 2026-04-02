import { GameState, ALL_CARDS, CARD_DAYS, DISH_UNLOCK_POOL } from "../shared/types.js";

export function generateMenuChoices(gs: GameState): void {
  const locked = [...DISH_UNLOCK_POOL].filter((d: string) => !gs.unlockedDishes.includes(d));
  if (locked.length === 0) { gs.menuChoices = null; return; }
  const shuffled = locked.sort(() => Math.random() - 0.5);
  gs.menuChoices = shuffled.slice(0, 1);
}

export function generateCardChoices(gs: GameState): void {
  const activeIds = new Set(gs.activeCards.map(c => c.id));
  const earlyExclude = new Set(['turbo_day', 'mystery_guests']);
  const pool = ALL_CARDS.filter(c =>
    !activeIds.has(c.id) &&
    (gs.day >= 8 || !earlyExclude.has(c.id))
  );
  if (pool.length === 0) { gs.pendingCardChoices = null; return; }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  gs.pendingCardChoices = shuffled.slice(0, 2);
}

export function getCardMultipliers(gs: GameState) {
  const has = (id: string) => gs.activeCards.some(c => c.id === id);
  return {
    patienceMult:    has('impatient_crowd') ? 0.80 : has('low_season') ? 1.50 : has('blind_patience') ? 1.15 : 1.0,
    spawnMult:       has('busy_day') ? 1.30 : has('low_season') ? 0.80 : has('rainy_day') ? 1.10 : 1.0,
    burnMult:        has('hot_oven') ? 0.70 : 1.0,
    cookMult:        has('hot_oven') ? 0.70 : has('turbo_day') ? 0.80 : has('chop_pressure') ? 1.0 : 1.0,
    chopMult:        has('chop_pressure') ? 1.25 : 1.0,
    choppedCookMult: has('chop_pressure') ? 0.60 : 1.0,
    tipMult:         has('lucky_day') ? 2.0 : has('kaos_day') ? 1.50 : has('mystery_guests') ? 1.30 : has('rush_customers') ? 1.25 : 1.0,
    earnBonus:       has('impatient_crowd') ? 3 : 0,
    drinkTipBonus:   has('cold_chain') ? 10 : 0,
    plateBonusScore: has('few_plates') ? 2 : 0,
    upgradeCostMult: has('expensive_day') ? 1.25 : has('busy_day') ? 0.85 : 1.0,
    movementMult:    has('turbo_day') ? 0.85 : 1.0,
    hidePatience:    has('blind_patience'),
    hidePersonality: has('mystery_guests'),
    rudeChanceMult:  has('rude_day') ? 1.40 : 1.0,
    rudePunchBonus:  has('rude_day') ? 15 : 0,
    endDayBonus:     has('expensive_day') ? 50 : 0,
    eatSpeedMult:    has('rush_customers') ? 0.75 : 1.0,
  };
}
