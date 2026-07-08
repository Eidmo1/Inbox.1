import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, RefreshCw, Key, Shield, HelpCircle, Sparkles, 
  Play, Timer, Award, AlertTriangle, Zap, Gamepad2, Coins
} from 'lucide-react';
import { sound } from './AudioSynth';
import { Language } from '../lib/translations';

interface FreeEarnHubProps {
  language: Language;
  onReward: (type: 'coins' | 'ghs' | 'tickets' | 'usd' | 'ton' | 'bnb' | 'pepe' | 'jump', amount: number) => void;
  showAlert?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function FreeEarnHub({ language, onReward, showAlert }: FreeEarnHubProps) {
  const isRtl = language === 'ar';
  const [activeEarnTab, setActiveEarnTab] = useState<'captcha' | 'scratch' | 'fast_tap'>('captcha');

  // --- 1. CAPTCHA & MATH STATES ---
  const [captchaType, setCaptchaType] = useState<'text' | 'math'>('text');
  const [textCaptchaCode, setTextCaptchaCode] = useState('');
  const [textCaptchaInput, setTextCaptchaInput] = useState('');
  const [mathQuestion, setMathQuestion] = useState({ q: '', a: 0 });
  const [mathInput, setMathInput] = useState('');
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [captchaAttempts, setCaptchaAttempts] = useState(0);

  // --- 2. SCRATCH CARD STATES ---
  interface ScratchItem {
    id: number;
    revealed: boolean;
    rewardType: 'ton' | 'pepe' | 'btc' | 'empty';
    value: number;
    icon: string;
    label: string;
  }
  const [scratchCards, setScratchCards] = useState<ScratchItem[]>([]);
  const [scratchedCount, setScratchedCount] = useState(0);
  const [scratchClaimed, setScratchClaimed] = useState(false);
  const [scratchCooldown, setScratchCooldown] = useState(false);

  // --- 3. FAST TAP GAME STATES ---
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'ended'>('idle');
  const [gameGrid, setGameGrid] = useState<('coin' | 'bomb' | 'empty')[]>(Array(9).fill('empty'));
  const [gameScore, setGameScore] = useState(0);
  const [gameTimeLeft, setGameTimeLeft] = useState(15);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('XTON_FASTTAP_HIGHSCORE') || '0'));
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- INITIALIZERS ---
  useEffect(() => {
    generateNewCaptcha();
    resetScratchCard();
    return () => {
      stopTapGame();
    };
  }, []);

  // --- 1. CAPTCHA GENERATOR LOGIC ---
  const generateNewCaptcha = () => {
    // Text Captcha
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTextCaptchaCode(code);
    setTextCaptchaInput('');

    // Math Captcha
    const num1 = Math.floor(Math.random() * 40) + 5;
    const num2 = Math.floor(Math.random() * 20) + 2;
    const operations: ('+' | '-' | '*')[] = ['+', '-', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];
    let qText = '';
    let answer = 0;

    if (op === '+') {
      qText = `${num1} + ${num2}`;
      answer = num1 + num2;
    } else if (op === '-') {
      qText = `${num1} - ${num2}`;
      answer = num1 - num2;
    } else {
      const smallNum = Math.floor(Math.random() * 9) + 2;
      const multiplier = Math.floor(Math.random() * 8) + 3;
      qText = `${smallNum} × ${multiplier}`;
      answer = smallNum * multiplier;
    }

    setMathQuestion({ q: qText, a: answer });
    setMathInput('');
    setCaptchaStatus('idle');
  };

  const handleVerifyCaptcha = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();

    let isCorrect = false;
    if (captchaType === 'text') {
      isCorrect = textCaptchaInput.trim() === textCaptchaCode;
    } else {
      isCorrect = parseInt(mathInput.trim()) === mathQuestion.a;
    }

    if (isCorrect) {
      sound.playClaim();
      setCaptchaStatus('success');
      setCaptchaAttempts(0);
      
      // Grant instant rewards in multiple assets directly to the miner's wallet!
      const baseUsd = 0.25;
      const baseTon = 0.05;
      const baseCoins = 50.0;
      onReward('usd', baseUsd);
      onReward('ton', baseTon);
      onReward('coins', baseCoins);

      if (showAlert) {
        showAlert(
          isRtl 
            ? `✅ كابتشا صحيحة! حصلت على +$${baseUsd.toFixed(2)} دولار، +${baseTon.toFixed(2)} TON، و +${baseCoins.toFixed(0)} Queen bee تضاف لمحفظتك فوراً!`
            : `✅ Correct Captcha! You earned +$${baseUsd.toFixed(2)} USD, +${baseTon.toFixed(2)} TON, and +${baseCoins.toFixed(0)} Queen bee added directly to your wallet!`,
          'success'
        );
      }

      // Automatically generate a new one after a short delay
      setTimeout(() => {
        generateNewCaptcha();
      }, 1500);
    } else {
      sound.playTap(); // play simple buzz or tap
      setCaptchaStatus('error');
      setCaptchaAttempts(prev => prev + 1);

      if (showAlert) {
        showAlert(
          isRtl ? '❌ الرمز المدخل غير صحيح، حاول مرة أخرى!' : '❌ Incorrect code, try again!',
          'error'
        );
      }

      // Reset error after 1.5 seconds
      setTimeout(() => {
        setCaptchaStatus('idle');
      }, 1500);
    }
  };

  // --- 2. SCRATCH CARD GAME LOGIC ---
  const resetScratchCard = () => {
    // Generate 6 scratch slots with hidden variables
    const types: ('ton' | 'pepe' | 'btc' | 'empty')[] = ['ton', 'ton', 'pepe', 'pepe', 'btc', 'empty'];
    // Shuffle
    const shuffled = types.sort(() => Math.random() - 0.5);

    const items: ScratchItem[] = shuffled.map((type, idx) => {
      let value = 0;
      let label = '';
      let icon = '';

      if (type === 'ton') {
        value = Number((0.10 + Math.random() * 0.40).toFixed(2));
        label = 'BRONZE USD';
        icon = '💵';
      } else if (type === 'pepe') {
        value = Number((0.50 + Math.random() * 1.00).toFixed(2));
        label = 'SILVER USD';
        icon = '💰';
      } else if (type === 'btc') {
        value = Number((1.50 + Math.random() * 3.50).toFixed(2));
        label = 'GOLDEN USD';
        icon = '👑';
      } else {
        value = 0;
        label = 'TRY AGAIN';
        icon = '💨';
      }

      return {
        id: idx,
        revealed: false,
        rewardType: type,
        value,
        icon,
        label
      };
    });

    setScratchCards(items);
    setScratchedCount(0);
    setScratchClaimed(false);
  };

  const handleScratchSlot = (id: number) => {
    if (scratchCooldown || scratchClaimed) return;
    const card = scratchCards.find(c => c.id === id);
    if (!card || card.revealed) return;

    sound.playTap();
    
    const nextCards = scratchCards.map(c => c.id === id ? { ...c, revealed: true } : c);
    const nextCount = scratchedCount + 1;

    setScratchCards(nextCards);
    setScratchedCount(nextCount);

    if (nextCount === 3) {
      calculateScratchReward(nextCards);
    }
  };

  const calculateScratchReward = (currentCards: ScratchItem[]) => {
    setScratchClaimed(true);
    // Find all revealed cards
    const revealedCards = currentCards.filter(c => c.revealed);
    let totalWin = 0;
    revealedCards.forEach(c => {
      totalWin += c.value;
    });

    if (totalWin > 0) {
      sound.playClaim();
      const earnedUsd = Number(totalWin.toFixed(2));
      const earnedTon = Number((totalWin * 0.2).toFixed(4));
      const earnedCoins = Number((totalWin * 100).toFixed(2));

      onReward('usd', earnedUsd);
      onReward('ton', earnedTon);
      onReward('coins', earnedCoins);

      if (showAlert) {
        showAlert(
          isRtl 
            ? `🎉 مبروك! لقد مسحت البطاقة وربحت ما مجموعه +$${earnedUsd.toFixed(2)} دولار، +${earnedTon.toFixed(2)} TON، و +${earnedCoins.toFixed(0)} Queen bee تضاف لمحفظتك فوراً!`
            : `🎉 Congrats! You scratched the cards and revealed +$${earnedUsd.toFixed(2)} USD, +${earnedTon.toFixed(2)} TON, and +${earnedCoins.toFixed(0)} Queen bee added instantly!`,
          'success'
        );
      }
    } else {
      if (showAlert) {
        showAlert(
          isRtl ? '🍀 حظاً أوفر المرة القادمة! البطاقة لم تحتوِ على مكاسب.' : '🍀 Hard luck! This card did not have matching gains.',
          'info'
        );
      }
    }

    // Put on short cooldown
    setScratchCooldown(true);
    setTimeout(() => {
      setScratchCooldown(false);
    }, 4000);
  };

  // --- 3. FAST TAP GAME LOGIC ---
  const startTapGame = () => {
    sound.playTap();
    setGameState('playing');
    setGameScore(0);
    setGameTimeLeft(15);
    setGameGrid(Array(9).fill('empty'));

    // Timer interval
    gameTimerRef.current = setInterval(() => {
      setGameTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    // Spawning interval (every 800ms)
    gameIntervalRef.current = setInterval(() => {
      spawnGridItems();
    }, 800);
  };

  const stopTapGame = () => {
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
  };

  const spawnGridItems = () => {
    setGameGrid(() => {
      const nextGrid: ('coin' | 'bomb' | 'empty')[] = Array(9).fill('empty');
      const coinCount = Math.floor(Math.random() * 2) + 1; // 1 to 2 coins
      const bombChance = Math.random() < 0.45; // 45% chance of spawning a bomb

      // Place coins
      let placedCoins = 0;
      while (placedCoins < coinCount) {
        const randIdx = Math.floor(Math.random() * 9);
        if (nextGrid[randIdx] === 'empty') {
          nextGrid[randIdx] = 'coin';
          placedCoins++;
        }
      }

      // Place bomb
      if (bombChance) {
        let placedBomb = false;
        while (!placedBomb) {
          const randIdx = Math.floor(Math.random() * 9);
          if (nextGrid[randIdx] === 'empty') {
            nextGrid[randIdx] = 'bomb';
            placedBomb = true;
          }
        }
      }

      return nextGrid;
    });
  };

  const handleTapGridItem = (idx: number, type: 'coin' | 'bomb' | 'empty') => {
    if (gameState !== 'playing' || type === 'empty') return;

    if (type === 'coin') {
      sound.playTap();
      setGameScore(prev => prev + 1);
      // Remove clicked coin immediately
      setGameGrid(prev => prev.map((item, i) => i === idx ? 'empty' : item));
    } else if (type === 'bomb') {
      sound.playTap(); // Buzz
      setGameTimeLeft(prev => Math.max(1, prev - 3)); // Lose 3 seconds
      // Remove clicked bomb immediately
      setGameGrid(prev => prev.map((item, i) => i === idx ? 'empty' : item));
      if (showAlert) {
        showAlert(
          isRtl ? '💥 قنبلة! تم خصم 3 ثوانٍ من الوقت المتبقي!' : '💥 Bomb! -3 seconds penalty!',
          'warning'
        );
      }
    }
  };

  const endTapGame = () => {
    stopTapGame();
    setGameState('ended');
    sound.playClaim();

    // Reward in USD: Score * 0.05 USD, TON: Score * 0.02 TON, Coins: Score * 15 Queen bee
    const finalPrizeUSD = Number((gameScore * 0.05).toFixed(2));
    const finalPrizeTON = Number((gameScore * 0.02).toFixed(4));
    const finalPrizeCoins = Number((gameScore * 15).toFixed(2));

    if (finalPrizeUSD > 0) {
      onReward('usd', finalPrizeUSD);
    }
    if (finalPrizeTON > 0) {
      onReward('ton', finalPrizeTON);
    }
    if (finalPrizeCoins > 0) {
      onReward('coins', finalPrizeCoins);
    }

    if (gameScore > highScore) {
      setHighScore(gameScore);
      localStorage.setItem('XTON_FASTTAP_HIGHSCORE', String(gameScore));
    }

    if (showAlert) {
      showAlert(
        isRtl 
          ? `🎉 انتهت اللعبة! حصلت على مجموع ${gameScore} نقرة صحيحة، وربحت +$${finalPrizeUSD.toFixed(2)} دولار، +${finalPrizeTON.toFixed(2)} TON، و +${finalPrizeCoins.toFixed(0)} Queen bee تضاف لمحفظتك فوراً!`
          : `🎉 Time's Up! You scored ${gameScore} hits and won +$${finalPrizeUSD.toFixed(2)} USD, +${finalPrizeTON.toFixed(2)} TON, and +${finalPrizeCoins.toFixed(0)} Queen bee added instantly!`,
        'success'
      );
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && gameTimeLeft <= 0) {
      endTapGame();
    }
  }, [gameTimeLeft, gameState]);


  return (
    <div className="bg-neutral-900 border border-white/5 rounded-2.5xl p-4.5 space-y-4">
      {/* Header and selection tabs */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
        <div className="flex items-center gap-1.5">
          <Zap size={15} className="text-purple-400 animate-pulse" />
          <h3 className="text-xs font-black text-white font-sans uppercase tracking-wider">
            {isRtl ? '⚡ مركز الربح السريع والمجاني (الألعاب والكابتشا)' : '⚡ FREE FAST-EARNING HUB (GAMES & CAPTCHAS)'}
          </h3>
        </div>
        <p className="text-[9px] text-zinc-400 leading-normal">
          {isRtl 
            ? 'طرق ربح مجانية وسريعة تماماً دون دفع أي رسوم. حل الرموز الأمنية، امسح بطاقات الهدايا، أو العب لعبة ردة الفعل السريعة لتكسب عملات حقيقية فوراً!'
            : 'Unlocking 100% free ways to earn. Solve security captchas, rub lucky gift cards, or smash grid targets to instantly boost your bee power and wallet!'}
        </p>
      </div>

      {/* Navigation Subtabs */}
      <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/5">
        <button
          onClick={() => { sound.playTap(); setActiveEarnTab('captcha'); }}
          className={`py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${activeEarnTab === 'captcha' ? 'bg-purple-500 text-slate-950 font-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <Shield size={11} />
          <span>{isRtl ? 'كابتشا التعدين' : 'Captcha'}</span>
        </button>

        <button
          onClick={() => { sound.playTap(); setActiveEarnTab('scratch'); }}
          className={`py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${activeEarnTab === 'scratch' ? 'bg-purple-500 text-slate-950 font-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <Sparkles size={11} />
          <span>{isRtl ? 'امسح واربح' : 'Scratch Box'}</span>
        </button>

        <button
          onClick={() => { sound.playTap(); setActiveEarnTab('fast_tap'); }}
          className={`py-1.5 text-[9.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${activeEarnTab === 'fast_tap' ? 'bg-purple-500 text-slate-950 font-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <Gamepad2 size={11} />
          <span>{isRtl ? 'لعبة النقر' : 'Tap Blitz'}</span>
        </button>
      </div>

      {/* --- CONTENT TABS --- */}
      <div className="min-h-[220px] flex flex-col justify-center">
        
        {/* TAB 1: CAPTCHA CHALLENGES */}
        {activeEarnTab === 'captcha' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase font-mono tracking-wider flex items-center gap-1">
                <Key size={11} />
                <span>{isRtl ? 'تجاوز رموز الحماية وكسب العملات' : 'SOLVE SECURITY CAPTCHA'}</span>
              </span>
              <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => { sound.playTap(); setCaptchaType('text'); }}
                  className={`text-[8px] font-bold px-2 py-0.5 rounded ${captchaType === 'text' ? 'bg-purple-500/25 text-purple-400' : 'text-zinc-500'}`}
                >
                  {isRtl ? 'حروف وأرقام' : 'Alphanumeric'}
                </button>
                <button
                  type="button"
                  onClick={() => { sound.playTap(); setCaptchaType('math'); }}
                  className={`text-[8px] font-bold px-2 py-0.5 rounded ${captchaType === 'math' ? 'bg-purple-500/25 text-purple-400' : 'text-zinc-500'}`}
                >
                  {isRtl ? 'رياضيات ذكية' : 'Arithmetic'}
                </button>
              </div>
            </div>

            {/* Captcha Display Block */}
            <div className="flex flex-col items-center justify-center py-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full filter blur-lg pointer-events-none" />
              
              {captchaType === 'text' ? (
                /* Text Captcha styled image block */
                <div className="px-5 py-2.5 bg-gradient-to-r from-purple-950/40 to-indigo-950/30 border border-purple-500/20 rounded-xl flex items-center gap-3 relative select-none">
                  {/* Distortion lines to mock real captchas */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-red-500/40 transform -rotate-3 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/3 h-[1px] bg-blue-500/40 transform rotate-2 pointer-events-none" />
                  <div className="absolute inset-y-0 left-1/3 w-[1px] bg-zinc-500/30 transform rotate-45 pointer-events-none" />
                  
                  <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-300 font-mono italic select-none drop-shadow-md">
                    {textCaptchaCode}
                  </span>
                  
                  <button
                    type="button"
                    onClick={generateNewCaptcha}
                    className="p-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-md transition hover:rotate-180 duration-300"
                  >
                    <RefreshCw size={10} />
                  </button>
                </div>
              ) : (
                /* Math Arithmetic Captcha block */
                <div className="px-5 py-2.5 bg-gradient-to-r from-cyan-950/40 to-indigo-950/30 border border-cyan-500/20 rounded-xl flex items-center gap-3 relative select-none">
                  <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-cyan-400/25 pointer-events-none" />
                  
                  <span className="text-lg font-black tracking-wider text-cyan-300 font-mono italic select-none">
                    {mathQuestion.q} = ?
                  </span>
                  
                  <button
                    type="button"
                    onClick={generateNewCaptcha}
                    className="p-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-md transition hover:rotate-180 duration-300"
                  >
                    <RefreshCw size={10} />
                  </button>
                </div>
              )}

              <span className="text-[8.5px] text-zinc-500 uppercase font-mono tracking-tight text-center">
                {isRtl ? 'المكافأة: +$0.25 دولار تضاف لمحفظتك تلقائياً' : 'REWARD: +$0.25 USD added to your wallet automatically'}
              </span>
            </div>

            {/* Verification Form */}
            <form onSubmit={handleVerifyCaptcha} className="flex gap-2">
              <input
                type="text"
                required
                dir="ltr"
                value={captchaType === 'text' ? textCaptchaInput : mathInput}
                onChange={(e) => captchaType === 'text' ? setTextCaptchaInput(e.target.value) : setMathInput(e.target.value)}
                placeholder={captchaType === 'text' ? (isRtl ? 'اكتب الكود هنا...' : 'Enter code here...') : (isRtl ? 'النتيجة...' : 'Result...')}
                className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-purple-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0 uppercase"
              >
                <CheckCircle size={12} />
                <span>{isRtl ? 'تحقق واكسب' : 'Verify'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: LUCKY SCRATCH CARDS */}
        {activeEarnTab === 'scratch' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} className="text-purple-400 animate-spin-slow" />
                <span>{isRtl ? 'بطاقة امسح واربح الذهبية المجانية' : 'LUCKY CRYPTO SCRATCH CARD'}</span>
              </span>
              <span className="text-[8px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-black font-mono">
                {isRtl ? `ممسوح: ${scratchedCount}/3 مربعات` : `Scratched: ${scratchedCount}/3 boxes`}
              </span>
            </div>

            <p className="text-[9.5px] text-zinc-400 leading-normal">
              {isRtl 
                ? 'انقر على أي 3 مربعات في الشبكة أدناه لتكشط المادة الفضية وتكشف عن قيمة المكافأة الرقمية المخفية!'
                : 'Tap any 3 slots on the grid below to scratch off the silver layer and instantly claim the sum of revealed crypto rewards!'}
            </p>

            {/* Scratch Cards Grid */}
            <div className="grid grid-cols-3 gap-2 py-1">
              {scratchCards.map((card) => {
                return (
                  <button
                    key={card.id}
                    disabled={scratchClaimed || scratchCooldown || (scratchedCount >= 3 && !card.revealed)}
                    onClick={() => handleScratchSlot(card.id)}
                    className={`h-20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition duration-150 border cursor-pointer ${card.revealed ? 'bg-zinc-950 border-white/5 text-white' : 'bg-gradient-to-br from-zinc-700 via-zinc-850 to-zinc-800 border-white/10 active:scale-95 shadow-inner'}`}
                  >
                    {card.revealed ? (
                      /* Revealed card contents */
                      <motion.div
                        initial={{ scale: 0.75, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center p-1 space-y-0.5"
                      >
                        <span className="text-xl">{card.icon}</span>
                        <span className="text-[8.5px] font-bold text-amber-400 font-mono">${card.value.toFixed(2)}</span>
                        <span className="text-[6.5px] font-mono text-zinc-500 uppercase tracking-tight">{card.label}</span>
                      </motion.div>
                    ) : (
                      /* Hidden scratch silver overlay */
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800 text-zinc-400 text-center select-none">
                        <Coins size={14} className="text-zinc-500 mb-0.5 animate-pulse" />
                        <span className="text-[7.5px] font-mono tracking-wider font-extrabold text-zinc-400 uppercase">
                          {isRtl ? 'اكشط' : 'SCRATCH'}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Reset / Status block */}
            <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
              <span className="text-[8.5px] text-zinc-500 uppercase font-mono flex items-center gap-1">
                <CheckCircle size={10} className="text-purple-400" />
                <span>{isRtl ? 'بطاقات هدايا حقيقية ممولة' : 'Sponsored Gift Campaigns'}</span>
              </span>

              {scratchClaimed ? (
                <button
                  type="button"
                  disabled={scratchCooldown}
                  onClick={() => { sound.playTap(); resetScratchCard(); }}
                  className={`flex items-center gap-1 text-[9px] font-black py-1.5 px-3 rounded-lg transition uppercase tracking-tight cursor-pointer ${scratchCooldown ? 'bg-zinc-800 text-zinc-500 pointer-events-none border border-white/5' : 'bg-purple-500 hover:bg-purple-400 text-slate-950'}`}
                >
                  <RefreshCw size={10} className={scratchCooldown ? '' : 'animate-spin-slow'} />
                  <span>
                    {scratchCooldown 
                      ? (isRtl ? 'انتظر تبريد البطاقة...' : 'Card Cooldown...') 
                      : (isRtl ? 'بطاقة جديدة 🛒' : 'New Lucky Card 🛒')}
                  </span>
                </button>
              ) : (
                <span className="text-[9px] font-bold text-amber-500 font-mono animate-pulse">
                  {isRtl ? '👉 اختر 3 مربعات للكشف عن الجائزة' : '👉 Select 3 boxes to reveal prize'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FAST TAP GAME */}
        {activeEarnTab === 'fast_tap' && (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] text-purple-400 font-extrabold uppercase font-mono tracking-wider flex items-center gap-1.5">
                <Gamepad2 size={11} className="text-purple-400 animate-bounce" />
                <span>{isRtl ? 'لعبة سرعة ردة الفعل وجني الدولارات' : 'REACTION SPEED TAP BLITZ (USD)'}</span>
              </span>
              <div className="flex items-center gap-2 font-mono text-[9px]">
                <span className="text-zinc-500">{isRtl ? 'الرقم القياسي:' : 'High Score:'} <b className="text-purple-300">{highScore}</b></span>
              </div>
            </div>

            {gameState === 'idle' && (
              /* Idle / Start State */
              <div className="flex flex-col items-center justify-center py-6 bg-zinc-950 rounded-2xl border border-white/5 text-center space-y-4 relative">
                <div className="w-11 h-11 rounded-full bg-purple-500/10 flex items-center justify-center text-xl text-purple-400">
                  ⚡
                </div>
                <div className="space-y-1 px-3">
                  <h4 className="text-xs font-black text-white">{isRtl ? 'هل تمتلك سرعة كافية للفوز بالدولارات؟' : 'Do you have fast fingers?'}</h4>
                  <p className="text-[9px] text-zinc-400 max-w-[280px] mx-auto leading-normal">
                    {isRtl 
                      ? 'لديك 15 ثانية فقط! انقر على أوراق الدولارات الخضراء السريعة لتكسب +$0.05 دولار لكل نقرة. احذر القنابل الحمراء التي تخصم الوقت!'
                      : 'You have only 15 seconds! Tap the fast green dollar bills to earn +$0.05 USD each. Avoid tapping red bombs which deduct 3 seconds!'}
                  </p>
                </div>
                <button
                  onClick={startTapGame}
                  className="px-6 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl uppercase tracking-wider transition cursor-pointer hover:scale-103 shadow-md flex items-center gap-1.5"
                >
                  <Play size={11} fill="currentColor" />
                  <span>{isRtl ? 'ابدأ اللعب الآن 🚀' : 'Start Blitz Game 🚀'}</span>
                </button>
              </div>
            )}

            {gameState === 'playing' && (
              /* Active Gameplay Grid */
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1 text-[9.5px] font-mono text-zinc-350">
                    <Timer size={11} className="text-cyan-400" />
                    <span>{isRtl ? 'الوقت المتبقي:' : 'Time Left:'} <b className="text-cyan-300 text-xs">{gameTimeLeft}s</b></span>
                  </div>
                  <div className="flex items-center gap-1 text-[9.5px] font-mono text-zinc-350">
                    <Award size={11} className="text-amber-400" />
                    <span>{isRtl ? 'النقاط:' : 'Score:'} <b className="text-amber-400 text-xs">{gameScore}</b></span>
                  </div>
                </div>

                {/* 3x3 Interaction Grid */}
                <div className="grid grid-cols-3 gap-2.5 bg-zinc-950 p-3 rounded-2xl border border-white/5">
                  {gameGrid.map((cellType, idx) => {
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTapGridItem(idx, cellType)}
                        className={`h-16 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${cellType === 'coin' ? 'bg-amber-500/10 border-amber-500/40 text-2xl active:scale-90 animate-pulse ring-2 ring-amber-500/10' : cellType === 'bomb' ? 'bg-red-500/10 border-red-500/40 text-2xl active:scale-90 ring-2 ring-red-500/10 animate-bounce' : 'bg-neutral-900/40 border-white/2'}`}
                      >
                        {cellType === 'coin' && (
                          <motion.span
                            initial={{ scale: 0.5, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="select-none drop-shadow-md"
                          >
                            💵
                          </motion.span>
                        )}
                        {cellType === 'bomb' && (
                          <motion.span
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="select-none drop-shadow-md"
                          >
                            💥
                          </motion.span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {gameState === 'ended' && (
              /* Completed / GameOver State */
              <div className="flex flex-col items-center justify-center py-6 bg-zinc-950 rounded-2xl border border-white/5 text-center space-y-4">
                <span className="text-3xl animate-bounce">🏆</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white">{isRtl ? 'انتهت جولة التحدي السريعة!' : 'Blitz Round Completed!'}</h4>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    {isRtl 
                      ? `نقرات صحيحة: ${gameScore} | جائزة: +$${(gameScore * 0.05).toFixed(2)} دولار`
                      : `Total hits: ${gameScore} | Total payout: +$${(gameScore * 0.05).toFixed(2)} USD`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={startTapGame}
                    className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-[9.5px] rounded-xl uppercase transition cursor-pointer shadow-md"
                  >
                    {isRtl ? 'لعب مجدداً 🔄' : 'Play Again 🔄'}
                  </button>
                  <button
                    onClick={() => { sound.playTap(); setGameState('idle'); }}
                    className="px-5 py-2 bg-neutral-900 border border-white/10 text-zinc-300 hover:text-white font-bold text-[9.5px] rounded-xl uppercase transition cursor-pointer"
                  >
                    {isRtl ? 'الرجوع للقائمة' : 'Main Screen'}
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
