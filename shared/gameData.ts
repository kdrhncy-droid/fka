import type { GameCard, StockKey, UpgradeKey } from './types';

// Sadeleştirilmiş Karakter Tipleri
export const CHARACTER_TYPES = [
    { id: 0, name: 'Aşçı',     hat: '👨‍🍳', bodyColor: '#f5f5f4', accent: '#a78bfa', label: 'Usta Aşçı' },
    { id: 1, name: 'Garson',   hat: '🎩',   bodyColor: '#fef3c7', accent: '#92400e', label: 'Hızlı Garson' },
    { id: 2, name: 'Bulaşıkçı', hat: '🧹', bodyColor: '#e0f2fe', accent: '#0284c7', label: 'Titiz Bulaşıkçı' },
] as const;

// Kart tetiklenme günleri
export const CARD_DAYS = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29];

// Tüm kart tanımları
export const ALL_CARDS: GameCard[] = [
    { id: 'impatient_crowd',  icon: '😤', name: 'Sabırsız Kalabalık', penalty: 'Müşteri sabrı -%20',           reward: 'Her servisten +3 ekstra para' },
    { id: 'busy_day',         icon: '👥', name: 'Yoğun Gün',          penalty: 'Müşteri spawn hızı +%30',      reward: 'Gece upgrade fiyatları -%15' },
    { id: 'rush_customers',   icon: '🏃', name: 'Acele Müşteriler',   penalty: 'Müşteriler %25 daha hızlı yer (sabır da hızlı azalır)', reward: 'Bahşiş +%25' },
    { id: 'rude_day',         icon: '😡', name: 'Kaba Gün',           penalty: 'Kaba müşteri oranı +%40',      reward: 'Kaba müşteri dövülünce +15 puan' },
    { id: 'blind_patience',   icon: '👁️', name: 'Kör Sabır',          penalty: 'Müşteri sabır barları gizlenir', reward: 'Tüm müşteriler +%15 daha sabırlı' },
    { id: 'rainy_day',        icon: '🌧️', name: 'Yağmurlu Gün',       penalty: 'Kapıda sabır -%30 hızlı azalır', reward: 'Gün boyunca +%10 daha fazla müşteri' },
    { id: 'hot_oven',         icon: '🔥', name: 'Sıcak Fırın',        penalty: 'Yemekler %30 daha hızlı yanar', reward: 'Yemekler %30 daha hızlı pişer' },
    { id: 'few_plates',       icon: '🍽️', name: 'Az Tabak',           penalty: 'Başlangıç tabak sayısı -2',    reward: 'Her temizlenen tabak +2 puan' },
    { id: 'chop_pressure',    icon: '⏱️', name: 'Doğrama Baskısı',    penalty: 'Kesme tahtası %25 daha yavaş', reward: 'Doğranmış malzeme fırında %40 daha hızlı pişer' },
    { id: 'cold_chain',       icon: '🧊', name: 'Soğuk Zincir',       penalty: 'İçecek servisi -2 puan',       reward: 'İçecek servisi +12 ekstra puan' },
    { id: 'expensive_day',    icon: '💸', name: 'Pahalı Gün',         penalty: 'Upgrade fiyatları +%25',       reward: 'Gün sonu +$50 bonus' },
    { id: 'lucky_day',        icon: '🎰', name: 'Şans Günü',          penalty: 'Spawn tamamen rastgele',        reward: 'Her müşteri 2x bahşiş bırakır' },
    { id: 'low_season',       icon: '📉', name: 'Düşük Sezon',        penalty: 'Müşteri sayısı -%20',          reward: 'Her müşteri %50 daha sabırlı' },
    { id: 'turbo_day',        icon: '⚡', name: 'Turbo Gün',          penalty: 'Oyuncu hareket hızı -%15',     reward: 'Tüm pişirme süreleri -%20' },
    { id: 'mystery_guests',   icon: '🎭', name: 'Gizemli Misafirler', penalty: 'Müşteri kişilikleri gizlenir', reward: 'Tüm bahşişler +%30' },
    { id: 'kaos_day',         icon: '🌀', name: 'Kaos Günü',          penalty: 'İstasyonlar bazen yer değiştirir', reward: 'Tüm bahşişler +%50' },
];

export const CHOPPABLE: StockKey[] = ['🥩', '🥬', '🍢'];
export const CHOPPING_BOARD_POS = { x: 760, y: 170 };
export const PLATE_STACK_POS = { x: 650, y: 65, radius: 90 };

export const SERVICE_WINDOW_SLOTS = [
  { id: 'sw0', x: 480, y: 360 },
  { id: 'sw1', x: 560, y: 360 },
  { id: 'sw2', x: 640, y: 360 },
  { id: 'sw3', x: 720, y: 360 },
] as const;

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
export const EXTRA_SINK_POSITIONS = [
  { x: 1060, y: 90 },
  { x: 1160, y: 90 },
];
export const EXTRA_CHOP_POSITIONS = [
  { x: 860, y: 170 },
  { x: 960, y: 170 },
];





export const DISH_ITEMS = ['🍕', '🍔', '🥗', '🍜', '🌯', '🍟', '🥤', '🍰', '☕'] as const;





export const UPGRADE_DEFS: Record<UpgradeKey, { costs: number[]; max: number }> = {
    patience:      { costs: [150, 300, 600, 1200], max: 4 },
    earnings:      { costs: [200, 400, 800, 1600], max: 4 },
    plateStackMax: { costs: [100, 200, 400, 800],  max: 4 },
    safeOven:      { costs: [500],                 max: 1 },
    fryerSpeed:    { costs: [300, 600],             max: 2 },
    cakeBaker:     { costs: [400],                  max: 1 },
    coffeeMachine: { costs: [350],                  max: 1 },
    extraSink:     { costs: [300, 600],             max: 2 },
    extraChopBoard:{ costs: [250, 500],             max: 2 },
};

export const MENU_UNLOCK_DAYS = [3, 10, 13, 20, 24, 28]; // Bu günlerin gecesinde yemek seçimi çıkar

export const TABLE_POSITIONS: { x: number; y: number }[] = [
    // Başlangıç 6 masa (sıra 1)
    { x: 160, y: 460 }, { x: 380, y: 460 }, { x: 600, y: 460 },
    { x: 820, y: 460 }, { x: 1040, y: 460 }, { x: 1200, y: 460 },
    // Satın alınabilir 9 masa (sıra 2 ve 3)
    { x: 160, y: 590 }, { x: 380, y: 590 }, { x: 600, y: 590 },
    { x: 820, y: 590 }, { x: 1040, y: 590 }, { x: 1200, y: 590 },
    { x: 270, y: 660 }, { x: 640, y: 660 }, { x: 1010, y: 660 },
];
