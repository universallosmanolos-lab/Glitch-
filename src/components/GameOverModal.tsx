import React, { useState } from 'react';
import { GameStats } from '../types/game';
import { RotateCcw, Home, Trophy, Sparkles, Clock, Coins, Award, Heart, Tv } from 'lucide-react';
import { progression } from '../game/Progression';
import { requestRewardedAd } from '../utils/ads';
import { sound } from '../utils/audio';

interface GameOverModalProps {
  stats: GameStats;
  onRetry: () => void;
  onMenu: () => void;
  onRevive?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onMenu,
  onRevive,
}) => {
  const [isAdLoading, setIsAdLoading] = useState<boolean>(false);
  const [adError, setAdError] = useState<string | null>(null);

  const finalScore = Math.floor(stats.score);
  const isNewRecord = finalScore >= stats.highScore && finalScore > 0;

  const mins = Math.floor(stats.timeSurvived / 60);
  const secs = Math.floor(stats.timeSurvived % 60);
  const timeFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const profile = progression.getProfile();
  const xpForNextLevel = profile.level * 400;
  const currentLevelXp = profile.xp % xpForNextLevel;
  const xpPercent = Math.min(100, (currentLevelXp / xpForNextLevel) * 100);

  const canRevive = (stats.revivesRemaining ?? 0) > 0 && typeof onRevive === 'function';

  const handleReviveWithAd = async () => {
    if (isAdLoading || !canRevive || !onRevive) return;
    setIsAdLoading(true);
    setAdError(null);
    sound.userGesture();

    const res = await requestRewardedAd();

    setIsAdLoading(false);
    if (res.success) {
      onRevive();
    } else {
      if (res.reason === 'SDK_NOT_LOADED') {
        setAdError('Proveedor de anuncios no disponible (bloqueador detectado o sin conexión). No se pudo revivir.');
      } else {
        setAdError('El anuncio fue cancelado o no se completó. No se pudo revivir.');
      }
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1c0833] to-[#0c0316] border-2 border-rose-500/65 rounded-3xl p-5 shadow-[0_0_50px_rgba(244,63,94,0.4)] text-white text-center flex flex-col items-center">
        {/* Game Over Title */}
        <div className="relative mb-2">
          <span className="text-3xl font-black tracking-tight text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] font-display">
            ¡FIN DE LA PARTIDA!
          </span>
        </div>

        {isNewRecord && (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/30 via-yellow-500/40 to-amber-500/30 border border-yellow-400 text-yellow-300 px-3.5 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-3 animate-bounce">
            <Trophy className="w-4 h-4 text-yellow-300" />
            <span>¡NUEVO RÉCORD!</span>
          </div>
        )}

        {/* Score & Coins Summary Card */}
        <div className="w-full bg-black/60 border border-purple-500/40 rounded-2xl p-3.5 mb-2.5">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">
            Puntuación
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-wider tabular-nums mb-2">
            {finalScore.toLocaleString()}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-900/50 text-xs">
            <div className="flex items-center justify-center gap-1 text-amber-400 font-bold font-mono bg-amber-950/40 py-1 rounded-xl border border-amber-800/30">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>+{stats.coinsCollected} Monedas</span>
            </div>
            <div className="flex items-center justify-center gap-1 text-cyan-300 font-bold font-mono bg-cyan-950/40 py-1 rounded-xl border border-cyan-800/30">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Nivel {profile.level}</span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full bg-black/50 border border-purple-500/30 rounded-2xl p-2.5 mb-2.5 text-left">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 mb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              Experiencia (XP)
            </span>
            <span className="font-mono text-cyan-300">{currentLevelXp} / {xpForNextLevel} XP</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-white/10">
            <div
              className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Revives Status Card - 2 revives per game, each requiring an ad */}
        <div className="w-full mb-3">
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-950/40 border border-purple-700/50 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${canRevive ? 'text-rose-400 fill-rose-400 animate-pulse' : 'text-gray-500'}`} />
              <span className="text-gray-300">Revividas disponibles:</span>
            </div>
            <span className={`font-mono px-2 py-0.5 rounded-full text-xs font-black ${
              canRevive ? 'bg-rose-900/60 text-rose-200 border border-rose-500/50' : 'bg-gray-800 text-gray-400'
            }`}>
              {stats.revivesRemaining ?? 0} / 2 (con anuncio)
            </span>
          </div>
          {adError && (
            <div className="text-[11px] font-bold p-1.5 rounded-xl mt-1.5 text-center bg-rose-950/80 border border-rose-500/60 text-rose-200">
              {adError}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase">Tiempo</div>
              <div className="font-bold text-white">{timeFormatted}</div>
            </div>
          </div>

          <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] text-gray-400 uppercase">Esquives "Casi"</div>
              <div className="font-bold text-white">{stats.dodgesCount}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2">
          {canRevive ? (
            <>
              {/* Revive Button - requires rewarded ad */}
              <button
                onClick={handleReviveWithAd}
                disabled={isAdLoading}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs tracking-wider uppercase text-white bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(244,63,94,0.5)] border border-rose-400/50 transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 text-white fill-white animate-pulse" />
                <Tv className="w-4 h-4 text-yellow-300" />
                <span>{isAdLoading ? 'CARGANDO ANUNCIO...' : 'REVIVIR (+1 VIDA - VER ANUNCIO)'}</span>
              </button>

              <button
                onClick={onMenu}
                className="w-full py-2.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase text-gray-300 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>FINALIZAR PARTIDA</span>
              </button>
            </>
          ) : (
            <>
              {/* Revives exhausted - show final results and standard options */}
              <button
                onClick={onRetry}
                className="w-full py-3 px-6 rounded-2xl font-black text-sm tracking-wider uppercase text-black bg-gradient-to-r from-[#00f5ff] to-[#76ff03] hover:brightness-110 active:scale-95 shadow-[0_0_25px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-black" />
                <span>REINTENTAR PARTIDA</span>
              </button>

              <button
                onClick={onMenu}
                className="w-full py-2.5 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase text-gray-300 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>MENÚ PRINCIPAL</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
