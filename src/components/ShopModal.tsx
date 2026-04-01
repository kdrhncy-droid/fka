import React, { useState } from 'react';
import { SHOP_ITEMS, ShopCategory, buyItem, loadProfile, saveProfile } from '../utils/profile';
import { CharacterPreview } from './CharacterPreview';

interface Props {
  onClose: () => void;
  coins: number;
  setCoins: (v: number) => void;
  charType: number;
  hairColor: string; setHairColor: (v: string) => void;
  clothingColor: string; setClothingColor: (v: string) => void;
  nameLabelColor: string; setNameLabelColor: (v: string) => void;
  equippedHat: string; setEquippedHat: (v: string) => void;
  equippedTitle: string; setEquippedTitle: (v: string) => void;
  equippedLabelEffect: string; setEquippedLabelEffect: (v: string) => void;
  setPlayerColor: (v: string) => void;
}

const CATEGORY_LABELS: Record<ShopCategory, { label: string; icon: string }> = {
  hat:           { label: 'Şapkalar',   icon: '🎩' },
  hairColor:     { label: 'Saç',        icon: '💇' },
  clothingColor: { label: 'Kıyafet',    icon: '👕' },
  labelColor:    { label: 'Etiket',     icon: '🏷️' },
  title:         { label: 'Unvanlar',   icon: '🏆' },
  colorSet:      { label: 'Renk Seti',  icon: '🎨' },
  labelEffect:   { label: 'Efektler',   icon: '✨' },
};

const RARITY_STYLE = {
  common: { border: 'border-stone-600',    bg: 'bg-stone-800/60',   badge: 'text-stone-400',  label: 'Normal' },
  rare:   { border: 'border-blue-500/50',  bg: 'bg-blue-900/20',    badge: 'text-blue-400',   label: 'Nadir'  },
  epic:   { border: 'border-purple-500/50',bg: 'bg-purple-900/20',  badge: 'text-purple-400', label: 'Epik'   },
};

const NEW_ITEMS = new Set(['hat_chef', 'hair_orange', 'cloth_rainbow', 'label_rainbow']);

export const ShopModal: React.FC<Props> = ({
  onClose, coins, setCoins,
  charType, hairColor, setHairColor,
  clothingColor, setClothingColor,
  nameLabelColor, setNameLabelColor,
  equippedHat, setEquippedHat,
  equippedTitle, setEquippedTitle,
  equippedLabelEffect, setEquippedLabelEffect,
  setPlayerColor,
}) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('hat');
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null);
  const [owned, setOwned] = useState<string[]>(() => loadProfile().ownedItems);

  const items = SHOP_ITEMS.filter(i => i.category === activeCategory);

  const handleBuy = (itemId: string) => {
    const ok = buyItem(itemId);
    if (ok) {
      const updated = loadProfile();
      setCoins(updated.coins);
      setOwned(updated.ownedItems);
      applyItem(itemId);
    }
    setFeedback({ id: itemId, ok });
    setTimeout(() => setFeedback(null), 1200);
  };

  const applyItem = (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (item.category === 'hat') {
      const next = equippedHat === item.value ? '' : item.value;
      setEquippedHat(next); saveProfile({ equippedHat: next });
    } else if (item.category === 'title') {
      const next = equippedTitle === item.value ? '' : item.value;
      setEquippedTitle(next); saveProfile({ equippedTitle: next });
    } else if (item.category === 'labelEffect') {
      const next = equippedLabelEffect === item.value ? '' : item.value;
      setEquippedLabelEffect(next); saveProfile({ equippedLabelEffect: next });
    } else if (item.category === 'colorSet' && item.colorSet) {      setHairColor(item.colorSet.hair);
      setClothingColor(item.colorSet.clothing);
      setPlayerColor(item.colorSet.clothing);
      setNameLabelColor(item.colorSet.label);
      saveProfile({ hairColor: item.colorSet.hair, clothingColor: item.colorSet.clothing, nameLabelColor: item.colorSet.label });
    } else if (item.category === 'hairColor') {
      setHairColor(item.value); saveProfile({ hairColor: item.value });
    } else if (item.category === 'clothingColor') {
      setClothingColor(item.value); setPlayerColor(item.value); saveProfile({ clothingColor: item.value });
    } else if (item.category === 'labelColor') {
      setNameLabelColor(item.value); saveProfile({ nameLabelColor: item.value });
    }
  };

  const isEquipped = (item: typeof SHOP_ITEMS[0]) => {
    if (item.category === 'hat') return equippedHat === item.value;
    if (item.category === 'title') return equippedTitle === item.value;
    if (item.category === 'labelEffect') return equippedLabelEffect === item.value;
    if (item.category === 'colorSet') return item.colorSet
      ? hairColor === item.colorSet.hair && clothingColor === item.colorSet.clothing
      : false;
    if (item.category === 'hairColor') return hairColor === item.value;
    if (item.category === 'clothingColor') return clothingColor === item.value;
    if (item.category === 'labelColor') return nameLabelColor === item.value;
    return false;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
      style={{ padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)' }}
      onClick={onClose}
    >
      {/* Sol panel + sağ panel yan yana — PC'de geniş, mobil landscape'de kompakt */}
      <div
        className="bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden flex"
        style={{
          width: 'min(95vw, 860px)',
          height: 'min(88dvh, 560px)',
          maxHeight: '88dvh',
        }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── SOL PANEL — karakter önizleme + coin ── */}
        <div className="w-52 flex-shrink-0 bg-stone-950/60 border-r border-stone-800 flex flex-col items-center justify-between py-5 px-4">
          {/* Başlık */}
          <div className="text-center">
            <div className="text-white font-black text-sm">🛒 Market</div>
            <div className="text-stone-500 text-[10px] mt-0.5">Coin ile kozmetik al</div>
          </div>

          {/* Karakter önizleme */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-stone-800 border-2 border-stone-700 overflow-hidden flex items-center justify-center">
                <CharacterPreview charType={charType} size={80} hairColor={hairColor} clothingColor={clothingColor} />
              </div>
              {equippedHat && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">{equippedHat}</span>
              )}
            </div>
            {/* İsim etiketi önizleme */}
            <div className="px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-[10px] font-black" style={{ color: nameLabelColor }}>
              ★ Oyuncu
            </div>
            {/* Renk göstergeleri */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: hairColor }} title="Saç" />
              <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: clothingColor }} title="Kıyafet" />
              <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: nameLabelColor, outline: nameLabelColor === '#ffffff' ? '1px solid #555' : undefined }} title="Etiket" />
            </div>
          </div>

          {/* Coin göstergesi */}
          <div className="w-full">
            <div className="bg-gradient-to-br from-yellow-900/60 to-amber-900/40 border border-yellow-600/40 rounded-xl p-2.5 text-center">
              <div className="text-2xl mb-0.5">🪙</div>
              <div className="text-yellow-400 font-black text-lg leading-none">{coins.toLocaleString('tr-TR')}</div>
              <div className="text-yellow-700 text-[9px] mt-0.5 uppercase tracking-widest">Coin</div>
            </div>
            <div className="text-stone-600 text-[9px] text-center mt-1.5 leading-tight">
              Her gün sonunda cironun %10'u coin olarak birikir
            </div>
          </div>

          {/* Kapat */}
          <button onClick={onClose}
            className="w-full py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs font-bold transition-all active:scale-95">
            ✕ Kapat
          </button>
        </div>

        {/* ── SAĞ PANEL — kategori + itemlar ── */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Kategori seçimi */}
          <div className="flex border-b border-stone-800 flex-shrink-0 bg-stone-950/30">
            {(Object.keys(CATEGORY_LABELS) as ShopCategory[]).map(cat => {
              const { label, icon } = CATEGORY_LABELS[cat];
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-[10px] font-black uppercase tracking-wider transition-colors ${activeCategory === cat ? 'text-amber-400 border-b-2 border-amber-400 bg-amber-900/10' : 'text-stone-500 hover:text-stone-300'}`}>
                  <span className="text-base leading-none">{icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* İtem grid */}
          <div className="overflow-y-auto flex-1 p-3" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
            <div className="grid grid-cols-4 gap-2">
              {items.map(item => {
                const isOwned = owned.includes(item.id);
                const equipped = isEquipped(item);
                const fb = feedback?.id === item.id;
                const rs = RARITY_STYLE[item.rarity];

                return (
                  <div key={item.id}
                    className={`rounded-xl border-2 p-2.5 flex flex-col gap-1.5 transition-all relative ${equipped ? 'border-amber-500 bg-amber-900/20' : `${rs.border} ${rs.bg}`}`}>

                    {/* Yeni etiketi */}
                    {NEW_ITEMS.has(item.id) && !isOwned && (
                      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide z-10">YENİ</span>
                    )}

                    {/* Görsel önizleme */}
                    <div className="flex justify-center items-center h-10">
                      {item.category === 'hat' ? (
                        <span className="text-3xl leading-none">{item.icon}</span>
                      ) : item.category === 'title' ? (
                        <div className="px-2 py-1 rounded-lg bg-black/60 border border-yellow-500/40 text-[9px] font-black text-yellow-400 text-center leading-tight">
                          {item.value}
                        </div>
                      ) : item.category === 'labelEffect' ? (
                        <div className="px-2 py-1 rounded-full text-[9px] font-black text-center"
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            border: item.value === 'gold' ? '1.5px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
                            color: item.value === 'rainbow' ? '#ff69b4' : item.value === 'gold' ? '#FFD700' : item.value === 'glow' ? '#a78bfa' : '#fff',
                            boxShadow: item.value === 'glow' ? '0 0 8px #a78bfa' : item.value === 'gold' ? '0 0 6px #FFD700' : 'none',
                          }}>
                          ★ İSİM
                        </div>
                      ) : item.category === 'colorSet' && item.colorSet ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded-full border border-stone-500" style={{ backgroundColor: item.colorSet.hair }} title="Saç" />
                            <div className="w-5 h-5 rounded-lg border border-stone-500" style={{ backgroundColor: item.colorSet.clothing }} title="Kıyafet" />
                            <div className="w-5 h-5 rounded-full border border-stone-500" style={{ backgroundColor: item.colorSet.label, outline: item.colorSet.label === '#ffffff' ? '1px solid #555' : undefined }} title="Etiket" />
                          </div>
                          <div className="text-[8px] text-stone-400">Saç · Kıyafet · Etiket</div>
                        </div>
                      ) : item.category === 'hairColor' ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full border-2 border-stone-500 shadow-inner"
                            style={{ backgroundColor: item.value }} />
                          <div className="w-5 h-1.5 rounded-full opacity-60" style={{ backgroundColor: item.value }} />
                        </div>
                      ) : item.category === 'clothingColor' ? (
                        <div className="w-8 h-9 rounded-lg border-2 border-stone-500 flex items-center justify-center shadow-inner"
                          style={{ backgroundColor: item.value }}>
                          <div className="w-3 h-3 rounded-full bg-white/20" />
                        </div>
                      ) : ( // labelColor
                        <div className="px-2 py-1 rounded-full border-2 text-[9px] font-black"
                          style={{ borderColor: item.value, color: item.value, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                          ★ İSİM
                        </div>
                      )}
                    </div>

                    {/* İsim + nadirlik */}
                    <div className="text-center">
                      <div className="text-white font-bold text-[10px] leading-tight truncate">{item.name}</div>
                      <div className={`text-[8px] font-black uppercase ${rs.badge}`}>{rs.label}</div>
                    </div>

                    {/* Buton */}
                    {isOwned ? (
                      <button onClick={() => applyItem(item.id)}
                        className={`w-full py-1 rounded-lg text-[10px] font-black transition-all active:scale-95 ${equipped ? 'bg-amber-500 text-stone-900' : 'bg-stone-700 hover:bg-stone-600 text-stone-200'}`}>
                        {item.category === 'colorSet' ? (equipped ? '✓ Aktif' : 'Uygula') : (equipped ? '✓ Giyildi' : 'Giy')}
                      </button>
                    ) : (
                      <button onClick={() => handleBuy(item.id)} disabled={coins < item.price}
                        className={`w-full py-1 rounded-lg text-[10px] font-black transition-all active:scale-95 ${
                          fb ? (feedback!.ok ? 'bg-emerald-600 text-white' : 'bg-red-700 text-white') :
                          coins >= item.price ? 'bg-amber-500 hover:bg-amber-400 text-stone-900' :
                          'bg-stone-700 text-stone-500 cursor-not-allowed'
                        }`}>
                        {fb ? (feedback!.ok ? '✓ Alındı!' : '✗ Yetersiz') : `🪙 ${item.price}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
