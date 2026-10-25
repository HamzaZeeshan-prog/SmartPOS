import React, { useState } from 'react';
import { ArchitectureViewer } from './ArchitectureViewer';
import { Phase2CodeViewer } from './Phase2CodeViewer';
import { Phase3CodeViewer } from './Phase3CodeViewer';
import { Phase4CodeViewer } from './Phase4CodeViewer';
import { Phase5CodeViewer } from './Phase5CodeViewer';
import { Phase6CodeViewer } from './Phase6CodeViewer';
import { Phase7CodeViewer } from './Phase7CodeViewer';
import { Phase8CodeViewer } from './Phase8CodeViewer';
import { 
  Layers, 
  FileCode, 
  Cloud, 
  Barcode, 
  CreditCard, 
  Printer, 
  RefreshCw, 
  Calculator,
  ChevronRight,
  Sparkles,
  Database,
  Cpu,
  CheckCircle2,
  Download,
  Check
} from 'lucide-react';
import { downloadFlutterProjectZip } from '../services/flutterExportService';

interface PhaseMeta {
  id: number;
  title: string;
  subtitle: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PHASES: PhaseMeta[] = [
  {
    id: 1,
    title: 'Phase 1: Architecture & Drift Schema',
    subtitle: 'Clean Architecture, Drift SQLite tables, repository patterns & offline storage',
    tag: 'Drift / SQLite',
    icon: Layers,
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 2,
    title: 'Phase 2: Theme, Auth & Setup',
    subtitle: 'Material 3 Dark/Light UI, Riverpod auth state, multi-role RBAC & onboarding wizard',
    tag: 'Riverpod & Theme',
    icon: FileCode,
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 3,
    title: 'Phase 3: Cloud Firestore Sync',
    subtitle: 'Bi-directional sync engine, security rules, inventory catalog & stock adjustments',
    tag: 'Cloud Firestore',
    icon: Cloud,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 4,
    title: 'Phase 4: Barcode Scanner & Lookup',
    subtitle: 'Mobile camera scanner (mobile_scanner), USB HID hardware keyboard wedge & lookup cache',
    tag: 'Camera & USB HID',
    icon: Barcode,
    color: 'from-cyan-500 to-blue-600',
  },
  {
    id: 5,
    title: 'Phase 5: POS Cart & Multi-Payment',
    subtitle: 'High-speed POS cart, split tender, JazzCash, Easypaisa, Raast dynamic QR & Udhaar',
    tag: 'POS Controller & QR',
    icon: CreditCard,
    color: 'from-blue-600 to-violet-600',
  },
  {
    id: 6,
    title: 'Phase 6: Thermal Receipts & ESC/POS',
    subtitle: 'Dual 58mm/80mm ESC/POS command stream, cash drawer kick pulse & WhatsApp sharing',
    tag: 'ESC/POS & Invoicing',
    icon: Printer,
    color: 'from-emerald-500 to-green-600',
  },
  {
    id: 7,
    title: 'Phase 7: Sales Ledger & Khata',
    subtitle: 'Item-level partial refunds with auto-restock, customer Udhaar ledger & supplier payouts',
    tag: 'Khata & Refunds',
    icon: RefreshCw,
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 8,
    title: 'Phase 8: Z-Report, P&L & Sync Queue',
    subtitle: 'Daily Closing Z-Report, till reconciliation, P&L with COGS, and SQLite mutation sync queue',
    tag: 'Z-Report & P&L',
    icon: Calculator,
    color: 'from-amber-500 to-orange-600',
  },
];

export const FlutterArchitectureHub: React.FC = () => {
  const [activePhase, setActivePhase] = useState<number>(8);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadFlutterProjectZip();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  const currentMeta = PHASES.find((p) => p.id === activePhase) || PHASES[7];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Cross-Platform Flutter & Dart Hub
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All 8 Phases Complete
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Production Architecture & Dart Codebase
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              Complete production-grade Flutter, Riverpod, Drift SQLite, and Cloud Firestore source code for retail supermarkets, pharmacies, and stores. Select any phase below to inspect clean architecture contracts, models, controllers, and services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer min-h-[44px]"
            >
              {downloadSuccess ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              )}
              <span>{downloadSuccess ? 'Downloaded!' : isDownloading ? 'Packaging...' : 'Download Project (.zip)'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 px-4 py-2 rounded-xl min-h-[44px]">
              <Database className="w-4 h-4 text-emerald-400" />
              <div className="text-left text-xs">
                <div className="font-semibold text-white">Offline-First Engine</div>
                <div className="text-[11px] text-slate-400">Drift SQLite ↔ Firestore</div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Selector Tabs */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {PHASES.map((phase) => {
            const Icon = phase.icon;
            const isSelected = activePhase === phase.id;
            return (
              <button
                key={phase.id}
                onClick={() => setActivePhase(phase.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    Phase {phase.id}
                  </span>
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                <div className="text-xs font-bold truncate leading-snug">{phase.tag}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Header Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${currentMeta.color} flex items-center justify-center text-white shadow-md`}>
            <currentMeta.icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">{currentMeta.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentMeta.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            lib/src/features/{currentMeta.tag.toLowerCase().replace(/[^a-z0-9]/g, '_')}
          </span>
        </div>
      </div>

      {/* Embedded Phase Viewer Component */}
      <div className="transition-opacity duration-200">
        {activePhase === 1 && <ArchitectureViewer />}
        {activePhase === 2 && <Phase2CodeViewer />}
        {activePhase === 3 && <Phase3CodeViewer />}
        {activePhase === 4 && <Phase4CodeViewer />}
        {activePhase === 5 && <Phase5CodeViewer />}
        {activePhase === 6 && <Phase6CodeViewer />}
        {activePhase === 7 && <Phase7CodeViewer />}
        {activePhase === 8 && <Phase8CodeViewer />}
      </div>
    </div>
  );
};
