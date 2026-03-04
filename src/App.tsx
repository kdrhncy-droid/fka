import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Joystick } from './components/Joystick';
import { MARKET_NAME } from './constants';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;

type Item = '🍎' | '🍞' | '🥛' | null;

interface Player {
  id: string;
  x: number;
  y: number;
  holding: Item;
  color: string;
  name: string;
  hat: string;
}

interface Customer {
  id: string;
  x: number;
  y: number;
  targetY: number;
  wants: Item;
  patience: number;
  maxPatience: number;
}

interface GameState {
  players: Record<string, Player>;
  customers: Customer[];
  score: number;
  stock: Record<Exclude<Item, null>, number>;
  marketName: string;
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899'];
const HATS = ['', '👑', '🎀', '🎩', '🧢', '🐱'];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [myId, setMyId] = useState<string>('');
  
  // Customization State
  const [showWelcome, setShowWelcome] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const isJoinedRef = useRef(false);
  const [playerName, setPlayerName] = useState('');
  const [marketName, setMarketName] = useState(MARKET_NAME);
  const [playerColor, setPlayerColor] = useState(COLORS[0]);
  const [playerHat, setPlayerHat] = useState(HATS[0]);
  const [roomId, setRoomId] = useState('');
  
  const gameStateRef = useRef<GameState>({ players: {}, customers: [], score: 0, stock: { '🍎': 10, '🍞': 10, '🥛': 10 } });
  const localPlayerRef = useRef({ x: 400, y: 300 });
  const keys = useRef({ w: false, a: false, s: false, d: false });
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSound = (type: string) => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    if (type === 'pickup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'trash') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.setValueAtTime(0.1, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'fail') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'arrive') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  };

  useEffect(() => {
    const newSocket = io({
      transports: ['websocket'],
    });
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('init', (data: { id: string, state: GameState }) => {
      console.log("Init received:", data);
      setMyId(data.id);
      gameStateRef.current = data.state;
      if (data.state.players[data.id]) {
        localPlayerRef.current.x = data.state.players[data.id].x;
        localPlayerRef.current.y = data.state.players[data.id].y;
      }
    });

    newSocket.on('state', (state: GameState) => {
      gameStateRef.current = state;
      setScore(state.score);
    });

    newSocket.on('sound', (type: string) => {
      playSound(type);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isJoinedRef.current) return;
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      if (e.key === 'w' || e.key === 'ArrowUp') keys.current.w = true;
      if (e.key === 'a' || e.key === 'ArrowLeft') keys.current.a = true;
      if (e.key === 's' || e.key === 'ArrowDown') keys.current.s = true;
      if (e.key === 'd' || e.key === 'ArrowRight') keys.current.d = true;
      if (e.key === ' ' || e.key === 'e') newSocket.emit('interact');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isJoinedRef.current) return;
      if (e.key === 'w' || e.key === 'ArrowUp') keys.current.w = false;
      if (e.key === 'a' || e.key === 'ArrowLeft') keys.current.a = false;
      if (e.key === 's' || e.key === 'ArrowDown') keys.current.s = false;
      if (e.key === 'd' || e.key === 'ArrowRight') keys.current.d = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      newSocket.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game Loop
  useEffect(() => {
    if (!isJoined) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastEmitTime = 0;

    const render = (time: number) => {
      // 1. Update Local Player Position
      let dx = 0;
      let dy = 0;
      
      // Keyboard movement
      if (keys.current.w) dy -= PLAYER_SPEED;
      if (keys.current.s) dy += PLAYER_SPEED;
      if (keys.current.a) dx -= PLAYER_SPEED;
      if (keys.current.d) dx += PLAYER_SPEED;

      // Add Joystick movement (already normalized -1 to 1)
      dx += joystickVector.x * PLAYER_SPEED;
      dy += joystickVector.y * PLAYER_SPEED;

      if (dx !== 0 || dy !== 0) {
        localPlayerRef.current.x = Math.max(20, Math.min(GAME_WIDTH - 20, localPlayerRef.current.x + dx));
        localPlayerRef.current.y = Math.max(20, Math.min(GAME_HEIGHT - 20, localPlayerRef.current.y + dy));

        // Emit position to server (throttle to 20fps)
        if (time - lastEmitTime > 50 && socket) {
          socket.emit('move', { x: localPlayerRef.current.x, y: localPlayerRef.current.y });
          lastEmitTime = time;
        }
      }

      // 2. Clear Canvas
      ctx.fillStyle = '#fef3c7'; // Warm floor color
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // 3. Draw Stations
      const drawStation = (x: number, y: number, color: string, icon: string, label: string, stock?: number) => {
        ctx.fillStyle = color;
        ctx.fillRect(x - 40, y - 40, 80, 80);
        ctx.fillStyle = '#000';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, x, y - 10);
        ctx.font = '14px Arial';
        ctx.fillText(label, x, y + 25);
        if (stock !== undefined) {
          ctx.font = '16px Arial';
          ctx.fillText(`Stok: ${stock}`, x, y + 45);
        }
      };

      const state = gameStateRef.current;
      const stock = state.stock || { '🍎': 0, '🍞': 0, '🥛': 0 };
      drawStation(100, 100, '#fca5a5', '🍎', 'Elma', stock['🍎']);
      drawStation(700, 100, '#fdba74', '🍞', 'Ekmek', stock['🍞']);
      drawStation(100, 500, '#bae6fd', '🥛', 'Süt', stock['🥛']);
      drawStation(700, 500, '#d1d5db', '🗑️', 'Çöp');
      drawStation(400, 550, '#fde047', '🛒', 'Market (50 Puan)');

      // 4. Draw Counter
      ctx.fillStyle = '#8b5cf6'; // Purple counter
      ctx.fillRect(300, 250, 280, 100);
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.fillText('KASA', 440, 300);

      // 5. Draw Customers
      state.customers.forEach(c => {
        // Body
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Wants Bubble
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(c.x + 25, c.y - 25, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.fillText(c.wants || '?', c.x + 25, c.y - 25);

        // Patience Bar
        const patienceWidth = 50;
        const patiencePercent = c.patience / c.maxPatience;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(c.x - 25, c.y + 30, patienceWidth, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(c.x - 25, c.y + 30, patienceWidth * patiencePercent, 6);
      });

      // 6. Draw Players
      const statePlayers = gameStateRef.current.players;
      if (myId && statePlayers[myId]) {
        Object.values(statePlayers).forEach((p: Player) => {
          const isMe = p.id === myId;
          const x = isMe ? localPlayerRef.current.x : p.x;
          const y = isMe ? localPlayerRef.current.y : p.y;

          // Player Body
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = isMe ? '#000' : '#fff';
          ctx.stroke();

          // Hat
          if (p.hat) {
            ctx.fillStyle = '#000';
            ctx.font = '24px Arial';
            ctx.fillText(p.hat, x, y - 25);
          }

          // Holding Item
          if (p.holding) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x + 15, y - 15, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.fillText(p.holding, x + 15, y - 15);
          }

          // Name tag
          ctx.fillStyle = '#000';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(p.name, x, y + 35);
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);

    return () => cancelAnimationFrame(animationFrameId);
  }, [myId, socket, isJoined]);

  // Handle Mobile Controls
  const handleInteract = () => {
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    if (socket) socket.emit('interact');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    
    if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
    
    if (socket) {
      socket.emit('join', {
        name: playerName.trim(),
        color: playerColor,
        hat: playerHat,
        roomId: roomId.trim().toLowerCase() || 'default',
        marketName: marketName.trim() || MARKET_NAME
      });
      setIsJoined(true);
      isJoinedRef.current = true;
    }
  };

  if (!isJoined) {
    // Welcome Screen
    if (showWelcome) {
      return (
        <div className="w-full h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-200 flex items-center justify-center p-4 overflow-hidden relative">
          {/* Clouds */}
          <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}>☁️</div>
          <div className="absolute top-20 right-20 text-8xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}>☁️</div>
          <div className="absolute top-40 left-1/3 text-7xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}>☁️</div>

          {/* Market Building */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Store Sign */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-12 py-6 rounded-3xl shadow-2xl border-8 border-yellow-400 mb-8 animate-pulse">
              <h1 className="text-6xl md:text-8xl font-black text-white text-center tracking-tight" style={{ textShadow: '4px 4px 0px rgba(0,0,0,0.3)' }}>
                {MARKET_NAME} 🏪
              </h1>
            </div>

            {/* Store Front */}
            <div className="bg-gradient-to-b from-orange-100 to-orange-200 rounded-3xl p-8 shadow-2xl border-8 border-orange-800 relative">
              {/* Windows */}
              <div className="flex gap-6 mb-6">
                <div className="w-32 h-32 bg-sky-200 rounded-2xl border-4 border-orange-900 flex items-center justify-center text-6xl">
                  🍎
                </div>
                <div className="w-32 h-32 bg-sky-200 rounded-2xl border-4 border-orange-900 flex items-center justify-center text-6xl">
                  🍞
                </div>
                <div className="w-32 h-32 bg-sky-200 rounded-2xl border-4 border-orange-900 flex items-center justify-center text-6xl">
                  🥛
                </div>
              </div>

              {/* Door */}
              <div className="bg-gradient-to-b from-amber-700 to-amber-900 w-48 h-64 mx-auto rounded-t-3xl border-4 border-amber-950 flex flex-col items-center justify-center relative">
                <div className="absolute top-4 text-4xl">🚪</div>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="mt-16 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-2xl font-black text-2xl shadow-xl border-4 border-green-600 transition-all transform hover:scale-110 active:scale-95"
                >
                  GİR 🚀
                </button>
              </div>
            </div>

            {/* Ground */}
            <div className="w-full h-8 bg-green-600 rounded-full mt-4 shadow-lg"></div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-10 left-10 text-5xl">🌳</div>
          <div className="absolute bottom-10 right-10 text-5xl">🌳</div>
          <div className="absolute top-10 right-10 text-4xl animate-spin" style={{ animationDuration: '20s' }}>☀️</div>
        </div>
      );
    }

    return (
      <div className="w-full h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <h1 className="text-3xl font-black text-center mb-2 text-stone-800">Bizim Market 🏪</h1>
          <p className="text-center text-stone-500 mb-8 font-medium">Karakterini oluştur ve dükkana gir!</p>
          
          <form onSubmit={handleJoin} className="space-y-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm font-bold text-stone-500">
                {isConnected ? 'Sunucuya Bağlı' : 'Sunucuya Bağlanıyor...'}
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">İsmin (veya Lakabın)</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={10}
                placeholder="Örn: Aşkım"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition-colors text-lg font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Rengini Seç</label>
              <div className="flex gap-2 justify-between">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPlayerColor(c)}
                    className={`w-10 h-10 rounded-full transition-transform ${playerColor === c ? 'scale-125 ring-4 ring-offset-2 ring-stone-800' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Şapkanı Seç</label>
              <div className="flex gap-2 justify-between bg-stone-100 p-2 rounded-xl">
                {HATS.map(h => (
                  <button
                    key={h || 'none'}
                    type="button"
                    onClick={() => setPlayerHat(h)}
                    className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${playerHat === h ? 'bg-white shadow-md scale-110' : 'hover:bg-white/50'}`}
                  >
                    {h || '❌'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Market İsmi</label>
              <input 
                type="text" 
                value={marketName}
                onChange={(e) => setMarketName(e.target.value)}
                maxLength={20}
                placeholder="Örn: Bizim Market"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition-colors text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Oda İsmi (Opsiyonel)</label>
              <input 
                type="text" 
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                maxLength={15}
                placeholder="Örn: askimla-market"
                className="w-full px-4 py-3 rounded-xl border-2 border-stone-200 focus:border-blue-500 focus:ring-0 outline-none transition-colors text-lg font-medium"
              />
              <p className="text-xs text-stone-400 mt-1">Aynı odaya girmek için aynı ismi yazın.</p>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-black text-lg transition-colors shadow-lg shadow-blue-500/30"
            >
              DÜKKANA GİR 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-stone-900 flex flex-col items-center justify-center overflow-hidden touch-none select-none">
      
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-xl border border-stone-200">
          <h1 className="text-2xl font-black text-stone-800 tracking-tight">{gameStateRef.current.marketName || MARKET_NAME} 🏪</h1>
        </div>
        <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl border border-emerald-600">
          <span className="text-sm font-bold opacity-80 uppercase tracking-wider">Ciro</span>
          <div className="text-3xl font-black">${score}</div>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div className="relative w-full max-w-4xl aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-stone-800">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-8 left-8">
        <Joystick onMove={(x, y) => setJoystickVector({ x, y })} />
      </div>

      <div className="absolute bottom-8 right-8 md:hidden">
        <button 
          onClick={handleInteract}
          className="w-24 h-24 bg-blue-500 active:bg-blue-600 text-white rounded-full shadow-2xl font-black text-xl border-4 border-blue-400 flex items-center justify-center"
        >
          AL/VER
        </button>
      </div>

      {/* PC Instructions */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-stone-400 text-sm hidden md:block font-medium">
        Hareket: <kbd className="bg-stone-800 px-2 py-1 rounded text-stone-200 mx-1">W A S D</kbd> | 
        Etkileşim: <kbd className="bg-stone-800 px-2 py-1 rounded text-stone-200 mx-1">BOŞLUK</kbd>
      </div>
    </div>
  );
}
