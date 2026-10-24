import React, { useState } from 'react';
import { Sale, Shop, RefundItem } from '../types/pos';
import { X, RefreshCw, AlertCircle, Check, PackageCheck, AlertTriangle } from 'lucide-react';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  shop: Shop;
  cashierName: string;
  onConfirmRefund: (payload: {
    saleId: string;
    refundAmount: number;
    itemsToRefund: RefundItem[];
    reason: string;
    restock: boolean;
  }) => void;
}

export const RefundModal: React.FC<RefundModalProps> = ({
  isOpen,
  onClose,
  sale,
  shop,
  cashierName,
  onConfirmRefund,
}) => {
  const [refundQuantities, setRefundQuantities] = useState<{ [itemId: string]: number }>({});
  const [reason, setReason] = useState('Customer changed mind');
  const [restock, setRestock] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sale) return null;

  const isAlreadyRefunded = sale.isRefunded;

  const handleQuantityChange = (itemId: string, maxQty: number, delta: number) => {
    const current = refundQuantities[itemId] || 0;
    const next = Math.max(0, Math.min(maxQty, current + delta));
    setRefundQuantities((prev) => ({ ...prev, [itemId]: next }));
  };

  const handleSelectAll = () => {
    const all: { [itemId: string]: number } = {};
    sale.items.forEach((item) => {
      all[item.id] = item.quantity;
    });
    setRefundQuantities(all);
  };

  const handleClearAll = () => {
    setRefundQuantities({});
  };

  // Calculate total refund
  const refundItemsList: RefundItem[] = [];
  let totalRefundAmount = 0;

  sale.items.forEach((item) => {
    const qty = refundQuantities[item.id] || 0;
    if (qty > 0) {
      const lineRefund = qty * item.unitPrice;
      totalRefundAmount += lineRefund;
      refundItemsList.push({
        cartItemId: item.id,
        productId: item.product.id,
        productName: item.product.name,
        quantityRefunded: qty,
        unitPrice: item.unitPrice,
        totalRefundAmount: lineRefund,
      });
    }
  });

  const handleSubmit = () => {
    if (totalRefundAmount <= 0) return;
    setIsSubmitting(true);
    onConfirmRefund({
      saleId: sale.id,
      refundAmount: totalRefundAmount,
      itemsToRefund: refundItemsList,
      reason,
      restock,
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Process Sale Refund & Return</h3>
              <p className="text-[11px] text-slate-400 font-mono">Invoice #{sale.invoiceNumber}</p>
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
          {/* Sale details card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-400">Customer:</span>{' '}
              <strong className="text-white">{sale.customerName || 'Walk-in'}</strong>
              <div className="text-slate-500 text-[10px] mt-0.5">
                Date: {new Date(sale.createdAt).toLocaleString()} • Cashier: {sale.cashierName}
              </div>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Total Bill:</span>{' '}
              <strong className="text-white font-mono">{shop.currency} {sale.grandTotal}</strong>
              <div className="text-[10px] text-emerald-400 font-bold uppercase mt-0.5">
                {sale.paymentStatus}
              </div>
            </div>
          </div>

          {isAlreadyRefunded ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <strong className="block text-sm">Sale Already Refunded</strong>
                This transaction has already been processed for refund and cannot be refunded again.
              </div>
            </div>
          ) : (
            <>
              {/* Items selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    Select Items to Return & Refund:
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      onClick={handleSelectAll}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Refund All Items
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={handleClearAll}
                      className="text-slate-400 hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sale.items.map((item) => {
                    const returnQty = refundQuantities[item.id] || 0;
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                          returnQty > 0
                            ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="max-w-[240px]">
                          <div className="font-bold text-xs truncate">{item.product.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {shop.currency} {item.unitPrice} each • Billed Qty: {item.quantity}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={returnQty <= 0}
                              className="px-2.5 py-1 text-xs hover:bg-slate-800 disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="px-2.5 py-1 text-xs font-bold font-mono">
                              {returnQty}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={returnQty >= item.quantity}
                              className="px-2.5 py-1 text-xs hover:bg-slate-800 disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>

                          <div className="w-20 text-right font-mono font-bold text-xs text-white">
                            {shop.currency} {returnQty * item.unitPrice}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Refund Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Reason for Return / Refund
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Damaged / Defective item">Damaged / Defective item</option>
                  <option value="Wrong product scanned">Wrong product scanned</option>
                  <option value="Expired product complaint">Expired product complaint</option>
                  <option value="Cashier bill correction">Cashier bill correction</option>
                </select>
              </div>

              {/* Restock Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={restock}
                  onChange={(e) => setRestock(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Automatically Restock Items to Inventory
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Will add returned quantities back to warehouse / shop shelf stock.
                  </div>
                </div>
              </label>

              {/* Total Refund Summary */}
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-rose-300">Total Refund Amount:</div>
                  <div className="text-[11px] text-slate-400">
                    Returned cash/credit to customer
                  </div>
                </div>
                <div className="text-xl font-black text-rose-400 font-mono">
                  {shop.currency} {totalRefundAmount.toLocaleString()}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>

          {!isAlreadyRefunded && (
            <button
              onClick={handleSubmit}
              disabled={totalRefundAmount <= 0 || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {isSubmitting ? 'Processing...' : `Confirm Refund (${shop.currency} ${totalRefundAmount})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
