import React from 'react';

interface Props {
  score: number;
  day: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LeaveModal: React.FC<Props> = ({ score, day, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-stone-900 p-6 flex flex-col items-center gap-5 shadow-2xl">

      {/* İkon */}
      <div className="text-5xl">🚪</div>

      {/* Başlık */}
      <div className="text-center">
        <h2 className="text-xl font-black uppercase tracking-widest text-white">Ayrılıyor musun?</h2>
        <p className="text-stone-400 text-sm mt-1">İlerleme kaydedilmeyecek.</p>
      </div>

      {/* Özet */}
      <div className="w-full rounded-2xl bg-stone-800/80 border border-stone-700 p-4 flex justify-around">
        <div className="text-center">
          <div className="text-2xl font-black text-amber-400">${score}</div>
          <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">Ciro</div>
        </div>
        <div className="w-px bg-stone-700" />
        <div className="text-center">
          <div className="text-2xl font-black text-sky-400">{day}</div>
          <div className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">Gün</div>
        </div>
      </div>

      {/* Butonlar */}
      <div className="w-full flex flex-col gap-2">
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-[0.97] text-white font-black text-sm uppercase tracking-widest transition-all"
        >
          Evet, Ayrıl
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-[0.97] border border-stone-600 text-stone-300 font-bold text-sm uppercase tracking-widest transition-all"
        >
          Devam Et
        </button>
      </div>
    </div>
  </div>
);
