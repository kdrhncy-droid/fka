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
  type HoldingStation,
  type PlateStack,
  type WashingSink,
  // Constants
  GAME_WIDTH,
  GAME_HEIGHT,
  DAY_TICKS,
  NIGHT_TICKS,
  WALL_Y1,
  WALL_Y2,
  DOOR_RANGES,
  isInDoor,
  INGREDIENTS,
  RECIPE_DEFS,
  INITIAL_OVEN_POSITIONS,
  ADDITIONAL_OVEN_POSITIONS,
  OVEN_UPGRADE_COSTS,
  TRASH_STATION,
  DIRTY_TRAY_POS,
  TRAY_STATION,
  SINK_STATION,
  DISH_ITEMS,
  UPGRADE_DEFS,
  CLOSING_THRESHOLD,
  BURN_TICKS,
  EAT_TICKS,
  BURNED_FOOD,
  CLEAN_PLATE,
  DIRTY_PLATE,
  HOLDING_STATION_POSITIONS,
  PLATE_STACK_POS,
  CHARACTER_TYPES,
  TRAY_PREFIX,
  MAX_TRAY_CAPACITY,
  isTray,
  getTrayItems,
  createTray,
  TABLE_HALF_W,
  TABLE_HALF_H,
  TABLE_Y_DEFAULT,
  type TablePosition,
  getSeatSlots,
  EXTERIOR_Y,
  SIDEWALK_Y,
  ROAD_Y,
  // Kesme Tahtası
  type ChoppingBoard,
  CHOP_PREFIX,
  CHOP_TICKS,
  isChopped,
  getChoppedSource,
  CHOPPABLE,
  CHOPPING_BOARD_POS,
  // Fritöz
  type Fryer,
  FRYER_TICKS,
  FRYER_BURN_TICKS,
  // Buzdolabı
  type Fridge,
  DRINK_ITEM,
  FRIDGE_BASE_CAPACITY,
  // Servis Penceresi
  type ServiceWindowSlot,
  SERVICE_WINDOW_SLOTS,
  SERVICE_WINDOW_R,
  // Diğer
  type StationPosition,
  getTableDims,
  mkGameState,
  PLATE_STACK_BASE,
  PLATE_STACK_PER_UPGRADE,
  DISH_UNLOCK_POOL,
  UPGRADE_DEFS as UPGRADE_DEFS_SHARED,
} from '../../shared/types';

// ─── Client-Only Sabitler ────────────────────────────────────────────────────
export const PLAYER_SPEED = 5;

// Giriş kapısı (render + kuyruk gösterimi)
export const ENTRANCE = { x: 640, y: 695 };
export const OUTSIDE_QUEUE_Y = 700;

// Karakter seçimi
export const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];
export const HATS = ['', '👑', '🎀', '🎩', '🧢', '🐱'];
