import { useCallback, useEffect, useRef, useState, MutableRefObject } from 'react';
import { Socket } from 'socket.io-client';
import { GameState } from '../../shared/types';
import {
  LayoutEditorState,
  snapToGrid,
  pixelToGridIndex,
  isGridCellOccupied,
  isTablePositionValid,
} from '../renderer/drawLayoutEditor';

const MOVE_INTERACT_R = 90;

// Kilitli yemeklere ait istasyonlar — unlock edilmeden taşınamaz
const LOCKED_DISH_STATIONS: Record<string, string> = {
  'fryer1':           '🍟',
  'fridge1':          '🥤',
  'cakebaker1':       '🍰',
  'coffee1':          '☕',
  'ingredient_🥔':    '🍟',  // Patates — 🍟 unlock gerekli
  'ingredient_🧁':    '🍰',  // Hamur tatlı — 🍰 unlock gerekli
  'ingredient_🍢':    '🌯',  // Kebap — 🌯 unlock gerekli
};

interface Params {
  socket: Socket | null;
  gameStateRef: MutableRefObject<GameState>;
  localPlayerRef: MutableRefObject<{ x: number; y: number }>;
  dayPhase: string;
}

const DEFAULT_STATE: LayoutEditorState = {
  isMoving: false,
  movingStationId: null,
  originalPos: null,
  previewPos: null,
  isPreviewValid: false,
  isMovingTable: false,
  movingTableId: null,
};

export function useLayoutEditor({ socket, gameStateRef, localPlayerRef, dayPhase }: Params) {
  const [editorState, setEditorState] = useState<LayoutEditorState>(DEFAULT_STATE);
  const editorStateRef = useRef<LayoutEditorState>(DEFAULT_STATE);
  const lastInteractRef = useRef<number>(0);

  const setState = useCallback((next: LayoutEditorState) => {
    editorStateRef.current = next;
    setEditorState(next);
  }, []);

  // dayPhase prep → day geçişinde taşıma modunu iptal et
  useEffect(() => {
    if (dayPhase !== 'prep' && (editorStateRef.current.isMoving || editorStateRef.current.isMovingTable)) {
      const { movingStationId, movingTableId } = editorStateRef.current;
      if (movingStationId) socket?.emit('unlockStation', { stationId: movingStationId });
      if (movingTableId) socket?.emit('unlockTable', { tableId: movingTableId });
      setState(DEFAULT_STATE);
    }
  }, [dayPhase, socket, setState]);

  // Socket event'leri: stationMoved, stationLocked, stationUnlocked
  useEffect(() => {
    if (!socket) return;

    const onMoved = ({ stationId, x, y }: { stationId: string; x: number; y: number }) => {
      const gs = gameStateRef.current;
      if (gs.stationLayout[stationId]) {
        gs.stationLayout[stationId].x = x;
        gs.stationLayout[stationId].y = y;
      }
      const oven = gs.cookStations?.find(s => s.id === stationId);
      if (oven) { oven.x = x; oven.y = y; }
      const board = gs.choppingBoards?.find(b => b.id === stationId);
      if (board) { board.x = x; board.y = y; }
      const fryer = gs.fryers?.find(f => f.id === stationId);
      if (fryer) { fryer.x = x; fryer.y = y; }
      const fridge = gs.fridges?.find(f => f.id === stationId);
      if (fridge) { fridge.x = x; fridge.y = y; }
      const cakeBaker = gs.cakeBakers?.find(c => c.id === stationId);
      if (cakeBaker) { cakeBaker.x = x; cakeBaker.y = y; }
      const coffeeMachine = gs.coffeeMachines?.find(c => c.id === stationId);
      if (coffeeMachine) { coffeeMachine.x = x; coffeeMachine.y = y; }
    };

    const onLocked = ({ stationId, lockedBy }: { stationId: string; lockedBy: string }) => {
      const gs = gameStateRef.current;
      gs.lockedStations[stationId] = lockedBy;
    };

    const onUnlocked = ({ stationId }: { stationId: string }) => {
      const gs = gameStateRef.current;
      delete gs.lockedStations[stationId];
    };

    const onTableMoved = ({ tableId, x, y, seats }: { tableId: string; x: number; y: number; seats?: 1 | 2 | 3 | 4 }) => {
      const gs = gameStateRef.current;
      if (gs.tableLayout[tableId]) {
        gs.tableLayout[tableId] = { id: tableId, x, y, seats: seats ?? gs.tableLayout[tableId].seats };
      }
    };

    const onTableLocked = ({ tableId, lockedBy }: { tableId: string; lockedBy: string }) => {
      const gs = gameStateRef.current;
      gs.lockedTables[tableId] = lockedBy;
    };

    const onTableUnlocked = ({ tableId }: { tableId: string }) => {
      const gs = gameStateRef.current;
      delete gs.lockedTables[tableId];
    };

    socket.on('stationMoved', onMoved as (...args: unknown[]) => void);
    socket.on('stationLocked', onLocked as (...args: unknown[]) => void);
    socket.on('stationUnlocked', onUnlocked as (...args: unknown[]) => void);
    socket.on('tableMoved', onTableMoved as (...args: unknown[]) => void);
    socket.on('tableLocked', onTableLocked as (...args: unknown[]) => void);
    socket.on('tableUnlocked', onTableUnlocked as (...args: unknown[]) => void);
    return () => {
      socket.off('stationMoved', onMoved as (...args: unknown[]) => void);
      socket.off('stationLocked', onLocked as (...args: unknown[]) => void);
      socket.off('stationUnlocked', onUnlocked as (...args: unknown[]) => void);
      socket.off('tableMoved', onTableMoved as (...args: unknown[]) => void);
      socket.off('tableLocked', onTableLocked as (...args: unknown[]) => void);
      socket.off('tableUnlocked', onTableUnlocked as (...args: unknown[]) => void);
    };
  }, [socket, gameStateRef]);

  // Önizleme pozisyonunu oyuncu hareketiyle güncelle — render loop'tan çağrılır (16ms)
  // Sadece ref güncellenir, setState çağrılmaz → re-render yok, sıfır gecikme
  const updatePreview = useCallback(() => {
    const state = editorStateRef.current;
    if (!state.isMoving && !state.isMovingTable) return;
    const { x, y } = localPlayerRef.current;
    const snapped = snapToGrid(x, y);
    const gs = gameStateRef.current;

    let valid: boolean;
    if (state.isMovingTable && state.movingTableId) {
      valid = isTablePositionValid(snapped.x, snapped.y, gs.tableLayout, state.movingTableId);
    } else if (state.movingStationId) {
      const { col, row } = pixelToGridIndex(snapped.x, snapped.y);
      valid = !isGridCellOccupied(col, row, gs.stationLayout, state.movingStationId);
    } else return;

    if (state.previewPos?.x !== snapped.x || state.previewPos?.y !== snapped.y || state.isPreviewValid !== valid) {
      // Sadece ref güncelle — canvas bunu okur, React re-render tetiklenmez
      editorStateRef.current = { ...state, previewPos: snapped, isPreviewValid: valid };
    }
  }, [localPlayerRef, gameStateRef]);

  const handleInteract = useCallback(() => {
    if (dayPhase !== 'prep') return;

    // Spam koruması — 300ms debounce
    const now = Date.now();
    if (now - lastInteractRef.current < 300) return;
    lastInteractRef.current = now;
    const gs = gameStateRef.current;
    const player = gs.players[socket?.id ?? ''];
    const lp = localPlayerRef.current;

    // 1. Masa taşıma modu aktifse → bırak
    if (editorStateRef.current.isMovingTable) {
      const { movingTableId } = editorStateRef.current;
      if (!movingTableId) return;
      const snapped = snapToGrid(lp.x, lp.y);
      const valid = isTablePositionValid(snapped.x, snapped.y, gs.tableLayout, movingTableId);
      if (!valid) return;
      socket?.emit('moveTable', { tableId: movingTableId, x: snapped.x, y: snapped.y });
      setState(DEFAULT_STATE);
      return;
    }

    // 2. İstasyon taşıma modu aktifse → bırak
    if (editorStateRef.current.isMoving) {
      const { movingStationId } = editorStateRef.current;
      if (!movingStationId) return;
      const { x, y } = localPlayerRef.current;
      const snapped = snapToGrid(x, y);
      const { col, row } = pixelToGridIndex(snapped.x, snapped.y);
      const valid = !isGridCellOccupied(col, row, gs.stationLayout, movingStationId);
      if (!valid) return;
      socket?.emit('moveStation', { stationId: movingStationId, x: snapped.x, y: snapped.y });
      setState(DEFAULT_STATE);
      return;
    }

    // Elde nesne varsa taşıma başlatma
    if (player?.holding) return;

    // 3. En yakın boş masa kontrolü (istasyon kontrolünden ÖNCE)
    const tableLayout = gs.tableLayout;
    let closestTable: { id: string; dist: number } | null = null;
    for (const [id, t] of Object.entries(tableLayout ?? {}) as [string, { id: string; x: number; y: number }][]) {
      if ((gs.lockedTables ?? {})[id]) continue;
      const hasCust = gs.customers.some(c =>
        Math.hypot(c.seatX - t.x, c.seatY - t.y) < 60
      );
      const hasDirty = gs.dirtyTables.some(d =>
        Math.hypot(d.seatX - t.x, d.seatY - t.y) < 60
      );
      if (hasCust || hasDirty) continue;
      const dist = Math.hypot(lp.x - t.x, lp.y - t.y);
      if (dist < MOVE_INTERACT_R && (!closestTable || dist < closestTable.dist)) {
        closestTable = { id, dist };
      }
    }
    if (closestTable) {
      const tableId = closestTable.id;
      const t = (tableLayout ?? {})[tableId] as { id: string; x: number; y: number };
      socket?.emit('lockTable', { tableId });
      const snapped = snapToGrid(lp.x, lp.y);
      const valid = isTablePositionValid(snapped.x, snapped.y, tableLayout ?? {}, tableId);
      setState({
        ...DEFAULT_STATE,
        isMovingTable: true,
        movingTableId: tableId,
        originalPos: { x: t.x, y: t.y },
        previewPos: snapped,
        isPreviewValid: valid,
      });
      return;
    }

    // 4. En yakın taşınabilir istasyonu bul (counter'lar hariç — duvara sabit)
    let closest: { id: string; dist: number } | null = null;
    const layout = gs.stationLayout as Record<string, { id: string; x: number; y: number }>;
    for (const [id, pos] of Object.entries(layout)) {
      // Counter'lar taşınamaz — duvara sabit
      if (id.startsWith('counter')) continue;
      // Kilitli istasyonları atla
      if (gs.lockedStations[id]) continue;
      // Unlock edilmemiş yemeklere ait istasyonları atla
      const requiredDish = LOCKED_DISH_STATIONS[id];
      if (requiredDish && !gs.unlockedDishes.includes(requiredDish)) continue;
      const dist = Math.hypot(lp.x - pos.x, lp.y - pos.y);
      if (dist < MOVE_INTERACT_R && (!closest || dist < closest.dist)) {
        closest = { id, dist };
      }
    }
    if (!closest) return;

    // Taşıma modunu başlat
    const stationId = closest.id;
    const pos = gs.stationLayout[stationId];
    socket?.emit('lockStation', { stationId });
    const snapped = snapToGrid(lp.x, lp.y);
    const { col, row } = pixelToGridIndex(snapped.x, snapped.y);
    const valid = !isGridCellOccupied(col, row, gs.stationLayout, stationId);
    setState({
      isMoving: true,
      movingStationId: stationId,
      originalPos: { x: pos.x, y: pos.y },
      previewPos: snapped,
      isPreviewValid: valid,
      isMovingTable: false,
      movingTableId: null,
    });
  }, [dayPhase, socket, gameStateRef, localPlayerRef, setState]);

  const handleCancel = useCallback(() => {
    const { movingStationId, movingTableId } = editorStateRef.current;
    if (movingStationId) socket?.emit('unlockStation', { stationId: movingStationId });
    if (movingTableId) socket?.emit('unlockTable', { tableId: movingTableId });
    setState(DEFAULT_STATE);
  }, [socket, setState]);

  const handleCycleSeats = useCallback(() => {
    if (dayPhase !== 'prep') return;
    if (editorStateRef.current.isMovingTable) {
      const { movingTableId } = editorStateRef.current;
      if (movingTableId) {
        socket?.emit('cycleTableSeats', { tableId: movingTableId });
      }
    }
  }, [dayPhase, socket]);

  return { editorState, editorStateRef, handleInteract, handleCancel, handleCycleSeats, updatePreview };
}
