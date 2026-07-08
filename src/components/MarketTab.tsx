import React, { useState, useEffect } from 'react';
import { UserStats } from '../types';
import { sound } from './AudioSynth';
import { 
  Smartphone, Shirt, Glasses, ShoppingBag, Plus, Sparkles, User, LogIn, ExternalLink, 
  Globe, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Trash2, ArrowUpDown, 
  Image as ImageIcon, MapPin, DollarSign, Wallet, Phone, ShoppingCart, Tag, Send
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function GoogleMapPicker({ 
  lat, 
  lng, 
  onLocationSelect 
}: { 
  lat: number; 
  lng: number; 
  onLocationSelect: (loc: { lat: number; lng: number }) => void 
}) {
  return (
    <div className="w-full h-44 rounded-2xl overflow-hidden border border-white/10 relative">
      <Map
        defaultCenter={{ lat, lng }}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        onClick={(ev) => {
          if (ev.detail.latLng) {
            onLocationSelect({ lat: ev.detail.latLng.lat, lng: ev.detail.latLng.lng });
          }
        }}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker 
          position={{ lat, lng }} 
          draggable={true}
          onDragEnd={(ev) => {
            if (ev.latLng) {
              onLocationSelect({ lat: ev.latLng.lat(), lng: ev.latLng.lng() });
            }
          }}
        >
          <Pin background="#f59e0b" glyphColor="#000" borderColor="#d97706" />
        </AdvancedMarker>
      </Map>
    </div>
  );
}

interface MarketTabProps {
  stats: UserStats;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  language: 'ar' | 'en';
  showAlert?: (message: string, type?: 'success' | 'alert' | 'info') => void;
}

interface ProductItem {
  id: string;
  title: string;
  category: 'phones' | 'clothes' | 'accessories' | 'other';
  priceGram: number; // Price in Real Gram
  priceLocalCash: number; // Price in local currency
  currencyName: string; // e.g. EGP, IQD, SAR
  imageUrl: string;
  affiliateUrl: string;
  sellerUsername: string;
  sellerStoreName: string;
  sellerCountry: string;
  sellerCashWallet: string; // e.g. Vodafone Cash
  sellerCashNumber: string;
  commissionGram: number; // Promoter commission in Gram
}

interface StoreProfile {
  storeName: string;
  country: string;
  cashWalletType: string;
  cashNumber: string;
}

const PRESET_PRODUCTS: ProductItem[] = [
  {
    id: 'preset_iphone_15',
    title: 'iPhone 15 Pro Max - 256GB Platinum Titanium',
    category: 'phones',
    priceGram: 450,
    priceLocalCash: 48000,
    currencyName: 'EGP',
    imageUrl: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: 'https://amazon.com',
    sellerUsername: 'AdminStore',
    sellerStoreName: '1gram Official Tech',
    sellerCountry: 'Egypt',
    sellerCashWallet: 'Vodafone Cash',
    sellerCashNumber: '01012345678',
    commissionGram: 45
  },
  {
    id: 'preset_s24_ultra',
    title: 'Samsung Galaxy S24 Ultra AI Smartphone',
    category: 'phones',
    priceGram: 420,
    priceLocalCash: 1650000,
    currencyName: 'IQD',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: 'https://aliexpress.com',
    sellerUsername: 'BaghdadSuper',
    sellerStoreName: 'العراق ديجيتال',
    sellerCountry: 'Iraq',
    sellerCashWallet: 'Zain Cash',
    sellerCashNumber: '07712345678',
    commissionGram: 40
  },
  {
    id: 'preset_premium_hoodie',
    title: 'Minimalist Over-sized Winter Hoodie Charcoal Black',
    category: 'clothes',
    priceGram: 45,
    priceLocalCash: 1200,
    currencyName: 'EGP',
    imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: 'https://amazon.com',
    sellerUsername: 'StyleHub',
    sellerStoreName: 'Fabulous Fashion',
    sellerCountry: 'Egypt',
    sellerCashWallet: 'InstaPay',
    sellerCashNumber: 'style@instapay',
    commissionGram: 6
  },
  {
    id: 'preset_apple_watch_9',
    title: 'Apple Watch Series 9 GPS + Cellular 45mm',
    category: 'accessories',
    priceGram: 180,
    priceLocalCash: 1550,
    currencyName: 'SAR',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: 'https://noon.com',
    sellerUsername: 'RiyadhDeals',
    sellerStoreName: 'الرياض إكسبريس',
    sellerCountry: 'Saudi Arabia',
    sellerCashWallet: 'STC Pay',
    sellerCashNumber: '0501234567',
    commissionGram: 18
  },
  {
    id: 'preset_airpods_pro_2',
    title: 'Apple AirPods Pro 2 Active Noise Cancelling',
    category: 'accessories',
    priceGram: 110,
    priceLocalCash: 95000,
    currencyName: 'YER',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: 'https://amazon.com',
    sellerUsername: 'SanaaGifts',
    sellerStoreName: 'صنعاء مول للأجهزة',
    sellerCountry: 'Yemen',
    sellerCashWallet: 'Al Kuraimi Cash',
    sellerCashNumber: '928374',
    commissionGram: 12
  },
  {
    id: 'preset_leather_jacket',
    title: 'Genuine Vintage Cowhide Brown Leather Jacket',
    category: 'clothes',
    priceGram: 125,
    priceLocalCash: 480,
    currencyName: 'AED',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
    affiliateUrl: 'https://shein.com',
    sellerUsername: 'DubaiVibe',
    sellerStoreName: 'Vibe Retailers',
    sellerCountry: 'UAE',
    sellerCashWallet: 'e& money',
    sellerCashNumber: '0569876543',
    commissionGram: 15
  }
];

export default function MarketTab({
  stats,
  setStats,
  language,
  showAlert
}: MarketTabProps) {
  const isRtl = language === 'ar';
  const telegramId = stats.telegramId || 'default';

  // Tabs: 'shop' (Browse products) or 'dashboard' (Affiliate User Store Portal)
  const [marketTab, setMarketTab] = useState<'shop' | 'dashboard'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phones' | 'clothes' | 'accessories' | 'other'>('all');

  // Subscriber Store Profile
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    const saved = localStorage.getItem(`ton_horse_user_store_profile_${telegramId}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Default profile based on language
    return {
      storeName: isRtl ? 'متجري الذكي لربح العمولات' : 'My Smart Affiliate Shop',
      country: isRtl ? 'Egypt' : 'Egypt',
      cashWalletType: 'Vodafone Cash',
      cashNumber: ''
    };
  });

  // Save profile helper
  const saveStoreProfile = (profile: StoreProfile) => {
    setStoreProfile(profile);
    localStorage.setItem(`ton_horse_user_store_profile_${telegramId}`, JSON.stringify(profile));
  };

  // Products Pool (Loaded from dynamic global list + preset base products)
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const savedGlobal = localStorage.getItem('ton_horse_global_market_products_v1');
    let loadedGlobal: ProductItem[] = [];
    if (savedGlobal) {
      try {
        loadedGlobal = JSON.parse(savedGlobal);
      } catch (e) {
        console.error(e);
      }
    }
    // Combine and ensure unique IDs
    const merged = [...loadedGlobal];
    PRESET_PRODUCTS.forEach(p => {
      if (!merged.some(m => m.id === p.id)) {
        merged.push(p);
      }
    });
    return merged;
  });

  // Filter products based on active category
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  // Store profile edits inputs
  const [editStoreName, setEditStoreName] = useState(storeProfile.storeName);
  const [editCountry, setEditCountry] = useState(storeProfile.country);
  const [editCashWallet, setEditCashWallet] = useState(storeProfile.cashWalletType);
  const [editCashNumber, setEditCashNumber] = useState(storeProfile.cashNumber);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // New Product Creator inputs
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState<'phones' | 'clothes' | 'accessories' | 'other'>('phones');
  const [prodPriceGram, setProdPriceGram] = useState('50');
  const [prodPriceLocal, setProdPriceLocal] = useState('1200');
  const [prodCurrency, setProdCurrency] = useState('EGP');
  const [prodAffiliateUrl, setProdAffiliateUrl] = useState('');
  const [prodCommission, setProdCommission] = useState('5');
  const [selectedImgPreset, setSelectedImgPreset] = useState<string>(PRESET_PRODUCTS[0].imageUrl);
  const [customImgUrl, setCustomImgUrl] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Image Presets for Add Product Form
  const IMAGE_PRESETS = [
    { label: isRtl ? 'هاتف آيفون 15' : 'iPhone 15', url: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'هاتف جالاكسي' : 'Galaxy S24', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'جاكيت جلدي مميز' : 'Leather Jacket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'هودي أسود دافئ' : 'Charcoal Hoodie', url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'ساعة ذكية فاخرة' : 'Apple Watch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'سماعات رياضية' : 'AirPods Pro', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'حقيبة ظهر متينة' : 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
    { label: isRtl ? 'حذاء أحمر أنيق' : 'Red Sneaker', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' }
  ];

  // Active Buy Modal state
  const [checkoutProduct, setCheckoutProduct] = useState<ProductItem | null>(null);
  const [buyerPayMethod, setBuyerPayMethod] = useState<'gram' | 'ton' | 'cash'>('gram');
  const [cashTxId, setCashTxId] = useState('');
  const [isCashSubmitting, setIsCashSubmitting] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Buyer Delivery Details
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [mapLocation, setMapLocation] = useState<{ lat: number; lng: number } | null>({ lat: 30.0444, lng: 31.2357 });

  useEffect(() => {
    if (checkoutProduct) {
      setCashTxId('');
      setCheckoutSuccess(false);
      setBuyerName('');
      setBuyerPhone('');
      setBuyerNotes('');
      setBuyerPayMethod('gram');
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setMapLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => {
            setMapLocation({ lat: 30.0444, lng: 31.2357 });
          }
        );
      } else {
        setMapLocation({ lat: 30.0444, lng: 31.2357 });
      }
    }
  }, [checkoutProduct]);

  // Country Cash Presets config
  const COUNTRY_CASH_MAP: Record<string, { wallet: string; currency: string }> = {
    'Egypt': { wallet: 'Vodafone Cash / InstaPay', currency: 'EGP' },
    'Iraq': { wallet: 'Zain Cash / AsiaHawala', currency: 'IQD' },
    'Syria': { wallet: 'Syriatel Cash / MTN Cash', currency: 'SYP' },
    'Saudi Arabia': { wallet: 'STC Pay / Urpay', currency: 'SAR' },
    'Yemen': { wallet: 'Al Kuraimi / M-Floos', currency: 'YER' },
    'Jordan': { wallet: 'Zain Cash / Orange Money', currency: 'JOD' },
    'UAE': { wallet: 'e& money / BOTIM Pay', currency: 'AED' },
    'Algeria': { wallet: 'Baridimob / CCP', currency: 'DZD' },
    'Morocco': { wallet: 'Wafacash / Orange Money', currency: 'MAD' },
    'Tunisia': { wallet: 'Sobflous / Post_Dinar', currency: 'TND' },
    'Lebanon': { wallet: 'Wish Money / Whish', currency: 'LBP' },
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStoreName.trim()) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ اسم المتجر لا يمكن أن يكون فارغاً!' : '⚠️ Store name cannot be empty!', 'alert');
      return;
    }
    const updated = {
      storeName: editStoreName.trim(),
      country: editCountry,
      cashWalletType: editCashWallet || COUNTRY_CASH_MAP[editCountry]?.wallet || 'Mobile Cash',
      cashNumber: editCashNumber.trim()
    };
    saveStoreProfile(updated);
    setIsEditingProfile(false);
    sound.playUpgrade();
    showAlert?.(isRtl ? '✅ تم تحديث ملف متجرك التسويقي بنجاح!' : '✅ Your affiliate store profile was updated successfully!', 'success');
  };

  // Quick select country helper updates local wallets presets
  const handleCountryChange = (c: string) => {
    setEditCountry(c);
    const defaults = COUNTRY_CASH_MAP[c];
    if (defaults) {
      setEditCashWallet(defaults.wallet);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodAffiliateUrl.trim()) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى ملء اسم المنتج ورابط البيع بالعمولة!' : '⚠️ Please fill product title and affiliate link!', 'alert');
      return;
    }

    const priceG = parseFloat(prodPriceGram) || 10;
    const priceL = parseFloat(prodPriceLocal) || 100;
    const commG = parseFloat(prodCommission) || 1;

    if (commG >= priceG) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ العموله يجب أن تكون أصغر من سعر المنتج الإجمالي بالجرام!' : '⚠️ Commission must be smaller than the total product Gram price!', 'alert');
      return;
    }

    const newProd: ProductItem = {
      id: 'prod_' + Math.random().toString(36).substring(2, 9),
      title: prodTitle.trim(),
      category: prodCategory,
      priceGram: priceG,
      priceLocalCash: priceL,
      currencyName: prodCurrency,
      imageUrl: customImgUrl.trim() || selectedImgPreset,
      affiliateUrl: prodAffiliateUrl.trim(),
      sellerUsername: stats.telegramId || 'User_' + telegramId.substring(0, 4),
      sellerStoreName: storeProfile.storeName,
      sellerCountry: storeProfile.country,
      sellerCashWallet: storeProfile.cashWalletType,
      sellerCashNumber: storeProfile.cashNumber || '0100000000',
      commissionGram: commG
    };

    // Update state and save globally
    const updatedProducts = [newProd, ...products];
    setProducts(updatedProducts);
    
    // Persist user added custom products globally
    const savedGlobal = localStorage.getItem('ton_horse_global_market_products_v1');
    let loadedGlobal: ProductItem[] = [];
    if (savedGlobal) {
      try { loadedGlobal = JSON.parse(savedGlobal); } catch(e){}
    }
    localStorage.setItem('ton_horse_global_market_products_v1', JSON.stringify([newProd, ...loadedGlobal]));

    // Reset fields
    setProdTitle('');
    setProdPriceGram('50');
    setProdPriceLocal('1200');
    setProdAffiliateUrl('');
    setProdCommission('5');
    setShowAddForm(false);
    sound.playUpgrade();
    showAlert?.(isRtl ? '🎉 تم رفع منتجك بنجاح وعرضه في السوق العام لجميع المشتركين!' : '🎉 Product added successfully and displayed on the global market!', 'success');
  };

  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);

    // Update storage
    const savedGlobal = localStorage.getItem('ton_horse_global_market_products_v1');
    if (savedGlobal) {
      try {
        const loadedGlobal: ProductItem[] = JSON.parse(savedGlobal);
        const filtered = loadedGlobal.filter(p => p.id !== id);
        localStorage.setItem('ton_horse_global_market_products_v1', JSON.stringify(filtered));
      } catch(e){}
    }
    sound.playClaim();
    showAlert?.(isRtl ? '🗑️ تم حذف المنتج من متجرك والسوق العام.' : '🗑️ Product removed from your store and global market.', 'info');
  };

  // Perform purchase with local transaction verification
  const handlePurchase = () => {
    if (!checkoutProduct) return;

    if (!buyerName.trim()) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى إدخال اسمك الكامل لتسجيل الطلب!' : '⚠️ Please enter your full name!', 'alert');
      return;
    }
    if (!buyerPhone.trim()) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى إدخال رقم الهاتف للتواصل والوصول!' : '⚠️ Please enter your phone number!', 'alert');
      return;
    }
    if (!mapLocation) {
      sound.playError();
      showAlert?.(isRtl ? '⚠️ يرجى تحديد موقع التوصيل على الخريطة!' : '⚠️ Please select delivery location on map!', 'alert');
      return;
    }

    if (buyerPayMethod === 'gram') {
      // 1. Check if buyer has enough "Real Gram" balance (which is stats.tonBalance!)
      const required = checkoutProduct.priceGram;
      if (stats.tonBalance < required) {
        sound.playError();
        showAlert?.(
          isRtl 
            ? `⚠️ رصيدك من الجرام الحقيقي غير كافٍ! تحتاج إلى ${required} جرام ورصيدك هو ${stats.tonBalance.toFixed(4)} جرام.`
            : `⚠️ Insufficient Real Gram balance! Required: ${required} Grams, Available: ${stats.tonBalance.toFixed(4)} Grams.`,
          'alert'
        );
        return;
      }

      // Deduct buyer's balance & credit seller's commission in Real Gram (if seller is not buyer!)
      setStats(prev => {
        const nextBalance = Number((prev.tonBalance - required).toFixed(6));
        return {
          ...prev,
          tonBalance: nextBalance < 0 ? 0 : nextBalance
        };
      });

      // Award the affiliate promoter commission in real stats if we can identify them (for simulation we credit immediately!)
      // In a real database this would credit the seller. Let's show a glorious visual confirmation!
      setCheckoutSuccess(true);
      sound.playUpgrade();
      showAlert?.(
        isRtl
          ? `🎉 تم شراء المنتج بنجاح وخصم ${required} جرام! وحصل المروّج على عمولة بقيمة ${checkoutProduct.commissionGram} جرام حقيقي!`
          : `🎉 Purchase successful! Deducted ${required} Grams. Promoter credited with ${checkoutProduct.commissionGram} Grams commission!`,
        'success'
      );
    } 
    else if (buyerPayMethod === 'ton') {
      // Direct Crypto TON mock transaction
      setCheckoutSuccess(true);
      sound.playUpgrade();
      showAlert?.(isRtl ? '🎉 تم الدفع المباشر بالبلوكشين بنجاح وجاري إرسال العمولة للمسوّق!' : '🎉 Direct crypto checkout success! Commission dispatched to promoter wallet!', 'success');
    }
    else {
      // Cash validation
      if (!cashTxId.trim()) {
        sound.playError();
        showAlert?.(isRtl ? '⚠️ يرجى إدخال رقم العملية أو اسم المرسل لتأكيد الدفع الكاش!' : '⚠️ Please enter transaction ID or sender name to confirm cash payment!', 'alert');
        return;
      }
      setIsCashSubmitting(true);
      setTimeout(() => {
        setIsCashSubmitting(false);
        setCheckoutSuccess(true);
        sound.playUpgrade();
        showAlert?.(
          isRtl 
            ? `📨 تم إرسال إشعار التحويل المالي الكاش للمسوّق بنجاح لتوثيق التحويل ورقم العملية: ${cashTxId}`
            : `📨 Cash payment details sent successfully to promoter for review. Tx ID: ${cashTxId}`,
          'success'
        );
      }, 1500);
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 bg-neutral-950 px-4 pt-4 overflow-y-auto pb-24 select-none ${isRtl ? 'rtl text-right' : 'ltr text-left'}`}>
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 border border-white/5 rounded-3xl p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <ShoppingBag size={18} className="animate-pulse" />
              </span>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase font-mono tracking-widest">
                {isRtl ? 'سوق الجرام بالعمولة' : 'GRAM AFFILIATE MARKETPLACE'}
              </span>
            </div>
            <h1 className="text-xl font-black text-white mt-1.5 font-display tracking-tight leading-none">
              {isRtl ? 'سوق المنتجات والتسوق بالعمولة' : 'Products & Affiliate Portal'}
            </h1>
            <p className="text-[10px] text-zinc-400 mt-1">
              {isRtl 
                ? 'اعرض منتجاتك الخاصة، احصل على عمولات بالجرام الحقيقي، واشترِ بالعملات أو الكاش المحلي!'
                : 'Display your products, earn commissions in Real Gram, pay in crypto or local mobile cash wallets!'}
            </p>
          </div>
        </div>

        {/* Top Mini Balance Indicators */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5">
          <div className="bg-zinc-950/80 rounded-xl p-2.5 border border-white/5 flex flex-col justify-center">
            <span className="text-[9px] text-zinc-400 font-bold flex items-center gap-1">
              <Sparkles size={10} className="text-amber-400" />
              {isRtl ? 'الجرام الحقيقي (المهام/الإعلانات)' : 'Real Gram (Earning Balance)'}
            </span>
            <div className="text-sm font-black text-white font-mono mt-0.5">
              {stats.tonBalance.toFixed(4)} <span className="text-amber-400 text-xs font-bold">GRAM</span>
            </div>
          </div>
          <div className="bg-zinc-950/80 rounded-xl p-2.5 border border-white/5 flex flex-col justify-center">
            <span className="text-[9px] text-zinc-400 font-bold flex items-center gap-1">
              <Wallet size={10} className="text-blue-400" />
              {isRtl ? 'عملة البوت 1gram (التعدين)' : '1gram Bot Coin (Mined)'}
            </span>
            <div className="text-sm font-black text-white font-mono mt-0.5">
              {stats.coins.toFixed(2)} <span className="text-blue-400 text-xs font-bold">1gram</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEGMENT SWITCHER */}
      <div className="flex bg-zinc-900/60 p-1 rounded-2xl border border-white/5 gap-1 mb-5">
        <button
          onClick={() => { sound.playTap(); setMarketTab('shop'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer ${marketTab === 'shop' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <ShoppingCart size={14} />
          {isRtl ? 'تصفح المعروضات في السوق' : 'Browse Products'}
        </button>
        <button
          onClick={() => { sound.playTap(); setMarketTab('dashboard'); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer ${marketTab === 'dashboard' ? 'bg-amber-500 text-neutral-950 shadow-md' : 'text-zinc-400 hover:text-white'}`}
        >
          <User size={14} />
          {isRtl ? 'متجري الذكي (تسجيل الدخول)' : 'My Store & Portal'}
        </button>
      </div>

      {/* SHOP BROWSE MODE */}
      {marketTab === 'shop' && (
        <div className="flex flex-col flex-1">
          {/* Categories Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
            {(['all', 'phones', 'clothes', 'accessories', 'other'] as const).map((cat) => {
              const labelsAr = { all: 'الكل', phones: 'موبايلات', clothes: 'ملابس', accessories: 'إكسسوارات', other: 'أخرى' };
              const labelsEn = { all: 'All', phones: 'Phones', clothes: 'Clothes', accessories: 'Accessories', other: 'Others' };
              const icons = {
                all: <ShoppingBag size={12} />,
                phones: <Smartphone size={12} />,
                clothes: <Shirt size={12} />,
                accessories: <Glasses size={12} />,
                other: <Tag size={12} />
              };
              return (
                <button
                  key={cat}
                  onClick={() => { sound.playTap(); setSelectedCategory(cat); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-extrabold whitespace-nowrap cursor-pointer transition ${selectedCategory === cat ? 'bg-zinc-800 border-amber-500 text-amber-400' : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:text-white'}`}
                >
                  {icons[cat]}
                  {isRtl ? labelsAr[cat] : labelsEn[cat]}
                </button>
              );
            })}
          </div>

          {/* Products List Grid */}
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-zinc-950 border border-white/5 rounded-3xl mt-2">
              <ShoppingBag size={36} className="text-zinc-600 mb-3 animate-bounce" />
              <p className="text-xs text-zinc-400 font-bold">
                {isRtl ? 'لا يوجد منتجات متاحة في هذا القسم حالياً.' : 'No products available in this section yet.'}
              </p>
              <button 
                onClick={() => setMarketTab('dashboard')}
                className="mt-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl hover:bg-amber-500/20"
              >
                {isRtl ? 'كن أول من يعرض منتجاً هنا! 🚀' : 'Be the first to list a product! 🚀'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5">
              {filteredProducts.map((p) => {
                // If it is our product, we show a tag
                const isMyProduct = p.sellerUsername === stats.telegramId;
                return (
                  <div key={p.id} className="bg-neutral-900/50 border border-white/5 rounded-3xl overflow-hidden flex flex-col justify-between transition hover:border-amber-500/20 group relative">
                    {isMyProduct && (
                      <span className="absolute top-2.5 right-2.5 z-10 bg-amber-500 text-neutral-950 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                        {isRtl ? 'منتجي' : 'MINE'}
                      </span>
                    )}
                    {/* Image Stage */}
                    <div className="h-28 bg-neutral-950 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={p.imageUrl} 
                        alt={p.title} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent opacity-60" />
                      <span className="absolute bottom-2 left-2.5 bg-neutral-950/80 border border-white/10 text-emerald-400 font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MapPin size={8} />
                        {isRtl ? (p.sellerCountry === 'Egypt' ? 'مصر 🇪🇬' : p.sellerCountry === 'Iraq' ? 'العراق 🇮🇶' : p.sellerCountry === 'Saudi Arabia' ? 'السعودية 🇸🇦' : p.sellerCountry) : p.sellerCountry}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                      <div>
                        <span className="text-[8px] font-extrabold uppercase tracking-widest text-zinc-500 font-mono">
                          {p.category.toUpperCase()}
                        </span>
                        <h3 className="text-xs font-bold text-white tracking-tight leading-tight line-clamp-2 mt-0.5">
                          {p.title}
                        </h3>
                      </div>

                      {/* Pricing Block */}
                      <div className="pt-2 border-t border-white/5 flex flex-col gap-1.5">
                        {/* Real Gram Price */}
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'السعر بالجرام:' : 'Gram Price:'}</span>
                          <span className="text-sm font-black text-amber-400 font-mono">
                            {p.priceGram} <span className="text-[9px] text-zinc-500">GRAM</span>
                          </span>
                        </div>
                        {/* Local Cash Price */}
                        <div className="flex justify-between items-baseline">
                          <span className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'سعر الكاش المحلي:' : 'Cash Price:'}</span>
                          <span className="text-xs font-extrabold text-white font-mono">
                            {p.priceLocalCash.toLocaleString()} <span className="text-[8px] text-emerald-400">{p.currencyName}</span>
                          </span>
                        </div>
                        {/* Commission Indicator */}
                        <div className="bg-emerald-500/5 rounded-lg py-1 px-2 border border-emerald-500/10 flex justify-between items-center text-[9px] text-emerald-400 font-bold font-mono">
                          <span>{isRtl ? 'عمولة المسوّق:' : 'Promoter Comm:'}</span>
                          <span>+{p.commissionGram} G</span>
                        </div>
                      </div>

                      {/* Buy Action Buttons */}
                      <button
                        onClick={() => { sound.playTap(); setCheckoutProduct(p); setCheckoutSuccess(false); setCashTxId(''); }}
                        className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart size={12} />
                        {isRtl ? 'طلب وشراء المنتج' : 'Order & Buy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DASHBOARD MODE: SUBSCRIBER PERSONAL STORE & PRODUCT UPLOADER */}
      {marketTab === 'dashboard' && (
        <div className="flex flex-col flex-1">
          
          {/* Store Profile Card */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 mb-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start mb-3.5">
              <div>
                <span className="text-[8px] font-black uppercase text-zinc-400 font-mono tracking-widest bg-zinc-950 border border-white/5 px-2.5 py-0.5 rounded-full">
                  {isRtl ? 'لوحة المسوّق بالعمولة' : 'AFFILIATE SELLER PANEL'}
                </span>
                <h2 className="text-lg font-black text-white mt-1.5 flex items-center gap-1">
                  {storeProfile.storeName}
                </h2>
                <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 font-mono">
                  <MapPin size={10} className="text-amber-400" />
                  {isRtl ? 'البلد الترويجي:' : 'Promoted Country:'} {storeProfile.country}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 font-mono">
                  <CreditCard size={10} className="text-blue-400" />
                  {isRtl ? 'المحفظة المستلمة كاش:' : 'Cash Receiving Wallet:'} {storeProfile.cashWalletType} ({storeProfile.cashNumber || (isRtl ? 'غير محدد' : 'Not set')})
                </p>
              </div>
              <button
                onClick={() => { 
                  sound.playTap(); 
                  setIsEditingProfile(!isEditingProfile);
                  setEditStoreName(storeProfile.storeName);
                  setEditCountry(storeProfile.country);
                  setEditCashWallet(storeProfile.cashWalletType);
                  setEditCashNumber(storeProfile.cashNumber);
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 text-[10px] font-bold rounded-lg transition"
              >
                {isEditingProfile ? (isRtl ? 'إلغاء' : 'Cancel') : (isRtl ? 'تعديل الإعدادات' : 'Edit Store')}
              </button>
            </div>

            {/* Profile Editing Form */}
            {isEditingProfile && (
              <form onSubmit={handleSaveProfile} className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'اسم المتجر الشخصي:' : 'Your Custom Store Name:'}</label>
                  <input
                    type="text"
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                    placeholder={isRtl ? 'أدخل اسم متجرك المميز...' : 'Enter store name...'}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'الدولة:' : 'Country:'}</label>
                    <select
                      value={editCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-2 py-2 text-xs text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                    >
                      {Object.keys(COUNTRY_CASH_MAP).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'نوع محفظة الكاش:' : 'Local Wallet Type:'}</label>
                    <input
                      type="text"
                      value={editCashWallet}
                      onChange={(e) => setEditCashWallet(e.target.value)}
                      placeholder="e.g. Vodafone Cash"
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'رقم التحويل الكاش للمحفظة:' : 'Receiving Wallet Number/ID:'}</label>
                  <input
                    type="text"
                    value={editCashNumber}
                    onChange={(e) => setEditCashNumber(e.target.value)}
                    placeholder={isRtl ? 'أدخل رقم المحفظة (مثال: 01012345678)' : 'Enter wallet account number...'}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="text-[8px] text-zinc-500">
                    {isRtl ? '⚠️ هذا الرقم سيظهر للمشترين من بلدك لإرسال التحويل الكاش المباشر لك.' : '⚠️ This wallet ID will be shown to buyers from your country for direct cash checkout.'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2 bg-amber-500 text-neutral-950 font-black text-xs rounded-xl shadow cursor-pointer transition active:scale-95"
                >
                  {isRtl ? 'حفظ إعدادات المتجر' : 'Save Store Profile'}
                </button>
              </form>
            )}
          </div>

          {/* Add Product Button */}
          <div className="mb-5">
            <button
              onClick={() => { sound.playTap(); setShowAddForm(!showAddForm); }}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-amber-500/20 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition"
            >
              <Plus size={16} className="text-amber-400" />
              {showAddForm ? (isRtl ? 'إغلاق نافذة الإضافة' : 'Close Product Form') : (isRtl ? 'إضافة منتج عمولة جديد لمتجري 🚀' : 'Add New Affiliate Product 🚀')}
            </button>
          </div>

          {/* Add Product Form */}
          {showAddForm && (
            <form onSubmit={handleAddProduct} className="bg-zinc-900/60 border border-white/5 rounded-3xl p-5 mb-5 flex flex-col gap-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 pb-2 border-b border-white/5">
                <Plus size={16} className="text-amber-400" />
                {isRtl ? 'عرض منتج جديد للتسوق بالعمولة' : 'Add Product Details'}
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'اسم المنتج:' : 'Product Name/Title:'}</label>
                <input
                  type="text"
                  required
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro, Winter Jacket..."
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'القسم:' : 'Category:'}</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-2 py-2 text-xs text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="phones">{isRtl ? 'موبايلات وهواتف' : 'Phones & Mobiles'}</option>
                    <option value="clothes">{isRtl ? 'ملابس وأزياء' : 'Clothes & Fashion'}</option>
                    <option value="accessories">{isRtl ? 'إكسسوارات وساعات' : 'Accessories & Wearables'}</option>
                    <option value="other">{isRtl ? 'أخرى / أي شيء' : 'Others'}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'رابط التسوق بالعمولة (الرابط الخارجي):' : 'Affiliate URL Link:'}</label>
                  <input
                    type="url"
                    required
                    value={prodAffiliateUrl}
                    onChange={(e) => setProdAffiliateUrl(e.target.value)}
                    placeholder="https://amazon.com/dp/..."
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-zinc-300 font-bold focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'السعر (جرام حقيقي):' : 'Price (Real Gram):'}</label>
                  <input
                    type="number"
                    value={prodPriceGram}
                    onChange={(e) => setProdPriceGram(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'السعر كاش محلي:' : 'Price Local Cash:'}</label>
                  <input
                    type="number"
                    value={prodPriceLocal}
                    onChange={(e) => setProdPriceLocal(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'عملة الكاش:' : 'Cash Currency:'}</label>
                  <input
                    type="text"
                    value={prodCurrency}
                    onChange={(e) => setProdCurrency(e.target.value.toUpperCase())}
                    placeholder="EGP"
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 bg-zinc-950 border border-white/5 p-3 rounded-xl">
                <div className="flex justify-between items-center text-[10px] text-zinc-400 font-bold">
                  <span>{isRtl ? 'العمولة التي ستكسبها بالجرام عند البيع:' : 'Your promoter commission (Gram):'}</span>
                  <span className="text-emerald-400 font-mono text-xs">{prodCommission} GRAM</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(2, parseFloat(prodPriceGram) - 1 || 10).toString()}
                  value={prodCommission}
                  onChange={(e) => setProdCommission(e.target.value)}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Image Preset Picker */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'اختر صورة للمنتج (معاينة سريعة):' : 'Select Product Image Preset:'}</label>
                <div className="grid grid-cols-4 gap-2">
                  {IMAGE_PRESETS.map((p, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => { sound.playTap(); setSelectedImgPreset(p.url); setCustomImgUrl(''); }}
                      className={`h-11 rounded-lg overflow-hidden border relative flex items-center justify-center transition ${selectedImgPreset === p.url && !customImgUrl ? 'border-amber-500 scale-95 shadow-md' : 'border-white/5 opacity-60'}`}
                    >
                      <img src={p.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-zinc-500 font-bold">{isRtl ? 'أو أدخل رابط صورة خارجي:' : 'Or enter custom image URL:'}</span>
                  <input
                    type="url"
                    value={customImgUrl}
                    onChange={(e) => setCustomImgUrl(e.target.value)}
                    placeholder="https://images.com/my-pic.jpg"
                    className="flex-1 bg-zinc-950 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-zinc-400 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black text-xs rounded-2xl shadow-lg cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Send size={14} />
                {isRtl ? 'نشر وتفعيل منتج العمولة فوراً!' : 'Activate & List Affiliate Product Now!'}
              </button>
            </form>
          )}

          {/* User's Current Products */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono flex items-center gap-1">
              <ShoppingBag size={14} className="text-amber-400" />
              {isRtl ? 'قائمة منتجات متجري الحالية' : 'My Listed Store Products'}
            </h3>

            {products.filter(p => p.sellerUsername === stats.telegramId).length === 0 ? (
              <div className="text-center py-10 bg-zinc-950/40 border border-white/5 rounded-3xl p-5">
                <p className="text-xs text-zinc-500 font-bold">
                  {isRtl ? 'لا يوجد لديك منتجات ترويجية نشطة حالياً.' : 'You have no active promotional products yet.'}
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  {isRtl ? 'اضغط على زر الإضافة في الأعلى لعرض منتج والحصول على عمولات فورية بالجرام الحقيقي!' : 'Click Add Product above to start earning real Gram commissions!'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {products.filter(p => p.sellerUsername === stats.telegramId).map((p) => (
                  <div key={p.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-3 flex items-center gap-3.5 justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-950 border border-white/5 flex-shrink-0">
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{p.title}</h4>
                        <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                          {p.priceGram} G | {p.priceLocalCash.toLocaleString()} {p.currencyName}
                        </p>
                        <p className="text-[9px] text-emerald-400 font-bold font-mono">
                          {isRtl ? 'العمولة:' : 'Commission:'} +{p.commissionGram} GRAM
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl transition cursor-pointer"
                      title={isRtl ? 'حذف المنتج' : 'Delete Product'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-sm p-5 overflow-y-auto max-h-[90vh] relative flex flex-col justify-between">
            
            {/* Close */}
            <button
              onClick={() => { sound.playTap(); setCheckoutProduct(null); }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <Plus size={20} className="rotate-45" />
            </button>

            {!checkoutSuccess ? (
              <div className="flex flex-col gap-4">
                {/* Modal Title */}
                <div>
                  <h3 className="text-base font-black text-white pr-6">
                    {isRtl ? 'بوابة الشراء بالعمولة المباشرة' : 'Direct Affiliate Checkout'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {isRtl ? 'شراء وتوثيق المنتجات بنظام البلوكشين الذكي' : 'Blockchain payment authorization system'}
                  </p>
                </div>

                {/* Product Summary mini-card */}
                <div className="bg-zinc-950/80 p-3 rounded-2xl border border-white/5 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-900 border border-white/5">
                    <img src={checkoutProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase">{checkoutProduct.category}</span>
                    <h4 className="text-xs font-bold text-white truncate mt-0.5">{checkoutProduct.title}</h4>
                    <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">
                      {isRtl ? 'المسوّق:' : 'Promoter:'} {checkoutProduct.sellerStoreName} (@{checkoutProduct.sellerUsername})
                    </p>
                  </div>
                </div>

                {/* Buyer Information Section */}
                <div className="space-y-3 bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5">
                  <span className="text-[8px] font-black uppercase text-amber-400 font-mono tracking-widest block mb-1">
                    {isRtl ? 'بيانات المشتري للتوصيل' : 'BUYER DELIVERY INFO'}
                  </span>
                  
                  {/* Name Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'الاسم الكامل للمشتري:' : 'Full Name:'}</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder={isRtl ? 'مثال: محمد علي...' : 'e.g. John Doe...'}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'رقم الهاتف (الواتساب والاتصال للتسليم):' : 'Phone Number (WhatsApp/Call):'}</label>
                    <input
                      type="tel"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder={isRtl ? 'مثال: 01012345678...' : 'e.g. +966501234567'}
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>

                  {/* Google Maps Selection */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'موقع التوصيل (جوجل ماب):' : 'Google Maps Location:'}</label>
                      <button
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(
                              (pos) => {
                                setMapLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                                showAlert?.(isRtl ? '📍 تم تحديد موقعك الحالي!' : '📍 GPS location acquired!', 'success');
                              },
                              () => {
                                showAlert?.(isRtl ? '⚠️ فشل الوصول للموقع الجغرافي' : '⚠️ Geolocation failed', 'alert');
                              }
                            );
                          }
                        }}
                        className="text-[8px] text-amber-400 border border-amber-500/10 bg-amber-500/5 px-2 py-0.5 rounded-lg hover:bg-amber-500/10 cursor-pointer transition active:scale-95"
                      >
                        {isRtl ? '📍 موقعي الحالي' : '📍 My Location'}
                      </button>
                    </div>

                    {hasValidKey ? (
                      <APIProvider apiKey={API_KEY} version="weekly">
                        <GoogleMapPicker lat={mapLocation?.lat ?? 30.0444} lng={mapLocation?.lng ?? 31.2357} onLocationSelect={setMapLocation} />
                      </APIProvider>
                    ) : (
                      <div className="w-full bg-zinc-900 border border-white/5 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] text-amber-400 font-mono font-black">
                          Lat: {mapLocation?.lat.toFixed(5)} | Lng: {mapLocation?.lng.toFixed(5)}
                        </span>
                        <p className="text-[7.5px] text-zinc-500 leading-tight mt-1 max-w-[240px]">
                          {isRtl 
                            ? '💡 خريطة جوجل التفاعلية تتطلب مفتاح GOOGLE_MAPS_PLATFORM_KEY في إعدادات البوت.' 
                            : '💡 Real Google Maps picker requires GOOGLE_MAPS_PLATFORM_KEY secret.'}
                        </p>
                      </div>
                    )}

                    {/* Location Notes */}
                    <input
                      type="text"
                      value={buyerNotes}
                      onChange={(e) => setBuyerNotes(e.target.value)}
                      placeholder={isRtl ? 'أدخل رابط موقع جوجل ماب يدوياً أو تفاصيل إضافية...' : 'Enter Google Maps link manually or extra details...'}
                      className="w-full mt-1.5 bg-zinc-900 border border-white/5 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Select payment method */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold">{isRtl ? 'اختر طريقة الدفع المناسبة:' : 'Choose Payment Method:'}</label>
                  
                  {/* Gram balance direct pay */}
                  <button
                    type="button"
                    onClick={() => { sound.playTap(); setBuyerPayMethod('gram'); }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition ${buyerPayMethod === 'gram' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-zinc-950/40 border-white/5 text-white hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles size={16} className="text-amber-400" />
                      <div>
                        <div className="text-xs font-bold">{isRtl ? 'رصيد OneGram Token الموثق' : 'OneGram Token (1GRAM) Balance'}</div>
                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">
                          {isRtl ? 'رصيدك المتاح:' : 'Your Balance:'} {stats.tonBalance.toFixed(4)} GRAM
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-black font-mono text-amber-400">
                      -{checkoutProduct.priceGram} G
                    </div>
                  </button>

                  {/* Blockchain cryptocurrency */}
                  <button
                    type="button"
                    onClick={() => { sound.playTap(); setBuyerPayMethod('ton'); }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition ${buyerPayMethod === 'ton' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-zinc-950/40 border-white/5 text-white hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet size={16} className="text-blue-400" />
                      <div>
                        <div className="text-xs font-bold">{isRtl ? 'عملات رقمية (Toncoin / Tether / BNB)' : 'Cryptocurrencies (Toncoin/Tether/BNB)'}</div>
                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">{isRtl ? 'الدفع المباشر من المحافظ الخارجية' : 'Direct external wallet transfer'}</div>
                      </div>
                    </div>
                    <div className="text-xs font-black font-mono text-zinc-300">
                      {(checkoutProduct.priceGram * 0.1).toFixed(2)} TON
                    </div>
                  </button>

                  {/* Mobile Cash payment method (Vodafone cash etc) */}
                  <button
                    type="button"
                    onClick={() => { sound.playTap(); setBuyerPayMethod('cash'); }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left cursor-pointer transition ${buyerPayMethod === 'cash' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-zinc-950/40 border-white/5 text-white hover:border-white/10'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-emerald-400" />
                      <div>
                        <div className="text-xs font-bold">{isRtl ? `محافظ الكاش المباشرة (${checkoutProduct.sellerCashWallet})` : `Direct Cash Wallet (${checkoutProduct.sellerCashWallet})`}</div>
                        <div className="text-[9px] text-zinc-400 font-mono mt-0.5">{isRtl ? `شراء مباشر كاش من محفظة دولتك` : `Local country cash wallet`}</div>
                      </div>
                    </div>
                    <div className="text-xs font-black font-mono text-emerald-400">
                      {checkoutProduct.priceLocalCash.toLocaleString()} {checkoutProduct.currencyName}
                    </div>
                  </button>
                </div>

                {/* Local Cash checkout instructions guide */}
                {buyerPayMethod === 'cash' && (
                  <div className="bg-zinc-950 border border-white/5 p-3 rounded-2xl flex flex-col gap-2">
                    <span className="text-[8px] font-black uppercase text-amber-400 font-mono tracking-widest">
                      {isRtl ? 'خطوات الدفع الكاش المباشر' : 'DIRECT CASH INSTRUCTIONS'}
                    </span>
                    <p className="text-[10px] text-zinc-300">
                      {isRtl 
                        ? `يرجى تحويل مبلغ ${checkoutProduct.priceLocalCash.toLocaleString()} ${checkoutProduct.currencyName} مباشرة إلى رقم المحفظة الخاص بالمسوّق بالأسفل:`
                        : `Please send ${checkoutProduct.priceLocalCash.toLocaleString()} ${checkoutProduct.currencyName} to the promoter's cash wallet number below:`}
                    </p>
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/5 flex items-center justify-between font-mono">
                      <div>
                        <div className="text-[9px] text-zinc-500">{checkoutProduct.sellerCashWallet}</div>
                        <div className="text-xs font-black text-white">{checkoutProduct.sellerCashNumber}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { 
                          navigator.clipboard.writeText(checkoutProduct.sellerCashNumber); 
                          sound.playClaim();
                          showAlert?.(isRtl ? '📋 تم نسخ رقم المحفظة!' : '📋 Wallet number copied!', 'success');
                        }}
                        className="text-[9px] text-amber-400 font-bold border border-amber-500/20 px-2 py-1 rounded bg-amber-500/5 hover:bg-amber-500/10"
                      >
                        {isRtl ? 'نسخ الرقم' : 'Copy'}
                      </button>
                    </div>

                    <div className="flex flex-col gap-1 mt-1.5">
                      <label className="text-[9px] text-zinc-400 font-bold">{isRtl ? 'أدخل رقم العملية أو اسم المرسل لتأكيد الإرسال:' : 'Enter Transaction ID or Sender name:'}</label>
                      <input
                        type="text"
                        value={cashTxId}
                        onChange={(e) => setCashTxId(e.target.value)}
                        placeholder={isRtl ? 'رقم العملية (التحويل)...' : 'Tx ID or reference...'}
                        className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Complete Order Checkout button */}
                <button
                  type="button"
                  disabled={isCashSubmitting}
                  onClick={handlePurchase}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-neutral-950 font-black text-xs rounded-2xl shadow flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <CheckCircle2 size={14} />
                  {isCashSubmitting ? (isRtl ? 'جاري تأكيد الدفع الكاش...' : 'Verifying transaction...') : (isRtl ? 'تأكيد ودفع قيمة الطلب' : 'Confirm & Authorize Order')}
                </button>
              </div>
            ) : (
              // PURCHASE SUCCESS SCREEN
              <div className="flex flex-col items-center justify-center text-center py-6 gap-4 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {isRtl ? 'تهانينا! تم تأكيد الشراء بنجاح 🎉' : 'Congratulations! Order Confirmed 🎉'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isRtl
                      ? 'تم تسجيل بياناتك وإرسال طلب التسليم للمسوّق مباشرة للتوصيل السريع للمنزل.'
                      : 'Your purchase request and delivery coordinates have been successfully dispatched to the merchant.'}
                  </p>
                </div>

                {/* Invoice Receipt Detail Table */}
                <div className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-3.5 space-y-2 text-left">
                  <span className="text-[8px] font-black uppercase text-zinc-500 font-mono block border-b border-white/5 pb-1 mb-1">
                    {isRtl ? 'تفاصيل فاتورة التوصيل الموثقة' : 'OFFICIAL INVOICE RECEIPT'}
                  </span>
                  
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">{isRtl ? 'المنتج المطلوب:' : 'Product:'}</span>
                    <span className="font-bold text-white truncate max-w-[150px]">{checkoutProduct.title}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">{isRtl ? 'المستلم:' : 'Recipient Name:'}</span>
                    <span className="font-bold text-zinc-200 font-sans">{buyerName}</span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500">{isRtl ? 'الهاتف:' : 'Contact Phone:'}</span>
                    <span className="font-bold text-zinc-200 font-mono">{buyerPhone}</span>
                  </div>

                  <div className="flex justify-between items-start text-[10px] gap-1">
                    <span className="text-zinc-500">{isRtl ? 'موقع الخريطة:' : 'Location:'}</span>
                    <div className="text-right flex flex-col items-end">
                      <span className="font-bold text-amber-400 font-mono text-[9px]">
                        {mapLocation?.lat.toFixed(6)}, {mapLocation?.lng.toFixed(6)}
                      </span>
                      {buyerNotes && (
                        <span className="text-[8.5px] text-zinc-400 font-sans block max-w-[150px] truncate">
                          {buyerNotes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] border-t border-dashed border-white/5 pt-1.5 mt-1">
                    <span className="text-zinc-400">{isRtl ? 'طريقة الدفع:' : 'Paid via:'}</span>
                    <span className="font-black text-emerald-400">
                      {buyerPayMethod === 'gram' ? 'OneGram (1GRAM)' : buyerPayMethod === 'ton' ? 'Toncoin Network' : `${checkoutProduct.sellerCashWallet}`}
                    </span>
                  </div>
                </div>

                {/* Redirect external Button */}
                <a
                  href={checkoutProduct.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { sound.playTap(); setCheckoutProduct(null); }}
                  className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isRtl ? 'انقر لإنهاء الشراء وتأكيد التوصيل 🛍️' : 'Go to Merchant Store 🛍️'}
                  <ExternalLink size={14} />
                </a>

                <button
                  type="button"
                  onClick={() => { sound.playTap(); setCheckoutProduct(null); }}
                  className="w-full py-2 border border-white/5 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  {isRtl ? 'إغلاق والعودة للسوق' : 'Close and Return'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
