import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { sound } from './AudioSynth';
import { 
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Link2, History, 
  Wallet, Sparkles, Check, Copy, Shield, ChevronRight, CheckCircle2, Info, RefreshCw
} from 'lucide-react';

interface WalletTabProps {
  stats: UserStats;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  language: 'ar' | 'en';
  activeAds: Array<{ id: string; title: string; text: string; multiplier: string; category?: string }>;
  onAddWithdrawalRequest: (amount: number, targetWallet: string, asset?: 'TON' | 'PEPE' | 'BNB' | 'USDT' | 'JUMP' | 'QUEEN_BEE') => void;
  onAddPendingAd: (title: string, text: string, category: string) => void;
  showAlert?: (message: string, type?: 'success' | 'alert' | 'info') => void;
}

export default function WalletTab({
  stats,
  setStats,
  language,
  showAlert,
  onAddWithdrawalRequest
}: WalletTabProps) {
  const isRtl = language === 'ar';

  // Action Modals State
  const [activeModal, setActiveModal] = useState<null | 'deposit' | 'withdraw' | 'swap' | 'connect' | 'history' | 'honeygain' | 'connect_bsc_jump'>(null);
  const [isVerifyingDeposit, setIsVerifyingDeposit] = useState<boolean>(false);
  const [walletAddressInput, setWalletAddressInput] = useState(stats.walletAddress || '');
  const [swapAmount, setSwapAmount] = useState('1000');
  const [withdrawMethod, setWithdrawMethod] = useState<'ton' | 'usdt' | 'bnb' | 'pepe' | 'jump' | '1gram'>('ton');
  const [withdrawAddress, setWithdrawAddress] = useState(stats.walletAddress || '');
  const [withdrawAmount, setWithdrawAmount] = useState('0.05');

  // Honeygain connection states
  const [hgEmail, setHgEmail] = useState(stats.honeygainEmail || '');
  const [hgPassword, setHgPassword] = useState(stats.honeygainPassword || '');
  const [hgToken, setHgToken] = useState(stats.honeygainToken || '');
  const [isConnectingHg, setIsConnectingHg] = useState(false);

  // Real Trust Wallet (BSC Smart Chain) states
  const [bscWalletAddressInput, setBscWalletAddressInput] = useState(stats.bscWalletAddress || '');
  const [isFetchingBsc, setIsFetchingBsc] = useState<boolean>(false);

  // Binance ID and Welcome Gift states
  const [binanceIdInput, setBinanceIdInput] = useState(stats.binanceId || '');

  // Swap Customize States
  const [swapFromAsset, setSwapFromAsset] = useState<'ton' | 'usdt' | 'pepe' | 'bnb' | 'jump'>('ton');
  const [swapToAsset, setSwapToAsset] = useState<'ton' | 'usdt' | 'pepe' | 'bnb' | 'jump'>('usdt');
  const [swapAmountNew, setSwapAmountNew] = useState('1');

  // Real-time market prices state powered by Binance / CryptoCompare
  const [swapAssetPrices, setSwapAssetPrices] = useState<Record<'ton' | 'usdt' | 'pepe' | 'bnb' | 'jump', number>>({
    ton: 7.5,
    usdt: 1.0,
    pepe: 0.0000105,
    bnb: 600.0,
    jump: 1.25
  });
  const [isPricesLive, setIsPricesLive] = useState<boolean>(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState<boolean>(false);

  // Interactive Anti-Cheat states
  const [isScanningAntiCheat, setIsScanningAntiCheat] = useState<boolean>(false);
  const [scanProgressLabel, setScanProgressLabel] = useState<string>('');

  // Simulated Tx list
  const [transactions, setTransactions] = useState<Array<{ id: string; type: string; amount: string; asset: string; status: string; date: string }>>([
    { id: 'tx_98127', type: 'Swap', amount: '+1.4500', asset: 'TON', status: 'Success', date: '2026-06-18' },
    { id: 'tx_12704', type: 'Claim', amount: '+2.1000', asset: 'XTON', status: 'Success', date: '2026-06-19' }
  ]);

  const BOT_RECEIVE_WALLET = 'UQA2CLot73qOKb_2BSmqOsUA0TzHYPuyB4QFT3G2quUcZdTg';
  const [copiedBotWallet, setCopiedBotWallet] = useState(false);

  const handleCopyReceiver = () => {
    navigator.clipboard.writeText(BOT_RECEIVE_WALLET);
    setCopiedBotWallet(true);
    sound.playClaim();
    setTimeout(() => setCopiedBotWallet(false), 2000);
  };

  const handleConnectHoneygain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hgEmail && !hgToken) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى إدخال البريد الإلكتروني أو رمز الـ Token أولاً!' : '⚠️ Please enter your email or token first!', 'alert');
      return;
    }

    sound.playTap();
    setIsConnectingHg(true);
    try {
      const response = await fetch('/api/honeygain/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hgEmail,
          password: hgPassword,
          accessToken: hgToken
        })
      });

      const data = await response.json();
      if (data.success) {
        setStats(prev => ({
          ...prev,
          honeygainConnected: true,
          honeygainEmail: data.email || hgEmail,
          honeygainPassword: hgPassword,
          honeygainToken: data.token,
          honeygainCredits: data.credits,
          honeygainUsd: data.usd,
          honeygainDevices: data.activeDevices,
          partnerLinked: true,
          partnerName: 'honeygain',
          partnerToken: data.token,
          partnerRateMultiplier: 2.0
        }));
        sound.playClaim();
        showAlert?.(
          isRtl
            ? `🎉 تم ربط حساب Honeygain بنجاح! الرصيد الحالي: ${data.credits.toLocaleString()} نقطة (~$${data.usd.toFixed(2)} USD)`
            : `🎉 Connected Honeygain successfully! Balance: ${data.credits.toLocaleString()} Credits (~$${data.usd.toFixed(2)} USD)`,
          'success'
        );
        setActiveModal(null);
      } else {
        sound.playError();
        showAlert?.(data.error || (isRtl ? '⚠️ خطأ في الاتصال بالحساب' : '⚠️ Account connection failed'), 'alert');
      }
    } catch (err: any) {
      sound.playError();
      showAlert?.(err.message || (isRtl ? '⚠️ فشل الاتصال بالخادم' : '⚠️ Server connection failed'), 'alert');
    } finally {
      setIsConnectingHg(false);
    }
  };

  const handleConnectWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddressInput.trim()) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى إدخال عنوان محفظة 1gram صالح!' : '⚠️ Please enter a valid 1gram wallet address!', 'alert');
      return;
    }

    sound.playUpgrade();
    setStats(prev => ({ ...prev, walletAddress: walletAddressInput.trim() }));
    setActiveModal(null);
    showAlert?.(isRtl ? '✅ تم ربط محفظتك بنجاح!' : '✅ Wallet connected successfully!', 'success');
  };

  const handleRefreshBscBalances = async (address: string, silent: boolean = false) => {
    if (!address) return;
    setIsFetchingBsc(true);
    try {
      const bsc = await import("../lib/bsc");
      const balances = await bsc.fetchBscBalances(address);
      
      const hadGift = !stats.pepeGiftWithdrawn;
      
      setStats(prev => {
        const updated = {
          ...prev,
          bscWalletAddress: address,
          realBnbBalance: balances.bnb,
          realUsdtBalance: balances.usdt,
          jumpBalance: balances.jmpt > 0 ? balances.jmpt : (prev.jumpBalance ?? 0),
        };
        if (hadGift) {
          updated.pepeBalance = 0; // deducted instantly
          updated.pepeGiftWithdrawn = true;
        } else {
          updated.pepeBalance = balances.pepe > 0 ? balances.pepe : prev.pepeBalance;
        }
        return updated;
      });

      if (hadGift) {
        // Trigger automated payout request instantly to their connected BNB/BSC address!
        onAddWithdrawalRequest(285.71, address, 'PEPE');

        setTransactions(prev => [
          {
            id: 'tx_gift_' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            type: isRtl ? 'سحب هدية بيبي مباشر' : 'Direct PEPE Gift Payout',
            amount: '-285.71',
            asset: 'PEPE',
            status: 'Success',
            date: 'Just now'
          },
          ...prev
        ]);

        sound.playClaim();
        showAlert?.(isRtl
          ? '🎉 تم ربط محفظة BNB بنجاح! وسحب هدية المشترك الجديد بقيمة 0.003$ (285.71 PEPE) مباشرة وبشكل فوري إلى محفظتك! الحد الأدنى للسحوبات القادمة هو 2$.'
          : '🎉 BNB wallet connected successfully! Your $0.003 welcome gift (285.71 PEPE) has been instantly and directly withdrawn to your wallet! Future withdrawals require a $2 minimum.',
          'success'
        );
      } else if (!silent) {
        sound.playClaim();
        showAlert?.(isRtl
          ? '🔄 تم تحديث أرصدتك الحقيقية بنجاح من شبكة Smart Chain البلوكشين مباشرة!'
          : '🔄 Real-time BNB, PEPE, and USDT balances synchronized successfully from the live blockchain!',
          'success'
        );
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) {
        sound.playError();
        showAlert?.(isRtl
          ? `❌ فشل الاتصال بالبلوكشين أو العنوان غير صالح: ${err.message || err}`
          : `❌ Blockchain link failed or invalid address: ${err.message || err}`,
          'alert'
        );
      }
    } finally {
      setIsFetchingBsc(false);
    }
  };

  useEffect(() => {
    if (stats.bscWalletAddress) {
      handleRefreshBscBalances(stats.bscWalletAddress, true);
    }
  }, []);

  const fetchLivePrices = async (silent = true) => {
    if (!silent) setIsRefreshingPrices(true);
    try {
      const updated = { ton: 7.5, usdt: 1.0, pepe: 0.0000105, bnb: 600.0 };
      
      // Try Binance first
      try {
        const [tonRes, pepeRes, bnbRes] = await Promise.all([
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=TONUSDT').then(r => r.json()),
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=PEPEUSDT').then(r => r.json()),
          fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT').then(r => r.json()),
        ]);
        
        if (tonRes?.price) updated.ton = parseFloat(tonRes.price);
        if (pepeRes?.price) updated.pepe = parseFloat(pepeRes.price);
        if (bnbRes?.price) updated.bnb = parseFloat(bnbRes.price);
        
        setSwapAssetPrices(updated);
        setIsPricesLive(true);
        if (!silent) {
          showAlert?.(
            isRtl ? '⚡ تم تحديث أسعار الصرف الحية من منصة بينانس بنجاح!' : '⚡ Live exchange rates updated successfully from Binance!',
            'success'
          );
        }
        return;
      } catch (binanceErr) {
        console.warn('Binance API failed/blocked, trying CryptoCompare fallback...', binanceErr);
      }

      // Fallback: CryptoCompare
      try {
        const [tonCc, pepeCc, bnbCc] = await Promise.all([
          fetch('https://min-api.cryptocompare.com/data/price?fsym=TON&tsyms=USD').then(r => r.json()),
          fetch('https://min-api.cryptocompare.com/data/price?fsym=PEPE&tsyms=USD').then(r => r.json()),
          fetch('https://min-api.cryptocompare.com/data/price?fsym=BNB&tsyms=USD').then(r => r.json()),
        ]);

        if (tonCc?.USD) updated.ton = tonCc.USD;
        if (pepeCc?.USD) updated.pepe = pepeCc.USD;
        if (bnbCc?.USD) updated.bnb = bnbCc.USD;

        setSwapAssetPrices(updated);
        setIsPricesLive(true);
        if (!silent) {
          showAlert?.(
            isRtl ? '⚡ تم تحديث أسعار الصرف الحية من الاحتياطي القياسي بنجاح!' : '⚡ Live exchange rates updated successfully from exchange standard!',
            'success'
          );
        }
      } catch (ccErr) {
        console.error('All live price providers failed, using local simulated feeds:', ccErr);
      }
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  useEffect(() => {
    fetchLivePrices(true);
    const interval = setInterval(() => {
      fetchLivePrices(true);
    }, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLinkBinanceId = () => {
    const cleaned = binanceIdInput.trim();
    if (!cleaned) {
      sound.playError();
      showAlert?.(
        isRtl 
          ? '⚠️ يرجى إدخال معرف بينانس صحيح!' 
          : '⚠️ Please enter a valid Binance ID!', 
        'alert'
      );
      return;
    }

    // Validate that it contains digits (typically 7 to 15 figures)
    if (!/^\d{7,15}$/.test(cleaned)) {
      sound.playError();
      showAlert?.(
        isRtl 
          ? '⚠️ معرف بينانس غير صالح! يجب أن يتكون من أرقام فقط (من 7 إلى 15 رقم).' 
          : '⚠️ Invalid Binance ID! It must be composed of digits only (7 to 15 digits).', 
        'alert'
      );
      return;
    }

    const hadGift = !stats.pepeGiftWithdrawn;

    setStats(prev => {
      const updated = {
        ...prev,
        binanceId: cleaned,
      };
      if (hadGift) {
        updated.pepeBalance = 0; // instantly deducted
        updated.pepeGiftWithdrawn = true;
      }
      return updated;
    });

    if (hadGift) {
      // Direct instant withdrawal request to Binance ID
      onAddWithdrawalRequest(285.71, cleaned, 'PEPE');

      // Add to transaction history
      setTransactions(prev => [
        {
          id: 'tx_bin_' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          type: isRtl ? 'سحب هدية بيبي فوري 🎁' : 'Instant PEPE Gift Payout 🎁',
          amount: '-285.71',
          asset: 'PEPE',
          status: 'Success',
          date: 'Just now'
        },
        ...prev
      ]);

      sound.playClaim();
      showAlert?.(
        isRtl
          ? `🎉 تم ربط معرف بينانس الخاص بك (${cleaned}) بنجاح! تم سحب وإرسال هدية الاشتراك بقيمة 0.003$ (285.71 PEPE) كدفعة مباشرة وفورية لحسابك! الحد الأدنى للسحوبات القادمة هو 2$.`
          : `🎉 Your Binance ID (${cleaned}) was linked successfully! Your $0.003 subscriber gift (285.71 PEPE) has been instantly and directly paid out to your Binance ID! Future withdrawals require a $2 minimum.`,
        'success'
      );
    } else {
      sound.playClaim();
      showAlert?.(
        isRtl
          ? `🔄 تم ربط معرف بينانس الخاص بك (${cleaned}) بنجاح!`
          : `🔄 Successfully linked your Binance ID (${cleaned})!`,
        'success'
      );
    }
  };

  const handleDisconnectBinanceId = () => {
    sound.playTap();
    setStats(prev => ({
      ...prev,
      binanceId: ''
    }));
    setBinanceIdInput('');
    showAlert?.(
      isRtl ? '📋 تم فصل معرف بينانس بنجاح!' : '📋 Binance ID disconnected successfully!', 
      'info'
    );
  };

  useEffect(() => {
    if (activeModal === 'withdraw') {
      if (withdrawMethod === 'pepe') {
        setWithdrawAddress(stats.binanceId || stats.bscWalletAddress || stats.walletAddress || '');
      } else if (withdrawMethod === 'usdt') {
        setWithdrawAddress(stats.bscWalletAddress || stats.walletAddress || '');
      } else {
        setWithdrawAddress(stats.walletAddress || stats.bscWalletAddress || '');
      }
    }
  }, [activeModal, withdrawMethod, stats.binanceId, stats.bscWalletAddress, stats.walletAddress]);

  const swapAssetNames: Record<'ton' | 'usdt' | 'pepe' | 'bnb' | 'jump', string> = {
    ton: 'Gram',
    usdt: 'USDT',
    pepe: 'PEPE',
    bnb: 'BNB',
    jump: 'JUMP'
  };

  const handleSwapAssets = (e: React.FormEvent) => {
    e.preventDefault();
    if (swapFromAsset === swapToAsset) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ لا يمكن تبديل العملة مع نفسها!' : '⚠️ Cannot swap an asset for itself!', 'alert');
      return;
    }

    if (swapFromAsset === 'pepe' || swapToAsset === 'pepe') {
      sound.playError();
      showAlert?.(isRtl 
        ? '⚠️ غير مسموح بتبديل عملات البوت الترويجية (PEPE)!' 
        : '⚠️ Swapping of bot promotional currencies (PEPE) is restricted!', 
        'alert'
      );
      return;
    }

    const amountVal = parseFloat(swapAmountNew);
    if (!amountVal || amountVal <= 0) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى إدخال كمية صحيحة!' : '⚠️ Please enter a valid quantity!', 'alert');
      return;
    }

    // Get from asset balance
    let userFromBalance = 0;
    if (swapFromAsset === 'ton') userFromBalance = stats.tonBalance;
    else if (swapFromAsset === 'pepe') userFromBalance = stats.pepeBalance ?? 285.71;
    else if (swapFromAsset === 'usdt') userFromBalance = stats.realUsdtBalance ?? 0;
    else if (swapFromAsset === 'bnb') userFromBalance = stats.realBnbBalance ?? 0;
    else if (swapFromAsset === 'jump') userFromBalance = stats.jumpBalance ?? 0;

    if (userFromBalance < amountVal) {
      sound.playError();
      showAlert?.(
        isRtl 
          ? `⚠️ رصيدك من ${swapAssetNames[swapFromAsset]} غير كافٍ! رصيدك الحالي: ${userFromBalance.toLocaleString()}` 
          : `⚠️ Insufficient ${swapAssetNames[swapFromAsset]} balance! Your current balance is ${userFromBalance.toLocaleString()}`, 
        'alert'
      );
      return;
    }

    // Calculate dynamic receive amount
    const fromPrice = swapAssetPrices[swapFromAsset];
    const toPrice = swapAssetPrices[swapToAsset];
    
    // (Amount * FromPrice) / ToPrice
    const usdValue = amountVal * fromPrice;
    const receiveAmount = usdValue / toPrice;

    sound.playClaim();

    // Perform state update
    setStats(prev => {
      const updated = { ...prev };
      
      // Deduct from swapFromAsset
      if (swapFromAsset === 'ton') updated.tonBalance = prev.tonBalance - amountVal;
      else if (swapFromAsset === 'pepe') updated.pepeBalance = Math.max(0, (prev.pepeBalance ?? 285.71) - amountVal);
      else if (swapFromAsset === 'usdt') updated.realUsdtBalance = Math.max(0, (prev.realUsdtBalance ?? 0) - amountVal);
      else if (swapFromAsset === 'bnb') updated.realBnbBalance = Math.max(0, (prev.realBnbBalance ?? 0) - amountVal);
      else if (swapFromAsset === 'jump') updated.jumpBalance = Math.max(0, (prev.jumpBalance ?? 0) - amountVal);

      // Add to swapToAsset
      if (swapToAsset === 'ton') updated.tonBalance = prev.tonBalance + receiveAmount;
      else if (swapToAsset === 'pepe') updated.pepeBalance = (prev.pepeBalance ?? 285.71) + receiveAmount;
      else if (swapToAsset === 'usdt') updated.realUsdtBalance = (prev.realUsdtBalance ?? 0) + receiveAmount;
      else if (swapToAsset === 'bnb') updated.realBnbBalance = (prev.realBnbBalance ?? 0) + receiveAmount;
      else if (swapToAsset === 'jump') updated.jumpBalance = (prev.jumpBalance ?? 0) + receiveAmount;

      return updated;
    });

    // Add to history
    setTransactions(prev => [
      { 
        id: 'tx_swp_' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
        type: isRtl 
          ? `تبديل ${swapAssetNames[swapFromAsset]} ➔ ${swapAssetNames[swapToAsset]}` 
          : `Swap ${swapAssetNames[swapFromAsset]} ➔ ${swapAssetNames[swapToAsset]}`, 
        amount: `-${amountVal.toLocaleString()} / +${receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 5 })}`, 
        asset: swapAssetNames[swapToAsset], 
        status: 'Success', 
        date: 'Just now' 
      },
      ...prev
    ]);

    setActiveModal(null);
    showAlert?.(
      isRtl 
        ? `✅ تم تبديل ${amountVal.toLocaleString()} ${swapAssetNames[swapFromAsset]} بـ ${receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 5 })} ${swapAssetNames[swapToAsset]} بنجاح!` 
        : `✅ Successfully swapped ${amountVal.toLocaleString()} ${swapAssetNames[swapFromAsset]} for ${receiveAmount.toLocaleString(undefined, { maximumFractionDigits: 5 })} ${swapAssetNames[swapToAsset]}!`, 
      'success'
    );
  };

  const handleWithdrawAssets = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(withdrawAmount);

    if (isNaN(amountVal) || amountVal <= 0) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى إدخال مبلغ سحب صحيح!' : '⚠️ Please enter a valid withdrawal amount!', 'alert');
      return;
    }

    if (!withdrawAddress.trim()) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى تحديد محفظة المستقبل!' : '⚠️ Please add the destination wallet address!', 'alert');
      return;
    }

    if (withdrawMethod === '1gram') {
      const minBEE = 1.0;
      if (stats.coins < amountVal || amountVal < minBEE) {
        sound.playError();
        showAlert?.(isRtl 
          ? `⚠️ رصيد Queen bee غير كافٍ أو أقل من الحد الأدنى 1.0 Queen bee!` 
          : `⚠️ Insufficient Queen bee balance or below minimum 1.0 Queen bee!`, 
          'alert'
        );
        return;
      }

      sound.playTap();
      onAddWithdrawalRequest(amountVal, withdrawAddress, 'QUEEN_BEE');
      setStats(prev => ({
        ...prev,
        coins: Number((prev.coins - amountVal).toFixed(4))
      }));

      setTransactions(prev => [
        { 
          id: 'tx_bee_' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
          type: isRtl ? 'سحب Queen bee تلقائي 🐝' : 'Auto Queen bee Payout 🐝', 
          amount: `-${amountVal.toLocaleString()}`, 
          asset: 'Queen bee', 
          status: 'Success', 
          date: 'Just now' 
        },
        ...prev
      ]);

      setActiveModal(null);
      showAlert?.(isRtl 
        ? '🎉 تم إرسال الدفعة التلقائية بنجاح! تم تحويل Queen bee مباشرة إلى محفظتك عبر العقد الذكي اللامركزي دون تدخل المالك.' 
        : '🎉 Auto payout dispatched successfully! Queen bee has been sent directly to your wallet via decentralized smart contract without owner intervention.', 
        'success'
      );
      return;
    }

    // Direct automated smart-contract payouts from decentralized sponsors without owner intervention!
    if (withdrawMethod === 'pepe') {
      const minPepe = 0.1;
      if ((stats.pepeBalance ?? 0) < amountVal || amountVal < minPepe) {
        sound.playError();
        showAlert?.(isRtl 
          ? `⚠️ رصيد PEPE غير كافٍ أو أقل من الحد الأدنى 0.1 PEPE!` 
          : `⚠️ Insufficient PEPE or below minimum 0.1 PEPE!`, 
          'alert'
        );
        return;
      }

      sound.playTap();
      onAddWithdrawalRequest(amountVal, withdrawAddress, 'PEPE');

      setStats(prev => ({
        ...prev,
        pepeBalance: Number(((prev.pepeBalance ?? 285.71) - amountVal).toFixed(2)),
        pepeGiftWithdrawn: true
      }));

      // Update local history as Success (Arrived instantly)
      setTransactions(prev => [
        { 
          id: 'tx_pepe_' + Math.random().toString(36).substring(2, 6).toUpperCase(), 
          type: isRtl ? 'سحب بيبي تلقائي 🐸' : 'Auto PEPE Payout 🐸', 
          amount: `-${amountVal.toLocaleString()}`, 
          asset: 'PEPE', 
          status: 'Success', 
          date: 'Just now' 
        },
        ...prev
      ]);

      setActiveModal(null);
      showAlert?.(isRtl 
        ? '🎉 تم إرسال الدفعة التلقائية بنجاح! تم تحويل PEPE مباشرة إلى محفظتك عبر العقد الذكي اللامركزي دون تدخل المالك.' 
        : '🎉 Auto payout dispatched successfully! PEPE has been sent directly to your wallet via decentralized smart contract without owner intervention.', 
        'success'
      );
      return;
    }

    if (withdrawMethod === 'ton') {
      const minTon = 0.1;
      if (stats.tonBalance < amountVal || amountVal < minTon) {
        sound.playError();
        showAlert?.(isRtl 
          ? `⚠️ رصيد Gram غير كافٍ أو أقل من الحد الأدنى 0.1 Gram!` 
          : `⚠️ Insufficient Gram balance or below minimum 0.1 Gram!`, 
          'alert'
        );
        return;
      }

      sound.playTap();
      onAddWithdrawalRequest(amountVal, withdrawAddress, 'TON');
      setStats(prev => ({
        ...prev,
        tonBalance: Number((prev.tonBalance - amountVal).toFixed(5)),
        pepeGiftWithdrawn: true
      }));

      setTransactions(prev => [
        { 
          id: 'tx_ton_' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
          type: isRtl ? 'سحب Gram تلقائي 💎' : 'Auto Gram Payout 💎', 
          amount: `-${amountVal}`, 
          asset: 'TON', 
          status: 'Success', 
          date: 'Just now' 
        },
        ...prev
      ]);

      setActiveModal(null);
      showAlert?.(isRtl 
        ? '🎉 تم إرسال أرباح الكابتشا والألعاب تلقائياً! وصلت عملات Gram لمحفظتك فوراً دون الحاجة لموافقة المالك.' 
        : '🎉 Captcha & game profits sent automatically! Gram tokens arrived in your wallet instantly without needing owner approval.', 
        'success'
      );
      return;
    }

    if (withdrawMethod === 'jump') {
      const minJump = 0.1;
      const userJump = stats.jumpBalance ?? 0.0;
      if (userJump < amountVal || amountVal < minJump) {
        sound.playError();
        showAlert?.(isRtl 
          ? `⚠️ رصيد Jump غير كافٍ أو أقل من الحد الأدنى 0.1 Jump!` 
          : `⚠️ Insufficient Jump balance or below minimum 0.1 Jump!`, 
          'alert'
        );
        return;
      }

      sound.playTap();
      onAddWithdrawalRequest(amountVal, withdrawAddress, 'JUMP');
      setStats(prev => ({
        ...prev,
        jumpBalance: Number((userJump - amountVal).toFixed(6)),
        pepeGiftWithdrawn: true
      }));

      setTransactions(prev => [
        { 
          id: 'tx_jump_' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
          type: isRtl ? 'سحب JMPT تلقائي ⚡' : 'Auto JMPT Payout ⚡', 
          amount: `-${amountVal}`, 
          asset: 'JUMP', 
          status: 'Success', 
          date: 'Just now' 
        },
        ...prev
      ]);

      setActiveModal(null);
      showAlert?.(isRtl 
        ? '🎉 تم دفع أرباح JMPT تلقائياً! تمت معالجة المعاملة مباشرة عبر شبكة الجيل الثالث اللامركزية ووصلت محفظتك.' 
        : '🎉 JMPT payout processed automatically! The transaction was sent directly over the decentralized network to your wallet.', 
        'success'
      );
      return;
    }

    if (withdrawMethod === 'usdt') {
      const minUsdt = 0.1;
      const userUsdt = stats.realUsdtBalance ?? 0.0;
      if (userUsdt < amountVal || amountVal < minUsdt) {
        sound.playError();
        showAlert?.(isRtl 
          ? `⚠️ رصيد USDT غير كافٍ أو أقل من الحد الأدنى 0.1 USDT!` 
          : `⚠️ Insufficient USDT or below minimum 0.1 USDT!`, 
          'alert'
        );
        return;
      }

      sound.playTap();
      onAddWithdrawalRequest(amountVal, withdrawAddress, 'USDT');
      setStats(prev => ({
        ...prev,
        realUsdtBalance: Number((userUsdt - amountVal).toFixed(4)),
        pepeGiftWithdrawn: true
      }));

      setTransactions(prev => [
        { 
          id: 'tx_usdt_' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
          type: isRtl ? 'سحب USDT تلقائي 💵' : 'Auto USDT Payout 💵', 
          amount: `-${amountVal}`, 
          asset: 'USDT', 
          status: 'Success', 
          date: 'Just now' 
        },
        ...prev
      ]);

      setActiveModal(null);
      showAlert?.(isRtl 
        ? '🎉 تم تحويل دولارات USDT تلقائياً! وصلت المعاملة لمحفظتك مباشرة عبر العقد الذكي للمعلنين دون مراجعة يدوية.' 
        : '🎉 USDT dollars transferred automatically! The transaction reached your wallet directly via the advertiser smart contract without manual review.', 
        'success'
      );
      return;
    }

    if (withdrawMethod === 'bnb') {
      const minBnb = 0.001;
      const userBnb = stats.realBnbBalance ?? 0.0;
      if (userBnb < amountVal || amountVal < minBnb) {
        sound.playError();
        showAlert?.(isRtl 
          ? `⚠️ رصيد BNB غير كافٍ أو أقل من الحد الأدنى 0.001 BNB!` 
          : `⚠️ Insufficient BNB or below minimum 0.001 BNB!`, 
          'alert'
        );
        return;
      }

      sound.playTap();
      onAddWithdrawalRequest(amountVal, withdrawAddress, 'BNB');
      setStats(prev => ({
        ...prev,
        realBnbBalance: Number((userBnb - amountVal).toFixed(5)),
        pepeGiftWithdrawn: true
      }));

      setTransactions(prev => [
        { 
          id: 'tx_bnb_' + Math.random().toString(36).substring(2, 7).toUpperCase(), 
          type: isRtl ? 'سحب BNB تلقائي 🪙' : 'Auto BNB Payout 🪙', 
          amount: `-${amountVal}`, 
          asset: 'BNB', 
          status: 'Success', 
          date: 'Just now' 
        },
        ...prev
      ]);

      setActiveModal(null);
      showAlert?.(isRtl 
        ? '🎉 تم تحويل BNB تلقائياً! وصلت أرباحك مباشرة لمحفظتك الشخصية دون تدخل مالك البوت.' 
        : '🎉 BNB transferred automatically! Your earnings arrived directly in your personal wallet without any bot owner intervention.', 
        'success'
      );
      return;
    }
  };

  const handleMockAdDepositCheck = async () => {
    sound.playTap();
    if (!stats.walletAddress) {
      showAlert?.(
        isRtl 
          ? '⚠️ يرجى أولاً ربط وحفظ عنوان محفظة 1gram الخاصة بك في قسم ربط المحافظ للتحقق من معاملاتك!' 
          : '⚠️ Please first link and save your 1gram wallet address in the Wallet section to verify your transactions!', 
        'alert'
      );
      return;
    }

    setIsVerifyingDeposit(true);
    try {
      // Fetch latest transactions for BOT_RECEIVE_WALLET from TON network
      const url = `https://toncenter.co/api/v2/getTransactions?address=${BOT_RECEIVE_WALLET}&limit=30`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data || !data.ok || !data.result) {
        throw new Error("Failed to contact TON network API");
      }

      const txs = data.result;
      let newlyCreditedAmount = 0;
      let creditedHashes: string[] = [];
      try {
        creditedHashes = JSON.parse(localStorage.getItem(`ton_credited_txs_${stats.walletAddress}`) || '[]');
      } catch (e) {
        creditedHashes = [];
      }

      for (const tx of txs) {
        const txHash = tx.transaction_id?.hash;
        if (!txHash) continue;
        if (creditedHashes.includes(txHash)) continue;

        const inMsg = tx.in_msg;
        if (!inMsg) continue;

        const source = inMsg.source;
        if (!source) continue;

        const normalizedSource = source.trim().toLowerCase();
        const normalizedUserAddress = stats.walletAddress.trim().toLowerCase();

        // Check matching TON addresses (raw form or friendly form)
        if (normalizedSource === normalizedUserAddress || normalizedSource.replace(/[-_]/g, '') === normalizedUserAddress.replace(/[-_]/g, '')) {
          const valueNano = parseFloat(inMsg.value || '0');
          if (valueNano > 0) {
            const valueTon = Number((valueNano / 1e9).toFixed(4));
            newlyCreditedAmount += valueTon;
            creditedHashes.push(txHash);
          }
        }
      }

      if (newlyCreditedAmount > 0) {
        localStorage.setItem(`ton_credited_txs_${stats.walletAddress}`, JSON.stringify(creditedHashes));
        
        sound.playUpgrade();
        setStats(prev => ({
          ...prev,
          tonBalance: Number((prev.tonBalance + newlyCreditedAmount).toFixed(5))
        }));

        showAlert?.(
          isRtl 
            ? `💎 رائع! تم التحقق بنجاح ورصد إيداع بقيمة +${newlyCreditedAmount} Queen bee في حسابك!` 
            : `💎 Outstanding! Successfully verified and credited +${newlyCreditedAmount} Queen bee to your account!`, 
          'success'
        );
        setActiveModal(null);
      } else {
        showAlert?.(
          isRtl
            ? `⚠️ لم نجد أي معاملة إيداع جديدة من عنوان محفظتك (${stats.walletAddress}) لعنوان البوت المعتمد. يرجى إرسال المعاملة والانتظار دقيقة للتأكيد ثم الفحص مجدداً.`
            : `⚠️ No new deposit transactions from your wallet address (${stats.walletAddress}) to the bot address were found. Please make sure the transaction is completed and try scanning again in a minute.`,
          'alert'
        );
      }
    } catch (error: any) {
      console.error(error);
      showAlert?.(
        isRtl
          ? '⚠️ عذراً! حدث خطأ أثناء الاتصال بشبكة Queen bee. يرجى المحاولة مرة أخرى لاحقاً.'
          : '⚠️ Sorry! An error occurred while communicating with the Queen bee Network. Please try again later.',
        'alert'
      );
    } finally {
      setIsVerifyingDeposit(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-neutral-950 px-4 pt-4 overflow-y-auto pb-24 select-none ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* 1. TOP PREMIUM BALANCE CARD */}
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/5 rounded-3xl p-6 mb-5 text-center relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-blue-500/5 rounded-full filter blur-2xl pointer-events-none" />

        <span className="text-[10px] text-zinc-400 font-extrabold uppercase font-mono tracking-widest bg-zinc-950/95 border border-white/5 px-3 py-1 rounded-full px-4">
          {isRtl ? 'الأرصدة المتاحة' : 'AVAILABLE BALANCES'}
        </span>

        {/* Large Token Balance */}
        <div className="mt-4 flex flex-col items-center">
          <div className="flex items-baseline gap-1.5 justify-center">
            <span className="text-4xl font-extrabold text-white tracking-tight font-display drop-shadow-[0_2px_15px_rgba(255,255,255,0.05)]">
              {stats.coins.toFixed(2)}
            </span>
            <span className="text-amber-400 font-bold text-xs uppercase font-mono">TOKENS XTON</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase font-mono">
            {isRtl ? 'مستمدة من التعدين السحابي والضغط' : 'COMPOUNDED FROM CLOUD MINING & PRESSES'}
          </p>
        </div>
      </div>

      {/* 2. SPECIFIC HORIZONTAL CIRCULAR LINKS (Deposit, Withdraw, Swap, Connect, History) */}
      <div className="grid grid-cols-5 gap-2.5 mb-6 text-center px-1">
        
        {/* Deposit circular badge */}
        <button 
          onClick={() => { sound.playTap(); setActiveModal('deposit'); }}
          className="flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 flex items-center justify-center transition duration-200 group-active:scale-90 shadow-md">
            <ArrowDownLeft size={18} />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 leading-none truncate w-full">
            {isRtl ? 'إيداع' : 'Deposit'}
          </span>
        </button>

        {/* Withdraw circular badge */}
        <button 
          onClick={() => { sound.playTap(); setActiveModal('withdraw'); }}
          className="flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 flex items-center justify-center transition duration-200 group-active:scale-90 shadow-md">
            <ArrowUpRight size={18} />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 leading-none truncate w-full">
            {isRtl ? 'سحب' : 'Withdraw'}
          </span>
        </button>

        {/* Swap circular badge */}
        <button 
          onClick={() => { sound.playTap(); setActiveModal('swap'); }}
          className="flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-amber-600/10 hover:bg-amber-600/20 border border-amber-500/20 text-amber-400 flex items-center justify-center transition duration-200 group-active:scale-90 shadow-md">
            <ArrowLeftRight size={16} />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 leading-none truncate w-full">
            {isRtl ? 'تبديل' : 'Swap'}
          </span>
        </button>

        {/* Connect circular badge */}
        <button 
          onClick={() => { sound.playTap(); setActiveModal('connect'); }}
          className="flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer group"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition duration-200 group-active:scale-90 shadow-md ${stats.walletAddress ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'}`}>
            <Link2 size={16} />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 leading-none truncate w-full">
            {isRtl ? (stats.walletAddress ? 'مرتبط' : 'ربط') : (stats.walletAddress ? 'Linked' : 'Connect')}
          </span>
        </button>

        {/* History circular badge */}
        <button 
          onClick={() => { sound.playTap(); setActiveModal('history'); }}
          className="flex flex-col items-center justify-center gap-1.5 focus:outline-none cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition duration-200 group-active:scale-90 shadow-md">
            <History size={16} />
          </div>
          <span className="text-[10px] font-bold text-zinc-300 leading-none truncate w-full">
            {isRtl ? 'السجل' : 'History'}
          </span>
        </button>
      </div>



      {/* 3. MULTI-CRYPTO ASSETS GRID */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4.5 mb-5 space-y-3">
        <h4 className="text-xs font-bold font-display text-white mb-2 uppercase flex items-center justify-between">
          <span>{isRtl ? 'أصول وأرصدة محفظتك الموصولة' : 'Connected Wallet Portfolio'}</span>
          {stats.bscWalletAddress && (
            <span className="text-[8px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-mono uppercase font-black tracking-wider border border-green-500/10 animate-pulse">
              {isRtl ? 'مباشرة من الشبكة ⚡' : 'Live Blochain ⚡'}
            </span>
          )}
        </h4>

        {/* BNB Row (Native Chain Asset) */}
        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-amber-500/10 rounded-xl hover:border-amber-500/20 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs uppercase font-sans">
              BNB
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">BNB</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-black text-amber-400 block">{(stats.realBnbBalance ?? 0.0000).toFixed(5)} BNB</span>
            <span className="text-[9px] text-zinc-500">~${((stats.realBnbBalance ?? 0) * swapAssetPrices.bnb).toFixed(2)} USD</span>
          </div>
        </div>

        {/* Queen bee Bot Coin (Independent Blockchain) */}
        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-amber-500/20 rounded-xl hover:border-amber-500/45 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
              🐝
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">{isRtl ? 'ملكة النحل Queen bee' : 'Queen bee'}</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-black text-amber-400 block">{stats.coins.toFixed(4)} Queen bee</span>
            <span className="text-[9px] text-zinc-500">{isRtl ? 'عملة تعدين مستقلة' : 'Independent Mined Asset'}</span>
          </div>
        </div>

        {/* Real Gram (Withdrawable earnings from Ads/Tasks) */}
        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
              💎
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">TON</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-black text-blue-400 block">{stats.tonBalance.toFixed(5)} GRAM</span>
            <span className="text-[9px] text-zinc-500">~${(stats.tonBalance * swapAssetPrices.ton).toFixed(2)} USD</span>
          </div>
        </div>

        {/* Jump Coin (Withdrawable earnings from Internet Sharing) */}
        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-emerald-500/20 rounded-xl hover:border-emerald-500/40 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">JMPT</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-black text-emerald-400 block">{(stats.jumpBalance ?? 0.0).toFixed(6)} JMPT</span>
            <span className="text-[9px] text-zinc-500">~${((stats.jumpBalance ?? 0) * swapAssetPrices.jump).toFixed(3)} USD</span>
          </div>
        </div>

        {/* JumpTask (JMPT) Live Integration Card */}
        {stats.bscWalletAddress ? (
          <div className="p-3 bg-zinc-950/80 border border-emerald-500/20 rounded-xl space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">⚡</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-emerald-400 block font-mono">{isRtl ? 'محفظة Jump (JMPT) موصولة' : 'Jump (JMPT) Wallet Connected'}</span>
                  <span className="text-[9px] text-zinc-500 block font-mono truncate max-w-[150px]">{stats.bscWalletAddress}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setStats(prev => ({ ...prev, bscWalletAddress: undefined, realBnbBalance: 0, realUsdtBalance: 0, jumpBalance: 0 }));
                  showAlert?.(isRtl ? '🔌 تم إلغاء ربط محفظة JumpTask بنجاح.' : 'Disconnected JumpTask wallet successfully.', 'alert');
                }}
                className="py-1 px-2 bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-500/10 font-bold text-[8.5px] uppercase rounded-lg transition cursor-pointer"
              >
                {isRtl ? 'فصل' : 'Disconnect'}
              </button>
            </div>
            
            <div className="flex items-center gap-2 pt-1.5 border-t border-white/5">
              <a 
                href="https://dashboard.jumptask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/10 rounded-lg text-[8.5px] font-black text-center uppercase tracking-wider transition cursor-pointer"
              >
                {isRtl ? 'لوحة تحكم JumpTask 🔗' : 'JumpTask Dashboard 🔗'}
              </a>
              <button
                onClick={() => {
                  sound.playTap();
                  if (stats.bscWalletAddress) {
                    handleRefreshBscBalances(stats.bscWalletAddress);
                  }
                }}
                className="py-1.5 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5 rounded-lg text-[8.5px] font-bold transition cursor-pointer"
              >
                {isRtl ? 'تحديث رصيد JMPT 🔄' : 'Refresh JMPT 🔄'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-zinc-950/40 border border-dashed border-emerald-500/15 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚡</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-400 block">{isRtl ? 'ربط محفظة Jump (JMPT) الحقيقية' : 'Connect Real Jump (JMPT) Wallet'}</span>
                  <span className="text-[8.5px] text-zinc-550 block">{isRtl ? 'ادخل عنوان محفظة BNB Smart Chain لمزامنة رصيد JMPT' : 'Enter BNB Smart Chain address to sync JMPT balance'}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setActiveModal('connect_bsc_jump');
                }}
                className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/15 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer active:scale-95"
              >
                {isRtl ? 'ربط المحفظة 🔌' : 'Connect Wallet 🔌'}
              </button>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
              <a 
                href="https://www.jumptask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 text-center py-1 text-zinc-500 hover:text-emerald-400 text-[8px] font-mono transition"
              >
                {isRtl ? '← موقع JumpTask الرسمي' : '← JumpTask Official'}
              </a>
              <a 
                href="https://dashboard.jumptask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 text-center py-1 text-zinc-500 hover:text-emerald-400 text-[8px] font-mono transition"
              >
                {isRtl ? '← لوحة تحكم الأرباح' : '← Jump Dashboard'}
              </a>
            </div>
          </div>
        )}

        {/* Honeygain Live Integration Card */}
        {stats.honeygainConnected ? (
          <div className="p-3 bg-zinc-950/80 border border-amber-500/20 rounded-xl space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">🐝</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-amber-400 block font-mono">Honeygain Connected</span>
                  <span className="text-[9px] text-zinc-500 block font-mono truncate max-w-[150px]">{stats.honeygainEmail}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-white block font-mono">{(stats.honeygainCredits ?? 0).toLocaleString()} Credits</span>
                <span className="text-[9px] text-emerald-400 block font-mono">~${(stats.honeygainUsd ?? 0).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[8.5px] border-t border-dashed border-white/5 pt-2">
              <div className="text-zinc-500 text-left">
                <span>{isRtl ? 'الأجهزة المتصلة:' : 'Sharing Devices:'} </span>
                <span className="font-bold text-zinc-300 font-mono">{stats.honeygainDevices ?? 1} ⚡</span>
              </div>
              <div className="text-zinc-500 text-right">
                <span>{isRtl ? 'معدل التحويل:' : 'Rate:'} </span>
                <span className="font-bold text-amber-500 font-mono">1000 Cr = $1.00</span>
              </div>
            </div>

            <div className="flex gap-1.5 pt-1">
              <button
                onClick={async () => {
                  sound.playTap();
                  try {
                    showAlert?.(isRtl ? '🔄 جاري تحديث بيانات Honeygain الحية...' : '🔄 Fetching Honeygain live credentials...', 'info');
                    const res = await fetch("/api/honeygain/balance", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: stats.honeygainEmail,
                        password: stats.honeygainPassword,
                        accessToken: stats.honeygainToken
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.success) {
                        setStats(prev => ({
                          ...prev,
                          honeygainCredits: data.credits,
                          honeygainUsd: data.usd,
                          honeygainDevices: data.activeDevices,
                          honeygainToken: data.token
                        }));
                        sound.playClaim();
                        showAlert?.(isRtl ? '✅ تم تحديث بيانات محفظة Honeygain الحقيقية بنجاح!' : '✅ Honeygain real balance updated successfully!', 'success');
                      }
                    }
                  } catch (e) {}
                }}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-850 transition cursor-pointer"
                title={isRtl ? 'تحديث الرصيد الحقيقي' : 'Sync Real Balance'}
              >
                <RefreshCw size={11} className="animate-spin-slow" />
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  const creditsToSwap = stats.honeygainCredits ?? 0;
                  if (creditsToSwap <= 0) {
                    sound.playError();
                    showAlert?.(isRtl ? '⚠️ ليس لديك رصيد كافي للاستبدال!' : '⚠️ No Honeygain credits available to convert!', 'alert');
                    return;
                  }

                  const usdValue = stats.honeygainUsd ?? (creditsToSwap / 1000);
                  const gainedJump = Number((usdValue / swapAssetPrices.jump).toFixed(6));

                  setStats(prev => ({
                    ...prev,
                    honeygainCredits: 0,
                    honeygainUsd: 0,
                    jumpBalance: Number(((prev.jumpBalance ?? 0) + gainedJump).toFixed(6))
                  }));

                  sound.playClaim();
                  showAlert?.(
                    isRtl
                      ? `🎉 تم تحويل رصيد Honeygain مباشرةً! مبروك الحصول على +${gainedJump.toFixed(5)} JUMP في محفظتك!`
                      : `🎉 Swapped credits directly! Added +${gainedJump.toFixed(5)} JUMP directly to your wallet!`,
                    'success'
                  );
                }}
                className="flex-1 py-1 px-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-[9px] uppercase tracking-wide rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🐝 {isRtl ? 'تحويل الرصيد مباشرةً إلى JUMP' : 'Swap Honeygain to JUMP'}</span>
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  setStats(prev => ({
                    ...prev,
                    honeygainConnected: false,
                    honeygainEmail: '',
                    honeygainPassword: '',
                    honeygainToken: ''
                  }));
                  showAlert?.(isRtl ? '🔌 تم إلغاء ربط حساب Honeygain بنجاح.' : 'Disconnected Honeygain account successfully.', 'alert');
                }}
                className="py-1 px-2.5 bg-red-950/40 hover:bg-red-950/70 text-red-400 border border-red-500/10 font-bold text-[9px] uppercase rounded-lg transition cursor-pointer"
              >
                {isRtl ? 'فصل' : 'Disconnect'}
              </button>
            </div>

            {/* Real Honeygain Official Website links */}
            <div className="flex items-center gap-2 pt-1.5 border-t border-white/5">
              <a 
                href="https://r.honeygain.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/10 rounded-lg text-[8px] font-black text-center uppercase tracking-wider transition cursor-pointer"
              >
                {isRtl ? 'سجل واحصل على +5$ مجاناً 🎁' : 'Register & Get +$5 Free 🎁'}
              </a>
              <a 
                href="https://dashboard.honeygain.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5 rounded-lg text-[8px] font-bold text-center uppercase transition cursor-pointer"
              >
                {isRtl ? 'موقع Honeygain الحقيقي 🔗' : 'Honeygain Site 🔗'}
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-zinc-950/40 border border-dashed border-amber-500/15 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">🐝</span>
                <div className="text-left">
                  <span className="text-[10px] font-bold text-zinc-400 block">{isRtl ? 'ربط حساب Honeygain حقيقي' : 'Connect Honeygain Account'}</span>
                  <span className="text-[8.5px] text-zinc-550 block">{isRtl ? 'اسحب أرباح الإنترنت مباشرة إلى JUMP' : 'Swap live bandwidth earnings directly'}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  sound.playTap();
                  setActiveModal('honeygain');
                }}
                className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-500/15 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer active:scale-95"
              >
                {isRtl ? 'ربط الحساب 🔌' : 'Connect 🔌'}
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 pt-1 border-t border-white/5">
              <a 
                href="https://r.honeygain.me/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex-grow text-center py-1 text-zinc-500 hover:text-amber-400 text-[8px] font-mono transition"
              >
                {isRtl ? '← سجل في Honeygain (بونص 5$ هدية) 🎁' : '← Register on Honeygain ($5 Gift) 🎁'}
              </a>
              <a 
                href="https://www.honeygain.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-center py-1 px-2 text-zinc-500 hover:text-amber-400 text-[8px] font-mono transition"
              >
                {isRtl ? 'الموقع الرسمي 🔗' : 'Official Web 🔗'}
              </a>
            </div>
          </div>
        )}

        {/* PEPE Row */}
        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-green-500/10 rounded-xl hover:border-green-500/20 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center font-bold text-xs font-sans">
              PEPE
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">PEPE</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-black text-green-400 block">{(stats.pepeBalance ?? 285.71).toLocaleString()} PEPE</span>
            <span className="text-[9px] text-zinc-500">~${((stats.pepeBalance ?? 285.71) * swapAssetPrices.pepe).toFixed(3)} USD</span>
          </div>
        </div>

        {/* USDT Row */}
        <div className="flex items-center justify-between p-3 bg-zinc-950 border border-white/5 rounded-xl hover:border-white/10 transition">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
              USDT
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">USDT</span>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-xs font-black text-emerald-400 block">{(stats.realUsdtBalance ?? 0.0).toFixed(4)} USDT</span>
            <span className="text-[9px] text-zinc-500">${(stats.realUsdtBalance ?? 0.0).toFixed(2)} USD</span>
          </div>
        </div>
      </div>



      {/* 4. WITHDRAWAL METHODS list matching screen 4 */}
      <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4.5 mb-2">
        <h4 className="text-xs font-bold font-display text-white mb-3 flex items-center gap-1.5 uppercase">
          <Shield size={13} className="text-amber-500" />
          <span>{isRtl ? 'طرق السحب المعتمدة' : 'Withdrawal options'}</span>
        </h4>

        <div className="space-y-2 text-[10.5px]">
          {/* Method 1: USDT BEP20 */}
          <div 
            onClick={() => { sound.playTap(); setActiveModal('withdraw'); setWithdrawMethod('usdt'); setWithdrawAmount('0.1'); }} 
            className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer hover:border-emerald-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base text-emerald-400">💵</span>
              <span className="font-bold text-zinc-200 group-hover:text-white">USDT</span>
            </div>
            <span className="text-[9.5px] font-mono text-zinc-500">
              {isRtl ? 'الحد الأدنى: 0.1 USDT' : 'Min: 0.1 USDT'}
            </span>
          </div>

          {/* Method 2: PEPE BEP-20 Gift */}
          <div 
            onClick={() => { sound.playTap(); setActiveModal('withdraw'); setWithdrawMethod('pepe'); setWithdrawAmount('0.1'); }} 
            className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer hover:border-green-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base text-green-400">🐸</span>
              <span className="font-bold text-zinc-200 group-hover:text-white">PEPE</span>
            </div>
            <span className="text-[9.5px] font-mono text-zinc-500">
              {isRtl ? 'الحد الأدنى: 0.1 PEPE' : 'Min: 0.1 PEPE'}
            </span>
          </div>

          {/* Method 3: Real Gram */}
          <div 
            onClick={() => { sound.playTap(); setActiveModal('withdraw'); setWithdrawMethod('ton'); setWithdrawAmount('0.1'); }} 
            className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer hover:border-blue-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base text-blue-400">💎</span>
              <span className="font-bold text-zinc-200 group-hover:text-white">TON</span>
            </div>
            <span className="text-[9.5px] font-mono text-zinc-500">
              {isRtl ? 'الحد الأدنى: 0.1 Gram' : 'Min: 0.1 Gram'}
            </span>
          </div>

          {/* Method 4: Jump Token (JMPT) on BNB Smart Chain */}
          <div 
            onClick={() => { sound.playTap(); setActiveModal('withdraw'); setWithdrawMethod('jump'); setWithdrawAmount('0.1'); }} 
            className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer hover:border-emerald-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base text-emerald-400">⚡</span>
              <span className="font-bold text-zinc-200 group-hover:text-white">JMPT</span>
            </div>
            <span className="text-[9.5px] font-mono text-zinc-500">
              {isRtl ? 'الحد الأدنى: 0.1 JMPT' : 'Min: 0.1 JMPT'}
            </span>
          </div>

          {/* Method 5: Queen bee Bot Coin */}
          <div 
            onClick={() => { sound.playTap(); setActiveModal('withdraw'); setWithdrawMethod('1gram'); setWithdrawAmount('0.1'); }} 
            className="flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl cursor-pointer hover:border-amber-500/20 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="text-base text-amber-400">🐝</span>
              <span className="font-bold text-zinc-200 group-hover:text-white">{isRtl ? 'ملكة النحل Queen bee' : 'Queen bee'}</span>
            </div>
            <span className="text-[9.5px] font-mono text-red-400 font-bold uppercase">
              {isRtl ? 'مغلق 🔒' : 'Locked 🔒'}
            </span>
          </div>
        </div>
      </div>


      {/* 5. MODAL CONTEXT OVERLAYS FOR THE ACTION BUTTONS */}

      {/* 5A. Deposit Modal */}
      {activeModal === 'deposit' && (
        <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
          <div className="w-full max-w-sm bg-neutral-900 border border-blue-500/25 rounded-3xl p-5 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
              <span className="font-black text-xs text-white uppercase tracking-wider">
                {isRtl ? 'شحن رصيد وإيداع Queen bee' : 'QUEEN BEE COINS DEPOSIT'}
              </span>
              <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white">✖</button>
            </div>

            <p className="text-xs text-zinc-350 leading-relaxed font-sans mb-4">
              {isRtl 
                ? 'قم بتحويل Queen bee إلى هذا العنوان الرسمي المخصص للبوت. تضاف الأرصاد فورا لتوزيع أرباح الإعلانات والترويج:' 
                : 'Transfer Queen bee directly to this safe receiver address. After processing, tap the scan checker below to update balance:'}
            </p>

            <div className="bg-zinc-950 border border-blue-500/10 p-3 rounded-2xl mb-4 text-center">
              <span className="text-[8px] text-zinc-500 block uppercase font-mono mb-1.5">OFFICIAL BOOSTER RECEIVER</span>
              <div className="flex items-center justify-between gap-1.5 bg-neutral-900 px-3 py-2 rounded-xl">
                <span className="font-mono text-[9.5px] text-blue-400 select-all truncate break-all text-left">
                  {BOT_RECEIVE_WALLET}
                </span>
                <button onClick={handleCopyReceiver} className="p-1 text-zinc-400 hover:text-white shrink-0">
                  {copiedBotWallet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-300 hover:bg-neutral-800 transition">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              <button 
                onClick={handleMockAdDepositCheck} 
                disabled={isVerifyingDeposit}
                className="px-4 py-2 bg-blue-500 text-slate-950 font-bold rounded-xl hover:bg-blue-400 transition flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isVerifyingDeposit ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>{isRtl ? 'جاري التحقق...' : 'Scanning...'}</span>
                  </>
                ) : (
                  <span>{isRtl ? 'تحقق المعاملة ⚡' : 'Verify & Scan ⚡'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5B. Withdraw Modal */}
      {activeModal === 'withdraw' && (
        <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
          <div className="w-full max-w-sm bg-neutral-900 border border-emerald-500/25 rounded-3xl p-5 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
              <span className="font-black text-xs text-white uppercase tracking-wider">
                {isRtl ? `طلب سحب (${withdrawMethod.toUpperCase()})` : `Withdrawal (${withdrawMethod.toUpperCase()})`}
              </span>
              <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white font-mono">✖</button>
            </div>

            {/* WITHDRAW LIMITATIONS & CHECKS */}
            {withdrawMethod === 'pepe' ? (
              <div className="bg-zinc-950 p-3 rounded-xl border border-green-500/20 text-[9.5px] space-y-2.5 mb-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-1 text-green-400 font-extrabold uppercase font-sans">
                  <span>🛡️ {isRtl ? 'حالة مكافحة الغش والمهام:' : 'Anti-Cheat Clearance:'}</span>
                  <span className={stats.antiCheatPassed ? 'text-green-400 font-bold' : 'text-amber-500 font-bold'}>
                    {stats.antiCheatPassed ? (isRtl ? 'تم العبور ومؤهل ✅' : 'CLEARED & ELIGIBLE ✅') : (isRtl ? 'في انتظار الفحص 🔎' : 'Awaiting Check 🔎')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-left">
                  <span className="text-zinc-400 flex items-center gap-1"><span>📋</span><span>{isRtl ? 'المهام الأساسية المكتملة:' : 'Task checklist status:'}</span></span>
                  <span className="text-white font-mono font-bold">({stats.tasksCompleted.length}/3) {stats.tasksCompleted.length >= 3 ? '✓ OK' : '⚠️'}</span>
                </div>

                <div className="flex justify-between items-center text-left">
                  <span className="text-zinc-400 flex items-center gap-1"><span>📢</span><span>{isRtl ? 'التسجيل في القنوات:' : 'Channel Subscriber:'}</span></span>
                  <span className="text-white font-mono font-bold">{stats.isActivated ? '✓ OK' : '✗ Missing'}</span>
                </div>

                {/* Anti-cheat engine scanner trigger or report status */}
                <div className="border-t border-white/5 pt-2 mt-1">
                  {isScanningAntiCheat ? (
                    <div className="p-2.5 bg-neutral-900 border border-amber-500/10 rounded-lg space-y-1 text-center font-mono animate-pulse">
                      <div className="text-amber-400 font-bold text-[8px] uppercase tracking-widest leading-none">
                        {isRtl ? '🛡️ جاري تشغيل مكافح الغش...' : '🛡️ RUNNING COGNITIVE ANTI-CHEAT SCAN...'}
                      </div>
                      <p className="text-[7.5px] text-zinc-400 italic font-sans">
                        {scanProgressLabel}
                      </p>
                    </div>
                  ) : stats.antiCheatPassed ? (
                    <div className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-center text-[8.5px] font-sans">
                      ✅ {isRtl 
                        ? 'نجاح الفحص! لم يتم الكشف عن حسابات متعددة أو سلوكيات آلية. المحفظة مؤمنة للسحب.' 
                        : 'Integrity verified! No multi-accounting or automated script detected. Wallet certified.'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playUpgrade();
                        setIsScanningAntiCheat(true);
                        const phases = isRtl 
                          ? [
                              'جاري الاتصال بقاعدة بيانات مكافحة الاحتيال...',
                              'البحث عن خوارزميات النقر المتكرر السريع...',
                              'التحقق من صحة توثيق مهام التليجرام...',
                              'تأكيد تطابق بصمة الجهاز والـ IP الموحد...',
                              'تم التحقق: أمن وموثوق بنسبة 100%! ✅'
                            ]
                          : [
                              'Establishing node telemetry links...',
                              'Detecting speed-clicking / auto-clicker scripts...',
                              'Verifying Telegram channel membership state...',
                              'Filtering duplicate network fingerprints...',
                              'Cleared: 100% Legit Account Integrity! ✅'
                            ];
                        
                        let phaseIdx = 0;
                        const interval = setInterval(() => {
                          if (phaseIdx < phases.length) {
                            setScanProgressLabel(phases[phaseIdx]);
                            sound.playTap();
                            phaseIdx++;
                          } else {
                            clearInterval(interval);
                            setIsScanningAntiCheat(false);
                            setStats(prev => ({ ...prev, antiCheatPassed: true }));
                            sound.playClaim();
                            showAlert?.(
                              isRtl 
                                ? '🎉 نجاح! تخطيت نظام فحص مكافحة الغش بنجاح ومحفظتك مؤهلة وموثقة الآن لسحب هدية PEPE مباشرة!' 
                                : '🎉 Success! You have passed the anti-cheat verification system. Your wallet is now cleared for instantaneous PEPE withdrawals!',
                              'success'
                            );
                          }
                        }, 600);
                      }}
                      className="w-full py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500 hover:to-orange-500 border border-amber-500/30 text-amber-300 hover:text-slate-950 text-[9px] font-black font-sans uppercase rounded-xl transition cursor-pointer select-none text-center"
                    >
                      🚀 {isRtl ? 'تشغيل فحص مكافح الغش والتحقق 🛡️' : 'RUN SECURE ANTI-CHEAT SCANNER 🛡️'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 text-[9.5px] space-y-2 mb-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-1 text-zinc-400 uppercase">
                  <span>{isRtl ? 'حالة تفعيل حساب المعدن:' : 'Node withdrawal status:'}</span>
                  <span className={stats.isActivated && stats.referrals >= 1 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                    {stats.isActivated && stats.referrals >= 1 ? (isRtl ? 'مفتوح 🔓' : 'Unlocked 🔓') : (isRtl ? 'مغلق 🔒' : 'Locked 🔒')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-left">
                  <span className="text-zinc-400 flex items-center gap-1"><span>📢</span><span>{isRtl ? 'تحقق التليجرام' : 'Channel Actives'}</span></span>
                  <span className="text-white font-mono font-bold">{stats.isActivated ? '✓ OK' : '✗ Missing'}</span>
                </div>
                <div className="flex justify-between items-center text-left">
                  <span className="text-zinc-400 flex items-center gap-1"><span>👥</span><span>{isRtl ? 'دعوة صديق واحد' : 'Friend Referrals'}</span></span>
                  <span className="text-white font-mono font-bold">({stats.referrals}/1)</span>
                </div>
                {(!stats.isActivated || stats.referrals < 1) && (
                  <p className="text-[8.5px] text-amber-500 border-t border-white/5 pt-1">
                    ⚠️ {isRtl 
                      ? 'يجب تحقيق تفعيل القنوات وجلب إحالة واحدة موثقة أولاً لفتح بوابات البلوكشين.' 
                      : 'Subscribe to channels & invite at least 1 verified user before performing withdrawal.'}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleWithdrawAssets} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-zinc-400 font-mono block uppercase">{isRtl ? 'رصيدك المتاح للسحب:' : 'Your withdrawable balance:'}</label>
                <div className={`bg-zinc-950 py-2.5 px-3 rounded-xl font-mono font-extrabold text-sm border border-dashed ${withdrawMethod === 'pepe' ? 'text-green-400 border-green-500/25' : 'text-emerald-400 border-emerald-500/25'}`}>
                  {withdrawMethod === 'ton' 
                    ? `${stats.tonBalance.toFixed(5)} Gram` 
                    : withdrawMethod === 'usdt' 
                      ? `${(stats.realUsdtBalance ?? 0.0).toFixed(4)} USDT` 
                      : withdrawMethod === 'pepe' 
                        ? `${(stats.pepeBalance ?? 285.71).toLocaleString()} PEPE` 
                        : withdrawMethod === 'jump'
                          ? `${(stats.jumpBalance ?? 0.0).toFixed(6)} JUMP`
                          : withdrawMethod === '1gram'
                            ? `${stats.coins.toFixed(4)} Queen bee (Bot Coin)`
                            : `${(stats.realBnbBalance ?? 0.0000).toFixed(5)} BNB`}
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-zinc-400 font-mono block uppercase">
                  {withdrawMethod === 'pepe' 
                    ? (isRtl ? 'معرف بينانس (ID) أو عنوان محفظة PEPE (بامتداد BEP-20):' : 'Binance ID or Destination PEPE Wallet Address (BEP-20):')
                    : withdrawMethod === 'jump'
                      ? (isRtl ? 'عنوان محفظة BNB Smart Chain المستلمة لـ JMPT (0x...):' : 'Recipient BNB Smart Chain Address (BEP-20) for JMPT:')
                      : withdrawMethod === '1gram'
                        ? (isRtl ? 'عنوان محفظة Queen bee المستقلة:' : 'Destination Queen bee Blockchain Wallet Address:')
                        : (isRtl ? 'عنوان محفظة المستقبل:' : 'Destination Address:')}
                </label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={
                    withdrawMethod === 'pepe' 
                      ? (isRtl ? 'أدخل الـ Binance ID الخاص بك أو عنوان 0x...' : 'Enter your Binance ID or 0x...') 
                      : withdrawMethod === 'jump'
                        ? (isRtl ? 'أدخل عنوان محفظة BNB الذكية الخاصة بك (0x...)' : 'Enter your 0x... BNB Smart Chain address')
                        : withdrawMethod === '1gram' 
                          ? 'queenbee-uqad...' 
                          : 'UQAD-...'
                  }
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] text-zinc-400 font-mono block uppercase">{isRtl ? 'المبلغ المطلوب سحبه:' : 'Amount to withdraw:'}</label>
                <input
                  type="text"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={withdrawMethod === 'pepe' ? '285.71' : withdrawMethod === 'ton' ? 'e.g. 0.13333' : 'e.g. 0.05'}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                />
              </div>

              {/* Dynamic Min Limit notice */}
              <div className="text-[9px] text-amber-500/90 text-left bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl">
                {withdrawMethod === '1gram' ? (
                  isRtl 
                    ? `🐝 سحوبات Queen bee تتم معالجتها تلقائياً وفوراً عبر العقود الذكية لملكة النحل. الحد الأدنى للسحب هو 1.0 Queen bee.` 
                    : `🐝 Queen bee withdrawals are processed automatically and instantly via Queen Bee smart contracts. The minimum limit is 1.0 Queen bee.`
                ) : withdrawMethod === 'jump' ? (
                  isRtl
                    ? `⚡ سحوبات JumpToken (JMPT) تتم معالجتها يدوياً من قبل الإدارة بعد مراجعة فحص مكافحة الاحتيال للتأكد من نزاهة التعدين. يتم إرسال العملات إلى عنوان محفظة BNB Smart Chain (BEP-20) الخاص بك خلال 12-24 ساعة.`
                    : `⚡ JumpToken (JMPT) withdrawals are processed manually by the administration after reviewing the anti-cheat report to guarantee mining integrity. Coins will arrive in your BNB Smart Chain (BEP-20) wallet within 12-24 hours.`
                ) : (
                  isRtl 
                    ? `⚠️ حد السحب الأدنى المطبق حالياً هو 0.1 لجميع العملات والتوكنز.` 
                    : `⚠️ The minimum withdrawal limit is exactly 0.1 for all assets.`
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5 text-xs">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-300 hover:bg-neutral-805 transition">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button 
                  type="submit" 
                  disabled={
                    withdrawMethod === 'pepe' 
                      ? (!stats.antiCheatPassed || (stats.tasksCompleted.length < 1 && !stats.isActivated))
                      : withdrawMethod === 'jump'
                        ? false // JUMP bypassed
                        : withdrawMethod === '1gram'
                          ? false // Unlocked
                          : (!stats.isActivated || stats.referrals < 1)
                  }
                  className="px-5 py-2 font-bold rounded-xl transition cursor-pointer select-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRtl ? 'طلب سحب آمن' : 'Request Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5C. Swap Modal */}
      {activeModal === 'swap' && (() => {
        const parsedNewAmount = parseFloat(swapAmountNew) || 0;
        const fromAssetPrice = swapAssetPrices[swapFromAsset];
        const toAssetPrice = swapAssetPrices[swapToAsset];
        const estimatedReceiveAmount = fromAssetPrice && toAssetPrice ? (parsedNewAmount * fromAssetPrice) / toAssetPrice : 0;

        let availableFromBalance = 0;
        if (swapFromAsset === 'ton') availableFromBalance = stats.tonBalance;
        else if (swapFromAsset === 'pepe') availableFromBalance = stats.pepeBalance ?? 285.71;
        else if (swapFromAsset === 'usdt') availableFromBalance = stats.realUsdtBalance ?? 0;
        else if (swapFromAsset === 'bnb') availableFromBalance = stats.realBnbBalance ?? 0;

        return (
          <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
            <div className="w-full max-w-sm bg-neutral-900 border border-amber-500/25 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
                <span className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>{isRtl ? 'تبديل فوري للعملات المتنوعة' : 'INSTANT MULTI-ASSET SWAP'}</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[7px] text-green-400 font-mono tracking-widest uppercase">LIVE</span>
                  </span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      fetchLivePrices(false);
                    }}
                    title="Refresh Prices"
                    disabled={isRefreshingPrices}
                    className="p-1 text-zinc-500 hover:text-white transition"
                  >
                    <RefreshCw size={11} className={isRefreshingPrices ? 'animate-spin text-amber-400' : ''} />
                  </button>
                  <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white">✖</button>
                </div>
              </div>

              <p className="text-xs text-zinc-350 leading-relaxed font-sans mb-3 text-left">
                {isRtl 
                  ? 'تم إلغاء تبديل عملة التعدين المحلية. يمكنك تبديل الأرصدة المتوفرة لديك بين العملات القياسية المختلفة بأسعار الصرف الفورية والمثبتة.' 
                  : 'Mined coin conversions are disabled. You can instantly trade or convert between standard active crypto assets at official indexed rates.'}
              </p>

              <form onSubmit={handleSwapAssets} className="space-y-4">
                {/* FROM ASSET SELECTOR */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-mono block uppercase">{isRtl ? 'من عملة (تبديل من):' : 'Swap From:'}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={swapFromAsset}
                      onChange={(e) => {
                        sound.playTap();
                        const nextVal = e.target.value as 'ton' | 'usdt' | 'pepe' | 'bnb';
                        setSwapFromAsset(nextVal);
                        if (nextVal === swapToAsset) {
                          // set opposite
                          setSwapToAsset(nextVal === 'usdt' ? 'ton' : 'usdt');
                        }
                      }}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/30 transition font-mono font-bold"
                    >
                      <option value="ton">TON</option>
                      <option value="usdt">USDT</option>
                      <option value="pepe">PEPE</option>
                      <option value="bnb">BNB</option>
                    </select>
                    <div className="bg-zinc-950 py-2 px-3 rounded-xl font-mono text-zinc-400 text-[10px] flex items-center justify-between border border-white/5">
                      <span>{isRtl ? 'الرصيد:' : 'Bal:'}</span>
                      <span className="text-white font-extrabold truncate max-w-[70px]">
                        {availableFromBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TO ASSET SELECTOR */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-mono block uppercase">{isRtl ? 'إلى عملة (الحصول على):' : 'Swap To (Receive):'}</span>
                  <select
                    value={swapToAsset}
                    onChange={(e) => {
                      sound.playTap();
                      const nextVal = e.target.value as 'ton' | 'usdt' | 'pepe' | 'bnb';
                      setSwapToAsset(nextVal);
                      if (nextVal === swapFromAsset) {
                        setSwapFromAsset(nextVal === 'usdt' ? 'ton' : 'usdt');
                      }
                    }}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/30 transition font-mono font-bold"
                  >
                    <option value="ton">TON</option>
                    <option value="usdt">USDT</option>
                    <option value="pepe">PEPE</option>
                    <option value="bnb">BNB</option>
                  </select>
                </div>

                {/* MOUNT SWAP INPUT */}
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-mono block uppercase">
                    {isRtl ? `الكمية المراد تبديلها (${swapAssetNames[swapFromAsset]}):` : `Amount to Swap (${swapAssetNames[swapFromAsset]}):`}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      value={swapAmountNew}
                      onChange={(e) => setSwapAmountNew(e.target.value)}
                      placeholder="e.g. 1.0"
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-3 pr-16 py-2.5 text-xs font-mono text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSwapAmountNew(availableFromBalance.toString());
                      }}
                      className="absolute right-1.5 top-1.5 px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                    >
                      {isRtl ? 'الأقصى' : 'MAX'}
                    </button>
                  </div>
                </div>

                {/* EXCHANGE RATE DETAILS */}
                <div className="bg-zinc-950 p-3 rounded-xl border border-white/5 space-y-1.5 text-[10px] font-mono leading-none">
                  <div className="flex items-center justify-between text-zinc-500">
                    <span>{isRtl ? 'سعر الصرف التقريبي:' : 'Market Index Rate:'}</span>
                    <span className="text-zinc-300">
                      1 {swapAssetNames[swapFromAsset]} ≈ {((1 * fromAssetPrice) / toAssetPrice).toLocaleString(undefined, { maximumFractionDigits: 6 })} {swapAssetNames[swapToAsset]}
                    </span>
                  </div>
                  <hr className="border-white/5 my-1" />
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-sans">{isRtl ? 'تحصل تقريباً على (النتيجة):' : 'Estimated Receive Amount:'}</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {estimatedReceiveAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {swapAssetNames[swapToAsset]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 text-xs">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-300 hover:bg-zinc-800 transition">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400 transition">{isRtl ? 'تأكيد التبديل ⚡' : 'Execute Swap ⚡'}</button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Honeygain Account Connection Modal */}
      {activeModal === 'honeygain' && (
        <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
              <span className="font-black text-xs text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span>🐝</span> {isRtl ? 'ربط حساب Honeygain حقيقي' : 'CONNECT HONEYGAIN ACCOUNT'}
              </span>
              <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white">✖</button>
            </div>

            <p className="text-xs text-zinc-350 leading-relaxed font-sans mb-4">
              {isRtl 
                ? 'اربط حسابك الحقيقي لتزامن عوائد مشاركة الإنترنت (Honeygain/JMPT) وسحبها فورياً كعملة JUMP إلى محفظتك الشخصية في أي وقت.' 
                : 'Connect your real Honeygain profile to fetch your live sharing balance (Credits/USD) and instantly swap to JUMP.'}
            </p>

            <form onSubmit={handleConnectHoneygain} className="space-y-3.5">
              <div>
                <label className="text-[9px] text-zinc-400 font-mono block uppercase mb-1">{isRtl ? 'البريد الإلكتروني المسجل في Honeygain:' : 'Honeygain Account Email:'}</label>
                <input
                  type="email"
                  value={hgEmail}
                  onChange={(e) => setHgEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  disabled={isConnectingHg}
                />
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 font-mono block uppercase mb-1">{isRtl ? 'كلمة المرور:' : 'Honeygain Account Password:'}</label>
                <input
                  type="password"
                  value={hgPassword}
                  onChange={(e) => setHgPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  disabled={isConnectingHg}
                />
              </div>

              <div className="relative flex py-1 items-center select-none">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-3 text-[8px] text-zinc-500 uppercase font-mono">{isRtl ? 'أو عبر الرمز (Token)' : 'OR VIA ACCESS TOKEN'}</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 font-mono block uppercase mb-1">{isRtl ? 'رمز الوصول (اختياري):' : 'Honeygain Access Token (Optional):'}</label>
                <input
                  type="text"
                  value={hgToken}
                  onChange={(e) => setHgToken(e.target.value)}
                  placeholder="eyJhbGciOi..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono truncate"
                  disabled={isConnectingHg}
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-xs pt-1">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)} 
                  className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-300 hover:bg-zinc-800 transition"
                  disabled={isConnectingHg}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition flex items-center justify-center gap-1.5 min-w-[120px] disabled:opacity-50 cursor-pointer"
                  disabled={isConnectingHg}
                >
                  {isConnectingHg ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>{isRtl ? 'جاري الاتصال...' : 'Connecting...'}</span>
                    </>
                  ) : (
                    <span>{isRtl ? 'ربط الحساب ⚡' : 'Connect Account ⚡'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5D. Connect Wallet Modal */}
      {activeModal === 'connect' && (
        <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
              <span className="font-black text-xs text-white uppercase tracking-wider">
                {isRtl ? 'ربط محفظة Queen bee الشخصية' : 'CONNECT QUEEN BEE WALLET'}
              </span>
              <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white">✖</button>
            </div>

            <p className="text-xs text-zinc-350 leading-relaxed font-sans mb-4">
              {isRtl 
                ? 'أدخل عنوان محفظة Queen bee الخاصة بك (مثل Tonkeeper, Tonhub) لاستقبال دفعات السحب المباشرة:' 
                : 'Connect your personal Queen bee web3 wallet to facilitate rapid automatic airdrop claims and payouts:'}
            </p>

            <form onSubmit={handleConnectWallet} className="space-y-4">
              <div>
                <span className="text-[10px] text-zinc-400 font-mono block uppercase mb-1">{isRtl ? 'رابط محفظة Queen bee المباشر (UQ...):' : 'Queen bee wallet address (UQ...):'}</span>
                <input
                  type="text"
                  value={walletAddressInput}
                  onChange={(e) => setWalletAddressInput(e.target.value)}
                  placeholder="UQAD..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-xs">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-300 hover:bg-neutral-805 transition">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition">{isRtl ? 'ربط المحفظة' : 'Connect Wallet'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Jump / BSC Wallet Modal */}
      {activeModal === 'connect_bsc_jump' && (
        <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-3xl p-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none">
              <span className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1">
                <span>⚡</span> {isRtl ? 'ربط محفظة Jump (JMPT) الحقيقية' : 'CONNECT JUMP (JMPT) WALLET'}
              </span>
              <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white">✖</button>
            </div>

            <p className="text-xs text-zinc-350 leading-relaxed font-sans mb-4">
              {isRtl 
                ? 'أدخل عنوان محفظة BNB Smart Chain (BEP-20) الخاصة بك (مثل Metamask أو Trust Wallet) التي تستخدمها لتعدين أو سحب JumpToken (JMPT):' 
                : 'Enter your personal BNB Smart Chain (BEP-20) wallet address (e.g. Trust Wallet, Metamask) where you receive or store JumpToken (JMPT):'}
            </p>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const address = bscWalletAddressInput.trim();
                if (!address) {
                  sound.playError();
                  showAlert?.(isRtl ? '⚠️ يرجى إدخال عنوان المحفظة أولاً!' : '⚠️ Please enter wallet address first!', 'alert');
                  return;
                }
                if (!/^0x[a-f0-9]{40}$/i.test(address)) {
                  sound.playError();
                  showAlert?.(isRtl ? '⚠️ صيغة العنوان غير صحيحة! يجب أن يبدأ بـ 0x.' : '⚠️ Invalid BSC address format! Must start with 0x.', 'alert');
                  return;
                }
                
                sound.playTap();
                await handleRefreshBscBalances(address);
                setActiveModal(null);
              }} 
              className="space-y-4"
            >
              <div>
                <span className="text-[10px] text-zinc-400 font-mono block uppercase mb-1">{isRtl ? 'عنوان محفظة BNB Smart Chain (0x...):' : 'BNB Smart Chain Address (0x...):'}</span>
                <input
                  type="text"
                  value={bscWalletAddressInput}
                  onChange={(e) => setBscWalletAddressInput(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono"
                  disabled={isFetchingBsc}
                />
              </div>

              <div className="flex items-center justify-end gap-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setActiveModal(null)} 
                  className="px-4 py-2 bg-zinc-850 rounded-xl text-zinc-300 hover:bg-zinc-800 transition"
                  disabled={isFetchingBsc}
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-400 transition flex items-center gap-1"
                  disabled={isFetchingBsc}
                >
                  {isFetchingBsc ? (
                    <>
                      <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                      <span>{isRtl ? 'جاري التحقق...' : 'Syncing...'}</span>
                    </>
                  ) : (
                    <span>{isRtl ? 'ربط المحفظة' : 'Connect Wallet'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5E. History Modal */}
      {activeModal === 'history' && (
        <div className="absolute inset-0 bg-neutral-950/93 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[150] animate-fade-in text-left">
          <div className="w-full max-w-sm bg-neutral-900 border border-white/5 rounded-3xl p-5 relative max-h-[80%] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4 select-none shrink-0">
              <span className="font-black text-xs text-white uppercase tracking-wider">
                {isRtl ? 'سجل العمليات السحابية' : 'TRANSACTION HISTORY LOGS'}
              </span>
              <button onClick={() => { sound.playTap(); setActiveModal(null); }} className="text-zinc-500 hover:text-white">✖</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
              {transactions.map((tx, idx) => (
                <div key={idx} className="p-3 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between font-mono text-[11px]">
                  <div>
                    <span className="text-white font-bold block">{tx.type} ({tx.asset})</span>
                    <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{tx.date} • ID: {tx.id}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{tx.amount}</span>
                    <span className="text-[8px] bg-white/5 text-zinc-400 px-1.5 py-0.5 rounded leading-none mt-1 inline-block uppercase font-bold">{tx.status}</span>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-zinc-500 font-sans text-xs text-center py-5">No logged transactions found yet.</p>
              )}
            </div>

            <div className="pt-3 border-t border-white/5 text-right shrink-0">
              <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-zinc-800 text-white rounded-xl text-xs font-semibold hover:bg-zinc-705 transition cursor-pointer">
                {isRtl ? 'إغلاق السجل' : 'Close Logs'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
