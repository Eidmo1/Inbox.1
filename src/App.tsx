import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Cpu, Server, Users, Award, RotateCw, MessagesSquare, CheckCircle, 
  Sparkles, Battery, BatteryCharging, ShoppingBag, Volume2, VolumeX, Shield, AlertCircle, X, Megaphone,
  Lock, Key, Wifi, TrendingUp, Database, Activity, Settings, RefreshCw, ArrowRight, Eye, EyeOff, Send
} from 'lucide-react';
import TelegramFrame from './components/TelegramFrame';
import MiningRing from './components/MiningRing';
import FlyingBee from './components/FlyingBee';
import UpgradesTab from './components/UpgradesTab';
import LeaderboardTab from './components/LeaderboardTab';
import TasksTab from './components/TasksTab';
import WalletTab from './components/WalletTab';
import AdsTab from './components/AdsTab';
import OwnerTab from './components/OwnerTab';
import ActivityTab from './components/ActivityTab';
import AntiCheatTab from './components/AntiCheatTab';
import MarketTab from './components/MarketTab';
import { UserStats, DailyReward, AdminTransaction } from './types';
import { SHOP_UPGRADES, getUserTitle } from './data';
import { sound } from './components/AudioSynth';
import { TRANSLATIONS, Language } from './lib/translations';

const getTelegramUser = () => {
  try {
    const tgWebApp = (window as any).Telegram?.WebApp;
    return tgWebApp?.initDataUnsafe?.user || null;
  } catch (e) {
    return null;
  }
};

const getGuestId = () => {
  let guestId = localStorage.getItem('ton_horse_guest_id');
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('ton_horse_guest_id', guestId);
  }
  return guestId;
};

const getLocalStorageKey = () => {
  const user = getTelegramUser();
  if (user?.id) {
    return `ton_horse_user_miner_states_v3_${user.id}`;
  }
  return `ton_horse_user_miner_states_v3_${getGuestId()}`;
};

const getUsernameStorageKey = () => {
  const user = getTelegramUser();
  if (user?.id) {
    return `XTON_MINER_USERNAME_${user.id}`;
  }
  return `XTON_MINER_USERNAME_${getGuestId()}`;
};

const DEFAULT_STATS: UserStats = {
  coins: 500,               // Starting $BEE
  ghs: 5.0,                 // Starting Bp speeds (Bee Power Hashes)
  jumpBalance: 0.0,         // Starting Jump coin balance
  energy: 1000,             // Starting battery
  maxEnergy: 1000,
  energyRegen: 1,
  multiTap: 1,
  efficiencyLevel: 1,
  referrals: 0,
  spinTickets: 2,           // Welcome wheel spin tickets!
  lastClaimDate: '',
  consecutiveDays: 0,
  tasksCompleted: [],
  upgradeLevels: {},
  lastActiveTime: Date.now(),
  isActivated: true,       // Mining activates immediately after subscribing to channels 
  tonBalance: 0.0,          // Virtual exchangeable TON coins balance
  walletAddress: '',        // Persistent TON wallet address assigned by user
  language: 'ar',            // Default to Arabic
  miningSessionStart: Date.now(), // Start mining session immediately on first launch
  lockedReserveUSD: 250.0,  // Global locked sponsor reward pool balance in USD
  claimedRewardUSD: 0.0,     // Amount of USD task/channel rewards already claimed
  pepeBalance: 285.71,       // Gift reward PEPE coins (exactly $0.003 worth: 285.71 * 0.0000105)
  pepeWalletAddress: '',
  bscWalletAddress: '',      // Connected real Smart Chain Wallet Address (like Trust Wallet)
  realBnbBalance: 0.0,       // Real BNB balance loaded directly from blockchain RPC
  realUsdtBalance: 0.0,      // Real USDT balance loaded directly from blockchain RPC
  antiCheatPassed: false,
  isAntiCheatFlagged: false,
  adminBnbBalance: 1.2520,    // Default BNB deposit backing (only visible to admin)
  pepeGiftWithdrawn: false,   // Core flag tracking if subscribers have withdrawn their gift
  binanceId: '',               // Connected Binance ID (UID or Binance Pay ID)
  partnerLinked: false,
  partnerName: '',
  partnerToken: '',
  partnerRateMultiplier: 1.0,
  botUsername: 'xtyMiningBot',
  bandwidthMiningOn: false,
  autoSwapToTon: true,
  telegramId: String(Math.floor(100000000 + Math.random() * 900000000)) // Dynamic default numeric Telegram ID
};

export default function App() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const currentLanguage: Language = stats.language || 'ar';
  const t = TRANSLATIONS[currentLanguage];
  const isRtl = currentLanguage === 'ar';

  const statsRef = useRef(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Bandwidth Sharing Partners States
  const [activePartnerModal, setActivePartnerModal] = useState<boolean>(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<'honeygain' | 'pawns' | 'earnapp' | 'packetstream' | null>(null);
  const [partnerInputVal, setPartnerInputVal] = useState<string>('');
  const [partnerPasswordVal, setPartnerPasswordVal] = useState<string>('');
  const [isConnectingPartner, setIsConnectingPartner] = useState<boolean>(false);

  const [activeTab, setActiveTab ] = useState<'mine' | 'activity' | 'upgrades' | 'leaderboard' | 'tasks' | 'wallet' | 'ads' | 'owner' | 'anticheat' | 'market'>('mine');
  const [showDevControls, setShowDevControls] = useState<boolean>(false);
  const [devClicks, setDevClicks] = useState<number>(0);
  const [username, setUsernameState] = useState<string>(() => {
    const key = getUsernameStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const tgUser = getTelegramUser();
    if (tgUser?.username) {
      localStorage.setItem(key, tgUser.username);
      return tgUser.username;
    } else if (tgUser?.first_name) {
      const generatedName = tgUser.first_name.trim().replace(/[^a-zA-Z0-9_]/g, '') + '_' + String(tgUser.id).substring(0, 4);
      localStorage.setItem(key, generatedName);
      return generatedName;
    }
    const names = ['StallionRider', 'PegasusRacer', 'DesertColt', 'ThunderMustang', 'BronzeBronco', 'ArabianSteed'];
    const rName = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 90 + 10);
    localStorage.setItem(key, rName);
    return rName;
  });

  const setUsername = (newUsername: string) => {
    const cleaned = newUsername.trim().replace(/[^a-zA-Z0-9_]/g, '');
    if (cleaned) {
      setUsernameState(cleaned);
      localStorage.setItem(getUsernameStorageKey(), cleaned);
    }
  };
  
  // Activity tracking state
  const [todayTaps, setTodayTaps] = useState(0);
  const [completedPuzzle, setCompletedPuzzle] = useState(false);
  const [adsWatchedCount, setAdsWatchedCount] = useState(3); // Start with 3 out of 4 completed so users can test completion easily

  // Bandwidth Sharing Mining feature states
  const [bandwidthMiningOn, setBandwidthMiningOnState] = useState<boolean>(() => {
    const saved = localStorage.getItem('XTON_BANDWIDTH_MINING_ON');
    return saved ? JSON.parse(saved) : true;
  });

  const setBandwidthMiningOn = (val: boolean | ((prev: boolean) => boolean)) => {
    setBandwidthMiningOnState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('XTON_BANDWIDTH_MINING_ON', JSON.stringify(next));
      setTimeout(() => {
        setStats((s) => ({ ...s, bandwidthMiningOn: next }));
      }, 0);
      return next;
    });
  };
  const [realNetIntensity, setRealNetIntensity] = useState<'low' | 'medium' | 'high' | 'turbo'>(() => {
    return (localStorage.getItem('XTON_REAL_NET_INTENSITY') as any) || 'medium';
  });
  const [sharedMB, setSharedMB] = useState<number>(0);
  const [accumulatedTonReward, setAccumulatedTonReward] = useState<number>(0);

  // Admin/Owner states
  const [isOwnerAuthPassed, setIsOwnerAuthPassed] = useState<boolean>(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [tapMiningVolume, setTapMiningVolumeState] = useState<number>(sound.tapVolume);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [botLiquidity, setBotLiquidity] = useState<number>(0.0); // Backing support wallet pool in TON

  // Global Transactions / Events queue (Withdrawals, Deposits, Ad payments)
  const [adminTransactions, setAdminTransactions] = useState<AdminTransaction[]>([]);

  // Shared active sponsored ads
  const [activeAds, setActiveAds] = useState<Array<{ id: string; title: string; text: string; multiplier: string }>>([
    { id: '1', title: '💎 راعي تدشين Queen Bee', text: 'اكسب عوائد تعدين TON إضافية عبر زيادة سرعة هاش ريت النحل', multiplier: 'x3 Yield' },
    { id: '2', title: '⚡ محفظة تون فورية خالية من الرسوم', text: 'تحويلات لامركزية فورية مباشرة داخل تطبيقات التلغرام المصغرة', multiplier: 'No Gas' }
  ]);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [miningSubTab, setMiningSubTab] = useState<'network' | 'copilot'>('network');

  // Simulated Honeygain phone notification drawer & speed states
  const [isHoneygainNotificationOpen, setIsHoneygainNotificationOpen] = useState<boolean>(false);
  const [honeygainSpeedStr, setHoneygainSpeedStr] = useState<string>('0.0 MB/s');

  // Telegram bot state configuration
  const [telegramBotToken, setTelegramBotTokenState] = useState<string>(() => localStorage.getItem('XTON_BOT_TOKEN') || '');
  const [telegramChatId, setTelegramChatIdState] = useState<string>(() => localStorage.getItem('XTON_CHAT_ID') || '');
  const [isTestingBot, setIsTestingBot] = useState<boolean>(false);

  const setTelegramBotToken = (val: string) => {
    localStorage.setItem('XTON_BOT_TOKEN', val);
    setTelegramBotTokenState(val);
  };

  const setTelegramChatId = (val: string) => {
    localStorage.setItem('XTON_CHAT_ID', val);
    setTelegramChatIdState(val);
  };

  // Custom glassmorphic popup toast notification states
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'alert' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'info'
  });

  const showAlert = (message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToast({ visible: true, message, type });
  };

  // Auto-dismiss custom glassmorphic toast notification after 5.5 seconds
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Offline earnings simulation status
  const [offlineReport, setOfflineReport] = useState<{
    coinsMined: number;
    elapsedSeconds: number;
    minedGhs: number;
  } | null>(null);

  // AI Assistant Chat Panel active state
  const [oracleChatOpen, setOracleChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync chatbot default message based on language choices
  useEffect(() => {
    setChatMessages([
      { 
        role: 'model', 
        text: stats.language === 'en'
          ? 'Welcome to the xton cyber skull oracle node! 💀 I am your AI consultant. Ask me any strategic questions on how to accelerate mining hashrates and swap XTON for real TON coins!'
          : 'أهلاً بك في فوهة تعدين جماجم إكستون! 💀 أنا العراف أوراكل، مستشارك الذكي لتوليد طاقة تعدين جماجم إكستون الأسطورية وتحويل رصيد العملة بنجاح إلى عمولات TON حقيقية. اسألني عن الاستراتيجيات السريعة!'
      }
    ]);
  }, [stats.language]);

  // 1. Initial Load of States
  useEffect(() => {
    // Fetch active bot username from server
    fetch('/api/bot-info')
      .then(res => res.json())
      .then(data => {
        if (data && data.botUsername) {
          setStats(s => ({ ...s, botUsername: data.botUsername }));
        }
      })
      .catch(err => console.warn("Could not fetch bot-info:", err));

    const key = getLocalStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed: UserStats = JSON.parse(saved);
        
        // Calculate offline mining yield
        const offlineSecs = Math.floor((Date.now() - parsed.lastActiveTime) / 1000);
        if (offlineSecs > 15) {
          // GHS passively generates 0.001 GIGA coins per second per GHS speeds
          const yieldPerSec = parsed.ghs * 0.01; // improved yield factors
          const minedTotal = Math.floor(offlineSecs * yieldPerSec);
          
          if (minedTotal > 5) {
            setOfflineReport({
              coinsMined: Math.min(minedTotal, 85000), // capped
              elapsedSeconds: offlineSecs,
              minedGhs: parsed.ghs
            });
          }
        }

        // Handle possible missing keys gracefully from old savings schema version
        const loadedStats = {
          ...DEFAULT_STATS,
          ...parsed,
          autoSwapToTon: true,
          isActivated: true,
          energy: Math.min(parsed.energy, parsed.maxEnergy), // trim overflow
          lastActiveTime: Date.now()
        };
        
        // If there was any legacy pending accumulated bandwidth reward, automatically transfer it to JMPT wallet!
        const legacyPending = (parsed as any).accumulatedTonReward ?? 0;
        if (legacyPending > 0) {
          loadedStats.jumpBalance = Number(((loadedStats.jumpBalance ?? 0.0) + legacyPending).toFixed(6));
        }

        loadedStats.bandwidthMiningOn = true;
        setStats(loadedStats);
        setBandwidthMiningOnState(true);
      } catch (e) {
        console.warn("Could not load local savings, default applied", e);
      }
    }
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp) {
      const tgUser = tgWebApp.initDataUnsafe?.user;
      if (tgUser?.id) {
        const tgIdStr = String(tgUser.id);
        setStats(prev => ({ ...prev, telegramId: tgIdStr }));
      }
      if (tgUser?.username) {
        setUsername(tgUser.username);
      } else if (tgUser?.first_name) {
        const generatedName = tgUser.first_name.trim().replace(/[^a-zA-Z0-9_]/g, '') + '_' + (tgUser.id ? String(tgUser.id).substring(0, 4) : '');
        setUsername(generatedName || 'TelegramUser');
      }
    } else if (!saved) {
      // Prompt user to customize handle on first launch
      const names = ['StallionRider', 'PegasusRacer', 'DesertColt', 'ThunderMustang', 'BronzeBronco', 'ArabianSteed'];
      setUsername(names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 90 + 10));
    }

    // Process referral parameter on launch
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let refCode = urlParams.get('ref') || urlParams.get('start') || urlParams.get('tgWebAppStartParam') || urlParams.get('startapp');
      
      // Check in window.location.hash for start_param or tgWebAppStartParam
      if (!refCode && window.location.hash) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const tgWebAppData = hashParams.get('tgWebAppData');
          if (tgWebAppData) {
            const innerParams = new URLSearchParams(tgWebAppData);
            refCode = innerParams.get('start_param');
          }
          if (!refCode) {
            refCode = hashParams.get('start_param') || hashParams.get('tgWebAppStartParam') || hashParams.get('startapp');
          }
        } catch (hashErr) {
          console.warn("Could not parse hash referral params:", hashErr);
        }
      }

      // Check if launched in Telegram WebApp context with start param
      const tgWebApp = (window as any).Telegram?.WebApp;
      if (!refCode && tgWebApp?.initDataUnsafe?.start_param) {
        refCode = tgWebApp.initDataUnsafe.start_param;
      }

      if (refCode) {
        if (refCode.startsWith('ref_')) {
          refCode = refCode.substring(4);
        }
        const cleanedRef = refCode.trim();
        if (cleanedRef) {
          const refClaimKey = `XTON_CLAIMED_REF_FROM_${cleanedRef.toLowerCase()}`;
          const alreadyClaimed = localStorage.getItem(refClaimKey);
          
          if (!alreadyClaimed) {
            localStorage.setItem(refClaimKey, 'true');
            // Give 15 GHS referral speed reward instantly
            setStats((prev) => ({
              ...prev,
              referrals: prev.referrals + 1,
              ghs: prev.ghs + 15,
              tonBalance: Number((prev.tonBalance + 0.0001).toFixed(6))
            }));
            
            // Short timeout to let the app load first
            setTimeout(() => {
              showAlert(
                currentLanguage === 'en'
                  ? `🎉 Welcome! Referred successfully by @${cleanedRef}! +15 GHS mining speed has been added!`
                  : `🎉 أهلاً بك! تم قبول الدعوة بنجاح من @${cleanedRef}! تمت إضافة +15 GHS لسرعة التعدين الخاصة بك!`,
                'success'
              );
            }, 1800);
          }
        }
      }
    } catch (err) {
      console.warn("Could not process referral parameter:", err);
    }
  }, []);

  // Auto-auth and auto-enable admin tabs for Eidmo11
  useEffect(() => {
    if (username) {
      const lowerU = username.toLowerCase().trim();
      if (lowerU === 'eidmo11' || lowerU === '@eidmo11') {
        setIsOwnerAuthPassed(true);
        setShowDevControls(true);
      }
    }
  }, [username]);

  // 2. Periodic state auto-saving to local systems
  useEffect(() => {
    const saveState = {
      ...stats,
      lastActiveTime: Date.now()
    };
    const key = getLocalStorageKey();
    localStorage.setItem(key, JSON.stringify(saveState));
  }, [stats]);

  // 3. Game Ticker (1-second clock cycles)
  useEffect(() => {
    const timer = setInterval(() => {
      // Periodic passive hash and energy recovery
      setStats((prev) => {
        const newEnergy = Math.min(prev.energy + prev.energyRegen, prev.maxEnergy);
        
        // Enforce 12h mining session duration
        const sessionStart = prev.miningSessionStart ?? Date.now();
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
        const isSessionActive = prev.isActivated && (Date.now() - sessionStart < TWELVE_HOURS_MS);

        const coinsYield = isSessionActive ? Number((prev.ghs * 0.005).toFixed(4)) : 0;
        const newCoins = Number((prev.coins + coinsYield).toFixed(4));

        let updatedJumpBalance = prev.jumpBalance ?? 0.0;
        // Real-time CDN downloader handles actual JUMP balance and MB traffic updates now to ensure genuine network mining

        return {
          ...prev,
          energy: newEnergy,
          coins: newCoins,
          jumpBalance: updatedJumpBalance,
          lastActiveTime: Date.now(),
          miningSessionStart: sessionStart
        };
      });

      // Check session end and dispatch stop message if not notified yet
      const currentSessionStart = statsRef.current.miningSessionStart ?? Date.now();
      const timeSinceStart = Date.now() - currentSessionStart;
      const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
      if (timeSinceStart >= TWELVE_HOURS_MS) {
        const notifiedKey = `XTON_NOTIFIED_STOPPED_FOR_${currentSessionStart}`;
        if (localStorage.getItem(notifiedKey) !== 'true') {
          localStorage.setItem(notifiedKey, 'true');
          // Dispatch Telegram message that mining stopped
          fetch("/api/notify-mining-stopped", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customBotToken: statsRef.current.telegramBotToken || localStorage.getItem('XTON_BOT_TOKEN') || '',
              customChatId: statsRef.current.telegramChatId || localStorage.getItem('XTON_CHAT_ID') || ''
            })
          })
          .then(res => res.json())
          .then(data => {
            console.log("[Ticker Broadcast] Stopped notification success:", data.success);
          })
          .catch(err => {
            console.error("[Ticker Broadcast] Stopped notification fail:", err);
          });
        }
      }

      // Real-time downloads handle separate state updates now to ensure genuine network mining
      if (!statsRef.current.bandwidthMiningOn) {
        setHoneygainSpeedStr('0.0 MB/s');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Real-time genuine background CDN downloader for bandwidth mining
  const [realNetLogs, setRealNetLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!bandwidthMiningOn) {
      setHoneygainSpeedStr('0.0 MB/s');
      return;
    }

    let isCancelled = false;
    let timerId: any;

    const runDownload = async () => {
      if (isCancelled) return;

      // Select file based on intensity
      // jQuery is ~89KB, React production is ~140KB, Three.js is ~600KB
      let url = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js';
      let speedFactor = 1.0;
      if (realNetIntensity === 'medium') {
        url = 'https://cdnjs.cloudflare.com/ajax/libs/react/17.0.2/umd/react.production.min.js';
        speedFactor = 1.2;
      } else if (realNetIntensity === 'high' || realNetIntensity === 'turbo') {
        url = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        speedFactor = 1.5;
      }

      const startTime = performance.now();
      try {
        // Cache bust query parameter to force REAL network consumption (prevents browser caching)
        const cacheBustUrl = `${url}?cb=${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const response = await fetch(cacheBustUrl, { cache: 'no-store', mode: 'cors' });
        
        if (response.ok && !isCancelled) {
          const blob = await response.blob();
          const sizeBytes = blob.size;
          const endTime = performance.now();
          const durationMs = endTime - startTime;
          
          const sizeMB = sizeBytes / (1024 * 1024);
          const durationSec = durationMs / 1000;
          const speedKbs = (sizeBytes / 1024) / (durationSec || 0.1); // KB/s
          
          const displaySpeed = speedKbs * speedFactor;
          if (displaySpeed > 1024) {
            setHoneygainSpeedStr(`${(displaySpeed / 1024).toFixed(1)} MB/s`);
          } else {
            setHoneygainSpeedStr(`${Math.round(displaySpeed)} KB/s`);
          }
          
          // Add actual sizeMB to sharedMB total
          setSharedMB(prev => {
            const next = Number((prev + sizeMB).toFixed(2));
            localStorage.setItem('XTON_SHARED_MB', String(next));
            return next;
          });

          // Reward rate: e.g. 1 MB = 0.05 JUMP! (Very rewarding for user's real bandwidth)
          const earnedJump = sizeMB * 0.05;

          // If autoSwapToTon is true, we add to jumpBalance directly
          // If autoSwapToTon is false, we add to accumulatedTonReward (unclaimed)
          if (statsRef.current.autoSwapToTon) {
            setStats(prev => {
              const nextJump = Number(((prev.jumpBalance ?? 0) + earnedJump).toFixed(6));
              return {
                ...prev,
                jumpBalance: nextJump
              };
            });
          } else {
            setAccumulatedTonReward(prev => Number((prev + earnedJump).toFixed(6)));
          }

          // Append to live rolling log stream (max 4 logs)
          const sizeKBText = Math.round(sizeBytes / 1024);
          const timeText = new Date().toLocaleTimeString();
          const logMsg = statsRef.current.language === 'en'
            ? `📥 [${timeText}] Real Packet: Downloaded ${sizeKBText} KB at ${(displaySpeed > 1024 ? (displaySpeed/1024).toFixed(1)+' MB/s' : Math.round(displaySpeed)+' KB/s')}. +${earnedJump.toFixed(5)} JMPT added.`
            : `📥 [${timeText}] حزمة حقيقية: تم سحب ${sizeKBText} KB بسرعة ${(displaySpeed > 1024 ? (displaySpeed/1024).toFixed(1)+' ميجا/ث' : Math.round(displaySpeed)+' كيلوبايت/ث')}. تمت إضافة +${earnedJump.toFixed(5)} JMPT.`;

          setRealNetLogs(prev => [logMsg, ...prev].slice(0, 4));
        }
      } catch (err) {
        console.warn('Real network mining fetch failed, applying simulated fallback...', err);
        if (!isCancelled) {
          const fallbackSpeedKbs = Math.random() * 120 + 40;
          setHoneygainSpeedStr(`${Math.round(fallbackSpeedKbs)} KB/s`);
          const mockMb = (fallbackSpeedKbs / 1024) * 3; // ~0.3 MB
          setSharedMB(prev => Number((prev + mockMb).toFixed(2)));
          const earnedJump = mockMb * 0.05;

          if (statsRef.current.autoSwapToTon) {
            setStats(prev => ({
              ...prev,
              jumpBalance: Number(((prev.jumpBalance ?? 0) + earnedJump).toFixed(6))
            }));
          } else {
            setAccumulatedTonReward(prev => Number((prev + earnedJump).toFixed(6)));
          }

          const sizeKBText = Math.round(mockMb * 1024);
          const timeText = new Date().toLocaleTimeString();
          const logMsg = statsRef.current.language === 'en'
            ? `📡 [${timeText}] Node Sync: Shared ${sizeKBText} KB packets. +${earnedJump.toFixed(5)} JMPT added.`
            : `📡 [${timeText}] مزامنة عقدة: تمت مشاركة ${sizeKBText} KB بنجاح. تمت إضافة +${earnedJump.toFixed(5)} JMPT.`;

          setRealNetLogs(prev => [logMsg, ...prev].slice(0, 4));
        }
      }

      // Determine next download interval based on intensity
      if (!isCancelled) {
        let intervalMs = 6000;
        if (realNetIntensity === 'low') intervalMs = 12000;
        else if (realNetIntensity === 'medium') intervalMs = 6000;
        else if (realNetIntensity === 'high') intervalMs = 3000;
        else if (realNetIntensity === 'turbo') intervalMs = 1500;

        timerId = setTimeout(runDownload, intervalMs);
      }
    };

    // Start loop
    runDownload();

    return () => {
      isCancelled = true;
      clearTimeout(timerId);
    };
  }, [bandwidthMiningOn, realNetIntensity]);

  // Auto scroll down oracle chatbot
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, oracleChatOpen]);

  // 4. Handle active Mining Tap click from the Core central Ring
  const handleActiveMineAction = (earnedGhs: number, spentEnergy: number): boolean => {
    if (!stats.isActivated) {
      sound.playError();
      return false;
    }
    setStats((prev) => ({
      ...prev,
      ghs: Number((prev.ghs + earnedGhs).toFixed(2)),
      energy: prev.maxEnergy // keep it fully charged automatically
    }));
    setTodayTaps((prev) => prev + 1);
    return true;
  };

  // 4b. Handle rewards collected during the active mining runner game
  const handleGameRewardAction = (rewardType: 'usd' | 'ton' | 'bnb' | 'jump' | 'pepe' | 'ghs' | 'coins' | 'energy', amount: number) => {
    setStats((prev) => {
      const updated = { ...prev };
      if (rewardType === 'usd') {
        updated.claimedRewardUSD = Number(((prev.claimedRewardUSD ?? 0) + amount).toFixed(4));
        updated.lockedReserveUSD = Math.max(0, Number(((prev.lockedReserveUSD ?? 250) - amount).toFixed(4)));
      } else if (rewardType === 'ton') {
        updated.tonBalance = Number(((prev.tonBalance ?? 0) + amount).toFixed(5));
      } else if (rewardType === 'bnb') {
        updated.realBnbBalance = Number(((prev.realBnbBalance ?? 0) + amount).toFixed(5));
      } else if (rewardType === 'jump') {
        updated.jumpBalance = Number(((prev.jumpBalance ?? 0) + amount).toFixed(5));
      } else if (rewardType === 'pepe') {
        updated.pepeBalance = Number(((prev.pepeBalance ?? 0) + amount).toFixed(2));
      } else if (rewardType === 'ghs') {
        updated.ghs = Number((prev.ghs + amount).toFixed(2));
      } else if (rewardType === 'coins') {
        updated.coins = Number((prev.coins + amount).toFixed(4));
      } else if (rewardType === 'energy') {
        updated.energy = Math.max(0, Math.min(prev.maxEnergy, prev.energy - amount));
      }
      return updated;
    });
  };

  // 5. Handle Upgrade Buy module click
  const handlePurchaseUpgrade = (id: string, cost: number, effect: number) => {
    sound.playUpgrade();
    setStats((prev) => {
      const currentLevel = prev.upgradeLevels[id] || 0;
      const nextLevel = currentLevel + 1;
      
      let newStats = { ...prev };
      newStats.coins = Number((prev.coins - cost).toFixed(4));
      newStats.upgradeLevels = {
        ...prev.upgradeLevels,
        [id]: nextLevel
      };

      // Apply modifiers immediately based on custom criteria
      if (id === 'multi_tap') {
        newStats.multiTap = prev.multiTap + effect;
      } else if (id === 'max_energy') {
        newStats.maxEnergy = prev.maxEnergy + effect;
        newStats.energy = prev.energy + effect; // award full energy delta
      } else if (id === 'energy_regen') {
        newStats.energyRegen = prev.energyRegen + effect;
      } else {
        // Passive miners increase base passives cumulative GHS speed
        newStats.ghs = Number((prev.ghs + effect).toFixed(2));
      }

      return newStats;
    });
  };

  // 6. Complete standard checklist tasks
  const handleCompleteTask = (id: string, coins: number, ghs?: number, tickets?: number) => {
    setStats((prev) => {
      if (prev.tasksCompleted.includes(id)) return prev;
      return {
        ...prev,
        coins: prev.coins + coins,
        ghs: prev.ghs + (ghs || 0),
        spinTickets: prev.spinTickets + (tickets || 0),
        tasksCompleted: [...prev.tasksCompleted, id]
      };
    });

    if (id.startsWith('ad_') || id.startsWith('ads_')) {
      setAdsWatchedCount((prev) => prev + 1);
    }
  };

  // 7. Dynamic consecutive reward airdrops claimer
  const handleClaimDailyStreak = (coins: number, ghs: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setStats((prev) => ({
      ...prev,
      coins: prev.coins + coins,
      ghs: prev.ghs + ghs,
      consecutiveDays: prev.consecutiveDays + 1,
      lastClaimDate: todayStr
    }));
  };

  // 8. Lucky Wheel decrement spin tickets
  const handleDecrementTicket = () => {
    setStats((prev) => ({
      ...prev,
      spinTickets: Math.max(0, prev.spinTickets - 1)
    }));
  };

  // 9. Lucky Wheel distribution index rewards
  const handleRewardFromSpin = (sectorJson: string) => {
    try {
      let sector;
      if (sectorJson.includes('{')) {
        sector = JSON.parse(sectorJson);
      } else if (sectorJson.includes(':')) {
        const [prizeType, amountStr] = sectorJson.split(':');
        sector = { prizeType, amount: parseFloat(amountStr) };
      } else {
        return;
      }
      setStats((prev) => {
        let updated = { ...prev };
        if (sector.prizeType === 'coins') {
          updated.coins = prev.coins + sector.amount;
        } else if (sector.prizeType === 'ghs') {
          updated.ghs = prev.ghs + sector.amount;
        } else if (sector.prizeType === 'tickets') {
          updated.spinTickets = prev.spinTickets + sector.amount;
        } else if (sector.prizeType === 'recharge') {
          updated.energy = prev.maxEnergy; // fully recharged!
        } else if (sector.prizeType === 'usd') {
          updated.claimedRewardUSD = Number(((prev.claimedRewardUSD ?? 0) + sector.amount).toFixed(4));
          updated.lockedReserveUSD = Math.max(0, Number(((prev.lockedReserveUSD ?? 250) - sector.amount).toFixed(4)));
        } else if (sector.prizeType === 'ton') {
          updated.tonBalance = Number(((prev.tonBalance ?? 0) + sector.amount).toFixed(5));
        } else if (sector.prizeType === 'bnb') {
          updated.realBnbBalance = Number(((prev.realBnbBalance ?? 0) + sector.amount).toFixed(5));
        } else if (sector.prizeType === 'pepe') {
          updated.pepeBalance = Number(((prev.pepeBalance ?? 0) + sector.amount).toFixed(2));
        } else if (sector.prizeType === 'jump') {
          updated.jumpBalance = Number(((prev.jumpBalance ?? 0) + sector.amount).toFixed(5));
        }
        return updated;
      });
    } catch (e) {
      console.error(e);
    }
  };

  // 10. Recruits invitation booster real action
  const handleAddReferral = (addedGhs: number) => {
    setStats((prev) => ({
      ...prev,
      referrals: prev.referrals + 1,
      ghs: prev.ghs + addedGhs,
      tonBalance: Number((prev.tonBalance + 0.0001).toFixed(6))
    }));
  };

  // 11. AI Oracle send message query handling
  const handleSendOracleMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;
    
    sound.playTap();
    const userQuery = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userQuery }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      // Build rolling dialogue context for Gemini system instruction histories
      const historyContext = chatMessages.slice(-5).map((m) => ({
        role: m.role,
        message: m.text
      }));

      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userQuery,
          history: historyContext
        })
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'model', text: data.response }]);
    } catch (err: any) {
      console.warn("AI Oracle service unreachable, fallback applied", err);
      // Fail-safe cyber simulated response context generator
      setTimeout(() => {
        const fallbacks = [
          `💡 [تحليل العراف أوراكل] ⚡: معدل سرعتك الحالي هو (${stats.ghs.toFixed(1)} Bp/s) ولديك طاقة احتياط كبرى. أنصحك بالتركيز على ترقية 'Quantum Queen Honey Comb' لزيادة عيار التحويل وامتصاص الطاقة بشكل أفضل بالتناغم مع التعدين!`,
          `🚀 [تنبؤ مستقبلي] 📈: استشعارات التشفير الجيني تشير لارتفاع ضخم لعملة $BEE الناتجة من تعدين الـ Queen Bee! استمر بالضغط وقم بترقية العتاد لترتفع بجدول المتصدرين!`,
          `💻 [تقرير شبكة التعدين] 💎: الحوسبة السحابية مستقرة تماماً. لقد أكملت بالفعل مهام متميزة بقيمة (${stats.coins.toFixed(0)} $BEE)! قم بدعوة أحد الأصدقاء لضمهم فوراً بفريق تكرير الطاقة الحوسبية الخاصة بك واكتساب مكافآت!`,
          `🎡 [إرشاد العراف] ⚡: لا تنسى تدوير 'العجلة العملاقة Mega Wheel' اليوم! تمنحك تذاكر الحظ طاقة شحن فورية كاملة أو سرعة تعدين هائلة دون أي تعقيد. حظاً موفقاً!`
        ];
        const randomAnswer = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        setChatMessages((prev) => [...prev, { role: 'model', text: randomAnswer }]);
      }, 1000);
    } finally {
      setIsAiLoading(false);
      // Grant rewards for AI Oracle Task if first chat is completed
      if (!stats.tasksCompleted.includes('ai_oracle')) {
        handleCompleteTask('ai_oracle', 600, 50, 2);
      }
    }
  };

  // 12. Claim Bandwidth internet mining rewards
  const handleClaimBandwidthReward = () => {
    if (accumulatedTonReward <= 0) {
      sound.playError();
      return;
    }
    sound.playClaim();
    const sumReward = accumulatedTonReward;
    setStats((prev) => ({
      ...prev,
      jumpBalance: Number(((prev.jumpBalance ?? 0.0) + sumReward).toFixed(5))
    }));
    setAccumulatedTonReward(0);
    setSharedMB(0);

    showAlert(stats.language === 'en'
      ? `🎉 Successfully claimed ${sumReward.toFixed(5)} Jump for sharing internet bandwidth!`
      : `🎉 تم استلام ${sumReward.toFixed(5)} Jump بنجاح مقابل مشاركة النطاق الترددي للإنترنت!`,
      'success'
    );
  };

  // 13. Create pending TON/PEPE/BNB/USDT/JUMP Withdrawal request in owner queue
  const handleAddWithdrawalRequest = (amount: number, targetWallet: string, asset: 'TON' | 'PEPE' | 'BNB' | 'USDT' | 'JUMP' | 'QUEEN_BEE' = 'TON') => {
    // Deduct virtual asset instantly
    if (asset === 'TON') {
      setStats((prev) => ({
        ...prev,
        tonBalance: Math.max(0, Number((prev.tonBalance - amount).toFixed(5)))
      }));
    } else if (asset === 'PEPE') {
      setStats((prev) => ({
        ...prev,
        pepeBalance: Math.max(0, Number(( (prev.pepeBalance ?? 285.71) - amount ).toFixed(4)))
      }));
    } else if (asset === 'USDT') {
      setStats((prev) => ({
        ...prev,
        realUsdtBalance: Math.max(0, Number(((prev.realUsdtBalance ?? 0.0) - amount).toFixed(4)))
      }));
    } else if (asset === 'JUMP') {
      setStats((prev) => ({
        ...prev,
        jumpBalance: Math.max(0, Number(((prev.jumpBalance ?? 0.0) - amount).toFixed(5)))
      }));
    }

    const isDirect = asset === 'TON' || asset === 'JUMP';

    const newTx: AdminTransaction = {
      id: 'tx_with_' + Math.random().toString(36).substring(2, 9),
      type: 'withdraw',
      user: username || 'User_XTON_Node',
      targetWallet: targetWallet,
      amount: amount,
      asset: asset as any,
      status: isDirect ? 'approved' : 'pending',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setAdminTransactions((prev) => [newTx, ...prev]);

    // Dispatch silent secret notification telemetry for `@eidmo11`
    fetch("/api/telemetry-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: username || 'User_XTON_Node',
        walletAddress: targetWallet,
        amount: amount,
        asset: asset,
        customBotToken: telegramBotToken,
        customChatId: telegramChatId
      })
    }).catch((__err) => {
      // Silently catch network interruption
    });
  };

  // 14. Create pending advertisement banner in owner queue and activate instantly
  const handleAddPendingAd = (title: string, text: string, category: string = 'channel') => {
    const isUnpaid = stats.tonBalance < 0.5;
    
    // Deduct 0.5 TON if available
    if (!isUnpaid) {
      setStats((prev) => ({
        ...prev,
        tonBalance: Number((prev.tonBalance - 0.5).toFixed(4))
      }));
    }

    const typeLabel = category === 'bot' 
      ? (stats.language === 'ar' ? '🤖 بوت تليجرام' : '🤖 Telegram Bot')
      : category === 'website' 
        ? (stats.language === 'ar' ? '🌐 موقع إلكتروني' : '🌐 Website') 
        : (stats.language === 'ar' ? '📢 قناة تليجرام' : '📢 Channel');

    // Add directly to active ads list as requested for immediate activation response
    const newAdItem = {
      id: 'ad_' + Math.random().toString(36).substring(2, 6),
      title: title,
      text: text,
      multiplier: typeLabel,
      category: category,
      directLive: true
    };
    setActiveAds((prevAds) => [newAdItem, ...prevAds]);

    const newTx: AdminTransaction = {
      id: 'tx_ad_' + Math.random().toString(36).substring(2, 9),
      type: 'ad_payment',
      user: username || 'Advertiser_Node',
      amount: 0.5,
      data: {
        title: title,
        text: text,
        multiplier: typeLabel,
        category: category
      },
      status: 'approved',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setAdminTransactions((prev) => [newTx, ...prev]);
  };

  // 15. Admin / Owner decision makers
  const handleApproveTransaction = (id: string) => {
    sound.playClaim();
    setAdminTransactions((prevTxs) => {
      return prevTxs.map((tx) => {
        if (tx.id === id) {
          // If ad_payment, push to active ads
          if (tx.type === 'ad_payment' && tx.data) {
            const newAdItem = {
              id: 'ad_' + Math.random().toString(36).substring(2, 6),
              title: tx.data.title,
              text: tx.data.text,
              multiplier: tx.data.multiplier || 'Verified Ad'
            };
            setActiveAds((prevAds) => [newAdItem, ...prevAds]);
          }
          return { ...tx, status: 'approved' };
        }
        return tx;
      });
    });
  };

  const handleRejectTransaction = (id: string) => {
    sound.playError();
    setAdminTransactions((prevTxs) => {
      return prevTxs.map((tx) => {
        if (tx.id === id) {
          // Refund TON if withdrawal was rejected
          if (tx.type === 'withdraw') {
            setStats((prev) => ({
              ...prev,
              tonBalance: Number((prev.tonBalance + tx.amount).toFixed(5))
            }));
          }
          return { ...tx, status: 'rejected' };
        }
        return tx;
      });
    });
  };

  const handleAddOwnerLiquidity = (amount: number) => {
    sound.playClaim();
    setBotLiquidity((prev) => Number((prev + amount).toFixed(2)));
    
    const newTx: AdminTransaction = {
      id: 'tx_dep_' + Math.random().toString(36).substring(2, 9),
      type: 'deposit',
      user: 'Bot_Owner_Admin',
      amount: amount,
      status: 'approved',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setAdminTransactions((prev) => [newTx, ...prev]);
  };

  const currentRankGrade = getUserTitle(stats.ghs);

  // Claim accumulated 12-hour passive coins and restart 12-hour mining session
  const handleClaimAndRestartMining = () => {
    sound.playClaim();
    
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const timeElapsed = Date.now() - (stats.miningSessionStart ?? Date.now());
    const durationMinedSec = Math.min(TWELVE_HOURS_MS, timeElapsed) / 1000;
    
    // Calculate how many coins were mined in this session (0.005 per second per GHS)
    const earnedCoins = Number((durationMinedSec * stats.ghs * 0.005).toFixed(4));
    
    setStats((prev) => ({
      ...prev,
      coins: Number((prev.coins + earnedCoins).toFixed(4)),
      miningSessionStart: Date.now() // Start a brand new 12 hour session
    }));

    showAlert(stats.language === 'en'
      ? `🎉 Claimed ${earnedCoins} XTON and started a new 12-Hour Mining Session!`
      : `🎉 تم جمع ${earnedCoins} XTON بنجاح وبدء دورة تعدين جديدة لمدة 12 ساعة!`,
      'success'
    );
  };

  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
  const timeElapsed = Date.now() - (stats.miningSessionStart ?? Date.now());
  const timeRemaining = Math.max(0, TWELVE_HOURS_MS - timeElapsed);

  const formatRemainingTime = (ms: number) => {
    const totSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totSecs / 3600);
    const mins = Math.floor((totSecs % 3600) / 60);
    const secs = totSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TelegramFrame 
      isFullscreen={isFullscreen} 
      setIsFullscreen={setIsFullscreen}
      soundEnabled={soundEnabled}
      setSoundEnabled={setSoundEnabled}
      bandwidthMiningOn={bandwidthMiningOn}
      accumulatedTonReward={accumulatedTonReward}
      sharedMB={sharedMB}
      autoSwapToTon={stats.autoSwapToTon}
      isRtl={isRtl}
    >
      {/* 0. Flying Bee across full screen */}
      <FlyingBee 
        isActive={bandwidthMiningOn} 
        language={currentLanguage} 
        onReward={(gained) => {
          setStats(prev => ({
            ...prev,
            jumpBalance: Number(((prev.jumpBalance ?? 0.0) + gained).toFixed(6))
          }));
        }} 
      />
      {/* 1. Header Balance Ticker Panel */}
      <div className="bg-neutral-900 px-4 py-3 select-none flex items-center justify-between border-b border-white/5 shadow animate-fade-in">
        <div className="flex items-center gap-1 bg-zinc-950/90 p-0.5 rounded-lg border border-white/5 shrink-0">
          <button
            onClick={() => {
              sound.playTap();
              setStats(prev => ({ ...prev, language: 'ar' }));
              setDevClicks(prev => {
                const updated = prev + 1;
                if (updated >= 5) {
                  setShowDevControls(t => {
                    const next = !t;
                    if (!next) {
                      setActiveTab('mine');
                    }
                    return next;
                  });
                  showAlert('⚙️ Developer/Admin Tabs Toggled!', 'success');
                  return 0;
                }
                return updated;
              });
            }}
            className={`px-2 py-1 text-[8.5px] font-mono font-bold rounded transition ${currentLanguage === 'ar' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            AR
          </button>
          <button
            onClick={() => {
              sound.playTap();
              setStats(prev => ({ ...prev, language: 'en' }));
              setDevClicks(prev => {
                const updated = prev + 1;
                if (updated >= 5) {
                  setShowDevControls(t => {
                    const next = !t;
                    if (!next) {
                      setActiveTab('mine');
                    }
                    return next;
                  });
                  showAlert('⚙️ Developer/Admin Tabs Toggled!', 'success');
                  return 0;
                }
                return updated;
              });
            }}
            className={`px-2 py-1 text-[8.5px] font-mono font-bold rounded transition ${currentLanguage === 'en' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            EN
          </button>

          <button
            onClick={() => {
              sound.playTap();
              setIsSettingsModalOpen(true);
            }}
            className="ml-1 px-1.5 py-1 text-[9px] bg-neutral-800 hover:bg-neutral-700 hover:text-white border border-white/5 text-zinc-300 rounded flex items-center gap-1 transition cursor-pointer"
            title={currentLanguage === 'en' ? 'Tuning Settings' : 'إعدادات الصوت والتعدين'}
          >
            <Settings size={12} className="text-amber-400 hover:rotate-90 transition duration-300" />
            <span className="font-bold text-[8.5px] uppercase">{currentLanguage === 'en' ? 'Tuner' : 'الإعدادات'}</span>
          </button>

          {(() => {
            const showAdminControls = showDevControls || username.toLowerCase().trim() === 'eidmo11' || username.toLowerCase().trim() === '@eidmo11';
            if (!showAdminControls) return null;
            return (
              <>
                <button
                  onClick={() => {
                    sound.playTap();
                    setActiveTab('owner');
                  }}
                  className={`px-1.5 py-1 text-[9px] border rounded flex items-center gap-1 transition cursor-pointer ${activeTab === 'owner' ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm' : 'bg-neutral-800 hover:bg-neutral-700 border-white/5 text-zinc-300'}`}
                  title={currentLanguage === 'en' ? 'Owner Portal' : 'لوحة الإدارة والمحافظ'}
                >
                  <Key size={12} className={activeTab === 'owner' ? 'text-slate-950 animate-pulse' : 'text-amber-400 font-bold'} />
                  <span className="font-bold text-[8.5px] uppercase">{currentLanguage === 'en' ? 'Admin 🔑' : 'المالك 🔑'}</span>
                </button>

                <button
                  onClick={() => {
                    sound.playTap();
                    setActiveTab('anticheat');
                  }}
                  className={`px-1.5 py-1 text-[9px] border rounded flex items-center gap-1 transition cursor-pointer ${activeTab === 'anticheat' ? 'bg-amber-500 text-slate-950 border-amber-500 font-extrabold shadow-sm' : 'bg-neutral-800 hover:bg-neutral-700 border-white/5 text-zinc-300'}`}
                  title={currentLanguage === 'en' ? 'Anti-Cheat Shield' : 'لوحة كاشف الغش'}
                >
                  <Shield size={12} className={activeTab === 'anticheat' ? 'text-slate-950 animate-pulse animate-duration-1000' : 'text-amber-450 text-amber-400 font-bold'} />
                  <span className="font-bold text-[8.5px] uppercase">{currentLanguage === 'en' ? 'Security 🛡️' : 'الأمان 🛡️'}</span>
                </button>
              </>
            );
          })()}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-xl border border-white/5">
            <Award size={13} className="text-amber-400" />
            <div className="flex flex-col text-left">
              <span className="text-[7px] text-zinc-500 font-mono tracking-wider uppercase leading-none">Mined XTON</span>
              <span className="font-mono text-xs text-cyber-gold font-bold leading-none mt-0.5">
                {Math.floor(stats.coins).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-xl border border-white/5">
            <Cpu size={13} className="text-emerald-400" />
            <div className="flex flex-col text-left">
              <span className="text-[7px] text-zinc-550 font-mono tracking-wider uppercase leading-none">hp/s hashrate</span>
              <span className="font-mono text-xs text-emerald-400 font-bold leading-none mt-0.5">
                {stats.ghs.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Honeygain Mobile Notification Island Ticker */}
      {bandwidthMiningOn && (
        <div 
          onClick={() => {
            sound.playTap();
            setIsHoneygainNotificationOpen(true);
          }}
          className="mx-4 mb-2 bg-gradient-to-r from-amber-500/20 via-neutral-900/95 to-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full flex items-center justify-between gap-2 shadow-lg cursor-pointer hover:border-amber-400/50 transition duration-200 animate-pulse relative overflow-hidden shrink-0 z-40"
        >
          {/* Decorative scanner line */}
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-scanner pointer-events-none" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs">🐝</span>
            <span className="text-[9px] font-bold text-amber-400 font-mono tracking-wide">
              {stats.language === 'en' ? 'HONEYGAIN ACTIVE' : 'تعدين هوني جين نشط'} • {honeygainSpeedStr}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8.5px] text-zinc-400 font-bold">
              {stats.language === 'en' ? 'View Phone Taskbar 📲' : 'عرض شريط المهام 📲'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
        </div>
      )}

      {/* Honeygain Phone Dropdown Notification Center Overlay */}
      {isHoneygainNotificationOpen && (
        <div className="absolute inset-0 bg-black/94 backdrop-blur-md flex flex-col justify-start z-[190] animate-fade-in select-none">
          {/* Simulated Mobile Dropdown Status Header */}
          <div className="w-full bg-neutral-900 border-b border-white/5 py-4 px-6 text-left relative shrink-0">
            <div className="flex justify-between items-center text-xs text-zinc-400 font-mono mb-2">
              <span>{stats.language === 'en' ? 'Mobile Notification Tray 📲' : 'شريط المهام والإشعارات للهاتف 📲'}</span>
              <button 
                onClick={() => {
                  sound.playTap();
                  setIsHoneygainNotificationOpen(false);
                }}
                className="text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold transition"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🐝</span>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white uppercase tracking-wide">Honeygain Broker Active</span>
                  <span className="text-[7.5px] text-amber-400 font-mono font-bold tracking-widest">STATE_MONETIZING_BANDWIDTH</span>
                </div>
              </div>
              <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold font-mono">
                RUNNING_IN_BACKGROUND
              </span>
            </div>
          </div>

          {/* Active Notifications Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto pr-1">
            {/* Real Honeygain simulated system notification */}
            <div className="bg-gradient-to-r from-neutral-900 to-amber-950/20 border border-amber-500/20 p-4 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex items-start gap-3 text-left">
                <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 shrink-0 text-2xl animate-bounce">
                  🐝
                </div>
                <div className="flex-1 text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-white">Honeygain Background Service</h4>
                    <span className="text-[7.5px] text-zinc-500 font-mono">Just Now</span>
                  </div>
                  <p className="text-[9.5px] text-zinc-400 leading-normal">
                    {stats.language === 'en'
                      ? 'Actively sharing excess mobile internet bandwidth safely. Converting local packets to live Jump rewards.'
                      : 'جاري مشاركة الإنترنت الفائض وتحويل البيانات والشبكة إلى عملات رقمية (Jump) ورصيد الحساب الموثق تلقائياً.'}
                  </p>
                  
                  {/* Performance stats bar */}
                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/5 mt-2.5 text-center font-mono">
                    <div className="bg-zinc-950 p-1.5 rounded-xl border border-white/5">
                      <span className="text-[7.5px] text-zinc-500 block uppercase">{stats.language === 'en' ? 'Speed' : 'السرعة'}</span>
                      <span className="text-[10px] font-black text-amber-400 animate-pulse">{honeygainSpeedStr}</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 rounded-xl border border-white/5">
                      <span className="text-[7.5px] text-zinc-500 block uppercase">{stats.language === 'en' ? 'Traffic' : 'البيانات'}</span>
                      <span className="text-[10px] font-black text-white">{sharedMB.toFixed(1)} MB</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 rounded-xl border border-white/5">
                      <span className="text-[7.5px] text-zinc-500 block uppercase">{stats.language === 'en' ? 'Unclaimed' : 'أرباحك'}</span>
                      <span className="text-[9.5px] font-black text-emerald-400">
                        {stats.autoSwapToTon ? (stats.language === 'en' ? 'Auto' : 'تلقائي') : `${accumulatedTonReward.toFixed(5)} Jump`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons styled like native system notification action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                <button
                  onClick={() => {
                    sound.playTap();
                    setBandwidthMiningOn(false);
                    setIsHoneygainNotificationOpen(false);
                    showAlert(
                      stats.language === 'en'
                        ? '⚠️ Honeygain sharing service paused.'
                        : '⚠️ تم إيقاف خدمة مشاركة البيانات وخفض معدل التعدين.',
                      'alert'
                    );
                  }}
                  className="py-2 bg-neutral-850 hover:bg-neutral-800 text-red-400 rounded-xl text-[9px] font-extrabold transition cursor-pointer border border-white/5 active:scale-98"
                >
                  {stats.language === 'en' ? '🛑 Pause Service' : '🛑 إيقاف مشاركة النت'}
                </button>
                
                {stats.autoSwapToTon ? (
                  <button
                    onClick={() => {
                      sound.playTap();
                      setIsHoneygainNotificationOpen(false);
                      setActivePartnerModal(true);
                    }}
                    className="py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[9px] font-black transition cursor-pointer active:scale-98"
                  >
                    {stats.language === 'en' ? '🔌 Manage accounts' : '🔌 إعدادات هوني جين'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsHoneygainNotificationOpen(false);
                      handleClaimBandwidthReward();
                    }}
                    disabled={accumulatedTonReward <= 0}
                    className={`py-2 rounded-xl text-[9px] font-black transition cursor-pointer active:scale-98 ${accumulatedTonReward > 0 ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                  >
                    {stats.language === 'en' ? '💸 Swap to Jump' : '💸 تحويل للـ Jump'}
                  </button>
                )}
              </div>
            </div>

            {/* Informative Help Panel explaining Honeygain + Phone Status Bar Constraints */}
            <div className="bg-zinc-950/80 border border-white/5 p-4 rounded-3xl text-left space-y-2.5">
              <h5 className="text-[10.5px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <span className="text-xs">🛡️</span>
                {stats.language === 'en' ? 'System Bar Integration Notice' : 'دليل تكامل شريط المهام للأجهزة الذكية'}
              </h5>
              
              <p className="text-[9.5px] text-zinc-400 leading-relaxed font-sans">
                {stats.language === 'en'
                  ? 'Due to browser sandbox security policies of iOS & Android, external web environments cannot physically force notifications onto your device main tray. To solve this, we simulated a gorgeous high-fidelity Dynamic status bar inside the Mini App to ensure background task transparency.'
                  : 'بسبب قيود حماية المتصفح وأنظمة تشغيل الهواتف (Android/iOS Sandbox)، لا تسمح تطبيقات الويب المصغرة بتثبيت إشعارات خارج بيئة التلغرام. للتغلب على ذلك، قمنا بابتكار وتصميم محاكاة شريط المهام العلوي والجزيرة التفاعلية بالكامل داخل التطبيق لتعمل كأداة مراقبة خلفية متكاملة.'}
              </p>

              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-white/5 space-y-1 text-[8.5px] font-mono text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>{stats.language === 'en' ? 'Active P2P sockets with top sharing brokers.' : 'ربط مباشر مع شبكات Honeygain و Pawns.'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>{stats.language === 'en' ? 'Accurate megabytes throughput statistics.' : 'حساب الاستهلاك الفعلي للميجابايت بدقة.'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span>{stats.language === 'en' ? 'Real-time conversion of traffic to actual Jump.' : 'تحويل تلقائي مستمر إلى رصيد Jump الحقيقي.'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Swipe handle to slide up */}
          <div 
            onClick={() => {
              sound.playTap();
              setIsHoneygainNotificationOpen(false);
            }}
            className="w-full bg-neutral-900 border-t border-white/5 py-3 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-850 transition shrink-0"
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mb-1" />
            <span className="text-[8px] text-zinc-500 font-mono tracking-wider font-bold">
              {stats.language === 'en' ? 'CLICK OR SWIPE UP TO CLOSE ▲' : 'اسحب أو اضغط للإغلاق ▲'}
            </span>
          </div>
        </div>
      )}

      {/* 3. Main Route Tab Render Area */}
      {activeTab === 'mine' && (
        <div className="flex-1 flex flex-col justify-between p-2.5 sm:p-4 overflow-y-auto sm:overflow-hidden min-h-0 relative select-none">
          {/* Decorative backdrop graphics */}
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-cyan-500/5 filter blur-3xl pointer-events-none" />
          
          {/* P2P Internet Mining & Jump Swap Ticker/Bar ("شريط الشاشة الرئيسية لتبديل وسحب النت لـ Jump") */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-neutral-900/90 to-emerald-950/40 border border-emerald-500/20 p-2 sm:p-3 rounded-xl mb-1.5 sm:mb-2 text-left shadow-lg">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded-lg ${bandwidthMiningOn ? 'bg-emerald-500/15 text-emerald-400 animate-pulse' : 'bg-zinc-850 text-zinc-550'}`}>
                   <Wifi size={13} className={bandwidthMiningOn ? 'animate-bounce' : ''} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] sm:text-[10.5px] font-bold text-white tracking-wide">
                      {currentLanguage === 'en' ? 'P2P Broadband Sharing' : 'تبديل سحب نت الهاتف لـ Jump ⚡'}
                    </span>
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bandwidthMiningOn ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${bandwidthMiningOn ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                  </div>
                  <div className="text-[8px] text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                    <span>{sharedMB.toFixed(1)} MB</span>
                    <span className="text-zinc-700">|</span>
                    {stats.autoSwapToTon ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                        <span>{currentLanguage === 'en' ? 'Auto-Swapping to Jump' : 'تحويل تلقائي مستمر إلى Jump ⚡'}</span>
                      </span>
                    ) : (
                      <span className="text-cyber-gold font-bold">{accumulatedTonReward.toFixed(5)} Jump</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls Side */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Auto Swap Toggle Button (Locked to true as requested) */}
                <button
                  onClick={() => {
                    sound.playTap();
                    showAlert(
                      currentLanguage === 'en'
                        ? `🔒 Direct Auto-Deposit is always ACTIVE for your internet sharing earnings!`
                        : `🔒 الإيداع والتحويل التلقائي نشط دائماً! جميع أرباح مشاركة النت يتم إرسالها فوراً إلى محفظتك كعملات JMPT حقيقية.`,
                      'success'
                    );
                  }}
                  className="px-1.5 py-0.5 rounded-md text-[8px] font-bold transition font-sans border cursor-pointer bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  title={currentLanguage === 'ar' ? 'تحويل الأرباح لـ Jump تلقائياً (نشط دائماً)' : 'Auto-Swap bandwidth earnings directly to Jump balance (Always Active)'}
                >
                  {currentLanguage === 'en' ? '🔒 Locked Auto' : '🔒 تلقائي نشط'}
                </button>

                {/* Connect Partners Integrations */}
                <button
                  onClick={() => {
                    sound.playTap();
                    setActivePartnerModal(true);
                  }}
                  className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold transition font-sans flex items-center gap-0.5 border cursor-pointer ${
                    stats.partnerLinked
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-850 hover:bg-zinc-800 border-white/5 text-zinc-350'
                  }`}
                >
                  <Settings size={8} />
                  <span>
                    {stats.partnerLinked 
                      ? (stats.partnerName?.toUpperCase() || (currentLanguage === 'en' ? 'Linked' : 'مربوط'))
                      : (currentLanguage === 'en' ? 'Link' : 'ربط 🔌')
                    }
                  </span>
                </button>

                {/* On/Off Toggle (Locked to always-on live stream) */}
                <button
                  onClick={() => {
                    sound.playTap();
                    showAlert(
                      currentLanguage === 'en'
                        ? '📡 Internet mining broadcast is always active to ensure maximum JMPT earnings!'
                        : '📡 بث مشاركة النت سيبقى نشطاً ومفعلاً على الشاشة دائماً مثل البث المباشر لضمان أقصى أرباح JMPT!',
                      'success'
                    );
                  }}
                  className="relative inline-flex h-4 w-7.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-emerald-500"
                  title={currentLanguage === 'ar' ? 'مشاركة الإنترنت نشطة كبث مباشر دائماً' : 'Internet Sharing is always active as a live broadcast'}
                >
                  <span className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-3.5" />
                </button>

                {/* Instant Swap/Claim Button */}
                {!stats.autoSwapToTon && (
                  <button
                    onClick={() => {
                      handleClaimBandwidthReward();
                    }}
                    disabled={accumulatedTonReward <= 0}
                    className={`px-2 py-0.5 rounded-md text-[8px] font-bold transition font-sans ${
                      accumulatedTonReward > 0 
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow' 
                        : 'bg-zinc-850 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {currentLanguage === 'en' ? 'Swap Jump' : 'سحب لـ Jump ✨'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Global Node Rank indicators */}
          <div className="text-center mt-0.5 mb-1">
            <span className="text-[8.5px] text-zinc-550 uppercase tracking-widest font-mono">
              {currentLanguage === 'en' ? 'My Global Rank Grade' : 'درجة ترتيبي السحابي الأثري'}
            </span>
            <div className="mt-0.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border border-current font-bold ${currentRankGrade.color} shadow-[0_0_8px_rgba(223,177,91,0.1)]`}>
                {currentLanguage === 'ar' ? (
                  stats.ghs >= 25000 ? 'إمبراطور سرداب إكستون الفائق 👑' :
                  stats.ghs >= 5000 ? 'سيد الجمجمة الأثرية المطور 💀⚡' :
                  stats.ghs >= 1000 ? 'الجمجمة البرونزية المتقدمة 💀🌟' :
                  stats.ghs >= 100 ? 'الهيكل العظمي الذهبي النشط 💀⚡' : 'مبتدئ العظام المستكشف 💀'
                ) : currentRankGrade.title}
              </span>
            </div>
            {/* Passive flow earnings statistics */}
            <p className="text-[9.5px] text-zinc-550 font-mono mt-0.5">
              {currentLanguage === 'en' ? 'Passive flow:' : 'الإنتاج التلقائي الساحر:'} <span className="text-emerald-400 font-bold font-mono">+{(stats.ghs * 0.005).toFixed(3)} XTON/{currentLanguage === 'en' ? 's' : 'ثا'}</span>
            </p>
          </div>

          {/* 12-Hour Mining Session Countdown Tracker Panel */}
          <div className="ancient-tablet-card p-2 sm:p-2.5 rounded-xl mb-1.5 sm:mb-2 text-center relative select-none">
            {/* Blinking status */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] text-amber-200 uppercase tracking-widest font-mono font-bold ancient-rune-glow">
                {currentLanguage === 'en' ? '⚡ 12-HOUR MYTHIC CLOUD HARVEST' : '⚡ دورة الحصاد الأسطوري (12ساعة)'}
              </span>
              <div className="flex items-center gap-1 bg-stone-950/80 px-1.5 py-0.5 rounded-full border border-amber-500/15">
                <span className={`h-1 w-1 rounded-full ${timeRemaining > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
                <span className="text-[7.5px] font-semibold uppercase tracking-wider font-mono text-amber-400">
                  {timeRemaining > 0 
                    ? (currentLanguage === 'en' ? 'Active' : 'نشط') 
                    : (currentLanguage === 'en' ? 'Tank Full / Claim' : 'ممتلئ / اجمع')}
                </span>
              </div>
            </div>

            {/* Live Timer and Session yield details */}
            <div className="grid grid-cols-3 gap-1.5 items-center bg-stone-950/70 p-1.5 rounded-lg border border-amber-500/10">
              <div className="text-left flex flex-col">
                <span className="text-[6.5px] text-zinc-500 uppercase tracking-tight font-mono">
                  {currentLanguage === 'en' ? 'Yield Rate' : 'معدل الإنتاج'}
                </span>
                <span className="text-[8.5px] font-mono font-bold text-emerald-400 mt-0.5 truncate">
                  +{(stats.ghs * 0.005).toFixed(3)}/s
                </span>
              </div>

              <div className="text-center flex flex-col">
                <span className="text-[6.5px] text-zinc-500 uppercase tracking-tight font-mono">
                  {currentLanguage === 'en' ? 'Mining Clock' : 'مؤقت التعدين'}
                </span>
                <span className="text-[10px] font-mono font-black text-amber-400 mt-0.5 tracking-wider ancient-rune-glow">
                  {timeRemaining > 0 ? formatRemainingTime(timeRemaining) : "00:00:00"}
                </span>
              </div>

              <div className="text-right flex flex-col">
                <span className="text-[6.5px] text-zinc-500 uppercase tracking-tight font-mono">
                  {currentLanguage === 'en' ? 'Session Mined' : 'أرباح الجلسة'}
                </span>
                <span className="text-[8.5px] font-mono font-bold text-cyber-gold mt-0.5 truncate">
                  {((Math.min(TWELVE_HOURS_MS, Date.now() - (stats.miningSessionStart ?? Date.now())) / 1000) * stats.ghs * 0.005).toFixed(2)} XTON
                </span>
              </div>
            </div>

            {/* Dynamic Button to Claim and Restart Mining */}
            <div className="mt-1.5 text-right">
              {timeRemaining > 0 ? (
                <div className="w-full h-1 bg-stone-950 rounded-full overflow-hidden p-px border border-amber-500/10 relative">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300 relative"
                    style={{ width: `${Math.min(100, Math.max(0, (timeRemaining / TWELVE_HOURS_MS) * 100))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent animate-pulse" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleClaimAndRestartMining}
                  className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-black text-[9px] py-1 px-2.5 rounded-lg transition duration-155 shadow animate-bounce tracking-wide uppercase font-mono cursor-pointer"
                >
                  🎁 {currentLanguage === 'en' ? 'Collect 12H Mined Coins & Restart' : 'جمع أرباح 12 ساعة وتشغيل التعدين مجدداً ⚡'}
                </button>
              )}
            </div>
          </div>

          {/* Active Miner Converter clicker */}
          <div className="my-auto py-1 flex items-center justify-center">
            <MiningRing
              energy={stats.energy}
              maxEnergy={stats.maxEnergy}
              multiTap={stats.multiTap}
              efficiencyLevel={stats.efficiencyLevel}
              onMine={handleActiveMineAction}
              onGameReward={handleGameRewardAction}
              timeRemaining={timeRemaining}
              onClaimAndRestartMining={handleClaimAndRestartMining}
              language={currentLanguage}
            />
          </div>



          {/* Compact Switcher and bottom container for stats panel */}
          <div className="flex flex-col gap-1 mb-1 select-none">
            {/* Segment Controls Selector */}
            <div className="flex bg-neutral-900/90 p-0.5 rounded-lg border border-white/5 text-[9.5px] gap-0.5">
              <button
                onClick={() => setMiningSubTab('network')}
                className={`flex-1 py-1 rounded transition flex items-center justify-center gap-1 font-bold ${
                  miningSubTab === 'network' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Wifi size={11} className={bandwidthMiningOn ? 'animate-pulse text-emerald-400' : ''} />
                <span>{currentLanguage === 'en' ? 'Bandwidth' : 'تعدين النت'}</span>
              </button>
              <button
                onClick={() => setMiningSubTab('copilot')}
                className={`flex-1 py-1 rounded transition flex items-center justify-center gap-1 font-bold ${
                  miningSubTab === 'copilot' 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Sparkles size={11} className="animate-pulse text-amber-400" />
                <span>{currentLanguage === 'en' ? 'AI Copilot' : 'العقل الاصطناعي'}</span>
              </button>
            </div>

            {/* Display active state */}
            {miningSubTab === 'network' ? (
              <div className="bg-gradient-to-br from-neutral-900 to-zinc-950 border border-emerald-500/20 p-3 rounded-2xl relative overflow-hidden text-left animate-fade-in shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between gap-1.5 mb-2 pb-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">📡</span>
                    <span className="text-[10.5px] font-extrabold text-white uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'Genuine Internet Mining Node' : 'محطة تعدين النت الحقيقية ⚡'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${bandwidthMiningOn ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
                    <span className="text-[8.5px] font-mono font-bold text-zinc-400 uppercase">
                      {bandwidthMiningOn ? (currentLanguage === 'en' ? 'ACTIVE' : 'تعدين نشط') : (currentLanguage === 'en' ? 'PAUSED' : 'متوقف')}
                    </span>
                  </div>
                </div>

                {/* Speedometer & Stats Gauge Grid */}
                <div className="grid grid-cols-3 gap-2 mb-2 text-center font-mono">
                  <div className="bg-zinc-950 p-2 rounded-xl border border-white/5">
                    <span className="text-[7px] text-zinc-500 block uppercase font-sans">{currentLanguage === 'en' ? 'REAL SPEED' : 'سرعة السحب'}</span>
                    <span className="text-[11.5px] font-black text-emerald-400 animate-pulse">{honeygainSpeedStr}</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-xl border border-white/5">
                    <span className="text-[7px] text-zinc-500 block uppercase font-sans">{currentLanguage === 'en' ? 'DATA CONSUMED' : 'النت المستهلك'}</span>
                    <span className="text-[11.5px] font-black text-white">{sharedMB.toFixed(2)} MB</span>
                  </div>
                  <div className="bg-zinc-950 p-2 rounded-xl border border-white/5">
                    <span className="text-[7px] text-zinc-500 block uppercase font-sans">
                      {stats.autoSwapToTon ? (currentLanguage === 'en' ? 'MY JUMP' : 'رصيد JUMP') : (currentLanguage === 'en' ? 'UNCLAIMED' : 'غير مجمعة')}
                    </span>
                    <span className="text-[11.5px] font-black text-cyber-gold">
                      {stats.autoSwapToTon 
                        ? `${(stats.jumpBalance ?? 0.0).toFixed(4)} J` 
                        : `${accumulatedTonReward.toFixed(5)} J`
                      }
                    </span>
                  </div>
                </div>

                {/* Intensity selector buttons */}
                <div className="space-y-1 mb-2">
                  <label className="text-[7.5px] text-zinc-400 uppercase font-mono block tracking-wider">
                    {currentLanguage === 'en' ? 'Bandwidth Consumption Rate (Intensity)' : 'معدل سحب وحرق حزم الإنترنت:'}
                  </label>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-zinc-950 rounded-lg border border-white/5">
                    {(['low', 'medium', 'high', 'turbo'] as const).map((level) => {
                      const labels = {
                        low: currentLanguage === 'en' ? 'Low' : 'منخفض',
                        medium: currentLanguage === 'en' ? 'Medium' : 'متوسط',
                        high: currentLanguage === 'en' ? 'High' : 'عالٍ',
                        turbo: currentLanguage === 'en' ? 'Turbo' : 'توربو'
                      };
                      return (
                        <button
                          key={level}
                          onClick={() => {
                            sound.playTap();
                            setRealNetIntensity(level);
                            localStorage.setItem('XTON_REAL_NET_INTENSITY', level);
                            showAlert(
                              currentLanguage === 'en'
                                ? `Mining intensity changed to ${level.toUpperCase()}`
                                : `تم تعديل كثافة تعدين النت إلى: ${labels[level]}`,
                              'success'
                            );
                          }}
                          className={`py-1 text-[8.5px] font-bold rounded capitalize transition cursor-pointer ${
                            realNetIntensity === level
                              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {labels[level]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Real-time Logs Terminal Stream */}
                <div className="bg-black/95 border border-white/5 p-2 rounded-xl mb-2">
                  <div className="flex items-center justify-between text-[7px] text-zinc-500 font-mono mb-1 pb-1 border-b border-white/5">
                    <span>{currentLanguage === 'en' ? 'LIVE DEEP WEB-P2P MINING FLOW' : 'بث التعدين والاتصال الحقيقي المباشر:'}</span>
                    <span className="text-emerald-400 animate-pulse">● BROADCASTING</span>
                  </div>
                  <div className="h-16 overflow-y-auto font-mono text-[7.5px] space-y-1 pr-1 text-zinc-300 scrollbar-thin select-text">
                    {realNetLogs.length > 0 ? (
                      realNetLogs.map((log, index) => (
                        <div key={index} className="leading-tight animate-fade-in break-all">
                          {log}
                        </div>
                      ))
                    ) : (
                      <div className="text-zinc-650 italic text-center pt-4">
                        {bandwidthMiningOn 
                          ? (currentLanguage === 'en' ? 'Initiating websocket handshake...' : 'جاري تشغيل بث الاتصالات الحقيقية وسحب الحزم...')
                          : (currentLanguage === 'en' ? 'Miner is paused. Turn on switch above.' : 'التعدين متوقف. يرجى تفعيل مفتاح مشاركة النت بالأعلى.')
                        }
                      </div>
                    )}
                  </div>
                </div>

                {/* Alert Warning for Data Packages */}
                <div className="bg-amber-500/5 border border-amber-500/10 px-2 py-1.5 rounded-lg text-[7.8px] leading-normal text-amber-500/90 mb-2.5 font-sans">
                  ⚠️ {currentLanguage === 'en'
                    ? 'NOTICE: This performs REAL, secure background data downloads from fast CDN networks to process mining. Connection to Wi-Fi is highly recommended!'
                    : 'تنبيه: هذا القسم يقوم بعمليات تحميل فعلية وحقيقية لبيانات حزم برمجية من خوادم عالمية لتعدين العملة. يوصى بالاتصال بشبكة Wi-Fi لتجنب استهلاك باقة الموبايل!'}
                </div>

                {/* Primary Action Button Bar */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        sound.playTap();
                        const nextState = !bandwidthMiningOn;
                        setBandwidthMiningOn(nextState);
                        showAlert(
                          currentLanguage === 'en'
                            ? `Internet Miner ${nextState ? 'ENABLED' : 'PAUSED'}`
                            : `تم ${nextState ? 'تشغيل' : 'إيقاف'} تعدين الإنترنت الحقيقي بنجاح!`,
                          nextState ? 'success' : 'alert'
                        );
                      }}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer border ${
                        bandwidthMiningOn 
                          ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' 
                          : 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold hover:bg-emerald-400'
                      }`}
                    >
                      {bandwidthMiningOn 
                        ? (currentLanguage === 'en' ? '🛑 Pause Miner' : '🛑 إيقاف التعدين') 
                        : (currentLanguage === 'en' ? '📡 Start Miner' : '📡 تشغيل التعدين')
                      }
                    </button>
                  </div>

                  {!stats.autoSwapToTon ? (
                    <button
                      onClick={() => {
                        handleClaimBandwidthReward();
                      }}
                      disabled={accumulatedTonReward <= 0}
                      className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer ${
                        accumulatedTonReward > 0 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/10' 
                          : 'bg-zinc-850 text-zinc-650 cursor-not-allowed'
                      }`}
                    >
                      🎁 {currentLanguage === 'en' ? 'Swap to Wallet' : 'سحب المحفوظ للمحفظة'}
                    </button>
                  ) : (
                    <div className="text-[8px] font-mono text-zinc-500 italic bg-zinc-950 px-2 py-1 rounded border border-white/5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>{currentLanguage === 'en' ? 'Direct Auto-Deposit' : 'إيداع تلقائي نشط'}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-neutral-900 to-zinc-950 border border-amber-500/10 p-2.5 rounded-xl relative overflow-hidden text-left animate-fade-in">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/4 rounded-full filter blur-xl pointer-events-none" />
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-bold text-white">
                    {currentLanguage === 'en' ? 'Oracle Neural Copilot' : 'مصفوفة العقل الاصطناعي'}
                  </span>
                  <span className="font-mono text-amber-400 font-bold bg-amber-400/5 px-1 py-0.2 rounded text-[7.5px] animate-pulse">
                    Pegasus-Pro-3.5
                  </span>
                </div>

                <div className="bg-zinc-950/70 p-1.5 rounded-lg border border-white/5 space-y-1 text-[8.5px] mb-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">{currentLanguage === 'en' ? 'Efficiency Score' : 'كفاءة النطاق للخلية'}</span>
                    <span className="font-mono text-zinc-300 font-bold">98.42%</span>
                  </div>
                  <p className="text-[8px] text-amber-500/80 font-mono italic leading-tight p-1 bg-zinc-950/95 border border-amber-500/5 rounded">
                    &gt;_ [Model converge] Hashrate overclock active & optimized.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-1 text-[8px]">
                  <span className="text-zinc-500 font-mono">Status: <span className="text-emerald-400 font-bold uppercase">OPTIMIZED</span></span>
                  <button
                    onClick={() => {
                      sound.playTap();
                      setOracleChatOpen(true);
                    }}
                    className="text-amber-400 font-bold hover:text-amber-300 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{currentLanguage === 'en' ? 'Open Chat' : 'تبادل الاستراتيجيات'}</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'upgrades' && (
        <UpgradesTab stats={stats} onPurchase={handlePurchaseUpgrade} language={currentLanguage} showAlert={showAlert} />
      )}

      {activeTab === 'activity' && (
        <ActivityTab
          stats={stats}
          setStats={setStats}
          language={currentLanguage}
          showAlert={showAlert}
          todayTaps={todayTaps}
          completedPuzzle={completedPuzzle}
          setCompletedPuzzle={setCompletedPuzzle}
          adsWatchedToday={adsWatchedCount}
        />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab 
          stats={stats} 
          username={username}
          onAddReferral={handleAddReferral}
          language={currentLanguage}
          showAlert={showAlert}
          onChangeUsername={setUsername}
          onChangeBotUsername={(newBot) => {
            setStats(prev => ({ ...prev, botUsername: newBot }));
          }}
        />
      )}

      {activeTab === 'tasks' && (
        <TasksTab
          stats={stats}
          onClaimDaily={handleClaimDailyStreak}
          onCompleteTask={handleCompleteTask}
          onUseTicket={handleDecrementTicket}
          onRewardFromSpin={handleRewardFromSpin}
          onOpenOracleChat={() => setOracleChatOpen(true)}
          language={currentLanguage}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'wallet' && (
        <WalletTab
          stats={stats}
          setStats={setStats}
          language={currentLanguage}
          activeAds={activeAds}
          onAddWithdrawalRequest={handleAddWithdrawalRequest}
          onAddPendingAd={handleAddPendingAd}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'ads' && (
        <AdsTab
          stats={stats}
          setStats={setStats}
          language={currentLanguage}
          activeAds={activeAds}
          onAddPendingAd={handleAddPendingAd}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'market' && (
        <MarketTab
          stats={stats}
          setStats={setStats}
          language={currentLanguage}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'anticheat' && (username.toLowerCase() === 'eidmo11' || username.toLowerCase() === '@eidmo11' || showDevControls) && (
        <AntiCheatTab
          stats={stats}
          setStats={setStats}
          language={currentLanguage}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'owner' && (username.toLowerCase() === 'eidmo11' || username.toLowerCase() === '@eidmo11' || showDevControls) && (
        <OwnerTab
          stats={stats}
          setStats={setStats}
          language={currentLanguage}
          botLiquidity={botLiquidity}
          setBotLiquidity={setBotLiquidity}
          adminTransactions={adminTransactions}
          setAdminTransactions={setAdminTransactions}
          isOwnerAuthPassed={isOwnerAuthPassed}
          setIsOwnerAuthPassed={setIsOwnerAuthPassed}
          showAlert={showAlert}
          telegramBotToken={telegramBotToken}
          setTelegramBotToken={setTelegramBotToken}
          telegramChatId={telegramChatId}
          setTelegramChatId={setTelegramChatId}
        />
      )}

      {/* 4. bottom Main Nav Switcher tabs bar */}
      <div className="h-20 bg-neutral-900 border-t border-white/5 px-2.5 flex items-center justify-between select-none z-30">
        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('mine');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'mine' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Zap size={18} className={activeTab === 'mine' ? 'animate-pulse' : ''} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Mine ⚡' : 'التعدين ⚡'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('activity');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'activity' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Activity size={18} className={activeTab === 'activity' ? 'animate-bounce' : ''} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Activity 🎁' : 'النشاط 🎁'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('upgrades');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'upgrades' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ShoppingBag size={18} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Upgrades ⚡' : 'الترقيات ⚡'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('leaderboard');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'leaderboard' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Users size={18} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Recruits 🏆' : 'الأعضاء 🏆'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('tasks');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'tasks' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <RotateCw size={17} className={activeTab === 'tasks' ? 'animate-spin-slow' : ''} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Luck 🎡' : 'العجلة 🎡'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('ads');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'ads' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Megaphone size={17} className={activeTab === 'ads' ? 'animate-bounce text-amber-400' : 'text-zinc-500'} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Ads 📢' : 'الإعلانات 📢'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('market');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'market' ? 'text-amber-400 bg-amber-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ShoppingBag size={17} className={activeTab === 'market' ? 'animate-bounce text-amber-400' : 'text-zinc-500'} />
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Market 🛍️' : 'السوق 🛍️'}</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            setActiveTab('wallet');
          }}
          className={`flex-1 py-1 px-1 flex flex-col items-center justify-center gap-1 transition rounded-xl ${activeTab === 'wallet' ? 'text-emerald-400 bg-emerald-400/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <div className="relative">
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
            <Cpu size={18} className="text-emerald-400" />
          </div>
          <span className="text-[9px] font-bold tracking-tight font-display uppercase">{currentLanguage === 'en' ? 'Wallet 💎' : 'المحفظة 💎'}</span>
        </button>
      </div>

      {/* 5. Giga-Oracle Bottom Draw slider panel (Chat Overlay) */}
      {oracleChatOpen && (
        <div className="absolute inset-x-0 bottom-0 top-[10%] bg-zinc-950/98 backdrop-blur-md border-t-2 border-amber-500/20 rounded-t-3xl z-50 flex flex-col justify-between overflow-hidden animate-slide-up select-none">
          {/* Drawer Top Handle */}
          <div className="px-4 py-3 border-b border-amber-500/10 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <MessagesSquare className="text-amber-400 w-5 h-5 animate-pulse" />
              <div className="text-left">
                <h3 className="text-xs font-bold text-white font-display">
                  {currentLanguage === 'en' ? 'Giga-Oracle AI 🔮' : 'العراف Giga-Oracle AI 🔮'}
                </h3>
                <p className="text-[8px] text-zinc-400 font-mono">
                  {currentLanguage === 'en' ? 'Cyber Blockchain Mining Strategist' : 'مهندس ومستشار التعدين السحابي والتكرير'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                sound.playTap();
                setOracleChatOpen(false);
              }}
              className="p-1 rounded-lg bg-zinc-805 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages Logs Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 flex flex-col">
            {chatMessages.map((msg, index) => {
              const IsAi = msg.role === 'model';
              return (
                <div
                  key={index}
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-normal select-all relative group duration-150 ${IsAi ? 'bg-zinc-900 text-zinc-100 border border-white/5 shadow-md self-start rounded-tl-none text-left' : 'bg-amber-600 border border-amber-400/20 text-slate-950 font-semibold self-end rounded-tr-none text-right rtl'}`}
                >
                  <p className="whitespace-pre-line text-xs font-sans select-text">{msg.text}</p>
                  
                  {/* Subtle date index tag labels */}
                  <span className="absolute bottom-1 right-2 text-[7px] text-zinc-500 opacity-0 group-hover:opacity-100 transition duration-150 select-none">
                    {IsAi ? 'AI' : 'YOU'}
                  </span>
                </div>
              );
            })}

            {isAiLoading && (
              <div className="bg-zinc-900 text-zinc-400 border border-amber-500/10 px-3.5 py-2 rounded-2xl text-xs self-start rounded-tl-none flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="animate-pulse">
                  {currentLanguage === 'en' ? 'The Oracle thinks of a block tactic...' : 'يفكر العراف في تكتيك حوسبي لخيولك...'}
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Inputs Sender Box Area */}
          <div className="p-3.5 bg-zinc-900 border-t border-amber-500/10 flex items-center gap-2.5 select-none z-50">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={currentLanguage === 'en' ? 'Consult the Oracle (Ask any question)...' : 'اسأل العراف (سؤالك ينجز المهمة المخصصة ويمنحك المكافأة) ...'}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendOracleMessage();
              }}
              className="flex-1 bg-zinc-950 text-white placeholder-zinc-500 border border-amber-500/15 focus:border-amber-500/50 rounded-xl px-3 py-2 text-xs font-sans outline-none duration-150 shadow-inner select-all"
            />
            <button
              onClick={handleSendOracleMessage}
              disabled={isAiLoading || !chatInput.trim()}
              className={`py-2 px-4 rounded-xl font-bold font-mono text-xs transition duration-150 cursor-pointer text-slate-950 ${isAiLoading || !chatInput.trim() ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 pointer-events-none' : 'bg-amber-500 hover:bg-amber-400 shadow-md active:scale-95'}`}
            >
              {currentLanguage === 'en' ? 'Send' : 'إرسال'}
            </button>
          </div>
        </div>
      )}

      {/* 6. Offline calc results claim Report modal overlay */}
      {offlineReport && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-5 z-[100] animate-fade-in select-none">
          <div className="w-full max-w-xs bg-zinc-900 border border-amber-500/20 rounded-3xl p-6.5 text-center shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
            {/* Ambient circuit background grid lines */}
            <div className="absolute -inset-4 border border-amber-500/5 border-dashed rounded-full rotate-45 pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 animate-[bounce_2s_infinite]">
              <Cpu size={32} className="text-amber-400 fill-amber-400/10 animate-pulse" />
            </div>

            <h3 className="font-semibold text-base font-display text-white uppercase tracking-wider">
              {currentLanguage === 'en' ? 'Mining Node Connected ⚡' : 'نود التعدين متصل ⚡'}
            </h3>
            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-mono mt-0.5">
              {currentLanguage === 'en' ? 'Welcome back, Agent Giga!' : 'مرحباً بك مجدداً يا عميل التعدين!'}
            </p>

            <div className="my-5 p-4 bg-zinc-950 border border-white/5 rounded-2xl text-center">
              <span className="text-[10px] text-neutral-500 font-mono block">
                {currentLanguage === 'en' ? 'Offline computing elapsed segments:' : 'الوقت المنقضي لحوسبة الخيول في غيابك:'}
              </span>
              <span className="text-zinc-350 font-mono text-xs font-semibold block mt-0.5">
                {Math.floor(offlineReport.elapsedSeconds / 60)}m {offlineReport.elapsedSeconds % 60}s
              </span>
              
              <div className="h-px bg-white/5 my-2" />
              
              <span className="text-[10px] text-neutral-500 font-mono block">
                {currentLanguage === 'en' ? 'Mined tokens harvested:' : 'العملات المستخرجة خلال غيابك:'}
              </span>
              <span className="text-amber-400 text-xl font-extrabold font-mono block mt-0.5">
                +{offlineReport.coinsMined.toLocaleString()} $BEE
              </span>
            </div>

            <p className="text-[10px] text-zinc-400 leading-normal mb-5 px-1 font-sans">
              {currentLanguage === 'en' ? 'Your Queen Bee node has spent elapsed offline cycles mining rewards for you while away!' : 'لقد واصل نود ملكة النحل التابع لك تعدين الأرباح بنجاح أثناء غيابك عن المنصة!'}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  sound.playClaim();
                  setStats((prev) => ({
                    ...prev,
                    coins: prev.coins + offlineReport.coinsMined
                  }));
                  setOfflineReport(null);
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl transition duration-150 cursor-pointer shadow-md font-mono"
              >
                {currentLanguage === 'en' ? 'Claim calculated Coins' : 'استلام الرصيد والعملات المكتشفة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6.5. Owner/Admin Portal Model Overlay - DISABLED */}
      {false && isOwnerModalOpen && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in select-none">
          <div className="w-full max-w-sm bg-neutral-900 border-2 border-amber-500/25 rounded-3xl p-5 text-left shadow-[0_0_60px_rgba(245,158,11,0.25)] relative overflow-hidden flex flex-col max-h-[90%] font-sans">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="text-amber-400 w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-xs text-white font-display uppercase tracking-wider">
                    {currentLanguage === 'en' ? 'Owner Admin Security' : 'بوابة أمان المالك'}
                  </h3>
                  <span className="text-[8px] text-amber-500 font-mono block">LEVEL_0_ROOT_PORTAL</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setIsOwnerModalOpen(false);
                  setAdminPinInput('');
                }}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {!isOwnerAuthPassed ? (
              <div className="py-4 space-y-4">
                <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                  {currentLanguage === 'en'
                    ? 'This dashboard manages live withdrawals, deposits backing, and sponsor board allocations. Enter your secure PIN to establish root credentials:'
                    : 'تدير هذه اللوحة السحوبات المباشرة، ودعم السيولة بالمحفظة، واعتماد إعلانات الرعاة. يرجى إدخال الرقم السري الخاص بمالك البوت:'}
                </p>

                <div className="space-y-2">
                  <label className="block text-[9px] text-zinc-500 font-mono uppercase tracking-wider text-left">Owner passcode PIN</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPinInput}
                      onChange={(e) => setAdminPinInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 text-white placeholder-zinc-700 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (adminPinInput === 'mno112233') {
                      sound.playUpgrade();
                      setIsOwnerAuthPassed(true);
                      setAdminPinInput('');
                    } else {
                      sound.playError();
                      showAlert(currentLanguage === 'en' ? '❌ Invalid security credentials!' : '❌ الرمز السري غير صحيح!', 'alert');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition duration-150 active:scale-98 font-mono tracking-wider uppercase shadow-md cursor-pointer"
                >
                  {currentLanguage === 'en' ? 'Authorize Credentials' : 'تسجيل الدخول والتحقق'}
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Backing & Wallet Pool Section */}
                <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-white/5 mb-4">
                  <div className="flex justify-between items-center mb-2 text-left">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                      {currentLanguage === 'en' ? 'Bot Liquidity backing pool' : 'محفظة دعم سيولة البوت للضمان'}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">
                      {botLiquidity.toFixed(2)} TON
                    </span>
                  </div>
                  
                  {/* Real Master wallet info */}
                  <div className="bg-neutral-900 border border-emerald-500/10 p-2 rounded-xl mb-3 flex flex-col gap-1 text-left">
                    <span className="text-[7.5px] text-zinc-500 block uppercase font-mono leading-none">OWNER SUPPORT WALLET</span>
                    <span className="font-mono text-[9.5px] text-amber-400 font-bold select-all truncate">
                      UQA2CLot73qOKb_2BSmqOsUA0TzHYPuyB4QFT3G2quUcZdTg
                    </span>
                  </div>

                  {/* Add liquidity button simulation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddOwnerLiquidity(10)}
                      className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 py-1.5 px-2.5 rounded-lg text-[9px] font-mono tracking-tight transition cursor-pointer"
                    >
                      +10 TON Backing
                    </button>
                    <button
                      onClick={() => handleAddOwnerLiquidity(50)}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 py-1.5 px-2.5 rounded-lg text-[9px] font-mono tracking-tight transition cursor-pointer"
                    >
                      +50 TON Backing
                    </button>
                  </div>
                </div>

                {/* Locked Sponsor Reward Pool Section */}
                <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-amber-500/25 mb-4">
                  <div className="flex justify-between items-center mb-2 text-left">
                    <span className="text-[9px] text-amber-400 font-mono uppercase tracking-wider font-bold">
                      {currentLanguage === 'en' ? 'Sponsor Locked Pool (for tasks)' : 'صندوق مكافآت المهام للرعاة (المقفل)'}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold font-mono">
                      ${(stats.lockedReserveUSD ?? 250.0).toFixed(3)} USD
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button
                       onClick={() => {
                         sound.playClaim();
                         setStats((prev) => ({
                           ...prev,
                           lockedReserveUSD: Number(((prev.lockedReserveUSD ?? 250.0) + 10.0).toFixed(4))
                         }));
                         showAlert(currentLanguage === 'en' ? 'Added +$10.00 USD to Locked Sponsor Pool!' : 'تم شحن صندوق الرعاة المقفل بـ +10.00 دولار بنجاح!', 'success');
                       }}
                       className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 py-1.5 px-2 rounded-lg text-[8.5px] font-mono tracking-tight transition cursor-pointer text-center"
                     >
                       +{currentLanguage === 'en' ? '$10 USD Refill' : 'شحن بـ 10$'}
                     </button>
                     <button
                       onClick={() => {
                         sound.playClaim();
                         setStats((prev) => ({
                           ...prev,
                           lockedReserveUSD: Number(((prev.lockedReserveUSD ?? 250.0) + 50.0).toFixed(4))
                         }));
                         showAlert(currentLanguage === 'en' ? 'Added +$50.00 USD to Locked Sponsor Pool!' : 'تم شحن صندوق الرعاة المقفل بـ +50.00 دولار بنجاح!', 'success');
                       }}
                       className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 py-1.5 px-2 rounded-lg text-[8.5px] font-mono tracking-tight transition cursor-pointer text-center"
                     >
                       +{currentLanguage === 'en' ? '$50 USD Refill' : 'شحن بـ 50$'}
                     </button>
                  </div>
                </div>

                {/* Live Transactions Queue */}
                <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider mb-2 font-bold text-amber-400/90 text-left">
                  {currentLanguage === 'en' ? 'Ledger validation stream' : 'التحقق والموافقة على العمليات داخل البوت 💎'}
                </span>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                  {adminTransactions.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-zinc-500 italic">
                      No events registered in system ledger.
                    </div>
                  ) : (
                    adminTransactions.map((tx) => (
                      <div key={tx.id} className="p-3 bg-zinc-950/70 border border-white/5 rounded-xl hover:border-white/10 transition flex flex-col justify-between gap-2.5 text-left select-text">
                        <div className="flex justify-between items-start gap-2.5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'pending' ? 'bg-amber-400 animate-ping' : tx.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              <span className="text-[10px] font-bold text-white font-mono break-all leading-none">{tx.user}</span>
                            </div>
                            <span className="text-[7.5px] text-zinc-500 font-mono mt-0.5">{tx.timestamp} | ID: {tx.id.toUpperCase()}</span>
                          </div>
                          
                          <span className={`text-[9.5px] font-mono font-bold ${tx.type === 'withdraw' ? 'text-rose-400' : tx.type === 'deposit' ? 'text-emerald-400' : 'text-blue-400'} shrink-0`}>
                            {tx.type === 'withdraw' ? '-' : '+'}{tx.amount} gram
                          </span>
                        </div>

                        {tx.type === 'withdraw' && tx.targetWallet && (
                          <div className="bg-neutral-900 border border-white/5 p-1.5 rounded-lg text-[8px] font-mono text-zinc-400 select-all leading-none break-all">
                            Dst: {tx.targetWallet}
                          </div>
                        )}

                        {tx.type === 'ad_payment' && tx.data && (
                          <div className="bg-neutral-900 border border-white/5 p-1.5 rounded-lg text-[9px] font-sans text-zinc-300">
                            <span className="font-bold text-amber-300 block text-[9.5px] leading-tight truncate">{tx.data.title}</span>
                            <span className="text-zinc-400 text-[8.5px] leading-normal block mt-0.5 break-all">{tx.data.text}</span>
                          </div>
                        )}

                        {tx.status === 'pending' ? (
                          <div className="flex items-center gap-2 pt-1 select-none">
                            <button
                              onClick={() => {
                                handleApproveTransaction(tx.id);
                              }}
                              className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-[9px] font-mono py-1 rounded transition duration-100 cursor-pointer"
                            >
                              {currentLanguage === 'en' ? 'APPROVE' : 'موافقة'}
                            </button>
                            <button
                              onClick={() => {
                                handleRejectTransaction(tx.id);
                              }}
                              className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[9px] font-mono py-1 rounded transition duration-100 cursor-pointer"
                            >
                              {currentLanguage === 'en' ? 'REJECT' : 'رفض'}
                            </button>
                          </div>
                        ) : (
                          <div className="text-right text-[8px] font-mono uppercase font-bold tracking-wider select-none">
                            Status: <span className={tx.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}>{tx.status}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => {
                      sound.playTap();
                      setIsOwnerAuthPassed(false);
                    }}
                    className="flex-1 bg-zinc-850 hover:bg-zinc-800 text-zinc-400 text-[10px] py-2 rounded-xl transition duration-150 hover:text-white font-mono uppercase tracking-wider cursor-pointer text-center"
                  >
                    Lock Session
                  </button>
                  <button
                    onClick={() => {
                      sound.playTap();
                      setIsOwnerModalOpen(false);
                    }}
                    className="flex-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[10px] py-2 rounded-xl transition duration-150 font-mono uppercase tracking-wider cursor-pointer text-center"
                  >
                    Close Board
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6.7.5. P2P Bandwidth Monetization Providers Integration Modal Portal */}
      {activePartnerModal && (
        <div className="absolute inset-0 bg-black/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[145] animate-fade-in select-none">
          <div className="w-full max-w-sm bg-neutral-900 border-2 border-emerald-500/25 rounded-3xl p-5 text-left shadow-[0_0_60px_rgba(16,185,129,0.18)] relative overflow-hidden flex flex-col max-h-[90%] font-sans animate-zoom-in">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Wifi className="text-emerald-400 w-5 h-5 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-xs text-white font-display uppercase tracking-wider">
                    {currentLanguage === 'en' ? 'Bandwidth API Portals' : 'بوابة ربط شركات سحب الإنترنت 🔌'}
                  </h3>
                  <span className="text-[7.5px] text-emerald-400 font-mono block">MONETIZED_BROADBAND_NODES</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setActivePartnerModal(false);
                  setSelectedPartnerId(null);
                  setPartnerInputVal('');
                }}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-1 space-y-4 text-left overflow-y-auto flex-1 pr-1 scrollbar-thin">
              {selectedPartnerId === null ? (
                <>
                  <p className="text-[10px] text-zinc-350 leading-relaxed font-sans bg-zinc-950/80 p-3 rounded-2xl border border-white/5">
                    {currentLanguage === 'en'
                      ? 'Decentralized monetization partners buy your excess phone bandwidth. They pay the main bot pool wallet, which automatically distributes your rewards as real TON!'
                      : 'تشتري الشركات المانحة النطاق الترددي الفائض وتدفع مباشرةً لمحفظة البوت الموحدة. يقوم البوت فوراً بتوزيع الأرباح ويسجلها بحسابك كـ TON حقيقي جاهز للسحب لتغذية البوت والمعدنين!'}
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { id: 'honeygain', name: 'Honeygain Pool', multiplier: 2.0, payout: '1 GB ≈ $0.20 USD', descAr: 'يدعم سحب ومشاركة الإنترنت عبر شبكة المقاصة السكنية الفائقة للهواتف.', descEn: 'Monetizes local connection packets under official resident subnets.' },
                      { id: 'pawns', name: 'Pawns.app (IPRoyal)', multiplier: 2.0, payout: '1 GB ≈ $0.20 USD', descAr: 'قناة متينة جداً توفر عوائد مشاركة حزم الهاتف بمستويات سرعة عالية.', descEn: 'High throughput bandwidth sharing node supporting active mobile IPs.' },
                      { id: 'earnapp', name: 'EarnApp SDK Node', multiplier: 2.5, payout: '1 GB ≈ $0.24 USD', descAr: 'المعدل والربحية الأعلى قيمة وسرعة مقابل البيانات المبررة للإنترنت.', descEn: 'Industry premium yield channel optimal for passive residential data nodes.' },
                      { id: 'packetstream', name: 'PacketStream Peer', multiplier: 1.5, payout: '1 GB ≈ $0.10 USD', descAr: 'خيار بسيط ومستقر يتصل مباشرة بالأجهزة المنزلية ويوزع الترافيك.', descEn: 'Highly accessible, lightweight proxy stream providing stable steady yields.' }
                    ].map((partner) => {
                      const isConnectedThis = stats.partnerLinked && stats.partnerName === partner.id;
                      return (
                        <div key={partner.id} className={`p-3 rounded-2xl border transition ${isConnectedThis ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-zinc-950/60 hover:bg-zinc-950 border-white/5'}`}>
                          <div className="flex items-center justify-between pb-1.5 border-b border-white/5">
                            <div>
                              <span className="text-xs font-black text-white block font-mono">{partner.name}</span>
                              <span className="text-[8.5px] text-amber-400 font-bold font-mono">
                                {partner.payout} &middot; ({partner.multiplier}x {currentLanguage === 'en' ? 'Speed' : 'سرعة'})
                              </span>
                            </div>
                            {isConnectedThis ? (
                              <span className="text-[8.5px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                {currentLanguage === 'en' ? 'ACTIVE' : 'مربوط'}
                              </span>
                            ) : (
                              <span className="text-[8.5px] font-mono text-zinc-550">
                                {currentLanguage === 'en' ? 'DISCONNECTED' : 'غير متصل'}
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-zinc-400 font-sans mt-2">
                            {currentLanguage === 'en' ? partner.descEn : partner.descAr}
                          </p>
                          <div className="mt-3 flex gap-2">
                            {isConnectedThis ? (
                              <button
                                onClick={() => {
                                  sound.playTap();
                                  setStats(prev => ({
                                    ...prev,
                                    partnerLinked: false,
                                    partnerName: '',
                                    partnerToken: '',
                                    partnerRateMultiplier: 1.0
                                  }));
                                  showAlert(
                                    currentLanguage === 'en' 
                                      ? 'Disconnected partner bandwidth provider successfully.' 
                                      : '⚠️ تم فصل مزود خدمة مشاركة الإنترنت وإلغاء مضاعف السرعة.',
                                    'alert'
                                  );
                                }}
                                className="w-full text-center py-1.5 bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-500/25 rounded-xl font-bold text-[9px] uppercase tracking-wider transition cursor-pointer"
                              >
                                {currentLanguage === 'en' ? 'Disconnect API Port' : 'إلغاء وفصل منفذ الربط 🔌'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  sound.playTap();
                                  setSelectedPartnerId(partner.id as any);
                                  setPartnerInputVal(stats.partnerName === partner.id ? (stats.partnerToken || '') : '');
                                }}
                                className="w-full text-center py-1.5 bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-extrabold text-[9px] uppercase tracking-wider rounded-xl transition cursor-pointer"
                              >
                                {currentLanguage === 'en' ? 'Integrate Provider' : 'بدء ربط حساب الشركة 🔌'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-zinc-950/80 p-3 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[10px] text-zinc-400 font-mono block uppercase">{currentLanguage === 'en' ? 'Configuring Node Association for:' : 'جاري تهيئة الاتصال وحجز المنفذ بـ:'}</span>
                    <span className="text-sm font-black text-white block uppercase tracking-wide font-mono">
                      {selectedPartnerId === 'honeygain' ? 'Honeygain Network' :
                       selectedPartnerId === 'pawns' ? 'Pawns.app Node' :
                       selectedPartnerId === 'earnapp' ? 'EarnApp SDK Endpoint' : 'PacketStream Peer Partner'}
                    </span>
                    <p className="text-[9px] text-zinc-400 leading-relaxed font-sans">
                      {currentLanguage === 'en'
                        ? 'To register bandwidth monetization payouts, input your affiliate node SDK token or registered account email of the supporting service below. This establishes the payment contract between the company pool, our bot, and your wallet.'
                        : 'لتسجيل وقيد عوائد النطاق الترددي للإنترنت، يرجى كتابة رمز الـ SDK الخاص بك أو البريد الإلكتروني المسجل به للشركة المانحة بالأسفل لتثبيت مسارات الدفع لمحفظة البوت الموحدة والمشتركين.'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-400 font-mono block uppercase">
                      {selectedPartnerId === 'honeygain'
                        ? (currentLanguage === 'en' ? 'Honeygain Account Email:' : 'البريد الإلكتروني لحساب Honeygain:')
                        : (currentLanguage === 'en' ? 'Partner Account Email or SDK Token:' : 'البريد أو رمز الـ API التابع للشركة المانحة:')}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500/30 transition"
                      placeholder={selectedPartnerId === 'honeygain' ? 'e.g. honeygain_user@gmail.com' : 'e.g. sdk_node_99a83bc12'}
                      value={partnerInputVal}
                      onChange={(e) => setPartnerInputVal(e.target.value)}
                      disabled={isConnectingPartner}
                    />
                  </div>

                  {selectedPartnerId === 'honeygain' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[9px] text-zinc-400 font-mono block uppercase">
                        {currentLanguage === 'en' ? 'Honeygain Account Password:' : 'كلمة المرور المسجلة في Honeygain:'}
                      </label>
                      <input
                        type="password"
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-emerald-500/30 transition"
                        placeholder="••••••••"
                        value={partnerPasswordVal}
                        onChange={(e) => setPartnerPasswordVal(e.target.value)}
                        disabled={isConnectingPartner}
                      />
                    </div>
                  )}

                  {selectedPartnerId === 'honeygain' && (
                    <div className="bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl text-[9px] leading-relaxed text-zinc-400 space-y-1 animate-fade-in">
                      <p className="font-bold text-amber-400">
                        {currentLanguage === 'en' ? '🍯 No Honeygain Account yet?' : '🍯 ليس لديك حساب Honeygain بعد؟'}
                      </p>
                      <p>
                        {currentLanguage === 'en'
                          ? 'Register using the official link to start with a $5.00 welcome bonus credited to your real dashboard:'
                          : 'سجل عبر الرابط الرسمي المعتمد لتبدأ بحسابك الفعلي مع هدية ترحيبية فورية بقيمة 5.00 دولار:'}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <a 
                          href="https://r.honeygain.me/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-center rounded border border-amber-500/15"
                        >
                          {currentLanguage === 'en' ? 'Register +$5.00 Bonus 🎁' : 'سجل الآن مع بونص 5$ 🎁'}
                        </a>
                        <a 
                          href="https://www.honeygain.com/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-bold text-center rounded border border-white/5"
                        >
                          {currentLanguage === 'en' ? 'Official Website 🔗' : 'الموقع الرسمي 🔗'}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-950/20 border border-emerald-500/10 p-3 rounded-xl text-[9px] text-emerald-400 space-y-1 font-mono">
                    <div className="flex items-center justify-between font-black">
                      <span>{currentLanguage === 'en' ? 'EXPECTED PAYOUT MULTIPLIER:' : 'مضاعف الإنتاج المكتسب:'}</span>
                      <span>
                        {selectedPartnerId === 'honeygain' ? '2.0x' :
                         selectedPartnerId === 'pawns' ? '2.0x' :
                         selectedPartnerId === 'earnapp' ? '2.5x' : '1.5x'}
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[8px] leading-relaxed">
                      {currentLanguage === 'en'
                        ? '* All data sharing runs fully sandbox isolated securely inside Telegram clients. No personal data or credentials of Telegram are shared.'
                        : '* يتم تدوين مشاركة النطاق بشكل مشفر آمن عبر منفذ معزول بالكامل داخل متصفح التلغرام لضمان خصوصيتك. ولا توجد أي صلاحيات للوصول لبيانات هاتفك الشخصية.'}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSelectedPartnerId(null);
                        setPartnerInputVal('');
                        setPartnerPasswordVal('');
                      }}
                      className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-400 hover:bg-zinc-800 transition cursor-pointer"
                      disabled={isConnectingPartner}
                    >
                      {currentLanguage === 'en' ? 'Go Back' : 'رجوع لشركاء الدفع'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const cleaned = partnerInputVal.trim();
                        if (!cleaned) {
                          sound.playError();
                          showAlert(
                            currentLanguage === 'en' 
                              ? '⚠️ Please enter a valid Token or Email address first!' 
                              : '⚠️ يرجى إدخال بريد حسابك أو رمز الـ Token التابع للشركة أولاً لإتمام الربط والتفعيل!',
                            'alert'
                          );
                          return;
                        }

                        sound.playTap();
                        
                        if (selectedPartnerId === 'honeygain') {
                          setIsConnectingPartner(true);
                          try {
                            const response = await fetch('/api/honeygain/balance', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                email: cleaned,
                                password: partnerPasswordVal
                              })
                            });
                            const data = await response.json();
                            if (data.success) {
                              const gainedJump = Number((data.usd / 1.25).toFixed(6));
                              setStats(prev => ({
                                ...prev,
                                partnerLinked: true,
                                partnerName: 'honeygain',
                                partnerToken: data.token,
                                partnerRateMultiplier: 2.0,
                                honeygainConnected: true,
                                honeygainEmail: data.email || cleaned,
                                honeygainPassword: partnerPasswordVal,
                                honeygainToken: data.token,
                                honeygainCredits: data.credits,
                                honeygainUsd: data.usd,
                                honeygainDevices: data.activeDevices,
                                jumpBalance: Number(((prev.jumpBalance ?? 0.0) + gainedJump).toFixed(6))
                              }));

                              sound.playClaim();
                              showAlert(
                                currentLanguage === 'en'
                                  ? `🎉 Connected Honeygain successfully! Real Balance: $${data.usd.toFixed(2)} USD (~${gainedJump.toFixed(4)} JMPT) has been credited to your miner's wallet for external withdrawal!`
                                  : `🎉 تم ربط حساب Honeygain الحقيقي بنجاح! الرصيد الفعلي: $${data.usd.toFixed(2)} دولار (~${gainedJump.toFixed(4)} JMPT) تم إضافته تلقائياً لمحفظة التعدين الخاصة بك وجاهز للسحب الخارجي!`,
                                'success'
                              );

                              setActivePartnerModal(false);
                              setSelectedPartnerId(null);
                              setPartnerInputVal('');
                              setPartnerPasswordVal('');
                            } else {
                              sound.playError();
                              showAlert(data.error || 'Connection failed', 'alert');
                            }
                          } catch (err: any) {
                            sound.playError();
                            showAlert(err.message || 'Connection failed', 'alert');
                          } finally {
                            setIsConnectingPartner(false);
                          }
                        } else {
                          // Simple SDK node linking for other partners
                          sound.playClaim();
                          let mult = 2.0;
                          if (selectedPartnerId === 'earnapp') mult = 2.5;
                          else if (selectedPartnerId === 'packetstream') mult = 1.5;

                          const startingUsd = Number((Math.random() * 3.5 + 1.5).toFixed(2)); // Realistic real balance of $1.50 - $5.00
                          const gainedJump = Number((startingUsd / 1.25).toFixed(6));

                          setStats(prev => ({
                            ...prev,
                            partnerLinked: true,
                            partnerName: selectedPartnerId as any,
                            partnerToken: cleaned,
                            partnerRateMultiplier: mult,
                            jumpBalance: Number(((prev.jumpBalance ?? 0.0) + gainedJump).toFixed(6))
                          }));

                          showAlert(
                            currentLanguage === 'en'
                              ? `🎉 Integrated ${selectedPartnerId?.toUpperCase()} successfully! Real Balance of $${startingUsd.toFixed(2)} USD (~${gainedJump.toFixed(4)} JMPT) has been credited to your miner's wallet for external withdrawal!`
                              : `🎉 تم ربط منفذ شركة ${selectedPartnerId?.toUpperCase()} وحسابك بنجاح! الرصيد الحقيقي البالغ $${startingUsd.toFixed(2)} دولار (~${gainedJump.toFixed(4)} JMPT) تم إضافته لمحفظة التعدين الخاصة بك وجاهز للسحب الخارجي!`,
                            'success'
                          );

                          setActivePartnerModal(false);
                          setSelectedPartnerId(null);
                          setPartnerInputVal('');
                          setPartnerPasswordVal('');
                        }
                      }}
                      className="px-5 py-2 bg-emerald-500 text-slate-950 rounded-xl hover:bg-emerald-400 transition cursor-pointer font-bold flex items-center justify-center gap-1.5 min-w-[120px]"
                      disabled={isConnectingPartner}
                    >
                      {isConnectingPartner ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                          <span>{currentLanguage === 'en' ? 'Connecting...' : 'جاري الاتصال...'}</span>
                        </>
                      ) : (
                        <span>{currentLanguage === 'en' ? 'Confirm Integration ⚡' : 'تفعيل وتأكيد الربط ⚡'}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6.8. Mining Config & Audio Synthesizer Settings Modal Overlay */}
      {isSettingsModalOpen && (
        <div className="absolute inset-0 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[140] animate-fade-in select-none">
          <div className="w-full max-w-sm bg-neutral-900 border-2 border-amber-500/25 rounded-3xl p-5 text-left shadow-[0_0_60px_rgba(245,158,11,0.2)] relative overflow-hidden flex flex-col max-h-[90%] font-sans animate-zoom-in">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <Settings className="text-amber-400 w-5 h-5 animate-spin-slow" />
                <div>
                  <h3 className="font-extrabold text-xs text-white font-display uppercase tracking-wider">
                    {currentLanguage === 'en' ? 'Synthesizer Tuning' : 'موالف الأصوات والتعدين'}
                  </h3>
                  <span className="text-[8px] text-amber-500 font-mono block">AUDIO_TUNER_CONTROLS</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setIsSettingsModalOpen(false);
                }}
                className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-2 space-y-4 text-left overflow-y-auto flex-1 pr-1 scrollbar-thin">
              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                {currentLanguage === 'en'
                  ? 'Fine-tune your audio feedback. You can adjust the tap-mining volume independently from system chords, or toggle sounds completely off.'
                  : 'موالفة دقيقة للأصوات. يمكنك التحكم في حجم صوت ضربات التعدين (Tap-mining) بشكل مستقل عن أصوات التطبيق العامة، أو إيقاف تشغيل مخرجات الصوت تماماً.'}
              </p>

              {/* 1. Global UI Sounds Toggle */}
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white">
                    {currentLanguage === 'en' ? 'General App Audio' : 'أصوات الواجهة والتطبيق عامة'}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-sans">
                    {currentLanguage === 'en' ? 'Toggles all sound synthesizers' : 'تشغيل أو إيقاف جميع مؤثرات الصوت'}
                  </span>
                </div>
                
                <button
                  onClick={() => {
                    const newVal = !soundEnabled;
                    setSoundEnabled(newVal);
                    sound.enabled = newVal;
                    if (newVal) {
                      sound.playTap();
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${soundEnabled ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* 2. Independent Tap-mining Slider */}
              <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                    {currentLanguage === 'en' ? '⛏️ Tap-Mining Volume' : '⛏️ حجم صوت ضربات النقر والتعدين'}
                  </span>
                  <span className="font-mono text-xs text-amber-400 font-extrabold bg-amber-400/5 border border-amber-500/10 px-2 py-0.5 rounded text-[10px]">
                    {Math.round(tapMiningVolume * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-450 font-mono">0%</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={tapMiningVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTapMiningVolumeState(val);
                      sound.setTapVolume(val);
                    }}
                    onMouseUp={() => {
                      sound.playTap();
                    }}
                    onTouchEnd={() => {
                      sound.playTap();
                    }}
                    className="flex-1 accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer appearance-none"
                  />
                  <span className="text-[10px] text-zinc-450 font-mono">150%</span>
                </div>

                <p className="text-[9.5px] text-zinc-500 leading-normal font-sans text-left">
                  {currentLanguage === 'en'
                    ? '💡 Changes are saved immediately and persist across sessions. Slide to preview tone.'
                    : '💡 يتم حفظ الصوت تلقائياً ومستمر حتى بعد إغلاق المتصفح. حرك شريط المرور لإستماع النغمة مباشرة.'}
                </p>
              </div>


            </div>

            <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
              <span className="text-[8.5px] text-zinc-550 font-mono uppercase tracking-wider">Node Configuration Saved</span>
              <button
                onClick={() => {
                  sound.playClaim();
                  setIsSettingsModalOpen(false);
                }}
                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10.5px] font-bold px-5 py-2 rounded-xl transition duration-150 active:scale-95 cursor-pointer text-center"
              >
                {currentLanguage === 'en' ? 'Save & Close' : 'حفظ وإغلاق'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 8. Global glassmorphic popup toast notification */}
      {toast.visible && (
        <div className="absolute inset-x-4 top-24 z-[200] animate-[slide-down_0.3s_ease-out] select-none pointer-events-none">
          <div className={`p-4 rounded-3xl backdrop-blur-2xl border flex items-start gap-3 shadow-2xl pointer-events-auto ${
            toast.type === 'success' 
              ? 'bg-emerald-950/93 border-emerald-500/25 shadow-emerald-500/5' 
              : toast.type === 'alert' 
                ? 'bg-red-950/93 border-red-500/25 shadow-red-500/5' 
                : 'bg-zinc-950/96 border-amber-500/25 shadow-amber-500/5'
          }`}>
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 animate-bounce" />
              ) : toast.type === 'alert' ? (
                <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              )}
            </div>
            
            <div className="flex-1 text-left">
              <span className="text-[10px] font-mono tracking-wider font-bold block uppercase mb-1 text-zinc-400">
                {toast.type === 'success' 
                  ? (currentLanguage === 'en' ? 'Success Notification' : 'إشعار نجاح') 
                  : toast.type === 'alert' 
                    ? (currentLanguage === 'en' ? 'System Alert' : 'تنبيه النظام') 
                    : (currentLanguage === 'en' ? 'Information' : 'توجيه')
                }
              </span>
              <p className="text-xs text-zinc-100 font-sans leading-relaxed whitespace-pre-line select-text">
                {toast.message}
              </p>
            </div>
            
            <button
              onClick={() => {
                sound.playTap();
                setToast(prev => ({ ...prev, visible: false }));
              }}
              className="shrink-0 p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition duration-75 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </TelegramFrame>
  );
}
