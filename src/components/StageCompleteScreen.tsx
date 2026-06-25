import type { RunStats } from '../game/types';

interface StageCompleteScreenProps {
  stats: RunStats;
  stageNumber: number;
  onNextStage: () => void;
  onStagesList: () => void;
  onMenu: () => void;
}

export function StageCompleteScreen({ stats, stageNumber, onNextStage, onStagesList, onMenu }: StageCompleteScreenProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="screen-title" style={{ fontSize: '2.5rem', textShadow: '0 0 20px rgba(0, 240, 255, 0.4)' }}>STAGE {stageNumber} COMPLETE!</h2>
        <p className="screen-subtitle" style={{ marginBottom: '2rem' }}>Victory Achieved</p>
        
        <div className="stat-grid">
          <div className="stat-box">
            <span className="stat-value">{stats.score.toLocaleString()}</span>
            <span className="stat-label">Score</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{stats.bricksDestroyed.toLocaleString()}</span>
            <span className="stat-label">Bricks</span>
          </div>
          <div className="stat-box">
            <span className="stat-value">{Math.floor(stats.damageDealt).toLocaleString()}</span>
            <span className="stat-label">Damage</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-primary" onClick={onNextStage}>
            Next Stage ➔
          </button>
          <button className="btn-secondary" onClick={onStagesList}>
            Stages List
          </button>
          <button className="btn-secondary" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
