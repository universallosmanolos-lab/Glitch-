import React, { useState } from 'react';
import { progression, StoreUpgradeItem } from '../game/Progression';
import { X, ShoppingBag, Coins, Zap, Shield, Magnet, Bot, Cpu } from 'lucide-react';

interface StoreModalProps {
  onClose: () => void;
  onUpgradeChanged: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ onClose, onUpgradeChanged }) => {
  const [coins, setCoins] = useState<number>(progression.getCoins());
  const [items, setItems] = useState<StoreUpgradeItem[]>(progression.getUpgradeItems());
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleBuy = (item: StoreUpgradeItem) => {
    const res = progression.buyOrUpgrade(item.id);
    setMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setCoins(progression.getCoins());
      setItems(progression.getUpgradeItems());
      onUpgradeChanged();
    }
  };

  const getIcon = (id: string) => {
    switch (id) {
      case 'magnet':
        return <Magnet className="w-5 h-5 text-cyan-400" />;
      case 'glitch_shield':
        return <Shield className="w-5 h-5 text-blue-400" />;
      case 'electric_dash':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'companion_drone':
        return <Bot className="w-5 h-5 text-pink-400" />;
      case 'chaos_control':
        return <Cpu className="w-5 h-5 text-emerald-400" />;
      default:
        return <ShoppingBag className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="w-full max-w-md bg-gradient-to-b from-[#1c0833] to-[#0c0316] border-2 border-cyan-500/50 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,245,255,0.35)] text-white flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-800/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-black tracking-wider text-cyan-300 font-display">
              TIENDA DE MEJORAS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Visible Coin Balance */}
        <div className="flex items-center justify-between bg-black/60 border border-amber-500/40 rounded-2xl p-3.5 my-3 shadow-inner">
          <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">
            Tus Monedas
          </div>
          <div className="flex items-center gap-2 font-mono text-xl font-black text-amber-400">
            <Coins className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>{coins.toLocaleString()} 🪙</span>
          </div>
        </div>

        {/* Feedback Message */}
        {message && (
          <div
            className={`text-xs p-2.5 rounded-xl mb-3 text-center font-bold border transition-all ${
              message.isError
                ? 'bg-rose-950/80 border-rose-500 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upgrades List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {items.map((item) => {
            const isMax = item.category === 'consumable' ? (item.charges || 0) >= (item.maxCharges || 3) : item.level >= item.maxLevel;
            const cost = item.category === 'consumable' ? item.price : item.price * (item.level + 1);

            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl border bg-purple-950/30 border-purple-800/40 flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/50 border border-purple-500/40 flex items-center justify-center shrink-0">
                    {getIcon(item.id)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{item.name}</h3>
                      <span className="text-[10px] font-mono bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full border border-purple-600/40">
                        {item.category === 'consumable'
                          ? `Cargas: ${item.charges || 0}/${item.maxCharges || 3}`
                          : `Nivel ${item.level}/${item.maxLevel}`}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 mt-0.5">{item.description}</p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={isMax}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1 ${
                      isMax
                        ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                        : 'text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 active:scale-95 shadow'
                    }`}
                  >
                    <span>{isMax ? 'MÁXIMO' : item.category === 'consumable' ? 'RECARGAR' : item.level === 0 ? 'COMPRAR' : 'MEJORAR'}</span>
                    {!isMax && <span className="font-mono">{cost} 🪙</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Back Button */}
        <button
          onClick={onClose}
          className="w-full py-3 mt-3 rounded-2xl font-bold text-sm tracking-wider uppercase text-gray-300 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 transition-all flex items-center justify-center gap-2"
        >
          <span>VOLVER AL MENÚ</span>
        </button>
      </div>
    </div>
  );
};
