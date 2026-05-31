// ─── Günlük Hedef Sistemi ────────────────────────────────────────────────────

export type ObjectiveType = 'serve_n' | 'reach_combo' | 'no_life_loss' | 'serve_vip';

export interface DailyObjective {
  id: string;
  type: ObjectiveType;
  label: string;
  icon: string;
  target: number;
  progress: number;
  completed: boolean;
  failed: boolean;
  bonusCoins: number;
}

const POOL: Omit<DailyObjective, 'progress' | 'completed' | 'failed'>[] = [
  { id: 'serve_8',       type: 'serve_n',      label: '8 müşteri servis et',    icon: '🍽️',  target: 8,  bonusCoins: 25 },
  { id: 'serve_12',      type: 'serve_n',      label: '12 müşteri servis et',   icon: '🍽️',  target: 12, bonusCoins: 40 },
  { id: 'combo_5',       type: 'reach_combo',  label: 'x5 combo ulaş',          icon: '🔥',  target: 5,  bonusCoins: 30 },
  { id: 'combo_8',       type: 'reach_combo',  label: 'x8 combo ulaş',          icon: '🔥🔥', target: 8,  bonusCoins: 50 },
  { id: 'no_life_loss',  type: 'no_life_loss', label: 'Hiç can kaybetme',        icon: '❤️',  target: 1,  bonusCoins: 40 },
  { id: 'serve_vip_1',   type: 'serve_vip',    label: '1 VIP müşteri servis et', icon: '⭐',  target: 1,  bonusCoins: 30 },
  { id: 'serve_vip_2',   type: 'serve_vip',    label: '2 VIP müşteri servis et', icon: '⭐⭐', target: 2,  bonusCoins: 45 },
];

/** Günün başında 3 rastgele, birbirinden farklı tipte hedef seç */
export function pickDailyObjectives(_day: number): DailyObjective[] {
  const pool = [...POOL];
  // Fisher-Yates karıştırma
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked: DailyObjective[] = [];
  const usedTypes = new Set<string>();
  for (const def of pool) {
    if (picked.length >= 3) break;
    if (usedTypes.has(def.type)) continue;
    usedTypes.add(def.type);
    picked.push({ ...def, progress: 0, completed: false, failed: false });
  }
  return picked;
}
