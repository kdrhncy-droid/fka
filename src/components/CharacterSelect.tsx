import React, { useState, useEffect } from 'react';
import { CHARACTER_TYPES } from '../types/game';
import { MARKET_NAME } from '../constants';
import { CharacterPreview } from './CharacterPreview';

interface CharacterSelectProps {
    isConnected: boolean;
    playerName: string;
    setPlayerName: (v: string) => void;
    playerColor: string;
    setPlayerColor: (v: string) => void;
    playerHat: string;
    setPlayerHat: (v: string) => void;
    hairColor: string;
    setHairColor: (v: string) => void;
    clothingColor: string;
    setClothingColor: (v: string) => void;
    faceShape: number;
    setFaceShape: (v: number) => void;
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

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
    isConnected,
    playerName, setPlayerName,
    setPlayerColor,
    setPlayerHat,
    hairColor, setHairColor,
    clothingColor, setClothingColor,
    faceShape, setFaceShape,
    charType, setCharType,
    marketName, setMarketName,
    roomId, setRoomId,
    onJoin,
    onBack,
    isJoiningExistingRoom = false,
}) => {
    const selectedChar = CHARACTER_TYPES[charType] ?? CHARACTER_TYPES[0];
    const HAIR_COLORS = ['#4b2c20', '#24150e', '#8d5524', '#c68642', '#e8beac', '#f1c27d', '#ffdbac', '#ffffff', '#ef4444', '#3b82f6'];
    const CLOTHING_COLORS = ['#f5f5f4', '#fef3c7', '#e0f2fe', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#1c1917'];
    const FACE_SHAPES = [
        { id: 0, name: 'Yuvarlak', icon: '⚪' },
        { id: 1, name: 'Kare', icon: '⬜' },
        { id: 2, name: 'Sivri', icon: '▽' },
    ];
    const [isFormValid, setIsFormValid] = useState(false);

    useEffect(() => {
        setIsFormValid(playerName.trim().length > 0 && roomId.trim().length > 0 && isConnected);
    }, [playerName, roomId, isConnected]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isFormValid) onJoin(e);
    };

    return (
        <div className="menu-screen bg-[#0f0e0c] safe-top safe-bottom overflow-y-auto">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-5 px-6 py-10">

                {/* Üst bar */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onBack}
                        className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        ← Geri
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest text-stone-600">
                        {MARKET_NAME}
                    </span>
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} title={isConnected ? 'Bağlı' : 'Bağlanıyor'} />
                </div>

                {/* Başlık */}
                <div className="text-center">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-stone-100">
                        {isJoiningExistingRoom ? 'Odaya Katıl' : 'Oda Kur'}
                    </h1>
                    {isJoiningExistingRoom && (
                        <p className="text-xs text-stone-500 mt-1">Kod: <span className="text-amber-400 font-bold">{roomId}</span></p>
                    )}
                </div>

                {/* Karakter seçimi */}
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2">Karakter</p>
                    <div className="grid grid-cols-3 gap-3">
                        {CHARACTER_TYPES.map((char, index) => (
                            <button
                                key={char.id}
                                type="button"
                                onClick={() => {
                                    setCharType(index);
                                    setPlayerHat('');
                                    setPlayerColor(char.bodyColor);
                                }}
                                className={`rounded-xl p-4 text-center transition-all flex flex-col items-center gap-2 ${
                                    charType === index
                                        ? 'bg-amber-500/20 border-2 border-amber-500 shadow-md scale-[1.02]'
                                        : 'bg-stone-900 border border-stone-800 text-stone-400 hover:border-stone-600'
                                }`}
                            >
                                <div className="w-20 h-20 flex items-center justify-center">
                                    <CharacterPreview 
                                        charType={index} 
                                        size={80} 
                                        hairColor={charType === index ? hairColor : undefined}
                                        clothingColor={charType === index ? clothingColor : undefined}
                                        faceShape={charType === index ? faceShape : undefined}
                                    />
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-wider">{char.name}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Özelleştirme Seçenekleri */}
                <div className="space-y-4 bg-stone-900/50 p-4 rounded-2xl border border-stone-800">
                    {/* Saç Rengi */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2">Saç Rengi</p>
                        <div className="flex flex-wrap gap-2">
                            {HAIR_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setHairColor(color)}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-90 ${hairColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Kıyafet Rengi */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2">Kıyafet Rengi</p>
                        <div className="flex flex-wrap gap-2">
                            {CLOTHING_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                        setClothingColor(color);
                                        setPlayerColor(color);
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform active:scale-90 ${clothingColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Yüz Şekli */}
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-2">Yüz Şekli</p>
                        <div className="grid grid-cols-3 gap-2">
                            {FACE_SHAPES.map(shape => (
                                <button
                                    key={shape.id}
                                    type="button"
                                    onClick={() => setFaceShape(shape.id)}
                                    className={`py-2 rounded-lg border transition-all text-xs font-bold ${faceShape === shape.id ? 'bg-amber-500 border-amber-500 text-stone-950' : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-stone-600'}`}
                                >
                                    {shape.icon} {shape.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1.5">Oyuncu Adı</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            maxLength={12}
                            placeholder="Adın"
                            autoFocus
                            className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-semibold text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-500"
                            required
                        />
                    </div>

                    {!isJoiningExistingRoom && (
                        <>
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1.5">Oda Kodu</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                        maxLength={8}
                                        placeholder="AB12"
                                        className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-bold uppercase text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-500"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase())}
                                        className="rounded-xl border border-stone-700 bg-stone-900 px-3 text-stone-400 hover:bg-stone-800"
                                        title="Yeni Kod"
                                    >
                                        🎲
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-1.5">
                                    Market Adı <span className="text-stone-700">(isteğe bağlı)</span>
                                </label>
                                <input
                                    type="text"
                                    value={marketName}
                                    onChange={(e) => setMarketName(e.target.value)}
                                    maxLength={24}
                                    placeholder={MARKET_NAME}
                                    className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-sm font-semibold text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-500"
                                />
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={!isFormValid}
                        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-stone-950 shadow-md active:scale-[0.97] transition-all disabled:bg-stone-700 disabled:text-stone-500 mt-2"
                    >
                        {isJoiningExistingRoom ? 'Katıl' : 'Dükkânı Aç'}
                    </button>
                </form>

                <p className="text-center text-[10px] text-stone-700 uppercase tracking-widest">
                    {selectedChar.label}
                </p>
            </div>
        </div>
    );
};
