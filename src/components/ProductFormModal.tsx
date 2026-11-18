import React, { useState, useEffect } from 'react';
import { Product } from '../types/pos';
import { lookupBarcodeOnline, BarcodeLookupResult } from '../services/barcodeLookupService';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import {
  Package,
  Barcode,
  Sparkles,
  CheckCircle2,
  X,
  ScanLine,
  Globe,
  AlertTriangle,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  shopId: string;
  shopCurrency?: string;
  products?: Product[];
  onSaveProduct: (product: Product) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  shopId,
  shopCurrency = 'PKR',
  products = [],
  onSaveProduct,
}) => {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(140);
  const [taxPercentage, setTaxPercentage] = useState<number>(5);
  const [stockQuantity, setStockQuantity] = useState<number>(25);
  const [minimumStockLimit, setMinimumStockLimit] = useState<number>(5);
  const [unit, setUnit] = useState<Product['unit']>('piece');
  const [supplierName, setSupplierName] = useState('National Wholesale Distributors');
  const [expiryDate, setExpiryDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isInlineScannerOpen, setIsInlineScannerOpen] = useState(false);
  const [lookupBanner, setLookupBanner] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setLookupBanner(null);
    setErrorMsg(null);
    if (productToEdit) {
      setName(productToEdit.name);
      setBarcode(productToEdit.barcode);
      setCategory(productToEdit.category);
      setBrand(productToEdit.brand);
      setDescription(productToEdit.description || '');
      setCostPrice(productToEdit.costPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setTaxPercentage(productToEdit.taxPercentage);
      setStockQuantity(productToEdit.stockQuantity);
      setMinimumStockLimit(productToEdit.minimumStockLimit);
      setUnit(productToEdit.unit);
      setSupplierName(productToEdit.supplierName || 'National Wholesale Distributors');
      setExpiryDate(productToEdit.expiryDate || '');
    } else {
      setName('');
      setBarcode(`8964${Math.floor(10000000 + Math.random() * 90000000)}`);
      setCategory('Grocery');
      setBrand('');
      setDescription('');
      setCostPrice(100);
      setSellingPrice(140);
      setTaxPercentage(5);
      setStockQuantity(25);
      setMinimumStockLimit(5);
      setUnit('piece');
      setSupplierName('National Wholesale Distributors');
      setExpiryDate('');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const generateRandomBarcode = () => {
    setBarcode(`8964${Math.floor(10000000 + Math.random() * 90000000)}`);
  };

  const applyLookup = (code: string, result: BarcodeLookupResult | null) => {
    setBarcode(code);
    if (result && result.found) {
      setName(result.name);
      setBrand(result.brand);
      setCategory(result.category);
      setDescription(result.description);
      setUnit(result.unit);
      setCostPrice(result.costPrice);
      setSellingPrice(result.sellingPrice);
      setLookupBanner(`Auto-filled via ${result.source} (${result.priceSource})`);
    } else {
      setLookupBanner(`Barcode ${code} captured (not found online — complete fields manually)`);
    }
  };

  const handleManualOnlineLookup = async () => {
    if (!barcode.trim()) {
      setErrorMsg('Enter a barcode to search online.');
      return;
    }
    setErrorMsg(null);
    setIsLookingUp(true);
    try {
      const res = await lookupBarcodeOnline(barcode.trim(), shopCurrency);
      applyLookup(barcode.trim(), res);
    } finally {
      setIsLookingUp(false);
    }
  };

  const getExpiryBadge = () => {
    if (!expiryDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(`${expiryDate}T00:00:00`);
    const days = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: `EXPIRED (${Math.abs(days)}d ago)`, cls: 'text-rose-400' };
    if (days <= 30) return { label: `Near Expiry (${days}d left)`, cls: 'text-amber-400' };
    return { label: `Valid (${days}d left)`, cls: 'text-emerald-400' };
  };

  const expiryBadge = getExpiryBadge();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim()) {
      setErrorMsg('Product Name and Barcode are required.');
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      const saved: Product = {
        id: productToEdit?.id || `prod_${Date.now()}`,
        shopId,
        barcode: barcode.trim(),
        qrCode: productToEdit?.qrCode || `CM-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        name: name.trim(),
        category,
        brand: brand.trim() || 'City Mart Brand',
        description,
        costPrice,
        sellingPrice,
        taxPercentage,
        stockQuantity,
        minimumStockLimit,
        unit,
        supplierName,
        expiryDate: expiryDate || undefined,
        createdAt: productToEdit?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveProduct(saved);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Error saving product to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = [
    'Beverages',
    'Dairy',
    'Grocery',
    'Grocery & General',
    'Snacks',
    'Snacks & Bakery',
    'Personal Care',
    'Bakery',
    'Household',
    'Tea & Coffee',
    'Cooking Essentials',
    'Spices & Masala',
    'Health & Pharmacy',
    'Electronics',
  ];
  const mergedCategories = categoryOptions.includes(category) ? categoryOptions : [category, ...categoryOptions];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {productToEdit ? 'Edit Product Catalog Item' : 'Add New Inventory Product'}
                </h3>
                <div className="text-[11px] text-slate-400 truncate">Syncs locally and with Cloud Firestore</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {errorMsg && (
              <div className="p-2.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {lookupBanner && (
              <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4 shrink-0" />
                {lookupBanner}
              </div>
            )}

            {/* Barcode with Scan Barcode + Online Lookup + Generator */}
            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
                <label className="text-xs font-semibold text-slate-300">Barcode / UPC / EAN *</label>
                <button
                  type="button"
                  onClick={generateRandomBarcode}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Generate New
                </button>
              </div>
              <div className="flex gap-1.5">
                <div className="relative flex-1 min-w-0">
                  <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g. 896400012001"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsInlineScannerOpen(true)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Scan barcode via camera or USB scanner"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Scan Barcode</span>
                </button>
                <button
                  type="button"
                  onClick={handleManualOnlineLookup}
                  disabled={isLookingUp}
                  className="px-2.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  title="Fetch product details from Internet"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isLookingUp ? 'Searching...' : 'Fetch Web'}</span>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rooh Afza Syrup 800ml"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  {mergedCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Brand</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Hamdard, Nestle, Dalda"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Unit & Tax */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Inventory Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as Product['unit'])}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="piece">Piece (Pcs)</option>
                  <option value="packet">Packet (Pkt)</option>
                  <option value="box">Box</option>
                  <option value="kg">Kilogram (kg)</option>
                  <option value="gram">Gram (g)</option>
                  <option value="litre">Litre (L)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">GST Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Pricing: Cost vs Selling Price */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Cost Price ({shopCurrency}) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-emerald-400 block mb-1">Selling Price ({shopCurrency}) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full p-2 bg-slate-900 border border-emerald-500/50 rounded-lg text-emerald-300 font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* Stock Levels */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Current Stock Qty</label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Min Alert Limit</label>
                <input
                  type="number"
                  min="0"
                  value={minimumStockLimit}
                  onChange={(e) => setMinimumStockLimit(Number(e.target.value))}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>
            </div>

            {/* Supplier & Optional Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Supplier</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Distributor name"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Expiry Date (Optional)</label>
                  {expiryBadge && <span className={`text-[10px] font-bold ${expiryBadge.cls}`}>{expiryBadge.label}</span>}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="flex-1 p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs cursor-pointer"
                  />
                  {expiryDate && (
                    <button
                      type="button"
                      onClick={() => setExpiryDate('')}
                      className="px-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs"
                      title="Clear expiry date"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSaving ? 'Saving to Cloud...' : 'Save Product & Sync'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Nested Barcode Picker Modal */}
      <BarcodeScannerModal
        isOpen={isInlineScannerOpen}
        onClose={() => setIsInlineScannerOpen(false)}
        products={products}
        shopCurrency={shopCurrency}
        pickMode={true}
        onBarcodePicked={(code, lookup) => applyLookup(code, lookup)}
        onProductFound={() => {}}
        onAddNewProduct={() => {}}
      />
    </>
  );
};
