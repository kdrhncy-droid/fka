import React, { useState } from 'react';
import { CharacterPreview } from './CharacterPreview';
import { CHARACTER_TYPES } from '../types/game';
import { loadProfile, saveProfile } from '../utils/profile';

interface Props {
  onClose: () => void;
  playerName: string; setPlayerName: (v: string) => void;
  charType: number; setCharType: (v: number) => void;
  hairColor: string; setHairColor: (v: string) => void;
  clothingColor: string; setClothingColor: (v: string) => void;
  faceShape: number; setFaceShape: (v: number) => void;
  nameLabelColor: string; setNameLabelColor: (v: string) => void;
  setPlayerColor: (v: string) => void;
  setPlayerHat: (v: string) => void;
  coins: number;
}

const HAIR_COLORS = ['#4b2c20','#24150e','#8d5524','#c68642','#f1c27d','#ffffff','#ef4444','#3b82f6','#a855f7','#22c55e'];
const CLOTHING_COLORS = ['#f5f5f4','#fef3c7','#e0f2fe','#ef4444','#3b82f6','#22c55e','#a855f7','#f97316','#ec4899','#1c1917'];
const LABEL_COLORS = ['#ffffff','#fbbf24','#34d399','#60a5fa','#f472b6','#a78bfa','#fb923c','#f87171','#4ade80','#000000'];

function fmt(s: number) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}s ${m}dk` : `${m}dk`;
}
function fmtDate(ts: number) {
  if (!ts) return 'Hiç';
  return new Date(ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

type Tab = 'karakter' | 'istatistik';

export const ProfileModal: React.FC<Props> = ({
  onClose,
  playerName, setPlayerName,
  charType, setCharType,
  hairColor, setHairColor,
  clothingColor, setClothingColor,
  faceShape, setFaceShape,
  nameLabelColor, setNameLabelColor,
  setPlayerColor, setPlayerHat,
  coins,
}) => {
  const [tab, setTab] = useState<Tab>('karakter');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(playerName);
  const profile = loadProfile();

  const stats = [
    { icon: '🎮', label: 'Oynanan Oyun', value: profile.gamesPlayed },
    { icon: '📅', label: 'Tamamlanan Gün', value: profile.totalDays },
    { icon: '💰', label: 'Toplam Ciro', value: `$${profile.totalScore}` },
    { icon: '🍽️', label: 'Servis Edilen', value: profile.totalServed },
    { icon: '⏱️', label: 'Oyun Süresi', value: fmt(profile.totalPlayTime) },
    { icon: '🕐', label: 'Son Oynama', value: fmtDate(profile.lastPlayed) },
  ];

  const saveName = () => {
    const n = nameInput.trim();
    if (n) { setPlayerName(n); saveProfile({ name: n }); }
    setEditingName(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mini karakter önizleme */}
            <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 overflow-hidden flex items-center justify-center">
              <CharacterPreview charType={charType} size={48} hairColor={hairColor} clothingColor={clothingColor} faceShape={faceShape} />
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    maxLength={12}
                    className="bg-stone-800 border border-amber-500 rounded-lg px-2 py-0.5 text-sm font-bold text-white outline-none w-28"
                  />
                </div>
              ) : (
                <button onClick={() => { setNameInput(playerName); setEditingName(true); }}
                  className="flex items-center gap-1.5 group">
                  <span className="text-white font-black text-base">{playerName || 'Oyuncu'}</span>
                  <span className="text-stone-500 text-xs group-hover:text-amber-400 transition-colors">✏️</span>
                </button>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-base">🪙</span>
                <span className="text-yellow-400 font-black text-sm">{coins.toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white flex items-center justify-center transition-all">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-800 flex-shrink-0">
          {(['karakter', 'istatistik'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${tab === t ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-500 hover:text-stone-300'}`}>
              {t === 'karakter' ? '👤 Karakter' : '📊 İstatistik'}
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div className="overflow-y-auto no-scrollbar flex-1">

          {/* ── KARAKTER TABI ── */}
          {tab === 'karakter' && (
            <div className="p-4 space-y-4">

              {/* Büyük önizleme */}
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-3xl bg-stone-800 border-2 border-stone-700 overflow-hidden flex items-center justify-center">
                  <CharacterPreview charType={charType} size={112} hairColor={hairColor} clothingColor={clothingColor} faceShape={faceShape} />
                </div>
              </div>

              {/* İsim etiketi önizleme */}
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-black/60 border border-white/10 text-xs font-black" style={{ color: nameLabelColor }}>
                  ★ {playerName || 'Oyuncu'}
                </div>
              </div>

              {/* Karakter tipi */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Karakter</p>
                <div className="grid grid-cols-4 gap-2">
                  {CHARACTER_TYPES.map((char, i) => (
                    <button key={i} onClick={() => { setCharType(i); setPlayerHat(''); setPlayerColor(char.bodyColor); }}
                      className={`rounded-xl p-2 flex flex-col items-center gap-1 transition-all ${charType === i ? 'bg-amber-500/20 border-2 border-amber-500' : 'bg-stone-800 border border-stone-700 hover:border-stone-500'}`}>
                      <CharacterPreview charType={i} size={44} />
                      <span className="text-[8px] font-bold uppercase text-stone-400 leading-tight text-center">{char.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Saç */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Saç Rengi</p>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(c => (
                    <button key={c} onClick={() => setHairColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${hairColor === c ? 'border-white scale-110' : 'border-stone-700'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* Kıyafet */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Kıyafet Rengi</p>
                <div className="flex flex-wrap gap-2">
                  {CLOTHING_COLORS.map(c => (
                    <button key={c} onClick={() => { setClothingColor(c); setPlayerColor(c); }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${clothingColor === c ? 'border-white scale-110' : 'border-stone-700'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              {/* İsim etiketi rengi */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">İsim Etiketi Rengi</p>
                <div className="flex flex-wrap gap-2">
                  {LABEL_COLORS.map(c => (
                    <button key={c} onClick={() => setNameLabelColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${nameLabelColor === c ? 'border-white scale-110' : 'border-stone-700'}`}
                      style={{ backgroundColor: c, outline: c === '#ffffff' ? '1px solid #555' : undefined }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── İSTATİSTİK TABI ── */}
          {tab === 'istatistik' && (
            <div className="p-4 space-y-3">
              {/* Coin özeti */}
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-3xl">🪙</span>
                <div>
                  <div className="text-yellow-400 font-black text-2xl">{coins.toLocaleString('tr-TR')}</div>
                  <div className="text-yellow-600 text-xs">Toplam Market Parası</div>
                </div>
              </div>

              {/* İstatistik satırları */}
              <div className="space-y-2">
                {stats.map(s => (
                  <div key={s.label} className="flex items-center justify-between bg-stone-800/60 rounded-xl px-4 py-2.5">
                    <span className="text-stone-400 text-xs flex items-center gap-2">
                      <span>{s.icon}</span>{s.label}
                    </span>
                    <span className="text-white font-black text-sm">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Sıfırla */}
              <button
                onClick={() => {
                  if (confirm('Tüm istatistikleri sıfırlamak istediğine emin misin?')) {
                    saveProfile({ totalPlayTime: 0, totalDays: 0, totalScore: 0, totalServed: 0, gamesPlayed: 0, lastPlayed: 0 });
                    onClose();
                  }
                }}
                className="w-full py-2 rounded-xl bg-red-900/30 hover:bg-red-800/50 border border-red-700/30 text-red-400 text-xs font-bold uppercase tracking-widest transition-all"
              >
                İstatistikleri Sıfırla
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
