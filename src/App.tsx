import React, { useEffect, useRef, useState } from 'react';
import { CHARACTER_TYPES } from './types/game';
import { MARKET_NAME } from './constants';
import { useSocket } from './hooks/useSocket';
import { useKeyboard } from './hooks/useKeyboard';
import { useSettings } from './hooks/useSettings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { GameScreen } from './components/GameScreen';
import { SettingsPanel } from './components/SettingsPanel';
import { startBgm, stopBgm, setBgmEnabled } from './utils/bgm';
import { LoadingScreen } from './components/LoadingScreen';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localPlayerRef = useRef({ x: 400, y: 300 });
  const isJoinedRef = useRef(false);
  const interactOverrideRef = useRef<(() => void) | null>(null);

  const { socket, isConnected, myId, gameStateRef, audioCtxRef, ping, chatMessages, dayEndSummary, clearDayEnd } = useSocket(localPlayerRef);
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
  const [entryScreen, setEntryScreen] = useState<'menu' | 'lobby'>('menu');
  const [showSettings, setShowSettings] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [marketName, setMarketName] = useState(MARKET_NAME);
  const [charType, setCharType] = useState(0);
  const [playerColor, setPlayerColor] = useState(CHARACTER_TYPES[0].bodyColor);
  const [playerHat, setPlayerHat] = useState('');
  const [hairColor, setHairColor] = useState('#4b2c20');
  const [clothingColor, setClothingColor] = useState(CHARACTER_TYPES[0].bodyColor);
  const [faceShape, setFaceShape] = useState(0);
  const [roomId, setRoomId] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());
  const [isJoiningExistingRoom, setIsJoiningExistingRoom] = useState(false);

  const handleLeaveGame = () => {
    isJoinedRef.current = false;
    socket?.emit('leave');
    stopBgm();
    setIsJoined(false);
    setEntryScreen('menu');
    setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase());
    setIsJoiningExistingRoom(false);
  };

  const handleQuickStart = (name: string, quickRoomId: string) => {
    if (!socket) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    setBgmEnabled(settings.bgmOn);
    startBgm();

    setRoomId(quickRoomId);    setIsLoading(true);
    setLoadProgress(0);

    // Sahte yükleme animasyonu (bağlantı kurulurken)
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { setIsLoading(false); setIsJoined(true); }, 300); }
      setLoadProgress(Math.min(p, 100));
    }, 120);
    
    // Varsayılan değerlerle hızlı başlama
    const defaultChar = CHARACTER_TYPES[0];
    socket.emit('join', {
      name: name,
      color: defaultChar.bodyColor,
      hat: defaultChar.hat,
      charType: 0,
      hairColor: '#4b2c20',
      clothingColor: defaultChar.bodyColor,
      faceShape: 0,
      roomId: quickRoomId,
      marketName: MARKET_NAME,
    });

    isJoinedRef.current = true;
    // setIsJoined loading bittikten sonra çağrılıyor
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !socket) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    setBgmEnabled(settings.bgmOn);
    startBgm();

    socket.emit('join', {
      name: playerName.trim(),
      color: playerColor,
      hat: playerHat,
      charType,
      hairColor,
      clothingColor,
      faceShape,
      roomId: roomId.trim().toUpperCase() || 'TERRAMARKET',
      marketName: isJoiningExistingRoom ? '' : (marketName.trim() || MARKET_NAME),
    });

    isJoinedRef.current = true;
    setIsLoading(true);
    setLoadProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 8;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { setIsLoading(false); setIsJoined(true); }, 300); }
      setLoadProgress(Math.min(p, 100));
    }, 120);
  };

  const handleStartLobby = (targetRoomId?: string) => {
    if (targetRoomId) {
      setRoomId(targetRoomId);
      setIsJoiningExistingRoom(true);
      setPlayerName(''); // Katılırken oyuncu adı boş başlasın
    } else {
      setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase());
      setIsJoiningExistingRoom(false);
      setPlayerName(''); // Yeni oda kurulurken de boş başlasın
    }
    setEntryScreen('lobby');
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
        {entryScreen === 'menu' ? (
          <WelcomeScreen
            onPlay={(rid) => handleStartLobby(rid)}
            onQuickStart={handleQuickStart}
            onSettings={() => setShowSettings(true)}
            charType={charType} setCharType={setCharType}
            hairColor={hairColor} setHairColor={setHairColor}
            clothingColor={clothingColor} setClothingColor={setClothingColor}
            faceShape={faceShape} setFaceShape={setFaceShape}
            setPlayerColor={setPlayerColor}
            setPlayerHat={setPlayerHat}
          />
        ) : (
          <CharacterSelect
            isConnected={isConnected}
            playerName={playerName} setPlayerName={setPlayerName}
            playerColor={playerColor} setPlayerColor={setPlayerColor}
            playerHat={playerHat} setPlayerHat={setPlayerHat}
            hairColor={hairColor} setHairColor={setHairColor}
            clothingColor={clothingColor} setClothingColor={setClothingColor}
            faceShape={faceShape} setFaceShape={setFaceShape}
            charType={charType} setCharType={setCharType}
            marketName={marketName} setMarketName={setMarketName}
            roomId={roomId} setRoomId={setRoomId}
            onJoin={handleJoin}
            onBack={() => setEntryScreen('menu')}
            onOpenSettings={() => setShowSettings(true)}
            isJoiningExistingRoom={isJoiningExistingRoom}
          />
        )}

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
    />
  );
}
