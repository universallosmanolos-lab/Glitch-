import {
  GameState,
  GlitchEvent,
  GlitchType,
  Obstacle,
  GameStats,
  CharacterId,
} from '../types/game';
import { ChispaEntity } from './Chispa';
import {
  createPatito,
  createPastel,
  createTostadora,
  createSparkBonus,
  createCoin,
  createShieldPowerUp,
  createSpeedPowerUp,
  updateObstacle,
  renderObstacle,
} from './Obstacles';
import { ParticleSystem } from './Particles';
import { sound } from '../utils/audio';
import { progression } from './Progression';
import { economy } from './Economy';

export class GameEngine {
  public playWidth: number = 440;
  public playHeight: number = 780;

  public state: GameState = 'menu';
  public chispa: ChispaEntity;
  public obstacles: Obstacle[] = [];
  public particles: ParticleSystem;
  public selectedCharacter: CharacterId = 'chispa';

  public hasPendingOverchargeCore: boolean = false;

  public stats: GameStats = {
    score: 0,
    highScore: 0,
    lives: 2,
    maxLives: 2,
    revivesRemaining: 2,
    hasOverchargeCore: false,
    overchargeActive: false,
    overchargeTimeRemaining: 0,
    timeSurvived: 0,
    dodgesCount: 0,
    glitchesSurvived: 0,
    difficultyMultiplier: 1.0,
    sparksCollected: 0,
    coinsCollected: 0,
    shieldTimeRemaining: 0,
    speedTimeRemaining: 0,
  };

  public glitch: GlitchEvent = {
    active: false,
    type: 'gravity',
    title: '',
    description: '',
    duration: 7,
    remaining: 0,
    warningTime: 0,
  };

  // Upgrades state during run
  public dashCooldownTimer: number = 0;
  public chaosControlActive: boolean = false;
  public chaosControlTimer: number = 0;

  private spawnCooldown: number = 1.0;
  private sparkCooldown: number = 5.0;
  private coinCooldown: number = 4.0;
  private powerUpCooldown: number = 10.0;
  private glitchCooldown: number = 22.0;
  private backgroundScroll: number = 0;
  private screenShake: number = 0;
  private nearMissRegistered: Set<number> = new Set();
  private lastMissionTimeTracker: number = 0;

  private rewardSurvive60Claimed: boolean = false;
  private rewardHighScoreClaimed: boolean = false;

  public onStateChange?: (state: GameState) => void;
  public onStatsUpdate?: (stats: GameStats) => void;
  public onGlitchUpdate?: (glitch: GlitchEvent) => void;

  constructor() {
    const skin = economy.getEquippedSkin() as CharacterId;
    const trail = economy.getEquippedTrail();
    this.selectedCharacter = skin;
    this.chispa = new ChispaEntity(this.playWidth, this.playHeight, skin, trail);
    this.particles = new ParticleSystem();

    const storedBest = localStorage.getItem('glitch_high_score');
    if (storedBest) {
      this.stats.highScore = parseInt(storedBest, 10) || 0;
    }
  }

  public refreshEquippedGear() {
    const skin = economy.getEquippedSkin() as CharacterId;
    const trail = economy.getEquippedTrail();
    this.selectedCharacter = skin;
    this.chispa.data.characterId = skin;
    this.chispa.data.equippedTrail = trail;
  }

  public setCharacter(characterId: CharacterId) {
    this.selectedCharacter = characterId;
    this.chispa.data.characterId = characterId;
    economy.equipItem(characterId);
  }

  public triggerDash() {
    if (this.state !== 'playing' || this.dashCooldownTimer > 0) return;
    const upgrades = progression.getProfile().upgrades;
    const dashLevel = upgrades['electric_dash']?.level || 0;
    if (dashLevel <= 0) return;

    this.dashCooldownTimer = 4.0; // 4s cooldown
    sound.playPowerUp();
    this.chispa.data.invulnerableTime = 0.8; // i-frames during dash

    // Quick burst left or right depending on look direction
    const burst = this.chispa.data.lookDirection >= 0 ? 120 : -120;
    this.chispa.setTargetX(this.chispa.data.x + burst, this.playWidth);
    this.particles.addFloatingText(this.chispa.data.x, this.chispa.data.y - 30, '⚡ ¡IMPULSO!', '#fde047');
  }

  public triggerChaosControl() {
    if (this.state !== 'playing' || this.chaosControlActive) return;
    const upgrades = progression.getProfile().upgrades;
    const chaosLevel = upgrades['chaos_control']?.level || 0;
    if (chaosLevel <= 0 || !this.glitch.active) return;

    this.chaosControlActive = true;
    this.chaosControlTimer = 4.0; // slow down obstacles for 4s
    sound.playPowerUp();
    this.particles.addFloatingText(this.chispa.data.x, this.chispa.data.y - 30, '🌀 ¡CONTROL DEL CAOS!', '#10b981');
  }

  public grantOverchargeCore(): boolean {
    if (this.hasPendingOverchargeCore || this.stats.hasOverchargeCore) {
      return false;
    }
    this.hasPendingOverchargeCore = true;
    this.stats.hasOverchargeCore = true;
    sound.playPowerUp();
    this.notifyChanges();
    return true;
  }

  public activateOvercharge(): boolean {
    if (this.state !== 'playing' || !this.stats.hasOverchargeCore || this.stats.overchargeActive) {
      return false;
    }
    this.stats.hasOverchargeCore = false;
    this.stats.overchargeActive = true;
    this.stats.overchargeTimeRemaining = 20.0;
    this.chispa.data.overchargeActive = true;
    this.chispa.data.invulnerableTime = 20.0;
    sound.playPowerUp();
    this.screenShake = 12;
    this.particles.emitPickupSparks(this.chispa.data.x, this.chispa.data.y);
    this.particles.addFloatingText(this.chispa.data.x, this.chispa.data.y - 45, '⚡ ¡SOBRECARGA ACTIVA (20s)!', '#38bdf8');
    this.notifyChanges();
    return true;
  }

  public startGame() {
    sound.userGesture();
    sound.playStart();
    sound.startBGM();

    this.refreshEquippedGear();

    this.state = 'playing';
    this.stats.score = 0;
    // Exactly 2 initial lives per run
    this.stats.lives = 2;
    this.stats.maxLives = 2;
    // Exactly 2 revives available per run
    this.stats.revivesRemaining = 2;

    // Overcharge core: single use per run, does not accumulate across runs
    this.stats.hasOverchargeCore = this.hasPendingOverchargeCore;
    this.hasPendingOverchargeCore = false;
    this.stats.overchargeActive = false;
    this.stats.overchargeTimeRemaining = 0;

    this.stats.timeSurvived = 0;
    this.stats.dodgesCount = 0;
    this.stats.glitchesSurvived = 0;
    this.stats.sparksCollected = 0;
    this.stats.coinsCollected = 0;
    this.stats.difficultyMultiplier = 1.0;
    this.stats.shieldTimeRemaining = 0;
    this.stats.speedTimeRemaining = 0;
    this.dashCooldownTimer = 0;
    this.chaosControlActive = false;
    this.chaosControlTimer = 0;

    this.obstacles = [];
    this.nearMissRegistered.clear();
    this.particles.clear();
    this.chispa.reset(
      this.playWidth,
      this.playHeight,
      economy.getEquippedSkin() as CharacterId,
      economy.getEquippedTrail()
    );

    this.spawnCooldown = 0.8;
    this.sparkCooldown = 4.0;
    this.coinCooldown = 3.5;
    this.powerUpCooldown = 9.0;
    this.glitchCooldown = 20.0;
    this.screenShake = 0;
    this.lastMissionTimeTracker = 0;
    this.rewardSurvive60Claimed = false;
    this.rewardHighScoreClaimed = false;

    this.glitch.active = false;
    this.glitch.warningTime = 0;
    this.glitch.remaining = 0;

    this.notifyChanges();
  }

  public pauseGame() {
    if (this.state === 'playing') {
      this.state = 'paused';
      sound.stopBGM();
      this.notifyChanges();
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      sound.userGesture();
      sound.startBGM();
      this.state = 'playing';
      this.notifyChanges();
    }
  }

  public returnToMenu() {
    this.state = 'menu';
    this.glitch.active = false;
    this.glitch.warningTime = 0;
    this.stats.lives = 2;
    this.stats.maxLives = 2;
    this.stats.revivesRemaining = 2;
    this.stats.overchargeActive = false;
    this.stats.overchargeTimeRemaining = 0;
    sound.stopBGM();
    this.notifyChanges();
  }

  public restartGame() {
    this.startGame();
  }

  public setPointerTarget(targetX: number) {
    this.chispa.setTargetX(targetX, this.playWidth);
  }

  public nudgeHorizontal(delta: number) {
    const mult = this.chispa.data.speedBoostActive ? 1.8 : 1.0;
    this.chispa.setTargetX(this.chispa.data.targetX + delta * mult, this.playWidth);
  }

  public reviveGame(): boolean {
    if (this.state !== 'gameover' || this.stats.revivesRemaining <= 0) {
      return false;
    }
    // Exactly 1 life restored per revive
    this.stats.revivesRemaining = Math.max(0, this.stats.revivesRemaining - 1);
    this.stats.lives = 1;
    // 2 seconds of invulnerability to prevent immediate defeat
    this.chispa.data.invulnerableTime = 2.0;
    this.state = 'playing';
    sound.startBGM();
    this.particles.emitPickupSparks(this.chispa.data.x, this.chispa.data.y);
    this.particles.addFloatingText(this.chispa.data.x, this.chispa.data.y - 40, '❤️ ¡REVIVIDO! (1 VIDA)', '#ff007f');
    this.notifyChanges();
    return true;
  }

  private notifyChanges() {
    this.onStateChange?.(this.state);
    this.onStatsUpdate?.({ ...this.stats });
    this.onGlitchUpdate?.({ ...this.glitch });
  }

  public update(dt: number) {
    if (this.state !== 'playing') {
      if (this.state === 'menu') {
        this.chispa.update(dt, this.playWidth, 999);
        this.particles.update(dt);
      }
      return;
    }

    const safeDt = Math.min(dt, 0.05);

    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer = Math.max(0, this.dashCooldownTimer - safeDt);
    }
    if (this.chaosControlTimer > 0) {
      this.chaosControlTimer = Math.max(0, this.chaosControlTimer - safeDt);
      if (this.chaosControlTimer === 0) {
        this.chaosControlActive = false;
      }
    }

    this.stats.timeSurvived += safeDt;
    // Super Velocidad doubles score accumulation (20 pts/sec instead of 10)
    const scoreRate = this.chispa.data.speedBoostActive ? 20 : 10;
    this.stats.score += safeDt * scoreRate;
    this.stats.difficultyMultiplier = 1.0 + Math.min(1.2, this.stats.timeSurvived / 100);

    if (this.stats.timeSurvived >= 60 && !this.rewardSurvive60Claimed) {
      this.rewardSurvive60Claimed = true;
      if (economy.claimMilestone('survive_60s', 15)) {
        this.particles.addFloatingText(this.chispa.data.x, this.chispa.data.y - 45, '+15 🪙 ¡LOGRO 60S!', '#ffd700');
        sound.playPowerUp();
      }
    }

    this.lastMissionTimeTracker += safeDt;
    if (this.lastMissionTimeTracker >= 1.0) {
      progression.addMissionProgress('survive_time', 1);
      this.lastMissionTimeTracker = 0;
    }

    if (this.stats.shieldTimeRemaining > 0) {
      this.stats.shieldTimeRemaining = Math.max(0, this.stats.shieldTimeRemaining - safeDt);
      if (this.stats.shieldTimeRemaining === 0) {
        this.chispa.data.shieldActive = false;
      }
    }
    if (this.stats.speedTimeRemaining > 0) {
      this.stats.speedTimeRemaining = Math.max(0, this.stats.speedTimeRemaining - safeDt);
      if (this.stats.speedTimeRemaining === 0) {
        this.chispa.data.speedBoostActive = false;
      }
    }
    if (this.stats.overchargeTimeRemaining > 0) {
      this.stats.overchargeTimeRemaining = Math.max(0, this.stats.overchargeTimeRemaining - safeDt);
      this.chispa.data.overchargeActive = true;
      if (this.stats.overchargeTimeRemaining === 0) {
        this.stats.overchargeActive = false;
        this.chispa.data.overchargeActive = false;
        this.particles.addFloatingText(this.chispa.data.x, this.chispa.data.y - 30, '⚡ SOBRECARGA AGOTADA', '#94a3b8');
      }
    }

    // Background scrolls much faster during Super Velocidad giving high-velocity feeling
    const scrollSpeed = this.chispa.data.speedBoostActive ? 300 : 120;
    this.backgroundScroll = (this.backgroundScroll + scrollSpeed * safeDt * this.stats.difficultyMultiplier) % 60;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - safeDt * 30);
    }

    let closestDist = 999;
    for (const obs of this.obstacles) {
      // Coin Magnet Upgrade logic AND Super Velocidad slipstream suction
      const upgrades = progression.getProfile().upgrades;
      const magnetLevel = upgrades['magnet']?.level || 0;
      const hasSuperSpeedPull = this.chispa.data.speedBoostActive;

      if ((magnetLevel > 0 || hasSuperSpeedPull) && (obs.kind === 'coin' || (hasSuperSpeedPull && obs.kind === 'spark'))) {
        const dx = this.chispa.data.x - obs.x;
        const dy = this.chispa.data.y - obs.y;
        const d = Math.hypot(dx, dy);
        const magnetRange = hasSuperSpeedPull ? 220 : 100 + magnetLevel * 60;
        if (d < magnetRange) {
          const pullForce = hasSuperSpeedPull ? 520 : 350;
          obs.vx += (dx / d) * pullForce * safeDt;
          obs.vy += (dy / d) * pullForce * safeDt;
        }
      }

      if (obs.kind !== 'spark' && obs.kind !== 'coin' && !obs.kind.startsWith('powerup_')) {
        const dx = obs.x - this.chispa.data.x;
        const dy = obs.y - this.chispa.data.y;
        const d = Math.hypot(dx, dy);
        if (d < closestDist) closestDist = d;
      }
    }

    this.chispa.update(safeDt, this.playWidth, closestDist);
    this.particles.emitJellyTrail(this.chispa.data.x, this.chispa.data.y, this.chispa.data.equippedTrail);

    this.updateGlitchCycle(safeDt);
    this.updateSpawners(safeDt);

    // BULLET-TIME: While in Super Velocidad, obstacles move in slow motion (55% speed)!
    let speedMod = this.chaosControlActive ? 0.5 : 1.0;
    if (this.chispa.data.speedBoostActive) {
      speedMod *= 0.55;
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      updateObstacle(
        obs,
        safeDt * speedMod,
        this.playWidth,
        this.playHeight,
        this.glitch,
        (toast) => this.obstacles.push(toast)
      );

      this.checkCollision(obs);

      if (obs.markedForDeletion) {
        this.nearMissRegistered.delete(obs.id);
        this.obstacles.splice(i, 1);
      }
    }

    this.particles.update(safeDt);
    this.notifyChanges();
  }

  private updateGlitchCycle(dt: number) {
    if (!this.glitch.active && this.glitch.warningTime <= 0) {
      this.glitchCooldown -= dt;
      if (this.glitchCooldown <= 0) {
        this.glitch.warningTime = 2.5;
        const types: GlitchType[] = ['gravity', 'duplication', 'frenzy', 'neon'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        this.glitch.type = chosen;

        switch (chosen) {
          case 'gravity':
            this.glitch.title = '¡GRAVEDAD DISTORSIONADA!';
            this.glitch.description = 'Los objetos flotan y suben de manera caótica.';
            break;
          case 'duplication':
            this.glitch.title = '¡DUPLICACIÓN SURREALISTA!';
            this.glitch.description = 'Patitos y pasteles se multiplican.';
            break;
          case 'frenzy':
            this.glitch.title = '¡FRENESÍ DE TOSTADAS!';
            this.glitch.description = 'Tostadoras hiperactivas disparando sin parar.';
            break;
          case 'neon':
            this.glitch.title = '¡TORMENTA DE CHISPAS!';
            this.glitch.description = 'Falla digital con lluvia de bonus extra.';
            break;
        }

        sound.playGlitchWarning();
      }
    } else if (this.glitch.warningTime > 0) {
      this.glitch.warningTime -= dt;
      if (Math.random() < 0.4) {
        this.particles.emitGlitchSlices(this.playWidth, this.playHeight);
      }
      if (this.glitch.warningTime <= 0) {
        this.glitch.active = true;
        this.glitch.duration = 7.5;
        this.glitch.remaining = 7.5;
        this.screenShake = 14;
        sound.playGlitchTrigger();

        if (this.glitch.type === 'duplication') {
          for (let k = 0; k < 3; k++) {
            this.obstacles.push(createPatito(this.playWidth, this.stats.difficultyMultiplier));
          }
        }
      }
    } else if (this.glitch.active) {
      this.glitch.remaining -= dt;
      if (Math.random() < 0.25) {
        this.particles.emitGlitchSlices(this.playWidth, this.playHeight);
      }

      if (this.glitch.remaining <= 0) {
        this.glitch.active = false;
        this.stats.glitchesSurvived += 1;
        this.stats.score += 200;
        this.glitchCooldown = 24.0 + Math.random() * 8;

        progression.addMissionProgress('survive_glitches', 1);

        sound.playGlitchEnd();
        this.particles.addFloatingText(
          this.chispa.data.x,
          this.chispa.data.y - 40,
          '+200 ¡SISTEMA RESTAURADO!',
          '#76ff03'
        );
      }
    }
  }

  private updateSpawners(dt: number) {
    this.spawnCooldown -= dt;
    if (this.spawnCooldown <= 0) {
      const minInterval = 0.65;
      const baseInterval = 1.35 / this.stats.difficultyMultiplier;
      this.spawnCooldown = Math.max(minInterval, baseInterval + (Math.random() - 0.5) * 0.3);

      const rand = Math.random();
      if (rand < 0.42) {
        this.obstacles.push(createPatito(this.playWidth, this.stats.difficultyMultiplier));
      } else if (rand < 0.76) {
        this.obstacles.push(
          createPastel(this.playWidth, this.stats.difficultyMultiplier, this.chispa.data.x)
        );
      } else {
        this.obstacles.push(createTostadora(this.playWidth, this.stats.difficultyMultiplier));
      }
    }

    this.sparkCooldown -= dt;
    if (this.sparkCooldown <= 0) {
      this.sparkCooldown = 6.0 + Math.random() * 4.0;
      this.obstacles.push(createSparkBonus(this.playWidth));
    }

    this.coinCooldown -= dt;
    if (this.coinCooldown <= 0) {
      this.coinCooldown = 4.0 + Math.random() * 3.0;
      this.obstacles.push(createCoin(this.playWidth));
    }

    this.powerUpCooldown -= dt;
    if (this.powerUpCooldown <= 0) {
      this.powerUpCooldown = 12.0 + Math.random() * 8.0;
      if (Math.random() > 0.5) {
        this.obstacles.push(createShieldPowerUp(this.playWidth));
      } else {
        this.obstacles.push(createSpeedPowerUp(this.playWidth));
      }
    }
  }

  private checkCollision(obs: Obstacle) {
    const p = this.chispa.data;
    const dx = obs.x - p.x;
    const dy = obs.y - p.y;
    const dist = Math.hypot(dx, dy);

    const hitDistance = (p.radius + obs.radius) * 0.78;

    if (obs.kind === 'spark') {
      if (dist < hitDistance + 10) {
        obs.markedForDeletion = true;
        this.stats.score += 100;
        this.stats.sparksCollected += 1;
        progression.addMissionProgress('collect_sparks', 1);
        sound.playPickup();
        this.particles.emitPickupSparks(obs.x, obs.y);
        this.particles.addFloatingText(obs.x, obs.y - 15, '+100 ¡CHISPA!', '#00ffff');
      }
      return;
    }

    if (obs.kind === 'coin') {
      if (dist < hitDistance + 10) {
        obs.markedForDeletion = true;
        this.stats.coinsCollected += 1;
        economy.addCoins(1);
        progression.addMissionProgress('collect_coins', 1);
        sound.playPickup();
        this.particles.emitPickupSparks(obs.x, obs.y, true);
        this.particles.addFloatingText(obs.x, obs.y - 15, '+1 🪙 MONEDA', '#ffd700');
      }
      return;
    }

    if (obs.kind === 'powerup_shield') {
      if (dist < hitDistance + 12) {
        obs.markedForDeletion = true;
        this.stats.score += 150;
        this.stats.shieldTimeRemaining = 7.0;
        this.chispa.data.shieldActive = true;
        progression.addMissionProgress('collect_powerups', 1);
        sound.playPowerUp();
        this.particles.emitPickupSparks(obs.x, obs.y);
        this.particles.addFloatingText(obs.x, obs.y - 15, '¡ESCUDO ACTIVO!', '#3b82f6');
      }
      return;
    }

    if (obs.kind === 'powerup_speed') {
      if (dist < hitDistance + 12) {
        obs.markedForDeletion = true;
        this.stats.score += 200;
        const turboLevel = progression.getProfile().upgrades['turbo_speed']?.level || 0;
        this.stats.speedTimeRemaining = 7.0 + turboLevel * 2.0;
        this.chispa.data.speedBoostActive = true;
        progression.addMissionProgress('collect_powerups', 1);
        sound.playPowerUp();
        this.particles.emitPickupSparks(obs.x, obs.y);
        this.particles.addFloatingText(obs.x, obs.y - 15, '⚡ ¡SUPER VELOCIDAD! (BULLET-TIME + PUNTOS x2)', '#10b981');
      }
      return;
    }

    const nearMissThreshold = (p.radius + obs.radius) * 1.55;
    if (
      dist < nearMissThreshold &&
      dist >= hitDistance &&
      !this.nearMissRegistered.has(obs.id) &&
      Math.abs(p.y - obs.y) < 18
    ) {
      this.nearMissRegistered.add(obs.id);
      this.stats.dodgesCount += 1;
      const dodgeScore = p.speedBoostActive ? 100 : 50;
      this.stats.score += dodgeScore;
      progression.addMissionProgress('dodges', 1);
      sound.playDodgeBonus();
      const dodgeText = p.speedBoostActive ? '⚡ ¡CASI TURBO x2! +100' : '¡CASI! +50';
      this.particles.addFloatingText(p.x, p.y - 35, dodgeText, p.speedBoostActive ? '#00ffff' : '#ffd600');
    }

    if (dist < hitDistance) {
      // Overcharge Core: 5 seconds invulnerability and pass through obstacles without losing lives
      if (this.stats.overchargeActive || p.overchargeActive) {
        obs.markedForDeletion = true;
        sound.playPowerUp();
        this.particles.emitPickupSparks(obs.x, obs.y);
        this.particles.addFloatingText(obs.x, obs.y - 20, '⚡ ¡VAPORIZADO!', '#38bdf8');
        return;
      }

      if (p.invulnerableTime > 0) {
        return;
      }

      // Sonic Deflection Shield: Super Velocidad absorbs one crash safely!
      if (p.speedBoostActive) {
        p.speedBoostActive = false;
        this.stats.speedTimeRemaining = 0;
        p.invulnerableTime = 1.4;
        this.screenShake = 12;
        sound.playPowerUp();
        this.particles.emitPickupSparks(p.x, p.y);
        this.particles.addFloatingText(p.x, p.y - 30, '💥 ¡BARRERA SÓNICA! (SALVADO)', '#00ffc8');
        obs.markedForDeletion = true;
        return;
      }

      if (p.shieldActive) {
        p.shieldActive = false;
        this.stats.shieldTimeRemaining = 0;
        p.invulnerableTime = 1.0;
        this.screenShake = 10;
        sound.playHit();
        this.particles.emitHitSplatter(p.x, p.y);
        this.particles.addFloatingText(p.x, p.y - 30, '¡ESCUDO ROTO!', '#3b82f6');
        obs.markedForDeletion = true;
        return;
      }

      // Check for Glitch Shield Consumable upgrade
      if (progression.useConsumable('glitch_shield')) {
        p.invulnerableTime = 1.5;
        this.screenShake = 12;
        sound.playHit();
        this.particles.emitHitSplatter(p.x, p.y);
        this.particles.addFloatingText(p.x, p.y - 30, '🛡️ ¡ESCUDO CONSUMIBLE!', '#3b82f6');
        obs.markedForDeletion = true;
        return;
      }

      this.stats.lives = Math.max(0, this.stats.lives - 1);
      this.screenShake = 16;
      this.chispa.hit();
      sound.playHit();
      this.particles.emitHitSplatter(p.x, p.y);
      this.particles.addFloatingText(p.x, p.y - 30, '-1 VIDA', '#ff0055');

      obs.markedForDeletion = true;

      if (this.stats.lives <= 0) {
        this.gameOver();
      }
    }
  }

  private gameOver() {
    this.state = 'gameover';
    this.screenShake = 22;
    sound.playGameOver();
    sound.stopBGM();

    const finalScore = Math.floor(this.stats.score);

    // Grant XP from run
    const earnedXp = Math.floor(finalScore / 4 + this.stats.timeSurvived * 2 + this.stats.coinsCollected * 10);
    progression.addXp(earnedXp);

    if (economy.claimMilestone('first_game_today', 20)) {
      // claimed
    }

    if (finalScore > this.stats.highScore) {
      this.stats.highScore = finalScore;
      localStorage.setItem('glitch_high_score', String(finalScore));

      if (!this.rewardHighScoreClaimed) {
        this.rewardHighScoreClaimed = true;
        if (economy.claimMilestone('beat_high_score', 25)) {
          // claimed
        }
      }
    }

    this.notifyChanges();
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    this.renderBackground(ctx);

    const isGlitching = this.glitch.active;
    for (const obs of this.obstacles) {
      renderObstacle(ctx, obs, isGlitching);
    }

    this.chispa.render(ctx);
    this.particles.render(ctx);

    // Companion Drone upgrade visual
    const upgrades = progression.getProfile().upgrades;
    const droneLevel = upgrades['companion_drone']?.level || 0;
    if (droneLevel > 0 && this.state === 'playing') {
      this.renderDrone(ctx);
    }

    if (this.glitch.active || this.glitch.warningTime > 0) {
      this.renderGlitchDistortion(ctx);
    }

    ctx.restore();
  }

  private renderDrone(ctx: CanvasRenderingContext2D) {
    const p = this.chispa.data;
    const time = performance.now() / 300;
    const droneX = p.x + Math.sin(time) * 35;
    const droneY = p.y - 45 + Math.cos(time * 2) * 6;

    ctx.save();
    ctx.translate(droneX, droneY);
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Blinking eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D) {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.playHeight);
    bgGrad.addColorStop(0, '#090412');
    bgGrad.addColorStop(0.5, '#120726');
    bgGrad.addColorStop(1, '#080312');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.playWidth, this.playHeight);

    ctx.save();
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.12)';
    ctx.lineWidth = 1.5;

    const laneCount = 6;
    const laneWidth = this.playWidth / laneCount;
    for (let i = 1; i < laneCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * laneWidth, 0);
      ctx.lineTo(i * laneWidth, this.playHeight);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 245, 255, 0.08)';
    const spacing = 50;
    for (let y = this.backgroundScroll; y < this.playHeight; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.playWidth, y);
      ctx.stroke();
    }

    const leftGlow = ctx.createLinearGradient(0, 0, 16, 0);
    leftGlow.addColorStop(0, 'rgba(0, 245, 255, 0.3)');
    leftGlow.addColorStop(1, 'rgba(0, 245, 255, 0)');
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, 16, this.playHeight);

    const rightGlow = ctx.createLinearGradient(this.playWidth, 0, this.playWidth - 16, 0);
    rightGlow.addColorStop(0, 'rgba(255, 0, 128, 0.3)');
    rightGlow.addColorStop(1, 'rgba(255, 0, 128, 0)');
    ctx.fillStyle = rightGlow;
    ctx.fillRect(this.playWidth - 16, 0, 16, this.playHeight);

    // Dynamic hyperspeed warp lines during Super Velocidad
    if (this.chispa.data.speedBoostActive) {
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.4)';
      ctx.lineWidth = 2;
      const time = performance.now() / 30;
      for (let w = 0; w < 10; w++) {
        const lineX = ((w * 44 + 22) % (this.playWidth - 20)) + 10;
        const lineY = ((time * 24 + w * 90) % (this.playHeight + 120)) - 60;
        ctx.beginPath();
        ctx.moveTo(lineX, lineY);
        ctx.lineTo(lineX, lineY + 65);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderGlitchDistortion(ctx: CanvasRenderingContext2D) {
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let y = 0; y < this.playHeight; y += 4) {
      ctx.fillRect(0, y, this.playWidth, 1.5);
    }

    if (Math.random() < 0.6) {
      const bandY = Math.random() * (this.playHeight - 30);
      const bandHeight = 6 + Math.random() * 20;

      ctx.fillStyle = 'rgba(0, 245, 255, 0.18)';
      ctx.fillRect(0, bandY, this.playWidth, bandHeight);

      ctx.fillStyle = 'rgba(255, 0, 110, 0.18)';
      ctx.fillRect(-6 + Math.random() * 12, bandY + 2, this.playWidth, bandHeight - 4);
    }

    const rimColor = this.glitch.active ? 'rgba(255, 0, 110, 0.15)' : 'rgba(0, 245, 255, 0.1)';
    ctx.strokeStyle = rimColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, this.playWidth, this.playHeight);

    ctx.restore();
  }
}
