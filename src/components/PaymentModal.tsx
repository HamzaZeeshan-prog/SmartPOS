import React, { useState, useEffect } from 'react';
import { PaymentMethod, PaymentRecord, Shop, Customer } from '../types/pos';
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  Smartphone, 
  Split, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Clock, 
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  deliveryCharge: number;
  shop: Shop;
  customer?: Customer;
  cashierName: string;
  onPaymentSuccess: (payments: PaymentRecord[], invoiceNumber: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  shop,
  customer,
  cashierName,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<number>(grandTotal);
  
  // Split payment inputs
  const [splitCash, setSplitCash] = useState<number>(Math.round(grandTotal / 2));
  const [splitDigital, setSplitDigital] = useState<number>(grandTotal - Math.round(grandTotal / 2));
  const [splitProvider, setSplitProvider] = useState<'jazzcash' | 'easypaisa' | 'bank_qr'>('jazzcash');

  // Digital provider selection
  const [digitalProvider, setDigitalProvider] = useState<'jazzcash' | 'easypaisa' | 'bank_qr'>('jazzcash');
  const [qrTimerSeconds, setQrTimerSeconds] = useState(300);

  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const paymentReference = `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Construct QR Payload specified in requirements:
  // smartpos://payment?invoiceId=INVOICE_ID&amount=AMOUNT&shopId=SHOP_ID&reference=PAYMENT_REFERENCE
  const qrPayload = `smartpos://payment?invoiceId=${invoiceNumber}&amount=${grandTotal}&shopId=${shop.id}&reference=${paymentReference}`;

  useEffect(() => {
    setCashReceived(grandTotal);
    setSplitCash(Math.round(grandTotal / 2));
    setSplitDigital(grandTotal - Math.round(grandTotal / 2));
    setQrTimerSeconds(300);
  }, [grandTotal, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setQrTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const changeReturned = Math.max(0, cashReceived - grandTotal);
  const isCashSufficient = cashReceived >= grandTotal;
  const isSplitValid = splitCash + splitDigital === grandTotal && splitCash > 0 && splitDigital > 0;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleCompleteCashPayment = () => {
    if (!isCashSufficient) return;
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      method: 'cash',
      amount: grandTotal,
      status: 'paid',
      cashReceived,
      changeReturned,
    };
    onPaymentSuccess([payment], invoiceNumber);
  };

  const handleCompleteDigitalPayment = () => {
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      method: selectedMethod,
      amount: grandTotal,
      status: 'paid',
      provider: digitalProvider.toUpperCase(),
      referenceNumber: paymentReference,
      qrPayload,
    };
    onPaymentSuccess([payment], invoiceNumber);
  };

  const handleCompleteCardPayment = () => {
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      method: 'card',
      amount: grandTotal,
      status: 'paid',
      provider: 'EMV Chip POS Terminal',
      referenceNumber: `CARD-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    onPaymentSuccess([payment], invoiceNumber);
  };

  const handleCompleteCustomerCredit = () => {
    if (!customer) {
      alert('Please select a customer to charge to store credit account.');
      return;
    }
    const payment: PaymentRecord = {
      id: `pay_${Date.now()}`,
      method: 'customer_credit',
      amount: grandTotal,
      status: 'paid',
      referenceNumber: `CREDIT-${customer.id}`,
    };
    onPaymentSuccess([payment], invoiceNumber);
  };

  const handleCompleteSplitPayment = () => {
    if (!isSplitValid) return;
    const payments: PaymentRecord[] = [
      {
        id: `pay_${Date.now()}_cash`,
        method: 'cash',
        amount: splitCash,
        status: 'paid',
        cashReceived: splitCash,
        changeReturned: 0,
      },
      {
        id: `pay_${Date.now()}_dig`,
        method: splitProvider,
        amount: splitDigital,
        status: 'paid',
        provider: splitProvider.toUpperCase(),
        referenceNumber: paymentReference,
      },
    ];
    onPaymentSuccess(payments, invoiceNumber);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-blue-400 font-semibold">{invoiceNumber}</span>
            <h2 className="text-xl font-bold text-white">POS Checkout & Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Bill Summary Banner */}
        <div className="bg-blue-950/40 border-b border-blue-900/40 p-3.5 px-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Payable Amount</div>
            <div className="text-2xl font-bold text-white font-mono">
              {shop.currency} {grandTotal.toLocaleString()}
            </div>
          </div>
          {customer ? (
            <div className="text-right">
              <div className="text-xs text-slate-400">Attached Customer</div>
              <div className="text-sm font-semibold text-blue-300">{customer.name}</div>
              <div className="text-xs text-slate-500 font-mono">Due: PKR {customer.dueBalance}</div>
            </div>
          ) : (
            <div className="text-right text-xs text-slate-500 italic">
              Walk-in Customer
            </div>
          )}
        </div>

        {/* Payment Method Selector Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => setSelectedMethod('cash')}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'cash'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Banknote className="w-4 h-4" />
            Cash
          </button>

          <button
            onClick={() => {
              setSelectedMethod('jazzcash');
              setDigitalProvider('jazzcash');
            }}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'jazzcash'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-red-400" />
            JazzCash
          </button>

          <button
            onClick={() => {
              setSelectedMethod('easypaisa');
              setDigitalProvider('easypaisa');
            }}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'easypaisa'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Easypaisa
          </button>

          <button
            onClick={() => {
              setSelectedMethod('bank_qr');
              setDigitalProvider('bank_qr');
            }}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'bank_qr'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            Bank QR
          </button>

          <button
            onClick={() => setSelectedMethod('card')}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'card'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Card POS
          </button>

          <button
            onClick={() => setSelectedMethod('split')}
            className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'split'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Split className="w-4 h-4 text-amber-400" />
            Split Pay
          </button>
        </div>

        {/* Content Area Based on Method */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* 1. CASH MODE */}
          {selectedMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Cash Received from Customer (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                    PKR
                  </span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full pl-14 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xl font-mono font-bold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Cash Tender Pills */}
              <div className="flex flex-wrap gap-2">
                {[grandTotal, 500, 1000, 2000, 5000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
                  >
                    {amount === grandTotal ? 'Exact' : `PKR ${amount.toLocaleString()}`}
                  </button>
                ))}
              </div>

              {/* Change Returned Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Change to Return</div>
                  <div className={`text-xl font-bold font-mono ${changeReturned > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {shop.currency} {changeReturned.toLocaleString()}
                  </div>
                </div>
                {!isCashSufficient && (
                  <div className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Short by PKR {(grandTotal - cashReceived).toLocaleString()}
                  </div>
                )}
              </div>

              <button
                onClick={handleCompleteCashPayment}
                disabled={!isCashSufficient}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Cash Payment & Print Receipt
              </button>
            </div>
          )}

          {/* 2. CARD POS MODE */}
          {selectedMethod === 'card' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">POS Card Terminal Ready</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Insert, tap, or swipe customer Visa / Mastercard on the external PIN pad. Total to authorize:
                </p>
                <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
                  PKR {grandTotal.toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleCompleteCardPayment}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Authorize Card Payment & Print Slip
              </button>
            </div>
          )}

          {/* 3. DIGITAL / QR PAYMENT (JazzCash, Easypaisa, Bank QR) */}
          {(selectedMethod === 'jazzcash' || selectedMethod === 'easypaisa' || selectedMethod === 'bank_qr') && (
            <div className="space-y-4 text-center">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl max-w-sm mx-auto shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>{selectedMethod.toUpperCase()} GATEWAY</span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    Expires {formatTimer(qrTimerSeconds)}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-xl inline-block shadow-lg mx-auto">
                  <svg className="w-44 h-44" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="28" height="28" fill="#000" />
                    <rect x="4" y="4" width="20" height="20" fill="#fff" />
                    <rect x="8" y="8" width="12" height="12" fill="#000" />

                    <rect x="72" y="0" width="28" height="28" fill="#000" />
                    <rect x="76" y="4" width="20" height="20" fill="#fff" />
                    <rect x="80" y="8" width="12" height="12" fill="#000" />

                    <rect x="0" y="72" width="28" height="28" fill="#000" />
                    <rect x="4" y="76" width="20" height="20" fill="#fff" />
                    <rect x="8" y="80" width="12" height="12" fill="#000" />

                    <rect x="36" y="8" width="8" height="8" fill="#000" />
                    <rect x="52" y="8" width="8" height="8" fill="#000" />
                    <rect x="36" y="24" width="8" height="8" fill="#000" />
                    <rect x="56" y="24" width="8" height="8" fill="#000" />
                    <rect x="12" y="36" width="8" height="8" fill="#000" />
                    <rect x="28" y="36" width="8" height="8" fill="#000" />
                    <rect x="44" y="36" width="8" height="8" fill="#000" />
                    <rect x="64" y="36" width="8" height="8" fill="#000" />
                    <rect x="80" y="36" width="8" height="8" fill="#000" />
                    <rect x="36" y="48" width="8" height="8" fill="#000" />
                    <rect x="52" y="48" width="8" height="8" fill="#000" />
                    <rect x="68" y="48" width="8" height="8" fill="#000" />
                    <rect x="12" y="60" width="8" height="8" fill="#000" />
                    <rect x="44" y="60" width="8" height="8" fill="#000" />
                    <rect x="60" y="60" width="8" height="8" fill="#000" />
                    <rect x="36" y="76" width="8" height="8" fill="#000" />
                    <rect x="52" y="76" width="8" height="8" fill="#000" />
                    <rect x="76" y="76" width="8" height="8" fill="#000" />
                  </svg>
                </div>

                <div className="mt-2.5 text-[11px] font-mono text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800">
                  {qrPayload}
                </div>
              </div>

              <button
                onClick={handleCompleteDigitalPayment}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm Demo {selectedMethod.toUpperCase()} Payment
              </button>
            </div>
          )}

          {/* 4. SPLIT PAYMENT MODE */}
          {selectedMethod === 'split' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                Split payment across Cash and a Digital Wallet. Sum must equal <strong className="text-white">PKR {grandTotal.toLocaleString()}</strong>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-blue-400" />
                    Cash Portion (PKR)
                  </div>
                  <input
                    type="number"
                    value={splitCash || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitCash(val);
                      setSplitDigital(Math.max(0, grandTotal - val));
                    }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Digital Wallet Portion (PKR)
                  </div>
                  <input
                    type="number"
                    value={splitDigital || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSplitDigital(val);
                      setSplitCash(Math.max(0, grandTotal - val));
                    }}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Digital Wallet Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['jazzcash', 'easypaisa', 'bank_qr'] as const).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSplitProvider(prov)}
                      className={`p-2 rounded-lg text-xs font-semibold uppercase ${
                        splitProvider === prov
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400">Total Allocated:</span>
                <span className={`font-mono font-bold ${(splitCash + splitDigital) === grandTotal ? 'text-emerald-400' : 'text-red-400'}`}>
                  PKR {(splitCash + splitDigital).toLocaleString()} / {grandTotal.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleCompleteSplitPayment}
                disabled={!isSplitValid}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Complete Split Payment & Print Slip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
