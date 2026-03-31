import React from 'react';
import { BaseModal } from './BaseModal';

interface Props {
    onClose: () => void;
}

export const PatchNotesModal: React.FC<Props> = ({ onClose }) => {
    return (
        <BaseModal onClose={onClose} zIndex="z-[100]" maxWidth="max-w-2xl">
            {/* Header */}
            <div className="bg-stone-800/50 p-6 flex justify-between items-center border-b border-stone-700/50">
                <div>
                    <h2 className="text-3xl font-black text-amber-400 tracking-tight">Oyun Rehberi & Yenilikler 📜</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="bg-amber-400/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-400/20">v1.5.0</span>
                        <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Yatay Ekran & Pro İpuçları</span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-12 h-12 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-90 border border-stone-700"
                >
                    ✕
                </button>
            </div>

            {/* İçerik */}
            <div className="p-8 overflow-y-auto space-y-10 no-scrollbar pb-12">

                {/* Nasıl Oynanır */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        🎮 Nasıl Oynanır
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-stone-800/40 border border-stone-700/50 p-4 rounded-2xl">
                            <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">🔧 Hazırlık Fazı</div>
                            <p className="text-sm text-stone-300 leading-relaxed">Gün başlamadan önce mutfağı hazırla. İstasyonları taşı (E tuşu), fırınları konumlandır. Hazır olunca "Dükkanı Aç" butonuna bas.</p>
                        </div>
                        <div className="bg-stone-800/40 border border-stone-700/50 p-4 rounded-2xl">
                            <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">☀️ Servis Fazı</div>
                            <p className="text-sm text-stone-300 leading-relaxed">Müşteriler gelir, koltuklara oturur ve sipariş verir. Malzemeyi al → fırına koy → pişince tabağa al → müşteriye servis et. Kirli masaları temizle, kirli tabakları lavaboda yıka.</p>
                        </div>
                        <div className="bg-stone-800/40 border border-stone-700/50 p-4 rounded-2xl">
                            <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2">🌙 Gece Fazı</div>
                            <p className="text-sm text-stone-300 leading-relaxed">Tüm müşteriler gidince gece başlar. Kazandığın parayla upgrade satın al, yeni yemek kilidi aç, fırın ekle veya can al. Sonra yeni güne başla.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-stone-800/40 border border-stone-700/50 p-4 rounded-2xl">
                                <div className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">🖥️ PC Kontroller</div>
                                <ul className="text-xs text-stone-300 space-y-1">
                                    <li><span className="text-amber-300 font-bold">WASD / Ok Tuşları</span> — Hareket</li>
                                    <li><span className="text-amber-300 font-bold">E / Boşluk</span> — Al / Ver / Etkileş</li>
                                    <li><span className="text-amber-300 font-bold">R (basılı tut)</span> — Doğra</li>
                                    <li><span className="text-amber-300 font-bold">F</span> — Yumruk (Dövüş)</li>
                                </ul>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-700/50 p-4 rounded-2xl">
                                <div className="text-xs font-black text-stone-400 uppercase tracking-widest mb-2">📱 Mobil Kontroller</div>
                                <ul className="text-xs text-stone-300 space-y-1">
                                    <li><span className="text-amber-300 font-bold">Sol Joystick</span> — Hareket</li>
                                    <li><span className="text-amber-300 font-bold">AL/VER Butonu</span> — Etkileş</li>
                                    <li><span className="text-amber-300 font-bold">DOĞRA Butonu</span> — Kesme tahtası</li>
                                    <li><span className="text-amber-300 font-bold">DÖV Butonu</span> — Yumruk</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Yemek Sistemi */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        🍽️ Yemek & Pişirme
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { emoji: '🥗', name: 'Salata', ing: '🥬 Sebze → doğra → fırın', time: '0.5 sn', note: 'En hızlı — başlangıçta açık' },
                            { emoji: '🍔', name: 'Burger', ing: '🥩 Et → doğra → fırın', time: '1.2 sn', note: 'Başlangıçta açık' },
                            { emoji: '🍕', name: 'Pizza', ing: '🍞 Hamur → fırın', time: '3 sn', note: 'Gece kilit açılır' },
                            { emoji: '🌯', name: 'Dürüm', ing: '🍢 Kebap → doğra → fırın', time: '2 sn', note: 'Gece kilit açılır' },
                            { emoji: '🍜', name: 'Çorba', ing: '🥘 Çorba Malz. → fırın', time: '4 sn', note: 'Gece kilit açılır' },
                        ].map(d => (
                            <div key={d.emoji} className="flex items-center gap-3 bg-stone-800/30 border border-stone-700/40 px-4 py-2.5 rounded-xl">
                                <span className="text-2xl w-8 text-center">{d.emoji}</span>
                                <div className="flex-1">
                                    <span className="text-white font-bold text-sm">{d.name}</span>
                                    <span className="text-stone-400 text-xs ml-2">{d.ing}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-amber-300 text-xs font-bold">{d.time}</div>
                                    <div className="text-stone-500 text-[10px]">{d.note}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-3 text-center">🔪 Doğrama gerektiren malzemeleri önce kesme tahtasına bırak, R ile doğra, sonra fırına koy</p>
                    <p className="text-xs text-stone-500 mt-1 text-center">⚠️ Yemek pişince tabakla al → müşteriye servis et. Almazsan yanar → ⬛ çöpe at</p>
                </section>

                {/* Upgrade Sistemi */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        ⬆️ Upgrade Sistemi
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <ul className="space-y-3">
                        {[
                            { icon: '🔥', name: 'Ek Fırın', desc: 'Başlangıçta 1 fırın var, toplamda 4\'e kadar alınabilir. Her fırın farklı yemek pişirebilir.' },
                            { icon: '🛡️', name: 'Güvenli Fırın', desc: 'Lv1: yemek yanma süresi 2 kat uzar. Lv2: yemekler hiç yanmaz. 2 seviye.' },
                            { icon: '⏳', name: 'Müşteri Sabrı', desc: 'Müşterilerin bekleme süresi uzar. 3 seviye, her biri +300 tick sabır ekler.' },
                            { icon: '💰', name: 'Servis Kazancı', desc: 'Her servisten +5 ekstra puan. 2 seviye.' },
                            { icon: '🍽️', name: 'Tabak Yığını', desc: 'Başlangıç tabak kapasitesi artar (4→6→8→10). 3 seviye.' },
                            { icon: '❤️', name: 'Ekstra Can', desc: 'Maksimum 3 can. Her can $75. Müşteri sabrı bitince can gider.' },
                        ].map(u => (
                            <li key={u.name} className="flex items-start gap-3">
                                <span className="text-xl mt-0.5">{u.icon}</span>
                                <p className="text-sm text-stone-300 leading-relaxed"><span className="text-white font-bold">{u.name}:</span> {u.desc}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Özellikler */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        ✨ Özellikler
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <ul className="space-y-3">
                        {[
                            { icon: '🔪', text: 'Kesme tahtası — Et, Sebze ve Kebabı önce doğra (R tuşu), sonra fırına koy. Doğrama ses efekti ile birlikte!' },
                            { icon: '🧺', text: 'Tepsi sistemi — tek seferde 4 yemeğe kadar taşı, müşterilere sırayla servis et' },
                            { icon: '🏃', text: 'Çok oyunculu co-op — aynı odada birden fazla oyuncu, her biri bağımsız hareket eder' },
                            { icon: '😤', text: 'Müşteri kişilikleri — Kibar, Kaba, Recep ve Thug tipleri, her birinin farklı diyalogları var' },
                            { icon: '👊', text: 'Dövüş sistemi — kaba müşterileri dövebilirsin, ama intikam için Thug grubu gelir' },
                            { icon: '🔧', text: 'İstasyon taşıma — hazırlık fazında E tuşuyla istasyonları grid üzerinde yeniden konumlandır' },
                            { icon: '📦', text: 'Gizli malzeme istasyonları — kilidi açılmayan yemeklerin malzemeleri mutfakta görünmez' },
                            { icon: '👥', text: '8 farklı karakter tipi — Aşçı, Chef, Garson, Kasiyer, Temizlikçi, Kasap, Fırıncı, Müdür' },
                            { icon: '�🌙', text: 'Gece efekti — gece fazında ekran kararır, yıldızlar çıkar' },
                            { icon: '💀', text: 'Game Over — 3 can bitince oyun biter, %20 ceza ile aynı günden devam seçeneği' },
                            { icon: '🔊', text: 'Proximity ses — yakındaki oyuncuların sesi daha yüksek duyulur (WebRTC sesli sohbet)' },
                            { icon: '🎮', text: 'HUD Editörü — tüm mobil butonları (Joystick, AL/VER, DOĞRA, DÖV, Müzik) sürükle-bırak ile konumlandır' },
                        ].map((f, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <span className="text-lg mt-0.5 w-6 text-center">{f.icon}</span>
                                <p className="text-sm text-stone-300 leading-relaxed">{f.text}</p>
                            </li>
                        ))}
                    </ul>
                </section>

                {/* Pro İpuçları */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        � Pro İpuçları
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { icon: '⚡', tip: 'Tepsiyi doldur', desc: 'Tek seferde 4 yemek taşıyabilirsin. Önce tüm yemekleri topla, sonra masalara dağıt — çok daha hızlı!' },
                            { icon: '🔄', tip: 'Paralel pişirme', desc: 'Birden fazla fırın varsa farklı yemekleri aynı anda pişir. Boş fırın bırakma!' },
                            { icon: '🧹', tip: 'Masaları hemen temizle', desc: 'Müşteri gidince masayı hemen temizle. Kirli masa yeni müşteri almaz, ciro düşer.' },
                            { icon: '🏃', tip: 'Hazırlık fazını iyi kullan', desc: 'Fırını servis penceresine yakın koy. Mesafeyi kısaltmak servis hızını ciddi artırır.' },
                            { icon: '💰', tip: 'Upgrade önceliği', desc: 'İlk önce "Müşteri Sabrı" al — can kaybını önler. Sonra ek fırın, sonra servis kazancı.' },
                            { icon: '👊', tip: 'Kaba müşteriler', desc: 'Kaba (rude) müşterileri dövebilirsin ama Thug gelirse arkadaşlarını da getirir. Dikkatli ol!' },
                        ].map((t, i) => (
                            <div key={i} className="flex items-start gap-3 bg-stone-800/30 border border-stone-700/40 px-4 py-3 rounded-xl">
                                <span className="text-xl mt-0.5 w-7 text-center flex-shrink-0">{t.icon}</span>
                                <div>
                                    <span className="text-white font-bold text-sm">{t.tip}: </span>
                                    <span className="text-stone-400 text-xs leading-relaxed">{t.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Son Güncellemeler */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        🚀 Son Güncellemeler (v1.5.0)
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[2rem] space-y-4">
                        <div className="flex items-start gap-3">
                            <span className="text-emerald-400 font-bold">🟢</span>
                            <div>
                                <div className="text-sm font-bold text-stone-200 uppercase tracking-wider">Yatay Ekran Zorunluluğu</div>
                                <p className="text-xs text-stone-400 mt-1 leading-relaxed">Telefon ve tablet kullanıcıları için portrait modda otomatik "Cihazı Yatır" ekranı eklendi. Oyun artık tüm mobil cihazlarda doğru görünüyor.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-emerald-400 font-bold">💡</span>
                            <div>
                                <div className="text-sm font-bold text-stone-200 uppercase tracking-wider">Pro İpuçları Bölümü</div>
                                <p className="text-xs text-stone-400 mt-1 leading-relaxed">Oyun rehberine 6 yeni pro ipucu eklendi — tepsi stratejisi, upgrade önceliği, paralel pişirme ve daha fazlası.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-amber-400 font-bold">✨</span>
                            <div>
                                <div className="text-sm font-bold text-stone-200 uppercase tracking-wider">Modern Glassmorphism UI (v1.4.0)</div>
                                <p className="text-xs text-stone-400 mt-1 leading-relaxed">Ana menü butonları ve bilgi paneli modern, yarı saydam ve şık bir görünüme kavuşturuldu.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-amber-400 font-bold">🟢</span>
                            <div>
                                <div className="text-sm font-bold text-stone-200 uppercase tracking-wider">Etkileşim Halkası (v1.4.0)</div>
                                <p className="text-xs text-stone-400 mt-1 leading-relaxed">Yaklaştığın istasyon veya masanın altında yumuşak yeşil bir halka belirir. Neyle etkileşime girdiğini artık çok daha net görebilirsin.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Yakında */}
                <section>
                    <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                        <span className="h-px flex-1 bg-stone-800"></span>
                        🔮 Yakında Gelecekler
                        <span className="h-px flex-1 bg-stone-800"></span>
                    </h3>
                    <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-[2rem]">
                        <ul className="space-y-3">
                            <li className="text-sm text-purple-200/70 flex items-center gap-3">
                                <span className="text-purple-400">✦</span> Restoran Düzeni (Layout) Seçimi: Farklı mutfak tipleriyle başla
                            </li>
                            <li className="text-sm text-purple-200/70 flex items-center gap-3">
                                <span className="text-purple-400">✦</span> Dinamik Masa Kapasitesi: 1-4 kişilik farklı masalar
                            </li>
                            <li className="text-sm text-purple-200/70 flex items-center gap-3">
                                <span className="text-purple-400">✦</span> Zor Mod (Hardcore): Tek Hata = Game Over
                            </li>
                        </ul>
                    </div>
                </section>

            </div>

            {/* Footer */}
            <div className="p-6 bg-stone-950/50 text-center border-t border-stone-800">
                <button
                    onClick={onClose}
                    className="w-full max-w-xs py-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                >
                    Anladım, Devam Et!
                </button>
            </div>
        </BaseModal>
    );
};
