import React, { useState } from 'react';
import { UserStats } from '../types';
import { sound } from './AudioSynth';
import { HelpCircle, CheckCircle2, Flame, RotateCw, Sparkles, Trophy, Gift, ArrowRight, Check } from 'lucide-react';

interface ActivityTabProps {
  stats: UserStats;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  language: 'ar' | 'en';
  showAlert: (message: string, type?: 'success' | 'alert' | 'info') => void;
  todayTaps: number;
  completedPuzzle: boolean;
  setCompletedPuzzle: (val: boolean) => void;
  adsWatchedToday: number;
}

export default function ActivityTab({
  stats,
  setStats,
  language,
  showAlert,
  todayTaps,
  completedPuzzle,
  setCompletedPuzzle,
  adsWatchedToday,
}: ActivityTabProps) {
  const isRtl = language === 'ar';
  
  // Chest and Daily checklist status
  const [solvedPuzzleAnswer, setSolvedPuzzleAnswer] = useState('');
  const [showPuzzleModal, setShowPuzzleModal] = useState(false);
  const [chestClaimed, setChestClaimed] = useState(false);

  // Core 4 tasks checks:
  const task1_ads = Math.min(adsWatchedToday, 4); // Target: 4 ads watched
  const task2_puzzle = completedPuzzle ? 1 : 0; // Target: daily cipher solved
  const task3_invite = stats.referrals >= 1 ? 1 : 0; // Target: invite 1 friend
  const task4_claim = stats.coins > 100 ? 1 : 0; // Target: minimum earned 100

  const totalCompleted = (task1_ads >= 4 ? 1 : 0) + task2_puzzle + task3_invite + task4_claim;
  const progressPercent = Math.round((totalCompleted / 4) * 100);

  const handleSolvePuzzle = () => {
    if (solvedPuzzleAnswer.trim().toLowerCase() === 'xton' || solvedPuzzleAnswer.trim() === 'إكستون' || solvedPuzzleAnswer.trim().toLowerCase() === 'ton' || solvedPuzzleAnswer.trim() === 'تون') {
      sound.playClaim();
      setCompletedPuzzle(true);
      setStats(prev => ({
        ...prev,
        coins: prev.coins + 15,
      }));
      setShowPuzzleModal(false);
      showAlert(isRtl ? '🎉 مبروك! إجابة اللغز صحيحة، حصلت على +15 XTON!' : '🎉 Correct answer! You scored +15 XTON!', 'success');
    } else {
      sound.playError();
      showAlert(isRtl ? '❌ الإجابة خاطئة! تلميح: اسم العملة أو البوت الجديد.' : '❌ Incorrect answer! Hint: name of this token or bot.', 'alert');
    }
  };

  const handleClaimChest = () => {
    if (totalCompleted < 4) {
      sound.playError();
      showAlert(isRtl ? '⚠️ الرجاء إكمال جميع المهام اليومية الأربعة لفتح الصندوق!' : '⚠️ Complete all 4 daily tasks first to open the chest!', 'alert');
      return;
    }
    if (chestClaimed) {
      showAlert(isRtl ? '🪙 لقد استلمت مكافأة عملات صندوق اليوم بالفعل!' : '🪙 You have already claimed today\'s coin chest reward!', 'info');
      return;
    }

    sound.playClaim();
    setChestClaimed(true);
    setStats(prev => ({
      ...prev,
      coins: prev.coins + 150,
      spinTickets: prev.spinTickets + 2,
    }));
    showAlert(isRtl ? '🪙 مبارك! لقد فتحت صندوق عملات التعدين وتمت إضافة +150 Queen bee و +2 تذاكر عجلة الحظ إلى محفظتك!' : '🪙 Success! You opened the daily premium coin chest and +150 Queen bee and +2 Spin Tickets have been added to your wallet!', 'success');
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-neutral-950 px-4 pt-4 overflow-y-auto pb-24 select-none ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* Golden Chest Visual Module */}
      <div className="bg-gradient-to-br from-neutral-900 to-zinc-950 border border-amber-500/10 rounded-3xl p-5 mb-5 relative overflow-hidden text-center flex flex-col items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.12)_0%,transparent_60%)] pointer-events-none" />
        
        {/* Floating decorations */}
        <div className="absolute top-4 right-4 text-amber-550 opacity-40 animate-pulse text-lg">✨</div>
        <div className="absolute bottom-4 left-6 text-amber-550 opacity-40 animate-bounce text-sm">🪙</div>

        {/* Chest illustration mockup (in the shape of coins) */}
        <div className="relative w-28 h-28 my-3 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
          {chestClaimed ? (
            <div className="relative flex items-center justify-center">
              <span className="text-5xl filter drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-bounce">🪙</span>
              <span className="absolute -bottom-1 -right-1 text-2xl">✅</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center gap-1.5 animate-bounce">
              <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] -rotate-12 translate-x-2">🪙</span>
              <span className="text-6xl filter drop-shadow-[0_0_20px_rgba(245,158,11,0.6)] z-10 scale-110">🪙</span>
              <span className="text-4xl filter drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] rotate-12 -translate-x-2">🪙</span>
            </div>
          )}
        </div>

        <h3 className="font-extrabold text-base text-white tracking-wide">
          {isRtl ? 'صندوق عملات التعدين اليومي 🪙' : 'Daily Mining Coin Chest 🪙'}
        </h3>
        
        <p className="text-[11px] text-zinc-400 mt-1 font-sans">
          {isRtl ? 'أكمل مهامك اليومية الأربعة وافتح كنز العملات لتضاف للمحفظة تلقائياً' : 'Complete your 4 daily tasks and unlock the golden coin pile to add to your wallet'}
        </p>

        {/* Progress horizontal indicator */}
        <div className="w-full mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
            <span>{isRtl ? `التقدم: ${totalCompleted}/4 مهام` : `Completed: ${totalCompleted}/4 Tasks`}</span>
            <span className="text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-950 p-0.5 rounded-full border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-cyber-gold rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Grand Claim Chest Button */}
        <button
          onClick={handleClaimChest}
          disabled={chestClaimed || totalCompleted < 4}
          className={`w-full mt-4.5 py-3 rounded-2xl font-bold font-mono text-xs transition duration-150 ${
            chestClaimed 
              ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 pointer-events-none'
              : totalCompleted === 4
                ? 'bg-gradient-to-r from-amber-500 to-cyber-gold hover:from-amber-400 hover:to-cyber-gold text-slate-950 font-extrabold shadow-lg animate-pulse cursor-pointer'
                : 'bg-zinc-850 text-zinc-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          {chestClaimed 
            ? (isRtl ? 'تم استلام الصندوق بنجاح ✓' : 'Daily Chest Claimed ✓') 
            : totalCompleted === 4
              ? (isRtl ? 'افتح الصندوق واستلم الهدية! 🔓' : 'Unlock Daily Chest Reward! 🔓')
              : (isRtl ? `أكمل ${4 - totalCompleted} مهام إضافية للتفعيل` : `Complete ${4 - totalCompleted} more tasks to open`)
          }
        </button>
      </div>

      {/* Checklist Grid Module */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4.5 mb-4">
        <h4 className="text-xs font-bold font-display text-white mb-3 flex items-center gap-1.5 uppercase">
          <Trophy size={14} className="text-cyber-gold" />
          <span>{isRtl ? 'المهام الأربعة لفتح الصندوق' : 'Four Tasks Chest Checklist'}</span>
        </h4>

        <div className="space-y-3">
          {/* Task 1: Ads progress indicator */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">📺</span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isRtl ? 'شاهد 4 إعلانات يومياً' : 'Watch 4 ads today'}
                </span>
                <span className="text-[9.5px] text-zinc-400 font-mono">
                  {isRtl ? `التقدم الحالي: (${adsWatchedToday}/4)` : `Current progress: (${adsWatchedToday}/4)`}
                </span>
              </div>
            </div>
            <div>
              {task1_ads >= 4 ? (
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">
                  <Check size={14} />
                </div>
              ) : (
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono px-2 py-0.5 rounded-md">
                  {Math.round((adsWatchedToday / 4) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Task 2: Puzzle helper */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">🔑</span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isRtl ? 'حل شفزة ولغز اليوم' : 'Solve Daily Ciphers'}
                </span>
                <span className="text-[9.5px] text-zinc-400 font-mono">
                  {isRtl ? 'أجب على السؤال اليومي لربح هدايا فورية' : 'Answer the brain-teaser for quick bounty'}
                </span>
              </div>
            </div>
            <div>
              {completedPuzzle ? (
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">
                  <Check size={14} />
                </div>
              ) : (
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowPuzzleModal(true);
                  }}
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold px-2.5 py-1 rounded-lg text-[9px] font-mono cursor-pointer"
                >
                  {isRtl ? 'حل اللغز' : 'Solve Puzzle'}
                </button>
              )}
            </div>
          </div>

          {/* Task 3: Invitation checklist item */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">👥</span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isRtl ? 'ادعُ صديقاً واحداً على الأقل' : 'Invite a new partner'}
                </span>
                <span className="text-[9.5px] text-zinc-400 font-sans">
                  {isRtl ? `لديك حالياً: ${stats.referrals} إحالة` : `Active referrals: ${stats.referrals}`}
                </span>
              </div>
            </div>
            <div>
              {stats.referrals >= 1 ? (
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">
                  <Check size={14} />
                </div>
              ) : (
                <span className="text-[9.5px] text-zinc-500 font-mono">
                  {isRtl ? 'غير مكتمل' : 'Incomplete'}
                </span>
              )}
            </div>
          </div>

          {/* Task 4: Total mining claim checklist item */}
          <div className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-sm">⚙️</span>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isRtl ? 'اجمع أرباح لا تقل عن 100 XTON' : 'Acquire 100+ XTON tokens'}
                </span>
                <span className="text-[9.5px] text-zinc-400 font-sans">
                  {isRtl ? `الأرباح الكلية: ${Math.round(stats.coins)} XTON` : `Owned balance: ${Math.round(stats.coins)} XTON`}
                </span>
              </div>
            </div>
            <div>
              {stats.coins >= 100 ? (
                <div className="bg-emerald-500/10 text-emerald-400 p-1 rounded-full">
                  <Check size={14} />
                </div>
              ) : (
                <span className="text-[9px] bg-zinc-800 text-zinc-400 font-mono px-2 py-0.5 rounded-md">
                  {Math.round(Math.min(100, stats.coins))}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Daily puzzle Modal overlay context */}
      {showPuzzleModal && (
        <div className="absolute inset-0 bg-neutral-950/94 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[170] animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/25 rounded-3xl p-5 text-left shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-zoom-in relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
              <h3 className="font-extrabold text-xs text-white font-display uppercase tracking-wider">
                {isRtl ? 'لغز اليوم وحل الشفرة 🔮' : 'Daily Cipher & Word Riddle 🔮'}
              </h3>
              <button
                onClick={() => {
                  sound.playTap();
                  setShowPuzzleModal(false);
                }}
                className="p-1 rounded-lg bg-zinc-805 text-zinc-400 hover:text-white transition"
              >
                ✖
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-4 select-text">
              {isRtl 
                ? 'ما هو اسم عملة البوت السحابي الجديد الذي تشغله الآن للربح والتعدين؟ (اكتب الإجابة باللغة الإنجليزية في الخانة وتأكد لتكسب الجائزة).'
                : 'What is the exact name of this brand-new cloud-mining bot or key token you are accumulating? (Type the exact answer in English to claim your bounty).'
              }
            </p>

            <div className="my-4 space-y-3">
              <label className="text-[10px] text-zinc-500 font-mono block uppercase">Your Answers (English/Arabic)</label>
              <input
                type="text"
                placeholder="e.g. xton"
                value={solvedPuzzleAnswer}
                onChange={(e) => setSolvedPuzzleAnswer(e.target.value)}
                className="w-full bg-zinc-950 border border-white/5 py-3 px-4 rounded-xl text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 transition"
              />
              <span className="text-[9.5px] text-amber-500 font-sans block">• {isRtl ? 'تلميح: يبدأ بحرف X وينتهي بـ TON !' : 'Hint: begins with X and ends with TON!'}</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5 mt-4">
              <button
                onClick={() => {
                  sound.playTap();
                  setShowPuzzleModal(false);
                }}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-705 transition cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSolvePuzzle}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition duration-150 cursor-pointer"
              >
                {isRtl ? 'تقديم الحل' : 'Submit Cipher'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
