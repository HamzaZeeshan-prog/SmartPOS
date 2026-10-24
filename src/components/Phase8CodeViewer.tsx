import React, { useState } from 'react';
import { 
  Z_REPORT_SCREEN_DART, 
  PROFIT_LOSS_SCREEN_DART, 
  OFFLINE_SYNC_QUEUE_DART, 
  RBAC_POLICY_DART 
} from '../data/phase8Code';
import { 
  Calculator, 
  TrendingUp, 
  CloudOff, 
  ShieldCheck, 
  Copy, 
  Check, 
  CheckCircle2, 
  FileText, 
  Lock, 
  DollarSign, 
  Printer 
} from 'lucide-react';

export const Phase8CodeViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'zreport' | 'pnl' | 'sync' | 'rbac'>('zreport');
  const [copied, setCopied] = useState(false);

  const getCodeContent = () => {
    switch (activeTab) {
      case 'zreport':
        return Z_REPORT_SCREEN_DART;
      case 'pnl':
        return PROFIT_LOSS_SCREEN_DART;
      case 'sync':
        return OFFLINE_SYNC_QUEUE_DART;
      case 'rbac':
        return RBAC_POLICY_DART;
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'zreport':
        return 'lib/features/reports/presentation/z_report_screen.dart';
      case 'pnl':
        return 'lib/features/reports/presentation/profit_loss_screen.dart';
      case 'sync':
        return 'lib/core/sync/offline_sync_queue.dart';
      case 'rbac':
        return 'lib/core/security/rbac_policy.dart';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Calculator className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Phase 8 Production Deliverable (Final Milestone)
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Daily Closing Z-Report, Profit & Loss (P&L), Offline SQLite Queue & Multi-Role RBAC
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            End-of-day financial close with cash drawer reconciliation (over/short till balancing), Cost of Goods Sold (COGS) analytics,
            zero-data-loss SQLite offline mutation replay engine, and role-based access control protecting profit margins from cashier access.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">Z-Report Shift Close</div>
                <div className="text-[10px] text-slate-400">Till count & over/short</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">P&L & COGS</div>
                <div className="text-[10px] text-slate-400">Gross & net margins</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">SQLite Sync Queue</div>
                <div className="text-[10px] text-slate-400">Auto retry backoff</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">Multi-Role RBAC</div>
                <div className="text-[10px] text-slate-400">Owner/Manager/Cashier</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Navigation Bar */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('zreport')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'zreport'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Calculator className="w-4 h-4" />
              1. Z-Report & Till Reconciliation
            </button>

            <button
              onClick={() => setActiveTab('pnl')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'pnl'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              2. Profit & Loss (P&L) Engine
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'sync'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CloudOff className="w-4 h-4" />
              3. Offline SQLite Sync Queue
            </button>

            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'rbac'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              4. RBAC Policy & Route Guards
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {getFileName()}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Source'}
            </button>
          </div>
        </div>

        {/* Code Canvas */}
        <div className="p-4 sm:p-6 overflow-x-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed max-h-[650px] overflow-y-auto">
          <pre>{getCodeContent()}</pre>
        </div>

        {/* Technical Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <Calculator className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Z-Report Immutable Shift Snapshot</strong>
              Calculates expected cash based on cash sales minus cash expenses and returns, computing exact cash over/short.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">COGS & Margin Analytics</strong>
              Matches every line item to its unit cost price, computing true Gross Profit and Net Margin after subtracting operating expenses.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Role-Level Data Isolation</strong>
              Cashiers are strictly prevented from viewing shop profits, cost prices, or modifying store profile configurations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
