import { useState, useEffect } from 'react';
import type { HeroDef, PlayerSave, RunStats } from './game/types';
import { GameCanvas } from './components/GameCanvas';
import { StageSelectScreen } from './components/StageSelectScreen';
import { HeroSelectScreen } from './components/HeroSelectScreen';
import { ALL_HEROES } from './game/data';
import './App.css';

type Screen = 'menu' | 'hero_select' | 'stage_select' | 'playing';

const DEFAULT_SAVE: PlayerSave = {
  xp: 0,
  level: 1,
  coins: 0,
  unlockedHeroes: ['arc_mage', 'pyromancer'],
  totalRuns: 0,
  bestWave: 0,
  bestScore: 0,
  highestStageUnlocked: 0,
};

function loadSave(): PlayerSave {
  try {
    const raw = localStorage.getItem('neon_breaker_save');
    if (raw) return JSON.parse(raw) as PlayerSave;
  } catch { /* ignore */ }
  return { ...DEFAULT_SAVE };
}

function saveSave(save: PlayerSave) {
  localStorage.setItem('neon_breaker_save', JSON.stringify(save));
}

function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [save, setSave] = useState<PlayerSave>(loadSave);
  const [selectedHero, setSelectedHero] = useState<HeroDef | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);

  useEffect(() => {
    saveSave(save);
  }, [save]);

  // ---- Run end: update meta-progression ----
  const handleRunEnd = (stats: RunStats, wave: number) => {
    setSave(prev => {
      const updated = { ...prev };

      // XP & Level
      const xpEarned = wave * 10 + stats.bricksDestroyed * 2;
      updated.xp += xpEarned;
      while (updated.xp >= xpForLevel(updated.level)) {
        updated.xp -= xpForLevel(updated.level);
        updated.level++;
      }

      // Coins
      const coinsEarned = Math.floor(stats.score / 10) + wave * 5;
      updated.coins += coinsEarned;

      // Best records
      updated.bestWave = Math.max(updated.bestWave, wave);
      updated.bestScore = Math.max(updated.bestScore, stats.score);

      return updated;
    });
  };

  const handleStartRun = () => {
    setSave(prev => ({ ...prev, totalRuns: prev.totalRuns + 1 }));
    setScreen('hero_select');
  };

  const handleHeroSelect = (hero: HeroDef) => {
    setSelectedHero(hero);
    setSelectedStageIndex(save.highestStageUnlocked);
    setSave(prev => ({ ...prev, totalRuns: prev.totalRuns + 1 }));
    setScreen('playing');
  };

  const handleUnlockHero = (hero: HeroDef) => {
    setSave(prev => {
      if (prev.coins < hero.unlockCost) return prev;
      return {
        ...prev,
        coins: prev.coins - hero.unlockCost,
        unlockedHeroes: [...prev.unlockedHeroes, hero.id],
      };
    });
  };

  const handleOpenStages = () => {
    setScreen('stage_select');
  };

  const handleStageSelect = (stageIndex: number) => {
    setSelectedHero(ALL_HEROES[0]); // Use default hero when launching from stage select
    setSelectedStageIndex(stageIndex);
    setSave(prev => ({ ...prev, totalRuns: prev.totalRuns + 1 }));
    setScreen('playing');
  };

  const handleExitToMenu = () => {
    setSelectedHero(null);
    setScreen('menu');
  };

  const handleStageComplete = (stageIndex: number) => {
    setSave(prev => ({
      ...prev,
      highestStageUnlocked: Math.max(prev.highestStageUnlocked, stageIndex + 1),
    }));
  };

  const nextLevelXp = xpForLevel(save.level);

  return (
    <div className="app">
      {screen === 'menu' && (
        <div className="main-menu">
          <h1 className="screen-title">
            Neon Breaker
          </h1>
          <p className="screen-subtitle">Roguelite Brick Breaking</p>

          <div className="main-menu-stats">
            <span>
              <span className="stat-value">{save.bestWave}</span>
              Best Wave
            </span>
            <span>
              <span className="stat-value">{save.bestScore.toLocaleString()}</span>
              Best Score
            </span>
            <span>
              <span className="stat-value">{save.totalRuns}</span>
              Runs
            </span>
          </div>

          {/* Player level & coins */}
          <div className="main-menu-player-info">
            <span className="level-badge">Lv. {save.level}</span>
            <span className="xp-bar-text">{save.xp} / {nextLevelXp} XP</span>
            <span className="coins-display">🪙 {save.coins.toLocaleString()}</span>
          </div>

          <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '250px' }}>
            <button className="btn-primary" style={{ width: '100%' }} onClick={handleStartRun}>
              Start Run
            </button>
            <button className="btn-secondary" style={{ width: '100%' }} onClick={handleOpenStages}>
              Stages
            </button>
          </div>
        </div>
      )}

      {screen === 'hero_select' && (
        <HeroSelectScreen
          save={save}
          onSelectHero={handleHeroSelect}
          onUnlockHero={handleUnlockHero}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'stage_select' && (
        <StageSelectScreen
          highestStageUnlocked={save.highestStageUnlocked}
          onSelectStage={handleStageSelect}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'playing' && selectedHero && (
        <GameCanvas
          hero={selectedHero}
          startStageIndex={selectedStageIndex}
          onExit={handleExitToMenu}
          onShowStages={() => setScreen('stage_select')}
          onStageComplete={handleStageComplete}
          onRunEnd={handleRunEnd}
        />
      )}
    </div>
  );
}

export default App;
