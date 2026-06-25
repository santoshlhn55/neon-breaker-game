// ============================================================
// DATA.TS — All game data: upgrades, heroes, relics
// ============================================================
import type { UpgradeDef, HeroDef, RelicDef } from './types';

// ---- UPGRADE DATABASE ----
export const ALL_UPGRADES: UpgradeDef[] = [
  // COMMON
  { id: 'ball_plus_1',     name: '+1 Ball',         description: 'Fire 1 additional ball per turn.',            rarity: 'Common',    icon: '⚪', maxStacks: 99 },
  { id: 'damage_plus_1',   name: '+1 Damage',       description: 'Each ball deals 1 extra damage.',             rarity: 'Common',    icon: '⚔️', maxStacks: 50 },
  { id: 'speed_up',        name: 'Ball Speed +15%',  description: 'Balls move 15% faster.',                     rarity: 'Common',    icon: '💨', maxStacks: 10 },
  { id: 'ball_size_up',    name: 'Ball Size Up',    description: 'Balls grow slightly larger, easier to hit.',   rarity: 'Common',    icon: '🔵', maxStacks: 5 },

  // RARE
  { id: 'ball_plus_3',     name: '+3 Balls',        description: 'Fire 3 additional balls per turn.',            rarity: 'Rare',      icon: '⚪', maxStacks: 30 },
  { id: 'critical_hit',    name: 'Critical Strike',  description: '15% chance to deal 3× damage on hit.',       rarity: 'Rare',      icon: '💥', maxStacks: 5 },
  { id: 'ricochet',        name: 'Ricochet Power',   description: 'Each bounce increases damage by 20%.',       rarity: 'Rare',      icon: '↩️', maxStacks: 5 },
  { id: 'poison_cloud',    name: 'Poison Cloud',     description: 'Hits leave a poison area dealing tick damage.', rarity: 'Rare',   icon: '☠️', maxStacks: 3, element: 'poison' },

  // EPIC
  { id: 'fire_aspect',     name: 'Fire Aspect',     description: 'Balls ignite bricks, dealing burn damage over time.', rarity: 'Epic', icon: '🔥', maxStacks: 3, element: 'fire' },
  { id: 'ice_aspect',      name: 'Ice Aspect',      description: 'Balls freeze bricks, preventing them from advancing.', rarity: 'Epic', icon: '❄️', maxStacks: 3, element: 'ice' },
  { id: 'split_ball',      name: 'Split Shot',      description: 'Balls split into 2 on first brick hit.',       rarity: 'Epic',     icon: '🔀', maxStacks: 3 },
  { id: 'drone',           name: 'Drone Support',   description: 'Deploy an autonomous drone that attacks bricks.', rarity: 'Epic',   icon: '🤖', maxStacks: 3 },
  { id: 'shield_pen',      name: 'Shield Breaker',  description: 'Ignore armor on armored bricks.',              rarity: 'Epic',     icon: '🛡️', maxStacks: 1 },

  // LEGENDARY
  { id: 'chain_lightning',  name: 'Chain Lightning', description: 'Hits chain lightning to 2 nearby bricks.',     rarity: 'Legendary', icon: '⚡', maxStacks: 3, element: 'lightning' },
  { id: 'black_hole',      name: 'Black Hole',      description: '10% chance destroying bricks creates a gravity well.', rarity: 'Legendary', icon: '🕳️', maxStacks: 3, element: 'void' },
  { id: 'time_slow',       name: 'Time Warp',       description: 'Balls move slower but deal 2× damage.',        rarity: 'Legendary', icon: '⏳', maxStacks: 1 },
  { id: 'explosive',       name: 'Explosive Impact', description: '20% chance hits explode in an area.',         rarity: 'Legendary', icon: '💣', maxStacks: 3 },
  { id: 'homing',          name: 'Homing Orbs',     description: 'Balls slightly curve toward nearest brick.',    rarity: 'Legendary', icon: '🎯', maxStacks: 3 },

  // MYTHIC
  { id: 'storm_god',       name: 'Storm God',       description: 'EVERY hit triggers chain lightning to 3 bricks.', rarity: 'Mythic', icon: '🌩️', maxStacks: 1, element: 'lightning' },
  { id: 'eternal_inferno', name: 'Eternal Inferno', description: 'Burn effects never expire and spread to neighbors.', rarity: 'Mythic', icon: '🌋', maxStacks: 1, element: 'fire' },
  { id: 'singularity',     name: 'Singularity Core', description: 'Destroying any brick creates a black hole.',  rarity: 'Mythic',   icon: '🌀', maxStacks: 1, element: 'void' },
  { id: 'quantum_split',   name: 'Quantum Splitter', description: 'Balls duplicate after every 3rd bounce.',     rarity: 'Mythic',   icon: '⚛️', maxStacks: 1 },
  { id: 'time_breaker',    name: 'Time Breaker',    description: 'Bricks don\'t advance for the next 3 waves.',   rarity: 'Mythic',   icon: '⏱️', maxStacks: 1 },
];

// ---- HERO DATABASE ----
export const ALL_HEROES: HeroDef[] = [
  {
    id: 'arc_mage',
    name: 'Arc Mage',
    title: 'Master of Lightning',
    description: 'Harnesses electrical storms to chain-destroy bricks.',
    color: '#aa00ff',
    icon: '⚡',
    ultimateName: 'Thunder Storm',
    ultimateDesc: 'Summons lightning bolts that strike every brick on screen.',
    ultimateChargeNeeded: 30,
    startingBalls: 1,
    startingDamage: 1,
    passive: '+10% lightning chain range',
    locked: false,
    unlockCost: 0,
  },
  {
    id: 'pyromancer',
    name: 'Pyromancer',
    title: 'Wielder of Flame',
    description: 'Sets the battlefield ablaze with devastating fire.',
    color: '#ff4400',
    icon: '🔥',
    ultimateName: 'Inferno Wave',
    ultimateDesc: 'Ignites ALL bricks on screen with intense burn damage.',
    ultimateChargeNeeded: 25,
    startingBalls: 1,
    startingDamage: 1,
    passive: 'Burn damage +25%',
    locked: false,
    unlockCost: 0,
  },
  {
    id: 'engineer',
    name: 'Engineer',
    title: 'Drone Commander',
    description: 'Deploys autonomous attack drones for extra firepower.',
    color: '#00cc88',
    icon: '🤖',
    ultimateName: 'Drone Swarm',
    ultimateDesc: 'Deploys 5 attack drones that rapid-fire at bricks.',
    ultimateChargeNeeded: 35,
    startingBalls: 2,
    startingDamage: 1,
    passive: 'Starts with 2 balls',
    locked: true,
    unlockCost: 500,
  },
  {
    id: 'void_walker',
    name: 'Void Walker',
    title: 'Bender of Space',
    description: 'Manipulates gravity and void energy to consume bricks.',
    color: '#6600cc',
    icon: '🌀',
    ultimateName: 'Singularity',
    ultimateDesc: 'Creates a massive black hole that pulls and destroys all bricks.',
    ultimateChargeNeeded: 40,
    startingBalls: 1,
    startingDamage: 2,
    passive: '+1 base damage',
    locked: true,
    unlockCost: 1000,
  },
  {
    id: 'ice_guardian',
    name: 'Ice Guardian',
    title: 'Frost Sovereign',
    description: 'Commands ice to freeze and shatter the battlefield.',
    color: '#00ccff',
    icon: '❄️',
    ultimateName: 'Absolute Zero',
    ultimateDesc: 'Freezes ALL bricks for 3 turns, preventing advancement.',
    ultimateChargeNeeded: 30,
    startingBalls: 1,
    startingDamage: 1,
    passive: 'Frozen bricks take 2× damage',
    locked: true,
    unlockCost: 750,
  },
];

// ---- RELIC DATABASE ----
export const ALL_RELICS: RelicDef[] = [
  { id: 'explosive_fifth',    name: 'Demolition Core',     description: 'Every 5th hit triggers an explosion.',         rarity: 'Rare',      icon: '💎' },
  { id: 'extra_projectile',   name: 'Phantom Orb',         description: '+2 extra balls at start of each wave.',        rarity: 'Epic',      icon: '👻' },
  { id: 'double_boss',        name: 'Trophy Hunter',       description: 'Double rewards from boss waves.',              rarity: 'Legendary', icon: '🏆' },
  { id: 'triple_coins',       name: 'Golden Touch',        description: '3× coin gain from all sources.',               rarity: 'Legendary', icon: '💰' },
  { id: 'permanent_crit',     name: 'Lucky Charm',         description: '+5% permanent critical hit chance.',            rarity: 'Epic',      icon: '🍀' },
  { id: 'element_convert',    name: 'Prismatic Lens',      description: 'All element damage is combined into one.',      rarity: 'Mythic',    icon: '🌈' },
  { id: 'vampire',            name: 'Vampire Fang',        description: 'Destroying bricks heals wave timer.',           rarity: 'Rare',      icon: '🧛' },
  { id: 'ball_magnet',        name: 'Gravity Well',        description: 'Balls are attracted to bricks slightly.',       rarity: 'Epic',      icon: '🧲' },
];

// ---- RARITY WEIGHTS for random selection ----
export const RARITY_WEIGHTS: Record<string, number> = {
  Common: 45,
  Rare: 28,
  Epic: 15,
  Legendary: 8,
  Mythic: 4,
};

// ---- RARITY COLORS ----
export const RARITY_COLORS: Record<string, string> = {
  Common: '#888888',
  Rare: '#0088ff',
  Epic: '#cc00ff',
  Legendary: '#ffaa00',
  Mythic: '#ff0066',
};

// ---- ELEMENT COLORS ----
export const ELEMENT_COLORS: Record<string, string> = {
  fire: '#ff4400',
  ice: '#00ccff',
  lightning: '#aa00ff',
  poison: '#00ff66',
  void: '#6600cc',
};
