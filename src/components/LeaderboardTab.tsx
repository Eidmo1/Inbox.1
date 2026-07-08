import React, { useState } from 'react';
import { UserStats, LeaderboardUser } from '../types';
import { INITIAL_LEADERBOARD, getUserTitle } from '../data';
import { Award, Users, Copy, Check, Sparkles, UserPlus } from 'lucide-react';
import { sound } from './AudioSynth';
import { TRANSLATIONS, Language } from '../lib/translations';

interface LeaderboardTabProps {
  stats: UserStats;
  username: string;
  onAddReferral: (addedGhs: number) => void;
  language: Language;
  showAlert?: (message: string, type?: 'success' | 'alert' | 'info') => void;
  onChangeUsername?: (newUsername: string) => void;
  onChangeBotUsername?: (newBotUsername: string) => void;
}

export default function LeaderboardTab({ 
  stats, 
  username, 
  onAddReferral, 
  language, 
  showAlert,
  onChangeUsername,
  onChangeBotUsername
}: LeaderboardTabProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';
  
  const [copied, setCopied] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [referralList, setReferralList] = useState<string[]>(
    Array.from({ length: stats.referrals }, (_, i) => `@Referral_Miner_${100 + i}`)
  );

  // Compile leaderboard list including the dynamic user
  const getFullLeaderboard = (): LeaderboardUser[] => {
    const userItem: LeaderboardUser = {
      rank: 10,
      name: language === 'ar' ? `${username} (أنت)` : `${username} (You)`,
      ghs: Math.round(stats.ghs),
      avatarSeed: 'user-miner',
      isCurrentUser: true,
    };

    // Combine and sort descending by GHS hashrate
    const sorted = [...INITIAL_LEADERBOARD, userItem].sort((a, b) => b.ghs - a.ghs);

    // Re-assign proper rank indices
    return sorted.map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
  };

  const leaders = getFullLeaderboard();
  const currentUserRank = leaders.find((l) => l.isCurrentUser)?.rank || 10;
  
  // Use localized rank grade names if Arabic is requested
  const getRankGradeLocalizedName = (ghs: number) => {
    const rawGrade = getUserTitle(ghs);
    if (language === 'ar') {
      if (ghs >= 25000) return 'إمبراطور سرداب إكستون الفائق 👑';
      if (ghs >= 5000) return 'سيد الجمجمة السيبرانية المطور 💀⚡';
      if (ghs >= 1000) return 'الجمجمة البرونزية المتقدمة 💀🌟';
      if (ghs >= 100) return 'الهيكل العظمي الذهبي النشط 💀⚡';
      return 'مبتدئ العظام المستكشف 💀';
    }
    return rawGrade.title;
  };

  const userRankGradeTitle = getRankGradeLocalizedName(stats.ghs);
  const cleanBotUser = (stats.botUsername || 'xtyMiningBot').replace(/^@/, '').trim();
  const cleanUser = username.replace(/^@/, '').trim();
  const inviteLink = `https://t.me/${cleanBotUser}?start=ref_${stats.telegramId || cleanUser}`;

  const handleCopyLink = () => {
    sound.playTap();
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (showAlert) {
      showAlert(t.copySuccess, 'success');
    } else {
      alert(t.copySuccess);
    }
  };

  const handleClaimFriend = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = friendUsername.trim();

    // Standard telegram username validation
    if (!cleanName.startsWith('@') || cleanName.length < 5) {
      sound.playError();
      showAlert?.(t.invalidFriendFormat, 'alert');
      return;
    }

    if (referralList.includes(cleanName)) {
      sound.playError();
      showAlert?.(t.friendAlreadyAdded, 'alert');
      return;
    }

    sound.playClaim();
    setReferralList((prev) => [cleanName, ...prev]);
    onAddReferral(15);
    setFriendUsername('');
    showAlert?.(t.friendAddSuccess, 'success');
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-neutral-950 px-4 pt-4 overflow-y-auto pb-24 select-none ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* Top referral actions widget */}
      <div className="bg-gradient-to-b from-slate-900 to-neutral-950 border border-amber-500/10 rounded-2xl p-4.5 mb-5 shadow-lg select-none">
        <div className="flex items-center gap-2 mb-2">
          <Users className="text-amber-400 w-4.5 h-4.5" />
          <h2 className="font-semibold text-sm font-display text-white">{t.referralTitle}</h2>
        </div>
        <p className="text-[11px] text-zinc-350 leading-normal">
          {t.referralDesc}
        </p>

        {/* Dynamic Participant Username Configuration */}
        <div className="mt-3 bg-neutral-950/60 border border-white/5 rounded-xl p-3">
          <label className="text-[10px] text-amber-400 font-extrabold uppercase font-mono tracking-wider block mb-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            {language === 'ar' ? 'اسم المستخدم الخاص بك لتخصيص الإحالة:' : 'Your Username to Customise Referral Link:'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs font-black">@</span>
            <input
              type="text"
              placeholder={language === 'ar' ? 'أدخل يوزر التلجرام الخاص بك' : 'Enter your telegram handle'}
              value={username}
              onChange={(e) => {
                const val = e.target.value.trim().replace(/^@/, '');
                onChangeUsername?.(val);
              }}
              className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500 transition-all duration-200"
            />
          </div>
          <span className="text-[9px] text-zinc-500 block mt-1.5 leading-normal">
            {language === 'ar' 
              ? '💡 أدخل اسم مستخدم تلجرام الخاص بك هنا ليقوم النظام بتوليد رابط دعوة فريد مخصص لك فوراً!' 
              : '💡 Enter your real Telegram handle here so the system generates your custom invite URL instantly!'}
          </span>
        </div>

        {/* Copy Node Key Link */}
        <div className="flex flex-col gap-1.5 mt-3">
          <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono font-bold">
            {language === 'ar' ? 'رابط الإحالة المخصص لك 🔗' : 'Your Personal Referral Link 🔗'}
          </span>
          <div className="flex items-center gap-1.5 bg-neutral-900 duration-200 border border-white/5 rounded-xl p-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-transparent border-none text-[10px] py-1 pl-1 text-zinc-400 font-mono outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-lg transition duration-150 shrink-0 ${copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-zinc-300 hover:text-white'}`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>



      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 gap-3.5 mb-5 select-none text-left">
        <div className="p-3 bg-neutral-900 border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 font-mono block leading-none uppercase">{language === 'ar' ? 'الترتيب الحالي' : 'YOUR CURRENT RANK'}</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-amber-400 font-mono">#{currentUserRank}</span>
            <span className="text-[9px] text-zinc-500 font-mono">of {leaders.length}</span>
          </div>
        </div>
        <div className="p-3 bg-neutral-900 border border-white/5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-zinc-505 font-mono block leading-none uppercase">{language === 'ar' ? 'درجة التعدين' : 'MINER STATUS TITLE'}</span>
          <div className="mt-1.5 flex items-center">
            <span className="text-[10.5px] font-sans font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 truncate">
              {userRankGradeTitle}
            </span>
          </div>
        </div>
      </div>

      {/* Leader Board List */}
      <div className="flex items-center gap-1.5 mb-3.5 py-1 text-zinc-400 border-b border-white/5 pb-2">
        <Award size={15} className="text-amber-500" />
        <span className="text-xs font-bold font-display uppercase tracking-wider text-neutral-300">{t.leadersTitle}</span>
      </div>

      <div className="space-y-2">
        {leaders.map((u) => {
          let badgeColor = 'text-zinc-500';
          let borderHighlight = 'border-white/5';
          let rowBg = 'bg-neutral-900/60';

          if (u.rank === 1) {
            badgeColor = 'text-amber-400 font-bold';
            borderHighlight = 'border-amber-500/20';
            rowBg = 'bg-amber-500/5';
          } else if (u.rank === 2) {
            badgeColor = 'text-slate-300 font-bold';
            borderHighlight = 'border-slate-300/25';
            rowBg = 'bg-slate-300/5';
          } else if (u.rank === 3) {
            badgeColor = 'text-amber-700 font-bold';
            borderHighlight = 'border-amber-700/24';
            rowBg = 'bg-amber-700/5';
          }

          if (u.isCurrentUser) {
            borderHighlight = 'border-amber-500/55 ring-1 ring-amber-500/15 animate-pulse';
            rowBg = 'bg-amber-500/10';
          }

          return (
            <div
              key={u.name}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 transition duration-150 ${borderHighlight} ${rowBg}`}
            >
              <div className="flex items-center gap-3">
                {/* Ranking block */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs ${badgeColor}`}>
                  {u.rank}
                </div>

                {/* Avatar dot */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold select-none text-white ${u.isCurrentUser ? 'bg-gradient-to-tr from-amber-400 to-amber-600' : 'bg-zinc-800'}`}>
                  {u.name.charAt(0).toUpperCase()}
                </div>

                {/* User name information */}
                <div>
                  <h4 className={`text-xs font-semibold ${u.isCurrentUser ? 'text-amber-400 font-bold' : 'text-white'}`}>
                    {u.name}
                  </h4>
                  <p className="text-[10px] text-zinc-550">
                    {u.isCurrentUser ? userRankGradeTitle : (language === 'ar' ? 'العقدة السحابية العامة' : 'Global Node')}
                  </p>
                </div>
              </div>

              {/* Hash rates */}
              <div className="text-right">
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {u.ghs.toLocaleString()} Bp/s
                </span>
                <p className="text-[10px] text-zinc-500 font-mono">
                  +{(u.ghs * 0.005).toFixed(3)} BEE/s
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Referral listings list */}
      <div className="mt-6 mb-2 text-xs font-bold font-display uppercase tracking-wider text-neutral-300 border-b border-white/5 pb-2">
        {t.yourRecruits} ({referralList.length})
      </div>
      {referralList.length > 0 ? (
        <div className="space-y-1.5 pb-2">
          {referralList.map((friend, idx) => (
            <div key={friend + idx} className="p-2.5 bg-neutral-900 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300">{friend}</span>
              <span className="text-emerald-400">+15 Bp/s</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5">
          <p className="text-[11px] text-zinc-500 font-mono">{t.noRecruits}</p>
        </div>
      )}
    </div>
  );
}
