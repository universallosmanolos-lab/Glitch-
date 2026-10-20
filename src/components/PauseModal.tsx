import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isMuted,
  onResume,
  onRestart,
  onMenu,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-xs bg-gradient-to-b from-[#180a2c] to-[#0a0314] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-[0_0_40px_rgba(0,245,255,0.3)] text-white text-center flex flex-col items-center">
        <h2 className="text-3xl font-black tracking-wider text-cyan-400 mb-1 font-display">
          PAUSA
        </h2>
        <p className="text-xs text-gray-400 mb-6">El juego está detenido</p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-base tracking-wider uppercase text-black bg-gradient-to-r from-[#00f5ff] to-[#d946ef] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>CONTINUAR</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase text-gray-200 bg-purple-950/50 hover:bg-purple-900/60 active:scale-95 border border-purple-500/40 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4 text-cyan-300" />
            <span>REINICIAR</span>
          </button>

          <button
            onClick={onMenu}
            className="w-full py-3 px-6 rounded-2xl font-bold text-sm tracking-wider uppercase text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MENÚ PRINCIPAL</span>
          </button>

          <button
            onClick={onToggleMute}
            className="w-full py-2.5 px-4 mt-1 rounded-xl text-xs font-semibold text-gray-300 hover:text-cyan-300 bg-black/40 border border-white/10 transition-all flex items-center justify-center gap-2"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>Sonido: Silenciado</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>Sonido: Activado</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
