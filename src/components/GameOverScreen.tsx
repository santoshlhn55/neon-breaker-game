import type { RunStats } from '../game/types';

interface GameOverScreenProps {
  stats: RunStats;
  wave: number;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ stats, wave, onRetry, onMenu }: GameOverScreenProps) {
  const xpEarned = wave * 10 + stats.bricksDestroyed * 2;
  const coinsEarned = Math.floor(stats.score / 10) + wave * 5;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1 className="screen-title" style={{ color: 'var(--mythic)', backgroundImage: 'none' }}>Run Complete</h1>
        <p className="screen-subtitle">Reached Wave {wave}</p>

        <div className="stat-grid">
          <div className="stat-box">
            <span className="stat-value">{stats.score.toLocaleString()}</span>
            <span className="stat-label">Score</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.bricksDestroyed}</span>
            <span className="stat-label">Bricks</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.upgradesCollected}</span>
            <span className="stat-label">Upgrades</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{Math.floor(stats.damageDealt).toLocaleString()}</span>
            <span className="stat-label">Damage</span>
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-box">
            <span className="stat-value" style={{ color: 'var(--legendary)' }}>+{xpEarned}</span>
            <span className="stat-label">XP ⭐</span>
          </div>
          <div className="stat-box">
            <span className="stat-value" style={{ color: 'var(--legendary)' }}>+{coinsEarned}</span>
            <span className="stat-label">Coins 🪙</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-primary" onClick={onRetry}>Play Again</button>
          <button className="btn-secondary" onClick={onMenu}>Menu</button>
        </div>
      </div>
    </div>
  );
}
