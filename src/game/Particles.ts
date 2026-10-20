import { Particle, FloatingText } from '../types/game';

let particleIdCounter = 1;
let floatingTextIdCounter = 1;

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }

  public emitJellyTrail(x: number, y: number, equippedTrail: string) {
    if (Math.random() > 0.4) return;
    
    if (equippedTrail === 'estela_glitch') {
      this.particles.push({
        id: particleIdCounter++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + 12 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 40,
        vy: Math.random() * 25 + 15,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#00ffff' : '#ff007f',
        alpha: 0.8,
        decay: 2.2,
        shape: 'spark',
      });
    } else {
      this.particles.push({
        id: particleIdCounter++,
        x: x + (Math.random() - 0.5) * 16,
        y: y + 10 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 30,
        vy: Math.random() * 20 + 10,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#00e5ff' : '#d500f9',
        alpha: 0.6,
        decay: 1.8,
        shape: 'circle',
      });
    }
  }

  public emitHitSplatter(x: number, y: number) {
    const colors = ['#ff0055', '#ffffff', '#00f5ff', '#b5179e'];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 260;
      this.particles.push({
        id: particleIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 1.2 + Math.random() * 0.8,
        shape: 'circle',
      });
    }
  }

  public emitPickupSparks(x: number, y: number, isCoin: boolean = false) {
    const colors = isCoin ? ['#ffd700', '#ffea00', '#ffffff', '#ff9100'] : ['#00ffff', '#ffd600', '#ffffff', '#76ff03'];
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      this.particles.push({
        id: particleIdCounter++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 2.0,
        shape: 'spark',
      });
    }
  }

  public emitGlitchSlices(playWidth: number, playHeight: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        id: particleIdCounter++,
        x: Math.random() * playWidth,
        y: Math.random() * playHeight,
        vx: (Math.random() - 0.5) * 400,
        vy: 0,
        size: 2,
        color: Math.random() > 0.5 ? '#00ffff' : '#ff0055',
        alpha: 0.8,
        decay: 4.5,
        shape: 'glitchLine',
        width: 40 + Math.random() * 120,
        height: 2 + Math.random() * 6,
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#00ffff') {
    this.floatingTexts.push({
      id: floatingTextIdCounter++,
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1,
      vy: -55,
    });
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.shape === 'circle' || p.shape === 'crumb') {
        p.vy += 220 * dt;
      }
      p.alpha -= p.decay * dt;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy * dt;
      t.alpha -= dt * 1.1;
      t.scale = Math.min(1.4, t.scale + dt * 0.8);

      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle' || p.shape === 'crumb') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.shape === 'glitchLine') {
        ctx.fillRect(p.x, p.y, p.width || 40, p.height || 3);
      }

      ctx.restore();
    }

    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.fillStyle = t.color;
      ctx.font = '900 16px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;

      ctx.translate(t.x, t.y);
      ctx.scale(t.scale, t.scale);
      ctx.fillText(t.text, 0, 0);

      ctx.restore();
    }
  }
}
