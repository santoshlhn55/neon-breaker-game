import { STAGES } from '../game/stages';

interface StageSelectScreenProps {
  highestStageUnlocked: number;
  onSelectStage: (stageIndex: number) => void;
  onBack: () => void;
}

export function StageSelectScreen({ highestStageUnlocked, onSelectStage, onBack }: StageSelectScreenProps) {
  return (
    <div className="select-container">
      <h1 className="screen-title">SELECT STAGE</h1>
      <p className="screen-subtitle">Choose your destination</p>
      
      <div className="select-grid">
        {STAGES.map((stage, index) => {
          const isUnlocked = index <= highestStageUnlocked;
          return (
            <button
              key={stage.id}
              className={`select-card ${isUnlocked ? '' : 'locked'}`}
              onClick={() => isUnlocked && onSelectStage(index)}
              style={{
                background: `linear-gradient(135deg, ${stage.theme.bgGradientInner}, ${stage.theme.bgGradientOuter})`,
                borderColor: `rgba(${stage.theme.gridColor}, 0.5)`,
                opacity: isUnlocked ? 1 : 0.5,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                textAlign: 'left'
              }}
            >
              <div className="select-icon" style={{ color: stage.theme.particleColor, fontSize: '1rem', fontWeight: 800 }}>
                {isUnlocked ? `Stage ${index + 1}` : '🔒'}
              </div>
              <div className="select-info">
                <h3 className="select-title" style={{ color: '#fff', marginBottom: 0 }}>{isUnlocked ? stage.name : 'Unknown Stage'}</h3>
              </div>
            </button>
          );
        })}
      </div>

      <div className="action-buttons">
        <button className="btn-secondary" onClick={onBack}>
          ← Back to Menu
        </button>
      </div>
    </div>
  );
}
