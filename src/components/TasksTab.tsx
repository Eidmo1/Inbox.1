import React, { useState, useRef } from 'react';
import { UserStats, TaskItem } from '../types';
import { INITIAL_TASKS, DAILY_REWARDS } from '../data';
import { Calendar, HelpCircle, CheckCircle, Flame, RotateCw, MessagesSquare, Play, RefreshCw, X, ExternalLink, Sparkles, Megaphone, Link2, Award, Gift } from 'lucide-react';
import { sound } from './AudioSynth';
import { TRANSLATIONS, Language } from '../lib/translations';
import FreeEarnHub from './FreeEarnHub';

interface TasksTabProps {
  stats: UserStats;
  onClaimDaily: (coins: number, ghs: number) => void;
  onCompleteTask: (taskId: string, coins: number, ghs?: number, tickets?: number) => void;
  onUseTicket: () => void;
  onRewardFromSpin: (prizes: string) => void;
  onOpenOracleChat: () => void;
  language: Language;
  showAlert?: (message: string, type: 'success' | 'alert' | 'info') => void;
}

export default function TasksTab({
  stats,
  onClaimDaily,
  onCompleteTask,
  onUseTicket,
  onRewardFromSpin,
  onOpenOracleChat,
  language,
  showAlert
}: TasksTabProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    return INITIAL_TASKS.map((taskItem) => ({
      ...taskItem,
      isCompleted: stats.tasksCompleted.includes(taskItem.id),
    }));
  });
  
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Lucky wheel states
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  // CPA Offerwall & monetisation states
  const [isCpaModalOpen, setIsCpaModalOpen] = useState(false);
  const [cpaStep, setCpaStep] = useState<'idle' | 'loading' | 'completed'>('idle');
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [sponsorVerifying, setSponsorVerifying] = useState(false);
  const [sponsorVerified, setSponsorVerified] = useState(() => localStorage.getItem('XTON_SPONSOR_VERIFIED') === 'true');
  const [shortlinkVerifying, setShortlinkVerifying] = useState(false);
  const [shortlinkVerified, setShortlinkVerified] = useState(() => localStorage.getItem('XTON_SHORTLINK_VERIFIED') === 'true');

  // Simulated Adsgram Backup States
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);
  const [simulatedAdTimeRemaining, setSimulatedAdTimeRemaining] = useState(15);
  const [isSimulatedAdMuted, setIsSimulatedAdMuted] = useState(false);
  const [isSimulatedAdPlaying, setIsSimulatedAdPlaying] = useState(true);

  React.useEffect(() => {
    let timer: any;
    if (isSimulatingAd && isSimulatedAdPlaying && simulatedAdTimeRemaining > 0) {
      timer = setInterval(() => {
        setSimulatedAdTimeRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSimulatingAd, isSimulatedAdPlaying, simulatedAdTimeRemaining]);

  const cpaOfferwallUrl = localStorage.getItem('XTON_CPALEAD_OFFERWALL_URL') || '';
  const shortlinkUrl = localStorage.getItem('XTON_SHORTLINK_URL') || '';
  const sponsorChannelLink = localStorage.getItem('XTON_SPONSOR_CHANNEL_LINK') || 'https://t.me/XTON_Official_Community';

  // Local simulated CPA tasks
  const [simulatedOffers, setSimulatedOffers] = useState([
    { id: 'survey1', title: isRtl ? '📝 استطلاع آراء المستهلكين الممول' : '📝 Sponsored Consumer Survey', rewardCoins: 1200, rewardGhs: 150, type: 'survey', duration: 10, completed: false },
    { id: 'install_tiktok', title: isRtl ? '🎮 تحميل تطبيق TikTok Lite وتثبيته' : '🎮 Download & Install TikTok Lite', rewardCoins: 2500, rewardGhs: 300, type: 'install', duration: 15, completed: false },
    { id: 'game1', title: isRtl ? '⚔️ تجربة لعبة حرب العروش السحابية' : '⚔️ Try Cyber Strike Game Client', rewardCoins: 5000, rewardGhs: 600, type: 'game', duration: 20, completed: false },
  ]);

  // Wheel sectors config (8 sectors)
  const WHEEL_SECTORS = [
    { label: language === 'ar' ? '500 عملة' : '500 COINS', prizeType: 'coins', amount: 500, color: 'bg-emerald-500' },
    { label: '50 HP/S', prizeType: 'ghs', amount: 50, color: 'bg-cyan-500' },
    { label: language === 'ar' ? 'تذكرة واحدة' : '1 TICKET', prizeType: 'tickets', amount: 1, color: 'bg-amber-500' },
    { label: language === 'ar' ? '50 عملة' : '50 COINS', prizeType: 'coins', amount: 50, color: 'bg-zinc-700' },
    { label: language === 'ar' ? 'شحن كامل' : 'FULL RECHARGE', prizeType: 'recharge', amount: 0, color: 'bg-sky-500' },
    { label: language === 'ar' ? '100 عملة' : '100 COINS', prizeType: 'coins', amount: 100, color: 'bg-slate-700' },
    { label: '250 HP/S', prizeType: 'ghs', amount: 250, color: 'bg-purple-600' },
    { label: language === 'ar' ? 'حاول مجدداً' : 'TRY AGAIN', prizeType: 'none', amount: 0, color: 'bg-zinc-805' },
  ];

  // Daily Streak Claim
  const todayStr = new Date().toISOString().split('T')[0];
  const hasClaimedToday = stats.lastClaimDate === todayStr;
  
  const handleClaimDailyStreak = () => {
    if (hasClaimedToday) return;
    
    const nextClaimDay = (stats.consecutiveDays % 7) + 1;
    const reward = DAILY_REWARDS.find((r) => r.day === nextClaimDay) || DAILY_REWARDS[0];

    sound.playClaim();
    onClaimDaily(reward.coins, reward.ghs);
  };

  // Simulating the verification
  const handleStartTask = (task: TaskItem) => {
    if (task.isCompleted) return;
    sound.playTap();

    if (task.type === 'chat') {
      onOpenOracleChat();
      return;
    }

    if (task.externalUrl) {
      window.open(task.externalUrl, '_blank', 'noopener,noreferrer');
    }

    setVerifyingTaskId(task.id);
    setVerificationProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setVerificationProgress(0);
        setVerifyingTaskId(null);
        
        onCompleteTask(task.id, task.rewardCoins, task.rewardGhs, task.rewardTickets);
        setTasks((prevTasks) =>
          prevTasks.map((tItem) => (tItem.id === task.id ? { ...tItem, isCompleted: true } : tItem))
        );
        sound.playClaim();
      } else {
        setVerificationProgress(currentProgress);
      }
    }, 1200);
  };

  // Lucky wheel spin logic
  const handleSpinWheel = () => {
    if (isSpinning || stats.spinTickets <= 0) return;

    sound.playSpin();
    onUseTicket();
    setIsSpinning(true);
    setSpinResult(null);

    // Pick a random prize sector index
    const prizeIndex = Math.floor(Math.random() * WHEEL_SECTORS.length);
    const prize = WHEEL_SECTORS[prizeIndex];

    // Calculate rotation: multiple full spin bounds + exact target index degree offset
    const EXTRA_SPINS_DEGREES = 360 * 5; // 5 full rounds
    const sectorDegrees = 360 / WHEEL_SECTORS.length;
    
    // We want the sector to be centered under the main pin at top (0 degrees).
    // The wheel segments start from 0 degrees going clockwise.
    // To align sector under pointer: TargetAngle = 360 - (sectorDegrees * index) - (sectorDegrees / 2)
    const targetDegrees = Math.floor(360 - (sectorDegrees * prizeIndex) - (sectorDegrees / 2));
    const finalRotation = wheelRotation + EXTRA_SPINS_DEGREES + targetDegrees;

    setWheelRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      sound.playClaim();

      // Trigger respective state rewards based on picked segment type
      let userAlertMessage = '';
      if (prize.prizeType === 'coins') {
        onRewardFromSpin(`coins:${prize.amount}`);
        userAlertMessage = language === 'ar' 
          ? `🎉 رائع! لقد ربحت ${prize.amount} $BEE عملة من عجلة الحظ المباشرة!`
          : `🎉 Superb! You earned ${prize.amount} $BEE coins from the wheel!`;
      } else if (prize.prizeType === 'ghs') {
        onRewardFromSpin(`ghs:${prize.amount}`);
        userAlertMessage = language === 'ar'
          ? `🎉 رائع! لقد ربحت +${prize.amount} Bp/s لزيادة سرعة التعدين السحابي!`
          : `🎉 Superb! You scored +${prize.amount} Bp/s passive mining capacity boost!`;
      } else if (prize.prizeType === 'tickets') {
        onRewardFromSpin('tickets:1');
        userAlertMessage = language === 'ar'
          ? '🎉 لقد ربحت تذكرة عجلة إضافية مجانية!'
          : '🎉 You gained an extra free spin ticket!';
      } else if (prize.prizeType === 'recharge') {
        onRewardFromSpin('recharge:0');
        userAlertMessage = language === 'ar'
          ? '⚡ حظ رهيب! تم ملء وإعادة شحن مخزون طاقة التعدين بالكامل مجاناً!'
          : '⚡ Lightning luck! Your battery energy reserves have been fully recharged!';
      } else {
        userAlertMessage = language === 'ar'
          ? '🍀 حاول مجدداً مع تذكرة أخرى! حظاً أفضل المرة القادمة.'
          : '🍀 Try again with another ticket! Better luck next time.';
      }

      setSpinResult(userAlertMessage);
    }, 4500);
  };

  // 1. Handle Sponsored Channel Forced subscription
  const handleStartSponsorTask = () => {
    if (sponsorVerified || sponsorVerifying) return;
    sound.playTap();

    // Open link in new window
    window.open(sponsorChannelLink, '_blank', 'noopener,noreferrer');

    setSponsorVerifying(true);
    let timer = 0;
    const interval = setInterval(() => {
      timer += 10;
      if (timer >= 100) {
        clearInterval(interval);
        setSponsorVerifying(false);
        setSponsorVerified(true);
        localStorage.setItem('XTON_SPONSOR_VERIFIED', 'true');
        
        // Give rewards
        onCompleteTask('sponsor_channel_forced', 150, 10, 1);
        sound.playClaim();
      }
    }, 1000);
  };

  // 2. Handle Shortlinks / CPM Link bypass
  const handleStartShortlinkTask = () => {
    if (shortlinkVerified || shortlinkVerifying) return;
    sound.playTap();

    const targetUrl = shortlinkUrl || 'https://shrinkme.io/demolink_bypass_verify';
    window.open(targetUrl, '_blank', 'noopener,noreferrer');

    setShortlinkVerifying(true);
    let timer = 0;
    const interval = setInterval(() => {
      timer += 5;
      if (timer >= 100) {
        clearInterval(interval);
        setShortlinkVerifying(false);
        setShortlinkVerified(true);
        localStorage.setItem('XTON_SHORTLINK_VERIFIED', 'true');

        // Give rewards
        onCompleteTask('shortlink_cpm_daily', 250, 25, 2);
        sound.playClaim();
      }
    }, 1000);
  };

  // 3. Complete simulated CPA offer
  const handleStartSimulatedOffer = (offerId: string) => {
    if (cpaOfferwallUrl) {
      // If the owner put a real publisher URL, take user there directly!
      sound.playTap();
      window.open(cpaOfferwallUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Otherwise, simulate a highly interactive CPA task for the user to try out!
    sound.playTap();
    setActiveOfferId(offerId);
    setCpaStep('loading');
    
    const offer = simulatedOffers.find(o => o.id === offerId);
    if (!offer) return;

    // Open a mockup external task page for testing
    window.open('https://cpalead.com/offerwall-demo', '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setCpaStep('completed');
    }, offer.duration * 1000);
  };

  const handleClaimSimulatedOfferReward = () => {
    if (!activeOfferId) return;
    const offer = simulatedOffers.find(o => o.id === activeOfferId);
    if (!offer) return;

    // Complete offer
    setSimulatedOffers(prev => prev.map(o => o.id === activeOfferId ? { ...o, completed: true } : o));
    onCompleteTask(`simulated_cpa_${activeOfferId}`, offer.rewardCoins, offer.rewardGhs, 2);
    
    sound.playClaim();
    setCpaStep('idle');
    setActiveOfferId(null);
    setIsCpaModalOpen(false);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-neutral-950 px-4 pt-4 overflow-y-auto pb-24 select-none ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* 1. Lucky Wheel header */}
      <div className="bg-gradient-to-r from-purple-950/20 to-neutral-900 border border-purple-500/10 rounded-2xl p-4 mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full filter blur-xl" />
        <div className="flex items-center gap-2 mb-2">
          <RotateCw className="text-purple-400 w-4 h-4 animate-spin-slow" />
          <h3 className="font-semibold text-xs font-display text-white uppercase tracking-wider">{t.luckHeaderTitle}</h3>
        </div>

        {/* Tickets container */}
        <div className="flex items-center justify-between mt-3 bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎡</span>
            <span className="text-[10.5px] text-zinc-350 leading-none">
              {t.ticketsBalance} <b>{stats.spinTickets}</b>
            </span>
          </div>
          {stats.spinTickets === 0 && (
            <span className="text-[8.5px] font-semibold text-amber-500 uppercase tracking-tight animate-pulse bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {language === 'ar' ? 'لا يوجد تذاكر! نفذ المهام' : 'Complete tasks to earn tickets'}
            </span>
          )}
        </div>

        {/* Wheel layout visualization */}
        <div className="flex flex-col items-center justify-center my-6 relative">
          
          {/* Wheel pointer target indicator */}
          <div className="absolute top-[-8px] z-40 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-md" />
            <div className="w-1.5 h-1.5 bg-neutral-950 rounded-full border border-white/20 mt-1" />
          </div>

          {/* Core spinning wheel circle */}
          <div className="relative w-56 h-56 rounded-full border-4 border-zinc-800 shadow-xl overflow-hidden bg-zinc-900 z-20 transition-all">
            <div
              ref={wheelRef}
              style={{
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.25, 1)' : 'none'
              }}
              className="w-full h-full relative"
            >
              {WHEEL_SECTORS.map((sector, idx) => {
                const rotationDegStep = idx * (360 / WHEEL_SECTORS.length);
                return (
                  <div
                    key={idx}
                    style={{
                      transform: `rotate(${rotationDegStep}deg)`,
                      transformOrigin: '50% 50%',
                      clipPath: 'polygon(50% 50%, 40% 0%, 60% 0%)'
                    }}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-start pt-2 group"
                  >
                    <div className={`absolute inset-0 ${sector.color} opacity-90`} />
                    <span className="relative z-30 font-mono text-[6.5px] font-extrabold text-white text-center mt-3 breaking-words leading-tight uppercase select-none tracking-tight">
                      {sector.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Center ring decoration */}
            <div className="absolute inset-0 m-auto w-12 h-12 bg-slate-950 border-4 border-zinc-800 rounded-full flex items-center justify-center z-30 shadow-md">
              <span className="text-[11px] font-bold text-amber-400 font-display">TON</span>
            </div>
          </div>
        </div>

        {/* Spin trigger buttons */}
        <button
          onClick={handleSpinWheel}
          disabled={isSpinning || stats.spinTickets <= 0}
          className={`w-full mt-3.5 py-2.5 rounded-xl font-bold font-mono text-center text-xs transition duration-150 relative ${isSpinning ? 'bg-zinc-850 text-zinc-500 border border-zinc-800 pointer-events-none' : stats.spinTickets > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md animate-bounce bg-glow cursor-pointer' : 'bg-zinc-800 border border-zinc-700 text-zinc-500 pointer-events-none'}`}
        >
          {isSpinning ? t.spinningText : stats.spinTickets > 0 ? t.spinTitle : t.inactiveTickets}
        </button>

        {/* Spin win alert modal inside card */}
        {spinResult && (
          <div className="bg-purple-950/40 border border-purple-500/20 rounded-xl p-3 mt-3.5 flex items-start gap-2.5 relative animate-fade-in select-text">
            <span className="text-lg">🎈</span>
            <div className="flex-1">
              <p className="text-[11px] text-purple-200 leading-relaxed font-sans font-medium">
                {spinResult}
              </p>
            </div>
            <button
              onClick={() => {
                sound.playTap();
                setSpinResult(null);
              }}
              className="p-1 text-purple-400 hover:text-white transition rounded-md ml-auto"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 2. Daily Streak Box */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="text-cyan-400 w-4 h-4 animate-bounce" />
          <h3 className="font-bold text-xs text-white uppercase">{t.dailyStreakTitle}</h3>
        </div>

        <p className="text-[11px] text-zinc-300 leading-normal mb-4 font-sans">
          {t.dailyStreakDesc}
        </p>

        {/* Grid representing the 7 Days checkin rewards */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {DAILY_REWARDS.map((rew) => {
            const isClaimed = stats.consecutiveDays >= rew.day;
            const isToday = stats.consecutiveDays + 1 === rew.day && !hasClaimedToday;
            return (
              <div
                key={rew.day}
                className={`p-2 rounded-xl flex flex-col items-center justify-center border text-center relative ${isClaimed ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : isToday ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 ring-2 ring-cyan-500/10 animate-pulse' : 'bg-zinc-950 border-white/5 text-zinc-500'}`}
              >
                <span className="text-[10px] font-mono font-medium">{t.dayLabel} {rew.day}</span>
                <span className="text-xs font-bold leading-tight mt-1 truncate">+{rew.ghs} Hp</span>
                <span className="text-[8px] font-mono font-medium tracking-tight text-amber-400 mt-0.5">+{rew.coins}</span>
              </div>
            );
          })}
        </div>

        {/* Claim button */}
        <button
          onClick={handleClaimDailyStreak}
          disabled={hasClaimedToday}
          className={`w-full py-2.5 rounded-xl font-bold font-mono text-center text-xs transition duration-150 ${hasClaimedToday ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 pointer-events-none' : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 shadow-md cursor-pointer'}`}
        >
          {hasClaimedToday ? t.alreadyClaimedToday : t.claimToday}
        </button>
      </div>

      {/* 2c. Free Quick-Earn Hub (Captchas, Scratch Cards, and Target-clicking mini-games) */}
      <div className="mb-4">
        <FreeEarnHub 
          language={language}
          onReward={(type, amount) => {
            onRewardFromSpin(JSON.stringify({ prizeType: type, amount }));
          }}
          showAlert={(msg, type) => {
            const mappedType = type === 'warning' || type === 'error' ? 'alert' : type;
            showAlert?.(msg, mappedType);
          }}
        />
      </div>

      {/* 2b. Monetization / Real Earnings Center (CPA & Shortlinks) */}
      <div className="bg-gradient-to-r from-emerald-950/20 to-neutral-900 border border-emerald-500/10 rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-emerald-400 w-4 h-4 animate-pulse" />
          <h3 className="font-semibold text-xs font-display text-white uppercase tracking-wider">
            {isRtl ? '💸 جدار عروض كسب المال والتبادل المالي 💸' : '💸 CPA OFFERWALL & PREMIUM SPONSORS 💸'}
          </h3>
        </div>

        <p className="text-[10px] text-zinc-400 leading-normal mb-3 font-sans">
          {isRtl 
            ? 'أكمل عروض تحميل التطبيقات، استطلاعات الرأي، وتخطي الروابط للحصول على مكافآت ضخمة لسرعة التعدين والعملات مجاناً دون دفع أي شيء!'
            : 'Complete high-reward tasks, take surveys, and join sponsor spaces to earn massive Bp/s power and coins for free!'}
        </p>

        {/* Rows of monetized actions */}
        <div className="space-y-2.5">
          {/* 1. CPALead Offerwall Row */}
          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-purple-500/20 transition flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  🔥 {isRtl ? 'جدار عروض CPALead واستطلاعات الرأي' : 'CPALead Survey & Installs Wall'}
                </span>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                  {isRtl 
                    ? 'أكمل عروض الألعاب والاستبيانات السريعة لتربح قوة تعدين هائلة!'
                    : 'Download apps, complete quick surveys to get massive mining multipliers.'}
                </p>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setIsCpaModalOpen(true);
                }}
                className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[8.5px] uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>{isRtl ? 'افتح العروض 🚀' : 'Open Wall 🚀'}</span>
                <ExternalLink size={9} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5 text-[8.5px] font-mono text-amber-400">
              <span className="text-zinc-550 uppercase">{isRtl ? 'مكافأة العرض:' : 'OFFER REWARD:'}</span>
              <span>+1,200 {isRtl ? 'إلى' : 'to'} +5,000 $BEE</span>
              <span className="text-emerald-400">+{isRtl ? 'تصل لـ' : 'up to'} +600 Bp/s</span>
            </div>
          </div>

          {/* 2. Shortlink Daily Bypass Row */}
          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-pink-500/20 transition flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  🔗 {isRtl ? 'رابط كسب المال اليومي المختصر' : 'Premium Daily CPM Shortlink'}
                </span>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                  {isRtl 
                    ? 'تخطى الكابتشا والإعلانات لدقيقة واحدة للحصول على تذاكر وعملات مجانية!'
                    : 'Bypass standard captcha to verify daily code and receive high-level rewards.'}
                </p>
              </div>
              {shortlinkVerified ? (
                <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                  <CheckCircle size={10} />
                  <span>{isRtl ? 'تم التحقق' : 'VERIFIED'}</span>
                </span>
              ) : shortlinkVerifying ? (
                <div className="flex flex-col items-end">
                  <span className="text-[7.5px] text-pink-450 font-mono animate-pulse">{isRtl ? 'جاري التحقق...' : 'Verifying...'}</span>
                </div>
              ) : (
                <button
                  onClick={handleStartShortlinkTask}
                  className="bg-pink-500 hover:bg-pink-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[8.5px] uppercase flex items-center gap-1 cursor-pointer"
                >
                  <span>{isRtl ? 'تخطي واكسب 🔗' : 'Bypass Link 🔗'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5 text-[8.5px] font-mono text-amber-400">
              <span className="text-zinc-550 uppercase">{isRtl ? 'المكافأة المضمونة:' : 'GUARANTEED REWARD:'}</span>
              <span>+250 $BEE</span>
              <span className="text-emerald-400">+25 Bp/s</span>
              <span className="text-amber-500">+2 {isRtl ? 'تذكرة' : 'Tickets'}</span>
            </div>
          </div>

          {/* 3. Telegram Partner Forced Channel Join */}
          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-teal-500/20 transition flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  📢 {isRtl ? 'الاشتراك في قنوات الممولين الرسمية' : 'Join Partner Sponsor Channel'}
                </span>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                  {isRtl 
                    ? 'اشترك في قناة شريك البوت للحصول على سرعة وعملات ترحيبية فورية!'
                    : 'Join official sponsor Telegram channel and verify to receive bonuses.'}
                </p>
              </div>
              {sponsorVerified ? (
                <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                  <CheckCircle size={10} />
                  <span>{isRtl ? 'تم الاشتراك' : 'JOINED'}</span>
                </span>
              ) : sponsorVerifying ? (
                <div className="flex flex-col items-end">
                  <span className="text-[7.5px] text-teal-450 font-mono animate-pulse">{isRtl ? 'جاري الفحص...' : 'Verifying...'}</span>
                </div>
              ) : (
                <button
                  onClick={handleStartSponsorTask}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[8.5px] uppercase flex items-center gap-1 cursor-pointer"
                >
                  <span>{isRtl ? 'اشترك وتحقق 📢' : 'Join & Verify 📢'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5 text-[8.5px] font-mono text-amber-400">
              <span className="text-zinc-550 uppercase">{isRtl ? 'المكافأة المضمونة:' : 'BONUS REWARD:'}</span>
              <span>+150 $BEE</span>
              <span className="text-emerald-400">+10 Bp/s</span>
              <span className="text-amber-500">+1 {isRtl ? 'تذكرة' : 'Ticket'}</span>
            </div>
          </div>

          {/* 4. Real Adsgram Rewarded Video Ad */}
          <div className="p-3 bg-zinc-950/80 border border-white/5 rounded-xl hover:border-amber-500/20 transition flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  📺 {isRtl ? 'شاهد إعلان الممول الفوري' : 'Watch Daily Sponsor Video Ad'}
                </span>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                  {isRtl 
                    ? 'شاهد إعلان فيديو Adsgram بالكامل لربح الرموز وتذاكر العجلة مباشرة!'
                    : 'Watch Adsgram rewarded video completely to earn coins and wheel tickets!'}
                </p>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  if (!(window as any).Adsgram) {
                    // Fallback to high-fidelity immersive simulation
                    setSimulatedAdTimeRemaining(15);
                    setIsSimulatingAd(true);
                    setIsSimulatedAdPlaying(true);
                    showAlert?.(
                      isRtl
                        ? '🔄 تم تحويلك التلقائي لملقم الإعلانات الاحتياطي لعدم توفر بيئة التلغرام...'
                        : '🔄 Redirecting to backup verified sponsor stream node...',
                      'info'
                    );
                    return;
                  }
                  const blockId = localStorage.getItem('XTON_ADSGRAM_BLOCK_ID') || localStorage.getItem('XTON_ADSGRAM_TOKEN') || '37748';
                  try {
                    const AdController = (window as any).Adsgram.init({ blockId });
                    showAlert?.(
                      isRtl
                        ? '🔄 جاري تحميل إعلان Adsgram الفائز...'
                        : '🔄 Loading Adsgram Rewarded Video Ad...',
                      'info'
                    );
                    AdController.show()
                      .then((result: any) => {
                        if (result && !result.done) {
                          sound.playError();
                          showAlert?.(
                            isRtl
                              ? '⚠️ لقد قمت بإغلاق الإعلان مبكراً، لن تحصل على المكافأة.'
                              : '⚠️ You closed the ad early. No reward will be given.',
                            'alert'
                          );
                          return;
                        }
                        sound.playClaim();
                        onCompleteTask('adsgram_rewarded_video_daily', 250, 0, 1);
                        showAlert?.(
                          isRtl
                            ? '🎉 رائع! شاهدت الإعلان بالكامل وحصلت على 250 Queen Bee و 1 تذكرة عجلة الحظ!'
                            : '🎉 Success! You watched the ad completely and earned 250 Queen Bee and 1 Spin Ticket!',
                          'success'
                        );
                      })
                      .catch((err: any) => {
                        // GRACEFUL FALLBACK TO SIMULATOR IF NO FILL OR FAILED TO LOAD
                        console.log('Adsgram error in task, falling back to simulation', err);
                        
                        // Launch fallback simulation
                        setSimulatedAdTimeRemaining(15);
                        setIsSimulatingAd(true);
                        setIsSimulatedAdPlaying(true);
                        
                        showAlert?.(
                          isRtl
                            ? '🔄 شبكة Adsgram لم توفر إعلان ممول حالياً (إعلان فارغ). تم تحويلك تلقائياً للملقم الاحتياطي لضمان المكافأة!'
                            : '🔄 Adsgram returned an empty ad or no-fill. Seamlessly routing you to our backup stream to secure your reward!',
                          'info'
                        );
                      });
                  } catch (error: any) {
                    sound.playError();
                    showAlert?.(`Error: ${error?.message || error}`, 'alert');
                  }
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[8.5px] uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>{isRtl ? 'شاهد الآن 📺' : 'Watch Now 📺'}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/5 text-[8.5px] font-mono text-amber-400">
              <span className="text-zinc-550 uppercase">{isRtl ? 'المكافأة المضمونة:' : 'GUARANTEED REWARD:'}</span>
              <span>+250 $BEE</span>
              <span className="text-amber-500">+1 {isRtl ? 'تذكرة' : 'Ticket'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. System Task rows */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="text-amber-500 w-4 h-4 animate-pulse" />
          <h3 className="font-bold text-xs text-white uppercase">{t.tasksTitle}</h3>
        </div>

        <p className="text-[11px] text-zinc-400 leading-normal mb-4 font-sans">
          {t.tasksDesc}
        </p>

        {/* Task rows */}
        <div className="space-y-3">
          {tasks.filter(task => !task.isCompleted).map((task) => {
            const isVerifying = verifyingTaskId === task.id;
            
            return (
              <div
                key={task.id}
                className="p-3 bg-zinc-950 border border-white/5 rounded-xl flex flex-col justify-between hover:border-white/10 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-xs font-extrabold text-white font-display block">
                      {language === 'ar' && task.id === 'ai_oracle' ? '🔮 استشر المستشار والعرّاف الذكي أوراكل' : task.title}
                    </span>
                    <p className="text-[10px] text-zinc-400 leading-tight mt-1 font-sans">
                      {language === 'ar' && task.id === 'ai_oracle' ? 'تفاعل في دردصة العراف أوراكل واطرح سؤالاً واحداً لتفعيل مكافأة التعدين الفورية!' : task.description}
                    </p>
                  </div>
                  
                  <div className="shrink-0">
                    {task.isCompleted ? (
                      <span className="text-[8.5px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-2 py-1 rounded-md flex items-center gap-1 font-bold">
                        <CheckCircle size={10} />
                        <span>OK</span>
                      </span>
                    ) : isVerifying ? (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] text-cyan-300 font-mono mb-1">{verificationProgress}%</span>
                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <div className="h-full bg-cyan-400 rounded-full transition-all duration-300" style={{ width: `${verificationProgress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartTask(task)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-tight uppercase cursor-pointer"
                      >
                        {t.claimRewardBtn}
                      </button>
                    )}
                  </div>
                </div>

                {/* Rewards metrics visual */}
                <div className="flex items-center gap-2 mt-2 font-mono text-[9px] border-t border-white/5 pt-2">
                  <span className="text-zinc-500 uppercase">{language === 'ar' ? 'المكافأة:' : 'REWARD:'}</span>
                  <span className="text-amber-400 font-semibold font-mono">+{task.rewardCoins} $BEE</span>
                  {task.rewardGhs && <span className="text-emerald-400 font-semibold">+{task.rewardGhs} Bp/s</span>}
                  {task.rewardTickets && <span className="text-amber-500 font-semibold">+{task.rewardTickets} Ticket</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CPALead / Simulated Offerwall Modal */}
      {isCpaModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-neutral-900 border border-purple-500/30 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-purple-950/40 to-neutral-900 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award className="text-purple-400 w-4.5 h-4.5 animate-bounce" />
                <span className="text-xs font-black text-white font-display uppercase tracking-wider">
                  {isRtl ? '🔥 جدار عروض كسب المال والـ CPA' : '🔥 CPALead Premium Offers'}
                </span>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setIsCpaModalOpen(false);
                  setCpaStep('idle');
                  setActiveOfferId(null);
                }}
                className="p-1 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3.5 max-h-[70vh]">
              {/* Creator Tip */}
              <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-2xl text-[9px] text-purple-200 leading-normal space-y-1">
                <span className="font-bold flex items-center gap-1">
                  💡 {isRtl ? 'ملاحظة هامة لصاحب البوت (المطور):' : '💡 Developer Customization Guide:'}
                </span>
                <p>
                  {isRtl 
                    ? 'هذا العرض الآن تفاعلي لتجربة اللاعبين. لكسب أرباح دولار حقيقية في حسابك الشخصي دون دفع أي شيء من جيبك، اذهب إلى "لوحة المالك" وضع رابط الـ CPA الخاص بك من CPALead وسيتم توجيه جميع اللاعبين إليه فوراً لتكسب كاش حقيقي!'
                    : 'This is an interactive simulation for test players. To receive real USD payouts from players completing these, paste your own CPALead publisher offerwall link in the "Owner Panel" to override this fallback.'}
                </p>
              </div>

              {activeOfferId ? (
                /* Active Task details */
                (() => {
                  const activeOffer = simulatedOffers.find(o => o.id === activeOfferId);
                  if (!activeOffer) return null;
                  return (
                    <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex flex-col items-center text-center space-y-3 animate-fade-in">
                      <span className="text-3xl">📥</span>
                      <h4 className="text-xs font-bold text-white">{activeOffer.title}</h4>
                      
                      {cpaStep === 'loading' ? (
                        <div className="w-full flex flex-col items-center space-y-2 py-4">
                          <RefreshCw className="text-purple-400 w-8 h-8 animate-spin" />
                          <span className="text-[10px] text-zinc-400">
                            {isRtl 
                              ? 'يرجى إكمال المهمة في الصفحة المفتوحة... جاري التحقق التلقائي...' 
                              : 'Verify download/survey completion on the opened tab...'}
                          </span>
                          <span className="text-[8px] text-purple-300 font-mono">
                            {isRtl ? 'فحص السجلات السحابية للدفع...' : 'Pinging postback URL logs...'}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col items-center space-y-2 py-2">
                          <span className="text-emerald-400 text-sm font-bold flex items-center gap-1">
                            ✅ {isRtl ? 'اكتمل العرض بنجاح!' : 'Offer verified successfully!'}
                          </span>
                          <button
                            onClick={handleClaimSimulatedOfferReward}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl uppercase shadow-md transition cursor-pointer"
                          >
                            {isRtl ? 'المطالبة بالمكافأة 🎉' : 'Claim Reward 🎉'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                /* Offers List */
                <div className="space-y-2.5">
                  <p className="text-[10px] text-zinc-400 text-center leading-tight">
                    {isRtl 
                      ? 'اختر أحد العروض الممولة التالية وأكملها للحصول على المكافآت:'
                      : 'Choose an offer from the active feed below to load direct multipliers:'}
                  </p>

                  {simulatedOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-3 bg-zinc-950 border border-white/5 rounded-xl hover:border-purple-500/20 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <span className="text-xs font-bold text-white block leading-snug">{offer.title}</span>
                        <div className="flex items-center gap-2 mt-1 font-mono text-[8px] text-amber-400">
                          <span>+{offer.rewardCoins} $BEE</span>
                          <span className="text-emerald-400">+{offer.rewardGhs} Bp/s</span>
                        </div>
                      </div>
                      {offer.completed ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-mono font-bold">
                          DONE
                        </span>
                      ) : (
                        <button
                          onClick={() => handleStartSimulatedOffer(offer.id)}
                          className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[9px] uppercase cursor-pointer shrink-0"
                        >
                          {isRtl ? 'ابدأ العرض 🚀' : 'Start 🚀'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-zinc-950 border-t border-white/5 text-[8px] text-zinc-500 text-center font-mono">
              CPALEAD SECURE POSTBACK SENSOR v3.11
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE SIMULATED ADSGRAM REWARDED VIDEO AD MODAL */}
      {isSimulatingAd && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in select-none">
          <div className="w-full max-w-lg bg-neutral-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            {/* Top Bar */}
            <div className="p-4 bg-zinc-950 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
                    {language === 'ar' ? '📺 بث شريك Adsgram الاحتياطي' : '📺 ADSGRAM BACKUP STREAM'}
                  </span>
                  <span className="text-[8px] text-zinc-400 block font-mono">
                    {language === 'ar' ? 'بوابة إعلانية آمنة - ملقم معتمد' : 'Secure Adsgram Ad Delivery Protocol'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/25 text-amber-400 font-mono font-bold">
                  2.5x Reward
                </span>
                {simulatedAdTimeRemaining > 0 ? (
                  <button 
                    onClick={() => {
                      sound.playError();
                      showAlert?.(
                        language === 'ar' 
                          ? '⚠️ الرجاء مشاهدة الإعلان بالكامل للحصول على المكافأة!' 
                          : '⚠️ Please watch the entire video to claim your reward!', 
                        'alert'
                      );
                    }}
                    className="p-1 rounded bg-white/5 text-zinc-500 hover:text-white cursor-not-allowed"
                  >
                    <X size={15} />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      sound.playTap();
                      setIsSimulatingAd(false);
                    }}
                    className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer transition"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Video Body */}
            <div className="flex-1 bg-black relative flex items-center justify-center min-h-[220px] max-h-[360px] overflow-hidden">
              {/* Cinematic Simulated Video Player Animation */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center">
                <div className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-sm" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop')` }} />
                
                {/* Floating Golden Coin */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-lg shadow-amber-500/20 flex items-center justify-center mb-4 animate-bounce">
                  <span className="font-black text-slate-950 text-2xl font-mono">$BEE</span>
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
                </div>

                <span className="relative z-10 text-xs font-black text-amber-400 uppercase tracking-widest font-mono animate-pulse">
                  {language === 'ar' ? 'جاري تشغيل بث فيديو Adsgram...' : 'STREAMING VERIFIED ADSGRAM SPONSOR VIDEO...'}
                </span>
                
                {/* Fake Audio Equalizer bars */}
                <div className="relative z-10 flex gap-1 mt-4 items-end h-6">
                  <span className="w-1 bg-amber-400 rounded animate-bounce" style={{ height: '70%', animationDelay: '0.1s' }} />
                  <span className="w-1 bg-amber-400 rounded animate-bounce" style={{ height: '40%', animationDelay: '0.3s' }} />
                  <span className="w-1 bg-amber-400 rounded animate-bounce" style={{ height: '90%', animationDelay: '0.2s' }} />
                  <span className="w-1 bg-amber-400 rounded animate-bounce" style={{ height: '50%', animationDelay: '0.4s' }} />
                  <span className="w-1 bg-amber-400 rounded animate-bounce" style={{ height: '80%', animationDelay: '0.15s' }} />
                </div>
              </div>

              {/* Countdown Watermark Overlay */}
              {simulatedAdTimeRemaining > 0 && (
                <div className="absolute bottom-3 left-3 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-mono font-black text-white pointer-events-none z-20">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>{language === 'ar' ? 'متبقي:' : 'REMAINING:'} {simulatedAdTimeRemaining}s</span>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="px-4 py-2 bg-zinc-950 border-t border-white/5 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    sound.playTap();
                    setIsSimulatedAdPlaying(!isSimulatedAdPlaying);
                  }}
                  className="hover:text-white transition cursor-pointer"
                >
                  {isSimulatedAdPlaying ? (language === 'ar' ? '⏸️ إيقاف' : '⏸️ Pause') : (language === 'ar' ? '▶️ تشغيل' : '▶️ Play')}
                </button>
                <button 
                  onClick={() => {
                    sound.playTap();
                    setIsSimulatedAdMuted(!isSimulatedAdMuted);
                  }}
                  className="hover:text-white transition cursor-pointer"
                >
                  {isSimulatedAdMuted ? (language === 'ar' ? '🔇 إلغاء كتم' : '🔇 Muted') : (language === 'ar' ? '🔊 صوت' : '🔊 Sound')}
                </button>
              </div>
              <div className="text-[10px]">
                {language === 'ar' ? 'دقة البث: 1080p ملقم آمن' : 'Stream: 1080p Secure Node'}
              </div>
            </div>

            {/* Video Progress Bar */}
            <div className="w-full h-1 bg-zinc-950 relative">
              <div 
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${((15 - simulatedAdTimeRemaining) / 15) * 100}%` }}
              />
            </div>

            {/* Footer Options */}
            <div className="p-4 bg-zinc-900 flex flex-col gap-3">
              <div className="text-left border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[7.5px] px-1.5 py-0.25 bg-amber-500/10 text-amber-400 font-extrabold rounded border border-amber-500/20 font-mono tracking-wider">
                    ADSGRAM PARTNER
                  </span>
                  <span className="text-[7.5px] px-1.5 py-0.25 bg-red-500/10 text-red-400 font-extrabold rounded border border-red-500/20 font-mono tracking-wider animate-pulse">
                    SECURE BLOCK: 37748
                  </span>
                </div>
                <h4 className="text-xs font-black text-white mb-0.5 truncate">
                  {language === 'ar' ? 'شاهد وحقق أرباحاً خيالية' : 'Watch & Power up your Honey Stream'}
                </h4>
                <p className="text-[9.5px] text-zinc-400 leading-normal line-clamp-2">
                  {language === 'ar' 
                    ? 'رعاة كوين بي يقدمون لك أحدث الطرق للربح المباشر. شاهد للاستمرار!' 
                    : 'The official Adsgram network offers high speed rewards for active miners. Keep watching to complete!'}
                </p>
              </div>

              <div className="flex gap-2">
                {/* Claim Button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClaim();
                    onCompleteTask('adsgram_rewarded_video_daily', 250, 0, 1);
                    setIsSimulatingAd(false);
                    showAlert?.(
                      language === 'ar'
                        ? '🎉 رائع! شاهدت الإعلان بالكامل وحصلت على 250 Queen Bee و 1 تذكرة عجلة الحظ!'
                        : '🎉 Success! You watched the ad completely and earned 250 Queen Bee and 1 Spin Ticket!',
                      'success'
                    );
                  }}
                  disabled={simulatedAdTimeRemaining > 0}
                  className={`w-full py-2.5 px-3 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5 uppercase ${simulatedAdTimeRemaining > 0 ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5' : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black cursor-pointer shadow-lg hover:scale-102 active:scale-98'}`}
                >
                  <Gift size={11} />
                  <span>
                    {simulatedAdTimeRemaining > 0 
                      ? (language === 'ar' ? `شاهد بالكامل للمطالبة (${simulatedAdTimeRemaining} ثانية)` : `Watch Fully (${simulatedAdTimeRemaining}s)`) 
                      : (language === 'ar' ? 'استلام المكافأة المضمونة 🎁' : 'Claim Reward 🎁')
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
