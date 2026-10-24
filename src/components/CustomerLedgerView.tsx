import React, { useState } from 'react';
import { Customer, Shop } from '../types/pos';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  MapPin, 
  Award, 
  MessageSquare, 
  ArrowRight, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface CustomerLedgerViewProps {
  customers: Customer[];
  activeShop: Shop;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  customers,
  activeShop,
  onSelectCustomer,
  onAddCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New customer form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');

  const totalReceivables = customers.reduce((sum, c) => sum + c.dueBalance, 0);
  const dueCustomersCount = customers.filter((c) => c.dueBalance > 0).length;

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address?.toLowerCase().includes(search.toLowerCase()) ?? false);

    const matchesDue = filterDueOnly ? c.dueBalance > 0 : true;

    return matchesSearch && matchesDue;
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddCustomer({
      shopId: activeShop.id,
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
      address: newAddress.trim() || undefined,
      loyaltyPoints: 0,
      dueBalance: 0,
      totalPurchases: 0,
      notes: newNotes.trim() || undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Udhaar Receivables KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border border-rose-800/40 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Receivables ("Udhaar Due")</span>
            <DollarSign className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {activeShop.currency} {totalReceivables.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Pending collection from {dueCustomersCount} customers
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Customer Directory</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {customers.length} Accounts
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tracked in local Drift SQLite & Cloud
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Loyalty & Store Credit Guard</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)} pts
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Redeemable points across regular shoppers
          </div>
        </div>
      </div>

      {/* Main Ledger Directory Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Customer Accounts & "Khata" Ledger
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select any customer to open their ledger statement, record repayments ("wasooli"), or send WhatsApp reminders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterDueOnly(!filterDueOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterDueOnly
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {filterDueOnly ? 'Showing Due Only' : 'Show Due Only'}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name, phone number, or address..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              No customer records found matching "{search}".
            </div>
          ) : (
            filtered.map((c) => {
              const hasDue = c.dueBalance > 0;

              return (
                <div
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          hasDue
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {c.name[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors">
                            {c.name}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {c.phone}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        hasDue
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {hasDue ? 'Udhaar Due' : 'Settled'}
                      </span>
                    </div>

                    {c.address && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                        {c.address}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500">Current Due</div>
                      <div className={`font-mono font-bold text-sm ${
                        hasDue ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {activeShop.currency} {c.dueBalance.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-white transition-colors text-xs font-semibold">
                      Open Khata
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                Add New Customer Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Muhammad Asif"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address / Street</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. House 14, Street 9, Sector G-11"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Preferences</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Monthly household buyer, credit limit PKR 10,000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
