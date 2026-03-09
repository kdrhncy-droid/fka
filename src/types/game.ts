// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT TYPES — Shared'dan re-export + client-only sabitler
// ═══════════════════════════════════════════════════════════════════════════════

// Shared'dan HER ŞEYİ re-export (tek kaynak)
export {
  // Types
  type Item,
  type StockKey,
  type UpgradeKey,
  type Player,
  type Customer,
  type WaitingGuest,
  type DirtyTable,
  type Upgrades,
  type CookStation,
  type GameState,
  // Constants
  GAME_WIDTH,
  GAME_HEIGHT,
  DAY_TICKS,
  NIGHT_TICKS,
  WALL_Y1,
  WALL_Y2,
  DOOR_RANGES,
  isInDoor,
  UTIL_WALL_X1,
  UTIL_WALL_X2,
  UTIL_DOOR_RANGE,
  isInUtilDoor,
  INGREDIENTS,
  RECIPE_DEFS,
  INITIAL_OVEN_POSITIONS,
  ADDITIONAL_OVEN_POSITIONS,
  OVEN_UPGRADE_COSTS,
  TRASH_STATION,
  DIRTY_TRAY_POS,
  SINK_STATION,
  SEAT_SLOTS,
  DISH_ITEMS,
  UPGRADE_DEFS,
  CLOSING_THRESHOLD,
  BURN_TICKS,
  EAT_TICKS,
  BURNED_FOOD,
  CLEAN_PLATE,
  DIRTY_PLATE,
  HOLDING_STATION_POSITIONS,
  CHARACTER_TYPES,
  type HoldingStation
} from '../../shared/types';

// ─── Client-Only Sabitler ────────────────────────────────────────────────────
export const PLAYER_SPEED = 5;

// Masa pozisyonları (sadece render için)
export const TABLE_X_SLOTS = [190, 390, 640, 890, 1090];
export const TABLE_Y = 500;

// Giriş kapısı (render + kuyruk gösterimi)
export const ENTRANCE = { x: 640, y: 695 };
export const OUTSIDE_QUEUE_Y = 700;

// Karakter seçimi
export const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];
export const HATS = ['', '👑', '🎀', '🎩', '🧢', '🐱'];
