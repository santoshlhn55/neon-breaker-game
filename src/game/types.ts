// ============================================================
// TYPES.TS — All type definitions for Neon Breaker
// ============================================================

export type GamePhase = 'AIMING' | 'SHOOTING' | 'WAVE_CLEAR' | 'GAME_OVER';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
export type Element = 'fire' | 'ice' | 'lightning' | 'poison' | 'void';

// ---- Stage Definitions ----
export interface StageTheme {
  bgGradientInner: string;
  bgGradientOuter: string;
  gridColor: string;
  particleColor: string;
}

export interface StageDef {
  id: string;
  name: string;
  theme: StageTheme;
  layoutPool: number[][][]; // 2D array of brick type IDs (0: empty, 1: normal, 2: armored, 3: explosive)
  armoredChance: number;
  explosiveChance: number;
}

// ---- Upgrade Definitions ----
export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: string;       // emoji icon
  maxStacks: number;
  element?: Element;
}

// ---- Hero Definitions ----
export interface HeroDef {
  id: string;
  name: string;
  title: string;
  description: string;
  color: string;
  icon: string;
  ultimateName: string;
  ultimateDesc: string;
  ultimateChargeNeeded: number;
  startingBalls: number;
  startingDamage: number;
  passive: string;
  locked: boolean;
  unlockCost: number;
}

// ---- Relic Definitions ----
export interface RelicDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  icon: string;
}

// ---- Runtime entities ----
export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  active: boolean;
  returned: boolean;
  elements: Set<Element>;
  bounceCount: number;
  hitCount: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
  splitUsed: boolean;
  homingStrength: number;
}

export interface BrickState {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  active: boolean;
  row: number;
  col: number;
  color: string;
  type: 'normal' | 'armored' | 'explosive' | 'boss';
  // Status effects
  burnTicks: number;
  freezeTurns: number;
  poisonTicks: number;
  // Visual
  hitFlash: number;
  deathTimer: number;
  spawnScale: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'circle' | 'spark' | 'shard' | 'ring' | 'ember' | 'snowflake' | 'bubble' | 'shockwave' | 'text' | 'streak';
  rotation?: number;
  angularVel?: number;
  sizeDecay?: number;
  text?: string;
}

export interface DroneState {
  x: number;
  y: number;
  angle: number;
  fireTimer: number;
  targetBrick: number; // index
}

export interface BlackHoleState {
  x: number;
  y: number;
  life: number;
  radius: number;
  strength: number;
}

// ---- Meta progression ----
export interface PlayerSave {
  xp: number;
  level: number;
  coins: number;
  unlockedHeroes: string[];
  totalRuns: number;
  bestWave: number;
  bestScore: number;
  highestStageUnlocked: number;
}

// ---- Run state ----
export interface RunStats {
  wavesCleared: number;
  bricksDestroyed: number;
  upgradesCollected: number;
  relicsFound: number;
  damageDealt: number;
  score: number;
}
