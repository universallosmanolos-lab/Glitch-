export type GameState = 'menu' | 'playing' | 'paused' | 'gameover';

export type GlitchType = 'gravity' | 'duplication' | 'frenzy' | 'neon';

export interface GlitchEvent {
  active: boolean;
  type: GlitchType;
  title: string;
  description: string;
  duration: number; // in seconds
  remaining: number; // in seconds
  warningTime: number; // warning countdown before it triggers
}

export type PowerUpType = 'shield' | 'speed';

export type CharacterId = 'chispa' | 'radioactivo' | 'modo_fuego' | 'void';

export interface CharacterInfo {
  id: CharacterId;
  name: string;
  description: string;
  colorPrimary: string;
  colorSecondary: string;
  colorCore: string;
}

export const CHARACTERS: CharacterInfo[] = [
  {
    id: 'chispa',
    name: 'Chispa',
    description: 'Gelatina clásica cian y morada.',
    colorPrimary: '#00d4ff',
    colorSecondary: '#b829e3',
    colorCore: '#70f7ff',
  },
  {
    id: 'radioactivo',
    name: 'Radioactivo',
    description: 'Aspecto verde brillante tóxico.',
    colorPrimary: '#10b981',
    colorSecondary: '#065f46',
    colorCore: '#a7f3d0',
  },
  {
    id: 'modo_fuego',
    name: 'Modo Fuego',
    description: 'Aspecto naranja con plasma de fuego.',
    colorPrimary: '#ff6b00',
    colorSecondary: '#ff0055',
    colorCore: '#ffea00',
  },
  {
    id: 'void',
    name: 'Void',
    description: 'Gelatina cósmica estelar.',
    colorPrimary: '#8b5cf6',
    colorSecondary: '#4c1d95',
    colorCore: '#c4b5fd',
  },
];

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;
  remaining: number;
}

export interface Player {
  x: number;
  y: number;
  radius: number;
  targetX: number;
  vx: number;
  jigglePhase: number;
  squashX: number;
  squashY: number;
  invulnerableTime: number; // seconds left of i-frames
  shieldActive: boolean;
  speedBoostActive: boolean;
  overchargeActive: boolean;
  isHit: boolean;
  hitTimer: number;
  blinkTimer: number;
  lookDirection: number; // -1 to 1
  panicLevel: number; // 0 to 1 when obstacle is close
  characterId: string;
  equippedTrail: string;
}

export type ObstacleKind =
  | 'patito'
  | 'pastel'
  | 'tostadora'
  | 'tostada'
  | 'spark'
  | 'coin'
  | 'powerup_shield'
  | 'powerup_speed';

export interface BaseEntity {
  id: number;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  markedForDeletion: boolean;
}

export interface Obstacle extends BaseEntity {
  kind: ObstacleKind;
  width: number;
  height: number;
  stateTimer: number;
  animFrame: number;
  phase: number;
  zigzagDirection?: number;
  nextTurnTimer?: number;
  jumpProgress?: number;
  jumpHeight?: number;
  targetXDrift?: number;
  shakeAmount?: number;
  hasFiredToast?: boolean;
  shootCooldown?: number;
  variantColor?: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'square' | 'crumb' | 'spark' | 'glitchLine' | 'coin';
  width?: number;
  height?: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  vy: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  revivesRemaining: number;
  hasOverchargeCore: boolean;
  overchargeActive: boolean;
  overchargeTimeRemaining: number;
  timeSurvived: number; // in seconds
  dodgesCount: number;
  glitchesSurvived: number;
  difficultyMultiplier: number;
  sparksCollected: number;
  coinsCollected: number;
  shieldTimeRemaining: number;
  speedTimeRemaining: number;
}
