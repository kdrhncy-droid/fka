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
  const interactOverrideRef = useRef<(() => void) | null>(null);

  const { socket, isConnected, myId, gameStateRef, audioCtxRef, ping } = useSocket(localPlayerRef);
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

  const [isJoined, setIsJoined] = useState(false);
  const [entryScreen, setEntryScreen] = useState<'menu' | 'lobby'>('menu');
  const [showSettings, setShowSettings] = useState(false);

  const [playerName, setPlayerName] = useState('');
  const [marketName, setMarketName] = useState(MARKET_NAME);
  const [charType, setCharType] = useState(0);
  const [playerColor, setPlayerColor] = useState(CHARACTER_TYPES[0].bodyColor);
  const [playerHat, setPlayerHat] = useState('');
  const [roomId, setRoomId] = useState(() => Math.random().toString(36).substring(2, 6).toUpperCase());
  const [isJoiningExistingRoom, setIsJoiningExistingRoom] = useState(false);

  const handleLeaveGame = () => {
    isJoinedRef.current = false;
    socket?.emit('leave');
    setIsJoined(false);
    setEntryScreen('menu');
    setRoomId(Math.random().toString(36).substring(2, 6).toUpperCase());
    setIsJoiningExistingRoom(false);
  };

  const handleQuickStart = (name: string, quickRoomId: string) => {
    if (!socket) return;
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();

    setRoomId(quickRoomId);
    
    // Varsayılan değerlerle hızlı başlama
    const defaultChar = CHARACTER_TYPES[0];
    socket.emit('join', {
      name: name,
      color: defaultChar.bodyColor,
      hat: defaultChar.hat,
      charType: 0,
      roomId: quickRoomId,
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
      marketName: isJoiningExistingRoom ? '' : (marketName.trim() || MARKET_NAME),
    });

    isJoinedRef.current = true;
    setIsJoined(true);
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

  if (!isJoined) {
    return (
      <>
        {entryScreen === 'menu' ? (
          <WelcomeScreen
            onPlay={(rid) => handleStartLobby(rid)}
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
    />
  );
}
