import type { UpgradeDef } from '../game/types';
import './UpgradeModal.css';

interface UpgradeModalProps {
  options: UpgradeDef[];
  onSelect: (upgrade: UpgradeDef) => void;
}

export function UpgradeModal({ options, onSelect }: UpgradeModalProps) {
  return (
    <div className="upgrade-overlay">
      <div className="upgrade-header">
        <h2>Choose an Upgrade</h2>
        <p>Select your path to power</p>
      </div>

      <div className="upgrade-cards">
        {options.map(upgrade => (
          <div
            key={upgrade.id}
            className={`upgrade-card rarity-${upgrade.rarity}`}
            onClick={() => onSelect(upgrade)}
          >
            <div className="upgrade-icon">{upgrade.icon}</div>
            <div className="upgrade-rarity-badge">{upgrade.rarity}</div>
            <div className="upgrade-name">{upgrade.name}</div>
            <div className="upgrade-desc">{upgrade.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
