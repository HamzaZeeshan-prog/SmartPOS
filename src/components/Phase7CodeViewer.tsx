import React, { useState } from 'react';
import { 
  SALES_HISTORY_SCREEN_DART, 
  CUSTOMER_LEDGER_SCREEN_DART, 
  SUPPLIERS_SCREEN_DART, 
  EXPENSE_TRACKER_SCREEN_DART 
} from '../data/phase7Code';
import { 
  History, 
  Users, 
  Building2, 
  Receipt, 
  Copy, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  MessageSquare, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';

export const Phase7CodeViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'customers' | 'suppliers' | 'expenses'>('sales');
  const [copied, setCopied] = useState(false);

  const getCodeContent = () => {
    switch (activeTab) {
      case 'sales':
        return SALES_HISTORY_SCREEN_DART;
      case 'customers':
        return CUSTOMER_LEDGER_SCREEN_DART;
      case 'suppliers':
        return SUPPLIERS_SCREEN_DART;
      case 'expenses':
        return EXPENSE_TRACKER_SCREEN_DART;
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'sales':
        return 'lib/features/sales/presentation/sales_history_screen.dart';
      case 'customers':
        return 'lib/features/customers/presentation/customer_ledger_screen.dart';
      case 'suppliers':
        return 'lib/features/suppliers/presentation/suppliers_screen.dart';
      case 'expenses':
        return 'lib/features/expenses/presentation/expense_tracker_screen.dart';
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
      <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <History className="w-48 h-48 text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Phase 7 Production Deliverable
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Sales Refunds & Restocking, Customer Credit ("Udhaar") Ledger, Suppliers & Expenses
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Enterprise business logic for post-sale transactions: full and item-level partial refunds with automatic inventory restoration,
            customer credit ledger ("Khata") with WhatsApp payment reminders, vendor payables tracking, and daily operational expense logging.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">Item-Level Refunds</div>
                <div className="text-[10px] text-slate-400">Inventory restock</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">Udhaar Ledger</div>
                <div className="text-[10px] text-slate-400">Due wasooli & history</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">WhatsApp Alert</div>
                <div className="text-[10px] text-slate-400">One-click reminder</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">Expense Audit</div>
                <div className="text-[10px] text-slate-400">Cash drawer outflow</div>
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
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'sales'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              1. Sales & Item Refunds
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'customers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              2. Customer Khata & WhatsApp
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              3. Supplier Accounts
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'expenses'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4" />
              4. Expense Tracker
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
            <RefreshCw className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Inventory Consistency On Refund</strong>
              Returned item quantities automatically decrement the sales ledger totals and increment the product <code className="text-slate-300 font-mono">stockQuantity</code> in Drift and Firestore.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Bi-Directional Udhaar Ledger</strong>
              Every credit purchase generates a debit entry (+ balance), and every payment collection generates a credit entry (- balance).
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Cash Flow Audit Trail</strong>
              Expenses record which cashier/manager authorized the cash outflow from the till, preventing drawer shortages.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
