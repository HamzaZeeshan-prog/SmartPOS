import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Tablet, 
  Maximize2, 
  Download, 
  Cpu, 
  Wifi, 
  Battery, 
  Sparkles,
  Check,
  Layers,
  Code
} from 'lucide-react';
import { downloadFlutterProjectZip } from '../services/flutterExportService';

interface FlutterMobileFrameProps {
  children: React.ReactNode;
  onOpenCodeHub: () => void;
}

export type DeviceMode = 'phone' | 'tablet' | 'responsive';

export const FlutterMobileFrame: React.FC<FlutterMobileFrameProps> = ({
  children,
  onOpenCodeHub,
}) => {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('phone');
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFlutterProjectZip();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center">
      {/* Top Flutter Device Toolbar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Device Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[11px] font-mono text-cyan-400 font-bold hidden sm:inline flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" />
              FLUTTER ENGINE
            </span>

            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
              <button
                onClick={() => setDeviceMode('phone')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deviceMode === 'phone'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View as Mobile Phone (390 x 844)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-xs">Phone</span>
              </button>

              <button
                onClick={() => setDeviceMode('tablet')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deviceMode === 'tablet'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View as Tablet POS (768 x 1024)"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="text-xs">Tablet</span>
              </button>

              <button
                onClick={() => setDeviceMode('responsive')}
                className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  deviceMode === 'responsive'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Fullscreen Responsive View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-xs">Full</span>
              </button>
            </div>
          </div>

          {/* Right: Flutter Export & Code Hub Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCodeHub}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              title="Open full Flutter & Dart Architecture Viewer"
            >
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Dart Code Hub</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-h-[36px]"
              title="Download entire Flutter Mobile Project ready to run with 'flutter run'"
            >
              {downloadSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
              )}
              <span>{downloadSuccess ? 'Downloaded!' : isDownloading ? 'Packaging...' : 'Download Flutter App (.zip)'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <div className="flex-1 w-full flex items-center justify-center p-0 sm:p-4 md:p-6 overflow-x-hidden">
        {deviceMode === 'phone' && (
          <div className="w-full max-w-[420px] bg-slate-950 sm:border-[10px] sm:border-slate-800 sm:rounded-[48px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col relative sm:my-4 transition-all">
            {/* Phone Top Speaker & Dynamic Island Camera Notch */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-300 select-none shrink-0 z-40">
              <span className="font-semibold text-[13px] tracking-tight">{currentTime}</span>

              {/* Dynamic Island Pill */}
              <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-2 px-2 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-blue-500/40" />
                <span className="text-[9px] text-cyan-400 font-mono font-bold">SMART POS</span>
              </div>

              {/* Status Icons */}
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="text-[10px] font-mono font-bold">5G</span>
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>

            {/* Application Inside Phone */}
            <div className="flex-1 overflow-y-auto max-h-[820px] flex flex-col">
              {children}
            </div>

            {/* Bottom Home Indicator Bar */}
            <div className="bg-slate-900/90 py-1.5 flex justify-center shrink-0 border-t border-slate-800/60 select-none">
              <div className="w-32 h-1 bg-slate-500/60 rounded-full" />
            </div>
          </div>
        )}

        {deviceMode === 'tablet' && (
          <div className="w-full max-w-4xl bg-slate-950 sm:border-[12px] sm:border-slate-800 sm:rounded-[36px] sm:shadow-2xl overflow-hidden flex flex-col relative sm:my-4 transition-all">
            {/* Tablet Status Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs text-slate-300 select-none shrink-0">
              <span className="font-semibold text-xs tracking-tight">{currentTime} · Smart POS Tablet Pro</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-cyan-400">Sunmi / iPad OS Mode</span>
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Application Inside Tablet */}
            <div className="flex-1 overflow-y-auto max-h-[840px] flex flex-col">
              {children}
            </div>
          </div>
        )}

        {deviceMode === 'responsive' && (
          <div className="w-full flex-1 flex flex-col">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};
