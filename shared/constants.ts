export const CLEAN_PLATE = '__clean_plate__';
export const DIRTY_PLATE = '__dirty_plate__';

export const CHOP_PREFIX = 'CHOPPED_';
export const CHOP_TICKS = 60; // ~2 saniye (33ms * 60)

export const CAKE_TICKS = 180; // ~6 saniye (uzun ama yüksek bahşiş)
export const CAKE_BURN_TICKS = 300;

export const COFFEE_ITEM = '☕';
export const COFFEE_BASE_CAPACITY = 4;

export const FRYER_TICKS = 30; // ~1 saniye (hızlı)
export const FRYER_BURN_TICKS = 180;

export const DRINK_ITEM = '🥤';
export const FRIDGE_BASE_CAPACITY = 999; // Sınırsız içecek

export const WASH_TICKS = 60; // ~2 saniye

export const TRAY_PREFIX = 'TRAY:';
export const MAX_TRAY_CAPACITY = 4;

export const TABLE_HALF_W = 32; // Geriye dönük uyumluluk (gerekiyorsa)
export const TABLE_HALF_H = 25;

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 870;

export const EXTERIOR_Y = 720;       // Bu çizgiden aşağısı dış alan
export const SIDEWALK_Y = 740;       // Kaldırım başlangıcı
export const ROAD_Y = 790;           // Yol başlangıcı

export const GRID_CELL_SIZE = 40;
export const GRID_COLS = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);   // 32
export const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);  // 18

export const DAY_TICKS = 2700;
export const NIGHT_TICKS = 900;
export const CLOSING_THRESHOLD = 600; // Son 10 saniye (600 tick) yeni müşteri gelmez
export const BURN_TICKS = 300;
export const EAT_TICKS = 240;
export const BURNED_FOOD = '⬛';

export const PLATE_STACK_BASE = 8;   // Başlangıç tabak kapasitesi 4 -> 8 yapıldı
export const PLATE_STACK_PER_UPGRADE = 4; // Her upgrade başına +4 tabak (eski: 2)

export const SERVICE_WINDOW_R = 90;

export const WALL_Y1 = 340;
export const WALL_Y2 = 380;




export const COMBO_TIMEOUT_TICKS = 180; // ~6 saniye içinde servis yapılmazsa combo sıfırlanır
