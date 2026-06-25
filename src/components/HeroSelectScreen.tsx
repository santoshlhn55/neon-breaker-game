import type { HeroDef, PlayerSave } from '../game/types';
import { ALL_HEROES } from '../game/data';
import './HeroSelectScreen.css';

interface HeroSelectScreenProps {
  save: PlayerSave;
  onSelectHero: (hero: HeroDef) => void;
  onUnlockHero: (hero: HeroDef) => void;
  onBack: () => void;
}

export function HeroSelectScreen({ save, onSelectHero, onUnlockHero, onBack }: HeroSelectScreenProps) {
  return (
    <div className="select-container">
      <h1 className="screen-title">SELECT HERO</h1>
      <p className="screen-subtitle">Choose your champion</p>

      <div className="hero-coins-display">
        🪙 {save.coins.toLocaleString()} Coins
      </div>

      <div className="select-grid">
        {ALL_HEROES.map(hero => {
          const isUnlocked = save.unlockedHeroes.includes(hero.id);
          const canAfford = save.coins >= hero.unlockCost;

          return (
            <button
              key={hero.id}
              className={`select-card hero-card ${!isUnlocked ? 'locked' : ''}`}
              onClick={() => isUnlocked ? onSelectHero(hero) : canAfford ? onUnlockHero(hero) : undefined}
              style={{
                borderColor: isUnlocked ? `${hero.color}44` : undefined,
                cursor: isUnlocked ? 'pointer' : canAfford ? 'pointer' : 'not-allowed',
              }}
            >
              <div className="select-icon" style={{ background: `${hero.color}22`, color: hero.color, borderColor: `${hero.color}44` }}>
                {hero.icon}
              </div>
              <div className="select-info">
                <h3 className="select-title" style={{ color: isUnlocked ? hero.color : '#666' }}>
                  {isUnlocked ? hero.name : '???'}
                </h3>
                <p className="select-desc">
                  {isUnlocked ? hero.title : 'Locked Hero'}
                </p>
                {isUnlocked ? (
                  <div className="hero-stats">
                    <span>⚔️ {hero.startingDamage} DMG</span>
                    <span>⚪ {hero.startingBalls} Ball{hero.startingBalls > 1 ? 's' : ''}</span>
                    <span>✨ {hero.ultimateChargeNeeded} Charge</span>
                  </div>
                ) : (
                  <div className="hero-unlock-info">
                    🪙 {hero.unlockCost} Coins {canAfford ? '— Tap to Unlock' : '— Not Enough'}
                  </div>
                )}
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
