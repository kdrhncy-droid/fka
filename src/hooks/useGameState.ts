import { useEffect, useRef, useState } from 'react';
import { GameState, DAY_TICKS, Upgrades, DailyObjective } from '../types/game';
import React from 'react';

interface GameUIState {
    score: number;
    dayPhase: 'prep' | 'day' | 'night';
    dayTimer: number;
    upgrades: Upgrades;
    day: number;
    ovenCount: number;
    tableCount: number;
    queueLen: number;
    lives: number;
    isGameOver: boolean;
    menuChoices: string[] | null;
    unlockedDishes: string[];
    pendingCardChoices: import('../../shared/types').GameCard[] | null;
    activeCards: import('../../shared/types').ActiveCard[];
    comboCount: number;
    dailyObjectives: DailyObjective[];
}

const DEFAULT_UI: GameUIState = {
    score: 0, dayPhase: 'prep', dayTimer: DAY_TICKS,
    upgrades: { patience: 0, earnings: 0, plateStackMax: 0, safeOven: 0,
                fryerSpeed: 0, cakeBaker: 0, coffeeMachine: 0, extraSink: 0, extraChopBoard: 0 },
    day: 1, ovenCount: 1, tableCount: 3, queueLen: 0, lives: 3,
    isGameOver: false, menuChoices: null, unlockedDishes: [],
    pendingCardChoices: null, activeCards: [], comboCount: 0,
    dailyObjectives: [],
};

function upgradesEqual(a: Upgrades, b: Upgrades): boolean {
    return a.patience === b.patience && a.earnings === b.earnings
        && a.plateStackMax === b.plateStackMax && a.safeOven === b.safeOven
        && a.fryerSpeed === b.fryerSpeed && a.cakeBaker === b.cakeBaker
        && a.coffeeMachine === b.coffeeMachine
        && a.extraSink === b.extraSink && a.extraChopBoard === b.extraChopBoard;
}

function arraysEqual(a: string[] | null, b: string[] | null): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return false; }
    return true;
}

export function useGameState(gameStateRef: React.MutableRefObject<GameState>) {
    const [ui, setUI] = useState<GameUIState>(DEFAULT_UI);
    const prevRef = useRef<GameUIState>(DEFAULT_UI);

    useEffect(() => {
        const id = setInterval(() => {
            const s = gameStateRef.current;
            const prev = prevRef.current;
            const next: GameUIState = {
                score: s.score,
                dayPhase: s.dayPhase,
                dayTimer: s.dayTimer,
                upgrades: s.upgrades,
                day: s.day,
                ovenCount: s.cookStations?.length ?? 1,
                tableCount: Object.keys(s.tableLayout ?? {}).length,
                queueLen: s.waitList?.length ?? 0,
                lives: s.lives ?? 3,
                isGameOver: s.isGameOver ?? false,
                menuChoices: s.menuChoices ?? null,
                unlockedDishes: s.unlockedDishes ?? [],
                pendingCardChoices: s.pendingCardChoices ?? null,
                activeCards: s.activeCards ?? [],
                comboCount: s.comboCount ?? 0,
                dailyObjectives: s.dailyObjectives ?? [],
            };
            // Shallow compare — değişmediyse setState çağırma
            const objChanged = next.dailyObjectives.length !== prev.dailyObjectives.length ||
                next.dailyObjectives.some((o, i) => {
                    const p = prev.dailyObjectives[i];
                    return !p || o.progress !== p.progress || o.completed !== p.completed || o.failed !== p.failed;
                });
            if (
                next.score !== prev.score || next.dayPhase !== prev.dayPhase ||
                next.dayTimer !== prev.dayTimer || next.day !== prev.day ||
                next.ovenCount !== prev.ovenCount || next.tableCount !== prev.tableCount || next.queueLen !== prev.queueLen ||
                next.lives !== prev.lives || next.isGameOver !== prev.isGameOver ||
                !upgradesEqual(next.upgrades, prev.upgrades) ||
                !arraysEqual(next.menuChoices, prev.menuChoices) ||
                !arraysEqual(next.unlockedDishes, prev.unlockedDishes) ||
                next.pendingCardChoices !== prev.pendingCardChoices ||
                next.activeCards.length !== prev.activeCards.length ||
                next.activeCards.some((c, i) => c.id !== prev.activeCards[i]?.id) ||
                next.comboCount !== prev.comboCount ||
                objChanged
            ) {
                prevRef.current = next;
                setUI(next);
            }
        }, 200);
        return () => clearInterval(id);
    }, []);

    return ui;
}
