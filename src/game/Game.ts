// ============================================================
// GAME.TS — Complete Neon Breaker Game Engine
// ============================================================
import type { GamePhase, BallState, BrickState, Particle, DroneState, BlackHoleState, UpgradeDef, HeroDef, RelicDef, RunStats, Element } from './types';
import { ALL_UPGRADES, ALL_RELICS, RARITY_WEIGHTS, ELEMENT_COLORS } from './data';
import { STAGES } from './stages';

// ---- Constants ----
const GAME_W = 420;
const GAME_H = 740;
const COLS = 6;
const BRICK_PAD = 4;
const BRICK_H = 38;
const TOP_OFFSET = 80; // space for HUD
const BOTTOM_ZONE = 60; // launch zone
const DANGER_Y = GAME_H - BOTTOM_ZONE - 20;
const BALL_BASE_SPEED = 12;
const BALL_BASE_RADIUS = 5;
const LAUNCH_Y = GAME_H - 30;

function brickW(): number {
  return (GAME_W - (COLS + 1) * BRICK_PAD) / COLS;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ---- Brick color based on HP ratio ----
function brickColor(hp: number, maxHp: number, type: string): string {
  if (type === 'boss') return '#ff0066';
  if (type === 'armored') return '#4488aa';
  if (type === 'explosive') return '#ff6600';
  const ratio = hp / maxHp;
  const hue = lerp(0, 200, ratio);
  return `hsl(${hue}, 70%, ${lerp(40, 65, ratio)}%)`;
}

// ============================================================
// MAIN GAME CLASS
// ============================================================
export class Game {
  // Canvas
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scale: number = 1;
  offsetX: number = 0;
  offsetY: number = 0;

  // Game state
  phase: GamePhase = 'AIMING';
  wave: number = 0;
  score: number = 0;
  combo: number = 0;

  // Entities
  balls: BallState[] = [];
  bricks: BrickState[] = [];
  particles: Particle[] = [];
  drones: DroneState[] = [];
  blackHoles: BlackHoleState[] = [];

  // Player stats (modified by upgrades)
  totalBalls: number = 1;
  ballDamage: number = 1;
  ballSpeedMult: number = 1;
  ballRadiusBonus: number = 0;
  critChance: number = 0;
  ricochetBonus: number = 0;
  splitCount: number = 0;
  explosionChance: number = 0;
  homingStrength: number = 0;
  chainLightningTargets: number = 0;
  blackHoleChance: number = 0;
  shieldPen: boolean = false;
  timeSlowActive: boolean = false;
  timeBreakerWaves: number = 0;
  quantumSplitActive: boolean = false;
  eternalInferno: boolean = false;
  singularityActive: boolean = false;
  stormGodActive: boolean = false;

  // Upgrades tracking
  upgrades: Map<string, number> = new Map();
  elements: Set<Element> = new Set();

  // Hero
  hero: HeroDef;
  ultimateCharge: number = 0;
  ultimateActive: boolean = false;

  // Relics
  relics: RelicDef[] = [];
  totalHitCount: number = 0;

  // Aim
  launchX: number = GAME_W / 2;
  aimX: number = 0;
  aimY: number = 0;
  isAiming: boolean = false;

  // Ball launch
  returnedCount: number = 0;
  launchTimer: number = 0;
  launchIndex: number = 0;
  launching: boolean = false;
  firstReturnX: number = GAME_W / 2;

  // Camera shake
  shakeX: number = 0;
  shakeY: number = 0;
  shakeIntensity: number = 0;

  // Run stats
  stats: RunStats = { wavesCleared: 0, bricksDestroyed: 0, upgradesCollected: 0, relicsFound: 0, damageDealt: 0, score: 0 };

  // Callbacks
  onWaveClear: () => void;
  onGameOver: (stats: RunStats) => void;
  onUltimateReady: () => void;

  // Animation
  animFrame: number = 0;
  lastTime: number = 0;
  running: boolean = false;
  gridFlashTimer: number = 0;
  frameCount: number = 0;
  ambientParticles: Particle[] = [];
  screenFlash: number = 0;
  stageTransitionTextTimer: number = 0;
  currentStageIndex: number = 0;

  constructor(
    canvas: HTMLCanvasElement,
    hero: HeroDef,
    startWave: number,
    onWaveClear: () => void,
    onGameOver: (stats: RunStats) => void,
    onUltimateReady: () => void,
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    this.ctx = ctx;
    this.hero = hero;
    this.wave = startWave - 1; // nextWave() will increment this back to startWave
    this.onWaveClear = onWaveClear;
    this.onGameOver = onGameOver;
    this.onUltimateReady = onUltimateReady;

    // Apply hero starting stats
    this.totalBalls = hero.startingBalls;
    this.ballDamage = hero.startingDamage;

    this.resize();
    
    // Initialize ambient particles with stage color
    this.initAmbientParticles();
    
    this.nextWave();
  }

  initAmbientParticles() {
    const stage = STAGES[this.currentStageIndex];
    if (!stage) return;
    const c = stage.theme.particleColor;
    this.ambientParticles = [];
    for (let i = 0; i < 20; i++) {
      this.ambientParticles.push({
        x: Math.random() * GAME_W,
        y: Math.random() * GAME_H,
        vx: randRange(-0.3, 0.3),
        vy: randRange(0.2, 0.8),
        life: 1,
        maxLife: 1,
        color: `rgba(${this.hexToRgb(c)}, 0.15)`,
        size: randRange(1, 2.5),
        type: 'circle',
      });
    }
  }

  updateAmbientParticles() {
    const stage = STAGES[this.currentStageIndex];
    if (!stage) return;
    const c = stage.theme.particleColor;
    for (const p of this.ambientParticles) {
      p.color = `rgba(${this.hexToRgb(c)}, 0.15)`;
    }
  }

  hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 240, 255';
  }

  // ---- RESIZE ----
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gameAspect = GAME_W / GAME_H;
    const screenAspect = vw / vh;

    let drawW: number, drawH: number;
    if (screenAspect < gameAspect) {
      drawW = vw;
      drawH = vw / gameAspect;
    } else {
      drawH = vh;
      drawW = vh * gameAspect;
    }

    this.canvas.style.width = drawW + 'px';
    this.canvas.style.height = drawH + 'px';
    this.canvas.width = drawW * dpr;
    this.canvas.height = drawH * dpr;
    this.scale = (drawW * dpr) / GAME_W;
    this.offsetX = (vw - drawW) / 2;
    this.offsetY = (vh - drawH) / 2;
  }

  // ---- COORDINATE TRANSFORM ----
  screenToGame(sx: number, sy: number): { x: number; y: number } {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const cx = (sx - rect.left) * dpr;
    const cy = (sy - rect.top) * dpr;
    return { x: cx / this.scale, y: cy / this.scale };
  }

  // ---- START / STOP ----
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }

  tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(now - this.lastTime, 33); // cap at ~30fps minimum
    this.lastTime = now;
    this.update(dt);
    this.draw();
    this.animFrame = requestAnimationFrame(this.tick);
  };

  // ============================================================
  // INPUT HANDLING
  // ============================================================
  handlePointerDown(sx: number, sy: number) {
    if (this.phase !== 'AIMING') return;
    const p = this.screenToGame(sx, sy);
    this.isAiming = true;
    this.aimX = p.x;
    this.aimY = p.y;
  }

  handlePointerMove(sx: number, sy: number) {
    if (!this.isAiming) return;
    const p = this.screenToGame(sx, sy);
    this.aimX = p.x;
    this.aimY = p.y;
  }

  handlePointerUp() {
    if (!this.isAiming || this.phase !== 'AIMING') {
      this.isAiming = false;
      return;
    }
    this.isAiming = false;

    const dx = this.aimX - this.launchX;
    const dy = this.aimY - LAUNCH_Y;
    if (dy > -20) return; // must aim upward

    const mag = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / mag;
    const ny = dy / mag;

    this.fireBalls(nx, ny);
  }

  // ============================================================
  // WAVE GENERATION
  // ============================================================
  nextWave() {
    // If we are currently on a boss wave, don't advance until all bricks (including boss) are dead
    const isBossWave = this.wave > 0 && this.wave % 10 === 0;
    const hasBricks = this.bricks.length > 0;
    
    if (isBossWave && hasBricks) {
      // Stay on boss wave. Just move them down.
    } else {
      this.wave++;
    }
    
    const prevStageIndex = this.currentStageIndex;
    this.currentStageIndex = Math.floor((this.wave - 1) / 10) % STAGES.length;

    if (this.currentStageIndex !== prevStageIndex) {
      this.stageTransitionTextTimer = 3; // Show for 3 seconds
      this.updateAmbientParticles();
    }

    const currentStage = STAGES[this.currentStageIndex];

    // Move existing bricks down (unless Time Breaker active)
    if (this.timeBreakerWaves <= 0) {
      for (const b of this.bricks) {
        b.y += BRICK_H + BRICK_PAD;
        b.row++;
        // Check danger zone
        if (b.y + b.h > DANGER_Y && b.active) {
          this.phase = 'GAME_OVER';
          this.stats.score = this.score;
          this.onGameOver(this.stats);
          return;
        }
      }
    } else {
      this.timeBreakerWaves--;
    }

    // Apply burn ticks and poison ticks between waves
    for (const b of this.bricks) {
      if (b.burnTicks > 0) {
        b.hp -= b.burnTicks;
        if (!this.eternalInferno) b.burnTicks--;
        if (b.hp <= 0) { b.hp = 0; b.active = false; this.onBrickDestroyed(b); }
      }
      if (b.poisonTicks > 0) {
        b.hp -= 1;
        b.poisonTicks--;
        if (b.hp <= 0) { b.hp = 0; b.active = false; this.onBrickDestroyed(b); }
      }
      if (b.freezeTurns > 0) b.freezeTurns--;
    }
    this.bricks = this.bricks.filter(b => b.active);

    // Boss wave every 10
    const isBoss = this.wave % 10 === 0;
    const bossDefeated = isBoss && this.bricks.every(b => !b.active);
    const w = brickW();

    // Award relic on boss wave defeat
    if (bossDefeated) {
      const available = ALL_RELICS.filter(r => !this.relics.find(existing => existing.id === r.id));
      if (available.length > 0) {
        const relic = available[Math.floor(Math.random() * available.length)];
        this.addRelic(relic);
        this.particles.push({
          x: GAME_W / 2, y: GAME_H / 2,
          vx: 0, vy: -0.5, life: 2, maxLife: 2,
          color: '#ffaa00', size: 24, type: 'text',
          text: `${relic.icon} ${relic.name}`
        });
      }
    }

    if (isBoss && !bossDefeated) {
      // Single boss brick spanning middle
      const bossHp = this.wave * 10;
      const bossW = w * 3 + BRICK_PAD * 2;
      const bossX = GAME_W / 2 - bossW / 2;
      this.bricks.push({
        x: bossX, y: TOP_OFFSET, w: bossW, h: BRICK_H * 2,
        hp: bossHp, maxHp: bossHp, active: true, row: 0, col: 3,
        color: '#ff0066', type: 'boss',
        burnTicks: 0, freezeTurns: 0, poisonTicks: 0,
        hitFlash: 0, deathTimer: 0, spawnScale: 0,
      });
    } else {
      // Use a layout from the stage pool
      const layout = currentStage.layoutPool[Math.floor(Math.random() * currentStage.layoutPool.length)];
      
      for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = layout[r][c];
          if (!cell || cell === 0) continue;
          
          let type: BrickState['type'] = 'normal';
          if (cell === 2 || (cell === 1 && Math.random() < currentStage.armoredChance)) type = 'armored';
          if (cell === 3 || (cell === 1 && Math.random() < currentStage.explosiveChance)) type = 'explosive';
          
          const hpMultiplier = cell === 2 ? 1.5 : cell === 3 ? 0.8 : 1;
          const baseHp = Math.max(1, Math.floor(this.wave * (0.5 + Math.random() * 0.5) * hpMultiplier));
          
          const bx = BRICK_PAD + c * (w + BRICK_PAD);
          const by = TOP_OFFSET - (layout.length - 1 - r) * (BRICK_H + BRICK_PAD); // Spawn multi-row properly above top
          
          this.bricks.push({
            x: bx, y: by, w, h: BRICK_H,
            hp: baseHp, maxHp: baseHp, active: true, row: -r, col: c,
            color: brickColor(baseHp, baseHp, type), type,
            burnTicks: 0, freezeTurns: 0, poisonTicks: 0,
            hitFlash: 0, deathTimer: 0, spawnScale: 0,
          });
        }
      }
    }

    this.stats.wavesCleared = this.wave;
    this.gridFlashTimer = 0.3;
  }

  // ============================================================
  // FIRE BALLS
  // ============================================================
  fireBalls(nx: number, ny: number) {
    this.phase = 'SHOOTING';
    this.returnedCount = 0;
    this.launchIndex = 0;
    this.launchTimer = 0;
    this.launching = true;
    this.balls = [];
    this.firstReturnX = this.launchX;

    const speed = BALL_BASE_SPEED * this.ballSpeedMult * (this.timeSlowActive ? 0.5 : 1);
    const dmgMult = this.timeSlowActive ? 2 : 1;

    // Store launch params for staggered launch
    const totalToLaunch = this.totalBalls;
    const _launch = () => {
      if (this.launchIndex >= totalToLaunch) {
        this.launching = false;
        return;
      }
      const ball: BallState = {
        x: this.launchX,
        y: LAUNCH_Y,
        vx: nx * speed,
        vy: ny * speed,
        radius: BALL_BASE_RADIUS + this.ballRadiusBonus,
        damage: this.ballDamage * dmgMult,
        active: true,
        returned: false,
        elements: new Set(this.elements),
        bounceCount: 0,
        hitCount: 0,
        trail: [],
        splitUsed: false,
        homingStrength: this.homingStrength,
      };
      this.balls.push(ball);
      this.launchIndex++;
    };

    // Launch first ball immediately
    _launch();

    // Store the launch function and params for staggered launching in update
    (this as Record<string, unknown>)._launchFn = _launch;
    (this as Record<string, unknown>)._totalToLaunch = totalToLaunch;
  }

  // ============================================================
  // UPDATE
  // ============================================================
  update(dtMs: number) {
    this.frameCount++;
    const dt = dtMs / 16.67; // normalize to 60fps steps

    // Screen flash decay
    if (this.screenFlash > 0) {
      this.screenFlash -= dtMs / 1000 * 3; // fades in ~0.33s
      if (this.screenFlash < 0) this.screenFlash = 0;
    }

    // Camera shake decay (sine wave)
    if (this.shakeIntensity > 0) {
      this.shakeX = Math.sin(this.frameCount * 0.8) * this.shakeIntensity;
      this.shakeY = Math.cos(this.frameCount * 0.6) * this.shakeIntensity;
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.3) { this.shakeIntensity = 0; this.shakeX = 0; this.shakeY = 0; }
    }

    // Grid flash decay
    if (this.gridFlashTimer > 0) this.gridFlashTimer -= dtMs / 1000;

    // Stage transition text fade
    if (this.stageTransitionTextTimer > 0) this.stageTransitionTextTimer -= dtMs / 1000;

    // Update ambient particles
    for (const p of this.ambientParticles) {
      p.y += p.vy * dt;
      if (p.y < -20) p.y = GAME_H + 20;
    }

    // Update bricks spawn animation
    for (const b of this.bricks) {
      if (b.spawnScale !== undefined && b.spawnScale < 1) {
        b.spawnScale += 0.05 * dt;
        if (b.spawnScale > 1) b.spawnScale = 1;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Gravity / drag based on type
      if (p.type === 'text') {
        p.vy *= Math.pow(0.9, dt); // text floats up and slows down
      } else if (p.type === 'bubble' || p.type === 'ember') {
        p.vy -= 0.02 * dt; // bubbles/embers float up
        p.vx += (Math.random() - 0.5) * 0.5 * dt; // flutter
      } else if (p.type === 'snowflake') {
        p.vy += 0.02 * dt; // slow fall
        p.vx = Math.sin(this.frameCount * 0.1 + p.life) * 1.0; // sway
      } else if (p.type === 'shockwave') {
        if (p.sizeDecay) p.size += p.sizeDecay * dt; // expand
      } else if (p.type === 'streak') {
        p.vx *= Math.pow(0.8, dt);
        p.vy *= Math.pow(0.8, dt);
      } else {
        p.vy += 0.05 * dt; // normal gravity
      }

      // Rotation
      if (p.rotation !== undefined && p.angularVel !== undefined) {
        p.rotation += p.angularVel * dt;
      }
      
      // Size decay
      if (p.sizeDecay !== undefined && p.type !== 'shockwave') {
        p.size *= Math.pow(p.sizeDecay, dt);
      }

      p.life -= dtMs / 1000;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update black holes
    for (let i = this.blackHoles.length - 1; i >= 0; i--) {
      const bh = this.blackHoles[i];
      bh.life -= dtMs / 1000;
      if (bh.life <= 0) { this.blackHoles.splice(i, 1); continue; }
      // Pull nearby bricks
      for (const brick of this.bricks) {
        if (!brick.active) continue;
        const d = dist(bh.x, bh.y, brick.x + brick.w / 2, brick.y + brick.h / 2);
        if (d < bh.radius * 3) {
          brick.hp -= 0.5 * dt;
          if (brick.hp <= 0) { brick.hp = 0; brick.active = false; this.onBrickDestroyed(brick); }
        }
      }
    }

    // Update drones
    for (const drone of this.drones) {
      drone.angle += 0.03 * dt;
      drone.fireTimer -= dtMs / 1000;
      if (drone.fireTimer <= 0 && this.phase === 'SHOOTING') {
        drone.fireTimer = 0.5;
        // Find nearest active brick
        let nearest: BrickState | null = null;
        let minD = Infinity;
        for (const b of this.bricks) {
          if (!b.active) continue;
          const d = dist(drone.x, drone.y, b.x + b.w / 2, b.y + b.h / 2);
          if (d < minD) { minD = d; nearest = b; }
        }
        if (nearest) {
          nearest.hp -= this.ballDamage;
          nearest.hitFlash = 0.15;
          this.spawnParticles(nearest.x + nearest.w / 2, nearest.y + nearest.h / 2, '#00ff88', 3);
          if (nearest.hp <= 0) { nearest.hp = 0; nearest.active = false; this.onBrickDestroyed(nearest); }
        }
      }
    }

    if (this.phase !== 'SHOOTING') return;

    // Staggered ball launch
    if (this.launching) {
      this.launchTimer += dtMs / 1000;
      if (this.launchTimer >= 0.06) { // 60ms between balls
        this.launchTimer = 0;
        const fn = (this as Record<string, unknown>)._launchFn as (() => void) | undefined;
        if (fn) fn();
      }
    }

    // Update balls
    for (const ball of this.balls) {
      if (!ball.active || ball.returned) continue;

      // Trail
      ball.trail.push({ x: ball.x, y: ball.y, alpha: 1 });
      if (ball.trail.length > 8) ball.trail.shift();
      for (const t of ball.trail) t.alpha *= 0.85;

      // Homing
      if (ball.homingStrength > 0) {
        let nearestBrick: BrickState | null = null;
        let minBD = Infinity;
        for (const b of this.bricks) {
          if (!b.active) continue;
          const d = dist(ball.x, ball.y, b.x + b.w / 2, b.y + b.h / 2);
          if (d < 150 && d < minBD) { minBD = d; nearestBrick = b; }
        }
        if (nearestBrick) {
          const tx = nearestBrick.x + nearestBrick.w / 2 - ball.x;
          const ty = nearestBrick.y + nearestBrick.h / 2 - ball.y;
          const tm = Math.sqrt(tx * tx + ty * ty);
          if (tm > 0) {
            ball.vx += (tx / tm) * ball.homingStrength * 0.15 * dt;
            ball.vy += (ty / tm) * ball.homingStrength * 0.15 * dt;
            // Re-normalize speed
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            const targetSpeed = BALL_BASE_SPEED * this.ballSpeedMult * (this.timeSlowActive ? 0.5 : 1);
            ball.vx = (ball.vx / speed) * targetSpeed;
            ball.vy = (ball.vy / speed) * targetSpeed;
          }
        }
      }

      // Move
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      // Wall bounce
      if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx = Math.abs(ball.vx); ball.bounceCount++; }
      if (ball.x + ball.radius > GAME_W) { ball.x = GAME_W - ball.radius; ball.vx = -Math.abs(ball.vx); ball.bounceCount++; }
      if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy = Math.abs(ball.vy); ball.bounceCount++; }

      // Quantum split check
      if (this.quantumSplitActive && ball.bounceCount > 0 && ball.bounceCount % 3 === 0 && this.balls.length < 300) {
        const newBall: BallState = {
          ...ball,
          vx: ball.vx * (0.8 + Math.random() * 0.4),
          vy: ball.vy * (0.8 + Math.random() * 0.4),
          trail: [],
          elements: new Set(ball.elements),
          bounceCount: 0,
        };
        this.balls.push(newBall);
      }

      // Floor (return)
      if (ball.y + ball.radius >= LAUNCH_Y) {
        ball.active = false;
        ball.returned = true;
        if (this.returnedCount === 0) this.firstReturnX = ball.x;
        this.returnedCount++;
        continue;
      }

      // Black hole pull
      for (const bh of this.blackHoles) {
        const d = dist(ball.x, ball.y, bh.x, bh.y);
        if (d < bh.radius * 2 && d > 5) {
          const pull = bh.strength / d * dt;
          ball.vx += ((bh.x - ball.x) / d) * pull;
          ball.vy += ((bh.y - ball.y) / d) * pull;
        }
      }

      // Brick collision
      for (const brick of this.bricks) {
        if (!brick.active) continue;
        if (this.checkBallBrickCollision(ball, brick)) {
          this.onBallHitBrick(ball, brick);
        }
      }
    }

    // Clean up dead bricks
    this.bricks = this.bricks.filter(b => b.active);

    // Check if all balls have returned
    if (!this.launching && this.balls.length > 0) {
      const allDone = this.balls.every(b => b.returned || !b.active);
      if (allDone) {
        this.checkAllReturned();
      }
    }
  }

  checkAllReturned() {
    const allReturned = this.balls.every(b => b.returned || !b.active);
    if (!allReturned) return;

    this.launchX = clamp(this.firstReturnX, 20, GAME_W - 20);
    this.balls = [];
    this.combo = 0;
    this.phase = 'WAVE_CLEAR';
    this.onWaveClear();
  }

  // ============================================================
  // COLLISION DETECTION
  // ============================================================
  checkBallBrickCollision(ball: BallState, brick: BrickState): boolean {
    const cx = clamp(ball.x, brick.x, brick.x + brick.w);
    const cy = clamp(ball.y, brick.y, brick.y + brick.h);
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    if (dx * dx + dy * dy < ball.radius * ball.radius) {
      // Resolve: push ball out and reflect
      const absDx = Math.abs(ball.x - (brick.x + brick.w / 2));
      const absDy = Math.abs(ball.y - (brick.y + brick.h / 2));
      const halfW = brick.w / 2 + ball.radius;
      const halfH = brick.h / 2 + ball.radius;
      const overlapX = halfW - absDx;
      const overlapY = halfH - absDy;

      if (overlapX < overlapY) {
        if (ball.x < brick.x + brick.w / 2) {
          if (ball.vx > 0) ball.vx *= -1;
        } else {
          if (ball.vx < 0) ball.vx *= -1;
        }
        ball.x += ball.x < brick.x + brick.w / 2 ? -overlapX : overlapX;
      } else {
        if (ball.y < brick.y + brick.h / 2) {
          if (ball.vy > 0) ball.vy *= -1;
        } else {
          if (ball.vy < 0) ball.vy *= -1;
        }
        ball.y += ball.y < brick.y + brick.h / 2 ? -overlapY : overlapY;
      }
      ball.bounceCount++;
      return true;
    }
    return false;
  }

  // ============================================================
  // HIT LOGIC + SYNERGIES
  // ============================================================
  onBallHitBrick(ball: BallState, brick: BrickState) {
    ball.hitCount++;
    this.totalHitCount++;

    // Calculate damage
    let dmg = ball.damage;
    // Ricochet bonus
    if (this.ricochetBonus > 0) dmg *= (1 + ball.bounceCount * this.ricochetBonus * 0.2);
    // Critical hit
    const isCrit = Math.random() < this.critChance;
    if (isCrit) dmg *= 3;
    // Shield penetration
    if (brick.type === 'armored' && !this.shieldPen) dmg *= 0.5;
    // Frozen bricks take double (Ice Guardian passive)
    if (brick.freezeTurns > 0 && this.hero.id === 'ice_guardian') dmg *= 2;

    brick.hp -= dmg;
    brick.hitFlash = 0.12;
    this.stats.damageDealt += dmg;
    this.score += Math.floor(dmg);
    this.combo++;

    // Ultimate charge
    this.ultimateCharge++;
    if (this.ultimateCharge >= this.hero.ultimateChargeNeeded && !this.ultimateActive) {
      this.onUltimateReady();
    }

    // Particles and damage numbers
    const hitColor = isCrit ? '#ffff00' : '#ffffff';
    this.spawnParticles(ball.x, ball.y, hitColor, isCrit ? 8 : 4);
    
    // Spawn damage number
    this.particles.push({
      x: ball.x + randRange(-10, 10),
      y: ball.y - 10 + randRange(-5, 5),
      vx: randRange(-0.5, 0.5),
      vy: -1.5,
      life: 0.6,
      maxLife: 0.6,
      color: hitColor,
      size: isCrit ? 16 : 12,
      type: 'text',
      text: isCrit ? `CRIT! ${Math.floor(dmg)}` : `${Math.floor(dmg)}`
    });

    // Combo VFX
    if (this.combo === 10 || this.combo === 25 || this.combo === 50) {
      this.screenFlash = 0.1;
      this.particles.push({
        x: GAME_W / 2, y: GAME_H / 2,
        vx: 0, vy: -0.5, life: 1.5, maxLife: 1.5,
        color: '#00f0ff', size: 30, type: 'text',
        text: `${this.combo} COMBO!`
      });
    }

    // ---- ELEMENT EFFECTS ----
    // Fire
    if (ball.elements.has('fire') || this.eternalInferno) {
      brick.burnTicks = Math.max(brick.burnTicks, this.eternalInferno ? 999 : 3);
      this.spawnParticles(ball.x, ball.y, '#ff4400', 3);
      // Eternal Inferno: spread to neighbors
      if (this.eternalInferno) {
        for (const other of this.bricks) {
          if (other === brick || !other.active) continue;
          if (dist(brick.x, brick.y, other.x, other.y) < 80) other.burnTicks = Math.max(other.burnTicks, 2);
        }
      }
    }
    // Ice
    if (ball.elements.has('ice')) {
      brick.freezeTurns = Math.max(brick.freezeTurns, 2);
      this.spawnParticles(ball.x, ball.y, '#00ccff', 3);
    }
    // Poison
    if (ball.elements.has('poison')) {
      brick.poisonTicks = Math.max(brick.poisonTicks, 3);
      this.spawnParticles(ball.x, ball.y, '#00ff66', 3);
    }

    // Chain Lightning
    let chainTargets = this.chainLightningTargets;
    if (this.stormGodActive) chainTargets = Math.max(chainTargets, 3);
    if (ball.elements.has('lightning') || this.stormGodActive) {
      this.triggerChainLightning(brick, dmg * 0.4, chainTargets);
    }

    // Explosion chance
    if (this.explosionChance > 0 && Math.random() < this.explosionChance) {
      this.triggerExplosion(brick.x + brick.w / 2, brick.y + brick.h / 2, dmg * 0.5);
    }

    // Relic: every 5th hit explodes
    if (this.relics.find(r => r.id === 'explosive_fifth') && this.totalHitCount % 5 === 0) {
      this.triggerExplosion(brick.x + brick.w / 2, brick.y + brick.h / 2, dmg * 0.3);
    }

    // Split ball
    if (this.splitCount > 0 && !ball.splitUsed && this.balls.length < 300) {
      ball.splitUsed = true;
      for (let s = 0; s < this.splitCount; s++) {
        const angle = Math.atan2(ball.vy, ball.vx) + (Math.random() - 0.5) * 1.2;
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const newBall: BallState = {
          x: ball.x, y: ball.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          radius: ball.radius, damage: ball.damage * 0.7,
          active: true, returned: false,
          elements: new Set(ball.elements),
          bounceCount: 0, hitCount: 0,
          trail: [], splitUsed: true,
          homingStrength: ball.homingStrength,
        };
        this.balls.push(newBall);
      }
    }

    // Check brick death
    if (brick.hp <= 0) {
      brick.hp = 0;
      brick.active = false;
      this.onBrickDestroyed(brick);
    }
  }

  onBrickDestroyed(brick: BrickState) {
    this.stats.bricksDestroyed++;
    this.score += brick.maxHp * 5;
    this.shake(brick.type === 'boss' ? 12 : 3);

    // Death particles
    const col = brick.type === 'boss' ? '#ff0066' : brick.color;
    this.spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, col, brick.type === 'boss' ? 40 : 15, 'shard');
    
    // Shockwave
    this.particles.push({
      x: brick.x + brick.w / 2, y: brick.y + brick.h / 2,
      vx: 0, vy: 0, life: 0.3, maxLife: 0.3,
      color: col, size: 5, sizeDecay: 150, type: 'shockwave'
    });

    if (brick.type === 'boss') this.screenFlash = 0.3;

    // Explosive brick
    if (brick.type === 'explosive') {
      this.triggerExplosion(brick.x + brick.w / 2, brick.y + brick.h / 2, this.ballDamage * 3);
    }

    // Black hole chance
    if (this.blackHoleChance > 0 && Math.random() < this.blackHoleChance) {
      this.spawnBlackHole(brick.x + brick.w / 2, brick.y + brick.h / 2);
    }
    // Singularity Core (always spawn)
    if (this.singularityActive) {
      this.spawnBlackHole(brick.x + brick.w / 2, brick.y + brick.h / 2);
    }
  }

  // ============================================================
  // SYNERGY EFFECTS
  // ============================================================
  triggerChainLightning(source: BrickState, dmg: number, targets: number) {
    let lastX = source.x + source.w / 2;
    let lastY = source.y + source.h / 2;
    const hit = new Set<BrickState>();
    hit.add(source);

    for (let t = 0; t < targets; t++) {
      let nearest: BrickState | null = null;
      let minD = Infinity;
      for (const b of this.bricks) {
        if (!b.active || hit.has(b)) continue;
        const d = dist(lastX, lastY, b.x + b.w / 2, b.y + b.h / 2);
        if (d < 200 && d < minD) { minD = d; nearest = b; }
      }
      if (!nearest) break;
      hit.add(nearest);
      const tx = nearest.x + nearest.w / 2;
      const ty = nearest.y + nearest.h / 2;

      // Spawn lightning bolt particles along the line
      this.spawnLightningBolt(lastX, lastY, tx, ty);
      nearest.hp -= dmg;
      nearest.hitFlash = 0.15;
      this.stats.damageDealt += dmg;
      if (nearest.hp <= 0) { nearest.hp = 0; nearest.active = false; this.onBrickDestroyed(nearest); }
      lastX = tx;
      lastY = ty;
    }
  }

  triggerExplosion(x: number, y: number, dmg: number) {
    this.shake(8);
    this.screenFlash = 0.2;
    this.spawnParticles(x, y, '#ff6600', 15, 'ember');
    this.spawnParticles(x, y, '#ffdd00', 10, 'spark');
    this.particles.push({
      x, y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4,
      color: '#ff6600', size: 10, sizeDecay: 200, type: 'shockwave'
    });
    for (const b of this.bricks) {
      if (!b.active) continue;
      const d = dist(x, y, b.x + b.w / 2, b.y + b.h / 2);
      if (d < 80) {
        b.hp -= dmg;
        b.hitFlash = 0.15;
        this.stats.damageDealt += dmg;
        if (b.hp <= 0) { b.hp = 0; b.active = false; this.onBrickDestroyed(b); }
      }
    }
  }

  spawnBlackHole(x: number, y: number) {
    this.blackHoles.push({ x, y, life: 3, radius: 30, strength: 8 });
    this.spawnParticles(x, y, '#6600cc', 15, 'bubble');
    this.particles.push({
      x, y, vx: 0, vy: 0, life: 0.5, maxLife: 0.5,
      color: '#aa00ff', size: 5, sizeDecay: 60, type: 'shockwave'
    });
  }

  // ============================================================
  // HERO ULTIMATES
  // ============================================================
  triggerUltimate() {
    if (this.ultimateCharge < this.hero.ultimateChargeNeeded) return;
    this.ultimateCharge = 0;
    this.ultimateActive = false;
    this.shake(15);
    this.screenFlash = 0.5;

    switch (this.hero.id) {
      case 'arc_mage': {
        // Lightning storm: hit every brick
        for (const b of this.bricks) {
          if (!b.active) continue;
          b.hp -= this.ballDamage * 3;
          b.hitFlash = 0.2;
          this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#aa00ff', 5);
          if (b.hp <= 0) { b.hp = 0; b.active = false; this.onBrickDestroyed(b); }
        }
        break;
      }
      case 'pyromancer': {
        // Ignite all bricks
        for (const b of this.bricks) {
          if (!b.active) continue;
          b.burnTicks = 5;
          b.hp -= this.ballDamage * 2;
          this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#ff4400', 5);
          if (b.hp <= 0) { b.hp = 0; b.active = false; this.onBrickDestroyed(b); }
        }
        break;
      }
      case 'engineer': {
        // Deploy 5 drones (cap at 8 total)
        const toSpawn = Math.min(5, 8 - this.drones.length);
        for (let i = 0; i < toSpawn; i++) {
          this.drones.push({
            x: GAME_W / 2 + (Math.random() - 0.5) * 200,
            y: GAME_H / 2 + (Math.random() - 0.5) * 100,
            angle: Math.random() * Math.PI * 2,
            fireTimer: Math.random() * 0.5,
            targetBrick: 0,
          });
        }
        break;
      }
      case 'void_walker': {
        // Giant singularity at center
        this.spawnBlackHole(GAME_W / 2, GAME_H / 3);
        this.blackHoles[this.blackHoles.length - 1].radius = 80;
        this.blackHoles[this.blackHoles.length - 1].strength = 20;
        this.blackHoles[this.blackHoles.length - 1].life = 5;
        break;
      }
      case 'ice_guardian': {
        // Freeze all bricks for 3 turns
        for (const b of this.bricks) {
          if (!b.active) continue;
          b.freezeTurns = 3;
          this.spawnParticles(b.x + b.w / 2, b.y + b.h / 2, '#00ccff', 5);
        }
        break;
      }
    }
  }

  // ============================================================
  // APPLY UPGRADE
  // ============================================================
  applyUpgrade(upgrade: UpgradeDef) {
    const current = this.upgrades.get(upgrade.id) || 0;
    if (current >= upgrade.maxStacks) return;
    this.upgrades.set(upgrade.id, current + 1);
    this.stats.upgradesCollected++;

    if (upgrade.element) this.elements.add(upgrade.element);

    switch (upgrade.id) {
      case 'ball_plus_1':     this.totalBalls += 1; break;
      case 'ball_plus_3':     this.totalBalls += 3; break;
      case 'damage_plus_1':   this.ballDamage += 1; break;
      case 'speed_up':        this.ballSpeedMult += 0.15; break;
      case 'ball_size_up':    this.ballRadiusBonus += 1; break;
      case 'critical_hit':    this.critChance += 0.15; break;
      case 'ricochet':        this.ricochetBonus += 1; break;
      case 'poison_cloud':    break; // element applied above
      case 'fire_aspect':     break;
      case 'ice_aspect':      break;
      case 'split_ball':      this.splitCount += 1; break;
      case 'drone':           if (this.drones.length < 8) this.drones.push({ x: GAME_W / 2, y: GAME_H / 3, angle: 0, fireTimer: 0, targetBrick: 0 }); break;
      case 'shield_pen':      this.shieldPen = true; break;
      case 'chain_lightning':  this.chainLightningTargets += 2; break;
      case 'black_hole':      this.blackHoleChance += 0.1; break;
      case 'time_slow':       this.timeSlowActive = true; break;
      case 'explosive':       this.explosionChance += 0.2; break;
      case 'homing':          this.homingStrength += 1; break;
      case 'storm_god':       this.stormGodActive = true; break;
      case 'eternal_inferno': this.eternalInferno = true; break;
      case 'singularity':     this.singularityActive = true; break;
      case 'quantum_split':   this.quantumSplitActive = true; break;
      case 'time_breaker':    this.timeBreakerWaves += 3; break;
    }
  }

  addRelic(relic: RelicDef) {
    this.relics.push(relic);
    this.stats.relicsFound++;

    // Apply one-time effects
    if (relic.id === 'extra_projectile') {
      this.totalBalls += 2;
    }
    if (relic.id === 'permanent_crit') {
      this.critChance += 0.05;
    }
    if (relic.id === 'ball_magnet') {
      this.homingStrength += 0.5;
    }
  }

  // Resume after upgrade choice
  resumeAfterUpgrade() {
    this.phase = 'AIMING';
    this.nextWave();
  }

  // ============================================================
  // RANDOM UPGRADE SELECTION
  // ============================================================
  getRandomUpgrades(count: number): UpgradeDef[] {
    // Weighted random by rarity
    const available = ALL_UPGRADES.filter(u => {
      const current = this.upgrades.get(u.id) || 0;
      return current < u.maxStacks;
    });
    if (available.length <= count) return [...available];

    const selected: UpgradeDef[] = [];
    const pool = [...available];

    for (let i = 0; i < count && pool.length > 0; i++) {
      // Weighted selection
      const totalWeight = pool.reduce((sum, u) => sum + (RARITY_WEIGHTS[u.rarity] || 10), 0);
      let roll = Math.random() * totalWeight;
      let picked = pool[0];
      for (const u of pool) {
        roll -= RARITY_WEIGHTS[u.rarity] || 10;
        if (roll <= 0) { picked = u; break; }
      }
      selected.push(picked);
      pool.splice(pool.indexOf(picked), 1);
    }
    return selected;
  }

  // ============================================================
  // PARTICLE HELPERS
  // ============================================================
  spawnParticles(x: number, y: number, color: string, count: number, type: Particle['type'] = 'circle') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randRange(1, 4);
      let p: Particle = {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: randRange(0.3, 0.8),
        maxLife: 0.8,
        color,
        size: type === 'shard' ? randRange(3, 6) : type === 'ring' ? randRange(5, 10) : randRange(1.5, 3.5),
        type,
      };
      
      if (type === 'shard') {
        p.rotation = Math.random() * Math.PI * 2;
        p.angularVel = (Math.random() - 0.5) * 10;
        p.sizeDecay = 0.9;
      }
      
      this.particles.push(p);
    }
  }

  spawnLightningBolt(x1: number, y1: number, x2: number, y2: number) {
    // Spawn an actual lightning bolt (stored as a particle with a custom life for rendering)
    this.particles.push({
      x: x1, y: y1,
      vx: x2, vy: y2, // store target in vx, vy hack
      life: 0.2, maxLife: 0.2,
      color: '#cc88ff', size: 2,
      type: 'streak'
    });
    this.screenFlash = 0.05;
  }

  shake(intensity: number) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  // ============================================================
  // DRAW
  // ============================================================
  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.scale, this.scale);

    // Camera shake
    ctx.translate(this.shakeX, this.shakeY);

    const currentStage = STAGES[this.currentStageIndex];

    // Background
    const bgGradient = ctx.createRadialGradient(GAME_W/2, GAME_H*0.3, 0, GAME_W/2, GAME_H*0.3, GAME_H*0.8);
    bgGradient.addColorStop(0, currentStage.theme.bgGradientInner);
    bgGradient.addColorStop(1, currentStage.theme.bgGradientOuter);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(-10, -10, GAME_W + 20, GAME_H + 20);

    // Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = (this.frameCount * 0.5) % 4; y < GAME_H; y += 4) {
      ctx.fillRect(0, y, GAME_W, 2);
    }

    // Grid (pulses)
    const gridAlpha = 0.03 + (this.gridFlashTimer > 0 ? this.gridFlashTimer * 0.1 : 0);
    ctx.strokeStyle = `rgba(${currentStage.theme.gridColor}, ${gridAlpha})`;
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < GAME_W; gx += 30) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GAME_H); ctx.stroke();
    }
    for (let gy = 0; gy < GAME_H; gy += 30) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(GAME_W, gy); ctx.stroke();
    }
    
    // Ambient particles
    for (const p of this.ambientParticles) {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    }

    // Danger line
    ctx.strokeStyle = 'rgba(255, 0, 50, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(0, DANGER_Y); ctx.lineTo(GAME_W, DANGER_Y); ctx.stroke();
    ctx.setLineDash([]);

    // Draw black holes
    for (const bh of this.blackHoles) {
      const alpha = Math.min(1, bh.life / 3);
      const gradient = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.radius);
      gradient.addColorStop(0, `rgba(80, 0, 160, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(40, 0, 80, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.radius * 2, 0, Math.PI * 2); ctx.fill();
      // Core
      ctx.fillStyle = `rgba(20, 0, 40, ${alpha})`;
      ctx.beginPath(); ctx.arc(bh.x, bh.y, bh.radius * 0.3, 0, Math.PI * 2); ctx.fill();
    }

    // Draw bricks
    for (const b of this.bricks) {
      if (!b.active) continue;
      this.drawBrick(ctx, b);
    }

    // Draw ball trails + balls
    for (const ball of this.balls) {
      if (ball.returned) continue;
      this.drawBall(ctx, ball);
    }

    // Draw drones
    for (const drone of this.drones) {
      ctx.save();
      ctx.translate(drone.x, drone.y);
      ctx.rotate(drone.angle);
      ctx.fillStyle = '#00cc88';
      ctx.shadowColor = '#00cc88';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(5, 4); ctx.lineTo(-5, 4);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // Particles
    for (const p of this.particles) {
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.rotation !== undefined) ctx.rotate(p.rotation);
      
      if (p.type === 'text') {
        ctx.fillStyle = p.color;
        ctx.font = `bold ${p.size}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillText(p.text || '', 0, 0);
      } else if (p.type === 'streak') {
        // Special render for lightning bolt: x/y is start, vx/vy is end
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // Draw jagged line to target
        const tx = p.vx - p.x;
        const ty = p.vy - p.y;
        const dist = Math.sqrt(tx*tx + ty*ty);
        const segments = Math.floor(dist / 20) + 1;
        
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const nx = tx * t + (Math.random() - 0.5) * 15;
          const ny = ty * t + (Math.random() - 0.5) * 15;
          ctx.lineTo(nx, ny);
        }
        ctx.lineTo(tx, ty); // exact end
        ctx.stroke();
      } else if (p.type === 'ring' || p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.type === 'shockwave' ? 3 * alpha : 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'shard') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-p.size, -p.size);
        ctx.lineTo(p.size, -p.size*0.5);
        ctx.lineTo(p.size*0.5, p.size);
        ctx.lineTo(-p.size*0.8, p.size*0.8);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'ember' ? 5 : 0;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Screen flash
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlash})`;
      ctx.fillRect(-10, -10, GAME_W + 20, GAME_H + 20);
    }

    // Stage Transition Text
    if (this.stageTransitionTextTimer > 0) {
      const alpha = Math.min(1, this.stageTransitionTextTimer * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = currentStage.theme.particleColor;
      ctx.shadowBlur = 15;
      ctx.fillText(currentStage.name.toUpperCase(), GAME_W / 2, GAME_H / 2 - 20);
      ctx.font = '16px Inter, sans-serif';
      ctx.fillText(`STAGE ${this.currentStageIndex + 1}`, GAME_W / 2, GAME_H / 2 + 10);
      ctx.shadowBlur = 0;
    }

    // Aim trajectory
    if (this.isAiming && this.phase === 'AIMING') {
      this.drawTrajectory(ctx);
    }

    // Launch position indicator
    if (this.phase === 'AIMING') {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(this.launchX, LAUNCH_Y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball count
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`×${this.totalBalls}`, this.launchX, LAUNCH_Y + 18);
    }

    // Game Over overlay
    if (this.phase === 'GAME_OVER') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = '#ff0044';
      ctx.font = 'bold 48px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0044';
      ctx.shadowBlur = 20;
      ctx.fillText('GAME OVER', GAME_W / 2, GAME_H / 2 - 20);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#aaa';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText(`Wave ${this.wave} · Score ${this.score}`, GAME_W / 2, GAME_H / 2 + 20);
    }

    ctx.restore();
  }

  // ---- DRAW BRICK ----
  drawBrick(ctx: CanvasRenderingContext2D, b: BrickState) {
    const r = 4; // corner radius
    ctx.save();
    
    // Scale animation (spawn)
    const scale = b.spawnScale !== undefined ? b.spawnScale : 1;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    
    if (scale < 1) {
      ctx.translate(cx, cy);
      // Elastic easing
      const eScale = scale < 0.5 ? 4 * scale * scale * scale : 1 - Math.pow(-2 * scale + 2, 3) / 2;
      ctx.scale(eScale, eScale);
      ctx.translate(-cx, -cy);
    }
    
    // Boss pulse
    if (b.type === 'boss') {
      const pulse = 1 + Math.sin(this.frameCount * 0.05) * 0.02;
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      ctx.translate(-cx, -cy);
    }

    // Glow
    ctx.shadowColor = b.type === 'boss' ? '#ff0066' : b.color;
    ctx.shadowBlur = b.hitFlash > 0 ? 20 : 10;

    // Hit flash
    let fillStyle: string | CanvasGradient;
    if (b.hitFlash > 0) {
      b.hitFlash -= 0.016;
      fillStyle = '#ffffff';
    } else {
      // 3D Gradient
      const grad = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
      grad.addColorStop(0, '#ffffff44'); // top highlight
      grad.addColorStop(0.1, b.color);
      grad.addColorStop(1, '#00000044'); // bottom shadow
      fillStyle = grad;
    }
    ctx.fillStyle = fillStyle;

    // Rounded rect path
    ctx.beginPath();
    ctx.moveTo(b.x + r, b.y);
    ctx.lineTo(b.x + b.w - r, b.y);
    ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + r);
    ctx.lineTo(b.x + b.w, b.y + b.h - r);
    ctx.quadraticCurveTo(b.x + b.w, b.y + b.h, b.x + b.w - r, b.y + b.h);
    ctx.lineTo(b.x + r, b.y + b.h);
    ctx.quadraticCurveTo(b.x, b.y + b.h, b.x, b.y + b.h - r);
    ctx.lineTo(b.x, b.y + r);
    ctx.quadraticCurveTo(b.x, b.y, b.x + r, b.y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0; // Turn off glow for internal details

    // Cracks based on HP ratio
    const hpRatio = b.hp / b.maxHp;
    if (hpRatio < 0.6) {
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Simple crack pattern derived from brick coords
      ctx.moveTo(b.x + b.w * 0.2, b.y);
      ctx.lineTo(b.x + b.w * 0.4, b.y + b.h * 0.4);
      ctx.lineTo(b.x + b.w * 0.3, b.y + b.h * 0.7);
      if (hpRatio < 0.3) {
        ctx.lineTo(b.x + b.w * 0.5, b.y + b.h);
        ctx.moveTo(b.x + b.w * 0.4, b.y + b.h * 0.4);
        ctx.lineTo(b.x + b.w * 0.8, b.y + b.h * 0.6);
      }
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Status effect overlays
    if (b.burnTicks > 0) {
      ctx.fillStyle = 'rgba(255, 80, 0, 0.3)';
      ctx.fill();
    }
    if (b.freezeTurns > 0) {
      ctx.fillStyle = 'rgba(0, 200, 255, 0.35)';
      ctx.fill();
      // Ice crystals
      ctx.fillStyle = 'rgba(180, 240, 255, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❄', b.x + b.w - 8, b.y + 12);
    }
    if (b.poisonTicks > 0) {
      ctx.fillStyle = 'rgba(0, 255, 80, 0.25)';
      ctx.fill();
    }

    // HP text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${b.type === 'boss' ? 18 : 13}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(Math.ceil(b.hp).toString(), b.x + b.w / 2, b.y + b.h / 2 + 1);
    ctx.shadowBlur = 0;

    // Type icon
    if (b.type === 'armored') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText('🛡️', b.x + 10, b.y + 10);
    }
    if (b.type === 'explosive') {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText('💣', b.x + 10, b.y + 10);
    }
    if (b.type === 'boss') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '14px sans-serif';
      ctx.shadowColor = '#ffdd00';
      ctx.shadowBlur = 10;
      ctx.fillText('👑', b.x + b.w / 2, b.y - 5);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // ---- DRAW BALL ----
  drawBall(ctx: CanvasRenderingContext2D, ball: BallState) {
    if (!ball.active) return;
    
    const color = this.getBallColor(ball);

    // Smooth Ribbon Trail
    if (ball.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
      for (let i = 1; i < ball.trail.length - 1; i++) {
        const xc = (ball.trail[i].x + ball.trail[i + 1].x) / 2;
        const yc = (ball.trail[i].y + ball.trail[i + 1].y) / 2;
        ctx.quadraticCurveTo(ball.trail[i].x, ball.trail[i].y, xc, yc);
      }
      ctx.lineTo(ball.x, ball.y);
      
      // Gradient stroke for trail
      const grad = ctx.createLinearGradient(ball.trail[0].x, ball.trail[0].y, ball.x, ball.y);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, color);
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = ball.radius * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Comet Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.2, ball.y - ball.radius * 0.2, ball.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Speed lines
    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (speed > 15) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      const angle = Math.atan2(ball.vy, ball.vx);
      ctx.beginPath();
      ctx.moveTo(ball.x - Math.cos(angle)*ball.radius*2 + Math.sin(angle)*ball.radius, 
                 ball.y - Math.sin(angle)*ball.radius*2 - Math.cos(angle)*ball.radius);
      ctx.lineTo(ball.x - Math.cos(angle)*ball.radius*4 + Math.sin(angle)*ball.radius, 
                 ball.y - Math.sin(angle)*ball.radius*4 - Math.cos(angle)*ball.radius);
                 
      ctx.moveTo(ball.x - Math.cos(angle)*ball.radius*2 - Math.sin(angle)*ball.radius, 
                 ball.y - Math.sin(angle)*ball.radius*2 + Math.cos(angle)*ball.radius);
      ctx.lineTo(ball.x - Math.cos(angle)*ball.radius*4 - Math.sin(angle)*ball.radius, 
                 ball.y - Math.sin(angle)*ball.radius*4 + Math.cos(angle)*ball.radius);
      ctx.stroke();
    }
  }

  getBallColor(ball: BallState): string {
    if (ball.elements.has('fire')) return ELEMENT_COLORS.fire;
    if (ball.elements.has('ice')) return ELEMENT_COLORS.ice;
    if (ball.elements.has('lightning')) return ELEMENT_COLORS.lightning;
    if (ball.elements.has('poison')) return ELEMENT_COLORS.poison;
    if (ball.elements.has('void')) return ELEMENT_COLORS.void;
    return '#00f0ff';
  }

  // ---- DRAW AIM TRAJECTORY ----
  drawTrajectory(ctx: CanvasRenderingContext2D) {
    const dx = this.aimX - this.launchX;
    const dy = this.aimY - LAUNCH_Y;
    if (dy > -20) return;

    const mag = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / mag;
    const ny = dy / mag;

    // Dotted line with bounce prediction
    let px = this.launchX;
    let py = LAUNCH_Y;
    let vnx = nx;
    let vny = ny;
    const step = 6;
    let bounces = 0;

    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 80 && bounces < 2; i++) {
      const nextX = px + vnx * step;
      const nextY = py + vny * step;

      // Check wall bounces
      if (nextX < 0 || nextX > GAME_W) {
        vnx *= -1;
        bounces++;
      }
      if (nextY < 0) {
        vny *= -1;
        bounces++;
      }

      if (i % 3 === 0) {
        const alpha = 1 - i / 80;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      px = nextX;
      py = nextY;
    }
    ctx.restore();
  }

  // ============================================================
  // GETTERS for UI
  // ============================================================
  getUltimateProgress(): number {
    return Math.min(1, this.ultimateCharge / this.hero.ultimateChargeNeeded);
  }

  getActiveUpgradesList(): Array<{ name: string; stacks: number; icon: string }> {
    const list: Array<{ name: string; stacks: number; icon: string }> = [];
    for (const [id, stacks] of this.upgrades) {
      const def = ALL_UPGRADES.find(u => u.id === id);
      if (def) list.push({ name: def.name, stacks, icon: def.icon });
    }
    return list;
  }

  getRelicsList(): Array<{ name: string; icon: string; rarity: string }> {
    return this.relics.map(r => ({ name: r.name, icon: r.icon, rarity: r.rarity }));
  }
}
