export type Item = '🍎' | '🍞' | '🥛' | null;

export interface Player {
  id: string;
  x: number;
  y: number;
  holding: Item;
  color: string;
  name: string;
  hat: string;
}

export interface Customer {
  id: string;
  x: number;
  y: number;
  targetY: number;
  wants: Item;
  patience: number;
  maxPatience: number;
}

export interface GameState {
  players: Record<string, Player>;
  customers: Customer[];
  score: number;
  stock: Record<Exclude<Item, null>, number>;
  marketName: string;
}

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const PLAYER_SPEED = 5;

export const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];
export const HATS = ['', '👑', '🎀', '🎩', '🧢', '🐱'];
