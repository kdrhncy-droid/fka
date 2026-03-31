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
    icon: '🔪',
    title: 'Doğra',
    desc: 'Et, Sebze ve Kebap gibi malzemeleri önce kesme tahtasına bırak. Sonra R tuşunu (veya DOĞRA butonunu) basılı tut. Doğranmış malzeme fırında daha hızlı pişer!',
    hint: 'İpucu: Doğramadan fırına koyarsan "fail" sesi duyarsın.',
  },
  {
    icon: '🔥',
    title: 'Fırına Koy',
    desc: 'Malzemeyi elinde tutarken fırına yaklaş ve E tuşuna bas. Malzeme fırına girer ve pişmeye başlar.',
    hint: 'İpucu: Yemek pişince ✨ efekti görürsün. Çok beklersen yanar!',
  },
  {
    icon: '🍽️',
    title: 'Tabak Al & Servis Et',
    desc: 'Tabak yığınından temiz tabak al, pişmiş yemeği tabağa koy, sonra müşteriye götür. Hızlı servis = daha fazla bahşiş!',
    hint: 'İpucu: Tepsi ile tek seferde 4 yemek taşıyabilirsin.',
  },
  {
    icon: '🌶️',
    title: 'Özel İstekler',
    desc: 'Bazı müşterilerin sipariş balonunda küçük bir ikon görürsün. 🌶️ Acı, ➕ Bol porsiyon, ⚡ Acele. Bu müşterilere hızlı servis yaparsan çok daha fazla bahşiş alırsın!',
    hint: 'İpucu: ⚡ Acele müşterinin sabrı 2x hızlı azalır ama 2x bahşiş bırakır.',
  },
  {
    icon: '🔥',
    title: 'Combo Sistemi',
    desc: 'Arka arkaya hızlı servis yaparsan combo başlar! 3 servis = 🔥 x1.5, 5 servis = 🔥🔥 x2.0, 8+ servis = 🔥🔥🔥 x3.0 bonus puan. Üst barda combo sayacı görünür.',
    hint: 'İpucu: 6 saniye içinde servis yapmazsan combo sıfırlanır.',
  },
  {
    icon: '🧽',
    title: 'Kirli Tabağı Temizle',
    desc: 'Müşteri yedikten sonra masada kirli tabak kalır. Al ve lavaboya götür, E tuşuna bas. Yıkandıktan sonra tekrar kullanabilirsin.',
    hint: 'İpucu: Tabak yığını bitmeden önce yıkamayı unutma!',
  },
  {
    icon: '🌙',
    title: 'Gece Fazı & Kartlar',
    desc: 'Gün bittikten sonra gece fazına geçersin. Upgrade satın al, yeni yemek aç. Her 3 günde bir ⚡ Kart Seçimi çıkar — her kart bir şeyi zorlaştırır ama karşılığında ödül verir!',
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
