import { progression } from './Progression';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'skin' | 'trail';
  unlocked: boolean;
}

const INITIAL_STORE_ITEMS: StoreItem[] = [
  {
    id: 'chispa',
    name: 'Chispa Clásico',
    description: 'Gelatina clásica cian y morada.',
    price: 0,
    type: 'skin',
    unlocked: true,
  },
  {
    id: 'radioactivo',
    name: 'Radioactivo',
    description: 'Aspecto verde brillante tóxico.',
    price: 300,
    type: 'skin',
    unlocked: false,
  },
  {
    id: 'modo_fuego',
    name: 'Modo Fuego',
    description: 'Aspecto naranja con plasma de fuego.',
    price: 600,
    type: 'skin',
    unlocked: false,
  },
  {
    id: 'estela_glitch',
    name: 'Estela Glitch',
    description: 'Efecto de partículas cian y magenta al moverte.',
    price: 200,
    type: 'trail',
    unlocked: false,
  },
];

export class EconomyManager {
  private items: StoreItem[] = INITIAL_STORE_ITEMS;
  private equippedSkin: string = 'chispa';
  private equippedTrail: string = '';

  constructor() {
    this.loadEconomy();
  }

  private loadEconomy() {
    try {
      const savedItems = localStorage.getItem('glitch_store_items');
      if (savedItems) {
        const parsed: StoreItem[] = JSON.parse(savedItems);
        this.items = this.items.map((item) => {
          const found = parsed.find((p) => p.id === item.id);
          return found ? { ...item, unlocked: found.unlocked } : item;
        });
      }

      const savedSkin = localStorage.getItem('glitch_equipped_skin');
      if (savedSkin) {
        this.equippedSkin = savedSkin;
      }

      const savedTrail = localStorage.getItem('glitch_equipped_trail');
      if (savedTrail !== null) {
        this.equippedTrail = savedTrail;
      }
    } catch {
      // fallback
    }
  }

  public saveEconomy() {
    try {
      localStorage.setItem('glitch_store_items', JSON.stringify(this.items));
      localStorage.setItem('glitch_equipped_skin', this.equippedSkin);
      localStorage.setItem('glitch_equipped_trail', this.equippedTrail);
    } catch {
      // fallback
    }
  }

  public getCoins(): number {
    return progression.getCoins();
  }

  public addCoins(amount: number): number {
    return progression.addCoins(amount);
  }

  public getItems(): StoreItem[] {
    return this.items;
  }

  public getEquippedSkin(): string {
    return this.equippedSkin;
  }

  public getEquippedTrail(): string {
    return this.equippedTrail;
  }

  public buyItem(itemId: string): { success: boolean; message: string } {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Artículo no encontrado.' };
    if (item.unlocked) return { success: false, message: 'El artículo ya está desbloqueado.' };
    if (this.getCoins() < item.price) return { success: false, message: 'Saldo insuficiente de monedas.' };

    this.addCoins(-item.price);
    item.unlocked = true;
    if (item.type === 'skin') {
      this.equippedSkin = item.id;
    } else if (item.type === 'trail') {
      this.equippedTrail = item.id;
    }
    this.saveEconomy();
    return { success: true, message: `¡Has comprado ${item.name} con éxito!` };
  }

  public equipItem(itemId: string): { success: boolean; message: string } {
    const item = this.items.find((i) => i.id === itemId);
    if (!item) return { success: false, message: 'Artículo no encontrado.' };
    if (!item.unlocked) return { success: false, message: 'Debes desbloquear este artículo primero.' };

    if (item.type === 'skin') {
      this.equippedSkin = item.id;
    } else if (item.type === 'trail') {
      if (this.equippedTrail === item.id) {
        this.equippedTrail = '';
      } else {
        this.equippedTrail = item.id;
      }
    }
    this.saveEconomy();
    return { success: true, message: `Artículo equipado con éxito.` };
  }

  public claimMilestone(_key: string, _rewardCoins: number): boolean {
    return true;
  }
}

export const economy = new EconomyManager();
