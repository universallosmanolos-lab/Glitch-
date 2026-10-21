export interface StoreUpgradeItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'ability' | 'permanent' | 'consumable';
  level: number;
  maxLevel: number;
  unlocked: boolean;
  charges?: number; // for consumables
  maxCharges?: number;
}

export interface MissionItem {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardCoins: number;
  rewardXp: number;
  type: 'survive_time' | 'collect_coins' | 'collect_sparks' | 'survive_glitches' | 'dodges' | 'collect_powerups';
}

export interface PlayerProgressionProfile {
  coins: number;
  xp: number;
  level: number;
  equippedSkin: string;
  equippedTrail: string;
  upgrades: { [id: string]: { level: number; unlocked: boolean; charges?: number } };
  missions: MissionItem[];
  lastResetDate: string;
  claimedLevelRewards: { [level: number]: boolean };
}

const INITIAL_UPGRADES: StoreUpgradeItem[] = [
  {
    id: 'magnet',
    name: 'Imán de Monedas',
    description: 'Atrae monedas cercanas automáticamente durante la partida.',
    price: 150,
    category: 'permanent',
    level: 0,
    maxLevel: 3,
    unlocked: false,
  },
  {
    id: 'glitch_shield',
    name: 'Escudo Glitch',
    description: 'Absorbe un choque mortal y evita perder una vida.',
    price: 250,
    category: 'consumable',
    level: 0,
    maxLevel: 1,
    unlocked: false,
    charges: 0,
    maxCharges: 3,
  },
  {
    id: 'electric_dash',
    name: 'Impulso Eléctrico',
    description: 'Permite realizar un desplazamiento rápido lateral de evasión.',
    price: 300,
    category: 'ability',
    level: 0,
    maxLevel: 3,
    unlocked: false,
  },
  {
    id: 'companion_drone',
    name: 'Dron Compañero',
    description: 'Dron asistencial que avisa de peligros y recoge ítems.',
    price: 500,
    category: 'permanent',
    level: 0,
    maxLevel: 2,
    unlocked: false,
  },
  {
    id: 'chaos_control',
    name: 'Control del Caos',
    description: 'Reduce temporalmente la velocidad de obstáculos durante eventos Glitch.',
    price: 400,
    category: 'ability',
    level: 0,
    maxLevel: 2,
    unlocked: false,
  },
  {
    id: 'turbo_speed',
    name: 'Super Velocidad Turbo',
    description: 'Aumenta la duración de la Super Velocidad (Bullet-Time, Puntos x2 y Ondas Sónicas).',
    price: 350,
    category: 'permanent',
    level: 0,
    maxLevel: 3,
    unlocked: false,
  },
];

const DEFAULT_MISSIONS: MissionItem[] = [
  {
    id: 'm1',
    title: 'Supervivencia Neón',
    description: 'Sobrevive durante 60 segundos acumulados.',
    target: 60,
    progress: 0,
    completed: false,
    claimed: false,
    rewardCoins: 15,
    rewardXp: 100,
    type: 'survive_time',
  },
  {
    id: 'm2',
    title: 'Fiebre del Oro',
    description: 'Recoge 10 monedas en tus partidas.',
    target: 10,
    progress: 0,
    completed: false,
    claimed: false,
    rewardCoins: 20,
    rewardXp: 120,
    type: 'collect_coins',
  },
  {
    id: 'm3',
    title: 'Maestro del Esquive',
    description: 'Realiza 15 esquives cercanos "¡CASI!".',
    target: 15,
    progress: 0,
    completed: false,
    claimed: false,
    rewardCoins: 25,
    rewardXp: 150,
    type: 'dodges',
  },
  {
    id: 'm4',
    title: 'Antianomalía',
    description: 'Supera 2 eventos de distorsión Glitch.',
    target: 2,
    progress: 0,
    completed: false,
    claimed: false,
    rewardCoins: 30,
    rewardXp: 200,
    type: 'survive_glitches',
  },
];

export class ProgressionManager {
  private profile: PlayerProgressionProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): PlayerProgressionProfile {
    try {
      const saved = localStorage.getItem('glitch_progression_profile');
      const today = new Date().toDateString();

      if (saved) {
        const parsed: PlayerProgressionProfile = JSON.parse(saved);
        // Daily missions reset check
        if (parsed.lastResetDate !== today) {
          parsed.lastResetDate = today;
          parsed.missions = DEFAULT_MISSIONS.map((m) => ({ ...m, progress: 0, completed: false, claimed: false }));
        }
        return parsed;
      }
    } catch {
      // fallback
    }

    const upgradesMap: { [id: string]: { level: number; unlocked: boolean; charges?: number } } = {};
    INITIAL_UPGRADES.forEach((u) => {
      upgradesMap[u.id] = { level: u.level, unlocked: u.unlocked, charges: u.charges || 0 };
    });

    return {
      coins: 50, // starting welcome bonus coins
      xp: 0,
      level: 1,
      equippedSkin: 'chispa',
      equippedTrail: '',
      upgrades: upgradesMap,
      missions: DEFAULT_MISSIONS.map((m) => ({ ...m })),
      lastResetDate: new Date().toDateString(),
      claimedLevelRewards: {},
    };
  }

  public saveProfile() {
    try {
      localStorage.setItem('glitch_progression_profile', JSON.stringify(this.profile));
    } catch {
      // storage unavailable
    }
  }

  public getProfile(): PlayerProgressionProfile {
    return this.profile;
  }

  public getCoins(): number {
    return this.profile.coins;
  }

  public addCoins(amount: number): number {
    this.profile.coins = Math.max(0, this.profile.coins + amount);
    this.saveProfile();
    return this.profile.coins;
  }

  public addXp(amount: number): { levelUp: boolean; newLevel: number } {
    this.profile.xp += amount;
    const requiredForNext = this.profile.level * 400;
    let levelUp = false;

    if (this.profile.xp >= requiredForNext) {
      this.profile.level += 1;
      levelUp = true;
    }

    this.saveProfile();
    return { levelUp, newLevel: this.profile.level };
  }

  public getUpgradeItems(): StoreUpgradeItem[] {
    return INITIAL_UPGRADES.map((base) => {
      const userState = this.profile.upgrades[base.id] || { level: 0, unlocked: false, charges: 0 };
      return {
        ...base,
        level: userState.level,
        unlocked: userState.unlocked,
        charges: userState.charges,
      };
    });
  }

  public buyOrUpgrade(id: string): { success: boolean; message: string } {
    const base = INITIAL_UPGRADES.find((u) => u.id === id);
    if (!base) return { success: false, message: 'Objeto no encontrado.' };

    const userState = this.profile.upgrades[id] || { level: 0, unlocked: false, charges: 0 };

    if (base.category === 'consumable') {
      // Consumables can be restocked up to maxCharges
      const cost = base.price;
      if (this.profile.coins < cost) return { success: false, message: 'Saldo insuficiente de monedas.' };
      if ((userState.charges || 0) >= (base.maxCharges || 3)) {
        return { success: false, message: 'Ya tienes el máximo de cargas de escudo.' };
      }

      this.profile.coins -= cost;
      userState.charges = Math.min(base.maxCharges || 3, (userState.charges || 0) + 1);
      userState.unlocked = true;
      this.profile.upgrades[id] = userState;
      this.saveProfile();
      return { success: true, message: '¡Escudo Glitch recargado con éxito!' };
    } else {
      // Permanent upgrades
      if (userState.level >= base.maxLevel) {
        return { success: false, message: '¡Mejora al nivel máximo!' };
      }
      const nextLevelCost = base.price * (userState.level + 1);
      if (this.profile.coins < nextLevelCost) {
        return { success: false, message: `Necesitas ${nextLevelCost} monedas.` };
      }

      this.profile.coins -= nextLevelCost;
      userState.level += 1;
      userState.unlocked = true;
      this.profile.upgrades[id] = userState;
      this.saveProfile();
      return { success: true, message: `¡Mejora ${base.name} subida al nivel ${userState.level}!` };
    }
  }

  public useConsumable(id: string): boolean {
    const userState = this.profile.upgrades[id];
    if (userState && (userState.charges || 0) > 0) {
      userState.charges = (userState.charges || 0) - 1;
      this.saveProfile();
      return true;
    }
    return false;
  }

  public addMissionProgress(type: MissionItem['type'], amount: number): { completedMission?: MissionItem } {
    let completedMission: MissionItem | undefined;
    for (const m of this.profile.missions) {
      if (!m.completed && m.type === type) {
        m.progress = Math.min(m.target, m.progress + amount);
        if (m.progress >= m.target) {
          m.completed = true;
          completedMission = m;
        }
      }
    }
    this.saveProfile();
    return { completedMission };
  }

  public claimMissionReward(missionId: string): { success: boolean; rewardCoins: number; rewardXp: number } {
    const m = this.profile.missions.find((item) => item.id === missionId);
    if (!m || !m.completed || m.claimed) {
      return { success: false, rewardCoins: 0, rewardXp: 0 };
    }

    m.claimed = true;
    this.addCoins(m.rewardCoins);
    this.addXp(m.rewardXp);
    this.saveProfile();
    return { success: true, rewardCoins: m.rewardCoins, rewardXp: m.rewardXp };
  }
}

export const progression = new ProgressionManager();
