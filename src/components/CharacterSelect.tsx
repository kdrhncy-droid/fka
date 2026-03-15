import React, { useState, useEffect } from 'react';
import { CHARACTER_TYPES } from '../types/game';
import { MARKET_NAME } from '../constants';
import { loadSave, trySetPlayerName } from '../hooks/useSaveGame';

interface CharacterSelectProps {
    isConnected: boolean;
    playerName: string;
    setPlayerName: (v: string) => void;
    playerColor: string;
    setPlayerColor: (v: string) => void;
    playerHat: string;
    setPlayerHat: (v: string) => void;
    charType: number;
    setCharType: (v: number) => void;
    marketName: string;
    setMarketName: (v: string) => void;
    roomId: string;
    setRoomId: (v: string) => void;
    onJoin: (e: React.FormEvent) => void;
    onBack: () => void;
    onOpenSettings: () => void;
    isJoiningExistingRoom?: boolean;
}

function OutfitPreview({ bodyColor, accent }: { bodyColor: string; accent: string }) {
    return (
        <div className="relative flex h-24 items-end justify-center">
            <div className="absolute bottom-0 h-3 w-16 rounded-full bg-black/10 blur-[2px]" />
            <div className="relative h-20 w-16">
                <div className="absolute left-1/2 top-0 h-8 w-8 -translate-x-1/2 rounded-full bg-[#f5d0a9]" />
                <div className="absolute left-1/2 top-7 h-10 w-12 -translate-x-1/2 rounded-t-[18px] rounded-b-[14px]" style={{ backgroundColor: bodyColor }} />
                <div className="absolute left-1/2 top-10 h-6 w-8 -translate-x-1/2 rounded-t-xl" style={{ backgroundColor: accent }} />
                <div className="absolute left-[14px] top-[52px] h-8 w-3 rounded-b-xl bg-stone-800" />
                <div className="absolute right-[14px] top-[52px] h-8 w-3 rounded-b-xl bg-stone-800" />
                <div className="absolute left-[7px] top-[36px] h-3 w-3 rounded-full bg-[#f5d0a9]" />
                <div className="absolute right-[7px] top-[36px] h-3 w-3 rounded-full bg-[#f5d0a9]" />
            </div>
        </div>
    );
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
    isConnected,
    playerName, setPlayerName,
    setPlayerColor,
    setPlayerHat,
    charType, setCharType,
    marketName, setMarketName,
    roomId, setRoomId,
    onJoin,
    onBack,
    onOpenSettings,
    isJoiningExistingRoom = false,
}) => {
    const selectedChar = CHARACTER_TYPES[charType] ?? CHARACTER_TYPES[0];
    const [isFormValid, setIsFormValid] = useState(false);
    const [nameError, setNameError] = useState('');
    const [saveInfo, setSaveInfo] = useState(() => loadSave());

    // Kayıtlı isim varsa ve alan boşsa ön doldur
    useEffect(() => {
        if (!playerName && saveInfo.playerName) {
            setPlayerName(saveInfo.playerName);
        }
    }, []);

    // Form doğrulaması
    useEffect(() => {
        const isValid = playerName.trim().length > 0 && roomId.trim().length > 0 && isConnected;
        setIsFormValid(isValid);
    }, [playerName, roomId, isConnected]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;
        const result = trySetPlayerName(playerName.trim());
        if (!result.allowed) {
            setNameError('İsim değiştirme hakkın bitti! Sadece kayıtlı ismini kullanabilirsin.');
            setPlayerName(saveInfo.playerName);
            return;
        }
        setSaveInfo(loadSave());
        setNameError('');
        onJoin(e);
    };

    return (
        <div className="menu-screen bg-[linear-gradient(180deg,#1c1917,#0c0a09)] safe-top safe-bottom">
            <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-8 md:py-6">
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-stone-100 transition-colors hover:bg-white/10"
                    >
                        Ana menu
                    </button>
                    <div className="text-center">
                        <div className="text-[11px] font-black uppercase tracking-[0.24em] text-stone-500">Lobi</div>
                        <div className="mt-1 text-lg font-black uppercase text-stone-100">{MARKET_NAME}</div>
                        {isJoiningExistingRoom && (
                            <div className="mt-1 text-xs font-semibold text-blue-300">
                                Oda: <span className="font-black text-blue-400">{roomId}</span>
                            </div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-stone-100 transition-colors hover:bg-white/10"
                    >
                        Ayarlar
                    </button>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur md:p-6">
                        <div className="flex flex-col gap-3 border-b border-white/8 pb-5 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.24em] text-stone-500">Outfit secimi</div>
                                <h1 className="mt-2 text-3xl font-black uppercase text-stone-50 md:text-4xl">Istasyonu sec</h1>
                                <p className="mt-2 max-w-xl text-sm leading-6 text-stone-400">
                                    Emoji yerine dogrudan uniform presetleri var. Kart secildiginde kiyafet rengi ve rol paleti birlikte geliyor.
                                </p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-stone-300">
                                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {isConnected ? 'Server bagli' : 'Server baglaniyor'}
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {CHARACTER_TYPES.map((char, index) => {
                                const selected = charType === index;
                                return (
                                    <button
                                        key={char.id}
                                        type="button"
                                        onClick={() => {
                                            setCharType(index);
                                            setPlayerHat('');
                                            setPlayerColor(char.bodyColor);
                                        }}
                                        className={`rounded-[24px] border p-4 text-left transition-transform ${selected
                                            ? 'scale-[1.01] border-transparent bg-stone-50 text-stone-900 shadow-[0_12px_40px_rgba(255,255,255,0.12)]'
                                            : 'border-white/10 bg-white/[0.03] text-stone-100 hover:border-white/18 hover:bg-white/[0.06]'
                                            }`}
                                        style={selected ? { boxShadow: `0 18px 50px ${char.accent}33` } : undefined}
                                    >
                                        <OutfitPreview bodyColor={char.bodyColor} accent={char.accent} />
                                        <div className="mt-3">
                                            <div className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: selected ? char.accent : '#d6d3d1' }}>
                                                {char.name}
                                            </div>
                                            <div className="mt-2 text-sm font-semibold leading-5">{char.label}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-white/10 bg-stone-950/80 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] md:p-6">
                        <form onSubmit={handleSubmit} className="flex h-full flex-col gap-5">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.24em] text-stone-500">Oturum kurulumu</div>
                                <h2 className="mt-2 text-2xl font-black uppercase text-stone-50">
                                    {isJoiningExistingRoom ? 'Hazır Ol' : 'Hazir ol'}
                                </h2>
                            </div>

                            <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
                                <OutfitPreview bodyColor={selectedChar.bodyColor} accent={selectedChar.accent} />
                                <div className="mt-3 text-center">
                                    <div className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: selectedChar.accent }}>
                                        {selectedChar.name}
                                    </div>
                                    <div className="mt-2 text-sm leading-5 text-stone-300">{selectedChar.label}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-[0.22em] text-stone-400">Oyuncu adı</span>
                                        {saveInfo.playerName ? (
                                            saveInfo.nameChangesLeft > 0 ? (
                                                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                                                    ✏️ {saveInfo.nameChangesLeft} değişim hakkı
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full border border-red-400/20">
                                                    🔒 İsim kilitli
                                                </span>
                                            )
                                        ) : null}
                                    </div>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => { setNameError(''); setPlayerName(e.target.value); }}
                                        maxLength={12}
                                        placeholder="Orn: servis-1"
                                        readOnly={saveInfo.nameChangesLeft === 0 && saveInfo.playerName !== ''}
                                        className={`w-full rounded-2xl border px-4 py-3 text-base font-semibold text-stone-100 outline-none transition-colors placeholder:text-stone-500 focus:border-amber-300 ${
                                            saveInfo.nameChangesLeft === 0 && saveInfo.playerName !== ''
                                                ? 'bg-stone-800/60 border-stone-700 cursor-not-allowed opacity-70'
                                                : 'bg-stone-900 border-white/10'
                                        }`}
                                        required
                                    />
                                    {nameError && (
                                        <p className="mt-1.5 text-xs text-red-400 font-semibold">{nameError}</p>
                                    )}
                                </label>

                                <label className="block">
                                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-stone-400">Oda Kodu</span>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={roomId}
                                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                            maxLength={8}
                                            placeholder="Örn: AB12"
                                            disabled={isJoiningExistingRoom}
                                            className={`w-full rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 text-base font-semibold uppercase text-stone-100 outline-none transition-colors placeholder:text-stone-500 focus:border-amber-300 ${isJoiningExistingRoom ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            required
                                        />
                                        {!isJoiningExistingRoom && (
                                            <button
                                                type="button"
                                                onClick={() => setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase())}
                                                className="rounded-2xl border border-white/10 bg-stone-800 px-4 transition-colors hover:bg-stone-700"
                                                title="Yeni Kod Üret"
                                            >
                                                🎲
                                            </button>
                                        )}
                                    </div>
                                </label>

                                {!isJoiningExistingRoom && (
                                    <label className="block">
                                        <span className="mb-2 block text-xs font-black uppercase tracking-[0.22em] text-stone-400">Market adi <span className="text-stone-600">(isteğe bağlı)</span></span>
                                        <input
                                            type="text"
                                            value={marketName}
                                            onChange={(e) => setMarketName(e.target.value)}
                                            maxLength={24}
                                            placeholder="Orn: Aksam servisi"
                                            className="w-full rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 text-base font-semibold text-stone-100 outline-none transition-colors placeholder:text-stone-500 focus:border-amber-300"
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="mt-auto grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="rounded-2xl border border-white/12 bg-white/5 px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-stone-100 transition-colors hover:bg-white/10"
                                >
                                    Geri don
                                </button>
                                <button
                                    type="submit"
                                    disabled={!isFormValid}
                                    className={`rounded-2xl px-4 py-4 text-sm font-black uppercase tracking-[0.18em] text-stone-950 transition-transform ${isFormValid ? 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                    style={{ background: isFormValid ? `linear-gradient(135deg, ${selectedChar.accent}, ${selectedChar.bodyColor})` : '#666666' }}
                                >
                                    {isJoiningExistingRoom ? 'Odaya Katıl' : 'Dukkani ac'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </div>
    );
};
