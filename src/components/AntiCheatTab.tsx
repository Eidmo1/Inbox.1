import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { sound } from './AudioSynth';
import { 
  Shield, CheckCircle2, AlertTriangle, Play, RefreshCw, Lock, Unlock, 
  UserCheck, Database, History, Eye, EyeOff, UserX, ToggleLeft, ToggleRight, Check,
  Filter, Activity, Search, AlertCircle, Fingerprint, Ban, CheckSquare
} from 'lucide-react';

interface AntiCheatTabProps {
  stats: UserStats;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  language: 'ar' | 'en';
  showAlert?: (message: string, type?: 'success' | 'alert' | 'info') => void;
}

// Pre-populated realistic audit logs of anti-cheat activities
const DEFAULT_LOGS = [
  { id: 'log_1', time: '10 mins ago', type: 'info', user: 'lmr941...', detail_en: 'Fingerprint entropy check: normal device signature.', detail_ar: 'فحص عشوائية البصمة الرقمية: بصمة جهاز طبيعية.' },
  { id: 'log_2', time: '1 hour ago', type: 'warning', user: 'bot_runner_x', detail_en: 'Click-speed spike: 18 taps in 1 sec. Flagged transiently.', detail_ar: 'ارتفاع في سرعة النقر الإلكتروني: 18 نقرة في ثانية. تم وضع علامة مؤقتة.' },
  { id: 'log_3', time: '4 hours ago', type: 'secure', user: 'guest_9021', detail_en: 'Anti-proxy screen: Cloudflare DNS verified without VPN tunneling.', detail_ar: 'فحص البروكسي والـ VPN: تم التحقق عبر خوادم Cloudflare بدون بروكسي.' },
  { id: 'log_4', time: 'yesterday', type: 'alert', user: 'cheater_44', detail_en: 'Multi-account risk: Shared canvas fingers with ID 4402. Blocked.', detail_ar: 'اشتباه تعدد الحسابات: بصمة جهاز مكررة مع حساب رقم 4402. حظر.' },
  { id: 'log_5', time: 'yesterday', type: 'info', user: 'stats_verifier', detail_en: 'Manual override log: Admin sync passed successfully.', detail_ar: 'سجل التخطي اليدوي: تمت مزامنة تخطي المدير بنجاح.' }
];

const INITIAL_FLAGGED_EVENTS = [
  {
    id: 'evt_1',
    timestamp: 'Just now',
    user: '@Kimo_Ton99',
    event: 'Rapid-tap anomalies detected',
    eventAr: 'شذوذ النقر السريع',
    metric: '48 taps/sec (Limit: 15)',
    severity: 'CRITICAL',
    status: 'Blocked Payout',
    statusAr: 'حظر السحب',
  },
  {
    id: 'evt_2',
    timestamp: '3 mins ago',
    user: '@Abdo_Miner',
    event: 'Multiple account connections',
    eventAr: 'اتصالات حسابات متعددة',
    metric: '4 duplicate IPs & same canvas signature',
    severity: 'HIGH',
    status: 'Flagged Account',
    statusAr: 'حساب مشبوه',
  },
  {
    id: 'evt_3',
    timestamp: '12 mins ago',
    user: '@TON_Rich_Man',
    event: 'Auto-Clicker pattern verified',
    eventAr: 'اكتشاف نمط كليكر تلقائي',
    metric: 'Perfect static 50ms interval taps',
    severity: 'HIGH',
    status: 'Flagged Account',
    statusAr: 'حساب مشبوه',
  },
  {
    id: 'evt_4',
    timestamp: '45 mins ago',
    user: '@Eidmo11_fan',
    event: 'Proxy/VPN routing bypass',
    eventAr: 'محاولة تخطي البروكسي/VPN',
    metric: 'Tor exit node server IP mismatch',
    severity: 'MEDIUM',
    status: 'Under Review',
    statusAr: 'قيد المراجعة',
  },
  {
    id: 'evt_5',
    timestamp: '2 hours ago',
    user: '@Hustler_TON',
    event: 'Session spoofing attempt',
    eventAr: 'محاولة تزييف الجلسة الأمنية',
    metric: 'Invalid client hash validation',
    severity: 'CRITICAL',
    status: 'Suspended',
    statusAr: 'معطل مؤقتاً',
  },
  {
    id: 'evt_6',
    timestamp: '4 hours ago',
    user: '@MinerX_999',
    event: 'Rapid-tap anomalies detected',
    eventAr: 'شذوذ النقر السريع',
    metric: '62 taps in 1.2 seconds',
    severity: 'CRITICAL',
    status: 'Blocked Payout',
    statusAr: 'حظر السحب',
  }
];

export default function AntiCheatTab({
  stats,
  setStats,
  language,
  showAlert
}: AntiCheatTabProps) {
  const isRtl = language === 'ar';

  // Sub-tab selection state: 'dashboard' or 'activity_logs'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'activity_logs'>('dashboard');

  // State managers
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fraudLogs, setFraudLogs] = useState(DEFAULT_LOGS);

  // New simulated log addition input
  const [newLogUser, setNewLogUser] = useState('');
  const [newLogDetailEn, setNewLogDetailEn] = useState('');
  const [newLogDetailAr, setNewLogDetailAr] = useState('');
  const [newLogType, setNewLogType] = useState<'info' | 'warning' | 'alert' | 'secure'>('info');

  // Flagged events state for the real-time activity log table
  const [flaggedEvents, setFlaggedEvents] = useState(INITIAL_FLAGGED_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  // Simulate incoming real-time flagged cheat activities occasionally
  useEffect(() => {
    const names = ['@Dmitry_ton', '@Suhail_99', '@Wael_Crypto', '@Nadia_TON', '@Samer_Giga', '@NoBotPls'];
    const anomaliesEn = [
      'Rapid-tap anomalies detected',
      'Multiple account connections',
      'Auto-Clicker pattern verified',
      'Proxy/VPN routing bypass'
    ];
    const anomaliesAr = [
      'شذوذ النقر السريع',
      'اتصالات حسابات متعددة',
      'اكتشاف نمط كليكر تلقائي',
      'محاولة تخطي البروكسي/VPN'
    ];
    const metricsEn = [
      '55 taps/sec (Threshold: 15)',
      '3 parallel connections from identical DeviceId',
      'Rigid 30ms click intervals',
      'High-risk data center proxy IP used'
    ];
    const severities: ('CRITICAL' | 'HIGH' | 'MEDIUM')[] = ['CRITICAL', 'HIGH', 'HIGH', 'MEDIUM'];
    const statuses = ['Blocked Payout', 'Flagged Account', 'Flagged Account', 'Under Review'];
    const statusesAr = ['حظر السحب', 'حساب مشبوه', 'حساب مشبوه', 'قيد المراجعة'];

    const interval = setInterval(() => {
      // Only generate if we are on the tab to avoid unnecessary overhead, but simulated nicely
      const idx = Math.floor(Math.random() * names.length);
      const anomalyIdx = Math.floor(Math.random() * anomaliesEn.length);
      
      const newEvent = {
        id: 'evt_' + Date.now(),
        timestamp: 'Just now',
        user: names[idx],
        event: anomaliesEn[anomalyIdx],
        eventAr: anomaliesAr[anomalyIdx],
        metric: metricsEn[anomalyIdx],
        severity: severities[anomalyIdx],
        status: statuses[anomalyIdx],
        statusAr: statusesAr[anomalyIdx]
      };

      // Add to flagged events
      setFlaggedEvents(prev => [newEvent, ...prev.slice(0, 15)]);

      // Also append to audit ledger log list occasionally
      if (Math.random() > 0.5) {
        const auditLog = {
          id: 'log_' + Date.now(),
          time: 'Just now',
          type: severities[anomalyIdx] === 'CRITICAL' ? 'alert' : 'warning' as any,
          user: names[idx].replace('@', ''),
          detail_en: `${anomaliesEn[anomalyIdx]}: ${metricsEn[anomalyIdx]}`,
          detail_ar: `${anomaliesAr[anomalyIdx]}: ${metricsEn[anomalyIdx]}`
        };
        setFraudLogs(prev => [auditLog, ...prev.slice(0, 10)]);
      }
    }, 25000); // Trigger every 25 seconds

    return () => clearInterval(interval);
  }, []);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === 'mno112233') {
      sound.playUpgrade();
      setIsAdminMode(true);
      setPinError(false);
      showAlert?.(
        isRtl 
          ? '🔑 تم تمكين وضع تخطي وتدقيق مالك البوت بنجاح!' 
          : '🔑 Bot Owner override & audit mode unlocked successfully!', 
        'success'
      );
    } else {
      sound.playError();
      setPinError(true);
      showAlert?.(
        isRtl 
          ? '❌ رمز PIN المدخل غير صحيح! حاول مجدداً.' 
          : '❌ Incorrect Security PIN Code! Access Denied.', 
        'alert'
      );
    }
  };

  const handleTogglePassed = () => {
    sound.playTap();
    const currentPassed = !!stats.antiCheatPassed;
    setStats(prev => ({
      ...prev,
      antiCheatPassed: !currentPassed
    }));
    
    // Add real audit log simulation dynamically
    const customLog = {
      id: 'log_' + Date.now(),
      time: 'Just now',
      type: !currentPassed ? 'secure' : 'warning',
      user: 'Administrator Override',
      detail_en: `Admin manually set antiCheatPassed to ${!currentPassed}.`,
      detail_ar: `قام المدير يدوياً بتغيير حالة التحقق الأمني لـ ${!currentPassed ? 'مقبول' : 'مرفوض'}.`
    };
    setFraudLogs(prev => [customLog, ...prev]);

    showAlert?.(
      isRtl
        ? `⚙️ تم تغيير حالة فحص الأمان يدوياً إلى: ${!currentPassed ? 'مقبول ✅' : 'مرفوض ❌'}`
        : `⚙️ Anti-cheat pass status manually set to: ${!currentPassed ? 'PASSED ✅' : 'FAILED ❌'}`,
      'info'
    );
  };

  const handleToggleFlagged = () => {
    sound.playTap();
    const currentFlagged = !!stats.isAntiCheatFlagged;
    setStats(prev => ({
      ...prev,
      isAntiCheatFlagged: !currentFlagged
    }));

    const customLog = {
      id: 'log_' + Date.now(),
      time: 'Just now',
      type: !currentFlagged ? 'alert' : 'info',
      user: 'Administrator Override',
      detail_en: `Admin manually toggled fraud flag status to ${!currentFlagged}.`,
      detail_ar: `قام المدير يدوياً بتغيير حالة وسم الاحتيال لـ ${!currentFlagged ? 'مشبوه ⚠️' : 'سليم ✅'}.`
    };
    setFraudLogs(prev => [customLog, ...prev]);

    showAlert?.(
      isRtl
        ? `⚙️ تم تغيير وسم الاحتيال يدوياً إلى: ${!currentFlagged ? 'نشط ومشبوه ⚠️' : 'سليم وغير نشط ✅'}`
        : `⚙️ Anti-cheat fraud flag manually toggled to: ${!currentFlagged ? 'SUSPICIOUS ⚠️' : 'CLEAN ✅'}`,
      'info'
    );
  };

  const triggerResetStats = () => {
    sound.playUpgrade();
    setStats(prev => ({
      ...prev,
      antiCheatPassed: false,
      isAntiCheatFlagged: false,
      pepeGiftWithdrawn: false
    }));
    showAlert?.(
      isRtl
        ? '♻️ تم ضبط جميع إعدادات التحقق وقيم الأمان على الإعدادات الافتراضية!'
        : '♻️ Reset successfully. All security flags & bypass statuses returned to fresh defaults.',
      'success'
    );
  };

  const handleRunScanner = () => {
    setIsRefreshing(true);
    sound.playTap();
    setTimeout(() => {
      setIsRefreshing(false);
      sound.playClaim();
      
      // Auto logic matching: If they complied with some stats or didn't cheat:
      const completedTasksCount = stats.tasksCompleted?.length ?? 0;
      const isProbableHuman = completedTasksCount >= 1 || stats.referrals >= 1;
      
      setStats(prev => ({
        ...prev,
        antiCheatPassed: isProbableHuman,
        isAntiCheatFlagged: !isProbableHuman
      }));

      showAlert?.(
        isRtl
          ? '🔍 فحص ذكاء وتكامل أمني: تم رصد وتحليل حركة العقد والبصمة بنجاح!'
          : '🔍 Security Scanner Engine: Analyzed node interaction patterns & browser entropy!',
        'success'
      );
    }, 1500);
  };

  const handleAddNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogUser || (!newLogDetailEn && !newLogDetailAr)) {
      showAlert?.(isRtl ? '⚠️ يرجى تعبئة كافة الحقول المطلوبة!' : '⚠️ Please fill out all required log fields!', 'alert');
      return;
    }
    sound.playClaim();
    const created = {
      id: 'log_' + Date.now(),
      time: 'Just now',
      type: newLogType,
      user: newLogUser,
      detail_en: newLogDetailEn || 'Interactive simulated behavior logged.',
      detail_ar: newLogDetailAr || 'سلوك مراقب تفاعلي مسجل.'
    };
    setFraudLogs(prev => [created, ...prev]);
    setNewLogUser('');
    setNewLogDetailEn('');
    setNewLogDetailAr('');
    showAlert?.(isRtl ? '📝 تم إدراج البلاغ أو السجل بنجاح!' : '📝 Custom log added successfully!', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 text-left select-text">
      
      {/* Tab Header Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="text-amber-500 w-5 h-5 animate-pulse" />
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
              {isRtl ? 'ماسح الأمان ومكافحة الغش' : 'ANTI-CHEAT SECURITY CORE'}
            </h3>
            <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest leading-none mt-1">
              {isRtl ? 'الدرع الوقائي ونظام التدقيق المتقدم' : 'Live Anti-Cheat Auditing & Validation Tool'}
            </p>
          </div>
        </div>

        <div className={`p-1 px-2.5 rounded-full text-[8.5px] font-mono tracking-wider font-extrabold flex items-center gap-1 ${stats.antiCheatPassed ? 'bg-green-500/10 text-green-400 border border-green-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stats.antiCheatPassed ? 'bg-green-400' : 'bg-amber-400 animate-pulse'}`} />
          {stats.antiCheatPassed ? (isRtl ? 'موثق' : 'VERIFIED') : (isRtl ? 'معلق الفحص' : 'PENDING EVALUATION')}
        </div>
      </div>

      {/* Tab Navigation Menu */}
      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
        <button
          onClick={() => { sound.playTap(); setActiveSubTab('dashboard'); }}
          className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer text-center ${activeSubTab === 'dashboard' ? 'bg-amber-500 text-slate-950 font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          {isRtl ? '🛡️ نظرة عامة والتحكم' : '🛡️ Dashboard & Control'}
        </button>
        <button
          onClick={() => { sound.playTap(); setActiveSubTab('activity_logs'); }}
          className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${activeSubTab === 'activity_logs' ? 'bg-amber-500 text-slate-950 font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
        >
          <Activity size={12} className={activeSubTab === 'activity_logs' ? 'animate-pulse' : ''} />
          <span>{isRtl ? '📑 سجل الأنشطة الأمني' : '📑 Activity Logs'}</span>
        </button>
      </div>

      {activeSubTab === 'dashboard' ? (
        <div className="space-y-4 animate-fade-in">
          {/* Main Status Information Board */}
          <div className="bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-950 border border-white/5 rounded-2xl p-4 space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              {/* Status 1: antiCheatPassed */}
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-white/5 text-left">
                <span className="text-[8px] text-zinc-500 block uppercase font-mono tracking-widest mb-1.5">{isRtl ? 'حالة فحص الأمان' : 'Security Pass Status'}</span>
                <div className="flex items-center gap-2">
                  {stats.antiCheatPassed ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <span className="text-xs font-black text-green-400 uppercase font-sans">{isRtl ? 'مكتمل وموثوق' : 'PASSED & CLEAR'}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} className="text-amber-500 shrink-0 animate-pulse" />
                      <span className="text-xs font-black text-amber-400 uppercase font-sans">{isRtl ? 'يحتاج تحقق' : 'ACTION REQUIRED'}</span>
                    </>
                  )}
                </div>
                <p className="text-[8.5px] text-zinc-500 leading-normal mt-1.5">
                  {isRtl 
                    ? 'يسمح بعمليات الصرف التلقائي لعملات PEPE بدون قيود معقدة.' 
                    : 'Enables automatic payout processing for PEPE rewards.'}
                </p>
              </div>

              {/* Status 2: isAntiCheatFlagged */}
              <div className="bg-zinc-950/80 p-3 rounded-xl border border-white/5 text-left">
                <span className="text-[8px] text-zinc-500 block uppercase font-mono tracking-widest mb-1.5">{isRtl ? 'وسم الاحتيال النشط' : 'Fraud Flag Status'}</span>
                <div className="flex items-center gap-2">
                  {stats.isAntiCheatFlagged ? (
                    <>
                      <AlertTriangle size={16} className="text-red-500 shrink-0 animate-bounce" />
                      <span className="text-xs font-black text-red-500 uppercase font-sans">{isRtl ? 'مشبوه ومقيد ⚠️' : 'SUSPICIOUS ACT ⚠️'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <span className="text-xs font-black text-green-400 uppercase font-sans">{isRtl ? 'نظيف وموثوق 🛡️' : 'CLEAN STATUS 🛡️'}</span>
                    </>
                  )}
                </div>
                <p className="text-[8.5px] text-zinc-500 leading-normal mt-1.5">
                  {isRtl 
                    ? 'علامة نشطة توضع تلقائياً عند الاشتباه ببرامج الكليكرز أو تعدد الحسابات.' 
                    : 'Assigned automatically under high tapping rates or multiple IDs.'}
                </p>
              </div>
            </div>

            {/* Action Trigger Scanner */}
            <div className="bg-zinc-950 rounded-xl p-3 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-3 text-left">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-white block">
                  {isRtl ? 'فحص ومصادقة مكافحة الغش الفورية' : 'Instant Device Pattern Validation'}
                </span>
                <span className="text-[8.5px] text-zinc-500 block leading-normal">
                  {isRtl 
                    ? 'اختبار حيوية وتوافق فوري لتحليل تفاعل المتصفح وكشف البوتات والبرامج الخبيثة.'
                    : 'Executes rapid user behavior metrics and browser fingerprint check in real-time.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRunScanner}
                disabled={isRefreshing}
                className="w-full md:w-auto px-4.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-[9.5px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : "animate-spin-slow"} />
                <span>{isRefreshing ? (isRtl ? 'جاري الفحص...' : 'EVALUATING...') : (isRtl ? 'تشغيل فحص حقيقي 🔍' : 'TRIGGER SECURITY SCAN 🔍')}</span>
              </button>
            </div>
          </div>

          {/* Manual Override audit tool for the owner */}
          <div className={`border rounded-2xl p-4.5 space-y-4 ${isAdminMode ? 'bg-gradient-to-r from-neutral-950 via-zinc-900 to-neutral-500/5 border-green-500/20' : 'bg-neutral-900 border-white/5'}`}>
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                {isAdminMode ? <Unlock className="text-green-400 w-4.5 h-4.5 animate-bounce" /> : <Lock className="text-zinc-500 w-4.5 h-4.5" />}
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    {isRtl ? 'لوحة تدقيق وتخطي المالك يدوياً' : 'OWNER MANUAL OVERRIDE TOOL'}
                  </h4>
                  <span className="text-[7.5px] text-zinc-500 font-mono tracking-widest block uppercase mt-0.5">
                    {isAdminMode ? (isRtl ? 'تم إلغاء قفل ميزة المالك' : 'ADMIN ROOT ACCESS LOGGED') : (isRtl ? 'تحتاج رقم مرور PIN' : 'AUTH PIN REQUIRED')}
                  </span>
                </div>
              </div>

              {isAdminMode && (
                <button
                  onClick={() => {
                    sound.playTap();
                    setIsAdminMode(false);
                    setPinInput('');
                    showAlert?.(isRtl ? '🔒 تم إقفال لوحة التعديل والمحاذاة بنجاح!' : '🔒 Locked manual override panel successfully!', 'info');
                  }}
                  className="text-[8px] tracking-wider uppercase font-mono text-zinc-400 hover:text-white bg-zinc-950 p-1 px-2.5 rounded-lg border border-white/5 transition"
                >
                  {isRtl ? 'إغلاق الأمان ✖' : 'Lock Audits ✖'}
                </button>
              )}
            </div>

            {!isAdminMode ? (
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <p className="text-[10px] text-zinc-400 leading-normal">
                  {isRtl 
                    ? 'هذه الميزة حصرية لمالك البوت من أجل تعديل وفحص الأمان يدوياً للمستخدمين والموافقة أو إلغاء أوسام الشبهات بسهولة لتبسيط السحب.'
                    : 'This panel is restricted. Owners can manually toggle user fraud statuses, bypass security gates, and audit live logs directly for debug tests.'}
                </p>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">{isRtl ? 'أدخل الرقم السري للمالك:' : 'Owner Security Pin Code:'}</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="••••••••••••"
                      className={`flex-1 bg-zinc-950 border rounded-xl px-3 py-2 text-xs text-white tracking-widest font-mono outline-none ${pinError ? 'border-red-500/40' : 'border-white/10'}`}
                    />
                    <button
                      type="submit"
                      className="px-4.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wide cursor-pointer transition flex items-center justify-center"
                    >
                      {isRtl ? 'دخول 🔑' : 'UNLOCK 🔑'}
                    </button>
                  </div>
                  {pinError && (
                    <span className="text-[8.5px] text-red-400 font-mono mt-1">
                      {isRtl ? '⚠️ حظر أمني: الرقم السري غير صحيح!' : '⚠️ Incorrect master PIN code! Access denied.'}
                    </span>
                  )}
                </div>
              </form>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <p className="text-[9.5px] text-green-300 bg-green-500/5 p-2.5 rounded-xl border border-green-500/10 leading-relaxed font-mono">
                  {isRtl
                    ? '✔️ يمكنك الآن تعديل وتبديل حالة نظام فحص الأمان وقبول أو رفض حسابك الشخصي يدوياً لاختبار عمليات السحب المباشر من المحفظة بمرونة.'
                    : '✔️ Root access authenticated. You can override your user stats here instantly to preview how the payout button unlocks in the Wallet tab.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Action 1: Toggle antiCheatPassed */}
                  <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 flex flex-col justify-between gap-2 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-400 block font-bold uppercase">{isRtl ? 'حالة التوثيق (antiCheatPassed)' : 'Security Eval Bypass'}</span>
                      <span className="text-[8.5px] text-zinc-500 block">
                        {isRtl ? 'تبديل فحص الأمان واجتياز نظام كشف المغشوشين.' : 'Force verify this account bypassing all rules.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleTogglePassed}
                      className={`w-full py-2 px-3 rounded-lg text-[9.5px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer ${stats.antiCheatPassed ? 'bg-green-500 text-slate-950 hover:bg-green-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {stats.antiCheatPassed ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      <span>{stats.antiCheatPassed ? (isRtl ? 'التخطى نشط (موثق)' : 'ACTIVE (CLEAR)') : (isRtl ? 'غير نشط (معلق)' : 'DEACTIVATED')}</span>
                    </button>
                  </div>

                  {/* Action 2: Toggle isAntiCheatFlagged */}
                  <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 flex flex-col justify-between gap-2 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-400 block font-bold uppercase">{isRtl ? 'وسم الاحتيال (isAntiCheatFlagged)' : 'Fraud Suspension Flag'}</span>
                      <span className="text-[8.5px] text-zinc-500 block">
                        {isRtl ? 'تبديل وضع وسم الاحتيال للمستخدم وتدبيجه بمشتبه به.' : 'Manually flag or unflag this account.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleFlagged}
                      className={`w-full py-2 px-3 rounded-lg text-[9.5px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer ${stats.isAntiCheatFlagged ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {stats.isAntiCheatFlagged ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      <span>{stats.isAntiCheatFlagged ? (isRtl ? 'وسم نشط (شبهة ⚠️)' : 'ACTIVE SUSPICION ⚠️') : (isRtl ? 'وسم غير نشط' : 'DEACTIVATED')}</span>
                    </button>
                  </div>

                  {/* Action 3: Toggle pepeGiftWithdrawn */}
                  <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 flex flex-col justify-between gap-2 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-zinc-400 block font-bold uppercase">{isRtl ? 'سحب الهدية (pepeGiftWithdrawn)' : 'Gift Withdrawn Status'}</span>
                      <span className="text-[8.5px] text-zinc-500 block">
                        {isRtl ? 'تعديل حالة سحب هدية الاشتراك للتبديل لحد السحب 2$ للجميع.' : 'Toggle if user has withdrawn their subscription gift ($2 minimum trigger).'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !stats.pepeGiftWithdrawn;
                        setStats(prev => ({ ...prev, pepeGiftWithdrawn: nextVal }));
                        sound.playTap();
                        showAlert?.(
                          isRtl
                            ? `⚙️ تم تغيير حالة سحب الهدية يدوياً لـ: ${nextVal ? 'تم السحب (الحد 2$ مفعل لكل العملات)' : 'لم تسحب (الحد الافتراضي مفعل)'}`
                            : `⚙️ Manually set gift claimed: ${nextVal ? 'CLAIMED ($2 minimum limit on)' : 'NOT CLAIMED yet ($2 limit off)'}`,
                          'info'
                        );
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-[9.5px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition cursor-pointer ${stats.pepeGiftWithdrawn ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
                    >
                      {stats.pepeGiftWithdrawn ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      <span>{stats.pepeGiftWithdrawn ? (isRtl ? 'تم السحب (الحد 2$)' : 'WITHDRAWN (LIMIT $2)') : (isRtl ? 'لم تسحب' : 'NOT CLAIMED')}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Resets */}
                <div className="pt-2 flex flex-wrap gap-2 justify-between items-center border-t border-white/5">
                  <span className="text-[8.5px] text-zinc-500 font-mono uppercase">{isRtl ? 'عمليات تهيئة سريعة:' : 'System Recovery Quick operations:'}</span>
                  <button
                    type="button"
                    onClick={triggerResetStats}
                    className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 text-[9px] uppercase tracking-wide font-black rounded-lg transition overflow-hidden cursor-pointer"
                  >
                    ♻️ {isRtl ? 'إعادة ضبط قيم الأمان للمستخدم للوضع سليم' : 'RESET SECURITY FIELDS TO STATIC'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Suspected Fraud Logs List */}
          <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <div className="flex items-center gap-1.5">
                <History className="text-amber-500 w-4 h-4" />
                <h4 className="text-xs font-bold text-white uppercase font-display">
                  {isRtl ? 'سجل وكاشف محاولات الاحتيال المشبوهة' : 'FLAGGED AUDIT LEDGER LOGS'}
                </h4>
              </div>
              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/10 rounded-full px-2 py-0.5 font-mono">
                {fraudLogs.length} LOGS
              </span>
            </div>

            <p className="text-[9.5px] text-zinc-500 leading-normal text-left">
              {isRtl 
                ? '💡 هذه السجلات الموثوقة تسجل فوراً في البلوكشين الداخلي للبوت أي تلاعب بالمتصفح، تشغيل الحسابات المتعددة، أو الروبوتات المؤتمتة للحفاظ على نزاهة بيبى.'
                : '💡 Security monitor stream capturing suspicious tap rates, proxy hosts, double-spending or parallel sandbox instances in real-time.'}
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-left">
              {fraudLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-zinc-950/70 border border-white/5 hover:border-white/10 rounded-xl transition space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'alert' ? 'bg-red-500 animate-ping' : log.type === 'warning' ? 'bg-amber-400' : log.type === 'secure' ? 'bg-green-400' : 'bg-zinc-400'}`} />
                      <span className="font-bold text-white font-mono">{log.user}</span>
                    </div>
                    <span className="text-[7.5px] text-zinc-500 font-mono lowercase">{log.time}</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-normal font-sans">
                    {isRtl ? log.detail_ar : log.detail_en}
                  </p>
                </div>
              ))}
            </div>

            {/* Form to insert custom simulated anti-cheat flags & logs */}
            {isAdminMode && (
              <form onSubmit={handleAddNewLog} className="pt-3 border-t border-white/5 space-y-3 animate-fade-in">
                <span className="text-[8.5px] text-green-400 font-mono font-bold block uppercase tracking-wider">
                  {isRtl ? '📝 إضافة بلاغ أو سجل أمني جديد يدوي:' : '📝 ADJOIN MANUALLY GENERATED LOG:'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] text-zinc-500 font-mono uppercase">{isRtl ? 'المستخدم المستهدف:' : 'Target User Name/ID:'}</label>
                    <input
                      type="text"
                      value={newLogUser}
                      onChange={(e) => setNewLogUser(e.target.value)}
                      placeholder="e.g. user_or_id"
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[8px] text-zinc-500 font-mono uppercase">{isRtl ? 'نوع مستوى الخصائص:' : 'Audit Severity Level:'}</label>
                    <select
                      value={newLogType}
                      onChange={(e) => setNewLogType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300"
                    >
                      <option value="info">INFO</option>
                      <option value="warning">WARNING</option>
                      <option value="alert">ALERT / CRITICAL</option>
                      <option value="secure">SECURE SUCCESS</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1 text-left">
                    <label className="text-[8px] text-zinc-500 font-mono uppercase">{isRtl ? 'التفاصيل بالإنجليزية:' : 'Audit Details (English):'}</label>
                    <input
                      type="text"
                      value={newLogDetailEn}
                      onChange={(e) => setNewLogDetailEn(e.target.value)}
                      placeholder="e.g., Suspicious high tapping speed flagged."
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[8px] text-zinc-500 font-mono uppercase">{isRtl ? 'التفاصيل بالعربية:' : 'Audit Details (Arabic):'}</label>
                    <input
                      type="text"
                      value={newLogDetailAr}
                      onChange={(e) => setNewLogDetailAr(e.target.value)}
                      placeholder="مثال: تم إيقاف نشاط بسبب كثرة الحسابات المتزامنة."
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-lg text-[9.5px] uppercase tracking-wide cursor-pointer transition flex items-center justify-center gap-1"
                >
                  <Check size={11} />
                  <span>{isRtl ? 'إدراج السجل الأمني المخصص ⚡' : 'DEPLOY CUSTOM AUDIT EVENT ⚡'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* Real-time Anti-Cheat Activity Log Table view */
        <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4.5 space-y-4 animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-white/5 pb-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Activity size={14} className="text-red-500 animate-pulse" />
                <span>{isRtl ? 'سجل تتبع ومكافحة الغش الفوري' : 'ANTI-CHEAT LIVE EVENT AUDITING'}</span>
              </h4>
              <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest leading-none">
                {isRtl ? 'سجل حقيقي للأنشطة ومصادقة عمليات الكليكرز المتعددة' : 'Real-time ledger of automated clickers & parallel accounts'}
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 text-[8.5px] font-mono bg-zinc-950 border border-white/5 p-1 px-2.5 rounded-full text-red-400">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span>LIVE FEED</span>
            </div>
          </div>

          <p className="text-[9.5px] text-zinc-400 leading-relaxed">
            {isRtl 
              ? 'تراقب هذه اللوحة التفاعلية محاولات الاحتيال، النقر السريع شاذ الوتيرة (rapid-tap anomalies)، وتكرار البصمات (multiple account connections). يحافظ هذا النظام على القيمة الحقيقية للمكافآت والإعلانات عبر فحص حقيقي متواصل.'
              : 'This interactive dashboard tracks automated tap rate spikes, VPN tunneling, and multiple simultaneous browser profiles. It dynamically guards the bot assets from automated sybil farms to ensure maximum yield integrity.'}
          </p>

          {/* Search and Filters bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative flex items-center">
              <Search size={12} className="absolute left-3 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث باسم المستخدم أو نوع المخالفة...' : 'Search username or anomaly...'}
                className="w-full pl-8.5 pr-3 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition placeholder-zinc-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-500 font-mono uppercase shrink-0">{isRtl ? 'الخطورة:' : 'Severity:'}</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 outline-none focus:border-amber-500/30 font-bold"
              >
                <option value="ALL">{isRtl ? 'الكل' : 'ALL'}</option>
                <option value="CRITICAL">{isRtl ? 'حرجة (CRITICAL)' : 'CRITICAL'}</option>
                <option value="HIGH">{isRtl ? 'عالية (HIGH)' : 'HIGH'}</option>
                <option value="MEDIUM">{isRtl ? 'متوسطة (MEDIUM)' : 'MEDIUM'}</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto border border-white/5 rounded-xl bg-zinc-950/40">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-950 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">{isRtl ? 'المستخدم' : 'USERNAME'}</th>
                  <th className="py-2.5 px-3">{isRtl ? 'نوع الانحراف / المخالفة' : 'FLAGGED ANOMALY'}</th>
                  <th className="py-2.5 px-3">{isRtl ? 'المقاييس المسجلة' : 'TRIGGERED METRICS'}</th>
                  <th className="py-2.5 px-3 text-center">{isRtl ? 'مستوى الخطورة' : 'SEVERITY'}</th>
                  <th className="py-2.5 px-3 text-center">{isRtl ? 'الحالة الحالية' : 'STATUS'}</th>
                  <th className="py-2.5 px-3 text-right">{isRtl ? 'إجراءات التدقيق' : 'AUDIT ACTION'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[10px]">
                {flaggedEvents
                  .filter(evt => {
                    const matchesSearch = evt.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      evt.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (isRtl && evt.eventAr.includes(searchQuery));
                    const matchesSeverity = severityFilter === 'ALL' || evt.severity === severityFilter;
                    return matchesSearch && matchesSeverity;
                  })
                  .map((evt) => {
                    const isCritical = evt.severity === 'CRITICAL';
                    const isHigh = evt.severity === 'HIGH';
                    const isResolved = evt.status === 'Resolved / Clean' || evt.status === 'سليم ومبرأ ✅';

                    return (
                      <tr key={evt.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                          <Fingerprint size={12} className="text-zinc-500" />
                          <span>{evt.user}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-zinc-200">
                            {isRtl ? evt.eventAr : evt.event}
                          </span>
                          <span className="block text-[8px] text-zinc-500 font-mono lowercase mt-0.5">{evt.timestamp}</span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 font-mono leading-tight">
                          {evt.metric}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black ${isCritical ? 'bg-red-500/15 text-red-400 border border-red-500/10' : isHigh ? 'bg-amber-500/15 text-amber-400 border border-amber-500/10' : 'bg-zinc-500/15 text-zinc-300 border border-white/5'}`}>
                            {evt.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black ${isResolved ? 'bg-green-500/10 text-green-400 border border-green-500/20' : isCritical ? 'bg-red-500/10 text-red-400 border border-red-500/10' : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'}`}>
                            {isRtl ? evt.statusAr || evt.status : evt.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isResolved ? (
                              <>
                                <button
                                  onClick={() => {
                                    sound.playUpgrade();
                                    setFlaggedEvents(prev => prev.map(e => e.id === evt.id ? { ...e, status: 'Resolved / Clean', statusAr: 'سليم ومبرأ ✅' } : e));
                                    showAlert?.(
                                      isRtl 
                                        ? `✅ تم حل وتبرئة المستخدم ${evt.user} وإلغاء الوسم!` 
                                        : `✅ Successfully resolved and exonerated user ${evt.user}!`, 
                                      'success'
                                    );
                                  }}
                                  className="px-2 py-1 bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-slate-950 rounded text-[8px] font-bold uppercase transition"
                                  title={isRtl ? 'تبرئة وحل المخالفة' : 'Resolve Anomaly'}
                                >
                                  {isRtl ? 'حل تبرئة' : 'Exonerate'}
                                </button>
                                <button
                                  onClick={() => {
                                    sound.playError();
                                    setFlaggedEvents(prev => prev.map(e => e.id === evt.id ? { ...e, status: 'Blocked Payout', statusAr: 'حظر السحب 🚫' } : e));
                                    showAlert?.(
                                      isRtl 
                                        ? `🚫 تم تأكيد الحظر الدائم للسحب لـ ${evt.user}!` 
                                        : `🚫 permanent withdrawal ban applied for ${evt.user}!`, 
                                      'alert'
                                    );
                                  }}
                                  className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded text-[8px] font-bold uppercase transition"
                                  title={isRtl ? 'تأكيد حظر السحب' : 'Confirm Payout Block'}
                                >
                                  {isRtl ? 'تأكيد حظر' : 'Block Payout'}
                                </button>
                              </>
                            ) : (
                              <span className="text-[8px] font-mono text-green-400 flex items-center gap-1">
                                <CheckSquare size={10} />
                                <span>{isRtl ? 'مكتمل' : 'RESOLVED'}</span>
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          
          {/* Quick Stats banner */}
          <div className="grid grid-cols-2 gap-3.5 bg-zinc-950 p-3.5 rounded-xl border border-white/5">
            <div className="text-left">
              <span className="text-[8px] text-zinc-500 uppercase font-mono block tracking-wider">{isRtl ? 'إجمالي الأحداث المعالجة' : 'TOTAL EVENT EVALUATIONS'}</span>
              <span className="text-lg font-black text-white font-sans">{flaggedEvents.length}</span>
            </div>
            <div className="text-left">
              <span className="text-[8px] text-zinc-500 uppercase font-mono block tracking-wider">{isRtl ? 'المحاولات الحرجة المحظورة' : 'CRITICAL SEVERITY THWARTED'}</span>
              <span className="text-lg font-black text-red-500 font-sans">
                {flaggedEvents.filter(e => e.severity === 'CRITICAL').length}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
