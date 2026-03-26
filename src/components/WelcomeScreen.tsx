import React, { useState } from 'react';
import { MARKET_NAME } from '../constants';
import { PatchNotesModal } from './PatchNotesModal';

interface WelcomeScreenProps {
    onPlay: (roomId?: string) => void;
    onQuickStart: (playerName: string, roomId: string) => void;
    onSettings: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPlay, onQuickStart, onSettings }) => {
    const [quickName, setQuickName] = useState('');
    const [quickRoom, setQuickRoom] = useState('');
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [showQuickStart, setShowQuickStart] = useState(false);
    const [showPatchNotes, setShowPatchNotes] = useState(false);

    return (
        <div className="menu-screen bg-[#0f0e0c] safe-top safe-bottom overflow-y-auto relative flex items-center justify-center">

            {/* Sol Alt — Bilgi Butonu (Glassmorphism) */}
            <div className="fixed bottom-6 left-6 z-20">
                <button
                    onClick={() => setShowPatchNotes(true)}
                    className="
                        group relative flex items-center justify-center
                        w-14 h-14 
                        bg-white/5 backdrop-blur-xl 
                        border border-white/10 rounded-2xl
                        shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                        hover:bg-white/10 hover:border-white/20
                        active:scale-90 transition-all duration-300
                    "
                    title="Nasıl Oynanır & Yama Notları"
                >
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <span className="text-2xl filter drop-shadow-md group-hover:scale-110 transition-transform">ℹ️</span>
                </button>
            </div>

            <div className="relative mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-6 py-12">

                {/* Logo */}
                <div className="text-center space-y-2">
                    <div className="text-5xl mb-2">🍽️</div>
                    <h1 className="text-3xl font-black uppercase tracking-widest text-stone-100">
                        {MARKET_NAME}
                    </h1>
                    <p className="text-xs text-stone-500 tracking-widest uppercase">Multiplayer Mutfak Oyunu</p>
                </div>

                {/* Butonlar */}
                <div className="w-full space-y-2 mt-2">
                    {!showJoinForm && !showQuickStart && (
                        <>
                            <button
                                onClick={() => onPlay()}
                                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-stone-950 shadow-md active:scale-[0.97] transition-all"
                            >
                                Oda Kur
                            </button>
                            <button
                                onClick={() => setShowJoinForm(true)}
                                className="w-full rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-stone-200 active:scale-[0.97] transition-all"
                            >
                                Odaya Katıl
                            </button>
                            <button
                                onClick={() => setShowQuickStart(true)}
                                className="w-full rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-stone-200 active:scale-[0.97] transition-all"
                            >
                                Hızlı Başla
                            </button>
                            <button
                                onClick={onSettings}
                                className="w-full rounded-xl border border-stone-800 px-6 py-3 text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-400 transition-colors"
                            >
                                Ayarlar
                            </button>
                        </>
                    )}

                    {/* Odaya Katılma */}
                    {showJoinForm && (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={quickRoom}
                                onChange={(e) => setQuickRoom(e.target.value.toUpperCase())}
                                placeholder="Oda Kodu (örn: AB12)"
                                maxLength={8}
                                autoFocus
                                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-semibold uppercase text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => quickRoom.trim() && onPlay(quickRoom.trim())}
                                    disabled={!quickRoom.trim()}
                                    className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black uppercase tracking-widest text-stone-950 disabled:bg-stone-700 disabled:text-stone-500"
                                >
                                    Katıl
                                </button>
                                <button
                                    onClick={() => setShowJoinForm(false)}
                                    className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-bold text-stone-400"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hızlı Başla */}
                    {showQuickStart && (
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={quickName}
                                onChange={(e) => setQuickName(e.target.value)}
                                placeholder="Oyuncu adın"
                                maxLength={12}
                                autoFocus
                                className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-semibold text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => quickName.trim() && onQuickStart(quickName.trim(), Math.random().toString(36).substring(2, 6).toUpperCase())}
                                    disabled={!quickName.trim()}
                                    className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-black uppercase tracking-widest text-stone-950 disabled:bg-stone-700 disabled:text-stone-500"
                                >
                                    Başla
                                </button>
                                <button
                                    onClick={() => setShowQuickStart(false)}
                                    className="rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-bold text-stone-400"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-[10px] text-stone-700 tracking-widest uppercase mt-2">v1.3.0</p>
            </div>

            {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
        </div>
    );
};
