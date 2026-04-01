import React, { useEffect, useRef, useState } from 'react';
import { MARKET_NAME } from '../constants';
import { PatchNotesModal } from './PatchNotesModal';
import { TutorialOverlay, markTutorialDone } from './TutorialOverlay';
import { ProfileModal } from './ProfileModal';
import { ShopModal } from './ShopModal';
import { stk, adjustColor, drawShadowEllipse } from '../renderer/rendererUtils';

// ── Arka plan canvas animasyonu (loading screen ile aynı stil) ──────────────
const FOOD_EMOJIS = ['🍕', '🍔', '🥗', '🍜', '🌯', '🍽️', '🥩', '🥬'];
interface Particle { x: number; y: number; vx: number; vy: number; rot: number; vrot: number; emoji: string; size: number; }

function drawChibiBg(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, right: boolean, body: string, hair: string) {
  const dir = right ? 1 : -1;
  const bob = Math.abs(Math.sin(t)) * 4;
  const sw = Math.sin(t) * 6;
  ctx.save(); ctx.translate(x, y - bob); ctx.scale(dir, 1);
  drawShadowEllipse(ctx, 0, 26, 16, 6);
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-7 - sw, 20, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);
  ctx.beginPath(); ctx.arc(7 + sw, 20, 5, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);
  ctx.beginPath(); ctx.roundRect(-13, 2, 26, 20, 10);
  const bg = ctx.createLinearGradient(0, 2, 0, 22);
  bg.addColorStop(0, adjustColor(body, 20)); bg.addColorStop(1, body);
  ctx.fillStyle = bg; ctx.fill(); stk(ctx, '#000', 1.5);
  ctx.fillStyle = '#f5c090';
  ctx.beginPath(); ctx.arc(-15, 10 + sw, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);
  ctx.beginPath(); ctx.arc(15, 10 - sw, 4, 0, Math.PI * 2); ctx.fill(); stk(ctx, '#000', 1);
  const hr = 17; const hy = -13;
  ctx.beginPath(); ctx.arc(0, hy, hr, 0, Math.PI * 2);
  const hg = ctx.createRadialGradient(-3, hy - 3, 1, 0, hy, hr);
  hg.addColorStop(0, '#fff1e0'); hg.addColorStop(1, '#f5c090');
  ctx.fillStyle = hg; ctx.fill(); stk(ctx, '#000', 1.5);
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(0, hy - 4, hr + 1, Math.PI, 0);
  ctx.lineTo(hr + 1, hy + 2); ctx.lineTo(hr - 3, hy + 2); ctx.lineTo(hr - 7, hy - 1);
  ctx.lineTo(-hr + 7, hy - 1); ctx.lineTo(-hr + 3, hy + 2); ctx.lineTo(-hr - 1, hy + 2);
  ctx.closePath(); ctx.fill(); stk(ctx, adjustColor(hair, -20), 1);
  ctx.fillStyle = 'rgba(255,182,193,0.5)';
  ctx.beginPath(); ctx.arc(-8, hy + 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, hy + 4, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-6, hy + 1, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6, hy + 1, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-5, hy - 1, 1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(7, hy - 1, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function MenuBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    particlesRef.current = Array.from({ length: 14 }, (_, i) => ({
      x: 60 + (i / 14) * (window.innerWidth - 120),
      y: window.innerHeight * 0.4 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 0.5, vy: -0.4 - Math.random() * 0.6,
      rot: Math.random() * Math.PI * 2, vrot: (Math.random() - 0.5) * 0.03,
      emoji: FOOD_EMOJIS[i % FOOD_EMOJIS.length], size: 20 + Math.random() * 12,
    }));

    const render = (time: number) => {
      const W = canvas.width, H = canvas.height;
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.68);
      sky.addColorStop(0, '#4a90d9'); sky.addColorStop(0.5, '#87ceeb'); sky.addColorStop(1, '#c8e8a0');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Bulutlar
      [[0.1, 0.1, 1.0], [0.4, 0.07, 0.75], [0.7, 0.13, 0.9]].forEach(([cx, cy, sc]) => {
        const bx = ((cx + time * 0.00006) % 1.1 - 0.05) * W;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.beginPath();
        ctx.arc(bx, cy * H, 36 * sc, 0, Math.PI * 2);
        ctx.arc(bx + 28 * sc, cy * H - 9 * sc, 26 * sc, 0, Math.PI * 2);
        ctx.arc(bx + 52 * sc, cy * H, 30 * sc, 0, Math.PI * 2);
        ctx.fill();
      });

      const groundY = H * 0.68;
      const ground = ctx.createLinearGradient(0, groundY, 0, H);
      ground.addColorStop(0, '#5a9e3a'); ground.addColorStop(0.2, '#4a8a2e'); ground.addColorStop(1, '#3a6e22');
      ctx.fillStyle = ground; ctx.fillRect(0, groundY, W, H - groundY);
      ctx.fillStyle = '#6ab84a';
      ctx.beginPath(); ctx.moveTo(0, groundY);
      for (let gx = 0; gx <= W; gx += 16) ctx.lineTo(gx, groundY - Math.sin((gx + time * 0.001) * 0.2) * 4);
      ctx.lineTo(W, groundY + 15); ctx.lineTo(0, groundY + 15); ctx.closePath(); ctx.fill();

      // Yemekler
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vrot; p.vy += 0.007;
        if (p.y > groundY + 10 || p.x < -40 || p.x > W + 40) {
          p.x = 60 + Math.random() * (W - 120); p.y = groundY - 10;
          p.vy = -1.2 - Math.random() * 1.2; p.vx = (Math.random() - 0.5) * 1.0;
        }
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.font = `${p.size}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.globalAlpha = 0.8; ctx.fillText(p.emoji, 0, 0); ctx.restore();
      });

      // Chibi karakterler
      const t = time * 0.0025;
      drawChibiBg(ctx, W * 0.12, groundY + 2, t, true, '#a78bfa', '#4b2c20');
      drawChibiBg(ctx, W * 0.88, groundY + 2, t + 1.2, false, '#fbbf24', '#8B4513');

      // Koyu overlay — butonların okunabilmesi için
      const overlay = ctx.createLinearGradient(0, 0, 0, H);
      overlay.addColorStop(0, 'rgba(0,0,0,0.15)');
      overlay.addColorStop(0.5, 'rgba(0,0,0,0.05)');
      overlay.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = overlay; ctx.fillRect(0, 0, W, H);

      frameRef.current = requestAnimationFrame(render);
    };
    frameRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(frameRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ── Tip tipleri ──────────────────────────────────────────────────────────────
type Screen = 'main' | 'multiplayer' | 'create' | 'join' | 'name';

interface WelcomeScreenProps {
  onPlay: (roomId?: string, mapId?: string) => void;
  onSettings: () => void;
  playerName: string; setPlayerName: (v: string) => void;
  charType: number; setCharType: (v: number) => void;
  hairColor: string; setHairColor: (v: string) => void;
  clothingColor: string; setClothingColor: (v: string) => void;
  faceShape: number; setFaceShape: (v: number) => void;
  setPlayerColor: (v: string) => void;
  setPlayerHat: (v: string) => void;
  nameLabelColor: string; setNameLabelColor: (v: string) => void;
  coins: number; setCoins: (v: number) => void;
  equippedHat: string; setEquippedHat: (v: string) => void;
}

const HAIR_COLORS = ['#4b2c20','#24150e','#8d5524','#c68642','#f1c27d','#ffffff','#ef4444','#3b82f6','#a855f7','#22c55e'];
const CLOTHING_COLORS = ['#f5f5f4','#fef3c7','#e0f2fe','#ef4444','#3b82f6','#22c55e','#a855f7','#f97316','#ec4899','#1c1917'];
const LABEL_COLORS = ['#ffffff','#fbbf24','#34d399','#60a5fa','#f472b6','#a78bfa','#fb923c','#f87171','#4ade80','#000000'];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onPlay, onSettings,
  playerName, setPlayerName, charType, setCharType, hairColor, setHairColor,
  clothingColor, setClothingColor, faceShape, setFaceShape,
  setPlayerColor, setPlayerHat,
  nameLabelColor, setNameLabelColor,
  coins, setCoins, equippedHat, setEquippedHat,
}) => {
  const [screen, setScreen] = useState<Screen>('main');
  const [joinCode, setJoinCode] = useState('');
  const [pendingRoomId, setPendingRoomId] = useState<string | undefined>(undefined);
  const [generatedRoomId, setGeneratedRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const openCreate = () => {
    const rid = Math.random().toString(36).substring(2, 6).toUpperCase();
    setGeneratedRoomId(rid);
    setCopied(false);
    if (!playerName.trim()) {
      setPendingRoomId(rid);
      setScreen('name');
    } else {
      setScreen('create');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(generatedRoomId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goPlay = (rid?: string) => {
    const actualRid = rid === 'solo' ? undefined : rid;
    if (!playerName.trim()) {
      setPendingRoomId(rid);
      setScreen('name');
    } else {
      onPlay(actualRid, 'classic');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex items-center justify-center safe-top safe-bottom">
      <MenuBackground />

      {/* ℹ️ Sol alt butonu */}
      <div className="absolute bottom-6 left-6 z-10">
        <button onClick={() => setShowPatchNotes(true)}
          className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white flex items-center justify-center text-xl transition-all active:scale-90">
          ℹ️
        </button>
      </div>

      {/* İçerik */}
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-4 w-full max-w-xs h-full overflow-y-auto no-scrollbar justify-center">

        {/* Logo */}
        <div className="text-center drop-shadow-lg">
          <div className="text-6xl mb-1 drop-shadow-md">🍽️</div>
          <h1 className="text-4xl font-black uppercase tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            {MARKET_NAME}
          </h1>
          <p className="text-xs text-white/70 tracking-widest uppercase mt-1">Multiplayer Mutfak Oyunu</p>
          {/* Coin göstergesi */}
          <div className="mt-2 inline-flex items-center gap-1.5 bg-black/30 backdrop-blur border border-yellow-500/30 rounded-full px-3 py-1">
            <span className="text-base">🪙</span>
            <span className="text-yellow-400 font-black text-sm">{coins.toLocaleString('tr-TR')}</span>
          </div>
        </div>

        {/* Ana ekran */}
        {screen === 'main' && (
          <div className="w-full space-y-2.5">
            <button onClick={() => setScreen('multiplayer')}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-stone-950 font-black text-sm uppercase tracking-widest shadow-lg transition-all">
              Çok Oyunculu
            </button>
            <button onClick={() => goPlay('solo')}
              className="w-full py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.97] backdrop-blur border border-white/20 text-white font-black text-sm uppercase tracking-widest shadow transition-all">
              Tek Oyunculu
            </button>
            <button onClick={() => setShowProfile(true)}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-[0.97] backdrop-blur border border-white/15 text-white/90 font-bold text-sm uppercase tracking-widest transition-all">
              👤 Profil
            </button>
            <button onClick={() => setShowShop(true)}
              className="w-full py-3 rounded-2xl bg-yellow-500/15 hover:bg-yellow-500/25 active:scale-[0.97] backdrop-blur border border-yellow-500/30 text-yellow-300 font-bold text-sm uppercase tracking-widest transition-all">
              🛒 Market
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={onSettings}
                className="py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white/80 font-bold text-xs uppercase tracking-widest transition-all">
                Ayarlar
              </button>
              <button onClick={() => { markTutorialDone(); setShowTutorial(true); }}
                className="py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 text-white/80 font-bold text-xs uppercase tracking-widest transition-all">
                Nasıl Oynanır?
              </button>
            </div>
          </div>
        )}

        {/* Çok oyunculu */}
        {screen === 'multiplayer' && (
          <div className="w-full space-y-2.5">
            <button onClick={openCreate}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-stone-950 font-black text-sm uppercase tracking-widest shadow-lg transition-all">
              Oda Kur
            </button>
            <button onClick={() => setScreen('join')}
              className="w-full py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-[0.97] backdrop-blur border border-white/20 text-white font-black text-sm uppercase tracking-widest shadow transition-all">
              Odaya Katıl
            </button>
            <button onClick={() => setScreen('main')}
              className="w-full py-2.5 rounded-2xl bg-white/8 hover:bg-white/15 backdrop-blur border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest transition-all">
              ← Geri
            </button>
          </div>
        )}

        {/* Oda Kur — kod göster */}
        {screen === 'create' && (
          <div className="w-full space-y-3">
            <div className="rounded-2xl bg-black/30 backdrop-blur border border-white/15 p-5 text-center space-y-3">
              <p className="text-white/60 text-xs uppercase tracking-widest">Oda Kodun</p>
              <div className="text-4xl font-black tracking-[0.3em] text-amber-400 drop-shadow-lg">
                {generatedRoomId}
              </div>
              <button onClick={copyRoomId}
                className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}>
                {copied ? '✓ Kopyalandı!' : '📋 Kodu Kopyala'}
              </button>
              <p className="text-white/40 text-[10px]">Arkadaşlarına bu kodu gönder</p>
            </div>
            <button onClick={() => onPlay(generatedRoomId, 'classic')}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-stone-950 font-black text-sm uppercase tracking-widest shadow-lg transition-all">
              Oyuna Gir →
            </button>
            <button onClick={() => setScreen('multiplayer')}
              className="w-full py-2.5 rounded-2xl bg-white/8 hover:bg-white/15 backdrop-blur border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest transition-all">
              ← Geri
            </button>
          </div>
        )}

        {/* Odaya katıl */}
        {screen === 'join' && (
          <div className="w-full space-y-3">
            <input
              type="text" value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Oda Kodu (örn: AB12)"
              maxLength={8} autoFocus
              className="w-full rounded-2xl border border-white/20 bg-black/30 backdrop-blur px-4 py-3 text-sm font-bold uppercase text-white outline-none placeholder:text-white/40 focus:border-amber-400"
            />
            <button
              onClick={() => joinCode.trim() && goPlay(joinCode.trim())}
              disabled={!joinCode.trim()}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-stone-950 font-black text-sm uppercase tracking-widest shadow-lg transition-all disabled:bg-white/20 disabled:text-white/40">
              Katıl →
            </button>
            <button onClick={() => setScreen('multiplayer')}
              className="w-full py-2.5 rounded-2xl bg-white/8 hover:bg-white/15 backdrop-blur border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest transition-all">
              ← Geri
            </button>
          </div>
        )}

        {/* İsim sorma */}
        {screen === 'name' && (
          <div className="w-full space-y-3">
            <p className="text-white/80 text-sm text-center">Oyuncu adını gir</p>
            <input
              type="text" value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Adın"
              maxLength={12} autoFocus
              className="w-full rounded-2xl border border-white/20 bg-black/30 backdrop-blur px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/40 focus:border-amber-400"
            />
            <button
              onClick={() => {
                if (playerName.trim()) {
                  if (pendingRoomId === 'solo') { onPlay(undefined, 'classic'); }
                  else if (pendingRoomId) { setScreen('create'); }
                  else { onPlay(undefined, 'classic'); }
                }
              }}
              disabled={!playerName.trim()}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.97] text-stone-950 font-black text-sm uppercase tracking-widest shadow-lg transition-all disabled:bg-white/20 disabled:text-white/40">
              Devam →
            </button>
            <button onClick={() => setScreen(pendingRoomId && pendingRoomId !== 'solo' ? 'join' : pendingRoomId === 'solo' ? 'main' : 'multiplayer')}
              className="w-full py-2.5 rounded-2xl bg-white/8 hover:bg-white/15 backdrop-blur border border-white/10 text-white/60 font-bold text-xs uppercase tracking-widest transition-all">
              ← Geri
            </button>
          </div>
        )}

        </div>      {showPatchNotes && <PatchNotesModal onClose={() => setShowPatchNotes(false)} />}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          playerName={playerName} setPlayerName={setPlayerName}
          charType={charType} setCharType={setCharType}
          hairColor={hairColor} setHairColor={setHairColor}
          clothingColor={clothingColor} setClothingColor={setClothingColor}
          faceShape={faceShape} setFaceShape={setFaceShape}
          nameLabelColor={nameLabelColor} setNameLabelColor={setNameLabelColor}
          setPlayerColor={setPlayerColor} setPlayerHat={setPlayerHat}
          coins={coins}
        />
      )}
      {showShop && (
        <ShopModal
          onClose={() => setShowShop(false)}
          coins={coins} setCoins={setCoins}
          charType={charType}
          hairColor={hairColor} setHairColor={setHairColor}
          clothingColor={clothingColor} setClothingColor={setClothingColor}
          nameLabelColor={nameLabelColor} setNameLabelColor={setNameLabelColor}
          equippedHat={equippedHat} setEquippedHat={setEquippedHat}
          setPlayerColor={setPlayerColor}
        />
      )}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
    </div>
  );
};
