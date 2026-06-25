import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '../game/Game';
import type { HeroDef, RunStats, UpgradeDef } from '../game/types';
import { GameOverScreen } from './GameOverScreen';
import { StageCompleteScreen } from './StageCompleteScreen';
import { UpgradeModal } from './UpgradeModal';

interface GameCanvasProps {
  hero: HeroDef;
  startStageIndex: number;
  onExit: () => void;
  onShowStages: () => void;
  onStageComplete: (stageIndex: number) => void;
  onRunEnd: (stats: RunStats, wave: number) => void;
}

export function GameCanvas({ hero, startStageIndex, onExit, onShowStages, onStageComplete, onRunEnd }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [gameOverStats, setGameOverStats] = useState<RunStats | null>(null);
  const [wave, setWave] = useState(startStageIndex * 10 + 1);
  const [score, setScore] = useState(0);
  const [totalBalls, setTotalBalls] = useState(1);
  const [ultProgress, setUltProgress] = useState(0);
  const [ultReady, setUltReady] = useState(false);
  const [activeUpgrades, setActiveUpgrades] = useState<Array<{ name: string; stacks: number; icon: string }>>([]);
  const [pendingUpgrades, setPendingUpgrades] = useState<UpgradeDef[] | null>(null);
  const [stageComplete, setStageComplete] = useState<{ stats: RunStats, stageIndex: number } | null>(null);

  // Update UI state from game engine (polled via interval)
  const syncUI = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    setWave(g.wave);
    setScore(g.score);
    setTotalBalls(g.totalBalls);
    setUltProgress(g.getUltimateProgress());
    setActiveUpgrades(g.getActiveUpgradesList());
  }, []);

  // Shared wave clear logic — used by both initial game and retry
  const handleWaveClearLogic = useCallback((g: Game) => {
    if (g.wave % 10 === 0 && g.bricks.length === 0) {
      // Stage complete (boss defeated)
      setStageComplete({ stats: g.stats, stageIndex: g.currentStageIndex });
      onStageComplete(g.currentStageIndex);
    } else {
      // Show upgrade selection modal with 3 choices
      const options = g.getRandomUpgrades(3);
      if (options.length > 0) {
        setPendingUpgrades(options);
      } else {
        g.resumeAfterUpgrade();
      }
    }
    syncUI();
  }, [onStageComplete, syncUI]);

  const handleUpgradeSelect = useCallback((upgrade: UpgradeDef) => {
    const g = gameRef.current;
    if (!g) return;
    g.applyUpgrade(upgrade);
    setPendingUpgrades(null);
    g.resumeAfterUpgrade();
    syncUI();
  }, [syncUI]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleGameOver = (stats: RunStats) => {
      setGameOverStats(stats);
      onRunEnd(stats, gameRef.current?.wave ?? 0);
      syncUI();
    };

    const handleUltimateReady = () => {
      setUltReady(true);
    };

    const game = new Game(canvas, hero, startStageIndex * 10 + 1, () => {
      handleWaveClearLogic(game);
    }, handleGameOver, handleUltimateReady);
    gameRef.current = game;
    game.start();

    // Resize handler
    const onResize = () => game.resize();
    window.addEventListener('resize', onResize);

    // UI sync interval
    const uiInterval = setInterval(syncUI, 200);

    return () => {
      game.stop();
      window.removeEventListener('resize', onResize);
      clearInterval(uiInterval);
    };
  }, [hero, startStageIndex, syncUI, handleWaveClearLogic, onRunEnd]);

  // Pointer events
  const handlePointerDown = (e: React.PointerEvent) => {
    gameRef.current?.handlePointerDown(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    gameRef.current?.handlePointerMove(e.clientX, e.clientY);
  };
  const handlePointerUp = () => {
    gameRef.current?.handlePointerUp();
  };

  // Ultimate
  const handleUltimate = () => {
    const g = gameRef.current;
    if (!g || !ultReady) return;
    g.triggerUltimate();
    setUltReady(false);
    syncUI();
  };

  // Game over actions
  const handleRetry = () => {
    setGameOverStats(null);
    setUltReady(false);
    setPendingUpgrades(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = gameRef.current;
    if (g) g.stop();

    const newGame = new Game(
      canvas, hero, startStageIndex * 10 + 1,
      () => handleWaveClearLogic(newGame),
      (stats: RunStats) => {
        setGameOverStats(stats);
        onRunEnd(stats, newGame.wave);
        syncUI();
      },
      () => { setUltReady(true); }
    );
    gameRef.current = newGame;
    newGame.start();
    syncUI();
  };

  const canvasStyle: React.CSSProperties = {
    display: 'block',
    touchAction: 'none',
  };

  return (
    <div className="game-screen">
      {/* HUD */}
      <div className="hud" style={{ width: canvasRef.current?.style.width || '100%' }}>
        <div className="hud-left">
          <div className="hud-wave">Wave {wave}</div>
          <div className="hud-balls">{totalBalls} balls</div>
        </div>
        <div className="hud-right">
          <div className="hud-score">{score.toLocaleString()}</div>
          <div className="hud-hero">{hero.icon} {hero.name}</div>
        </div>
      </div>

      {/* Active upgrades */}
      {activeUpgrades.length > 0 && (
        <div className="active-upgrades" style={{ width: canvasRef.current?.style.width || '100%' }}>
          {activeUpgrades.map(u => (
            <span key={u.name} className="active-upgrade-pip">
              {u.icon} {u.stacks > 1 ? `×${u.stacks}` : ''}
            </span>
          ))}
        </div>
      )}

      {/* Ultimate button */}
      <button
        className={`ultimate-btn ${ultReady ? 'ready' : ''}`}
        onClick={handleUltimate}
        style={{ opacity: ultProgress > 0 ? 1 : 0.3 }}
      >
        {hero.icon}
      </button>
      <div className="ultimate-bar">
        <div
          className="ultimate-bar-fill"
          style={{
            width: `${ultProgress * 100}%`,
            background: ultReady
              ? `linear-gradient(90deg, ${hero.color}, var(--legendary))`
              : hero.color,
          }}
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* Upgrade Selection Modal */}
      {pendingUpgrades && (
        <UpgradeModal
          options={pendingUpgrades}
          onSelect={handleUpgradeSelect}
        />
      )}

      {/* Stage Complete */}
      {stageComplete && (
        <StageCompleteScreen
          stats={stageComplete.stats}
          stageNumber={stageComplete.stageIndex + 1}
          onNextStage={() => {
            setStageComplete(null);
            gameRef.current?.resumeAfterUpgrade();
            syncUI();
          }}
          onStagesList={onShowStages}
          onMenu={onExit}
        />
      )}

      {/* Game Over */}
      {gameOverStats && (
        <GameOverScreen
          stats={gameOverStats}
          wave={wave}
          onRetry={handleRetry}
          onMenu={onExit}
        />
      )}
    </div>
  );
}
