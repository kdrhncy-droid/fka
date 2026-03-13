import React, { useRef, useState } from 'react';
import { CHARACTER_TYPES } from './types/game';
import { MARKET_NAME } from './constants';
import { useSocket } from './hooks/useSocket';
import { useKeyboard } from './hooks/useKeyboard';
import { useSettings } from './hooks/useSettings';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { GameScreen } from './components/GameScreen';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const localPlayerRef = useRef({ x: 400, y: 300 });
  const isJoinedRef = useRef(false);

  const { socket, isConnected, myId, gameStateRef, audioCtxRef } = useSocket(localPlayerRef);
  const keysRef = useKeyboard({ isJoinedRef, socket, audioCtxRef, gameStateRef, localPlayerRef });
  const { settings, update: updateSettings } = useSettings();

  const [isJoined, setIsJoined] = useState(false);
  const [entryScreen, setEntryScreen] = useState<'menu' | 'lobby'>('menu');
  const [showSettings, setShowSettings] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [marketName, setMarketName] = useState(MARKET_NAME);
  const [charType, setCharType] = useState(0);
  const [playerColor, setPlayerColor] = useState(CHARACTER_TYPES[0].bodyColor);
  const [playerHat, setPlayerHat] = useState('');
  const [roomId, setRoomId] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());

  const handleQuickStart = (name: string, quickRoomId: string) => {
    if (!socket) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();

    // Varsayılan değerlerle hızlı başlama
    const defaultChar = CHARACTER_TYPES[0];
    socket.emit('join', {
      name: name,
      color: defaultChar.bodyColor,
      hat: defaultChar.hat,
      charType: 0,
      roomId: quickRoomId || roomId,
      marketName: MARKET_NAME,
    });

    isJoinedRef.current = true;
    setIsJoined(true);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !socket) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();

    socket.emit('join', {
      name: playerName.trim(),
      color: playerColor,
      hat: playerHat,
      charType,
      roomId: roomId.trim().toUpperCase() || 'TERRAMARKET',
      marketName: marketName.trim() || MARKET_NAME,
    });

    isJoinedRef.current = true;
    setIsJoined(true);
  };

  if (!isJoined) {
    return (
      <>
        {entryScreen === 'menu' ? (
          <WelcomeScreen
            onPlay={() => setEntryScreen('lobby')}
            onQuickStart={handleQuickStart}
            onSettings={() => setShowSettings(true)}
          />
        ) : (
          <CharacterSelect
            isConnected={isConnected}
            playerName={playerName} setPlayerName={setPlayerName}
            playerColor={playerColor} setPlayerColor={setPlayerColor}
            playerHat={playerHat} setPlayerHat={setPlayerHat}
            charType={charType} setCharType={setCharType}
            marketName={marketName} setMarketName={setMarketName}
            roomId={roomId} setRoomId={setRoomId}
            onJoin={handleJoin}
            onBack={() => setEntryScreen('menu')}
            onOpenSettings={() => setShowSettings(true)}
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
    />
  );
}
