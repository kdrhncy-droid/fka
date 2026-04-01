import React, { useState } from 'react';
import { BaseModal } from './BaseModal';

interface Props { onClose: () => void; }

type Tab = 'nasil' | 'yemek' | 'upgrade' | 'guncelleme';

const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'nasil',     icon: '🎮', label: 'Nasıl Oynanır' },
    { id: 'yemek',     icon: '🍽️', label: 'Yemekler'      },
    { id: 'upgrade',   icon: '⬆️', label: 'Upgradeler'    },
    { id: 'guncelleme',icon: '🚀', label: 'Güncellemeler' },
];

export const PatchNotesModal: React.FC<Props> = ({ onClose }) => {
    const [tab, setTab] = useState<Tab>('nasil');

    return (
        <BaseModal onClose={onClose} zIndex="z-[100]" maxWidth="max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-700/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-black text-base">📜 Oyun Rehberi</span>
                    <span className="bg-amber-400/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/20">v2.4.0</span>
                </div>
                <button onClick={onClose}
                    className="w-9 h-9 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 border border-stone-700">
                    ✕
                </button>
            </div>

            {/* Landscape: sol sekme + sağ içerik */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* Sol sekme listesi */}
                <div className="flex-none w-28 sm:w-36 border-r border-stone-800 flex flex-col py-2 bg-stone-950/40">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`flex flex-col items-center gap-1 py-3 px-2 text-center transition-colors ${tab === t.id ? 'bg-amber-900/20 text-amber-400 border-r-2 border-amber-400' : 'text-stone-500 hover:text-stone-300'}`}>
                            <span className="text-xl">{t.icon}</span>
                            <span className="text-[9px] font-black uppercase tracking-wide leading-tight">{t.label}</span>
                        </button>
                    ))}
                    <div className="flex-1" />
                    <button onClick={onClose}
                        className="mx-2 mb-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-[10px] font-black uppercase tracking-wide active:scale-95 transition-all">
                        Tamam ✓
                    </button>
                </div>

                {/* Sağ içerik */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

                    {/* ── NASIL OYNANIR ── */}
                    {tab === 'nasil' && <>
                        {[
                            { title: '🔧 Hazırlık Fazı', text: 'Gün başlamadan önce mutfağı hazırla. İstasyonları taşı (E tuşu), fırınları konumlandır. Hazır olunca "Dükkanı Aç" butonuna bas.' },
                            { title: '☀️ Servis Fazı', text: 'Müşteriler gelir, koltuklara oturur ve sipariş verir. Malzemeyi al → fırına koy → pişince tabağa al → müşteriye servis et. Kirli masaları temizle, kirli tabakları lavaboda yıka.' },
                            { title: '🌙 Gece Fazı', text: 'Tüm müşteriler gidince gece başlar. Kazandığın parayla upgrade satın al, yeni yemek kilidi aç, fırın ekle veya can al.' },
                        ].map(s => (
                            <div key={s.title} className="bg-stone-800/40 border border-stone-700/50 p-3 rounded-xl">
                                <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-1">{s.title}</div>
                                <p className="text-xs text-stone-300 leading-relaxed">{s.text}</p>
                            </div>
                        ))}

                        <div className="bg-stone-800/40 border border-stone-700/50 p-3 rounded-xl">
                            <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">🎭 Müşteri Tipleri</div>
                            <div className="space-y-1">
                                {[
                                    { icon: '😊', name: 'Kibar', desc: 'Sabırlı. Dövülürse puan kaybı.' },
                                    { icon: '😤', name: 'Kaba', desc: 'Agresif. Dövülebilir, intikam alabilir.' },
                                    { icon: '🤪', name: 'Recep', desc: 'Dramatik. %60 intikam şansı.' },
                                    { icon: '💀', name: 'Thug', desc: 'İntikam grubu olarak gelir.' },
                                    { icon: '👑', name: 'VIP', desc: 'Sabırsız ama yüksek bahşiş.' },
                                    { icon: '🍺', name: 'Sarhoş', desc: 'Tutarsız, yanlış yemek kabul eder.' },
                                    { icon: '🔍', name: 'Müfettiş', desc: 'Sert değerlendirme, düşük bahşiş.' },
                                ].map(t => (
                                    <div key={t.name} className="flex items-center gap-2 text-xs">
                                        <span className="text-sm w-5 text-center">{t.icon}</span>
                                        <span className="text-white font-bold w-14 flex-shrink-0">{t.name}</span>
                                        <span className="text-stone-400">{t.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-stone-800/40 border border-stone-700/50 p-3 rounded-xl">
                                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">🖥️ PC</div>
                                <ul className="text-xs text-stone-300 space-y-1">
                                    <li><span className="text-amber-300 font-bold">WASD</span> — Hareket</li>
                                    <li><span className="text-amber-300 font-bold">E / Boşluk</span> — Etkileş</li>
                                    <li><span className="text-amber-300 font-bold">R</span> — Doğra</li>
                                    <li><span className="text-amber-300 font-bold">F</span> — Döv</li>
                                </ul>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-700/50 p-3 rounded-xl">
                                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">📱 Mobil</div>
                                <ul className="text-xs text-stone-300 space-y-1">
                                    <li><span className="text-amber-300 font-bold">Sol Panel</span> — Joystick</li>
                                    <li><span className="text-amber-300 font-bold">Al/Ver</span> — Etkileş</li>
                                    <li><span className="text-amber-300 font-bold">Doğra</span> — Kesme tahtası</li>
                                    <li><span className="text-amber-300 font-bold">Döv</span> — Yumruk</li>
                                </ul>
                            </div>
                        </div>
                    </>}

                    {/* ── YEMEKLER ── */}
                    {tab === 'yemek' && <>
                        {[
                            { emoji: '🥗', name: 'Salata', ing: '🥬 Sebze → doğra → fırın', time: '0.5 sn', note: 'Başlangıçta açık' },
                            { emoji: '🍔', name: 'Burger', ing: '🥩 Et → doğra → fırın', time: '1.2 sn', note: 'Başlangıçta açık' },
                            { emoji: '🍕', name: 'Pizza', ing: '🍞 Hamur → fırın', time: '3 sn', note: 'Gece kilit açılır' },
                            { emoji: '🌯', name: 'Dürüm', ing: '🍢 Kebap → doğra → fırın', time: '2 sn', note: 'Gece kilit açılır' },
                            { emoji: '🍜', name: 'Çorba', ing: '🥘 Çorba Malz. → fırın', time: '4 sn', note: 'Gece kilit açılır' },
                            { emoji: '🍟', name: 'Patates', ing: '🥔 Patates → fritöz', time: '1 sn', note: 'Gece kilit açılır' },
                            { emoji: '🍰', name: 'Pasta', ing: '🧁 Hamur Tatlı → pasta fırını', time: '4 sn', note: 'Gece kilit açılır' },
                            { emoji: '☕', name: 'Kahve', ing: 'Kahve makinesi satın al', time: 'Anında', note: 'Makineden direkt' },
                            { emoji: '🥤', name: 'İçecek', ing: 'Buzdolabı (hazır)', time: 'Anında', note: 'Sürekli yenilenir' },
                            { emoji: '🌶️', name: 'Acı Sos', ing: 'Pişmiş yemek → Baharat Rafı', time: 'Anında', note: '3. günden sonra' },
                        ].map(d => (
                            <div key={d.emoji} className="flex items-center gap-2 bg-stone-800/30 border border-stone-700/40 px-3 py-2 rounded-xl">
                                <span className="text-xl w-7 text-center flex-shrink-0">{d.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-white font-bold text-xs">{d.name}</span>
                                    <span className="text-stone-400 text-[10px] ml-1.5">{d.ing}</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-amber-300 text-[10px] font-bold">{d.time}</div>
                                    <div className="text-stone-500 text-[9px]">{d.note}</div>
                                </div>
                            </div>
                        ))}
                        <p className="text-[10px] text-stone-500 text-center">🔪 Doğrama gerektiren malzemeleri önce kesme tahtasına bırak, R ile doğra</p>
                    </>}

                    {/* ── UPGRADELER ── */}
                    {tab === 'upgrade' && <>
                        {[
                            { icon: '🔥', name: 'Ek Fırın', desc: 'Başlangıçta 1, toplamda 4\'e kadar. Her fırın farklı yemek pişirebilir.' },
                            { icon: '🛡️', name: 'Güvenli Fırın', desc: 'Lv1: yanma 2x yavaş. Lv2: hiç yanmaz.' },
                            { icon: '⏳', name: 'Müşteri Sabrı', desc: 'Bekleme süresi uzar. 3 seviye.' },
                            { icon: '💰', name: 'Servis Kazancı', desc: 'Her servisten +5 ekstra puan. 2 seviye.' },
                            { icon: '🍽️', name: 'Tabak Yığını', desc: 'Başlangıç tabak kapasitesi artar. 3 seviye.' },
                            { icon: '❤️', name: 'Ekstra Can', desc: 'Max 3 can. Her can $75.' },
                            { icon: '⚡', name: 'Fritöz Hızı', desc: 'Patates daha hızlı kızarır. 2 seviye.' },
                            { icon: '🍰', name: 'Pasta Fırını', desc: 'Pasta için özel makine.' },
                            { icon: '☕', name: 'Kahve Makinesi', desc: 'Menüye kahve ekler.' },
                        ].map(u => (
                            <div key={u.name} className="flex items-start gap-2 bg-stone-800/30 border border-stone-700/40 px-3 py-2.5 rounded-xl">
                                <span className="text-lg mt-0.5 flex-shrink-0">{u.icon}</span>
                                <div>
                                    <span className="text-white font-bold text-xs">{u.name}: </span>
                                    <span className="text-stone-400 text-xs">{u.desc}</span>
                                </div>
                            </div>
                        ))}
                        <div className="bg-stone-800/30 border border-stone-700/40 px-3 py-2.5 rounded-xl">
                            <div className="text-[10px] font-black text-amber-300 uppercase tracking-widest mb-1.5">💡 Öneri Sırası</div>
                            <p className="text-xs text-stone-400">1. Müşteri Sabrı → 2. Ek Fırın → 3. Servis Kazancı → 4. Güvenli Fırın</p>
                        </div>
                    </>}

                    {/* ── GÜNCELLEMELER ── */}
                    {tab === 'guncelleme' && <>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
                            <div className="text-xs font-black text-emerald-400 uppercase tracking-widest">v2.4.0 — Şu An</div>
                            {[
                                { icon: '🎩', title: 'Şapka Sistemi', desc: 'Her şapka kafaya tam uyumlu canvas çizimi. Aşçı şapkası eklendi. Market kartlarında önizleme.' },
                                { icon: '🕹️', title: 'Joystick Konumlandırma', desc: 'Uzun basınca taşıma modu. Parmakla istediğin yere sürükle, konum kaydedilir.' },
                                { icon: '✨', title: 'Etiket Efektleri', desc: 'Parlayan, Gökkuşağı, Yanıp Sönen, Altın Çerçeve. Canvas\'ta animasyonlu.' },
                                { icon: '🏆', title: 'Unvan Sistemi', desc: '8 unvan (PATRON, EFSANE, ŞEF...). İsim etiketinin altında görünür.' },
                                { icon: '🎨', title: 'Renk Setleri', desc: '8 set (Altın Şef, Gece Karası...). Tek tıkla saç+kıyafet+etiket değişir.' },
                                { icon: '🏷️', title: 'Etiket Konumu', desc: 'İsim ve unvan artık ayağın altında — şapkalar kafada rahatça duruyor.' },
                            ].map(f => (
                                <div key={f.title} className="flex items-start gap-2">
                                    <span className="text-emerald-400 text-sm flex-shrink-0">{f.icon}</span>
                                    <div>
                                        <span className="text-stone-200 font-bold text-xs">{f.title}: </span>
                                        <span className="text-stone-400 text-xs">{f.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-stone-800/30 border border-stone-700/30 p-4 rounded-2xl space-y-2">
                            <div className="text-xs font-black text-stone-400 uppercase tracking-widest">v2.3.0</div>
                            {[
                                { icon: '🛒', t: 'Market', d: 'Coin ile kozmetik. Profil ekranı. Mobil yan panel.' },
                                { icon: '🎭', t: 'Müşteri Tasarımları', d: 'Thug, Recep, Drunk, VIP, Inspector yeni görünümler.' },
                            ].map(f => (
                                <div key={f.t} className="flex items-start gap-2 text-xs">
                                    <span className="flex-shrink-0">{f.icon}</span>
                                    <span className="text-stone-300 font-bold">{f.t}: </span>
                                    <span className="text-stone-500">{f.d}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-stone-800/30 border border-stone-700/30 p-4 rounded-2xl space-y-2">
                            <div className="text-xs font-black text-stone-400 uppercase tracking-widest">v2.2.0</div>
                            {[
                                { icon: '💾', t: 'Kalıcı Profil', d: 'Karakter ve coin oyunlar arası kaydediliyor.' },
                                { icon: '🪙', t: 'Coin Sistemi', d: 'Her gün sonunda ciron\'un %10\'u coin olarak birikir.' },
                                { icon: '🔥', t: 'İntikam Sahnesi', d: 'Sinematik sahne + skip butonu.' },
                            ].map(f => (
                                <div key={f.t} className="flex items-start gap-2 text-xs">
                                    <span className="flex-shrink-0">{f.icon}</span>
                                    <span className="text-stone-300 font-bold">{f.t}: </span>
                                    <span className="text-stone-500">{f.d}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl space-y-2">
                            <div className="text-xs font-black text-amber-400 uppercase tracking-widest">v2.1.0</div>
                            {[
                                { icon: '⚡', t: 'Kart Sistemi', d: 'Her 3 günde 2 kart. 15 farklı kart.' },
                                { icon: '🔥', t: 'Combo', d: 'x1.5 / x2.0 / x3.0 bonus puan.' },
                                { icon: '🌶️', t: 'Özel İstekler', d: 'Acı, Bol, Acele siparişler.' },
                            ].map(f => (
                                <div key={f.t} className="flex items-start gap-2 text-xs">
                                    <span className="flex-shrink-0">{f.icon}</span>
                                    <span className="text-stone-300 font-bold">{f.t}: </span>
                                    <span className="text-stone-500">{f.d}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl">
                            <div className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">🔮 Yakında</div>
                            <ul className="space-y-1.5 text-xs text-purple-200/60">
                                <li>✦ Saç stilleri (dalgalı, afro, at kuyruğu...)</li>
                                <li>✦ Kıyafet stilleri (aşçı önlüğü, garson, şef ceketi)</li>
                                <li>✦ Servis efektleri (yıldız, kalp, ateş partikülleri)</li>
                                <li>✦ Sunucu taraflı hesap</li>
                            </ul>
                        </div>
                    </>}

                </div>
            </div>
        </BaseModal>
    );
};
