import React, { useState } from 'react';
import { Supplier, Shop, SupplierPaymentRecord } from '../types/pos';
import { 
  Building2, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  DollarSign, 
  Check, 
  X, 
  ArrowUpRight,
  TrendingDown,
  Briefcase
} from 'lucide-react';

interface SuppliersViewProps {
  suppliers: Supplier[];
  activeShop: Shop;
  onRecordSupplierPayment: (supplierId: string, amount: number, method: 'cash' | 'bank_transfer' | 'cheque', note?: string) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  activeShop,
  onRecordSupplierPayment,
  onAddSupplier,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');
  const [payNote, setPayNote] = useState('');
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);

  // New supplier state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const totalPayables = suppliers.reduce((sum, s) => sum + s.payableBalance, 0);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;

    onRecordSupplierPayment(selectedSupplierForPay.id, amount, payMethod, payNote);
    setSelectedSupplierForPay(null);
    setPayAmount('');
    setPayNote('');
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddSupplier({
      shopId: activeShop.id,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || 'Pakistan',
      payableBalance: 0,
      notes: newNotes.trim() || undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNotes('');
    setIsAddSupplierOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border border-amber-800/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Supplier Payables (Outstanding)</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {activeShop.currency} {totalPayables.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Due to {suppliers.filter((s) => s.payableBalance > 0).length} wholesale vendors
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Registered Vendors</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {suppliers.length} Distributors
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Linked to inventory purchase replenishment
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Payment Audit Trail</span>
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-base font-bold text-white mt-1">
            Cash Till & Bank Supported
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Direct sync with cash in drawer calculations
          </div>
        </div>
      </div>

      {/* Main Supplier Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Suppliers & Wholesalers Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage distributor accounts, monitor credit payables, and record settlements.
            </p>
          </div>

          <button
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, phone, or location..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* List of suppliers */}
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">{s.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                    Distributor
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" /> {s.phone}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" /> {s.address}
                  </span>
                </div>
                {s.notes && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">{s.notes}</p>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Payable Balance</div>
                  <div className={`text-base font-bold font-mono ${
                    s.payableBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {activeShop.currency} {s.payableBalance.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSupplierForPay(s)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Record Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payout Modal */}
      {selectedSupplierForPay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Record Supplier Payment</h3>
                <p className="text-[11px] text-purple-400 font-semibold">{selectedSupplierForPay.name}</p>
              </div>
              <button
                onClick={() => setSelectedSupplierForPay(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Current Outstanding:</span>
                <span className="font-mono font-bold text-amber-400">
                  {activeShop.currency} {selectedSupplierForPay.payableBalance.toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Amount Paid ({activeShop.currency}) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Paid From</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="cash">Cash Drawer (Reduces till balance)</option>
                  <option value="bank_transfer">Bank Transfer (HBL / Meezan / Raast)</option>
                  <option value="cheque">Company Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Bill Reference</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="e.g. Cleared Invoice #4921 via cash till"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierForPay(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/30"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Add New Wholesale Supplier
              </h3>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Prime Flour Mills & Grains"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Representative Phone *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +92 321 9876543"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Warehouse / Office Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Plot 12, G.T. Road Industrial Estate"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Supplied Products / Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Bulk flour, pulses, spices delivery on Wednesdays"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-600/30"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
