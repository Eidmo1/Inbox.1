import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, RotateCcw, Award, Zap, Sparkles, ChevronLeft, ChevronRight, 
  Coins, Gift, Trophy, ShieldAlert, Volume2, Pause, Star
} from 'lucide-react';
import { sound } from './AudioSynth';

interface MiningRingProps {
  energy: number;
  maxEnergy: number;
  multiTap: number;
  efficiencyLevel: number;
  onMine: (amount: number, energyUsed: number) => boolean; // returns true if successful
  onGameReward?: (type: 'usd' | 'ton' | 'bnb' | 'jump' | 'pepe' | 'ghs' | 'coins' | 'energy', amount: number) => void;
  timeRemaining?: number;
  onClaimAndRestartMining?: () => void;
  language?: 'ar' | 'en';
}

// Particle class for breaking visual effects
class ExplodingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8 - 2; // slight upward explosion
    this.color = color;
    this.size = Math.random() * 3 + 1.5;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.03 + 0.015;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // simple gravity simulation
    this.alpha = Math.max(0, this.alpha - this.decay);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Floating score indicators inside Canvas
interface CanvasFloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

// Obstacle obstacle item
interface Obstacle {
  id: number;
  lane: number; // 0, 1, 2
  y: number; // Y coordinate on canvas (starts negative, rolls down)
  isChest: boolean;
  chestType?: 'usd' | 'ton' | 'bnb' | 'jump' | 'pepe' | 'ghs' | 'coins';
  chestAmount?: number;
  broken: boolean;
  color: string;
}

export default function MiningRing({
  energy,
  maxEnergy,
  multiTap,
  efficiencyLevel,
  onMine,
  onGameReward,
  timeRemaining,
  onClaimAndRestartMining,
  language = 'ar',
}: MiningRingProps) {
  const isRtl = language === 'ar';
  
  // Game states: 'idle' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [obstaclesBroken, setObstaclesBroken] = useState<number>(0);
  const [chestsCollected, setChestsCollected] = useState<number>(0);
  
  // High score tracking
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('XTON_RUNNER_HIGH_SCORE') || '0', 10);
  });

  // Keep track of earnings in active run
  const [runEarnings, setRunEarnings] = useState<{
    ton: number;
    bnb: number;
    usd: number;
    pepe: number;
    jump: number;
    ghs: number;
    coins: number;
  }>({
    ton: 0,
    bnb: 0,
    usd: 0,
    pepe: 0,
    jump: 0,
    ghs: 0,
    coins: 0
  });

  // Target notifications
  const [activeChestNotification, setActiveChestNotification] = useState<{
    visible: boolean;
    text: string;
  }>({ visible: false, text: '' });

  // Game UI level banner notification
  const [levelUpBanner, setLevelUpBanner] = useState<boolean>(false);

  // Canvas and game loop refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  // Gameplay coordinates & properties
  const playerLaneRef = useRef<number>(1); // starts in center (0=left, 1=center, 2=right)
  const playerVisualXRef = useRef<number>(50); // percentage or interpolated X position
  const obstaclesRef = useRef<Obstacle[]>([]);
  const particlesRef = useRef<ExplodingParticle[]>([]);
  const floatingTextsRef = useRef<CanvasFloatingText[]>([]);
  const nextObstacleIdRef = useRef<number>(1);
  const spawnTimerRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const isGameOverTriggeredRef = useRef<boolean>(false);

  // Sound helper inside local tab
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize and load stats on launch
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Reset loop variables
    obstaclesRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    playerLaneRef.current = 1;
    playerVisualXRef.current = 50; // Center
    nextObstacleIdRef.current = 1;
    spawnTimerRef.current = 0;
    frameCountRef.current = 0;
    isGameOverTriggeredRef.current = false;

    setScore(0);
    setLevel(1);
    setObstaclesBroken(0);
    setChestsCollected(0);
    setRunEarnings({
      ton: 0,
      bnb: 0,
      usd: 0,
      pepe: 0,
      jump: 0,
      ghs: 0,
      coins: 0
    });

    // Start request animation loop
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };
    resizeCanvas();

    // Start game loop
    const render = () => {
      gameTick();
      animationFrameIdRef.current = requestAnimationFrame(render);
    };
    render();

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePlayerLane(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePlayerLane(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Shift player lanes safely
  const movePlayerLane = (direction: -1 | 1) => {
    const newLane = playerLaneRef.current + direction;
    if (newLane >= 0 && newLane <= 2) {
      playerLaneRef.current = newLane;
      if (!isMuted) {
        sound.playTap();
      }
    }
  };

  // Setup chest contents based on level
  const generateRandomChestReward = (currentLevel: number) => {
    const rewardPool: Array<'usd' | 'ton' | 'bnb' | 'jump' | 'pepe' | 'ghs' | 'coins'> = [
      'ton', 'bnb', 'usd', 'pepe', 'jump', 'ghs', 'coins'
    ];
    // Pick type
    const pickedType = rewardPool[Math.floor(Math.random() * rewardPool.length)];
    
    // Scale multiplier based on current levels
    const scale = 1 + (currentLevel - 1) * 0.25;

    let amount = 0;
    if (pickedType === 'usd') {
      amount = Number((0.05 + Math.random() * 0.15).toFixed(4)) * scale;
    } else if (pickedType === 'ton') {
      amount = Number((0.01 + Math.random() * 0.03).toFixed(5)) * scale;
    } else if (pickedType === 'bnb') {
      amount = Number((0.0001 + Math.random() * 0.0003).toFixed(5)) * scale;
    } else if (pickedType === 'jump') {
      amount = Number((0.02 + Math.random() * 0.06).toFixed(5)) * scale;
    } else if (pickedType === 'pepe') {
      amount = Math.floor((50 + Math.random() * 150) * scale);
    } else if (pickedType === 'ghs') {
      amount = Number((0.01 + Math.random() * 0.04).toFixed(2)) * scale;
    } else if (pickedType === 'coins') {
      amount = Number((0.5 + Math.random() * 2.0).toFixed(4)) * scale;
    }

    return { type: pickedType, amount };
  };

  // Main Canvas game ticks
  const gameTick = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    const width = canvas.width;
    const height = canvas.height;

    // Clear Canvas with a deep starry background and ambient fog
    ctx.fillStyle = '#09090b'; // Tailwind zinc-950
    ctx.fillRect(0, 0, width, height);

    // Render scrolling cyber grid lines on the floor
    drawScrollingGrid(ctx, width, height);

    // Interpolate Player visual X position for smooth sliding transitions
    const targetX = playerLaneRef.current === 0 ? 15 : playerLaneRef.current === 1 ? 50 : 85;
    playerVisualXRef.current += (targetX - playerVisualXRef.current) * 0.22; // smooth slide speed

    // Spawn obstacles and chests
    const spawnThreshold = Math.max(20, 50 - level * 5); // Spawns significantly faster as level increases
    spawnTimerRef.current++;
    if (spawnTimerRef.current >= spawnThreshold) {
      spawnTimerRef.current = 0;
      
      // Select random lane
      const lane = Math.floor(Math.random() * 3);
      const isChest = Math.random() < 0.28; // 28% chance of chest instead of general wall

      let chestData = undefined;
      if (isChest) {
        chestData = generateRandomChestReward(level);
      }

      // Colorful themes for barriers
      const colors = isChest 
        ? '#fbbf24' // gold
        : level === 1 
          ? '#10b981' // emerald green
          : level === 2 
            ? '#f59e0b' // amber
            : level === 3 
              ? '#3b82f6' // blue
              : '#ef4444'; // red

      obstaclesRef.current.push({
        id: nextObstacleIdRef.current++,
        lane,
        y: -50,
        isChest,
        chestType: chestData?.type,
        chestAmount: chestData?.amount,
        broken: false,
        color: colors
      });
    }

    // Update and draw obstacles
    // Speed increases with level - high speed and faster descent of chests
    const runSpeed = (7.5 + level * 1.5) * (width / 400); // normalized against width
    const playerY = height * 0.75;
    const playerRadius = width * 0.08;

    obstaclesRef.current.forEach((obs) => {
      obs.y += runSpeed;

      // Draw obstacle
      const laneWidth = width / 3;
      const obsX = obs.lane * laneWidth + laneWidth / 2;
      const obsSize = width * 0.12;

      if (!obs.broken) {
        ctx.save();
        
        // Draw cyber-barrier glowing effect
        ctx.shadowBlur = 12;
        ctx.shadowColor = obs.color;

        if (obs.isChest) {
          // Draw beautiful 3D-glowing Coin shape depending on type
          ctx.beginPath();
          ctx.arc(obsX, obs.y, obsSize * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = obs.color; // Outer coin base
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Inner coin ring
          ctx.beginPath();
          ctx.arc(obsX, obs.y, obsSize * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b'; // Gold center
          ctx.fill();
          ctx.strokeStyle = '#df8f00';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Currency symbol text or emoji inside the coin
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.floor(obsSize * 0.45)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let coinSymbol = '🪙';
          if (obs.chestType === 'usd') coinSymbol = '$';
          else if (obs.chestType === 'ton') coinSymbol = '💎';
          else if (obs.chestType === 'bnb') coinSymbol = '🔶';
          else if (obs.chestType === 'jump') coinSymbol = '⚡';
          else if (obs.chestType === 'pepe') coinSymbol = '🐸';
          else if (obs.chestType === 'ghs') coinSymbol = 'Hp';
          else if (obs.chestType === 'coins') coinSymbol = '🐝';

          ctx.fillText(coinSymbol, obsX, obs.y + 1);

          // Sparkles around coins
          if (frameCountRef.current % 10 === 0) {
            particlesRef.current.push(new ExplodingParticle(obsX + (Math.random() - 0.5) * obsSize, obs.y, '#ffffff'));
          }
        } else {
          // Draw neon wall barriers
          ctx.fillStyle = obs.color + '22'; // semi-transparent background
          ctx.strokeStyle = obs.color;
          ctx.lineWidth = 3;
          
          ctx.beginPath();
          ctx.roundRect(obsX - obsSize * 0.6, obs.y - obsSize * 0.3, obsSize * 1.2, obsSize * 0.6, 6);
          ctx.fill();
          ctx.stroke();

          // Draw neon hazard stripes inside barrier
          ctx.strokeStyle = obs.color + '77';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(obsX - obsSize * 0.4, obs.y - obsSize * 0.3);
          ctx.lineTo(obsX - obsSize * 0.2, obs.y + obsSize * 0.3);
          ctx.moveTo(obsX - obsSize * 0.1, obs.y - obsSize * 0.3);
          ctx.lineTo(obsX + obsSize * 0.1, obs.y + obsSize * 0.3);
          ctx.moveTo(obsX + obsSize * 0.2, obs.y - obsSize * 0.3);
          ctx.lineTo(obsX + obsSize * 0.4, obs.y + obsSize * 0.3);
          ctx.stroke();
        }

        ctx.restore();

        // Check Collision with player
        const playerVisualX = (playerVisualXRef.current / 100) * width;
        const obsLaneX = obs.lane * laneWidth + laneWidth / 2;

        // Collision logic
        const distY = Math.abs(obs.y - playerY);
        const distX = Math.abs(obsLaneX - playerVisualX);

        if (distY < playerRadius * 0.9 && distX < laneWidth * 0.4) {
          obs.broken = true;
          handleCollision(obs, obsLaneX, obs.y);
        }
      }
    });

    // Clean up out of bounds or broken obstacles
    obstaclesRef.current = obstaclesRef.current.filter((obs) => obs.y < height + 100 && !obs.broken);

    // Draw Player (The Golden Cyber Bee 🐝!)
    drawPlayerBee(ctx, width, height, playerY);

    // Update and draw Explosion Particles
    particlesRef.current.forEach((part) => part.update());
    particlesRef.current.forEach((part) => part.draw(ctx));
    particlesRef.current = particlesRef.current.filter((part) => part.alpha > 0);

    // Update and draw Floating Texts
    floatingTextsRef.current.forEach((text) => {
      text.y += text.vy;
      text.alpha = Math.max(0, text.alpha - 0.02);
      ctx.save();
      ctx.globalAlpha = text.alpha;
      ctx.fillStyle = text.color;
      ctx.font = `black ${Math.floor(width * 0.035)}px monospace`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#000000';
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    });
    floatingTextsRef.current = floatingTextsRef.current.filter((text) => text.alpha > 0);
  };

  // Draw cyber lines on the floor to look like a high speed runner
  const drawScrollingGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;

    // Horizon line
    const horizonY = height * 0.25;

    // Vertical perspective lines
    const numLines = 8;
    for (let i = 0; i <= numLines; i++) {
      const startX = (i / numLines) * width;
      ctx.beginPath();
      ctx.moveTo(width / 2, horizonY);
      ctx.lineTo(startX, height);
      ctx.stroke();
    }

    // Horizontal moving scroll lines
    const numHorizontal = 6;
    const speedOffset = (frameCountRef.current * (2.2 + level * 0.5)) % (height * 0.15);
    for (let i = 0; i < numHorizontal; i++) {
      let relativeY = horizonY + (i / numHorizontal) * (height - horizonY) + speedOffset;
      if (relativeY > height) {
        relativeY = horizonY + (relativeY - height);
      }
      // fading alpha based on Y position (closer is brighter)
      const alpha = ((relativeY - horizonY) / (height - horizonY)) * 0.18;
      ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, relativeY);
      ctx.lineTo(width, relativeY);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Draw the customized animated Golden Cyber Bee on the canvas
  const drawPlayerBee = (ctx: CanvasRenderingContext2D, width: number, height: number, playerY: number) => {
    const playerX = (playerVisualXRef.current / 100) * width;
    const size = width * 0.07; // scale size responsively

    ctx.save();

    // Thrust exhaust flare particles trail
    if (frameCountRef.current % 3 === 0) {
      particlesRef.current.push(new ExplodingParticle(
        playerX + (Math.random() - 0.5) * 10,
        playerY + size * 0.8,
        Math.random() > 0.5 ? '#38bdf8' : '#fda4af'
      ));
    }

    // Jet engine blue flame
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.moveTo(playerX - size * 0.25, playerY + size * 0.5);
    ctx.lineTo(playerX, playerY + size * (1.1 + Math.sin(frameCountRef.current * 0.5) * 0.15));
    ctx.lineTo(playerX + size * 0.25, playerY + size * 0.5);
    ctx.closePath();
    ctx.fill();

    // Wings beating animation
    const wingBeat = Math.sin(frameCountRef.current * 0.9) * size * 0.75;
    
    // Draw left wing
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(playerX - size * 0.7, playerY - size * 0.2, size * 0.5, Math.abs(wingBeat), Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw right wing
    ctx.beginPath();
    ctx.ellipse(playerX + size * 0.7, playerY - size * 0.2, size * 0.5, Math.abs(wingBeat), -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw striped abdomen (glowing gold)
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(playerX, playerY + size * 0.2, size * 0.45, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gold rings on body
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(playerX, playerY + size * 0.05, size * 0.42, size * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(playerX, playerY + size * 0.25, size * 0.38, size * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(playerX, playerY - size * 0.35, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cyber visor (eyes)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#38bdf8';
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(playerX - size * 0.2, playerY - size * 0.45, size * 0.4, size * 0.12, 2);
    ctx.fill();

    ctx.restore();
  };

  // Collision with obstacles trigger rewards
  const handleCollision = (obs: Obstacle, posX: number, posY: number) => {
    // Generate breaking spark particle bursts
    const particlesCount = obs.isChest ? 28 : 16;
    for (let i = 0; i < particlesCount; i++) {
      particlesRef.current.push(new ExplodingParticle(posX, posY, obs.color));
    }

    if (obs.isChest) {
      // It's a special multi-token chest!
      const type = obs.chestType || 'coins';
      const amount = obs.chestAmount || 1;

      // Update state earnings summary
      setRunEarnings((prev) => ({
        ...prev,
        [type]: Number((prev[type as keyof typeof prev] + amount).toFixed(5))
      }));

      // Award the user immediately via prop callback
      onGameReward?.(type, amount);

      setChestsCollected((prev) => prev + 1);
      if (!isMuted) {
        sound.playClaim();
      }

      // Add a floating text indicator in Canvas
      const formattedText = type === 'usd' ? `+$${amount.toFixed(2)} USD` : `+${amount} ${type.toUpperCase()}`;
      floatingTextsRef.current.push({
        id: Math.random(),
        x: posX,
        y: posY - 20,
        text: formattedText,
        color: '#fbbf24',
        alpha: 1.0,
        vy: -1.5
      });

      // Show temporary custom chest popup
      const rewardTextEn = `🎁 Unlocked ${type.toUpperCase()} Chest: +${amount.toFixed(type === 'pepe' ? 0 : 4)} ${type.toUpperCase()}`;
      const rewardTextAr = `🎁 فتحت صندوق ${type.toUpperCase()}: حصلت على +${amount.toFixed(type === 'pepe' ? 0 : 4)} ${type.toUpperCase()}`;
      setActiveChestNotification({
        visible: true,
        text: isRtl ? rewardTextAr : rewardTextEn
      });

      // Dismiss popup after 1.8 seconds
      setTimeout(() => {
        setActiveChestNotification((prev) => ({ ...prev, visible: false }));
      }, 1800);

    } else {
      // Standard barrier collision: consumes energy and awards GHS / Horse
      const energyNeeded = multiTap * 2;
      const efficiencyMultiplier = 1 + (efficiencyLevel - 1) * 0.15;
      const calculatedGhs = Number((0.0050 * multiTap * efficiencyMultiplier).toFixed(4));

      // Attempt to mine
      const hasEnergy = energy >= energyNeeded;
      
      if (hasEnergy) {
        // success
        onMine(calculatedGhs, energyNeeded);
        onGameReward?.('energy', energyNeeded);
        onGameReward?.('ghs', calculatedGhs);
        
        // Accumulate running earnings
        setRunEarnings((prev) => ({
          ...prev,
          ghs: Number((prev.ghs + calculatedGhs).toFixed(4))
        }));

        if (!isMuted) {
          sound.playTap();
        }

        // Add float texts
        floatingTextsRef.current.push({
          id: Math.random(),
          x: posX,
          y: posY - 15,
          text: `+${calculatedGhs.toFixed(3)} Bp/s`,
          color: '#10b981',
          alpha: 1.0,
          vy: -2
        });

        floatingTextsRef.current.push({
          id: Math.random(),
          x: posX,
          y: posY + 10,
          text: `-${energyNeeded} ⚡`,
          color: '#f87171',
          alpha: 1.0,
          vy: -1
        });

      } else {
        // depleted energy: no rewards or penalised breaking
        if (!isMuted) {
          sound.playError();
        }
        floatingTextsRef.current.push({
          id: Math.random(),
          x: posX,
          y: posY - 10,
          text: isRtl ? '⚠️ طاقة فارغة' : '⚠️ Low Energy',
          color: '#ef4444',
          alpha: 1.0,
          vy: -1.2
        });
      }

      setObstaclesBroken((prev) => {
        const nextCount = prev + 1;
        setScore(nextCount * 10);
        
        // Progression level check
        let nextLevel = 1;
        if (nextCount >= 50) {
          nextLevel = 4;
        } else if (nextCount >= 25) {
          nextLevel = 3;
        } else if (nextCount >= 10) {
          nextLevel = 2;
        }

        if (nextLevel > level) {
          setLevel(nextLevel);
          triggerLevelUpNotification();
        }

        return nextCount;
      });
    }
  };

  // Handle game levels progression notification banner
  const triggerLevelUpNotification = () => {
    if (!isMuted) {
      sound.playUpgrade();
    }
    setLevelUpBanner(true);
    setTimeout(() => {
      setLevelUpBanner(false);
    }, 2500);
  };

  // Complete game and trigger gameover modal stats
  const handleExitGame = () => {
    if (gameState === 'playing') {
      setGameState('gameover');
      // Save high score
      const finalScore = obstaclesBroken * 10;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('XTON_RUNNER_HIGH_SCORE', finalScore.toString());
      }
    }
  };

  const getLevelBadgeName = (lvl: number) => {
    if (lvl === 1) return isRtl ? 'برونزي / Novice' : 'Bronze / Novice';
    if (lvl === 2) return isRtl ? 'نشط / Energy' : 'Silver / Energy';
    if (lvl === 3) return isRtl ? 'مطور / Cyber' : 'Gold / Cyber';
    return isRtl ? 'ذهبي / Grandmaster' : 'Platinum / Grandmaster';
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-neutral-900 border border-amber-500/15 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col items-center">
      
      {/* Header info HUD - Always present */}
      <div className="w-full bg-zinc-950 p-3 border-b border-white/5 flex items-center justify-between select-none z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Trophy size={12} />
          </div>
          <div className="text-left">
            <span className="text-[7px] text-zinc-500 block font-mono uppercase tracking-widest">
              {isRtl ? 'أفضل نتيجة' : 'HIGH SCORE'}
            </span>
            <span className="text-[10px] text-zinc-100 font-mono font-bold leading-none">
              {highScore} pts
            </span>
          </div>
        </div>

        {/* Level and active status */}
        <div className="bg-zinc-900 px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1">
          <Star size={10} className="text-amber-400 fill-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[8px] font-bold text-white font-mono uppercase">
            {isRtl ? `المستوى ${level}` : `LVL ${level}`}
          </span>
        </div>

        {/* Sound and actions */}
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 transition"
        >
          <Volume2 size={11} className={isMuted ? 'text-zinc-650 opacity-40' : 'text-amber-500'} />
        </button>
      </div>

      {/* Primary Rendering Window Block */}
      <div className="w-full h-80 sm:h-96 relative overflow-hidden bg-zinc-950 flex items-center justify-center">

        {/* 1. IDLE Screen (Terminal lobby starter UI) */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-neutral-950 via-zinc-950 to-neutral-950 relative z-20 select-none">
            {/* Ambient cyber pulse backdrop */}
            <div className="absolute w-36 h-36 bg-amber-500/5 rounded-full filter blur-2xl animate-pulse pointer-events-none" />

            {/* Float Golden Cyber Bee 3D Icon */}
            <div className="mb-4 animate-bounce" style={{ animationDuration: '3s' }}>
              <svg viewBox="0 0 100 100" className="w-14 h-14 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                <style>{`
                  @keyframes wing-idle-left {
                    0%, 100% { transform: rotate(-5deg); }
                    50% { transform: rotate(-35deg); }
                  }
                  @keyframes wing-idle-right {
                    0%, 100% { transform: rotate(5deg); }
                    50% { transform: rotate(35deg); }
                  }
                  .wing-l {
                    animation: wing-idle-left 0.2s infinite ease-in-out;
                    transform-origin: 42px 42px;
                  }
                  .wing-r {
                    animation: wing-idle-right 0.2s infinite ease-in-out;
                    transform-origin: 58px 42px;
                  }
                `}</style>
                <defs>
                  <linearGradient id="idleWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
                  </linearGradient>
                  <linearGradient id="idleGoldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <path d="M 42 42 C 30 30, 20 32, 28 46 C 34 50, 40 45, 42 42" fill="url(#idleWingGrad)" stroke="#38bdf8" strokeWidth="1.2" className="wing-l" />
                <path d="M 58 42 C 70 30, 80 32, 72 46 C 66 50, 60 45, 58 42" fill="url(#idleWingGrad)" stroke="#38bdf8" strokeWidth="1.2" className="wing-r" />
                <ellipse cx="50" cy="54" rx="14" ry="18" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
                <path d="M 38 46 Q 50 51 62 46 Q 60 41 40 41 Z" fill="url(#idleGoldGrad)" />
                <path d="M 36 56 Q 50 61 64 56 Q 62 51 38 51 Z" fill="url(#idleGoldGrad)" />
                <circle cx="50" cy="36" r="10" fill="#18181b" stroke="#f59e0b" strokeWidth="1.5" />
                <rect x="40" y="32" width="20" height="5" rx="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
              </svg>
            </div>

            {/* Game titles */}
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans mb-1">
              {isRtl ? '🏆 طور الجري وتعدين الحواجز 🏆' : '🏆 BLOCK RUNNER MINING MODE 🏆'}
            </h3>
            <p className="text-[9.5px] text-zinc-400 max-w-[90%] leading-relaxed font-sans mb-4">
              {isRtl 
                ? 'تحرك يميناً ويساراً لكسر الحواجز وتعدين السرعة والذهب! افتح الصناديق التي تظهر داخل الحواجز لتربح TON, BNB, PEPE, Jump, أو الدولار الحقيقي فورا!'
                : 'Slide left and right to crash barriers. Earn Bp/s speed. Break gold boxes within obstacles to gain real instant TON, BNB, JMPT, PEPE, or USD rewards!'}
            </p>

            <div className="bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl mb-4 w-full max-w-[85%] text-left space-y-1.5 font-mono">
              <div className="flex justify-between items-center text-[8px]">
                <span className="text-zinc-500">⚡ {isRtl ? 'تكلفة الجري والكسر:' : 'Energy Cost:'}</span>
                <span className="text-zinc-300 font-bold">-{multiTap * 2} ⚡ {isRtl ? 'طاقة' : 'per smash'}</span>
              </div>
              <div className="flex justify-between items-center text-[8px]">
                <span className="text-zinc-500">🏆 {isRtl ? 'درجة المستوى الحالي:' : 'Current Grade:'}</span>
                <span className="text-amber-400 font-bold font-sans">{getLevelBadgeName(level)}</span>
              </div>
            </div>

            {/* Trigger start */}
            <button
              onClick={() => {
                sound.playClaim();
                setGameState('playing');
              }}
              className="w-full max-w-[70%] py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-[10.5px] rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer uppercase transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Play size={12} className="fill-slate-950" />
              <span>{isRtl ? 'ابدأ الجري والتعدين فورا 🚀' : 'START MINING RUN 🚀'}</span>
            </button>
          </div>
        )}

        {/* 2. PLAYING Canvas Renderer */}
        {gameState === 'playing' && (
          <div className="w-full h-full relative select-none">
            {/* Live Canvas engine */}
            <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />

            {/* Level up overlay banner */}
            {levelUpBanner && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none z-30 animate-fade-in pointer-events-none">
                <div className="bg-zinc-950 border-2 border-amber-500/30 p-4 rounded-2xl text-center shadow-2xl scale-110 transform transition">
                  <span className="text-amber-400 text-[18px] block animate-bounce font-black leading-none uppercase">
                    🎉 {isRtl ? 'مستوى جديد!' : 'LEVEL UP!'} 🎉
                  </span>
                  <span className="text-[10px] text-zinc-300 font-mono mt-1 block uppercase">
                    {getLevelBadgeName(level)}
                  </span>
                  <p className="text-[8px] text-zinc-500 mt-1.5">
                    {isRtl ? 'تم زيادة السرعة وصناديق الجوائز المليئة بالذهب!' : 'Increased running speed and rarer loot crates!'}
                  </p>
                </div>
              </div>
            )}

            {/* Active temporary chest notification banner */}
            {activeChestNotification.visible && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[85%] bg-zinc-950/95 border border-amber-500 px-3 py-2 rounded-xl text-center shadow-2xl select-none z-30 animate-bounce pointer-events-none">
                <span className="text-[9.5px] font-black text-amber-400 block font-mono">
                  {activeChestNotification.text}
                </span>
              </div>
            )}

            {/* Direct manual click steers (left and right screen margins) */}
            <div 
              onClick={() => movePlayerLane(-1)} 
              className="absolute top-0 left-0 w-1/4 h-full cursor-pointer hover:bg-white/2 transition z-10" 
              title="Steer Left"
            />
            <div 
              onClick={() => movePlayerLane(1)} 
              className="absolute top-0 right-0 w-1/4 h-full cursor-pointer hover:bg-white/2 transition z-10" 
              title="Steer Right"
            />

            {/* Live game statistics HUD overlay */}
            <div className="absolute bottom-16 left-3 bg-zinc-950/80 border border-white/5 p-2 rounded-xl text-left text-[8.5px] text-zinc-300 font-mono z-20 max-w-[55%] space-y-0.5 select-none pointer-events-none">
              <div>
                <span className="text-zinc-550 block text-[6.5px] uppercase">SCORE</span>
                <span className="text-white font-bold">{score} pts</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-550 text-[6.5px] uppercase block">SMASHED</span>
                <span className="text-emerald-400 font-bold">{obstaclesBroken}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-zinc-550 text-[6.5px] uppercase block">CHESTS</span>
                <span className="text-amber-400 font-bold">{chestsCollected} 🎁</span>
              </div>
            </div>

            {/* Quick manual Pause/Stop controller */}
            <button
              onClick={() => {
                sound.playTap();
                handleExitGame();
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-950/95 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-white/10 transition z-20 cursor-pointer"
              title="End session"
            >
              <Pause size={12} />
            </button>
          </div>
        )}

        {/* 3. GAMEOVER Screen (Run summaries / collection lists) */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-neutral-950 z-20 select-none">
            <div className="absolute w-28 h-28 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />

            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <Award size={18} />
            </div>

            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono mb-1">
              {isRtl ? '🏁 انتهى الجري - ملخص التعدين 🏁' : '🏁 SESSION SUMMARY 🏁'}
            </h3>
            
            <p className="text-[8.5px] text-zinc-500 font-mono mb-3">
              {isRtl ? `درجة المستوى المُنجز: ${level} (${getLevelBadgeName(level)})` : `Completed Level: ${level} (${getLevelBadgeName(level)})`}
            </p>

            {/* Score grids */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-[90%] mb-3 text-left font-mono">
              <div className="bg-zinc-900 p-2 rounded-xl border border-white/5">
                <span className="text-[7px] text-zinc-500 block uppercase font-sans">{isRtl ? 'نقاط الجري' : 'POINTS'}</span>
                <span className="text-[10.5px] font-bold text-white">{score} pts</span>
              </div>
              <div className="bg-zinc-900 p-2 rounded-xl border border-white/5">
                <span className="text-[7px] text-zinc-500 block uppercase font-sans">{isRtl ? 'حواجز مكسورة' : 'SMASHED'}</span>
                <span className="text-[10.5px] font-bold text-emerald-400">{obstaclesBroken}</span>
              </div>
            </div>

            {/* Chests collections */}
            <div className="w-full max-w-[90%] bg-zinc-900 border border-white/5 p-2 rounded-xl mb-4 text-left">
              <span className="text-[7px] text-zinc-500 block font-sans uppercase font-bold tracking-wider mb-1.5 border-b border-white/5 pb-1">
                🎁 {isRtl ? 'صناديق الجوائز المجمعة بالكامل:' : 'UNLOCKED CHESTS CONTENTS:'}
              </span>
              
              {chestsCollected > 0 ? (
                <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[8px] leading-tight text-white">
                  {runEarnings.ton > 0 && (
                    <div className="bg-zinc-950 p-1 rounded border border-emerald-500/10">
                      <span className="text-emerald-400 font-bold">+{runEarnings.ton.toFixed(4)}</span>
                      <span className="text-zinc-500 block text-[6.5px]">TON</span>
                    </div>
                  )}
                  {runEarnings.usd > 0 && (
                    <div className="bg-zinc-950 p-1 rounded border border-amber-500/10">
                      <span className="text-amber-400 font-bold">+${runEarnings.usd.toFixed(2)}</span>
                      <span className="text-zinc-500 block text-[6.5px]">USD</span>
                    </div>
                  )}
                  {runEarnings.bnb > 0 && (
                    <div className="bg-zinc-950 p-1 rounded border border-yellow-500/10">
                      <span className="text-yellow-400 font-bold">+{runEarnings.bnb.toFixed(4)}</span>
                      <span className="text-zinc-500 block text-[6.5px]">BNB</span>
                    </div>
                  )}
                  {runEarnings.jump > 0 && (
                    <div className="bg-zinc-950 p-1 rounded border border-blue-500/10">
                      <span className="text-blue-400 font-bold">+{runEarnings.jump.toFixed(4)}</span>
                      <span className="text-zinc-500 block text-[6.5px]">JMPT</span>
                    </div>
                  )}
                  {runEarnings.pepe > 0 && (
                    <div className="bg-zinc-950 p-1 rounded border border-red-500/10">
                      <span className="text-red-400 font-bold">+{runEarnings.pepe}</span>
                      <span className="text-zinc-500 block text-[6.5px]">PEPE</span>
                    </div>
                  )}
                  {runEarnings.ghs > 0 && (
                    <div className="bg-zinc-950 p-1 rounded border border-purple-500/10">
                      <span className="text-purple-400 font-bold">+{runEarnings.ghs.toFixed(2)}</span>
                      <span className="text-zinc-500 block text-[6.5px]">Bp/s</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-600 italic text-[7.5px] py-1 text-center font-sans">
                  {isRtl ? 'لم يتم كسر أي صناديق في هذا الجري.' : 'No chests smashed. Smashed barriers have high chest drop rates!'}
                </div>
              )}
            </div>

            {/* Action retry */}
            <button
              onClick={() => {
                sound.playClaim();
                setGameState('playing');
              }}
              className="w-full max-w-[70%] py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] rounded-xl cursor-pointer uppercase transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              <span>{isRtl ? 'إعادة الجري والمحاولة 🔁' : 'RETRY RUN 🔁'}</span>
            </button>
          </div>
        )}

      </div>

      {/* On-Screen touch control buttons (Mobile friendly) */}
      {gameState === 'playing' && (
        <div className="w-full bg-zinc-950 p-3.5 border-t border-white/5 flex justify-center gap-6 select-none z-10">
          <button
            onTouchStart={() => movePlayerLane(-1)}
            onMouseDown={() => movePlayerLane(-1)}
            className="w-16 h-10 bg-zinc-900 border border-white/10 active:bg-amber-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center transition active:scale-90 cursor-pointer shadow"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onTouchStart={() => movePlayerLane(1)}
            onMouseDown={() => movePlayerLane(1)}
            className="w-16 h-10 bg-zinc-900 border border-white/10 active:bg-amber-500 active:text-slate-950 text-white rounded-2xl flex items-center justify-center transition active:scale-90 cursor-pointer shadow"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Footer statistics bar showing energy constraints */}
      <div className="w-full bg-zinc-950 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[8px] text-zinc-400 select-none font-mono">
        <span className="flex items-center gap-1">
          <Zap size={9} className="text-amber-400" />
          <span>{energy} / {maxEnergy} HP ⚡</span>
        </span>
        <span className="text-[7.5px] text-zinc-550 uppercase">
          {isRtl ? 'لوحة تحكم التعدين والمستويات' : 'MINING ARCADE PLATFORM'}
        </span>
      </div>
    </div>
  );
}
