import React, { useState } from 'react';
import { SHOP_UPGRADES } from '../data';
import { UserStats, UpgradeItem } from '../types';
import { sound } from './AudioSynth';
import { TRANSLATIONS, Language } from '../lib/translations';
import * as LucideIcons from 'lucide-react';

interface UpgradesTabProps {
  stats: UserStats;
  onPurchase: (upgradeId: string, cost: number, effectVal: number) => void;
  language: Language;
  showAlert?: (message: string, type?: 'success' | 'alert' | 'info') => void;
}

export default function UpgradesTab({ stats, onPurchase, language, showAlert }: UpgradesTabProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';
  const [activeCategory, setActiveCategory] = useState<'all' | 'clicks' | 'energy' | 'passive'>('all');

  // Dynamic Item translation mapping
  const getLocalizedItem = (item: UpgradeItem) => {
    if (language === 'ar') {
      switch (item.id) {
        case 'multi_tap':
          return { name: 'الركاب الكمي ⚡', description: 'يزيد معدل تحويل الطاقة الفورية لـ Hp في الضغطة الواحدة' };
        case 'max_energy':
          return { name: 'مكثف طاقة السرداب 💀', description: 'يزيد السعة التخزينية القصوى لطاقة جماجم التعدين (+500 سعة)' };
        case 'energy_regen':
          return { name: 'شاحن الجمجمة الإعصاري ⚡', description: 'يعزز سرعة شحن وامتصاص طاقة التعدين بالثانية (+1 برق/ثانية)' };
        case 'gpu_rig':
          return { name: 'درع الجمجمة البرونزية 💀', description: 'يولد طاقة الهاش ريت تلقائياً دون الحاجة للضغط المستمر (+5 Hp/ثانية)' };
        case 'asic_miner':
          return { name: 'محرك الهيكل الحديدي ⚙️', description: 'محرك تعدين سحابي ثقيل ممتاز لإنتاج سرعات هائلة بالثانية (+30 Hp/ثانية)' };
        case 'quantum_node':
          return { name: 'عقدة الجمجمة الخارقة 🌟', description: 'حوسبة بلوكشين كمية خارقة لتكرير الهاشرات (+150 Hp/ثانية)' };
        default:
          return { name: item.name, description: item.description };
      }
    }
    return { name: item.name, description: item.description };
  };

  // Helper inside Lucide
  const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent className={className} />;
    }
    return <LucideIcons.HelpCircle className={className} />;
  };

  const getUpgradeCost = (item: UpgradeItem) => {
    const currentLevel = stats.upgradeLevels[item.id] || 0;
    return Math.floor(item.baseCost * Math.pow(item.costMultiplier, currentLevel));
  };

  const getNextEffectVal = (item: UpgradeItem) => {
    const currentLevel = stats.upgradeLevels[item.id] || 0;
    const currentEffect = currentLevel * item.effectMultiplier;
    const nextEffect = (currentLevel + 1) * item.effectMultiplier;

    if (item.id === 'multi_tap') {
      return {
        current: language === 'ar' ? `+${currentLevel + 1} حجم الضغطة` : `+${currentLevel + 1} Tap Size`,
        next: `+${currentLevel + 2}`
      };
    }
    if (item.id === 'max_energy') {
      return {
        current: `${1000 + currentEffect} ${language === 'ar' ? 'سعة' : 'Max'}`,
        next: `${1000 + nextEffect}`
      };
    }
    if (item.id === 'energy_regen') {
      return {
        current: `${1 + currentEffect}⚡/${language === 'ar' ? 'ثا' : 's'}`,
        next: `${1 + nextEffect}⚡/${language === 'ar' ? 'ثا' : 's'}`
      };
    }
    return {
      current: `+${currentEffect} Hp/s`,
      next: `+${nextEffect} Hp/s`
    };
  };

  const handleBuy = (item: UpgradeItem) => {
    const cost = getUpgradeCost(item);
    if (stats.coins >= cost) {
      onPurchase(item.id, cost, item.effectMultiplier);
      sound.playClaim();
      if (showAlert) {
        showAlert(t.buySuccess, 'success');
      } else {
        alert(t.buySuccess);
      }
    } else {
      sound.playError();
      if (showAlert) {
        showAlert(t.insufficientFunds, 'alert');
      } else {
        alert(t.insufficientFunds);
      }
    }
  };

  const filteredUpgrades = SHOP_UPGRADES.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-neutral-950 px-4 pt-4 overflow-y-auto pb-24 select-none ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* Description header */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4.5 mb-4">
        <h4 className="font-extrabold text-xs text-white font-display uppercase tracking-wide">
          {t.upgradesHeaderTitle}
        </h4>
        <p className="text-[10.5px] text-zinc-400 leading-normal mt-1.5 font-sans">
          {t.upgradesDesc}
        </p>
      </div>

      {/* Category Tabs selectors */}
      <div className="flex gap-1.5 p-1 bg-zinc-950 border border-white/5 rounded-xl text-[10px] mb-4 font-mono font-bold">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-1 py-1.5 rounded-lg transition duration-150 ${activeCategory === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
        >
          {language === 'ar' ? 'الكل' : 'All Tech'}
        </button>
        <button
          onClick={() => setActiveCategory('clicks')}
          className={`flex-1 py-1.5 rounded-lg transition duration-150 ${activeCategory === 'clicks' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
        >
          {language === 'ar' ? 'الضغطة' : 'Converter'}
        </button>
        <button
          onClick={() => setActiveCategory('energy')}
          className={`flex-1 py-1.5 rounded-lg transition duration-150 ${activeCategory === 'energy' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
        >
          {language === 'ar' ? 'الشحن' : 'Battery'}
        </button>
        <button
          onClick={() => setActiveCategory('passive')}
          className={`flex-1 py-1.5 rounded-lg transition duration-150 ${activeCategory === 'passive' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-neutral-400 hover:text-white'}`}
        >
          {language === 'ar' ? 'المعدات' : 'Passive Rig'}
        </button>
      </div>

      {/* Upgrades items list */}
      <div className="space-y-3.5">
        {filteredUpgrades.map((item) => {
          const currentLevel = stats.upgradeLevels[item.id] || 0;
          const cost = getUpgradeCost(item);
          const effects = getNextEffectVal(item);
          const isAffordable = stats.coins >= cost;
          const loc = getLocalizedItem(item);

          return (
            <div
              key={item.id}
              className="bg-neutral-900 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/20 hover:bg-neutral-850 transition duration-200"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Tech Symbol Ring */}
                <div className={`p-3 rounded-xl shrink-0 ${item.category === 'passive' ? 'bg-purple-500/10 text-purple-400' : item.category === 'energy' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  {renderIcon(item.iconName, "w-6 h-6")}
                </div>

                {/* Tech Descriptions */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm text-white truncate font-display">{loc.name}</h3>
                    <span className="text-[9px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded-md font-mono shrink-0">
                      {t.levelShort} {currentLevel}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-1 font-sans">{loc.description}</p>
                  
                  {/* Upgrade stats dynamic difference indicator */}
                  <div className="flex items-center gap-1.5 mt-2 font-mono text-[9px] text-zinc-500">
                    <span>{effects.current}</span>
                    <span className="text-zinc-500">→</span>
                    <span className="text-emerald-400 font-medium">{effects.next}</span>
                  </div>
                </div>
              </div>

              {/* Purchase Trigger Button */}
              <button
                onClick={() => handleBuy(item)}
                className={`py-2 px-3 rounded-xl font-mono text-xs font-bold leading-none flex flex-col items-center justify-center min-w-[80px] text-center border transition-all duration-150 shrink-0 ${isAffordable ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 border-amber-400/20 text-slate-950 shadow-md cursor-pointer active:scale-95' : 'bg-zinc-805 border-zinc-750 pointer-events-none text-zinc-500'}`}
              >
                <span className="text-[8px] text-zinc-400 font-normal mb-1">{language === 'ar' ? 'التكلفة $BEE' : 'Cost BEE'}</span>
                <span className="tracking-tighter">
                  {cost.toLocaleString()}
                </span>
              </button>
            </div>
          );
        })}

        {filteredUpgrades.length === 0 && (
          <div className="text-center py-10">
            <p className="text-zinc-500 text-xs font-sans">No technology modules found in this sub-grid.</p>
          </div>
        )}
      </div>
    </div>
  );
}
