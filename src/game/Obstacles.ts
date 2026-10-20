import { Obstacle, ObstacleKind, GlitchEvent } from '../types/game';
import { sound } from '../utils/audio';

let entityIdCounter = 1;

export function createPatito(playWidth: number, speedMultiplier: number): Obstacle {
  const width = 46;
  const height = 44;
  const startX = Math.random() * (playWidth - width - 40) + 20 + width / 2;

  return {
    id: entityIdCounter++,
    kind: 'patito',
    x: startX,
    y: -height,
    width,
    height,
    radius: 22,
    vx: (Math.random() > 0.5 ? 1 : -1) * (60 + Math.random() * 40) * speedMultiplier,
    vy: (150 + Math.random() * 60) * speedMultiplier,
    rotation: 0,
    rotSpeed: 0,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: Math.random() * Math.PI * 2,
    zigzagDirection: Math.random() > 0.5 ? 1 : -1,
    nextTurnTimer: 0.8 + Math.random() * 0.9,
  };
}

export function createPastel(playWidth: number, speedMultiplier: number, playerX: number): Obstacle {
  const width = 50;
  const height = 48;
  const startX = Math.random() * (playWidth - width - 40) + 20 + width / 2;
  const driftDirection = playerX > startX ? 1 : -1;

  return {
    id: entityIdCounter++,
    kind: 'pastel',
    x: startX,
    y: -height,
    width,
    height,
    radius: 24,
    vx: driftDirection * (40 + Math.random() * 35) * speedMultiplier,
    vy: (120 + Math.random() * 40) * speedMultiplier,
    rotation: 0,
    rotSpeed: 0,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
    jumpProgress: 0,
    jumpHeight: 30,
    targetXDrift: driftDirection,
  };
}

export function createTostadora(playWidth: number, speedMultiplier: number): Obstacle {
  const width = 52;
  const height = 46;
  const startX = Math.random() * (playWidth - width - 40) + 20 + width / 2;

  return {
    id: entityIdCounter++,
    kind: 'tostadora',
    x: startX,
    y: -height,
    width,
    height,
    radius: 25,
    vx: (Math.random() - 0.5) * 60 * speedMultiplier,
    vy: (130 + Math.random() * 50) * speedMultiplier,
    rotation: 0,
    rotSpeed: 0,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
    shakeAmount: 0,
    hasFiredToast: false,
    shootCooldown: 1.2 + Math.random() * 1.0,
  };
}

export function createToastProjectile(x: number, y: number, dirX: number): Obstacle {
  return {
    id: entityIdCounter++,
    kind: 'tostada',
    x,
    y,
    width: 28,
    height: 28,
    radius: 14,
    vx: dirX * (110 + Math.random() * 50),
    vy: -120 - Math.random() * 60,
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 8,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
  };
}

export function createSparkBonus(playWidth: number): Obstacle {
  const width = 28;
  const height = 28;
  const startX = Math.random() * (playWidth - width - 60) + 30 + width / 2;

  return {
    id: entityIdCounter++,
    kind: 'spark',
    x: startX,
    y: -height,
    width,
    height,
    radius: 14,
    vx: (Math.random() - 0.5) * 30,
    vy: 110 + Math.random() * 30,
    rotation: 0,
    rotSpeed: 2.5,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
  };
}

export function createCoin(playWidth: number): Obstacle {
  const width = 26;
  const height = 26;
  const startX = Math.random() * (playWidth - width - 60) + 30 + width / 2;

  return {
    id: entityIdCounter++,
    kind: 'coin',
    x: startX,
    y: -height,
    width,
    height,
    radius: 13,
    vx: (Math.random() - 0.5) * 20,
    vy: 120 + Math.random() * 30,
    rotation: 0,
    rotSpeed: 4.0, // spinning coin effect
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
  };
}

export function createShieldPowerUp(playWidth: number): Obstacle {
  const width = 34;
  const height = 34;
  const startX = Math.random() * (playWidth - width - 60) + 30 + width / 2;

  return {
    id: entityIdCounter++,
    kind: 'powerup_shield',
    x: startX,
    y: -height,
    width,
    height,
    radius: 18,
    vx: (Math.random() - 0.5) * 20,
    vy: 100 + Math.random() * 25,
    rotation: 0,
    rotSpeed: 1.5,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
  };
}

export function createSpeedPowerUp(playWidth: number): Obstacle {
  const width = 34;
  const height = 34;
  const startX = Math.random() * (playWidth - width - 60) + 30 + width / 2;

  return {
    id: entityIdCounter++,
    kind: 'powerup_speed',
    x: startX,
    y: -height,
    width,
    height,
    radius: 18,
    vx: (Math.random() - 0.5) * 20,
    vy: 100 + Math.random() * 25,
    rotation: 0,
    rotSpeed: -1.5,
    markedForDeletion: false,
    stateTimer: 0,
    animFrame: 0,
    phase: 0,
  };
}

export function updateObstacle(
  obs: Obstacle,
  dt: number,
  playWidth: number,
  playHeight: number,
  glitch: GlitchEvent,
  spawnToastCallback: (toast: Obstacle) => void
) {
  obs.stateTimer += dt;
  obs.phase += dt * 4;

  let effectiveVy = obs.vy;
  let effectiveVx = obs.vx;

  if (glitch.active) {
    if (glitch.type === 'gravity') {
      effectiveVy =
        obs.kind === 'spark' || obs.kind === 'coin' || obs.kind.startsWith('powerup_')
          ? obs.vy * 0.5
          : -obs.vy * 0.5 + Math.sin(obs.phase) * 60;
    } else if (glitch.type === 'frenzy') {
      effectiveVy *= 1.35;
      effectiveVx *= 1.4;
    }
  }

  obs.x += effectiveVx * dt;
  obs.y += effectiveVy * dt;
  obs.rotation += obs.rotSpeed * dt;

  const pad = obs.radius + 6;
  if (obs.x < pad) {
    obs.x = pad;
    obs.vx = Math.abs(obs.vx);
    if (obs.zigzagDirection !== undefined) obs.zigzagDirection = 1;
  } else if (obs.x > playWidth - pad) {
    obs.x = playWidth - pad;
    obs.vx = -Math.abs(obs.vx);
    if (obs.zigzagDirection !== undefined) obs.zigzagDirection = -1;
  }

  switch (obs.kind) {
    case 'patito': {
      if (obs.nextTurnTimer !== undefined) {
        obs.nextTurnTimer -= dt;
        if (obs.nextTurnTimer <= 0) {
          obs.zigzagDirection = (obs.zigzagDirection || 1) * -1;
          obs.vx = obs.zigzagDirection * (140 + Math.random() * 80);
          obs.nextTurnTimer = 0.7 + Math.random() * 0.9;
          sound.playDuckSqueak();
        }
      }
      obs.rotation = Math.sin(obs.phase * 3) * 0.15;
      break;
    }

    case 'pastel': {
      const hopFrequency = 4;
      obs.jumpProgress = (Math.sin(obs.stateTimer * hopFrequency) + 1) / 2;
      obs.rotation = Math.sin(obs.stateTimer * hopFrequency * 0.5) * 0.1;
      if (Math.abs(obs.jumpProgress - 0.05) < 0.04) {
        sound.playCakeHop();
      }
      break;
    }

    case 'tostadora': {
      obs.shootCooldown = (obs.shootCooldown || 1.5) - dt;
      if (obs.shootCooldown <= 0.4 && !obs.hasFiredToast) {
        obs.shakeAmount = (0.4 - obs.shootCooldown) * 16;
      }
      if (obs.shootCooldown <= 0 && !obs.hasFiredToast) {
        obs.hasFiredToast = true;
        obs.shakeAmount = 0;
        sound.playToasterDing();
        spawnToastCallback(createToastProjectile(obs.x - 12, obs.y - 10, -1));
        spawnToastCallback(createToastProjectile(obs.x + 12, obs.y - 10, 1));
      }
      break;
    }

    case 'tostada': {
      obs.vy += 320 * dt;
      break;
    }

    case 'spark':
    case 'coin':
    case 'powerup_shield':
    case 'powerup_speed': {
      obs.x += Math.sin(obs.phase * 2) * 0.8;
      break;
    }
  }

  if (obs.y > playHeight + 90 || (glitch.active && glitch.type === 'gravity' && obs.y < -120)) {
    obs.markedForDeletion = true;
  }
}

export function renderObstacle(ctx: CanvasRenderingContext2D, obs: Obstacle, isGlitching: boolean) {
  ctx.save();
  ctx.translate(obs.x, obs.y);

  if (obs.rotation !== 0 && obs.kind !== 'coin') {
    ctx.rotate(obs.rotation);
  }

  if (isGlitching && Math.random() < 0.25) {
    ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
  }

  switch (obs.kind) {
    case 'patito':
      renderPatito(ctx, obs);
      break;
    case 'pastel':
      renderPastel(ctx, obs);
      break;
    case 'tostadora':
      renderTostadora(ctx, obs);
      break;
    case 'tostada':
      renderToast(ctx, obs);
      break;
    case 'spark':
      renderSpark(ctx, obs);
      break;
    case 'coin':
      renderCoin(ctx, obs);
      break;
    case 'powerup_shield':
      renderShieldPowerUp(ctx, obs);
      break;
    case 'powerup_speed':
      renderSpeedPowerUp(ctx, obs);
      break;
  }

  ctx.restore();
}

function renderPatito(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.9, r * 0.8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd600';
  ctx.beginPath();
  ctx.ellipse(0, 4, r * 0.95, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c79c00';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffd600';
  ctx.beginPath();
  ctx.moveTo(r * 0.6, 2);
  ctx.lineTo(r * 1.1, -8);
  ctx.lineTo(r * 0.7, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffea00';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.45, r * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ff0077';
  ctx.beginPath();
  ctx.rect(-r * 0.85, -r * 0.75, r * 1.1, 7);
  ctx.fill();

  ctx.fillStyle = '#ff6b00';
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.35);
  ctx.quadraticCurveTo(-r * 1.25, -r * 0.25, -r * 0.75, -r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b84200';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#111116';
  ctx.beginPath();
  ctx.roundRect(-r * 0.65, -r * 0.55, 14, 9, 2);
  ctx.roundRect(-r * 0.25, -r * 0.55, 12, 9, 2);
  ctx.fill();
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function renderPastel(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  const hop = (obs.jumpProgress || 0) * 14;
  const legSwing = Math.sin(obs.stateTimer * 12) * 10;
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#18072b';
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(-10, r * 0.5 - hop);
  ctx.lineTo(-12 + legSwing, r * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.roundRect(-16 + legSwing, r * 0.9, 11, 6, 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(10, r * 0.5 - hop);
  ctx.lineTo(12 - legSwing, r * 0.95);
  ctx.stroke();
  ctx.fillStyle = '#ff0077';
  ctx.beginPath();
  ctx.roundRect(8 - legSwing, r * 0.9, 11, 6, 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, -hop);

  ctx.fillStyle = '#ffd180';
  ctx.beginPath();
  ctx.roundRect(-r * 0.85, 0, r * 1.7, r * 0.65, 4);
  ctx.fill();
  ctx.strokeStyle = '#e69500';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-r * 0.82, r * 0.22, r * 1.64, 5);

  ctx.fillStyle = '#ffe082';
  ctx.beginPath();
  ctx.roundRect(-r * 0.75, -r * 0.65, r * 1.5, r * 0.65, 4);
  ctx.fill();
  ctx.strokeStyle = '#e69500';
  ctx.stroke();

  ctx.fillStyle = '#ff2a70';
  ctx.beginPath();
  ctx.roundRect(-r * 0.8, -r * 0.72, r * 1.6, r * 0.35, [6, 6, 0, 0]);
  ctx.fill();

  [-6, 6].forEach((ex) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, -r * 0.15, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#18072b';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(ex, -r * 0.15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#d50000';
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderTostadora(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  const shake = (Math.random() - 0.5) * (obs.shakeAmount || 0);

  ctx.save();
  ctx.translate(shake, 0);

  const bodyGrad = ctx.createLinearGradient(-r * 0.9, -r * 0.8, r * 0.9, r * 0.8);
  bodyGrad.addColorStop(0, '#e0e7ec');
  bodyGrad.addColorStop(0.5, '#9aa5b1');
  bodyGrad.addColorStop(1, '#616e7c');

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-r * 0.85, -r * 0.7, r * 1.7, r * 1.4, 8);
  ctx.fill();
  ctx.strokeStyle = '#3e4c59';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#1f2933';
  ctx.beginPath();
  ctx.roundRect(-r * 0.65, -r * 0.8, r * 0.55, 6, 2);
  ctx.roundRect(r * 0.1, -r * 0.8, r * 0.55, 6, 2);
  ctx.fill();

  const coilColor = (obs.shakeAmount || 0) > 2 ? '#ff1744' : '#ff9100';
  ctx.fillStyle = coilColor;
  ctx.fillRect(-r * 0.6, -r * 0.77, r * 0.45, 2.5);
  ctx.fillRect(r * 0.15, -r * 0.77, r * 0.45, 2.5);

  ctx.restore();
}

function renderToast(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  ctx.fillStyle = '#d4883b';
  ctx.beginPath();
  ctx.roundRect(-r, -r, r * 2, r * 2, 4);
  ctx.fill();
  ctx.strokeStyle = '#8d4004';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fce0aa';
  ctx.beginPath();
  ctx.roundRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5, 3);
  ctx.fill();
}

function renderSpark(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  const pulse = Math.sin(obs.phase * 6) * 3;

  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r + 8);
  grad.addColorStop(0, 'rgba(0, 255, 230, 0.9)');
  grad.addColorStop(0.5, 'rgba(180, 0, 255, 0.5)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r + 8 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + obs.phase * 2;
    const aMid = a + Math.PI / 4;
    const lenOut = r + pulse;
    const lenIn = r * 0.35;
    if (i === 0) {
      ctx.moveTo(Math.cos(a) * lenOut, Math.sin(a) * lenOut);
    } else {
      ctx.lineTo(Math.cos(a) * lenOut, Math.sin(a) * lenOut);
    }
    ctx.lineTo(Math.cos(aMid) * lenIn, Math.sin(aMid) * lenIn);
  }
  ctx.closePath();
  ctx.fill();
}

function renderCoin(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  const spinScale = Math.abs(Math.cos(obs.stateTimer * 6));

  ctx.save();
  ctx.scale(Math.max(0.2, spinScale), 1);

  // Glow halo
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r + 6);
  grad.addColorStop(0, 'rgba(255, 215, 0, 0.85)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
  ctx.fill();

  // Coin body
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner rim
  ctx.strokeStyle = '#ffec8b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  // Dollar / Star symbol in center
  ctx.fillStyle = '#b8860b';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 1);

  ctx.restore();
}

function renderShieldPowerUp(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  const pulse = Math.sin(obs.phase * 6) * 3;

  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r + 10);
  grad.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
  grad.addColorStop(0.6, 'rgba(30, 58, 138, 0.5)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r + 10 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#60a5fa';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(8, -4);
  ctx.lineTo(8, 4);
  ctx.quadraticCurveTo(0, 12, 0, 12);
  ctx.quadraticCurveTo(0, 12, -8, 4);
  ctx.lineTo(-8, -4);
  ctx.closePath();
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
  ctx.stroke();
}

function renderSpeedPowerUp(ctx: CanvasRenderingContext2D, obs: Obstacle) {
  const r = obs.radius;
  const pulse = Math.sin(obs.phase * 6) * 3;

  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, r + 10);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
  grad.addColorStop(0.6, 'rgba(6, 78, 59, 0.5)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r + 10 + pulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(2, -11);
  ctx.lineTo(-6, -1);
  ctx.lineTo(1, -1);
  ctx.lineTo(-2, 11);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1;
  ctx.stroke();
}
