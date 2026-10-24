import React, { useState } from 'react';
import { Customer, CustomerLedgerEntry, Shop } from '../types/pos';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Award, 
  DollarSign, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Check, 
  CreditCard 
} from 'lucide-react';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  shop: Shop;
  onRecordPayment: (customerId: string, amount: number, method: string, note?: string) => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  onClose,
  customer,
  shop,
  onRecordPayment,
}) => {
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'jazzcash' | 'easypaisa'>('cash');
  const [repayNote, setRepayNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderCopied, setReminderCopied] = useState(false);

  if (!isOpen || !customer) return null;

  const handleSendWhatsAppReminder = () => {
    const text = `Dear ${customer.name},\nThis is a friendly reminder from ${shop.name} regarding your pending balance of ${shop.currency} ${customer.dueBalance.toLocaleString()}. Kindly clear this balance at your earliest convenience.\nThank you for your continued patronage!`;
    navigator.clipboard.writeText(text);
    setReminderCopied(true);
    setTimeout(() => setReminderCopied(false), 2500);

    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Safe fallback
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(repayAmount);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    onRecordPayment(customer.id, amount, payMethod, repayNote || 'Customer balance repayment');
    setRepayAmount('');
    setRepayNote('');
    setIsSubmitting(false);
  };

  // Default demo ledger entries if none exist
  const entries: CustomerLedgerEntry[] = customer.ledger && customer.ledger.length > 0
    ? customer.ledger
    : [
        {
          id: 'ent_1',
          customerId: customer.id,
          shopId: shop.id,
          date: '2026-10-18T11:20:00Z',
          type: 'debit',
          amount: customer.dueBalance + 1500,
          balanceAfter: customer.dueBalance + 1500,
          referenceInvoice: 'INV-20261018-091',
          note: 'Store Credit Purchase (Udhaar)',
        },
        {
          id: 'ent_2',
          customerId: customer.id,
          shopId: shop.id,
          date: '2026-10-21T15:45:00Z',
          type: 'credit',
          amount: 1500,
          balanceAfter: customer.dueBalance,
          paymentMethod: 'Cash',
          note: 'Partial Cash Payment Received',
        },
      ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-base">
              {customer.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{customer.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  customer.dueBalance > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {customer.dueBalance > 0 ? 'Outstanding Due' : 'Account Settled'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <Phone className="w-3 h-3" /> {customer.phone}
                {customer.address && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" /> {customer.address}
                  </>
                )}
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
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Due Balance (Udhaar)</span>
              <div className={`text-xl font-bold font-mono mt-0.5 ${
                customer.dueBalance > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {shop.currency} {customer.dueBalance.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Lifetime Purchases</span>
              <div className="text-xl font-bold text-white font-mono mt-0.5">
                {shop.currency} {customer.totalPurchases.toLocaleString()}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 font-medium">Loyalty Reward Points</span>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5 flex items-center gap-1.5">
                <Award className="w-5 h-5 text-amber-400" />
                {customer.loyaltyPoints} pts
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSendWhatsAppReminder}
              disabled={customer.dueBalance <= 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {reminderCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4 text-emerald-400" />}
              {reminderCopied ? 'Reminder Copied & Opened!' : 'Send WhatsApp Due Reminder'}
            </button>
          </div>

          {/* Record Wasooli / Repayment Form */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Collect Payment Towards Due Balance ("Wasooli")
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Amount to Receive ({shop.currency})</label>
                  <input
                    type="number"
                    min="1"
                    max={customer.dueBalance || undefined}
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder={`Max ${customer.dueBalance}`}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Payment Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="cash">Cash In Drawer</option>
                    <option value="bank_transfer">Bank Transfer / Raast</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="easypaisa">Easypaisa</option>
                  </select>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={repayNote}
                  onChange={(e) => setRepayNote(e.target.value)}
                  placeholder="Notes or Transaction Reference (e.g. Paid in shop till)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!repayAmount || parseFloat(repayAmount) <= 0 || isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'Recording...' : 'Record Payment ("Wasooli")'}
                </button>
              </div>
            </form>
          </div>

          {/* Ledger History Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">Statement of Account ("Khata Ledger")</h4>
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Reference / Note</th>
                    <th className="py-2.5 px-3 text-right">Debit (+)</th>
                    <th className="py-2.5 px-3 text-right">Credit (-)</th>
                    <th className="py-2.5 px-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 text-slate-400 font-sans">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.type === 'debit'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {entry.type === 'debit' ? (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Sale
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-3 h-3" /> Repaid
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">
                        {entry.referenceInvoice || entry.note || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-rose-400 font-bold">
                        {entry.type === 'debit' ? `${shop.currency} ${entry.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                        {entry.type === 'credit' ? `${shop.currency} ${entry.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200 font-bold">
                        {shop.currency} {entry.balanceAfter.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
