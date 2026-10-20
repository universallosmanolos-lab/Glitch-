import React from 'react';
import { PlayerProfile } from '../game/Missions';
import { X, Sparkles, CheckCircle2, Award } from 'lucide-react';

interface MissionsModalProps {
  profile: PlayerProfile;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({ profile, onClose }) => {
  const xpForNextLevel = 500;
  const currentLevelXp = profile.xp % xpForNextLevel;
  const xpProgressPercent = (currentLevelXp / xpForNextLevel) * 100;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1f0a3a] to-[#0c0318] border-2 border-cyan-500/50 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,245,255,0.35)] text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-800/50">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-black tracking-wider text-cyan-300 font-display">
              MISIONES DIARIAS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Player Level & XP Progress Card */}
        <div className="bg-black/50 border border-purple-500/40 rounded-2xl p-3.5 my-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-400 to-pink-500 text-black font-black px-2.5 py-0.5 rounded-full text-xs">
                NIVEL {profile.level}
              </span>
              <span className="text-xs text-gray-300 font-semibold">Rango Investigador Glitch</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{profile.xp} XP Total</span>
            </div>
          </div>
          {/* XP Bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-purple-500/40">
            <div
              className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, xpProgressPercent)}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-400 text-right mt-1 font-mono">
            {currentLevelXp} / {xpForNextLevel} XP para Nivel {profile.level + 1}
          </div>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {profile.missions.map((m) => {
            const percent = Math.min(100, (m.progress / m.target) * 100);
            return (
              <div
                key={m.id}
                className={`p-3 rounded-2xl border transition-all ${
                  m.completed
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-purple-950/30 border-purple-800/40'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white">{m.title}</h3>
                      {m.completed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-gray-300">{m.description}</p>
                  </div>
                  <div className="shrink-0 bg-black/40 border border-cyan-500/30 px-2 py-1 rounded-xl text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>+{m.rewardXp} XP</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                    <span>Progreso</span>
                    <span>
                      {m.progress} / {m.target}
                    </span>
                  </div>
                  <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        m.completed ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-400 to-pink-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-gray-400 text-center mt-3">
          Las misiones se actualizan diariamente a medianoche.
        </div>
      </div>
    </div>
  );
};
