import React, { useState } from 'react';
import { Product, Shop } from '../types/pos';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  Clock, 
  CloudUpload, 
  CloudCheck, 
  RefreshCw, 
  SlidersHorizontal, 
  Edit3, 
  Trash2, 
  Download, 
  Layers, 
  CheckCircle2,
  Database
} from 'lucide-react';

interface InventoryManagerViewProps {
  products: Product[];
  activeShop: Shop;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onOpenStockAdjustment: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onSyncAllToCloud: () => Promise<void>;
  isSyncing: boolean;
  cloudSyncCount: number | null;
}

export const InventoryManagerView: React.FC<InventoryManagerViewProps> = ({
  products,
  activeShop,
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenStockAdjustment,
  onDeleteProduct,
  onSyncAllToCloud,
  isSyncing,
  cloudSyncCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'expiring'>('all');

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !q || 
      p.name.toLowerCase().includes(q) || 
      p.barcode.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter === 'low_stock') {
      matchesStatus = p.stockQuantity <= p.minimumStockLimit;
    } else if (statusFilter === 'expiring') {
      matchesStatus = Boolean(p.expiryDate && new Date(p.expiryDate) < new Date('2027-01-01'));
    }

    return matchesCat && matchesQuery && matchesStatus;
  });

  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minimumStockLimit).length;
  const expiringCount = products.filter((p) => p.expiryDate && new Date(p.expiryDate) < new Date('2027-01-01')).length;

  const handleExportCSV = () => {
    let csv = 'Barcode,Product Name,Category,Brand,Unit,Cost Price,Selling Price,Stock Quantity,Min Limit\n';
    products.forEach((p) => {
      csv += `"${p.barcode}","${p.name}","${p.category}","${p.brand}","${p.unit}",${p.costPrice},${p.sellingPrice},${p.stockQuantity},${p.minimumStockLimit}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeShop.name}_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Cloud Firestore Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              Cloud Firestore Live
            </span>
            <span className="text-xs text-slate-400 font-medium">Real-Time Bi-Directional Sync</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Inventory & Category Catalog
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Offline Drift SQLite database backed by real-time Cloud Firestore synchronization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSyncAllToCloud}
            disabled={isSyncing}
            className="px-3.5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync with Firestore'}
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          <button
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {cloudSyncCount !== null && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Successfully synced {cloudSyncCount} products to Cloud Firestore collection: <code className="font-mono bg-emerald-950 px-1.5 py-0.5 rounded">/shops/{activeShop.id}/products</code>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, barcode, brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Quick Stock Status Filter Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Items ({products.length})
          </button>

          <button
            onClick={() => setStatusFilter('low_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'low_stock'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Low Stock ({lowStockCount})
          </button>

          <button
            onClick={() => setStatusFilter('expiring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              statusFilter === 'expiring'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-950 text-purple-400/80 hover:text-purple-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Expiring Soon ({expiringCount})
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Catalog: Mobile Cards (<md) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.map((p) => {
          const isLow = p.stockQuantity <= p.minimumStockLimit;
          const margin = Math.round(((p.sellingPrice - p.costPrice) / (p.sellingPrice || 1)) * 100);

          return (
            <div
              key={p.id}
              className={`p-4 bg-slate-900 border rounded-2xl space-y-3 ${
                isLow ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{p.name}</h4>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {p.barcode} · {p.category} · {p.brand}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-400 text-sm">
                    {activeShop.currency} {p.sellingPrice}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Cost: {activeShop.currency} {p.costPrice} ({margin}% margin)
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="text-[11px] text-slate-400 font-normal">Stock:</span>
                  <span className={isLow ? 'text-amber-400' : 'text-white'}>
                    {p.stockQuantity} {p.unit}
                  </span>
                  {isLow && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Low
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenStockAdjustment(p)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs font-semibold transition-colors min-h-[36px]"
                  >
                    Adjust Stock
                  </button>
                  <button
                    onClick={() => onOpenEditProduct(p)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Edit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteProduct(p.id)}
                    className="p-2 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Products Table: Desktop (>=md) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/60">
                <th className="py-3 px-3">Barcode</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Margin</th>
                <th className="py-3 px-3 text-center">Stock</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProducts.map((p) => {
                const isLow = p.stockQuantity <= p.minimumStockLimit;
                const margin = Math.round(((p.sellingPrice - p.costPrice) / (p.sellingPrice || 1)) * 100);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-blue-400 font-bold">{p.barcode}</td>
                    <td className="py-3 px-3 font-sans font-bold text-white max-w-xs">
                      <div className="truncate">{p.name}</div>
                      {p.supplierName && (
                        <div className="text-[10px] text-slate-500 font-mono font-normal">
                          Sup: {p.supplierName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans">{p.category}</td>
                    <td className="py-3 px-3 text-slate-400 font-sans">{p.brand}</td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {activeShop.currency} {p.costPrice}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {activeShop.currency} {p.sellingPrice}
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-300">
                      {margin}%
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        <span className={isLow ? 'text-red-400' : 'text-white'}>
                          {p.stockQuantity} {p.unit}
                        </span>
                        {isLow && (
                          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-sans">
                        <button
                          onClick={() => onOpenStockAdjustment(p)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-md text-[11px] font-semibold transition-colors"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => onOpenEditProduct(p)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1 hover:bg-slate-800 text-slate-500 hover:text-red-400 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
