import React, { useState } from 'react';
import { Product } from '../types/pos';
import { StockAdjustmentRecord } from '../services/cloudService';
import { 
  PackagePlus, 
  PackageMinus, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  CloudUpload,
  ArrowRight
} from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmAdjustment: (adjustment: StockAdjustmentRecord) => Promise<void>;
  currentUserName: string;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmAdjustment,
  currentUserName,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<'stock_in' | 'stock_out'>('stock_in');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Supplier Restock');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const reasonsList = [
    'Supplier Restock',
    'Physical Audit Correction',
    'Damaged in Store',
    'Customer Return',
    'Expired Item Removal',
    'Theft / Shrinkage',
    'Sample / Promotion',
    'Other / Custom',
  ];

  const currentStock = product.stockQuantity;
  const delta = adjustmentType === 'stock_in' ? quantity : -quantity;
  const projectedStock = currentStock + delta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert('Please enter a quantity greater than zero.');
      return;
    }

    if (projectedStock < 0) {
      alert('Stock cannot be negative without owner override.');
      return;
    }

    setIsSubmitting(true);
    try {
      const record: StockAdjustmentRecord = {
        id: `tx_${Date.now()}`,
        shopId: product.shopId,
        productId: product.id,
        productName: product.name,
        previousQuantity: currentStock,
        changeQuantity: delta,
        newQuantity: projectedStock,
        type: adjustmentType,
        reason: reason === 'Other / Custom' ? (customNotes || 'Custom Adjustment') : reason,
        performedBy: currentUserName,
        createdAt: new Date().toISOString(),
      };

      await onConfirmAdjustment(record);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              adjustmentType === 'stock_in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {adjustmentType === 'stock_in' ? <PackagePlus className="w-4 h-4" /> : <PackageMinus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Adjust Stock & Log Audit</h3>
              <div className="text-[11px] text-slate-400 truncate max-w-xs">{product.name}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Stock Banner */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Current In-Stock:</span>
            <span className="text-base font-bold text-white font-mono ml-2">
              {currentStock} {product.unit}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Projected:</span>
            <span className={`text-base font-bold font-mono ml-2 ${projectedStock < 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {projectedStock} {product.unit}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Operation Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAdjustmentType('stock_in')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                adjustmentType === 'stock_in'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <PackagePlus className="w-4 h-4 text-emerald-400" />
              Stock In (+ Restock)
            </button>

            <button
              type="button"
              onClick={() => setAdjustmentType('stock_out')}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                adjustmentType === 'stock_out'
                  ? 'bg-red-600/20 border-red-500 text-red-300 shadow-lg shadow-red-500/10'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <PackageMinus className="w-4 h-4 text-red-400" />
              Stock Out (- Deduct)
            </button>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Quantity to {adjustmentType === 'stock_in' ? 'Add' : 'Deduct'} ({product.unit}) *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={quantity || ''}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Adjustment Audit Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {reasonsList.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {reason === 'Other / Custom' && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Custom Audit Explanation
              </label>
              <input
                type="text"
                placeholder="Reason details..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
              />
            </div>
          )}

          {/* Cloud sync note */}
          <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-xs text-slate-300 flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-blue-400 shrink-0" />
            <span>This adjustment will atomically update local Drift SQLite and Cloud Firestore.</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Syncing...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Sync to Cloud
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
