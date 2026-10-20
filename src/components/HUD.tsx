import React from 'react';
import { GameStats, GlitchEvent } from '../types/game';
import { Pause, Volume2, VolumeX, Sparkles, AlertTriangle, ShieldAlert, Shield, Zap, Coins, Cpu } from 'lucide-react';
import { progression } from '../game/Progression';
import { GameEngine } from '../game/Engine';

interface HUDProps {
  engine: GameEngine;
  stats: GameStats;
  glitch: GlitchEvent;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  stats,
  glitch,
  isMuted,
  onToggleMute,
  onPause,
}) => {
  const upgrades = progression.getProfile().upgrades;
  const dashLevel = upgrades['electric_dash']?.level || 0;
  const chaosLevel = upgrades['chaos_control']?.level || 0;
  const shieldCharges = upgrades['glitch_shield']?.charges || 0;

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* Top Bar Cluster */}
      <div className="flex items-center justify-between w-full z-20">
        {/* Lives Counter with Jelly Icons */}
        <div className="flex items-center gap-1.5 bg-black/55 backdrop-blur-sm border border-purple-500/30 px-3 py-1.5 rounded-full shadow-lg">
          <span className="text-xs font-bold text-purple-300 mr-1 uppercase tracking-wider">Vidas</span>
          {[1, 2, 3].map((lifeNum) => {
            const hasLife = stats.lives >= lifeNum;
            return (
              <div
                key={lifeNum}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                  hasLife
                    ? 'scale-100 shadow-[0_0_10px_#00f5ff]'
                    : 'scale-75 opacity-30 grayscale'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <defs>
                    <linearGradient id={`lifeGrad-${lifeNum}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00f5ff" />
                      <stop offset="60%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 3 C7 3, 4 7, 4 13 C4 18, 7 21, 12 21 C17 21, 20 18, 20 13 C20 7, 17 3, 12 3 Z"
                    fill={hasLife ? `url(#lifeGrad-${lifeNum})` : '#4b5563'}
                    stroke={hasLife ? '#ffffff' : '#374151'}
                    strokeWidth="1.5"
                  />
                  {hasLife && (
                    <>
                      <circle cx="9.5" cy="11.5" r="1.8" fill="#ffffff" />
                      <circle cx="10" cy="11.5" r="1" fill="#111827" />
                      <circle cx="14.5" cy="11.5" r="1.8" fill="#ffffff" />
                      <circle cx="14" cy="11.5" r="1" fill="#111827" />
                    </>
                  )}
                </svg>
              </div>
            );
          })}
        </div>

        {/* Score & Multiplier */}
        <div className="flex flex-col items-center bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-4 py-1.5 rounded-2xl shadow-lg">
          <span className="text-[10px] text-cyan-300 font-semibold uppercase tracking-widest">Puntos</span>
          <span className="text-xl font-black text-white font-mono tracking-wider tabular-nums leading-none">
            {Math.floor(stats.score).toLocaleString()}
          </span>
          {stats.difficultyMultiplier > 1.05 && (
            <span className="text-[9px] font-bold text-amber-400 mt-0.5">
              x{stats.difficultyMultiplier.toFixed(1)} VELOCIDAD
            </span>
          )}
        </div>

        {/* Action Controls (Pause & Audio) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="w-9 h-9 rounded-full bg-black/60 border border-purple-500/40 text-purple-200 hover:text-white hover:border-cyan-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
          </button>
          <button
            onClick={onPause}
            aria-label="Pausar juego"
            className="w-9 h-9 rounded-full bg-black/60 border border-purple-500/40 text-purple-200 hover:text-white hover:border-cyan-400 flex items-center justify-center transition-all active:scale-90 shadow-md"
          >
            <Pause className="w-4 h-4 text-cyan-300" />
          </button>
        </div>
      </div>

      {/* Active Power-up Timers & Consumable Shields Bar */}
      <div className="flex items-center justify-center gap-2 pointer-events-none my-1 flex-wrap">
        {stats.shieldTimeRemaining > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-950/85 border border-blue-400 text-blue-200 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse">
            <Shield className="w-3.5 h-3.5 text-blue-300" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Escudo: {stats.shieldTimeRemaining.toFixed(1)}s
            </span>
          </div>
        )}

        {shieldCharges > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-950/60 border border-blue-500/40 text-blue-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Escudos Glitch: {shieldCharges}</span>
          </div>
        )}

        {stats.speedTimeRemaining > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-950/85 border border-emerald-400 text-emerald-200 px-3 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse">
            <Zap className="w-3.5 h-3.5 text-emerald-300" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Velocidad: {stats.speedTimeRemaining.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {/* GLITCH Banner Notifications */}
      <div className="w-full flex flex-col items-center justify-center pointer-events-none mt-1">
        {glitch.warningTime > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600/90 via-red-600/90 to-amber-600/90 border-2 border-amber-300 text-white px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.6)] animate-pulse">
            <AlertTriangle className="w-5 h-5 text-amber-200 animate-bounce" />
            <div className="text-center">
              <div className="text-xs font-black tracking-widest uppercase text-amber-200">
                ¡ALERTA DE ANOMALÍA GLITCH!
              </div>
              <div className="text-[11px] font-bold text-white">
                Activación en {glitch.warningTime.toFixed(1)}s
              </div>
            </div>
          </div>
        )}

        {glitch.active && (
          <div className="w-full max-w-xs bg-black/85 border-2 border-cyan-400 text-cyan-100 p-2.5 rounded-xl shadow-[0_0_25px_rgba(0,245,255,0.5)] flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-spin" />
              <span className="text-xs font-black text-rose-300 tracking-wider">
                {glitch.title}
              </span>
            </div>
            <p className="text-[10px] text-gray-300 text-center leading-tight mb-2">
              {glitch.description}
            </p>
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden border border-cyan-500/50">
              <div
                className="bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 h-full transition-all duration-100"
                style={{ width: `${Math.max(0, (glitch.remaining / glitch.duration) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Ability Buttons Bar (Dash & Chaos Control) */}
      <div className="flex items-center justify-center gap-3 pointer-events-auto my-2">
        {dashLevel > 0 && (
          <button
            onClick={() => engine.triggerDash()}
            className="flex items-center gap-1.5 bg-yellow-500/20 border-2 border-yellow-400 text-yellow-300 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>⚡ Impulso</span>
          </button>
        )}

        {chaosLevel > 0 && glitch.active && (
          <button
            onClick={() => engine.triggerChaosControl()}
            className="flex items-center gap-1.5 bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all animate-bounce"
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>🌀 Control Caos</span>
          </button>
        )}
      </div>

      {/* Bottom Info Bar / Stats & Coins Counter */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono px-2 py-1">
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Esquives: <strong className="text-white">{stats.dodgesCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-amber-500/30 text-amber-300 font-bold">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{stats.coinsCollected} 🪙</span>
        </div>
      </div>
    </div>
  );
};
