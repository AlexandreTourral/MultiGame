import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { PixiApp } from '../game/PixiApp';
import { HUD } from './HUD';

export function GameBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiRef = useRef<PixiApp | null>(null);
  const { gameState, playerId } = useGameStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const pixi = new PixiApp();
    pixiRef.current = pixi;
    let cancelled = false;

    pixi.init(containerRef.current).then(() => {
      if (cancelled) return;
      if (gameState && playerId) {
        pixi.updateState(gameState, playerId);
      }
    });

    return () => {
      cancelled = true;
      pixi.destroy();
      pixiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gameState && playerId && pixiRef.current) {
      pixiRef.current.updateState(gameState, playerId);
    }
  }, [gameState, playerId]);

  return (
    <div className="game-board-wrapper">
      <HUD />
      <div ref={containerRef} className="pixi-container" />
    </div>
  );
}
