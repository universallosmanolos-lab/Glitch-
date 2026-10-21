import React, { useRef, useEffect, useState } from 'react';
import { Play, Volume2, VolumeX, Trophy, Smartphone, Keyboard, ShieldAlert, Check, Award, ShoppingBag, Coins, Tv, Heart, Zap } from 'lucide-react';
import { CharacterId, CHARACTERS } from '../types/game';
import { missionManager } from '../game/Missions';
import { MissionsModal } from './MissionsModal';
import { StoreModal } from './StoreModal';
import { economy } from '../game/Economy';
import { requestRewardedAd } from '../utils/ads';
import { sound } from '../utils/audio';

interface MenuScreenProps {
  highScore: number;
  isMuted: boolean;
  selectedCharacter: CharacterId;
  hasOverchargeCore?: boolean;
  onGrantOverchargeCore?: () => void;
  onSelectCharacter: (id: CharacterId) => void;
  onToggleMute: () => void;
  onStartGame: () => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  highScore,
  isMuted,
  selectedCharacter,
  hasOverchargeCore = false,
  onGrantOverchargeCore,
  onSelectCharacter,
  onToggleMute,
  onStartGame,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showMissions, setShowMissions] = useState<boolean>(false);
  const [showStore, setShowStore] = useState<boolean>(false);
  const [profile, setProfile] = useState(missionManager.getProfile());
  const [coins, setCoins] = useState<number>(economy.getCoins());
  const [isAdLoading, setIsAdLoading] = useState<boolean>(false);
  const [adFeedback, setAdFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    setCoins(economy.getCoins());
  }, []);

  const handleWatchAdForOvercharge = async () => {
    if (isAdLoading || hasOverchargeCore) return;
    setIsAdLoading(true);
    setAdFeedback(null);
    sound.userGesture();

    const res = await requestRewardedAd();

    setIsAdLoading(false);
    if (res.success) {
      onGrantOverchargeCore?.();
      setAdFeedback({ text: '¡Núcleo de Sobrecarga obtenido! Tendrás 20s de invulnerabilidad.', isError: false });
      sound.playPowerUp();
    } else {
      if (res.reason === 'SDK_NOT_LOADED') {
        setAdFeedback({
          text: 'Proveedor de anuncios no disponible (bloqueador detectado o sin conexión). Puedes jugar sin él.',
          isError: true,
        });
      } else {
        setAdFeedback({
          text: 'El anuncio fue cancelado o no se completó. No se otorgó el núcleo.',
          isError: true,
        });
      }
    }
  };

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.035;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2 + 10;
      const r = 42;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 1.05, r * 1.1, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * 1.05, r * 1.15, 9, 0, 0, Math.PI * 2);
      ctx.stroke();

      const bounce = Math.sin(time * 3) * 8;
      const squashX = 1 + Math.sin(time * 3) * 0.08;
      const squashY = 1 - Math.sin(time * 3) * 0.08;

      ctx.save();
      ctx.translate(cx, cy - bounce);
      ctx.scale(squashX, squashY);

      const charInfo =
        CHARACTERS.find((c) => c.id === selectedCharacter) ||
        (selectedCharacter === 'radioactivo'
          ? { colorCore: '#a7f3d0', colorPrimary: '#10b981', colorSecondary: '#065f46' }
          : selectedCharacter === 'modo_fuego'
          ? { colorCore: '#ffea00', colorPrimary: '#ff6b00', colorSecondary: '#ff0055' }
          : CHARACTERS[0]);

      const bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r * 1.2);
      bodyGrad.addColorStop(0, charInfo.colorCore);
      bodyGrad.addColorStop(0.35, charInfo.colorPrimary);
      bodyGrad.addColorStop(0.75, charInfo.colorSecondary);
      bodyGrad.addColorStop(1, '#18072b');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, 0);
      ctx.bezierCurveTo(-r * 0.9, -r * 0.7, -r * 0.45, -r * 1.15, 0, -r * 1.25);
      ctx.bezierCurveTo(r * 0.45, -r * 1.15, r * 0.9, -r * 0.7, r * 0.85, 0);
      ctx.bezierCurveTo(r * 0.8, r * 0.95, -r * 0.8, r * 0.95, -r * 0.85, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = charInfo.colorCore;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.6, r * 0.28, r * 0.14, -Math.PI / 5, 0, Math.PI * 2);
      ctx.fill();

      const eyeLook = Math.sin(time * 1.5) * 4;
      [-r * 0.32, r * 0.32].forEach((ex) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, -r * 0.15, r * 0.28, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#18072b';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#140624';
        ctx.beginPath();
        ctx.arc(ex + eyeLook, -r * 0.15, r * 0.18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ex + eyeLook - 3, -r * 0.15 - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = '#1d072b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, r * 0.2, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 80, 180, 0.5)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.52, r * 0.12, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(r * 0.52, r * 0.12, 6, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedCharacter]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between items-center p-4 md:p-6 bg-radial from-[#1e0a38]/95 via-[#0f041d]/98 to-[#07010e] text-white backdrop-blur-sm select-none overflow-y-auto">
      {/* Top Header & Buttons */}
      <div className="w-full flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-purple-900/40 border border-purple-500/30 px-3 py-1.5 rounded-full">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-gray-300">
              Récord: <strong className="text-amber-300 font-mono">{highScore.toLocaleString()}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/40 px-3 py-1.5 rounded-full text-amber-300 text-xs font-bold font-mono">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>{coins} 🪙</span>
          </div>

          <button
            onClick={() => {
              setProfile(missionManager.getProfile());
              setShowMissions(true);
            }}
            className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-300 px-3 py-1.5 rounded-full text-cyan-200 text-xs font-bold transition-all active:scale-95 shadow"
          >
            <Award className="w-4 h-4 text-cyan-400" />
            <span>Misiones</span>
          </button>

          <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded-full text-rose-300 text-xs font-bold font-mono">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>2 Vidas</span>
          </div>
        </div>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-200 hover:text-white hover:border-cyan-400 flex items-center justify-center transition-all active:scale-90"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-cyan-300" />}
        </button>
      </div>

      {/* Main Logo & Mascot Centerpiece */}
      <div className="flex flex-col items-center my-auto w-full max-w-sm py-2">
        <div className="relative mb-1">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#00f5ff] absolute -top-1 -left-1 select-none opacity-80 mix-blend-screen filter blur-[0.5px]">
            GLITCH!
          </h1>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#ff007f] absolute top-1 left-1 select-none opacity-80 mix-blend-screen filter blur-[0.5px]">
            GLITCH!
          </h1>
          <h1 className="relative text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-b from-white via-cyan-100 to-purple-200 bg-clip-text text-transparent drop-shadow-[0_10px_25px_rgba(0,245,255,0.4)]">
            GLITCH!
          </h1>
        </div>

        {/* Character Selection / Unlocked Skins */}
        <div className="w-full mt-2 mb-3">
          <div className="text-[11px] uppercase tracking-wider font-bold text-purple-300 mb-1.5 text-center">
            Aspecto seleccionado:
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CHARACTERS.map((char) => {
              const isSelected = selectedCharacter === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`relative p-2 rounded-xl flex flex-col items-center border transition-all ${
                    isSelected
                      ? 'bg-purple-900/80 border-cyan-400 shadow-[0_0_15px_rgba(0,245,255,0.4)] scale-105'
                      : 'bg-black/50 border-purple-800/40 hover:border-purple-500'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                  <div
                    className="w-8 h-8 rounded-full mb-1 shadow-inner border border-white/30"
                    style={{ background: char.colorPrimary }}
                  />
                  <span className="text-[10px] font-bold text-white tracking-wide truncate w-full text-center">
                    {char.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mascot live canvas */}
        <div className="relative my-0">
          <canvas
            ref={previewCanvasRef}
            width={150}
            height={130}
            className="w-[150px] h-[130px]"
          />
        </div>
        {/* Rewarded Ad Exclusive: Núcleo de Sobrecarga */}
        <div className="w-full my-2">
          {hasOverchargeCore ? (
            <div className="w-full py-2.5 px-3 rounded-2xl bg-sky-950/80 border-2 border-sky-400 text-sky-200 flex items-center justify-center gap-2 text-xs font-black shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse">
              <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>⚡ NÚCLEO DE SOBRECARGA EQUIPADO (20s Invulnerable)</span>
            </div>
          ) : (
            <button
              onClick={handleWatchAdForOvercharge}
              disabled={isAdLoading}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-sky-950/90 via-blue-900/90 to-purple-950/90 border-2 border-sky-400 hover:border-sky-300 text-sky-200 flex items-center justify-between text-xs font-black uppercase tracking-wider transition-all active:scale-98 shadow-[0_0_20px_rgba(56,189,248,0.35)]"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-300 animate-bounce" />
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[11px] font-black text-sky-200">Núcleo de Sobrecarga</span>
                  <span className="text-[9px] text-cyan-300 font-medium normal-case mt-0.5">20s Invulnerable al activarlo</span>
                </div>
              </div>
              <span className="bg-sky-400 text-black text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 shrink-0">
                <Tv className="w-3 h-3 text-black" />
                {isAdLoading ? 'Cargando...' : 'Ver Anuncio'}
              </span>
            </button>
          )}
          {adFeedback && (
            <div
              className={`text-[11px] font-bold p-1.5 rounded-xl mt-1.5 text-center transition-all ${
                adFeedback.isError
                  ? 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
                  : 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200'
              }`}
            >
              {adFeedback.text}
            </div>
          )}
        </div>

        {/* Action Buttons: TIENDA & JUGAR */}
        <div className="w-full flex gap-2.5 mt-1">
          <button
            onClick={() => setShowStore(true)}
            className="py-3.5 px-4 rounded-2xl font-black text-sm tracking-wider uppercase text-cyan-300 bg-purple-950/80 hover:bg-purple-900 border-2 border-cyan-500/60 active:scale-95 shadow-[0_0_20px_rgba(0,245,255,0.25)] transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <span>TIENDA</span>
          </button>

          <button
            onClick={onStartGame}
            className="group relative flex-1 py-3.5 px-6 rounded-2xl font-black text-lg tracking-wider uppercase text-black bg-gradient-to-r from-[#00f5ff] via-[#d946ef] to-[#ff007f] hover:brightness-110 active:scale-95 shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all flex items-center justify-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
            <Play className="w-5 h-5 fill-black text-black" />
            <span>JUGAR AHORA</span>
          </button>
        </div>
      </div>

      {/* Controls Brief */}
      <div className="w-full max-w-sm bg-black/50 border border-purple-500/30 rounded-2xl p-3 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2 mb-1.5 text-cyan-300 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Cómo jugar</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
          <div className="flex items-center gap-2 bg-purple-950/40 p-2 rounded-xl border border-purple-800/40">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>Móvil:</strong> Arrastra abajo para guiar</span>
          </div>
          <div className="flex items-center gap-2 bg-purple-950/40 p-2 rounded-xl border border-purple-800/40">
            <Keyboard className="w-4 h-4 text-pink-400 shrink-0" />
            <span><strong>PC:</strong> Flechas o A / D</span>
          </div>
        </div>
      </div>

      {/* Missions Modal */}
      {showMissions && (
        <MissionsModal
          profile={profile}
          onClose={() => setShowMissions(false)}
        />
      )}

      {/* Glitch Store Modal */}
      {showStore && (
        <StoreModal
          onClose={() => setShowStore(false)}
          onUpgradeChanged={() => {
            setCoins(economy.getCoins());
            onSelectCharacter(economy.getEquippedSkin() as CharacterId);
          }}
        />
      )}
    </div>
  );
};
