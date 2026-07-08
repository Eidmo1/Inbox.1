import { UpgradeItem, TaskItem, DailyReward, LeaderboardUser } from './types';

export const SHOP_UPGRADES: UpgradeItem[] = [
  {
    id: 'multi_tap',
    name: 'Quantum Queen Honey Comb',
    description: 'Increases conversion rate of energy to Bee Power (Bp) per single tap',
    baseCost: 150,
    costMultiplier: 1.8,
    effectMultiplier: 1, // Add +1 Bp per upgrade level
    iconName: 'Zap',
    category: 'clicks'
  },
  {
    id: 'max_energy',
    name: 'Fusion Pollen Core',
    description: 'Increases maximum stored energy capacity limits (+500 capacity)',
    baseCost: 200,
    costMultiplier: 1.6,
    effectMultiplier: 500,
    iconName: 'Battery',
    category: 'energy'
  },
  {
    id: 'energy_regen',
    name: 'Honey Charger',
    description: 'Boosts energy recharge recovery rate per second (+1 ⚡/sec)',
    baseCost: 250,
    costMultiplier: 2.1,
    effectMultiplier: 1,
    iconName: 'BatteryCharging',
    category: 'energy'
  },
  {
    id: 'gpu_rig',
    name: 'Bronze Hive Rig',
    description: 'Extracts Bee Power passive speed automatically without tapping (+5 Bp/s)',
    baseCost: 500,
    costMultiplier: 1.5,
    effectMultiplier: 5,
    iconName: 'Cpu',
    category: 'passive'
  },
  {
    id: 'asic_miner',
    name: 'Iron Swarm Engine',
    description: 'A powerful heavy industrial mining engine yielding huge speed (+30 Bp/s)',
    baseCost: 2500,
    costMultiplier: 1.6,
    effectMultiplier: 30,
    iconName: 'Server',
    category: 'passive'
  },
  {
    id: 'quantum_node',
    name: 'Cyber Queen SuperNode',
    description: 'An advanced sub-atomic bee ledger supervisor node (+150 Bp/s)',
    baseCost: 12000,
    costMultiplier: 1.75,
    effectMultiplier: 150,
    iconName: 'Activity',
    category: 'passive'
  }
];

export const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: 'Satoshi_Bee', ghs: 34500, avatarSeed: 'bee_one' },
  { rank: 2, name: 'Crypto_Hornet', ghs: 28910, avatarSeed: 'hornet' },
  { rank: 3, name: 'Wasp_King', ghs: 24320, avatarSeed: 'king' },
  { rank: 4, name: 'Energy_Drone', ghs: 19120, avatarSeed: 'drone' },
  { rank: 5, name: 'Tesla_Apis_99', ghs: 14200, avatarSeed: 'apis' },
  { rank: 6, name: 'BeePowerMaster', ghs: 9800, avatarSeed: 'master' },
  { rank: 7, name: 'Volt_Bumble', ghs: 6710, avatarSeed: 'bumble' },
  { rank: 8, name: 'Giga_Zapper_Bee', ghs: 4200, avatarSeed: 'zap' },
  { rank: 9, name: 'Green_Apis_X', ghs: 2120, avatarSeed: 'green' }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'discussion_group',
    title: 'Join Queen Bee Discussion Group',
    description: 'Subscribe & participate in our main group for tips, tricks, and codes.',
    rewardCoins: 500,
    rewardGhs: 15,
    actionLabel: 'Join Group 👥',
    type: 'telegram',
    externalUrl: 'https://t.me/Free2045',
    isCompleted: false
  },
  {
    id: 'withdrawal_channel',
    title: 'Join Withdrawals & Deposits channel',
    description: 'Track secure proofs of automated payouts and blockchain deposit logs.',
    rewardCoins: 500,
    rewardGhs: 15,
    actionLabel: 'Join Channel 📢',
    type: 'telegram',
    externalUrl: 'https://t.me/token127',
    isCompleted: false
  },
  {
    id: 'yt_subscribe',
    title: 'Subscribe to Queen Bee Academy',
    description: 'Watch tutorials on converting Energy into Bp speed effectively.',
    rewardCoins: 400,
    rewardTickets: 1,
    actionLabel: 'Subscribe 🎥',
    type: 'youtube',
    externalUrl: 'https://youtube.com',
    isCompleted: false
  },
  {
    id: 'ai_oracle',
    title: 'Consult the Queen Bee Oracle',
    description: 'Chat with our server-side Oracle AI helper about blockchain mining.',
    rewardCoins: 600,
    rewardGhs: 50,
    rewardTickets: 2,
    actionLabel: 'Oracle Chat 💬',
    type: 'chat',
    externalUrl: 'https://t.me/Free2045',
    isCompleted: false
  }
];

export const DAILY_REWARDS: DailyReward[] = [
  { day: 1, coins: 200, ghs: 5 },
  { day: 2, coins: 400, ghs: 10 },
  { day: 3, coins: 700, ghs: 15 },
  { day: 4, coins: 1100, ghs: 25 },
  { day: 5, coins: 1600, ghs: 40 },
  { day: 6, coins: 2500, ghs: 60 },
  { day: 7, coins: 5000, ghs: 100 }
];

export const MINER_TITLES = [
  { threshold: 0, title: 'Bee Larva 🐝', color: 'text-amber-500 bg-amber-500/10' },
  { threshold: 100, title: 'Worker Bee 🐝⚡', color: 'text-blue-400 bg-blue-400/10' },
  { threshold: 1000, title: 'Drone Bee 🐝🌟', color: 'text-indigo-400 bg-indigo-400/10' },
  { threshold: 5000, title: 'Guard Bee 🐝⚡', color: 'text-purple-400 bg-purple-400/15' },
  { threshold: 25000, title: 'Queen Bee Sovereign 👑', color: 'text-emerald-400 bg-emerald-400/20 border border-emerald-500/30 font-semibold' }
];

export function getUserTitle(ghs: number) {
  for (let i = MINER_TITLES.length - 1; i >= 0; i--) {
    if (ghs >= MINER_TITLES[i].threshold) {
      return MINER_TITLES[i];
    }
  }
  return MINER_TITLES[0];
}
