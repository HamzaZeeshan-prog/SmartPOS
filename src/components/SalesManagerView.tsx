import React, { useState } from 'react';
import { Sale, Shop, User } from '../types/pos';
import { 
  History, 
  Search, 
  Filter, 
  Printer, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  CreditCard,
  UserCheck,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface SalesManagerViewProps {
  sales: Sale[];
  activeShop: Shop;
  currentUser: User;
  onOpenReceipt: (sale: Sale) => void;
  onOpenRefund: (sale: Sale) => void;
}

export const SalesManagerView: React.FC<SalesManagerViewProps> = ({
  sales,
  activeShop,
  currentUser,
  onOpenReceipt,
  onOpenRefund,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [filterRefundStatus, setFilterRefundStatus] = useState<'all' | 'settled' | 'refunded'>('all');

  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      s.cashierName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMethod =
      selectedMethod === 'all' ||
      s.payments.some((p) => p.method === selectedMethod);

    const matchesRefund =
      filterRefundStatus === 'all' ||
      (filterRefundStatus === 'refunded' && (s.isRefunded || s.isPartiallyRefunded)) ||
      (filterRefundStatus === 'settled' && !s.isRefunded && !s.isPartiallyRefunded);

    return matchesSearch && matchesMethod && matchesRefund;
  });

  // Calculate summary metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalRefundsAmount = sales.reduce((sum, s) => sum + (s.refundAmount || (s.isRefunded ? s.grandTotal : 0)), 0);
  const netRevenue = totalSalesRevenue - totalRefundsAmount;
  const refundedOrdersCount = sales.filter((s) => s.isRefunded || s.isPartiallyRefunded).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Sales Volume</span>
            <Receipt className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {activeShop.currency} {totalSalesRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {sales.length} total processed orders
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Refunds & Returns</span>
            <RefreshCw className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {activeShop.currency} {totalRefundsAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {refundedOrdersCount} returned transactions
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Shop Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {activeShop.currency} {netRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">
            After inventory returns deducted
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cashier Terminal Guard</span>
            <UserCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            {currentUser.name}
          </div>
          <div className="text-[11px] text-indigo-400 uppercase font-bold tracking-wider mt-1">
            Role: {currentUser.role}
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Sales Ledger & Invoices
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time audit log mirrored to Cloud Firestore: /shops/{activeShop.id}/sales
            </p>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
              <button
                onClick={() => setFilterRefundStatus('all')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterRefundStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Orders ({sales.length})
              </button>
              <button
                onClick={() => setFilterRefundStatus('settled')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterRefundStatus === 'settled'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Settled ({sales.length - refundedOrdersCount})
              </button>
              <button
                onClick={() => setFilterRefundStatus('refunded')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filterRefundStatus === 'refunded'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Refunds ({refundedOrdersCount})
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoice number, cashier, customer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 w-full sm:w-auto"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash in Drawer</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="bank_qr">Bank QR / Raast</option>
              <option value="card">Debit / Credit Card</option>
              <option value="customer_credit">Customer Credit (Udhaar)</option>
            </select>
          </div>
        </div>

        {/* Mobile View: Transaction Cards (<md) */}
        <div className="md:hidden space-y-3">
          {filteredSales.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No transactions match the selected filters.
            </div>
          ) : (
            filteredSales.map((s) => {
              const isRefunded = s.isRefunded;
              const isPartial = s.isPartiallyRefunded;

              return (
                <div
                  key={s.id}
                  className={`p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 ${
                    isRefunded ? 'bg-rose-950/10 border-rose-900/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-blue-400 text-xs">{s.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(s.createdAt).toLocaleDateString()} · {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${isRefunded ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                        {activeShop.currency} {s.grandTotal.toLocaleString()}
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {s.payments[0]?.method.replace('_', ' ') || 'Paid'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400">Customer: </span>
                      <span className="text-white font-medium">{s.customerName || 'Walk-in Customer'}</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      {s.items.reduce((sum, item) => sum + item.quantity, 0)} units · {s.cashierName}
                    </div>
                  </div>

                  {isRefunded && (
                    <div className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Fully Refunded
                    </div>
                  )}
                  {isPartial && (
                    <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Partially Refunded (-{activeShop.currency} {s.refundAmount})
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => onOpenReceipt(s)}
                      className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      View / Print Slip
                    </button>

                    <button
                      onClick={() => onOpenRefund(s)}
                      disabled={isRefunded}
                      className="py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                      Refund
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Table (>=md) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Items</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Payment Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const isRefunded = s.isRefunded;
                  const isPartial = s.isPartiallyRefunded;

                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isRefunded ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-blue-400">{s.invoiceNumber}</div>
                        {isRefunded && (
                          <span className="text-[10px] text-rose-400 font-sans font-bold flex items-center gap-1 mt-0.5">
                            <RefreshCw className="w-3 h-3" /> Fully Refunded
                          </span>
                        )}
                        {isPartial && (
                          <span className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-1 mt-0.5">
                            <RefreshCw className="w-3 h-3" /> Partially Refunded (-{activeShop.currency} {s.refundAmount})
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 font-sans">
                        <div>{new Date(s.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300 font-sans">{s.cashierName}</td>

                      <td className="py-3.5 px-3 text-slate-300 font-sans">
                        {s.customerName ? (
                          <span className="text-white font-medium">{s.customerName}</span>
                        ) : (
                          <span className="text-slate-500 italic">Walk-in</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-slate-400">
                        {s.items.reduce((sum, item) => sum + item.quantity, 0)} units
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className={`font-bold ${isRefunded ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                          {activeShop.currency} {s.grandTotal.toLocaleString()}
                        </div>
                        {s.discountTotal > 0 && (
                          <div className="text-[10px] text-slate-500">Disc: -{s.discountTotal}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="text-[11px] font-sans font-medium text-slate-300 uppercase">
                          {s.payments[0]?.method.replace('_', ' ') || 'Paid'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          <button
                            onClick={() => onOpenReceipt(s)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Reprint thermal slip or view A4 tax invoice"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-400" />
                            Slip
                          </button>

                          <button
                            onClick={() => onOpenRefund(s)}
                            disabled={isRefunded}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Process full or item-level refund and restock"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                            Refund
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
