import React, { useState } from 'react';
import { Expense, Shop, User } from '../types/pos';
import { 
  Receipt, 
  Plus, 
  Search, 
  DollarSign, 
  Calendar, 
  PieChart, 
  TrendingDown, 
  Zap, 
  Home, 
  Wifi, 
  Truck, 
  Users, 
  Wrench, 
  Package, 
  Check 
} from 'lucide-react';

interface ExpenseTrackerViewProps {
  expenses: Expense[];
  activeShop: Shop;
  currentUser: User;
  grossSalesRevenue: number;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
}

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  expenses,
  activeShop,
  currentUser,
  grossSalesRevenue,
  onAddExpense,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Miscellaneous');
  const [description, setDescription] = useState('');

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netOperatingMargin = grossSalesRevenue - totalExpenses;

  const categoryIcons: { [cat: string]: React.ReactNode } = {
    Electricity: <Zap className="w-4 h-4 text-amber-400" />,
    Rent: <Home className="w-4 h-4 text-blue-400" />,
    Internet: <Wifi className="w-4 h-4 text-emerald-400" />,
    Transport: <Truck className="w-4 h-4 text-purple-400" />,
    Salaries: <Users className="w-4 h-4 text-indigo-400" />,
    Maintenance: <Wrench className="w-4 h-4 text-rose-400" />,
    Miscellaneous: <Package className="w-4 h-4 text-slate-400" />,
  };

  const filtered = expenses.filter((e) => {
    return selectedCategoryFilter === 'All' || e.category === selectedCategoryFilter;
  });

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    onAddExpense({
      shopId: activeShop.id,
      amount: parsedAmount,
      date: new Date().toISOString(),
      category,
      description: description.trim() || `${category} expense`,
      createdBy: currentUser.name,
    });

    setAmount('');
    setDescription('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border border-rose-800/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Shop Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {activeShop.currency} {totalExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {expenses.length} operating disbursements recorded
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Gross Sales Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {activeShop.currency} {grossSalesRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total sales generated across current session
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Net Operating Margin</span>
            <PieChart className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-2xl font-black font-mono mt-1 ${
            netOperatingMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {activeShop.currency} {netOperatingMargin.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gross revenue less operating expenditures
          </div>
        </div>
      </div>

      {/* Main Expense Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-400" />
              Store Expenses & Petty Cash Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Record daily utilities, rent, delivery fuel, and store maintenance directly from the cash drawer.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log New Expense
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2">
          {['All', 'Electricity', 'Rent', 'Internet', 'Transport', 'Salaries', 'Maintenance', 'Miscellaneous'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  selectedCategoryFilter === cat
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat !== 'All' && categoryIcons[cat]}
                {cat}
              </button>
            )
          )}
        </div>

        {/* Expense List */}
        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No expenses recorded under the {selectedCategoryFilter} category.
            </div>
          ) : (
            filtered.map((exp) => (
              <div
                key={exp.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {categoryIcons[exp.category] || <Package className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{exp.description}</h4>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="font-semibold text-rose-300">{exp.category}</span>
                      <span>•</span>
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-slate-500">Authorized by: {exp.createdBy}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-base text-rose-400">
                  - {activeShop.currency} {exp.amount.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-400" />
                Record Store Operating Expense
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Expense Amount ({activeShop.currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 3500"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Electricity">Electricity & Utilities</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Internet">Internet / Phone / Static IP</option>
                  <option value="Transport">Delivery Fuel & Transport</option>
                  <option value="Salaries">Staff Daily / Weekly Wages</option>
                  <option value="Maintenance">Shop Repairs & Equipment Service</option>
                  <option value="Miscellaneous">Packaging Bags & Receipt Paper</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Purchased 40x rolls of 80mm thermal receipt paper"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Logged under cashier account: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/30"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
