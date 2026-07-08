/**
 * Types and interfaces for the GigaHash Miner Web Application.
 */

export interface UpgradeItem {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  effectMultiplier: number;
  iconName: string; // lucide icon name
  category: 'clicks' | 'energy' | 'passive';
}

export interface UserStats {
  coins: number;         // Total $BEE tokens mined
  ghs: number;           // Passive mining rate (Bp/s - Bee Power Speed)
  energy: number;        // Current energy battery (⚡)
  maxEnergy: number;     // Energy capacity
  energyRegen: number;   // Energy regen speed per second
  multiTap: number;      // Amount of Hp/s bought (and energy spent) per single tap
  efficiencyLevel: number; // Ratio multiplier for energy to Hp/s conversion
  referrals: number;     // Number of invited friends
  spinTickets: number;   // Spin tickets left for Lucky Wheel
  lastClaimDate: string; // Last date claimed (YYYY-MM-DD) for daily reward streak
  consecutiveDays: number; // Consecutive check-in days
  tasksCompleted: string[]; // List of completed task identifiers
  upgradeLevels: Record<string, number>; // Local storage levels of upgrades
  lastActiveTime: number; // Timestamp of last save for offline earnings calculation
  isActivated: boolean;   // True if user subscribed to group and channel
  tonBalance: number;     // User's exchangeable TON coin balance
  walletAddress?: string; // Saved user personal TON wallet address
  language?: 'ar' | 'en'; // Selected language ('ar' or 'en')
  miningSessionStart?: number; // Timestamp of the active 12-hour mining session
  lockedReserveUSD?: number; // Global locked sponsor reward pool balance in USD
  claimedRewardUSD?: number; // Amount of USD task/channel rewards already claimed
  pepeBalance?: number;     // User's PEPE gift balance (e.g. 150,000 $PEPE)
  pepeWalletAddress?: string; // User PEPE wallet address (BSC / BEP-20)
  bscWalletAddress?: string;  // Connected real BSC address: e.g. Trust Wallet
  realBnbBalance?: number;    // Loaded live BNB balance from BSC mainnet
  realUsdtBalance?: number;   // Loaded live USDT balance from BSC mainnet
  antiCheatPassed?: boolean;  // True if scanner confirms no botting / multi-accounts
  isAntiCheatFlagged?: boolean; // Flagged for suspicious quick clicks 
  adminBnbBalance?: number;    // Hidden administrator BNB backing deposit balance
  pepeGiftWithdrawn?: boolean; // True if the subscriber's initial gift has already been withdrawn
  binanceId?: string;          // Connected Binance ID (UID or Binance Pay ID)
  partnerLinked?: boolean;     // Whether a P2P bandwidth provider is connected
  partnerName?: string;       // Connected partner service name (honeygain, pawns, earnapp, packetstream)
  partnerToken?: string;      // User's linked Partner SDK/Node private token
  partnerRateMultiplier?: number; // Multiplier gained from partner link (e.g. 1.5 or 2.0)
  honeygainEmail?: string;     // Connected Honeygain email
  honeygainPassword?: string;  // Connected Honeygain password (to allow automatic fetches)
  honeygainToken?: string;     // Connected Honeygain token
  honeygainCredits?: number;   // Connected Honeygain credits
  honeygainUsd?: number;       // Connected Honeygain USD value
  honeygainDevices?: number;   // Connected Honeygain active devices
  honeygainConnected?: boolean;// Whether Honeygain real account is successfully linked

  botUsername?: string;       // Custom Telegram Bot username used for referral links
  bandwidthMiningOn?: boolean; // Persisted toggle state for bandwidth sharing mining
  autoSwapToTon?: boolean;     // Automatically claim/swap bandwidth rewards directly to main TON Balance
  telegramId?: string;         // Unique numeric Telegram code/ID of the subscriber
  jumpBalance?: number;        // User's accumulated Jump/JMPT coin balance
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  ghs: number;
  avatarSeed: string;
  isCurrentUser?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  rewardGhs?: number;
  rewardTickets?: number;
  actionLabel: string;
  type: 'telegram' | 'twitter' | 'youtube' | 'chat';
  externalUrl?: string;
  isCompleted: boolean;
}

export interface DailyReward {
  day: number;
  coins: number;
  ghs: number;
}

export interface AdminTransaction {
  id: string;
  type: 'withdraw' | 'ad_payment' | 'deposit';
  user: string;
  targetWallet?: string;
  amount: number;
  asset?: 'TON' | 'PEPE' | 'BNB' | 'USDT' | 'JUMP'; // Asset type being transacted
  data?: any; // e.g. title, text
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  timestamp: string;
}
