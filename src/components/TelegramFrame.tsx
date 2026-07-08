import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Smartphone, Monitor, Wifi, Battery, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { sound } from './AudioSynth';

interface TelegramFrameProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  bandwidthMiningOn?: boolean;
  accumulatedTonReward?: number;
  sharedMB?: number;
  autoSwapToTon?: boolean;
  isRtl?: boolean;
}

export default function TelegramFrame({
  children,
  isFullscreen,
  setIsFullscreen,
  soundEnabled,
  setSoundEnabled,
  bandwidthMiningOn = false,
  accumulatedTonReward = 0,
  sharedMB = 0,
  autoSwapToTon = true,
  isRtl = false,
}: TelegramFrameProps) {
  const [timeStr, setTimeStr] = useState('12:00 PM');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hr = d.getHours();
      const min = d.getMinutes().toString().padStart(2, '0');
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      hr = hr ? hr : 12; // if 0, then 12
      setTimeStr(`${hr}:${min} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    sound.enabled = newVal;
    if (newVal) {
      sound.playTap();
    }
  };

  if (isFullscreen) {
    return (
      <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] bg-neutral-950 text-white font-sans flex flex-col justify-between overflow-hidden">
        {/* Floating Quick Controls Bar on Desktop Fullscreen */}
        <div className="h-12 border-b border-white/5 bg-neutral-900/40 backdrop-blur-md px-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs">🐝</div>
            <span className="font-display font-medium text-xs tracking-wide uppercase text-neutral-300">Queen Bee Telegram Mini App ⚡</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="sound-toggle-fullscreen"
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition duration-200"
              title={soundEnabled ? "Mute audio synthesizer" : "Unmute audio synthesizer"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              id="exit-fullscreen"
              onClick={() => {
                sound.playTap();
                setIsFullscreen(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyber-blue/20 hover:bg-cyber-blue/30 text-cyber-blue border border-cyber-blue/30 rounded-lg text-xs font-semibold transition duration-200"
            >
              <Smartphone size={13} />
              <span>Simulate Telegram Frame</span>
            </button>
          </div>
        </div>
        <div className="flex-1 relative flex flex-col min-h-0 bg-neutral-950">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[100dvh] max-h-[100dvh] md:min-h-screen md:max-h-none ancient-mythic-bg text-neutral-100 flex items-center justify-center p-0 md:p-6 overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(223,177,91,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/10 to-transparent pointer-events-none" />
      
      {/* Outer Phone Wrapper styled like an Ancient Gilded Stone Artifact */}
      <div className="w-full max-w-md h-full md:h-[860px] md:rounded-[48px] md:border-8 md:border-stone-800 md:shadow-[0_0_80px_rgba(223,177,91,0.18)] bg-neutral-950 flex flex-col overflow-hidden relative transition-all duration-300 border-x-0 md:ring-1 md:ring-amber-500/20 ring-offset-black">
        
        {/* Phone Speaker & Camera Notch (Only visible on MD/Desktop) */}
        <div className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-stone-900 rounded-full z-50 border border-amber-500/10">
          <div className="w-12 h-1 bg-stone-700 mx-auto mt-1 rounded-full" />
          <div className="absolute top-1 right-8 w-2 h-2 rounded-full bg-stone-900 border border-stone-700" />
        </div>

        {/* Smartphone top bar Simulation */}
        <div className="flex justify-between items-center px-4 md:px-6 pt-3 pb-2 text-xs font-medium text-neutral-400 bg-neutral-900 select-none z-40">
          <div className="flex items-center gap-1.5 min-w-0">
            <span>{timeStr}</span>
            {bandwidthMiningOn && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/10 to-emerald-500/15 border border-amber-500/30 text-[8.5px] font-black text-amber-400 font-mono tracking-tight animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping shrink-0" />
                <span>📡 {sharedMB?.toFixed(1)}M ➔ {autoSwapToTon ? (isRtl ? 'تلقائي' : 'Auto') : accumulatedTonReward?.toFixed(4)} gram</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Wifi size={12} className="text-neutral-400" />
            <span className="text-[10px] tracking-widest text-neutral-400 font-mono">5G</span>
            <Battery size={14} className="text-emerald-500 fill-emerald-500/20" />
          </div>
        </div>

        {/* Telegram App Bar (Mock interface headers) */}
        <div className="flex justify-between items-center py-2.5 px-4 bg-neutral-900 border-b border-white/5 select-none z-40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg shadow-inner select-none animate-pulse">🐝</div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm leading-tight text-white font-display">Queen Bee Bot</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/20 px-1 rounded-sm leading-none font-medium scale-90">Bot</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-none">Queen Bee Telegram Mini App</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="sound-toggle-phone"
              onClick={toggleSound}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition duration-200"
              title={soundEnabled ? "Mute sound synthesis" : "Unmute sound synthesis"}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            <button
              id="enter-fullscreen"
              onClick={() => {
                sound.playTap();
                setIsFullscreen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-semibold text-neutral-300 transition duration-200"
              title="Expand to Fullscreen Console"
            >
              <Monitor size={10} />
              <span>Fullscreen</span>
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => {
                sound.playTap();
                window.location.reload();
              }}
              className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition duration-200"
              title="Reload App"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Actual Nested Web App Panel inside Simulated Container */}
        <div className="flex-1 relative flex flex-col min-h-0 bg-neutral-950">
          {children}
        </div>
      </div>
    </div>
  );
}
