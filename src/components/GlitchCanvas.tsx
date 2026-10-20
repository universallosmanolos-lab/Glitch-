import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameEngine } from '../game/Engine';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GlitchCanvasProps {
  engine: GameEngine;
}

export const GlitchCanvas: React.FC<GlitchCanvasProps> = ({ engine }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [showTouchHint, setShowTouchHint] = useState<boolean>(true);

  // Keyboard navigation & controls
  useEffect(() => {
    const keysDown: { [key: string]: boolean } = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      keysDown[e.key] = true;

      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        if (engine.state === 'playing') {
          engine.pauseGame();
        } else if (engine.state === 'paused') {
          engine.resumeGame();
        }
      }

      if (e.key === ' ' || e.key === 'Enter') {
        if (engine.state === 'menu') {
          engine.startGame();
        } else if (engine.state === 'gameover') {
          engine.restartGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown[e.key] = false;
    };

    const keyInterval = setInterval(() => {
      if (engine.state !== 'playing') return;
      const step = 14;
      if (keysDown['ArrowLeft'] || keysDown['a'] || keysDown['A']) {
        engine.nudgeHorizontal(-step);
        setShowTouchHint(false);
      }
      if (keysDown['ArrowRight'] || keysDown['d'] || keysDown['D']) {
        engine.nudgeHorizontal(step);
        setShowTouchHint(false);
      }
    }, 16);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      clearInterval(keyInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine]);

  // Canvas resize and render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const updateDimensions = () => {
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / engine.playWidth;
      const scaleY = containerHeight / engine.playHeight;
      const fitScale = Math.min(scaleX, scaleY);
      setScale(fitScale);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = engine.playWidth * dpr;
      canvas.height = engine.playHeight * dpr;
      canvas.style.width = `${engine.playWidth * fitScale}px`;
      canvas.style.height = `${engine.playHeight * fitScale}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      engine.update(dt);
      engine.render(ctx);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [engine]);

  // Robust touch / pointer drag mapping with window-level event tracking
  const isPointerDownRef = useRef(false);

  const getCanvasX = useCallback(
    (clientX: number): number => {
      const canvas = canvasRef.current;
      if (!canvas) return engine.playWidth / 2;
      const rect = canvas.getBoundingClientRect();
      const relativeX = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(engine.playWidth, relativeX * engine.playWidth));
    },
    [engine.playWidth]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    setShowTouchHint(false);
    const canvasX = getCanvasX(e.clientX);
    engine.setPointerTarget(canvasX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    const canvasX = getCanvasX(e.clientX);
    engine.setPointerTarget(canvasX);
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  useEffect(() => {
    const onWindowPointerMove = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      const canvasX = getCanvasX(e.clientX);
      engine.setPointerTarget(canvasX);
    };

    const onWindowPointerUp = () => {
      isPointerDownRef.current = false;
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [engine, getCanvasX]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none select-none bg-[#07020d]"
    >
      <div
        className="relative shadow-[0_0_50px_rgba(147,51,234,0.3)] rounded-2xl overflow-hidden border-2 border-purple-900/60"
        style={{
          width: `${engine.playWidth * scale}px`,
          height: `${engine.playHeight * scale}px`,
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cursor-pointer touch-none block"
        />

        {showTouchHint && engine.state === 'playing' && (
          <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none animate-pulse">
            <div className="flex items-center gap-2 bg-black/70 border border-cyan-400 text-cyan-200 text-xs px-4 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
              <ChevronLeft className="w-4 h-4 animate-ping" />
              <span>Arrastra con el dedo para mover a Chispa</span>
              <ChevronRight className="w-4 h-4 animate-ping" />
            </div>
          </div>
        )}

        {engine.state === 'playing' && (
          <div className="absolute inset-x-0 bottom-0 h-28 flex pointer-events-auto">
            <button
              onClick={() => {
                engine.nudgeHorizontal(-45);
                setShowTouchHint(false);
              }}
              aria-label="Mover a la izquierda"
              className="flex-1 opacity-0 active:opacity-10 bg-cyan-400 transition-opacity"
            />
            <button
              onClick={() => {
                engine.nudgeHorizontal(45);
                setShowTouchHint(false);
              }}
              aria-label="Mover a la derecha"
              className="flex-1 opacity-0 active:opacity-10 bg-pink-400 transition-opacity"
            />
          </div>
        )}
      </div>
    </div>
  );
};
