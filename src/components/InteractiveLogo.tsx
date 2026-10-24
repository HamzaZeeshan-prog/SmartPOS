import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Cloud, 
  Barcode, 
  Printer, 
  Store, 
  User, 
  Calculator,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { Shop, User as UserType } from '../types/pos';

interface InteractiveLogoProps {
  activeShop: Shop;
  currentUser: UserType;
  cloudConnected: boolean;
  onOpenZReport?: () => void;
  onOpenScanner?: () => void;
  onNavigateToPos?: () => void;
}

export const InteractiveLogo: React.FC<InteractiveLogoProps> = ({
  activeShop,
  currentUser,
  cloudConnected,
  onOpenZReport,
  onOpenScanner,
  onNavigateToPos,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Play realistic POS optical scanner beep
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch supermarket scanner tone
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);

      gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // Audio fallback
    }
  };

  const handleLogoClick = () => {
    setIsScanning(true);
    playScanBeep();
    setIsOpen(!isOpen);
    setTimeout(() => setIsScanning(false), 600);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="relative">
      {/* Interactive Logo Button */}
      <button
        onClick={handleLogoClick}
        className="group relative flex items-center gap-2.5 p-1.5 -m-1.5 rounded-2xl hover:bg-slate-800/60 transition-all cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        title="Click to open Smart POS Terminal Diagnostics HUD"
      >
        {/* Animated Icon Avatar */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-[1.5px] shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden relative">
            {/* Background scanner grid pattern */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]" />

            {/* Glowing Laser Scanline Animation */}
            <div 
              className={`absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent transition-all pointer-events-none ${
                isScanning 
                  ? 'top-1/2 opacity-100 shadow-[0_0_12px_#38bdf8] scale-y-150 animate-pulse' 
                  : 'top-0 group-hover:top-full opacity-0 group-hover:opacity-100 duration-1000'
              }`}
            />

            {/* Monogram / Barcode Icon */}
            <div className="relative flex flex-col items-center justify-center">
              <span className="font-black text-sm tracking-tighter bg-gradient-to-br from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                SP
              </span>
              {/* Mini barcode lines beneath letters */}
              <div className="flex gap-[1.5px] items-center mt-[1px]">
                <div className="w-[1.5px] h-1.5 bg-blue-400 rounded-full" />
                <div className="w-[1px] h-1 bg-cyan-400 rounded-full" />
                <div className="w-[2px] h-1.5 bg-blue-400 rounded-full" />
                <div className="w-[1px] h-1 bg-cyan-400 rounded-full" />
              </div>
            </div>
          </div>

          {/* Pulse ring indicator */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-slate-900"></span>
          </span>
        </div>

        {/* Brand Text & Status */}
        <div className="hidden sm:block">
          <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
            <span>Smart POS</span>
            <span className="text-[10px] text-cyan-400 font-mono font-medium">PRO</span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Ready · Tap for HUD</span>
          </div>
        </div>
      </button>

      {/* Terminal Diagnostics & Quick HUD Popover */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />

          <div className="absolute left-0 top-full mt-2 w-80 sm:w-88 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* HUD Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Terminal Diagnostics HUD</h4>
                  <p className="text-[10px] text-slate-400">Smart POS System Health</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Hardware & Cloud Status List */}
            <div className="py-3 space-y-2 border-b border-slate-800/80">
              {/* Cloud Sync Status */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Cloud className={`w-3.5 h-3.5 ${cloudConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <div>
                    <div className="text-[11px] font-semibold text-white">Database Engine</div>
                    <div className="text-[9px] text-slate-400">
                      {cloudConnected ? 'Cloud Firestore ↔ Drift SQLite' : 'Offline Drift SQLite Storage'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  cloudConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {cloudConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Barcode Scanner Gun */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Barcode className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-white">USB / Wireless Gun</div>
                    <div className="text-[9px] text-slate-400">HID Wedge Listener Active</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                  READY
                </span>
              </div>

              {/* Thermal Printer */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Printer className="w-3.5 h-3.5 text-indigo-400" />
                  <div>
                    <div className="text-[11px] font-semibold text-white">Receipt Printer</div>
                    <div className="text-[9px] text-slate-400">
                      {activeShop.thermalPrinterWidth || '80mm'} ESC/POS & RJ11 Drawer
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Quick Tools & Shortcuts */}
            <div className="pt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  playScanBeep();
                  setSoundEnabled(!soundEnabled);
                }}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left flex items-center gap-2 transition-colors cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-white">Scan Audio</div>
                  <div className="text-[9px] text-slate-400">{soundEnabled ? 'Enabled' : 'Muted'}</div>
                </div>
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-left flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-bold text-white">Fullscreen</div>
                  <div className="text-[9px] text-slate-400">{isFullscreen ? 'Exit' : 'Kiosk Mode'}</div>
                </div>
              </button>
            </div>

            {/* Direct Shortcuts */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Active Operator:</span>
              <span className="font-semibold text-white">{currentUser.name}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
