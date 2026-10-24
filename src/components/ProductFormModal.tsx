import React, { useState, useEffect } from 'react';
import { Product } from '../types/pos';
import { 
  Package, 
  Barcode, 
  Sparkles, 
  CheckCircle2, 
  X, 
  DollarSign, 
  Tag, 
  Truck, 
  Calendar 
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  shopId: string;
  onSaveProduct: (product: Product) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  shopId,
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

  useEffect(() => {
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
      // Default new product values
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !barcode.trim()) {
      alert('Product Name and Barcode are required.');
      return;
    }

    setIsSaving(true);
    try {
      const saved: Product = {
        id: productToEdit?.id || `prod_${Date.now()}`,
        shopId,
        barcode,
        qrCode: `CM-${category.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        name,
        category,
        brand: brand || 'City Mart Brand',
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
      alert('Error saving product to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {productToEdit ? 'Edit Product Catalog Item' : 'Add New Inventory Product'}
              </h3>
              <div className="text-[11px] text-slate-400">Syncs locally and with Cloud Firestore</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Barcode with Generator */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">Barcode / UPC / EAN *</label>
              <button
                type="button"
                onClick={generateRandomBarcode}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Generate Barcode
              </button>
            </div>
            <div className="relative">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Beverages">Beverages</option>
                <option value="Dairy">Dairy</option>
                <option value="Grocery">Grocery</option>
                <option value="Snacks">Snacks</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Bakery">Bakery</option>
                <option value="Household">Household</option>
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cost Price (PKR) *</label>
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
              <label className="text-xs font-semibold text-emerald-400 block mb-1">Selling Price (PKR) *</label>
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Current Stock Quantity</label>
              <input
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Min. Stock Alert Limit</label>
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
          <div className="grid grid-cols-2 gap-3">
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
              <label className="text-xs font-semibold text-slate-300 block mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs cursor-pointer"
              />
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
  );
};
