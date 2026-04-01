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
  setPlayerColor: (v: string) => void;
}

const CATEGORY_LABELS: Record<ShopCategory, string> = {
  hat: '🎩 Şapkalar',
  hairColor: '💇 Saç Rengi',
  clothingColor: '👕 Kıyafet',
  labelColor: '🏷️ İsim Etiketi',
};

const RARITY_COLORS = {
  common: 'border-stone-600 bg-stone-800/60',
  rare:   'border-blue-600/60 bg-blue-900/20',
  epic:   'border-purple-500/60 bg-purple-900/20',
};
const RARITY_BADGE = {
  common: 'text-stone-400',
  rare:   'text-blue-400',
  epic:   'text-purple-400',
};

export const ShopModal: React.FC<Props> = ({
  onClose, coins, setCoins,
  charType, hairColor, setHairColor,
  clothingColor, setClothingColor,
  nameLabelColor, setNameLabelColor,
  equippedHat, setEquippedHat,
  setPlayerColor,
}) => {
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('hat');
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean } | null>(null);
  const profile = loadProfile();
  const [owned, setOwned] = useState<string[]>(profile.ownedItems);

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

  const handleEquip = (itemId: string) => {
    applyItem(itemId);
  };

  const applyItem = (itemId: string) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    if (item.category === 'hat') {
      const next = equippedHat === item.value ? '' : item.value;
      setEquippedHat(next);
      saveProfile({ equippedHat: next });
    } else if (item.category === 'hairColor') {
      setHairColor(item.value);
      saveProfile({ hairColor: item.value });
    } else if (item.category === 'clothingColor') {
      setClothingColor(item.value);
      setPlayerColor(item.value);
      saveProfile({ clothingColor: item.value });
    } else if (item.category === 'labelColor') {
      setNameLabelColor(item.value);
      saveProfile({ nameLabelColor: item.value });
    }
  };

  const isEquipped = (item: typeof SHOP_ITEMS[0]) => {
    if (item.category === 'hat') return equippedHat === item.value;
    if (item.category === 'hairColor') return hairColor === item.value;
    if (item.category === 'clothingColor') return clothingColor === item.value;
    if (item.category === 'labelColor') return nameLabelColor === item.value;
    return false;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-stone-900 border border-stone-700 sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-black text-lg">🛒 Market</h2>
            <p className="text-stone-400 text-xs mt-0.5">Coin ile kozmetik satın al</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-yellow-900/30 border border-yellow-600/30 rounded-full px-3 py-1">
              <span>🪙</span>
              <span className="text-yellow-400 font-black text-sm">{coins.toLocaleString('tr-TR')}</span>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-all">✕</button>
          </div>
        </div>

        {/* Karakter önizleme */}
        <div className="flex justify-center items-center gap-4 py-3 border-b border-stone-800 flex-shrink-0 bg-stone-950/30">
          <div className="w-16 h-16 rounded-2xl bg-stone-800 border border-stone-700 overflow-hidden flex items-center justify-center">
            <CharacterPreview charType={charType} size={64} hairColor={hairColor} clothingColor={clothingColor} />
          </div>
          <div className="text-center">
            <div className="text-xs text-stone-500 mb-1">Önizleme</div>
            <div className="flex items-center gap-2">
              {equippedHat && <span className="text-2xl">{equippedHat}</span>}
              <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: hairColor }} />
              <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: clothingColor }} />
              <div className="w-4 h-4 rounded-full border border-stone-600" style={{ backgroundColor: nameLabelColor, outline: nameLabelColor === '#ffffff' ? '1px solid #555' : undefined }} />
            </div>
          </div>
        </div>

        {/* Kategori seçimi */}
        <div className="flex border-b border-stone-800 flex-shrink-0 overflow-x-auto no-scrollbar">
          {(Object.keys(CATEGORY_LABELS) as ShopCategory[]).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${activeCategory === cat ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-500 hover:text-stone-300'}`}>
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* İtemlar */}
        <div className="overflow-y-auto flex-1 p-3" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          <div className="grid grid-cols-2 gap-2">
            {items.map(item => {
              const isOwned = owned.includes(item.id);
              const equipped = isEquipped(item);
              const fb = feedback?.id === item.id;

              return (
                <div key={item.id}
                  className={`rounded-2xl border-2 p-3 flex flex-col gap-2 transition-all ${equipped ? 'border-amber-500 bg-amber-900/20' : RARITY_COLORS[item.rarity]}`}>

                  {/* İkon + isim */}
                  <div className="flex items-center gap-2">
                    {item.category === 'hairColor' || item.category === 'clothingColor' || item.category === 'labelColor' ? (
                      <div className="w-8 h-8 rounded-full border-2 border-stone-600 flex-shrink-0"
                        style={{ backgroundColor: item.value, outline: item.value === '#ffffff' ? '1px solid #555' : undefined }} />
                    ) : (
                      <span className="text-2xl leading-none">{item.icon}</span>
                    )}
                    <div className="min-w-0">
                      <div className="text-white font-bold text-xs leading-tight truncate">{item.name}</div>
                      <div className={`text-[9px] font-black uppercase ${RARITY_BADGE[item.rarity]}`}>
                        {item.rarity === 'common' ? 'Normal' : item.rarity === 'rare' ? 'Nadir' : 'Epik'}
                      </div>
                    </div>
                  </div>

                  {/* Buton */}
                  {isOwned ? (
                    <button onClick={() => handleEquip(item.id)}
                      className={`w-full py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${equipped ? 'bg-amber-500 text-stone-900' : 'bg-stone-700 hover:bg-stone-600 text-stone-200'}`}>
                      {equipped ? '✓ Giyildi' : 'Giy'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item.id)}
                      disabled={coins < item.price}
                      className={`w-full py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
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
  );
};
