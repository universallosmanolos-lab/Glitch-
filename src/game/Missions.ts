export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  rewardXp: number;
  type: 'survive_time' | 'collect_powerups' | 'collect_sparks' | 'survive_glitches';
}

export interface PlayerProfile {
  xp: number;
  level: number;
  lastResetDate: string;
  missions: Mission[];
}

const DEFAULT_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Sobreviviente',
    description: 'Sobrevive durante 60 segundos en total.',
    target: 60,
    progress: 0,
    completed: false,
    rewardXp: 150,
    type: 'survive_time',
  },
  {
    id: 'm2',
    title: 'Cazador de Power-Ups',
    description: 'Recoge 5 power-ups (Escudo o Velocidad).',
    target: 5,
    progress: 0,
    completed: false,
    rewardXp: 200,
    type: 'collect_powerups',
  },
  {
    id: 'm3',
    title: 'Coleccionista',
    description: 'Toma 10 chispas de energía doradas.',
    target: 10,
    progress: 0,
    completed: false,
    rewardXp: 100,
    type: 'collect_sparks',
  },
  {
    id: 'm4',
    title: 'Resiliente Glitch',
    description: 'Supera 2 eventos de distorsión Glitch.',
    target: 2,
    progress: 0,
    completed: false,
    rewardXp: 250,
    type: 'survive_glitches',
  },
];

export class MissionManager {
  private profile: PlayerProfile;

  constructor() {
    this.profile = this.loadProfile();
  }

  private loadProfile(): PlayerProfile {
    try {
      const saved = localStorage.getItem('glitch_player_profile');
      const today = new Date().toDateString();

      if (saved) {
        const parsed: PlayerProfile = JSON.parse(saved);
        // Check if daily reset is needed (new day)
        if (parsed.lastResetDate !== today) {
          return {
            xp: parsed.xp || 0,
            level: parsed.level || 1,
            lastResetDate: today,
            missions: DEFAULT_MISSIONS.map((m) => ({ ...m, progress: 0, completed: false })),
          };
        }
        return parsed;
      }
    } catch {
      // fallback
    }

    return {
      xp: 0,
      level: 1,
      lastResetDate: new Date().toDateString(),
      missions: DEFAULT_MISSIONS.map((m) => ({ ...m })),
    };
  }

  public saveProfile() {
    try {
      localStorage.setItem('glitch_player_profile', JSON.stringify(this.profile));
    } catch {
      // ignore
    }
  }

  public getProfile(): PlayerProfile {
    return this.profile;
  }

  public addProgress(type: Mission['type'], amount: number): { levelUp: boolean; earnedXp: number } {
    let levelUp = false;
    let earnedXp = 0;

    for (const mission of this.profile.missions) {
      if (!mission.completed && mission.type === type) {
        mission.progress = Math.min(mission.target, mission.progress + amount);
        if (mission.progress >= mission.target) {
          mission.completed = true;
          earnedXp += mission.rewardXp;
          this.profile.xp += mission.rewardXp;

          // Check level up (every 500 XP)
          const newLevel = Math.floor(this.profile.xp / 500) + 1;
          if (newLevel > this.profile.level) {
            this.profile.level = newLevel;
            levelUp = true;
          }
        }
      }
    }

    this.saveProfile();
    return { levelUp, earnedXp };
  }
}

export const missionManager = new MissionManager();
