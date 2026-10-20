import { Player, CharacterId, CHARACTERS } from '../types/game';

export class ChispaEntity {
  public data: Player;
  private blinkState: number = 0;
  private blinkCountdown: number = 2.5;

  constructor(playWidth: number, playHeight: number, characterId: CharacterId = 'chispa', equippedTrail: string = '') {
    this.data = {
      x: playWidth / 2,
      y: playHeight - 160,
      radius: 28,
      targetX: playWidth / 2,
      vx: 0,
      jigglePhase: 0,
      squashX: 1,
      squashY: 1,
      invulnerableTime: 0,
      shieldActive: false,
      speedBoostActive: false,
      isHit: false,
      hitTimer: 0,
      blinkTimer: 0,
      lookDirection: 0,
      panicLevel: 0,
      characterId,
      equippedTrail,
    };
  }

  public reset(playWidth: number, playHeight: number, characterId?: CharacterId, equippedTrail?: string) {
    this.data.x = playWidth / 2;
    this.data.y = playHeight - 160;
    this.data.targetX = playWidth / 2;
    this.data.vx = 0;
    this.data.jigglePhase = 0;
    this.data.squashX = 1;
    this.data.squashY = 1;
    this.data.invulnerableTime = 0;
    this.data.shieldActive = false;
    this.data.speedBoostActive = false;
    this.data.isHit = false;
    this.data.hitTimer = 0;
    this.data.panicLevel = 0;
    if (characterId) {
      this.data.characterId = characterId;
    }
    if (equippedTrail !== undefined) {
      this.data.equippedTrail = equippedTrail;
    }
  }

  public setTargetX(targetX: number, playWidth: number) {
    const minX = this.data.radius + 15;
    const maxX = playWidth - this.data.radius - 15;
    this.data.targetX = Math.max(minX, Math.min(maxX, targetX));
  }

  public hit() {
    if (this.data.shieldActive) {
      this.data.shieldActive = false;
      this.data.invulnerableTime = 1.0;
      return;
    }

    this.data.isHit = true;
    this.data.hitTimer = 0.4;
    this.data.invulnerableTime = 1.6;
    this.data.squashX = 1.4;
    this.data.squashY = 0.6;
  }

  public update(dt: number, playWidth: number, closestHazardDist: number) {
    const p = this.data;

    const lerpSpeed = p.speedBoostActive ? 26 : 16;
    const dx = p.targetX - p.x;
    p.vx = dx * lerpSpeed;
    p.x += p.vx * dt;

    const minX = p.radius + 15;
    const maxX = playWidth - p.radius - 15;
    p.x = Math.max(minX, Math.min(maxX, p.x));

    p.lookDirection = Math.max(-1, Math.min(1, p.vx / 300));

    p.jigglePhase += dt * (p.speedBoostActive ? 14 : 8);
    const naturalSquash = Math.sin(p.jigglePhase) * 0.06;

    const speedRatio = Math.min(1, Math.abs(p.vx) / 600);
    const targetSquashX = 1 + speedRatio * 0.2 + naturalSquash;
    const targetSquashY = 1 - speedRatio * 0.15 - naturalSquash;

    p.squashX += (targetSquashX - p.squashX) * Math.min(1, dt * 14);
    p.squashY += (targetSquashY - p.squashY) * Math.min(1, dt * 14);

    if (p.isHit) {
      p.hitTimer -= dt;
      if (p.hitTimer <= 0) {
        p.isHit = false;
      }
    }

    if (p.invulnerableTime > 0) {
      p.invulnerableTime -= dt;
    }

    if (closestHazardDist < 150) {
      p.panicLevel = Math.min(1, p.panicLevel + dt * 6);
    } else {
      p.panicLevel = Math.max(0, p.panicLevel - dt * 3);
    }

    this.blinkCountdown -= dt;
    if (this.blinkCountdown <= 0) {
      this.blinkState = 1;
      p.blinkTimer += dt;
      if (p.blinkTimer > 0.14) {
        this.blinkState = 0;
        p.blinkTimer = 0;
        this.blinkCountdown = 2 + Math.random() * 3;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    const p = this.data;
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.speedBoostActive) {
      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (p.shieldActive) {
      ctx.save();
      const shieldAngle = (performance.now() / 200) % (Math.PI * 2);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.55, shieldAngle, shieldAngle + Math.PI * 1.5);
      ctx.stroke();

      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, p.radius * 1.35, -shieldAngle, -shieldAngle + Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    if (p.invulnerableTime > 0 && !p.shieldActive) {
      const flash = Math.sin(p.invulnerableTime * 28) > 0;
      ctx.globalAlpha = flash ? 0.35 : 0.85;
    }

    const tilt = (p.vx / 500) * 0.18;
    ctx.rotate(tilt);
    ctx.scale(p.squashX, p.squashY);

    ctx.save();
    ctx.fillStyle = 'rgba(10, 4, 25, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, p.radius * 0.95, p.radius * 0.85, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const r = p.radius;
    const charInfo =
      CHARACTERS.find((c) => c.id === p.characterId) ||
      (p.characterId === 'radioactivo'
        ? { colorCore: '#a7f3d0', colorPrimary: '#10b981', colorSecondary: '#065f46' }
        : p.characterId === 'modo_fuego'
        ? { colorCore: '#ffea00', colorPrimary: '#ff6b00', colorSecondary: '#ff0055' }
        : CHARACTERS[0]);

    const bodyGradient = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 2, 0, 0, r * 1.2);

    if (p.isHit) {
      bodyGradient.addColorStop(0, '#ffffff');
      bodyGradient.addColorStop(0.4, '#ff2255');
      bodyGradient.addColorStop(1, '#990022');
    } else {
      bodyGradient.addColorStop(0, charInfo.colorCore);
      bodyGradient.addColorStop(0.35, charInfo.colorPrimary);
      bodyGradient.addColorStop(0.75, charInfo.colorSecondary);
      bodyGradient.addColorStop(1, '#18072b');
    }

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();

    const tuftLag = -p.vx * 0.02;
    ctx.moveTo(-r * 0.85, 0);
    ctx.bezierCurveTo(-r * 0.9, -r * 0.7, -r * 0.45, -r * 1.15, tuftLag, -r * 1.25);
    ctx.bezierCurveTo(r * 0.45, -r * 1.15, r * 0.9, -r * 0.7, r * 0.85, 0);
    ctx.bezierCurveTo(r * 0.8, r * 0.95, -r * 0.8, r * 0.95, -r * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = p.isHit ? '#ffffff' : charInfo.colorCore;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.save();
    const coreGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.4);
    coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    coreGrad.addColorStop(0.5, p.isHit ? 'rgba(255, 100, 100, 0.5)' : 'rgba(255, 255, 255, 0.4)');
    coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.6, r * 0.28, r * 0.14, -Math.PI / 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.75, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.renderEyes(ctx, r, p);
    this.renderMouth(ctx, r, p);

    ctx.fillStyle = 'rgba(255, 80, 180, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.52, r * 0.12, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(r * 0.52, r * 0.12, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderEyes(ctx: CanvasRenderingContext2D, r: number, p: Player) {
    const eyeOffsetX = r * 0.32;
    const eyeOffsetY = -r * 0.15;
    const eyeRadius = r * 0.28;
    const lookX = p.lookDirection * 4;
    const lookY = p.panicLevel > 0.5 ? -4 : 1;

    if (p.isHit) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      [-eyeOffsetX, eyeOffsetX].forEach((ex) => {
        ctx.beginPath();
        ctx.moveTo(ex - 6, eyeOffsetY - 6);
        ctx.lineTo(ex + 6, eyeOffsetY + 6);
        ctx.moveTo(ex + 6, eyeOffsetY - 6);
        ctx.lineTo(ex - 6, eyeOffsetY + 6);
        ctx.stroke();
      });
      return;
    }

    if (this.blinkState === 1) {
      ctx.strokeStyle = '#1e0c38';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      [-eyeOffsetX, eyeOffsetX].forEach((ex) => {
        ctx.beginPath();
        ctx.arc(ex, eyeOffsetY, 7, 0.2, Math.PI - 0.2);
        ctx.stroke();
      });
      return;
    }

    [-eyeOffsetX, eyeOffsetX].forEach((ex) => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      const heightMultiplier = p.panicLevel > 0.5 ? 1.25 : 1.0;
      ctx.ellipse(ex, eyeOffsetY, eyeRadius, eyeRadius * heightMultiplier, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#160829';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#140624';
      ctx.beginPath();
      const pupilR = p.panicLevel > 0.6 ? eyeRadius * 0.4 : eyeRadius * 0.6;
      ctx.arc(ex + lookX, eyeOffsetY + lookY, pupilR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex + lookX - pupilR * 0.35, eyeOffsetY + lookY - pupilR * 0.35, pupilR * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ex + lookX + pupilR * 0.3, eyeOffsetY + lookY + pupilR * 0.3, pupilR * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private renderMouth(ctx: CanvasRenderingContext2D, r: number, p: Player) {
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    if (p.isHit) {
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-7, r * 0.35);
      ctx.quadraticCurveTo(0, r * 0.22, 7, r * 0.35);
      ctx.stroke();
    } else if (p.panicLevel > 0.6) {
      ctx.fillStyle = '#420b57';
      ctx.strokeStyle = '#1a0424';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.34, 4.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#22083b';
      ctx.beginPath();
      ctx.arc(0, r * 0.22, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
