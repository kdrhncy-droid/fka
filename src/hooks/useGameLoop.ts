import React, { useEffect } from "react";
import { Socket } from "socket.io-client";
import {
  GameState,
  Player,
  GAME_WIDTH,
  GAME_HEIGHT,
  DIRTY_TRAY_POS,
  TRAY_STATION,
  INGREDIENTS,
  PLATE_STACK_POS,
  RECIPE_DEFS,
  TRASH_STATION,
  SINK_STATION,
  DAY_TICKS,
  NIGHT_TICKS,
} from "../types/game";

import { drawCustomer, cleanupCRS } from "../renderer/drawCustomer";
import { drawPlayer } from "../renderer/drawPlayer";
import { drawCookStation } from "../renderer/drawCookStation";
import { drawHoldingStation } from "../renderer/drawHoldingStation";
import { drawCounters } from "../renderer/drawCounter";
import { movePlayer } from "./usePlayerMovement";
import { setupGameEffects, renderFloatingTexts, renderPunchParticles } from "./useGameEffects";
import { updateProximityAudio } from "./useProximityAudio";
import { drawLayoutPreview, LayoutEditorState } from '../renderer/drawLayoutEditor';
import { drawDirtyTrayBasket } from '../renderer/drawDirtyTrayBasket';
import { drawWaitList } from '../renderer/drawWaitList';
import { drawDirtyTable } from '../renderer/drawDirtyTable';
import { drawChoppingBoard } from '../renderer/drawChoppingBoard';
import { drawServiceWindow } from '../renderer/drawServiceWindow';
import { drawLighting } from '../renderer/drawLighting';
import { getNearestInteractable } from '../utils/interactUtils';

import { drawFloorCached } from '../renderer/drawFloorCached';
import { drawInteractionRing } from '../renderer/drawInteractionRing';
import { drawBasicStations } from '../renderer/drawBasicStations';
import { drawPlateStack } from '../renderer/drawPlateStack';
import { drawSinks } from '../renderer/drawSinks';
import { drawPerfStats } from '../renderer/drawPerfStats';

interface UseGameLoopProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isJoined: boolean;
  myId: string;
  socket: Socket | null;
  gameStateRef: React.MutableRefObject<GameState>;
  localPlayerRef: React.MutableRefObject<{ x: number; y: number }>;
  keysRef: React.MutableRefObject<{ w: boolean; a: boolean; s: boolean; d: boolean }>;
  joystickVectorRef: React.MutableRefObject<{ x: number; y: number }>;
  audioElementsRef?: React.MutableRefObject<Record<string, HTMLAudioElement>>;
  globalVolume?: number;
  editorStateRef?: React.MutableRefObject<LayoutEditorState>;
  showPerfStats?: boolean;
  onPreviewUpdate?: () => void;
}

export function useGameLoop({
  canvasRef, isJoined, myId, socket, gameStateRef,
  localPlayerRef, keysRef, joystickVectorRef, audioElementsRef, globalVolume = 1.0, editorStateRef, showPerfStats = false, onPreviewUpdate,
}: UseGameLoopProps) {
  useEffect(() => {
    if (!isJoined) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let lastFrameTime = 0;
    const lastEmitRef = { current: 0 };
    const { floatingTexts, punchParticles, cleanup: cleanupEffects } = setupGameEffects(socket);

    // Perf stats
    const fpsBuffer: number[] = [];
    let perfMs = 0;
    let perfFps = 0;

    const render = (time: number) => {
      const renderStart = performance.now();
      const state = gameStateRef.current;
      const deltaMs = lastFrameTime === 0 ? 1000 / 60 : Math.min(50, time - lastFrameTime);
      lastFrameTime = time;
      const frameScale = deltaMs / (1000 / 60);

      movePlayer(time, lastEmitRef, frameScale, { socket, gameStateRef, localPlayerRef, keysRef, joystickVectorRef });

      // Editor preview her frame güncellenir — gecikme sıfır
      onPreviewUpdate?.();

      const isEditing = !!(editorStateRef?.current?.isMoving || editorStateRef?.current?.isMovingTable);
      // stationLayout'tan ingredient pozisyonlarını çıkar
      const ingPositions: Record<string, { x: number; y: number }> = {};
      if (state.stationLayout) {
        for (const [id, pos] of Object.entries(state.stationLayout) as [string, { x: number; y: number }][]) {
          if (id.startsWith('ingredient_')) {
            ingPositions[id.replace('ingredient_', '')] = { x: pos.x, y: pos.y };
          }
        }
      }
      const movingTableId = editorStateRef?.current?.movingTableId;
      const plateStackDynPos = state.stationLayout?.['plate_stack'] ?? undefined;
      const sinkDynPos = state.stationLayout?.['sink'] ?? undefined;
      const chopBoardDynPos = state.stationLayout?.['chop1'] ?? undefined;
      drawFloorCached(ctx, state.unlockedDishes, isEditing, ingPositions, state.tableLayout, movingTableId, plateStackDynPos, sinkDynPos, chopBoardDynPos);

      // ── Etkileşim Halkası Çizimi ──
      const lp = localPlayerRef.current;
      const nearest = getNearestInteractable(lp.x, lp.y, state);
      drawInteractionRing(ctx, nearest, isEditing);

      const movingId = editorStateRef?.current?.movingStationId;
      drawBasicStations(ctx, state, movingId);

      // Kirli tepsi sepeti
      const dirtyTrayLayout = state.stationLayout?.['dirty_tray'] ?? DIRTY_TRAY_POS;
      if (movingId !== 'dirty_tray') {
        drawDirtyTrayBasket(ctx, state.dirtyTrayCount || 0, dirtyTrayLayout);
      } // end dirty_tray guard

      const hs = state.holdingStations;
      if (hs) {
        drawPlateStack(ctx, state, movingId, PLATE_STACK_POS);
        drawCounters(ctx, hs);
      }

      // Servis penceresi
      if (state.serviceWindow) drawServiceWindow(ctx, state.serviceWindow);

      if (state.cookStations) {
        for (const station of state.cookStations) drawCookStation(ctx, station, time);
      }

      // Kesme tahtaları
      if (state.choppingBoards) {
        for (const board of state.choppingBoards) {
          if (movingId === board.id) continue;
          drawChoppingBoard(ctx, board, time);
        }
      }

      // Lavabolar (3D Tabaklar ve Yıkama Barı)
      if (state.sinks) {
        drawSinks(ctx, state.sinks, state.stationLayout, movingId);
      }

      state.customers.forEach((c) => drawCustomer(ctx, c, state.tableLayout));
      // Her ~150 frame'de (~5sn) CRS temizliği
      if (frameId % 150 === 0) {
        const activeIds = new Set<string>(state.customers.map(c => c.id));
        cleanupCRS(activeIds);
      }
      (state.dirtyTables ?? []).forEach((t) => drawDirtyTable(ctx, t.seatX, t.seatY, state.tableLayout));
      drawWaitList(ctx, state.waitList ?? []);

      // Layout editor önizlemesi — oyunculardan ÖNCE çizilir (oyuncu üstte kalır)
      if ((editorStateRef?.current?.isMoving || editorStateRef?.current?.isMovingTable) && state.stationLayout) {
        drawLayoutPreview(ctx, editorStateRef.current, state.stationLayout, state.tableLayout);
      }

      const sp = state.players;
      if (sp) {
        Object.values(sp).forEach((p: Player) => {
          const isMe = p.id === myId;
          drawPlayer(ctx, isMe ? localPlayerRef.current.x : p.x, isMe ? localPlayerRef.current.y : p.y, p, isMe);
        });
        if (audioElementsRef?.current) {
          updateProximityAudio(audioElementsRef, localPlayerRef, sp, myId, globalVolume);
        }
      }

      renderFloatingTexts(ctx, floatingTexts);
      renderPunchParticles(ctx, punchParticles);

      // ── Işıklandırma Sistemi ──────────────────────────────────────────────
      drawLighting(ctx, state.dayPhase, state.dayTimer);

      // ── Perf Stats (sadece FPS — ping HTML overlay'de gösteriliyor) ─────────
      if (showPerfStats) {
        perfMs = performance.now() - renderStart;
        fpsBuffer.push(1000 / Math.max(deltaMs, 1));
        if (fpsBuffer.length > 30) fpsBuffer.shift();
        perfFps = Math.round(fpsBuffer.reduce((a, b) => a + b, 0) / fpsBuffer.length);

        drawPerfStats(ctx, perfFps);
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frameId); cleanupEffects(); };
  }, [isJoined, myId, socket, showPerfStats]);
}
