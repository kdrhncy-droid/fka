import React, { useEffect, useState } from 'react';

/**
 * Mobil/tablet cihazlarda portrait modda "Lütfen cihazı yatır" overlay'i gösterir.
 * Masaüstü tarayıcılarda hiçbir şey yapmaz.
 */
export const LandscapeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPortrait, setIsPortrait] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const mobile = window.matchMedia('(max-width: 1024px) and (pointer: coarse)').matches
                || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
            const portrait = window.innerHeight > window.innerWidth;
            setIsMobile(mobile);
            setIsPortrait(portrait);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (isMobile && isPortrait) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950 text-white select-none">
                {/* Dönen telefon animasyonu */}
                <div className="relative mb-8">
                    <div className="text-8xl animate-[spin_2s_ease-in-out_infinite]">📱</div>
                    <div className="absolute -right-4 -bottom-2 text-4xl">↻</div>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-widest text-amber-400 mb-3">
                    Cihazı Yatır
                </h2>
                <p className="text-stone-400 text-sm text-center max-w-xs leading-relaxed px-6">
                    Bu oyun yatay modda oynanır. Lütfen telefonunu veya tabletini yan çevir.
                </p>
                <div className="mt-8 flex items-center gap-3 text-stone-600 text-xs uppercase tracking-widest">
                    <span className="h-px w-12 bg-stone-800" />
                    <span>🍽️ Mutfak seni bekliyor</span>
                    <span className="h-px w-12 bg-stone-800" />
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
