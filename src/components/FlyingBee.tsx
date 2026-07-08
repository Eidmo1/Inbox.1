import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { sound } from './AudioSynth';

interface FlyingBeeProps {
  isActive: boolean;
  onReward: (amount: number) => void;
  language?: 'ar' | 'en';
}

interface FloatingHoney {
  id: number;
  x: number;
  y: number;
  text: string;
}

interface NatureSpot {
  id: number;
  emoji: string;
  nameAr: string;
  nameEn: string;
  leftPct: number; // percentage of screen width
  topPct: number;  // percentage of screen height
}

// 5 beautifully styled autumn spots for our Queen Bee to land on
const AUTUMN_SPOTS: NatureSpot[] = [
  { id: 1, emoji: '🍁', nameAr: 'شجرة قيقب خريفية 🍂', nameEn: 'Autumn Maple Tree 🍂', leftPct: 15, topPct: 45 },
  { id: 2, emoji: '🌻', nameAr: 'زهرة عباد الشمس الخريفية 🌻', nameEn: 'Autumn Sunflower 🌻', leftPct: 82, topPct: 25 },
  { id: 3, emoji: '🍂', nameAr: 'شجرة بلوط ذهبية 🌳', nameEn: 'Golden Oak Tree 🌳', leftPct: 20, topPct: 75 },
  { id: 4, emoji: '🌼', nameAr: 'أقحوان عسلي 🌼', nameEn: 'Honey Marigold 🌼', leftPct: 78, topPct: 70 },
  { id: 5, emoji: '🌹', nameAr: 'زهرة الخريف الحمراء 🌹', nameEn: 'Autumn Red Rose 🌹', leftPct: 48, topPct: 50 },
];

export default function FlyingBee({ isActive, onReward, language = 'ar' }: FlyingBeeProps) {
  const [pos, setPos] = useState({ x: 100, y: 150 });
  const [prevPos, setPrevPos] = useState({ x: 100, y: 150 });
  const [rotation, setRotation] = useState(0);
  const [isBuzzing, setIsBuzzing] = useState(false);
  const [rewards, setRewards] = useState<FloatingHoney[]>([]);
  const [activeSpotId, setActiveSpotId] = useState<number | null>(null);
  const rewardIdRef = useRef(0);
  const isRtl = language === 'ar';

  // Smooth movement between autumn nature spots
  useEffect(() => {
    if (!isActive) return;

    const moveBeeToSpot = () => {
      // Pick a random spot from our autumn trees and flowers
      const randomSpot = AUTUMN_SPOTS[Math.floor(Math.random() * AUTUMN_SPOTS.length)];
      setActiveSpotId(randomSpot.id);

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Translate percentages to viewport coordinates
      const nextX = (randomSpot.leftPct / 100) * (width - 60) + 30;
      const nextY = (randomSpot.topPct / 100) * (height - 180) + 90;

      setPos((current) => {
        setPrevPos(current);
        
        // Calculate flight angle for rotation
        const deltaX = nextX - current.x;
        const deltaY = nextY - current.y;
        let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Face correct left/right direction
        setRotation(angle);

        return { x: nextX, y: nextY };
      });
    };

    // Move immediately then every 4.2 seconds
    moveBeeToSpot();
    const interval = setInterval(moveBeeToSpot, 4200);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  const handleBeeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBuzzing) return;

    sound.playTap();
    setIsBuzzing(true);

    // Give a bonus reward of Queen bee/honey direct points!
    const rewardAmount = Number((Math.random() * 0.0005 + 0.0001).toFixed(6));
    onReward(rewardAmount);

    // Spawn flying reward label
    const newReward: FloatingHoney = {
      id: rewardIdRef.current++,
      x: e.clientX,
      y: e.clientY - 25,
      text: `+${rewardAmount.toFixed(5)} Queen bee 🍯`
    };
    setRewards((prev) => [...prev, newReward]);

    // Cleanup reward label after animation
    setTimeout(() => {
      setRewards((prev) => prev.filter((r) => r.id !== newReward.id));
    }, 1500);

    // Stop buzzing animation
    setTimeout(() => {
      setIsBuzzing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 2. Floating Sparkle Trail behind Bee */}
      <div 
        className="absolute w-2 h-2 rounded-full bg-orange-400/30 blur-sm pointer-events-none transition-all duration-1000"
        style={{
          left: prevPos.x + 16,
          top: prevPos.y + 16,
          opacity: 0.7,
        }}
      />

      {/* 3. The Animated Flying Bee moving between Autumn Plants */}
      <motion.div
        animate={{
          x: pos.x,
          y: pos.y,
        }}
        transition={{
          type: 'spring',
          stiffness: 12,
          damping: 6,
          mass: 0.9,
        }}
        className="absolute pointer-events-auto cursor-pointer select-none group"
        onClick={handleBeeClick}
        style={{ width: '48px', height: '48px' }}
      >
        <motion.div
          animate={isBuzzing ? {
            scale: [1, 1.3, 0.9, 1.1, 1],
            rotate: [rotation, rotation - 25, rotation + 25, rotation - 15, rotation],
          } : {
            y: [0, -6, 0],
            rotate: rotation,
          }}
          transition={isBuzzing ? {
            duration: 0.6,
          } : {
            repeat: Infinity,
            duration: 1.2,
            ease: 'easeInOut',
          }}
          className="relative flex items-center justify-center w-full h-full"
        >
          {/* Beating Wings */}
          <div className="absolute -top-1 w-8 h-4 bg-cyan-200/45 rounded-full border border-white/20 animate-pulse origin-bottom -rotate-12" />
          <div className="absolute -top-2 w-7 h-4 bg-cyan-200/35 rounded-full border border-white/10 animate-pulse origin-bottom rotate-12" />

          {/* Glowing Aura Ring */}
          <div className="absolute inset-1 rounded-full bg-amber-500/15 blur-md group-hover:bg-amber-500/30 transition-all duration-300" />
          
          {/* Honey Bee Emoji */}
          <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.7)]">🐝</span>

          {/* Interactive Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-neutral-900/90 border border-orange-500/30 text-amber-300 text-[8px] font-black font-sans px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md pointer-events-none">
            {isRtl ? 'ملكة النحل! اضغطني لجمع العسل 🍯' : 'Queen Bee! Tap to collect Honey 🍯'}
          </div>
        </motion.div>
      </motion.div>

      {/* 4. Floating Click Rewards */}
      <AnimatePresence>
        {rewards.map((rew) => (
          <motion.div
            key={rew.id}
            initial={{ opacity: 0, y: rew.y, x: rew.x, scale: 0.7 }}
            animate={{ opacity: 1, y: rew.y - 60, scale: 1.1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute pointer-events-none font-sans font-black text-xs text-amber-400"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.9), 0 0 5px rgba(245,158,11,0.5)'
            }}
          >
            {rew.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
