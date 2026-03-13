import React from 'react';
import { MARKET_NAME } from '../constants';

interface WelcomeScreenProps {
    onPlay: () => void;
    onQuickStart: (playerName: string, roomId: string) => void;
    onSettings: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPlay, onQuickStart, onSettings }) => {
    const [quickName, setQuickName] = React.useState('');
    const [quickRoom, setQuickRoom] = React.useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());
    const [showQuickStart, setShowQuickStart] = React.useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="menu-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fed7aa_28%,#7c2d12_70%,#1c1917_100%)] safe-top safe-bottom">
            {/* Grid arka plan */}
            <div className="fixed inset-0 opacity-20 pointer-events-none [background-image:linear-gradient(to_right,transparent_0,transparent_47px,rgba(255,255,255,0.14)_48px),linear-gradient(to_bottom,transparent_0,transparent_47px,rgba(255,255,255,0.14)_48px)] [background-size:48px_48px]" />

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

                {/* ── Aksiyon Butonları ──────────────────────────────────────────── */}
                <div className="space-y-3 mt-2">

                    {/* Mobil: Hızlı Başla */}
                    {isMobile && !showQuickStart && (
                        <button
                            onClick={() => setShowQuickStart(true)}
                            className="w-full rounded-2xl bg-[linear-gradient(135deg,#16a34a,#15803d)] px-6 py-4 text-base font-black uppercase tracking-[0.16em] text-white shadow-lg active:scale-[0.97] transition-transform"
                        >
                            ⚡ Hızlı Başla
                        </button>
                    )}

                    {/* Hızlı başlama formu */}
                    {isMobile && showQuickStart && (
                        <div className="space-y-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                                <input
                                    type="text"
                                    value={quickName}
                                    onChange={(e) => setQuickName(e.target.value)}
                                    placeholder="Oyuncu adın"
                                    maxLength={12}
                                    className="w-full rounded-xl border border-green-500/30 bg-stone-900 px-4 py-3 text-base font-semibold text-stone-100 outline-none placeholder:text-stone-500 focus:border-green-400"
                                />
                                <input
                                    type="text"
                                    value={quickRoom}
                                    onChange={(e) => setQuickRoom(e.target.value.toUpperCase())}
                                    placeholder="Oda Kodu (örn: AB12)"
                                    maxLength={8}
                                    className="w-full rounded-xl border border-green-500/30 bg-stone-900 px-4 py-3 text-base font-semibold uppercase text-stone-100 outline-none placeholder:text-stone-500 focus:border-green-400"
                                />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => quickName.trim() && quickRoom.trim() && onQuickStart(quickName.trim(), quickRoom.trim())}
                                    disabled={!quickName.trim() || !quickRoom.trim()}
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

                    {/* Normal butonlar */}
                    <button
                        onClick={onPlay}
                        className="w-full rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#ea580c)] px-6 py-4 text-lg font-black uppercase tracking-[0.16em] text-stone-950 shadow-lg active:scale-[0.97] transition-transform"
                    >
                        🎮 {isMobile ? 'Karakter Seç' : 'Oyuna Gir'}
                    </button>
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
                    <p className="text-xs text-stone-500">v1.0 · Terracraft Deluxe</p>
                </div>
            </div>
        </div>
    );
};
