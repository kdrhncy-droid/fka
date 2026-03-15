import React, { useState } from 'react';
import { MARKET_NAME } from '../constants';
import { PatchNotesModal } from './PatchNotesModal';
import { loadSave } from '../hooks/useSaveGame';

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
    const save = loadSave();

    return (
        <div className="menu-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fed7aa_28%,#7c2d12_70%,#1c1917_100%)] safe-top safe-bottom overflow-y-auto relative">
            {/* Grid arka plan */}
            <div className="fixed inset-0 opacity-20 pointer-events-none [background-image:linear-gradient(to_right,transparent_0,transparent_47px,rgba(255,255,255,0.14)_48px),linear-gradient(to_bottom,transparent_0,transparent_47px,rgba(255,255,255,0.14)_48px)] [background-size:48px_48px]" />

            {/* Sağ Üst Bilgi Butonu */}
            <div className="absolute top-4 right-4 z-20">
                <button
                    onClick={() => setShowPatchNotes(true)}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-2xl text-amber-200 shadow-xl transition-all active:scale-90"
                    title="Yama Notları"
                >
                    ℹ️
                </button>
            </div>

            <div className="relative mx-auto flex w-full max-w-lg flex-col gap-5 px-5 py-8 md:py-12 md:max-w-2xl">
                {/* ── Logo & Başlık ──────────────────────────────────────────────── */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-200/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
                        Yerel co-op mutfak
                    </div>
                    <h1 className="text-4xl font-black uppercase leading-none text-amber-50 sm:text-5xl drop-shadow-lg">
                        {MARKET_NAME}
                    </h1>
                    <p className="text-sm leading-6 text-stone-300 max-w-md mx-auto">
                        Pişir, servis et, bulaşık yıka. Gece gelince upgrade al!
                    </p>
                </div>

                {/* ── Bilgi Kartları ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { icon: '🔧', title: 'Hazırlık', text: 'Stokla & pişir' },
                        { icon: '☀️', title: 'Servis', text: 'Müşteri ağırla' },
                        { icon: '🌙', title: 'Gece', text: 'Upgrade al' },
                    ].map((card) => (
                        <div key={card.title} className="rounded-2xl border border-white/12 bg-stone-950/60 backdrop-blur-sm p-3 text-center">
                            <div className="text-2xl">{card.icon}</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200 mt-1">{card.title}</div>
                            <p className="mt-1 text-xs leading-4 text-stone-400">{card.text}</p>
                        </div>
                    ))}
                </div>

                {/* ── Hall of Fame ──────────────────────────────────────────────── */}
                {save.totalGamesPlayed > 0 && (
                    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm p-4 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-300">🏆 Rekorlar</div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <div className="text-xl font-black text-amber-300">${save.highScore}</div>
                                <div className="text-[10px] text-stone-400 mt-0.5">En yüksek skor</div>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                                <div className="text-xl font-black text-purple-300">{save.bestDay}. Gün</div>
                                <div className="text-[10px] text-stone-400 mt-0.5">En uzun oyun</div>
                            </div>
                        </div>
                        {save.bestDay > 0 && save.bestDayHolders && save.bestDayHolders.length > 0 && (() => {
                            const shown = save.bestDayHolders.slice(0, 3);
                            const rest = save.bestDayHolders.length - shown.length;
                            return (
                                <div className="bg-black/20 rounded-xl px-3 py-2 flex items-center gap-2">
                                    <span className="text-yellow-400 text-sm">👑</span>
                                    <div>
                                        <span className="text-[10px] text-stone-400">En iyi gün rekortmeni: </span>
                                        <span className="text-xs font-black text-yellow-200">
                                            {shown.join(' · ')}
                                            {rest > 0 && <span className="text-stone-500 font-normal"> +{rest} kişi</span>}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                        {save.playerName && (
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/5">
                                <span className="text-stone-500">Kayıtlı ismin:</span>
                                <span className="font-black text-stone-300">{save.playerName}
                                    {save.nameChangesLeft > 0
                                        ? <span className="ml-1.5 text-amber-400/70">({save.nameChangesLeft} değişim hakkı)</span>
                                        : <span className="ml-1.5 text-red-400/70">(kilitli)</span>
                                    }
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Aksiyon Butonları ──────────────────────────────────────────── */}
                <div className="space-y-3 mt-2">

                    {!showJoinForm && !showQuickStart && (
                        <>
                            <button
                                onClick={() => onPlay()}
                                className="w-full rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#ea580c)] px-6 py-4 text-lg font-black uppercase tracking-[0.16em] text-stone-950 shadow-lg active:scale-[0.97] transition-transform"
                            >
                                🏠 Oda Kur
                            </button>

                            <button
                                onClick={() => setShowJoinForm(true)}
                                className="w-full rounded-2xl bg-[linear-gradient(135deg,#3b82f6,#2563eb)] px-6 py-4 text-lg font-black uppercase tracking-[0.16em] text-white shadow-lg active:scale-[0.97] transition-transform"
                            >
                                🤝 Odaya Katıl
                            </button>

                            <button
                                onClick={() => setShowQuickStart(true)}
                                className="w-full rounded-2xl bg-[linear-gradient(135deg,#16a34a,#15803d)] px-6 py-4 text-base font-black uppercase tracking-[0.16em] text-white shadow-lg active:scale-[0.97] transition-transform"
                            >
                                ⚡ Hızlı Başla
                            </button>
                        </>
                    )}

                    {/* Odaya Katılma Formu */}
                    {showJoinForm && (
                        <div className="space-y-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-md">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-200 mb-2">Arkadaşının Odasına Katıl</div>
                            <input
                                type="text"
                                value={quickRoom}
                                onChange={(e) => setQuickRoom(e.target.value.toUpperCase())}
                                placeholder="Oda Kodu (örn: AB12)"
                                maxLength={8}
                                className="w-full rounded-xl border border-blue-500/30 bg-stone-900 px-4 py-3 text-base font-semibold uppercase text-stone-100 outline-none placeholder:text-stone-500 focus:border-blue-400"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (quickRoom.trim()) {
                                            onPlay(quickRoom.trim());
                                        }
                                    }}
                                    disabled={!quickRoom.trim()}
                                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white active:bg-blue-500 disabled:bg-stone-700 disabled:text-stone-500"
                                >
                                    Devam Et
                                </button>
                                <button
                                    onClick={() => setShowJoinForm(false)}
                                    className="rounded-xl border border-stone-600 bg-stone-800 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-stone-300"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hızlı Başlama Formu */}
                    {showQuickStart && (
                        <div className="space-y-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 backdrop-blur-md">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-green-200 mb-2">Hızlıca Oyuna Gir</div>
                            <input
                                type="text"
                                value={quickName}
                                onChange={(e) => setQuickName(e.target.value)}
                                placeholder="Oyuncu adın"
                                maxLength={12}
                                className="w-full rounded-xl border border-green-500/30 bg-stone-900 px-4 py-3 text-base font-semibold text-stone-100 outline-none placeholder:text-stone-500 focus:border-green-400"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => quickName.trim() && onQuickStart(quickName.trim(), Math.random().toString(36).substring(2, 6).toUpperCase())}
                                    disabled={!quickName.trim()}
                                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white active:bg-green-500 disabled:bg-stone-700 disabled:text-stone-500"
                                >
                                    Başla
                                </button>
                                <button
                                    onClick={() => setShowQuickStart(false)}
                                    className="rounded-xl border border-stone-600 bg-stone-800 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-stone-300"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onSettings}
                        className="w-full rounded-2xl border border-white/18 bg-white/8 px-6 py-3 text-base font-black uppercase tracking-[0.16em] text-stone-100 active:bg-white/14 transition-colors"
                    >
                        ⚙️ Ayarlar
                    </button>
                </div>

                {/* ── Alt bilgi ─────────────────────────────────────────────────── */}
                <div className="text-center space-y-2 mt-4">
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-400">
                        <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                            <div className="font-black text-stone-300">🖥️ PC</div>
                            <div className="mt-1">WASD + E tuşu</div>
                        </div>
                        <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                            <div className="font-black text-stone-300">📱 Mobil</div>
                            <div className="mt-1">Joystick + buton</div>
                        </div>
                    </div>
                    <p className="text-xs text-stone-500">v1.1.0 · Terracraft Deluxe</p>
                </div>
            </div>

            {/* Yama Notları Modalı */}
            {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
        </div>
    );
};
