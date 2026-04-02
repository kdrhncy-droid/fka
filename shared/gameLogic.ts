import { CHOP_PREFIX, TRAY_PREFIX } from './constants';
import type { Item, TablePosition } from './types';

// Kesme Tahtası
export function isChopped(item: Item): boolean {
  return typeof item === 'string' && item.startsWith(CHOP_PREFIX);
}
export function getChoppedSource(item: string): string {
  if (!item) return '';
  return item.replace(CHOP_PREFIX, '');
}

// Tepsi
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

// Masa
export function getTableDims(seats?: 1 | 2 | 3 | 4): { hw: number; hh: number } {
  const s = seats ?? 4;
  if (s === 1) return { hw: 18, hh: 18 };
  if (s === 2) return { hw: 18, hh: 25 };
  if (s === 3) return { hw: 25, hh: 25 };
  return { hw: 32, hh: 25 };
}

export function getSeatSlots(tableLayout: Record<string, TablePosition>): { x: number; y: number }[] {
  return Object.values(tableLayout).flatMap(t => {
    const s = t.seats ?? 4;
    if (s === 1) return [{ x: t.x, y: t.y + 20 }];
    if (s === 2) return [{ x: t.x, y: t.y - 42 }, { x: t.x, y: t.y + 30 }];
    if (s === 3) return [
      { x: t.x, y: t.y - 42 },
      { x: t.x - 18, y: t.y + 30 },
      { x: t.x + 18, y: t.y + 30 },
    ];
    return [
      { x: t.x - 20, y: t.y - 42 },
      { x: t.x + 20, y: t.y - 42 },
      { x: t.x - 20, y: t.y + 30 },
      { x: t.x + 20, y: t.y + 30 },
    ];
  });
}

// Kapı
export const DOOR_RANGES: [number, number][] = [
    [540, 740], // Kapı geçişi iyileştirildi
];
export function isInDoor(x: number): boolean {
    return DOOR_RANGES.some(([a, b]) => x >= a && x <= b);
}

// Combo
export function getComboMultiplier(count: number): number {
  if (count >= 8) return 3.0;
  if (count >= 5) return 2.0;
  if (count >= 3) return 1.5;
  return 1.0;
}
export function getComboLabel(count: number): string {
  if (count >= 8) return '🔥🔥🔥';
  if (count >= 5) return '🔥🔥';
  if (count >= 3) return '🔥';
  return '';
}
