import { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/Engine';
import { GlitchCanvas } from './components/GlitchCanvas';
import { HUD } from './components/HUD';
import { MenuScreen } from './components/MenuScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { GameState, GameStats, GlitchEvent, CharacterId } from './types/game';
import { sound } from './utils/audio';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new GameEngine();
  }
  const engine = engineRef.current;

  const [gameState, setGameState] = useState<GameState>(engine.state);
  const [stats, setStats] = useState<GameStats>({ ...engine.stats });
  const [glitch, setGlitch] = useState<GlitchEvent>({ ...engine.glitch });
  const [isMuted, setIsMuted] = useState<boolean>(sound.getMuted());
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>(engine.selectedCharacter);

  useEffect(() => {
    engine.onStateChange = (state) => setGameState(state);
    engine.onStatsUpdate = (newStats) => setStats(newStats);
    engine.onGlitchUpdate = (newGlitch) => setGlitch(newGlitch);

    return () => {
      engine.onStateChange = undefined;
      engine.onStatsUpdate = undefined;
      engine.onGlitchUpdate = undefined;
    };
  }, [engine]);

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectCharacter = (id: CharacterId) => {
    setSelectedCharacter(id);
    engine.setCharacter(id);
  };

  const handleStartGame = () => {
    engine.startGame();
  };

  const handlePause = () => {
    engine.pauseGame();
  };

  const handleResume = () => {
    engine.resumeGame();
  };

  const handleRestart = () => {
    engine.restartGame();
  };

  const handleMenu = () => {
    engine.returnToMenu();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07020d] text-white flex items-center justify-center font-sans select-none">
      {/* 2D Canvas Viewport */}
      <GlitchCanvas engine={engine} />

      {/* In-Game HUD overlay */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <HUD
          engine={engine}
          stats={stats}
          glitch={glitch}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
        />
      )}

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MenuScreen
          highScore={stats.highScore}
          isMuted={isMuted}
          selectedCharacter={selectedCharacter}
          hasOverchargeCore={engine.hasPendingOverchargeCore || stats.hasOverchargeCore}
          onGrantOverchargeCore={() => engine.grantOverchargeCore()}
          onSelectCharacter={handleSelectCharacter}
          onToggleMute={handleToggleMute}
          onStartGame={handleStartGame}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && (
        <PauseModal
          isMuted={isMuted}
          onResume={handleResume}
          onRestart={handleRestart}
          onMenu={handleMenu}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <GameOverModal
          stats={stats}
          onRetry={handleRestart}
          onMenu={handleMenu}
          onRevive={() => engine.reviveGame()}
        />
      )}
    </main>
  );
}
