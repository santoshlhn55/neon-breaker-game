import type { StageDef } from './types';

// Layout grids: 6 columns. 
// 0: empty, 1: normal, 2: armored, 3: explosive
const layoutV = [
  [1, 0, 0, 0, 0, 1],
  [0, 1, 0, 0, 1, 0],
  [0, 0, 1, 1, 0, 0],
];

const layoutPyramid = [
  [0, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1],
];

const layoutChecker = [
  [1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1],
];

const layoutWall = [
  [1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1],
];

const layoutSides = [
  [1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 1, 1],
  [1, 1, 0, 0, 1, 1],
];

const layoutStaggered = [
  [1, 1, 0, 1, 1, 0],
  [0, 1, 1, 0, 1, 1],
];

export const STAGES: StageDef[] = [
  {
    id: 'stage_1',
    name: 'Neon City',
    theme: {
      bgGradientInner: '#0f1423',
      bgGradientOuter: '#05050a',
      gridColor: '0, 240, 255',
      particleColor: '#00f0ff',
    },
    layoutPool: [layoutV, layoutChecker, [[1, 0, 0, 0, 0, 1]]],
    armoredChance: 0.05,
    explosiveChance: 0.05,
  },
  {
    id: 'stage_2',
    name: 'Toxic Sewers',
    theme: {
      bgGradientInner: '#1a2315',
      bgGradientOuter: '#050a05',
      gridColor: '50, 255, 100',
      particleColor: '#32ff64',
    },
    layoutPool: [layoutStaggered, layoutWall, layoutChecker, layoutSides],
    armoredChance: 0.15,
    explosiveChance: 0.1,
  },
  {
    id: 'stage_3',
    name: 'Cyber Core',
    theme: {
      bgGradientInner: '#230a15',
      bgGradientOuter: '#0a0005',
      gridColor: '255, 0, 100',
      particleColor: '#ff0066',
    },
    layoutPool: [layoutPyramid, layoutWall, layoutV, layoutSides],
    armoredChance: 0.2,
    explosiveChance: 0.15,
  },
  {
    id: 'stage_4',
    name: 'Void Depths',
    theme: {
      bgGradientInner: '#150a23',
      bgGradientOuter: '#05000a',
      gridColor: '150, 0, 255',
      particleColor: '#aa00ff',
    },
    layoutPool: [layoutWall, layoutWall, layoutChecker, layoutPyramid],
    armoredChance: 0.25,
    explosiveChance: 0.2,
  },
  {
    id: 'stage_5',
    name: 'Infernal Vault',
    theme: {
      bgGradientInner: '#331005',
      bgGradientOuter: '#0a0200',
      gridColor: '255, 80, 0',
      particleColor: '#ff6600',
    },
    layoutPool: [layoutWall, layoutPyramid, layoutSides, layoutStaggered],
    armoredChance: 0.3,
    explosiveChance: 0.3,
  }
];
