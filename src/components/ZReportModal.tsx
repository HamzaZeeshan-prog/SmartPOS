import React, { useState } from 'react';
import { Sale, Expense, Shop, User, ZReportData } from '../types/pos';
import { 
  X, 
  Calculator, 
  Printer, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  CreditCard, 
  Receipt, 
  Calendar,
  Lock
} from 'lucide-react';

interface ZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  expenses: Expense[];
  shop: Shop;
  currentUser: User;
}

export const ZReportModal: React.FC<ZReportModalProps> = ({
  isOpen,
  onClose,
  sales,
  expenses,
  shop,
  currentUser,
}) => {
  const [openingCash, setOpeningCash] = useState<number>(5000);
  const [actualCountedCash, setActualCountedCash] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Financial aggregates
  const grossSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const refundsTotal = sales
    .filter((s) => s.isRefunded)
    .reduce((sum, s) => sum + s.grandTotal, 0);
  const netSales = grossSales - refundsTotal;

  // Breakdown by channel
  let cashSales = 0;
  let jazzCashSales = 0;
  let easypaisaSales = 0;
  let bankQrSales = 0;
  let cardSales = 0;
  let creditSales = 0;

  sales.forEach((s) => {
    s.payments.forEach((p) => {
      if (p.method === 'cash') cashSales += p.amount;
      if (p.method === 'jazzcash') jazzCashSales += p.amount;
      if (p.method === 'easypaisa') easypaisaSales += p.amount;
      if (p.method === 'bank_qr') bankQrSales += p.amount;
      if (p.method === 'card') cardSales += p.amount;
      if (p.method === 'customer_credit') creditSales += p.amount;
    });
  });

  const cashExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expectedCashInDrawer = openingCash + cashSales - cashExpenses - refundsTotal;

  const countedNum = actualCountedCash !== '' ? parseFloat(actualCountedCash) : null;
  const cashDifference = countedNum !== null ? countedNum - expectedCashInDrawer : null;

  const handlePrint = () => {
    window.print();
  };

  const generateZReportSlipText = () => {
    let t = `================================\n`;
    t += `      DAILY CLOSING Z-REPORT    \n`;
    t += `         ${shop.name.toUpperCase()}\n`;
    t += `   ${shop.address}, ${shop.city}\n`;
    t += `================================\n`;
    t += `Report ID: Z-${Date.now().toString().slice(-6)}\n`;
    t += `Closed By: ${currentUser.name} (${currentUser.role.toUpperCase()})\n`;
    t += `Date/Time: ${new Date().toLocaleString()}\n`;
    t += `--------------------------------\n`;
    t += `Opening Till Float:  PKR ${openingCash}\n`;
    t += `Gross Sales:         PKR ${grossSales}\n`;
    t += `Refunds / Returns:  -PKR ${refundsTotal}\n`;
    t += `NET SALES:           PKR ${netSales}\n`;
    t += `--------------------------------\n`;
    t += `PAYMENT BREAKDOWN:\n`;
    t += `Cash In Till:        PKR ${cashSales}\n`;
    t += `JazzCash Merchant:   PKR ${jazzCashSales}\n`;
    t += `Easypaisa QR:        PKR ${easypaisaSales}\n`;
    t += `Bank QR / Raast:     PKR ${bankQrSales}\n`;
    t += `Customer Credit:     PKR ${creditSales}\n`;
    t += `--------------------------------\n`;
    t += `DRAWER RECONCILIATION:\n`;
    t += `Opening Float:       PKR ${openingCash}\n`;
    t += `Cash Received (+):   PKR ${cashSales}\n`;
    t += `Cash Expenses (-):  -PKR ${cashExpenses}\n`;
    t += `Cash Refunds (-):   -PKR ${refundsTotal}\n`;
    t += `EXPECTED IN TILL:    PKR ${expectedCashInDrawer}\n`;
    if (countedNum !== null) {
      t += `COUNTED IN TILL:     PKR ${countedNum}\n`;
      t += `DIFFERENCE:          PKR ${cashDifference}\n`;
      t += `STATUS: ${cashDifference === 0 ? 'BALANCED' : cashDifference! < 0 ? 'SHORTAGE' : 'OVERAGE'}\n`;
    }
    t += `================================\n`;
    t += `Cashier Sign: __________________\n\n`;
    t += `Manager Sign: __________________\n`;
    t += `================================\n`;
    return t;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateZReportSlipText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Daily Closing Z-Report</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Shift Close
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Store: {shop.name} • Cashier: {currentUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top Key Figures Card */}
          <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[11px] text-slate-400">Net Shift Sales Revenue</span>
              <div className="text-2xl font-black text-white font-mono mt-0.5">
                {shop.currency} {netSales.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {sales.length} transactions processed
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[11px] text-slate-400">Expected Cash In Drawer</span>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {shop.currency} {expectedCashInDrawer.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Including float & cash expenses
              </div>
            </div>
          </div>

          {/* Cash Drawer Till Reconciliation Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Cash Drawer Till Count & Reconciliation
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Opening Till Float ({shop.currency})
                </label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Actual Physical Cash Counted ({shop.currency}) *
                </label>
                <input
                  type="number"
                  placeholder="Enter counted notes & coins"
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Over / Short Feedback Banner */}
            {countedNum !== null && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  cashDifference === 0
                    ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                    : cashDifference! < 0
                    ? 'bg-rose-950/30 border-rose-800/50 text-rose-300'
                    : 'bg-blue-950/30 border-blue-800/50 text-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  {cashDifference === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <div>
                    <strong className="block font-bold">
                      {cashDifference === 0
                        ? 'Cash Till Perfectly Balanced!'
                        : cashDifference! < 0
                        ? 'Till Shortage Detected'
                        : 'Till Overage Detected'}
                    </strong>
                    <span className="text-[11px] opacity-80">
                      {cashDifference === 0
                        ? 'Actual count matches the expected physical cash exactly.'
                        : cashDifference! < 0
                        ? 'Physical cash is less than computerized expectations.'
                        : 'Physical cash exceeds computerized expectations.'}
                    </span>
                  </div>
                </div>

                <div className="font-mono font-bold text-sm">
                  {cashDifference === 0
                    ? 'PKR 0'
                    : `${cashDifference! > 0 ? '+' : ''}${shop.currency} ${cashDifference!.toLocaleString()}`}
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Sales Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                Sales Ledger Summary
              </h5>
              <div className="divide-y divide-slate-800/80 font-mono">
                <div className="py-1.5 flex justify-between text-slate-400">
                  <span>Gross Sales:</span>
                  <span>{shop.currency} {grossSales.toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between text-rose-400">
                  <span>Returns & Refunds:</span>
                  <span>-{shop.currency} {refundsTotal.toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between text-slate-400">
                  <span>GST Tax Collected:</span>
                  <span>+{shop.currency} {sales.reduce((acc, s) => acc + s.taxTotal, 0).toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between font-bold text-white pt-2">
                  <span>Net Sales Revenue:</span>
                  <span>{shop.currency} {netSales.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment Channel Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h5 className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
                Collections by Channel
              </h5>
              <div className="divide-y divide-slate-800/80 font-mono">
                <div className="py-1.5 flex justify-between text-slate-300">
                  <span>Cash In Till:</span>
                  <span>{shop.currency} {cashSales.toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between text-rose-300">
                  <span>JazzCash API:</span>
                  <span>{shop.currency} {jazzCashSales.toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between text-emerald-300">
                  <span>Easypaisa QR:</span>
                  <span>{shop.currency} {easypaisaSales.toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between text-blue-300">
                  <span>Bank QR / Raast:</span>
                  <span>{shop.currency} {bankQrSales.toLocaleString()}</span>
                </div>
                <div className="py-1.5 flex justify-between text-amber-300">
                  <span>Customer Udhaar:</span>
                  <span>{shop.currency} {creditSales.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={handleCopyText}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Receipt className="w-4 h-4" />}
            {isCopied ? 'Z-Report Copied!' : 'Copy Z-Report Text'}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold min-h-[44px]"
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              Print Thermal (80mm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
