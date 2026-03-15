import React from 'react';

interface Props {
    onClose: () => void;
}

export const PatchNotesModal: React.FC<Props> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl max-h-[85vh] bg-stone-900 border border-stone-700 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden text-stone-200">
                {/* Header */}
                <div className="bg-stone-800/50 p-6 flex justify-between items-center border-b border-stone-700/50">
                    <div>
                        <h2 className="text-3xl font-black text-amber-400 tracking-tight">Yama Notları 📜</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-400/10 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-400/20">v1.2.0</span>
                            <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Son Güncelleme</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white rounded-2xl flex items-center justify-center text-2xl transition-all active:scale-90 border border-stone-700"
                    >
                        ✕
                    </button>
                </div>

                {/* İçerik Gövdesi */}
                <div className="p-8 overflow-y-auto space-y-10 no-scrollbar pb-12">

                    {/* v1.2.0 */}
                    <section>
                        <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="h-px flex-1 bg-stone-800"></span>
                            🆕 v1.2.0 — Stok Sistemi Kaldırıldı
                            <span className="h-px flex-1 bg-stone-800"></span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-3xl flex gap-5 items-start">
                                <div className="text-4xl bg-stone-800 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-700 shadow-inner flex-shrink-0">♾️</div>
                                <div>
                                    <h4 className="text-lg font-black text-white mb-1">Sonsuz Malzeme</h4>
                                    <p className="text-sm text-stone-400 leading-relaxed">Stok sistemi tamamen kaldırıldı. Artık malzemelerin bitmesi diye bir şey yok — istediğin kadar al, dilediğin kadar pişir!</p>
                                </div>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-3xl flex gap-5 items-start">
                                <div className="text-4xl bg-stone-800 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-700 shadow-inner flex-shrink-0">🗑️</div>
                                <div>
                                    <h4 className="text-lg font-black text-white mb-1">Kaldırılanlar</h4>
                                    <p className="text-sm text-stone-400 leading-relaxed">Gece sipariş verme butonu, "Depo Kapasitesi" upgrade'i ve stok sayacı göstergesi kaldırıldı. Gece ekranı sadeleşti.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* v1.1.0 */}
                    <section>
                        <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="h-px flex-1 bg-stone-800"></span>
                            📦 v1.1.0 — Büyük Güncelleme
                            <span className="h-px flex-1 bg-stone-800"></span>
                        </h3>
                    </section>

                    {/* Öne Çıkanlar */}
                    <section>
                        <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="h-px flex-1 bg-stone-800"></span>
                            🚀 Öne Çıkan Yenilikler
                            <span className="h-px flex-1 bg-stone-800"></span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-3xl flex gap-5 items-start">
                                <div className="text-4xl bg-stone-800 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-700 shadow-inner flex-shrink-0">🍜</div>
                                <div>
                                    <h4 className="text-lg font-black text-white mb-1">Yeni Menü: Çorba & Dürüm</h4>
                                    <p className="text-sm text-stone-400 leading-relaxed">Mutfak genişledi! Artık müşteriler 🍜 Çorba ve 🌯 Dürüm (Kebap) sipariş edebiliyor. Yeni istasyonları kurmayı unutma!</p>
                                </div>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-3xl flex gap-5 items-start">
                                <div className="text-4xl bg-stone-800 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-700 shadow-inner flex-shrink-0">🔥</div>
                                <div>
                                    <h4 className="text-lg font-black text-white mb-1">Dinamik Pişirme Efektleri</h4>
                                    <p className="text-sm text-stone-400 leading-relaxed">Fırınlardan çıkan dumanlar, dairesel % ilerleme göstergeleri ve yanan yemekler için 🔥 uyarı ikonları eklendi.</p>
                                </div>
                            </div>
                            <div className="bg-stone-800/40 border border-stone-700/50 p-5 rounded-3xl flex gap-5 items-start">
                                <div className="text-4xl bg-stone-800 w-16 h-16 rounded-2xl flex items-center justify-center border border-stone-700 shadow-inner flex-shrink-0">🧺</div>
                                <div>
                                    <h4 className="text-lg font-black text-white mb-1">PlateUp Tarzı Animasyonlar</h4>
                                    <p className="text-sm text-stone-400 leading-relaxed">Karakter artık eşyaları iki eliyle önünde tutuyor ve yürürken yemekler dinamik olarak aşağı yukarı zıplıyor (bobbing).</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Mekanik Değişiklikler */}
                    <section>
                        <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="h-px flex-1 bg-stone-800"></span>
                            ⚙️ Mekanik Güncellemeler
                            <span className="h-px flex-1 bg-stone-800"></span>
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4 group">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <p className="text-sm text-stone-300 leading-relaxed"><strong className="text-white">Gelişmiş Upgrade:</strong> Artık gece dükkanından toplam 4 adet fırın satın alabilirsin.</p>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <p className="text-sm text-stone-300 leading-relaxed"><strong className="text-white">Oturma Düzeni:</strong> Müşterilerin koltuklara göre bakış yönleri ve konuşma balonları düzeltildi.</p>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <p className="text-sm text-stone-300 leading-relaxed"><strong className="text-white">Reset Day:</strong> Game Over olduğunda skordan %20 ceza ile kaldığın günden devam edebilirsin.</p>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                <p className="text-sm text-stone-300 leading-relaxed"><strong className="text-white">Kontroller:</strong> PC için Ok Tuşları desteği ve mobil joystick hassasiyeti artırıldı.</p>
                            </li>
                        </ul>
                    </section>

                    {/* Yakında Gelecekler */}
                    <section>
                        <h3 className="text-xs font-black text-stone-500 mb-4 uppercase tracking-[0.3em] flex items-center gap-3">
                            <span className="h-px flex-1 bg-stone-800"></span>
                            🔮 Yakında Gelecekler
                            <span className="h-px flex-1 bg-stone-800"></span>
                        </h3>
                        <div className="bg-purple-500/5 border border-purple-500/20 p-6 rounded-[2rem]">
                            <ul className="space-y-3">
                                <li className="text-sm text-purple-200/70 flex items-center gap-3">
                                    <span className="text-purple-400">✦</span> Zor Mod (Hardcore): Tek Hata = Game Over!
                                </li>
                                <li className="text-sm text-purple-200/70 flex items-center gap-3">
                                    <span className="text-purple-400">✦</span> İçecek İstasyonu: Hızlı servis edilebilen soğuk içecekler.
                                </li>
                                <li className="text-sm text-purple-200/70 flex items-center gap-3">
                                    <span className="text-purple-400">✦</span> Prep Station: Overcooked tarzı doğrama mekanikleri.
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
            </div>
        </div>
    );
};
