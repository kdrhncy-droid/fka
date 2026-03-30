import React, { useState } from 'react';

const LS_KEY = 'terracraft-tutorial-done';

export function isTutorialDone(): boolean {
  return localStorage.getItem(LS_KEY) === '1';
}

export function markTutorialDone() {
  localStorage.setItem(LS_KEY, '1');
}

interface Step {
  title: string;
  desc: string;
  icon: string;
  hint?: string;
}

const STEPS: Step[] = [
  {
    icon: '👋',
    title: 'Hoş Geldin!',
    desc: 'Bu kısa rehber sana oyunun temellerini öğretecek. Hazır mısın?',
  },
  {
    icon: '🥬',
    title: 'Malzeme Al',
    desc: 'Mutfağın üst kısmındaki raflara yaklaş ve E tuşuna (veya AL/VER butonuna) bas. Elinde malzeme olacak.',
    hint: 'İpucu: Sadece unlock edilmiş yemeklerin malzemesini alabilirsin.',
  },
  {
    icon: '🔥',
    title: 'Fırına Koy',
    desc: 'Malzemeyi elinde tutarken fırına yaklaş ve E tuşuna bas. Malzeme fırına girer ve pişmeye başlar.',
    hint: 'İpucu: Bazı malzemeleri önce kesme tahtasında doğraman gerekir (🥩 🥬 🍢).',
  },
  {
    icon: '🍽️',
    title: 'Tabak Al',
    desc: 'Tabak yığınına yaklaş ve E tuşuna bas. Temiz tabak eline geçer.',
    hint: 'İpucu: Tabak olmadan yemek alamazsın!',
  },
  {
    icon: '✅',
    title: 'Yemeği Tabağa Al',
    desc: 'Elinde temiz tabakla pişmiş yemeğin yanına git ve E tuşuna bas. Yemek tabağa geçer.',
    hint: 'İpucu: Yemek çok beklerse yanar! ⬛ olunca çöpe at.',
  },
  {
    icon: '🧑‍🍽️',
    title: 'Müşteriye Servis Et',
    desc: 'Yemeği elinde tutarken oturan müşteriye yaklaş ve E tuşuna bas. Müşteri yemeğini yer ve bahşiş bırakır!',
    hint: 'İpucu: Hızlı servis edersen daha fazla bahşiş alırsın.',
  },
  {
    icon: '🧽',
    title: 'Kirli Tabağı Temizle',
    desc: 'Müşteri yedikten sonra masada kirli tabak kalır. Al ve lavaboya götür, E tuşuna bas. Yıkandıktan sonra tekrar kullanabilirsin.',
    hint: 'İpucu: Tabak yığını bitmeden önce yıkamayı unutma!',
  },
  {
    icon: '🌙',
    title: 'Gece Fazı',
    desc: 'Gün bittikten sonra gece fazına geçersin. Burada upgrade satın alabilir, yeni yemekler açabilirsin. Sonra "Yeni Güne Başla" ile devam et.',
    hint: 'İpucu: Sabır ve kazanç upgrade\'leri çok işe yarar!',
  },
  {
    icon: '🎉',
    title: 'Hazırsın!',
    desc: 'Artık oyunun temellerini biliyorsun. İyi eğlenceler! Arkadaşlarınla birlikte oynamayı unutma.',
  },
];

interface Props {
  onClose: () => void;
}

export const TutorialOverlay: React.FC<Props> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      markTutorialDone();
      onClose();
    } else {
      setStep(s => s + 1);
    }
  };

  const skip = () => {
    markTutorialDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pb-8 px-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-stone-900 shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-stone-800">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* İkon + başlık */}
          <div className="flex items-center gap-3">
            <div className="text-4xl">{current.icon}</div>
            <div>
              <div className="text-[10px] text-stone-500 uppercase tracking-widest">
                Adım {step + 1} / {STEPS.length}
              </div>
              <h3 className="text-lg font-black text-white">{current.title}</h3>
            </div>
          </div>

          {/* Açıklama */}
          <p className="text-stone-300 text-sm leading-relaxed">{current.desc}</p>

          {/* İpucu */}
          {current.hint && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <p className="text-amber-300 text-xs">{current.hint}</p>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-2 pt-1">
            {!isLast && (
              <button onClick={skip}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-bold uppercase tracking-wider transition-all">
                Atla
              </button>
            )}
            <button onClick={next}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-sm uppercase tracking-wider transition-all">
              {isLast ? '🎉 Başla!' : 'Devam →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
