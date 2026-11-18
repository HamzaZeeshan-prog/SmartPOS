import React from 'react';
import { Sale, Expense, Product, Shop, User } from '../types/pos';
import { getShopEntitlements } from '../data/saasConfig';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Lock, 
  Award, 
  Package, 
  BarChart3,
  Crown
} from 'lucide-react';

interface ProfitLossViewProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  shop: Shop;
  currentUser: User;
  onOpenUpgrade?: () => void;
}

export const ProfitLossView: React.FC<ProfitLossViewProps> = ({
  sales,
  expenses,
  shop,
  currentUser,
  onOpenUpgrade,
}) => {
  const entitlements = getShopEntitlements(shop);

  // Plan Guard: Starter Monthly disables P&L & Margins analytics
  if (!entitlements.allowProfitLoss) {
    return (
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
          <Crown className="w-3.5 h-3.5" />
          Business Pro Monthly Feature
        </div>
        <h3 className="text-xl font-bold text-white">P&L & Margin Analytics Disabled on Starter Monthly</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your business <strong className="text-white">{shop.name}</strong> is subscribed to <strong>{entitlements.planName}</strong>. Profit & Loss statements, COGS breakdowns, multi-branch expansion, custom cashiers/managers, expiry alerts, and Cloud Sync require <strong>Business Pro Monthly</strong>.
        </p>
        {onOpenUpgrade && currentUser.role === 'owner' && (
          <button
            type="button"
            onClick={onOpenUpgrade}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Upgrade to Business Pro (PKR 4,900/mo)
          </button>
        )}
      </div>
    );
  }

  // RBAC Guard: Cashiers cannot view profit margins
  if (currentUser.role === 'cashier') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white">Access Restricted: Role-Based Security</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The Profit & Loss statement and Cost of Goods Sold (COGS) analytics contain sensitive store financial margins and are restricted to <strong>Owners</strong> and <strong>Store Managers</strong>.
        </p>
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
          Current Role: <span className="text-amber-400 font-bold uppercase">{currentUser.role}</span> ({currentUser.name})
        </div>
      </div>
    );
  }

  // 1. Operating Revenue
  const grossSales = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const returns = sales
    .filter((s) => s.isRefunded)
    .reduce((sum, s) => sum + s.grandTotal, 0);
  const netRevenue = grossSales - returns;

  // 2. Cost of Goods Sold (COGS)
  let cogs = 0;
  const productProfitMap: { [productId: string]: { name: string; soldQty: number; revenue: number; cost: number; profit: number } } = {};

  sales.forEach((s) => {
    if (!s.isRefunded) {
      s.items.forEach((item) => {
        const itemCost = item.product.costPrice * item.quantity;
        const itemRevenue = item.unitPrice * item.quantity;
        const itemProfit = itemRevenue - itemCost;

        cogs += itemCost;

        if (!productProfitMap[item.product.id]) {
          productProfitMap[item.product.id] = {
            name: item.product.name,
            soldQty: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
          };
        }
        productProfitMap[item.product.id].soldQty += item.quantity;
        productProfitMap[item.product.id].revenue += itemRevenue;
        productProfitMap[item.product.id].cost += itemCost;
        productProfitMap[item.product.id].profit += itemProfit;
      });
    }
  });

  // 3. Gross Profit
  const grossProfit = netRevenue - cogs;
  const grossMarginPct = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // 4. Operating Expenses
  const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 5. Net Profit
  const netProfit = grossProfit - totalOperatingExpenses;
  const netMarginPct = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  // Top 5 profitable items
  const topProfitableProducts = Object.values(productProfitMap)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Net Profit Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Operating Revenue</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {shop.currency} {netRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gross {shop.currency} {grossSales.toLocaleString()} less returns
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Cost of Goods Sold (COGS)</span>
            <Package className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {shop.currency} {cogs.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Wholesale inventory acquisition cost
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Operating Profit</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {shop.currency} {grossProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400/80 font-bold mt-1">
            Gross Margin: {grossMarginPct.toFixed(1)}%
          </div>
        </div>

        <div className={`border rounded-2xl p-5 shadow-xl ${
          netProfit >= 0
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-800/50'
            : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-rose-800/50'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Business Profit</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`text-2xl font-black font-mono mt-1 ${
            netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {shop.currency} {netProfit.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Net Margin: <strong className="text-white">{netMarginPct.toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Main Statement Breakdown Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Comprehensive Income Statement
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Standard retail GAAP income & expenditure audit for {shop.name}
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              FY 2026-27
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* 1. Operating Revenue */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-sans">
                1. Operating Revenue & Turnaround
              </div>
              <div className="divide-y divide-slate-800/80">
                <div className="py-2 flex justify-between text-slate-300">
                  <span>Gross POS Invoices Volume</span>
                  <span>{shop.currency} {grossSales.toLocaleString()}</span>
                </div>
                <div className="py-2 flex justify-between text-rose-400">
                  <span>Less: Customer Returns & Refunds</span>
                  <span>- {shop.currency} {returns.toLocaleString()}</span>
                </div>
                <div className="py-2 flex justify-between text-white font-bold text-sm pt-2">
                  <span>Net Operating Revenue</span>
                  <span>{shop.currency} {netRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 2. COGS */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-sans">
                2. Cost of Goods Sold (COGS)
              </div>
              <div className="divide-y divide-slate-800/80">
                <div className="py-2 flex justify-between text-slate-300">
                  <span>Inventory Wholesale Purchase Cost</span>
                  <span>{shop.currency} {cogs.toLocaleString()}</span>
                </div>
                <div className="py-2 flex justify-between text-emerald-400 font-bold text-sm pt-2">
                  <span>Gross Operating Profit (Net Revenue - COGS)</span>
                  <span>{shop.currency} {grossProfit.toLocaleString()}</span>
                </div>
                <div className="py-1 text-right text-[11px] text-slate-400">
                  Gross Margin: <strong className="text-white">{grossMarginPct.toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider font-sans">
                3. Operating Expenditures (Overheads)
              </div>
              <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div key={exp.id} className="py-1.5 flex justify-between text-slate-400">
                    <span className="truncate max-w-[280px]">
                      {exp.category}: {exp.description}
                    </span>
                    <span className="text-rose-400 font-bold">
                      - {shop.currency} {exp.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-rose-300">
                <span>Total Operating Overheads</span>
                <span>- {shop.currency} {totalOperatingExpenses.toLocaleString()}</span>
              </div>
            </div>

            {/* Final Bottom Line */}
            <div className="p-4 rounded-xl bg-slate-950 border-2 border-emerald-500/30 flex justify-between items-center text-sm">
              <div>
                <div className="font-sans font-bold text-white text-base">NET PROFIT BEFORE TAX</div>
                <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Retained earnings after all cost of goods and operational disbursements
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {shop.currency} {netProfit.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Net Margin: <strong className="text-white">{netMarginPct.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Most Profitable Products Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Award className="w-5 h-5 text-amber-400" />
            Top 5 High-Margin Products
          </div>
          <p className="text-xs text-slate-400">
            Ranked by total net profit contributed to the store till.
          </p>

          <div className="space-y-3">
            {topProfitableProducts.map((p, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate max-w-[180px]">
                    {idx + 1}. {p.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    +{shop.currency} {p.profit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Sold: {p.soldQty} units</span>
                  <span>Rev: {shop.currency} {p.revenue}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-bold text-slate-200">Owner Guidance:</div>
            <p>
              Focus promotion and shelf placement on high-margin items to boost the overall store net margin from {netMarginPct.toFixed(1)}%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
