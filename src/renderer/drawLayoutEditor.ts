import { GRID_CELL_SIZE, GAME_WIDTH, GAME_HEIGHT, StationPosition, TablePosition, getTableDims, WALL_Y1, WALL_Y2 } from '../../shared/types';

const GRID_COLS = Math.floor(GAME_WIDTH / GRID_CELL_SIZE);
const GRID_ROWS = Math.floor(GAME_HEIGHT / GRID_CELL_SIZE);

export function snapToGrid(x: number, y: number): { x: number; y: number } {
  const col = Math.max(0, Math.min(Math.floor(x / GRID_CELL_SIZE), GRID_COLS - 1));
  const row = Math.max(0, Math.min(Math.floor(y / GRID_CELL_SIZE), GRID_ROWS - 1));
  return {
    x: col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
}

export function pixelToGridIndex(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.max(0, Math.min(Math.floor(x / GRID_CELL_SIZE), GRID_COLS - 1)),
    row: Math.max(0, Math.min(Math.floor(y / GRID_CELL_SIZE), GRID_ROWS - 1)),
  };
}

export function gridIndexToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: col * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
    y: row * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  };
}

export function isGridCellOccupied(
  col: number,
  row: number,
  layout: Record<string, StationPosition>,
  excludeId?: string
): boolean {
  const { x, y } = gridIndexToPixel(col, row);
  return Object.values(layout).some(
    s => s.id !== excludeId && s.x === x && s.y === y
  );
}

export interface LayoutEditorState {
  isMoving: boolean;
  movingStationId: string | null;
  originalPos: { x: number; y: number } | null;
  previewPos: { x: number; y: number } | null;
  isPreviewValid: boolean;
  // Masa taşıma
  isMovingTable: boolean;
  movingTableId: string | null;
}

const MIN_TABLE_Y = 320;

export function isTablePositionValid(
  x: number, y: number,
  tableLayout: Record<string, TablePosition>,
  excludeId: string
): boolean {
  if (y < MIN_TABLE_Y || y > GAME_HEIGHT - 60) return false;
  if (y >= WALL_Y1 && y <= WALL_Y2) return false;
  
  const incomingSeats = tableLayout[excludeId]?.seats;
  const incoming = getTableDims(incomingSeats);

  return !Object.values(tableLayout).some(t => {
    if (t.id === excludeId) return false;
    const existing = getTableDims(t.seats);
    return Math.abs(t.x - x) < (existing.hw + incoming.hw + 10) &&
           Math.abs(t.y - y) < (existing.hh + incoming.hh + 10);
  });
}

export function drawLayoutPreview(
  ctx: CanvasRenderingContext2D,
  editorState: LayoutEditorState,
  stationLayout: Record<string, StationPosition>,
  tableLayout: Record<string, TablePosition>
): void {
  // Masa taşıma preview
  if (editorState.isMovingTable && editorState.movingTableId && editorState.previewPos) {
    const { previewPos, isPreviewValid, originalPos } = editorState;
    const t = tableLayout[editorState.movingTableId];
    const { hw, hh } = getTableDims(t?.seats);

    // Orijinal konum — yarı saydam overlay
    if (originalPos) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(originalPos.x - hw, originalPos.y - hh, hw * 2, hh * 2);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(originalPos.x - hw, originalPos.y - hh, hw * 2, hh * 2);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Önizleme
    const color = isPreviewValid ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)';
    const border = isPreviewValid ? '#22c55e' : '#ef4444';
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(previewPos.x - hw, previewPos.y - hh, hw * 2, hh * 2);
    ctx.strokeStyle = border;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(previewPos.x - hw, previewPos.y - hh, hw * 2, hh * 2);
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = isPreviewValid ? 0.85 : 0.5;
    ctx.fillText('🪑', previewPos.x, previewPos.y);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = isPreviewValid ? '#86efac' : '#fca5a5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(isPreviewValid ? '✓ Bırak: E' : '✗ Geçersiz', previewPos.x, previewPos.y + hh + 3);
    ctx.restore();
    return;
  }

  if (!editorState.isMoving || !editorState.movingStationId || !editorState.previewPos) return;

  const { previewPos, isPreviewValid, originalPos, movingStationId } = editorState;
  const size = GRID_CELL_SIZE;

  // Orijinal konum — kesik çizgi efekti (istasyon hâlâ orada render ediliyor, üstüne overlay çiz)
  if (originalPos) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(originalPos.x - size / 2, originalPos.y - size / 2, size, size);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(originalPos.x - size / 2, originalPos.y - size / 2, size, size);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Önizleme hücresi — daha büyük ve belirgin
  const previewSize = size * 1.1;
  const color = isPreviewValid ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)';
  const border = isPreviewValid ? '#22c55e' : '#ef4444';

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(previewPos.x - previewSize / 2, previewPos.y - previewSize / 2, previewSize, previewSize);
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.strokeRect(previewPos.x - previewSize / 2, previewPos.y - previewSize / 2, previewSize, previewSize);

  // İstasyon emoji'sini önizleme üstünde göster
  const emoji = movingStationId.startsWith('ingredient_')
    ? movingStationId.replace('ingredient_', '')
    : movingStationId === 'sink' ? '🚿'
    : movingStationId === 'trash' ? '🗑️'
    : movingStationId === 'tray' ? '🍽️'
    : movingStationId === 'plate_stack' ? '🍽️'
    : movingStationId.startsWith('oven') ? '🔥'
    : movingStationId.startsWith('counter') ? '🍽️'
    : '📦';

  ctx.font = `${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = isPreviewValid ? 0.85 : 0.5;
  ctx.fillText(emoji, previewPos.x, previewPos.y);
  ctx.globalAlpha = 1;

  // Durum metni
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = isPreviewValid ? '#86efac' : '#fca5a5';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(isPreviewValid ? '✓ Bırak: E' : '✗ Dolu', previewPos.x, previewPos.y + previewSize / 2 + 3);

  ctx.restore();
}
