import React from 'react';
import { MARKET_NAME } from '../constants';

interface WelcomeScreenProps {
    onPlay: () => void;
    onQuickStart: (playerName: string) => void; // Hızlı başlama
    onSettings: () => void;
}

const serviceCards = [
    { title: 'Prep', text: 'Stokla, pisir, tabak hazirla.' },
    { title: 'Serve', text: 'Kuyrugu erit, masayi temiz tut.' },
    { title: 'Night', text: 'Upgrade al, yarina plan yap.' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPlay, onQuickStart, onSettings }) => {
    const [quickName, setQuickName] = React.useState('');
    const [showQuickStart, setShowQuickStart] = React.useState(false);
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
    <div className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,#fef3c7_0%,#fed7aa_28%,#7c2d12_70%,#1c1917_100%)] safe-top safe-bottom touch-pan-y">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,transparent_0,transparent_47px,rgba(255,255,255,0.14)_48px),linear-gradient(to_bottom,transparent_0,transparent_47px,rgba(255,255,255,0.14)_48px)] [background-size:48px_48px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,251,235,0.85),rgba(255,251,235,0))]" />

        <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row lg:items-stretch lg:gap-10 lg:px-12 lg:justify-center">
            <section className="flex w-full flex-col justify-between rounded-[32px] border border-white/30 bg-stone-950/72 p-6 text-stone-100 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur md:p-8 lg:max-w-xl lg:min-h-0">
                <div className="space-y-5">
                    <div className="inline-flex w-fit items-center rounded-full border border-amber-300/40 bg-amber-200/12 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
                        Yerel co-op mutfak
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-300">Ana menü</p>
                        <h1 className="max-w-md text-3xl font-black uppercase leading-none text-amber-50 sm:text-4xl md:text-6xl">
                            {MARKET_NAME}
                        </h1>
                        <p className="max-w-lg text-sm leading-6 text-stone-300 md:text-base">
                            Plate-up ritmini koruyan ama mobilde de rahat oynanan bir mutfak akisi.
                            Servis, bulasik ve gece ekonomisi ayni ekranda net kalsin diye giris akisini sadeledim.
                        </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {serviceCards.map((card) => (
                            <div key={card.title} className="rounded-2xl border border-white/12 bg-white/6 p-3">
                                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">{card.title}</div>
                                <p className="mt-2 text-sm leading-5 text-stone-300">{card.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    {/* Mobil için hızlı başlama */}
                    {isMobile && !showQuickStart && (
                        <button
                            onClick={() => setShowQuickStart(true)}
                            className="w-full rounded-2xl bg-[linear-gradient(135deg,#16a34a,#15803d)] px-6 py-4 text-base font-black uppercase tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
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
                                placeholder="Oyuncu adın (ör: Chef1)"
                                maxLength={12}
                                className="w-full rounded-xl border border-green-500/30 bg-stone-900 px-4 py-3 text-base font-semibold text-stone-100 outline-none transition-colors placeholder:text-stone-500 focus:border-green-400"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => quickName.trim() && onQuickStart(quickName.trim())}
                                    disabled={!quickName.trim()}
                                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-white transition-colors hover:bg-green-500 disabled:bg-stone-700 disabled:text-stone-500"
                                >
                                    Başla
                                </button>
                                <button
                                    onClick={() => setShowQuickStart(false)}
                                    className="rounded-xl border border-stone-600 bg-stone-800 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-stone-300 transition-colors hover:bg-stone-700"
                                >
                                    İptal
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Normal butonlar */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            onClick={onPlay}
                            className="flex-1 rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#ea580c)] px-6 py-4 text-base font-black uppercase tracking-[0.16em] text-stone-950 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                        >
                            {isMobile ? 'Karakter Seç' : 'Oyuna gir'}
                        </button>
                        <button
                            onClick={onSettings}
                            className="rounded-2xl border border-white/18 bg-white/8 px-6 py-4 text-base font-black uppercase tracking-[0.16em] text-stone-100 transition-colors hover:bg-white/14"
                        >
                            Ayarlar
                        </button>
                    </div>
                </div>
            </section>

            <section className="relative w-full overflow-hidden rounded-[32px] border border-stone-800/70 bg-stone-950/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:p-8 lg:flex-1">
                <div className="absolute inset-x-10 top-0 h-32 rounded-full bg-amber-400/15 blur-3xl" />
                <div className="relative grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[28px] border border-stone-700 bg-stone-900/90 p-5">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-400">Servis panosu</p>
                                <h2 className="mt-2 text-2xl font-black uppercase text-stone-100">Mutfak temposu</h2>
                            </div>
                            <div className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                                Hazır
                            </div>
                        </div>

                        <div className="mt-5 grid gap-4">
                            <div className="rounded-3xl bg-[linear-gradient(160deg,#1f2937,#111827)] p-4">
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">Hazırlık hattı</div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="h-14 w-14 rounded-2xl bg-amber-100" />
                                            <div className="h-14 w-16 rounded-2xl bg-orange-500" />
                                            <div className="h-14 w-14 rounded-2xl bg-emerald-300" />
                                        </div>
                                    </div>
                                    <div className="w-28 rounded-2xl bg-stone-800/90 p-3 text-right">
                                        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">Akış</div>
                                        <div className="mt-2 text-2xl font-black text-amber-200">3x</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-3xl bg-stone-900 p-4 ring-1 ring-white/5">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Yemek salonu</div>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-stone-800 p-4" />
                                        <div className="rounded-2xl bg-stone-800 p-4" />
                                        <div className="rounded-2xl bg-stone-800 p-4" />
                                        <div className="rounded-2xl bg-stone-800 p-4" />
                                    </div>
                                </div>
                                <div className="rounded-3xl bg-stone-900 p-4 ring-1 ring-white/5">
                                    <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Gece notları</div>
                                    <ul className="mt-4 space-y-3 text-sm leading-5 text-stone-300">
                                        <li>Temiz tabak olmadan servis alamazsin.</li>
                                        <li>Kirli masa yeni musteriyi bloke eder.</li>
                                        <li>Gece siparisi tek sefer.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="rounded-[28px] border border-stone-800 bg-[linear-gradient(180deg,#292524,#1c1917)] p-5">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Çapraz platform</div>
                            <div className="mt-4 space-y-4">
                                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                                    <div className="text-sm font-black uppercase tracking-[0.16em] text-stone-100">Masaüstü</div>
                                    <p className="mt-2 text-sm leading-5 text-stone-400">WASD, kisa HUD, daha temiz ust bar.</p>
                                </div>
                                <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                                    <div className="text-sm font-black uppercase tracking-[0.16em] text-stone-100">Mobil</div>
                                    <p className="mt-2 text-sm leading-5 text-stone-400">Buyuk dokunmatik alanlar ve tek elle duzen.</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-amber-400/20 bg-amber-300/10 p-5">
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-amber-100/80">Oturum</div>
                            <div className="mt-3 text-3xl font-black uppercase text-amber-50">Hazir misin?</div>
                            <p className="mt-2 text-sm leading-6 text-amber-50/80">
                                Once outfit sec, sonra magazanin adini ayarla ve direkt mutfaga gir.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
    );
};
