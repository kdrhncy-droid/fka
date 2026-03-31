// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES & CONSTANTS — Server ve Client ortak kullanır
// Bu dosyayı değiştirirsen HER İKİ TARAF da otomatik güncellenir.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Temel Tipler ────────────────────────────────────────────────────────────
import { Personality } from './dialogues';
export type { Personality };

export type Item = string | null;
export type StockKey = '🍞' | '🥩' | '🥬' | '🥘' | '🍢' | '🥔' | '🧁';
export type UpgradeKey = 'patience' | 'earnings' | 'plateStackMax' | 'safeOven' | 'fryerSpeed' | 'fridgeCapacity' | 'cakeBaker' | 'coffeeMachine';
export const CLEAN_PLATE = '__clean_plate__';
export const DIRTY_PLATE = '__dirty_plate__';

export interface Player {
    id: string; x: number; y: number;
    holding: Item; color: string; name: string; hat: string;
    charType?: number;
    peerId?: string;
    hairColor?: string;
    clothingColor?: string;
    faceShape?: number;
}

// Sadeleştirilmiş Karakter Tipleri — Sadece Aşçı, Garson ve Bulaşıkçı
export const CHARACTER_TYPES = [
    { id: 0, name: 'Aşçı',     hat: '👨‍🍳', bodyColor: '#f5f5f4', accent: '#a78bfa', label: 'Usta Aşçı' },
    { id: 1, name: 'Garson',   hat: '🎩',   bodyColor: '#fef3c7', accent: '#92400e', label: 'Hızlı Garson' },
    { id: 2, name: 'Bulaşıkçı', hat: '🧹', bodyColor: '#e0f2fe', accent: '#0284c7', label: 'Titiz Bulaşıkçı' },
] as const;

export interface Customer {
    id: string;
    seatX: number; seatY: number;
    x: number; y: number; targetY: number;
    wants: Item;
    patience: number; maxPatience: number;
    isSeated: boolean; isEating: boolean; eatTimer: number;
    tipAmount?: number;

    personality: Personality;
    currentDialog?: string;
    dialogTimer?: number;
    isBeatUp?: boolean;
    isLeaving?: boolean;

    bodyShape: 1 | 2 | 3 | 4;
    bodyColor: string;
    beatUpTimer?: number;
    punchCount?: number;

    // Giriş fazı: 'entering' = kapıya doğru geliyor, 'seating' = koltuğa gidiyor, 'seated' = oturdu
    phase?: 'entering' | 'seating' | 'seated';
    doorX?: number; // Hangi kapıdan girecek
}

export interface WaitingGuest {
    id: string;
    wants: Item;
    personality: Personality;
    currentDialog?: string;
    dialogTimer?: number;
    bodyShape: 1 | 2 | 3 | 4;
    bodyColor: string;
    groupId?: string; // Aynı grubu tanımlamak için (grup üyeleri aynı anda oturur)
}

export interface Upgrades {
    patience: number; earnings: number; plateStackMax: number; safeOven: number;
    fryerSpeed: number; fridgeCapacity: number;
    cakeBaker: number; coffeeMachine: number;
}

// ─── Kart Sistemi ─────────────────────────────────────────────────────────────
export interface GameCard {
    id: string;
    icon: string;
    name: string;
    penalty: string;   // Kırmızı — ne zorlaşıyor
    reward: string;    // Yeşil — ne kazanılıyor
}

export interface ActiveCard {
    id: string;
    appliedOnDay: number;
}

// Kart tetiklenme günleri — her 3 günde bir
export const CARD_DAYS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29];

// Tüm kart tanımları
export const ALL_CARDS: GameCard[] = [
    // Müşteri kartları
    { id: 'impatient_crowd',  icon: '😤', name: 'Sabırsız Kalabalık', penalty: 'Müşteri sabrı -%20',           reward: 'Her servisten +3 ekstra para' },
    { id: 'busy_day',         icon: '👥', name: 'Yoğun Gün',          penalty: 'Müşteri spawn hızı +%30',      reward: 'Gece upgrade fiyatları -%15' },
    { id: 'rush_customers',   icon: '🏃', name: 'Acele Müşteriler',   penalty: 'Müşteriler %25 daha hızlı yer (sabır da hızlı azalır)', reward: 'Bahşiş +%25' },
    { id: 'rude_day',         icon: '😡', name: 'Kaba Gün',           penalty: 'Kaba müşteri oranı +%40',      reward: 'Kaba müşteri dövülünce +15 puan' },
    { id: 'blind_patience',   icon: '👁️', name: 'Kör Sabır',          penalty: 'Müşteri sabır barları gizlenir', reward: 'Tüm müşteriler +%15 daha sabırlı' },
    { id: 'rainy_day',        icon: '🌧️', name: 'Yağmurlu Gün',       penalty: 'Kapıda sabır -%30 hızlı azalır', reward: 'Gün boyunca +%10 daha fazla müşteri' },
    // Mutfak kartları
    { id: 'hot_oven',         icon: '🔥', name: 'Sıcak Fırın',        penalty: 'Yemekler %30 daha hızlı yanar', reward: 'Yemekler %30 daha hızlı pişer' },
    { id: 'few_plates',       icon: '🍽️', name: 'Az Tabak',           penalty: 'Başlangıç tabak sayısı -2',    reward: 'Her temizlenen tabak +2 puan' },
    { id: 'chop_pressure',    icon: '⏱️', name: 'Doğrama Baskısı',    penalty: 'Kesme tahtası %25 daha yavaş', reward: 'Doğranmış malzeme fırında %40 daha hızlı pişer' },
    { id: 'cold_chain',       icon: '🧊', name: 'Soğuk Zincir',       penalty: 'Buzdolabı kapasitesi yarıya düşer', reward: 'İçecek servisi +8 ekstra puan' },
    // Ekonomi kartları
    { id: 'expensive_day',    icon: '💸', name: 'Pahalı Gün',         penalty: 'Upgrade fiyatları +%25',       reward: 'Gün sonu +$50 bonus' },
    { id: 'lucky_day',        icon: '🎰', name: 'Şans Günü',          penalty: 'Spawn tamamen rastgele',        reward: 'Her müşteri 2x bahşiş bırakır' },
    { id: 'low_season',       icon: '📉', name: 'Düşük Sezon',        penalty: 'Müşteri sayısı -%20',          reward: 'Her müşteri %50 daha sabırlı' },
    // Özel kartlar (gün 8+)
    { id: 'turbo_day',        icon: '⚡', name: 'Turbo Gün',          penalty: 'Oyuncu hareket hızı -%15',     reward: 'Tüm pişirme süreleri -%20' },
    { id: 'mystery_guests',   icon: '🎭', name: 'Gizemli Misafirler', penalty: 'Müşteri kişilikleri gizlenir', reward: 'Tüm bahşişler +%30' },
];

export interface CookStation {
    input: string | null;
    timer: number;
    output: string | null;
    burnTimer?: number;
    isBurned?: boolean;
    id: string;
    x: number;
    y: number;
}

export interface HoldingStation {
    id: string;
    items: string[];
    type: 'plate' | 'counter';
    maxItems: number;
}

// ─── Tabak Yığını ─────────────────────────────────────────────────────────────
export interface PlateStack {
    count: number;   // Şu an mevcut temiz tabak sayısı
    maxCount: number; // Maks tabak kapasitesi
}

// ─── Kesme Tahtası ────────────────────────────────────────────────────────────
export const CHOP_PREFIX = 'CHOPPED_';
export const CHOP_TICKS = 60; // ~2 saniye (33ms * 60)
export function isChopped(item: Item): boolean {
  return typeof item === 'string' && item.startsWith(CHOP_PREFIX);
}
export function getChoppedSource(item: string): string {
  return item.replace(CHOP_PREFIX, '');
}

export interface ChoppingBoard {
  id: string;
  x: number;
  y: number;
  input: string | null;   // üzerindeki malzeme
  progress: number;       // 0..CHOP_TICKS
  isChopping: boolean;    // oyuncu aktif kesiyor mu
  choppingPlayerId: string | null;
}

// ─── Pasta Fırını ────────────────────────────────────────────────────────────
export const CAKE_TICKS = 180; // ~6 saniye (uzun ama yüksek bahşiş)
export const CAKE_BURN_TICKS = 300;

export interface CakeBaker {
  id: string;
  x: number;
  y: number;
  input: string | null;
  timer: number;
  output: string | null;
  isBurned?: boolean;
  burnTimer?: number;
}

// ─── Kahve Makinesi ───────────────────────────────────────────────────────────
export const COFFEE_ITEM = '☕';
export const COFFEE_BASE_CAPACITY = 4;

export interface CoffeeMachine {
  id: string;
  x: number;
  y: number;
  cups: number;
  maxCups: number;
}

// ─── Fritöz ──────────────────────────────────────────────────────────────────
export const FRYER_TICKS = 30; // ~1 saniye (hızlı)
export const FRYER_BURN_TICKS = 180;

export interface Fryer {
  id: string;
  x: number;
  y: number;
  input: string | null;
  timer: number;
  output: string | null;
  isBurned?: boolean;
  burnTimer?: number;
}

// ─── Buzdolabı ────────────────────────────────────────────────────────────────
export const DRINK_ITEM = '🥤';
export const FRIDGE_BASE_CAPACITY = 5;

export interface Fridge {
  id: string;
  x: number;
  y: number;
  drinks: number;   // mevcut içecek sayısı
  maxDrinks: number;
}

// ─── Lavabo ───────────────────────────────────────────────────────────────────
export const WASH_TICKS = 60; // ~2 saniye

export interface WashingSink {
  id: string;
  x: number;
  y: number;
  input: string | null;   // üzerindeki tabak (DIRTY_PLATE veya CLEAN_PLATE)
  progress: number;       // 0..WASH_TICKS
  isWashing: boolean;     // oyuncu aktif yıkıyor mu
  washingPlayerId: string | null;
}


// Kesme gerektiren malzemeler: et, sebze, kebap
export const CHOPPABLE: StockKey[] = ['🥩', '🥬', '🍢'];
export const CHOPPING_BOARD_POS = { x: 760, y: 170 };


export const TRAY_PREFIX = 'TRAY:';
export const MAX_TRAY_CAPACITY = 4;

export function isTray(item: Item): boolean {
    return typeof item === 'string' && item.startsWith(TRAY_PREFIX);
}

export function getTrayItems(item: Item): string[] {
    if (!item || !item.startsWith(TRAY_PREFIX)) return [];
    const content = item.substring(TRAY_PREFIX.length);
    return content ? content.split(',') : [];
}

export function createTray(items: string[]): string {
    return TRAY_PREFIX + items.join(',');
}

export interface DirtyTable {
    seatX: number;
    seatY: number;
    tip: number;
}

// ─── Masa Çarpışma Boyutları ───────────────────────────────────────────────
export function getTableDims(seats?: 1 | 2 | 3 | 4): { hw: number; hh: number } {
  const s = seats ?? 4;
  if (s === 1) return { hw: 25, hh: 25 };
  if (s === 2) return { hw: 25, hh: 35 };
  if (s === 3) return { hw: 35, hh: 35 };
  return { hw: 45, hh: 35 };
}
export const TABLE_HALF_W = 45; // Geriye dönük uyumluluk (gerekiyorsa)
export const TABLE_HALF_H = 35;

export interface GameState {
    players: Record<string, Player>;
    customers: Customer[];
    waitList: WaitingGuest[];
    holdingStations: HoldingStation[];  // Servis tezgahları (counter)
    dirtyTables: DirtyTable[];
    score: number;
    stock: Record<StockKey, number>;
    marketName: string;
    dayPhase: 'prep' | 'day' | 'night';
    dayTimer: number;
    upgrades: Upgrades;
    day: number;
    hasOrderedTonight: boolean;
    cookStations: CookStation[];
    dirtyTrayCount: number;

    // ─── Tabak Yığını (Tek Nokta) ──────────────────────────────────────────
    plateStack: PlateStack;

    // Game Over & Penalty
    lives: number;
    isGameOver: boolean;

    // Revenge System
    revengeQueue: number[];

    // ─── Yemek Kilidi Sistemi (Plate Up tarzı) ─────────────────────────────
    unlockedDishes: string[];       // Müşterilerin sipariş edebileceği yemekler
    menuChoices: string[] | null;   // Gece ekranında seçim için sunulan kilitli yemekler

    // ─── Kart Sistemi ────────────────────────────────────────────────────────
    activeCards: ActiveCard[];              // Bu run'da seçilmiş aktif kartlar
    pendingCardChoices: GameCard[] | null;  // Gece ekranında sunulan 2 kart seçeneği

    // ─── Station Layout Editor ───────────────────────────────────────────────
    stationLayout: Record<string, StationPosition>;
    lockedStations: Record<string, string>; // stationId → socketId

    // ─── Table Layout Editor ─────────────────────────────────────────────────
    tableLayout: Record<string, TablePosition>;
    lockedTables: Record<string, string>; // tableId → socketId

    // ─── Kesme Tahtaları ─────────────────────────────────────────────────────
    choppingBoards: ChoppingBoard[];

    // ─── Lavabolar ───────────────────────────────────────────────────────────
    sinks: WashingSink[];

    // ─── Fritözler ───────────────────────────────────────────────────────────
    fryers: Fryer[];

    // ─── Buzdolabı ───────────────────────────────────────────────────────────
    fridges: Fridge[];

    // ─── Pasta Fırını ────────────────────────────────────────────────────────
    cakeBakers: CakeBaker[];

    // ─── Kahve Makinesi ──────────────────────────────────────────────────────
    coffeeMachines: CoffeeMachine[];

    // ─── Servis Penceresi ─────────────────────────────────────────────────────
    serviceWindow: ServiceWindowSlot[];

    // ─── Internal (sunucu tarafı, client'a gönderilir ama kullanılmaz) ────────
    _stateTick?: number;
    _seatCooldown?: number;
    mapId?: string;
}

// ─── Boyut ───────────────────────────────────────────────────────────────────
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 870;

// ─── Dış Alan Sınırı (salon biter, dışarı başlar) ────────────────────────────
export const EXTERIOR_Y = 720;       // Bu çizgiden aşağısı dış alan
export const SIDEWALK_Y = 740;       // Kaldırım başlangıcı
export const ROAD_Y = 790;           // Yol başlangıcı

// ─── Grid Sabitleri ───────────────────────────────────────────────────────────
export const GRID_CELL_SIZE = 40;
export const GRID_COLS = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);   // 32
export const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);  // 18

// ─── İstasyon Layout ─────────────────────────────────────────────────────────
export interface StationPosition {
  id: string;
  x: number;
  y: number;
}

// ─── Masa Layout ─────────────────────────────────────────────────────────────
export interface TablePosition {
  id: string;
  x: number;
  y: number;
  seats?: 1 | 2 | 3 | 4; // Müşteri kapasitesi
}

export function getSeatSlots(tableLayout: Record<string, TablePosition>): { x: number; y: number }[] {
  return Object.values(tableLayout).flatMap(t => {
    const s = t.seats ?? 4;
    // Eğer 1 ise sadece üst, 2 ise alt/üst, 3 ise üst/alt/sağ, 4 ise standart çapraz (sol üst, sağ üst, sol alt, sağ alt... HAYIR)
    // Aslında drawTable.ts önceden 4 masayı şu yerlere çiziyordu:
    // cx - 28, cy - 56 (up) | cx + 28, cy - 56 (up) | cx - 28, cy + 40 (down) | cx + 28, cy + 40 (down)
    // Ama `getSeatSlots` SADECE 2 döndürüyordu (y-47 ve y+47, x sabitti).
    // Artık tam çizeceğiz! (Sandalyelere tam hizalı).
    
    // YENİ DÜZEN (Tam ortalanmış ve düzgün yerleşim):
    if (s === 1) return [{ x: t.x, y: t.y + 35 }]; // masanın altı (yukarı bakacak)
    if (s === 2) return [{ x: t.x, y: t.y - 50 }, { x: t.x, y: t.y + 40 }]; // Karşılıklı
    if (s === 3) return [
      { x: t.x, y: t.y - 50 }, // üst
      { x: t.x - 28, y: t.y + 40 }, // alt-sol
      { x: t.x + 28, y: t.y + 40 }, // alt-sağ
    ];
    // 4 kişilik:
    return [
      { x: t.x - 28, y: t.y - 50 }, // üst-sol
      { x: t.x + 28, y: t.y - 50 }, // üst-sağ
      { x: t.x - 28, y: t.y + 40 }, // alt-sol
      { x: t.x + 28, y: t.y + 40 }, // alt-sağ
    ];
  });
}

// ─── Gün / Gece (1.5 dakika gündüz, 30 saniye gece) ──────────────────────────
export const DAY_TICKS = 2700;
export const NIGHT_TICKS = 900;
export const CLOSING_THRESHOLD = 600; // Son 10 saniye (600 tick) yeni müşteri gelmez
export const BURN_TICKS = 300;
export const EAT_TICKS = 240;
export const BURNED_FOOD = '⬛';

// ─── Tabak Yığını İstasyonu (tek nokta, üst üste tabaklar) ─────────────────
export const PLATE_STACK_POS = { x: 650, y: 65, radius: 55 };
export const PLATE_STACK_BASE = 8;   // Başlangıç tabak kapasitesi 4 -> 8 yapıldı
export const PLATE_STACK_PER_UPGRADE = 4; // Her upgrade başına +4 tabak (eski: 2)

// Geriye uyum için (counter istasyonları hâlâ kullanılıyor)
export const HOLDING_STATION_POSITIONS: { id: string; x: number; y: number; radius: number; type: 'plate' }[] = [];

// ─── Servis Penceresi ────────────────────────────────────────────────────────
export const SERVICE_WINDOW_SLOTS = [
  { id: 'sw0', x: 480, y: 360 },
  { id: 'sw1', x: 560, y: 360 },
  { id: 'sw2', x: 640, y: 360 },
  { id: 'sw3', x: 720, y: 360 },
] as const;
export const SERVICE_WINDOW_R = 70;

export interface ServiceWindowSlot {
  id: string;
  item: Item;
}

// ─── Yatay Duvar & Kapılar ────────────────────────────────────────────────────
export const WALL_Y1 = 340;
export const WALL_Y2 = 380;
// Tek kapı — ortada, eski kapı daha da ortalandı
export const DOOR_RANGES: [number, number][] = [
    [540, 740], // Kapı geçişi iyileştirildi
];
export function isInDoor(x: number): boolean {
    return DOOR_RANGES.some(([a, b]) => x >= a && x <= b);
}

// ─── Tepsi ve Malzeme İstasyonları (Daraltıldı, ortalandı) ──────────────────
export const TRAY_STATION = { x: 300, y: 285 };

export const INGREDIENTS = [
    { key: '🍞' as StockKey, pos: { x: 360, y: 65 }, label: 'Hamur', color: '#fde68a' },
    { key: '🥩' as StockKey, pos: { x: 450, y: 65 }, label: 'Et', color: '#fca5a5' },
    { key: '🥬' as StockKey, pos: { x: 540, y: 65 }, label: 'Sebze', color: '#bbf7d0' },
    { key: '🥘' as StockKey, pos: { x: 630, y: 65 }, label: 'Çorba', color: '#fbbf24' },
    { key: '🍢' as StockKey, pos: { x: 720, y: 65 }, label: 'Kebap', color: '#92400e' },
    { key: '🥔' as StockKey, pos: { x: 810, y: 65 }, label: 'Patates', color: '#d4a017' },
    { key: '🧁' as StockKey, pos: { x: 900, y: 65 }, label: 'Hamur Tatlı', color: '#f9a8d4' },
];

export const RECIPE_DEFS = {
    '🍞':          { output: '🍕', time: 90,  label: '🍕 Pizza' },
    'CHOPPED_🥩':  { output: '🍔', time: 35,  label: '🍔 Burger' },
    'CHOPPED_🥬':  { output: '🥗', time: 15,  label: '🥗 Salata' },
    '🥘':          { output: '🍜', time: 120, label: '🍜 Çorba' },
    'CHOPPED_🍢':  { output: '🌯', time: 60,  label: '🌯 Dürüm' },
    '🧁':          { output: '🍰', time: 180, label: '🍰 Pasta' },
} as const;

export const DISH_UNLOCK_POOL = ['🍕', '🍜', '🌯', '🍟', '🥤', '🍰', '☕'] as const;

export const INITIAL_OVEN_POSITIONS = [
    { x: 400, y: 90 },
];

export const ADDITIONAL_OVEN_POSITIONS = [
    { x: 500, y: 90 },
    { x: 600, y: 90 },
    { x: 400, y: 170 },
    { x: 500, y: 170 },
    { x: 600, y: 170 },
];

export const OVEN_UPGRADE_COSTS = [200, 400, 800, 1200, 1600];

export const TRASH_STATION = { x: 920, y: 285 };
export const DIRTY_TRAY_POS = { x: 860, y: 90 };
export const SINK_STATION = { x: 960, y: 90 };
export const TABLE_Y_DEFAULT = 500;
export const DISH_ITEMS = ['🍕', '🍔', '🥗', '🍜', '🌯', '🍟', '🥤', '🍰', '☕'] as const;

export const UPGRADE_DEFS: Record<UpgradeKey, { costs: number[]; max: number }> = {
    patience:      { costs: [150, 300, 600, 1200], max: 4 },
    earnings:      { costs: [200, 400, 800, 1600], max: 4 },
    plateStackMax: { costs: [100, 200, 400, 800],  max: 4 },
    safeOven:      { costs: [500],                 max: 1 },
    fryerSpeed:    { costs: [300, 600],             max: 2 },
    fridgeCapacity:{ costs: [250, 500],             max: 2 },
    cakeBaker:     { costs: [400],                  max: 1 },
    coffeeMachine: { costs: [350],                  max: 1 },
};

export function mkCook(id: string, x: number, y: number): CookStation {
  return { input: null, timer: 0, output: null, id, x, y };
}

export type MapId = 'classic';

export function mkGameState(mapId: MapId = 'classic'): GameState {
  return mkClassicMapState();
}

function mkClassicMapState(): GameState {
  const initialOvens = INITIAL_OVEN_POSITIONS.map((pos, i) =>
    mkCook(`oven${i + 1}`, pos.x, pos.y)
  );
  return {
    mapId: 'classic',
    players: {}, customers: [], waitList: [],
    holdingStations: [],
    dirtyTables: [],
    score: 0, stock: { '🍞': 10, '🥩': 10, '🥬': 10, '🥘': 5, '🍢': 5, '🥔': 8, '🧁': 6 },
    marketName: "TerraMarket", dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0, fryerSpeed: 0, fridgeCapacity: 0, cakeBaker: 0, coffeeMachine: 0 }, day: 1, hasOrderedTonight: false,
    cookStations: initialOvens,
    dirtyTrayCount: 0,
    plateStack: { count: PLATE_STACK_BASE, maxCount: PLATE_STACK_BASE },
    lives: 3,
    isGameOver: false,
    revengeQueue: [],
    unlockedDishes: ['🥗', '🍔'],
    menuChoices: null,
    activeCards: [],
    pendingCardChoices: null,
    stationLayout: {
      'ingredient_🍞': { id: 'ingredient_🍞', x: 360, y: 65 },
      'ingredient_🥩': { id: 'ingredient_🥩', x: 450, y: 65 },
      'ingredient_🥬': { id: 'ingredient_🥬', x: 540, y: 65 },
      'ingredient_🥘': { id: 'ingredient_🥘', x: 630, y: 65 },
      'ingredient_🍢': { id: 'ingredient_🍢', x: 720, y: 65 },
      'ingredient_🥔': { id: 'ingredient_🥔', x: 810, y: 65 },
      'ingredient_🧁': { id: 'ingredient_🧁', x: 900, y: 65 },
      'oven1':         { id: 'oven1',         x: 400, y: 90 },
      'tray':          { id: 'tray',          x: 300, y: 285 },
      'sink':          { id: 'sink',          x: 960,  y: 90 },
      'trash':         { id: 'trash',         x: 920, y: 285 },
      'dirty_tray':    { id: 'dirty_tray',    x: 860,  y: 90 },
      'plate_stack':   { id: 'plate_stack',   x: 650, y: 65 },
      'chop1':         { id: 'chop1',         x: 760, y: 170 },
      'fryer1':        { id: 'fryer1',        x: 300, y: 170 },
      'fridge1':       { id: 'fridge1',       x: 200, y: 285 },
      'cakebaker1':    { id: 'cakebaker1',    x: 500, y: 170 },
      'coffee1':       { id: 'coffee1',       x: 100, y: 285 },
    },
    lockedStations: {},
    tableLayout: {
      'table0': { id: 'table0', x: 260, y: 570 },
      'table1': { id: 'table1', x: 450, y: 570 },
      'table2': { id: 'table2', x: 640, y: 570 },
      'table3': { id: 'table3', x: 830, y: 570 },
      'table4': { id: 'table4', x: 1020, y: 570 },
    },
    lockedTables: {},
    choppingBoards: [
      { id: 'chop1', x: CHOPPING_BOARD_POS.x, y: CHOPPING_BOARD_POS.y, input: null, progress: 0, isChopping: false, choppingPlayerId: null },
    ],
    sinks: [
      { id: 'sink', x: SINK_STATION.x, y: SINK_STATION.y, input: null, progress: 0, isWashing: false, washingPlayerId: null },
    ],
    fryers: [
      { id: 'fryer1', x: 300, y: 170, input: null, timer: 0, output: null },
    ],
    fridges: [
      { id: 'fridge1', x: 200, y: 285, drinks: FRIDGE_BASE_CAPACITY, maxDrinks: FRIDGE_BASE_CAPACITY },
    ],
    cakeBakers: [
      { id: 'cakebaker1', x: 500, y: 170, input: null, timer: 0, output: null },
    ],
    coffeeMachines: [
      { id: 'coffee1', x: 100, y: 285, cups: COFFEE_BASE_CAPACITY, maxCups: COFFEE_BASE_CAPACITY },
    ],
    serviceWindow: SERVICE_WINDOW_SLOTS.map(s => ({ id: s.id, item: null })),
  };
}


