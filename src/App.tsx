import React, { useEffect, useRef, useState } from 'react';
import { CHARACTER_TYPES } from './types/game';
import { MARKET_NAME } from './constants';
import { loadProfile, saveProfile } from './utils/profile';
import { useSocket } from './hooks/useSocket';
import { useKeyboard } from './hooks/useKeyboard';
import { useSettings } from './hooks/useSettings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameScreen } from './components/GameScreen';
import { SettingsPanel } from './components/SettingsPanel';
import { startBgm, stopBgm, setBgmEnabled } from './utils/bgm';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localPlayerRef = useRef({ x: 400, y: 300 });
  const isJoinedRef = useRef(false);
  const interactOverrideRef = useRef<(() => void) | null>(null);

  const { socket, isConnected, myId, gameStateRef, audioCtxRef, ping, chatMessages, dayEndSummary, clearDayEnd, revengeSceneSummary, clearRevengeScene, lastEarnedCoins, clearEarnedCoins } = useSocket(localPlayerRef);
  const keysRef = useKeyboard({
    isJoinedRef, socket, audioCtxRef, gameStateRef, localPlayerRef,
    onInteract: () => {
      if (interactOverrideRef.current) {
        interactOverrideRef.current();
      } else {
        socket?.emit('interact');
      }
    },
  });
  const { settings, update: updateSettings } = useSettings();

  // Uygulama ilk açılışında socket bağlanana kadar splash göster
  useEffect(() => {
    if (isConnected && !appReady) {
      // Kısa bir gecikme — daha dramatik hissettiriyor
      setTimeout(() => setAppReady(true), 600);
    }
  }, [isConnected]);

  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [appReady, setAppReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [playerName, setPlayerName] = useState(() => loadProfile().name);
  const [charType, setCharType] = useState(() => loadProfile().charType);
  const [playerColor, setPlayerColor] = useState(() => CHARACTER_TYPES[loadProfile().charType]?.bodyColor ?? CHARACTER_TYPES[0].bodyColor);
  const [playerHat, setPlayerHat] = useState('');
  const [hairColor, setHairColor] = useState(() => loadProfile().hairColor);
  const [hairStyle, setHairStyle] = useState(() => loadProfile().hairStyle ?? 'default');
  const [clothingColor, setClothingColor] = useState(() => loadProfile().clothingColor);
  const [faceShape, setFaceShape] = useState(() => loadProfile().faceShape);
  const [nameLabelColor, setNameLabelColor] = useState(() => loadProfile().nameLabelColor);
  const [coins, setCoins] = useState(() => loadProfile().coins);
  const [equippedHat, setEquippedHat] = useState(() => loadProfile().equippedHat ?? '');
  const [equippedTitle, setEquippedTitle] = useState(() => loadProfile().equippedTitle ?? '');
  const [equippedLabelEffect, setEquippedLabelEffect] = useState(() => loadProfile().equippedLabelEffect ?? '');

  // Karakter değişince kaydet
  useEffect(() => {
    saveProfile({ name: playerName, charType, hairColor, clothingColor, faceShape, nameLabelColor });
  }, [playerName, charType, hairColor, clothingColor, faceShape, nameLabelColor]);

  // Unmount'ta loadInterval temizle
  useEffect(() => {
    return () => { if (loadIntervalRef.current) clearInterval(loadIntervalRef.current); };
  }, []);
  const [roomId, setRoomId] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());

  const handleLeaveGame = () => {
    isJoinedRef.current = false;
    socket?.emit('leave');
    stopBgm();
    setIsJoined(false);
    setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase());
  };

  // Yeni menüden direkt join
  const handleDirectJoin = (targetRoomId?: string, mapId?: string) => {
    if (!socket) return;
    const rid = targetRoomId
      ? targetRoomId.trim().toUpperCase()
      : Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(rid);
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    setBgmEnabled(settings.bgmOn);
    startBgm();
    socket.emit('join', {
      name: playerName.trim() || 'Oyuncu',
      color: playerColor,
      hat: equippedHat || playerHat,
      title: equippedTitle,
      labelEffect: equippedLabelEffect,
      charType,
      hairColor,
      hairStyle,
      clothingColor,
      faceShape,
      nameLabelColor,
      roomId: rid,
      marketName: targetRoomId ? '' : MARKET_NAME,
      mapId: mapId || 'classic',
    });
    isJoinedRef.current = true;
    setIsLoading(true);
    setLoadProgress(0);
    if (loadIntervalRef.current) clearInterval(loadIntervalRef.current);
    let p = 0;
    loadIntervalRef.current = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) {
        p = 100;
        clearInterval(loadIntervalRef.current!);
        loadIntervalRef.current = null;
        setTimeout(() => { setIsLoading(false); setIsJoined(true); }, 300);
      }
      setLoadProgress(Math.min(p, 100));
    }, 120);
  };

  if (!appReady) {
    return (
      <div className="w-full h-screen bg-[#87ceeb] flex items-center justify-center">
        <LoadingScreen progress={isConnected ? 100 : 40} message={isConnected ? 'Hazırlanıyor' : 'Sunucuya bağlanılıyor'} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#87ceeb] flex items-center justify-center">
        <LoadingScreen progress={loadProgress} message="Odaya bağlanılıyor" />
      </div>
    );
  }

  if (!isJoined) {
    return (
      <>
        <WelcomeScreen
          onPlay={(rid, mapId) => handleDirectJoin(rid, mapId)}
          onSettings={() => setShowSettings(true)}
          playerName={playerName} setPlayerName={setPlayerName}
          charType={charType} setCharType={setCharType}
          hairColor={hairColor} setHairColor={setHairColor}
          hairStyle={hairStyle} setHairStyle={setHairStyle}
          clothingColor={clothingColor} setClothingColor={setClothingColor}
          faceShape={faceShape} setFaceShape={setFaceShape}
          setPlayerColor={setPlayerColor}
          setPlayerHat={setPlayerHat}
          nameLabelColor={nameLabelColor} setNameLabelColor={setNameLabelColor}
          coins={coins} setCoins={setCoins}
          equippedHat={equippedHat} setEquippedHat={setEquippedHat}
          equippedTitle={equippedTitle} setEquippedTitle={setEquippedTitle}
          equippedLabelEffect={equippedLabelEffect} setEquippedLabelEffect={setEquippedLabelEffect}
        />
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setShowSettings(false)}
            isJoined={isJoined}
          />
        )}
      </>
    );
  }


  return (
    <GameScreen
      canvasRef={canvasRef}
      isJoined={isJoined}
      myId={myId}
      socket={socket}
      gameStateRef={gameStateRef}
      localPlayerRef={localPlayerRef}
      keysRef={keysRef}
      audioCtxRef={audioCtxRef}
      settings={settings}
      updateSettings={updateSettings}
      roomId={roomId}
      onLeaveGame={handleLeaveGame}
      interactOverrideRef={interactOverrideRef}
      ping={ping}
      chatMessages={chatMessages}
      dayEndSummary={dayEndSummary}
      onClearDayEnd={clearDayEnd}
      revengeSceneSummary={revengeSceneSummary}
      onClearRevengeScene={clearRevengeScene}
      lastEarnedCoins={lastEarnedCoins}
      onClearEarnedCoins={clearEarnedCoins}
    />
  );
}
