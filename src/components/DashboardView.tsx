import React, { useState } from 'react';
import { Product, Sale, Shop, User } from '../types/pos';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  Plus, 
  Barcode, 
  FileText, 
  ArrowUpRight, 
  Clock, 
  Printer, 
  ShieldAlert, 
  Settings, 
  CheckCircle2,
  Calendar,
  Sparkles,
  Calculator
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  activeShop: Shop;
  currentUser: User;
  onNavigateToPos: () => void;
  onOpenScanner: () => void;
  onNavigateToInventory: () => void;
  onNavigateToHistory: () => void;
  onOpenOnboarding: () => void;
  onViewReceipt: (sale: Sale) => void;
  onOpenZReport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  activeShop,
  currentUser,
  onNavigateToPos,
  onOpenScanner,
  onNavigateToInventory,
  onNavigateToHistory,
  onOpenOnboarding,
  onViewReceipt,
  onOpenZReport,
}) => {
  const isCashier = currentUser.role === 'cashier';

  // 1. KPI Calculations
  const todayTotalSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayOrdersCount = sales.length;

  // Estimated profit: calculate sum of (unitPrice - costPrice) * quantity for sold items
  const estimatedProfit = sales.reduce((totalProfit, sale) => {
    const saleProfit = sale.items.reduce((itemProfit, item) => {
      const cost = item.product.costPrice || item.unitPrice * 0.75;
      const profitPerUnit = item.unitPrice - cost;
      return itemProfit + profitPerUnit * item.quantity - item.itemDiscount;
    }, 0);
    return totalProfit + saleProfit;
  }, 0);

  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minimumStockLimit);
  const totalInventoryValuation = products.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.sellingPrice * p.stockQuantity, 0);

  // 7-day sales mock trend with real today's sale as Day 7
  const sevenDaySales = [
    { day: 'Mon', date: 'Oct 18', total: 18450 },
    { day: 'Tue', date: 'Oct 19', total: 22100 },
    { day: 'Wed', date: 'Oct 20', total: 16900 },
    { day: 'Thu', date: 'Oct 21', total: 24500 },
    { day: 'Fri', date: 'Oct 22', total: 31200 },
    { day: 'Sat', date: 'Oct 23', total: 28900 },
    { day: 'Today', date: 'Oct 24', total: todayTotalSales || 26500 },
  ];

  const maxSale = Math.max(...sevenDaySales.map((d) => d.total));

  // Top selling products by frequency in sales
  const productSalesMap = new Map<string, { product: Product; quantity: number; revenue: number }>();
  sales.forEach((s) => {
    s.items.forEach((item) => {
      const existing = productSalesMap.get(item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.quantity * item.unitPrice;
      } else {
        productSalesMap.set(item.product.id, {
          product: item.product,
          quantity: item.quantity,
          revenue: item.quantity * item.unitPrice,
        });
      }
    });
  });

  const topSellingList = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {activeShop.name}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-400">{activeShop.city}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Store Performance Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Logged in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role.toUpperCase()}). Showing real-time figures for today.
          </p>
        </div>

        {/* Quick Operations Button Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateToPos}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New POS Sale
          </button>

          <button
            onClick={onOpenScanner}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Barcode className="w-4 h-4 text-blue-400" />
            Scan Barcode
          </button>

          {onOpenZReport && (
            <button
              onClick={onOpenZReport}
              className="px-3.5 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-emerald-800/40 transition-colors"
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              Z-Report Close
            </button>
          )}

          <button
            onClick={onOpenOnboarding}
            className="px-3.5 py-2.5 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-indigo-800/40 transition-colors"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            Shop Setup Wizard
          </button>
        </div>
      </div>

      {/* 5 Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1: Today's Total Sales */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 hover:border-emerald-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today's Sales</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-emerald-400 font-mono">
            {activeShop.currency} {todayTotalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">+14.2%</span> vs yesterday
          </div>
        </div>

        {/* KPI 2: Today's Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 hover:border-blue-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Today's Orders</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-white font-mono">
            {todayOrdersCount} <span className="text-xs font-normal text-slate-400">Bills</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Avg: {activeShop.currency} {todayOrdersCount > 0 ? Math.round(todayTotalSales / todayOrdersCount) : 0} / bill
          </div>
        </div>

        {/* KPI 3: Estimated Profit (Role-gated) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 hover:border-indigo-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Est. Gross Profit</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          {isCashier ? (
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 font-mono">•••••••••</div>
              <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Restricted to Owner/Mgr
              </div>
            </div>
          ) : (
            <>
              <div className="text-xl md:text-2xl font-bold text-indigo-400 font-mono">
                {activeShop.currency} {Math.round(estimatedProfit).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Margin: ~{todayTotalSales > 0 ? Math.round((estimatedProfit / todayTotalSales) * 100) : 22}%
              </div>
            </>
          )}
        </div>

        {/* KPI 4: Low Stock Alert */}
        <div 
          onClick={onNavigateToInventory}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 hover:border-amber-500/40 transition-all shadow-lg cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Low Stock Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl md:text-2xl font-bold text-amber-400 font-mono">
            {lowStockProducts.length} <span className="text-xs font-normal text-slate-400">Items</span>
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1">
            Tap to view & restock
          </div>
        </div>

        {/* KPI 5: Total Inventory Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 hover:border-purple-500/40 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Inventory Value</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          {isCashier ? (
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-500 font-mono">•••••••••</div>
              <div className="text-[10px] text-amber-400/80 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                Restricted to Owner/Mgr
              </div>
            </div>
          ) : (
            <>
              <div className="text-xl md:text-2xl font-bold text-purple-400 font-mono truncate">
                {activeShop.currency} {Math.round(totalInventoryValuation).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Retail: {activeShop.currency} {Math.round(totalRetailValuation).toLocaleString()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: 7-Day Chart & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales Trend (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                7-Day Sales Revenue Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Past week revenue curve with daily closing figures (PKR)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
              Total 7D: {activeShop.currency} {sevenDaySales.reduce((s, d) => s + d.total, 0).toLocaleString()}
            </span>
          </div>

          {/* Interactive Bar Chart Visualization */}
          <div className="pt-4">
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-slate-800 pb-2">
              {sevenDaySales.map((item, idx) => {
                const heightPercent = Math.max(15, Math.round((item.total / (maxSale * 1.15)) * 100));
                const isToday = idx === sevenDaySales.length - 1;

                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-700 px-2.5 py-1 rounded-md text-[10px] font-mono text-white pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      {item.date}: {activeShop.currency} {item.total.toLocaleString()}
                    </div>

                    <div className="w-full max-w-[48px] bg-slate-800/60 rounded-t-lg h-44 flex items-end p-1">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20'
                            : 'bg-gradient-to-t from-slate-700 to-blue-500/60 group-hover:from-blue-700 group-hover:to-blue-400'
                        }`}
                      />
                    </div>

                    <div className="text-center">
                      <div className={`text-[11px] font-bold ${isToday ? 'text-blue-400' : 'text-slate-300'}`}>
                        {item.day}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {(item.total / 1000).toFixed(1)}k
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Selling Products (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Top-Selling Items
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">High velocity products</p>
            </div>
            <button
              onClick={onNavigateToInventory}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {(topSellingList.length > 0 ? topSellingList : products.slice(0, 5).map(p => ({ product: p, quantity: 12, revenue: 12 * p.sellingPrice }))).map((item, idx) => (
              <div
                key={item.product.id}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.product.category} • {item.product.brand}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {activeShop.currency} {item.revenue.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">{item.quantity} sold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent Transactions & Invoices
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live cashier counter register sales
            </p>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            Full Ledger &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2 px-3">Invoice #</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Cashier</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Items</th>
                <th className="py-2 px-3 text-right">Grand Total</th>
                <th className="py-2 px-3 text-center">Payment</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sales.slice(0, 5).map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-3 text-blue-400 font-bold">{s.invoiceNumber}</td>
                  <td className="py-3 px-3 text-slate-400 font-sans">
                    {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-sans">{s.cashierName}</td>
                  <td className="py-3 px-3 text-slate-300 font-sans">
                    {s.customerName || <span className="text-slate-500 italic">Walk-in</span>}
                  </td>
                  <td className="py-3 px-3 text-slate-400">{s.items.length} items</td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                    {activeShop.currency} {s.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {s.payments[0]?.method || 'Paid'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onViewReceipt(s)}
                      className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                    >
                      <Printer className="w-3 h-3 text-emerald-400" />
                      Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
