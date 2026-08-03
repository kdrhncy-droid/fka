import React, { useState, useEffect, useRef } from 'react';
import { DayEndSummary } from '../hooks/useSocket';
import { loadProfile, saveProfile } from '../utils/profile';

interface Props {
    summary: DayEndSummary;
    onClose: () => void;
}

// ── Konfeti Canvas ─────────────────────────────────────────────────────────────
function ConfettiCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const W = canvas.width;
        const H = canvas.height;
        const COLORS = ['#f59e0b', '#8b5cf6', '#22c55e', '#3b82f6', '#ef4444', '#ec4899', '#fbbf24'];
        const particles = Array.from({ length: 60 }, () => ({
            x: Math.random() * W,
            y: -20 - Math.random() * 120,
            vx: (Math.random() - 0.5) * 2.5,
            vy: 1.8 + Math.random() * 2.5,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            w: 5 + Math.random() * 7,
            h: 3 + Math.random() * 4,
            rot: Math.random() * Math.PI * 2,
            rotV: (Math.random() - 0.5) * 0.12,
        }));
        let frame: number;
        const animate = () => {
            ctx.clearRect(0, 0, W, H);
            for (const p of particles) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();
                p.x += p.vx; p.y += p.vy; p.rot += p.rotV;
                if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
            }
            frame = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(frame);
    }, []);
    return (
        <canvas
            ref={canvasRef} width={340} height={520}
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{ width: '100%', height: '100%' }}
        />
    );
}

export const DayEndModal: React.FC<Props> = ({ summary, onClose }) => {
    const [open, setOpen] = useState(false);

    const profile = loadProfile();
    const prevHighScore = profile.highScore ?? 0;
    const isNewRecord = summary.score > prevHighScore;
    const isPerfectDay = summary.lives >= 3;
    const gapToRecord = prevHighScore - summary.score;

    const objectives = summary.dailyObjectives ?? [];
    const completedObjectives = objectives.filter(o => o.completed && !o.failed);
    const completedBonus = completedObjectives.reduce((sum, o) => sum + o.bonusCoins, 0);

    useEffect(() => {
        if (isNewRecord) saveProfile({ highScore: summary.score });
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setOpen(true), 300);
        return () => clearTimeout(t);
    }, []);

    const hearts = Array.from({ length: 3 }, (_, i) => i < summary.lives ? '❤️' : '🖤');

    const handleClose = () => { setOpen(false); onClose(); };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs border border-indigo-500 transition-all active:scale-95 whitespace-nowrap"
            >
                📋 Özet
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
                    onClick={handleClose}
                >
                    <div
                        className="relative bg-stone-900 border border-stone-700 rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl max-h-[92vh] overflow-y-auto w-[92%] sm:w-auto min-w-[290px]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Konfeti — sadece mükemmel günde */}
                        {isPerfectDay && <ConfettiCanvas />}

                        {/* İçerik (z-10 ile konfetinin üstünde) */}
                        <div className="relative z-10 w-full flex flex-col items-center gap-4">

                            {/* Başlık */}
                            <div className="text-center">
                                <div className="text-5xl mb-2">🌙</div>
                                <h2 className="text-2xl font-black uppercase tracking-widest text-stone-100">
                                    Gün {summary.day} Bitti
                                </h2>
                            </div>

                            {/* YENİ REKOR banner */}
                            {isNewRecord && (
                                <div
                                    className="w-full rounded-2xl px-4 py-3 text-center animate-pulse"
                                    style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 0 24px #f97316aa' }}
                                >
                                    <div className="text-2xl font-black text-stone-950 tracking-widest">
                                        🏆 YENİ REKOR!
                                    </div>
                                    <div className="text-sm font-bold text-stone-800 mt-1">
                                        Önceki: ${prevHighScore} → Yeni: ${summary.score}
                                    </div>
                                </div>
                            )}

                            {/* MÜKEMMEL GÜN banner */}
                            {isPerfectDay && (
                                <div
                                    className="w-full rounded-2xl px-4 py-3 text-center"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 20px #8b5cf688' }}
                                >
                                    <div className="text-xl font-black text-white tracking-widest">⭐ MÜKEMMEL GÜN</div>
                                    <div className="text-xs font-semibold text-violet-200 mt-1">Hiç can kaybetmeden!</div>
                                </div>
                            )}

                            {/* İstatistikler */}
                            <div className="w-full space-y-2 min-w-[240px]">
                                <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3">
                                    <span className="text-sm text-stone-400 font-bold">💰 Günlük Ciro</span>
                                    <span className="text-xl font-black text-amber-400">${summary.dailyEarnings ?? summary.score}</span>
                                </div>
                                <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3">
                                    <span className="text-sm text-stone-400 font-bold">🏆 En Yüksek</span>
                                    <span className="text-lg font-black text-amber-300">${isNewRecord ? summary.score : prevHighScore}</span>
                                </div>
                                <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3">
                                    <span className="text-sm text-stone-400 font-bold">❤️ Can</span>
                                    <span className="text-lg font-black text-stone-100 tracking-widest">{hearts.join(' ')}</span>
                                </div>
                            </div>

                            {/* Günlük Hedefler */}
                            {objectives.length > 0 && (
                                <div className="w-full space-y-2">
                                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest text-center">Günlük Hedefler</div>
                                    {objectives.map(obj => (
                                        <div
                                            key={obj.id}
                                            className="flex items-center justify-between rounded-xl px-3 py-2"
                                            style={{
                                                background: obj.completed ? 'rgba(34,197,94,0.12)' : obj.failed ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${obj.completed ? 'rgba(34,197,94,0.4)' : obj.failed ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                                                opacity: obj.failed ? 0.6 : 1,
                                            }}
                                        >
                                            <span className="text-sm text-stone-200">
                                                {obj.icon} {obj.label}
                                            </span>
                                            <span className={`text-xs font-black ml-3 ${obj.completed ? 'text-emerald-400' : obj.failed ? 'text-red-400' : 'text-stone-400'}`}>
                                                {obj.completed ? `+${obj.bonusCoins}🪙` : obj.failed ? '✗' : `${obj.progress}/${obj.target}`}
                                            </span>
                                        </div>
                                    ))}
                                    {completedBonus > 0 && (
                                        <div className="text-center rounded-xl px-3 py-2" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                                            <span className="text-sm font-black text-amber-400">🎁 Hedef Bonusu: +{completedBonus} puan</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* "Neredeyse çıktı" satırı */}
                            {!isNewRecord && prevHighScore > 0 && gapToRecord > 0 && (
                                <div className="w-full bg-stone-800 rounded-xl px-4 py-2 text-center">
                                    <span className="text-xs text-stone-400 font-semibold">
                                        Rekora sadece{' '}
                                        <span className="text-amber-400 font-black">${gapToRecord}</span>
                                        {' '}kaldı! 💪
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={handleClose}
                                className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-black uppercase tracking-widest text-stone-950 active:scale-95 transition-all"
                            >
                                Devam Et →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
