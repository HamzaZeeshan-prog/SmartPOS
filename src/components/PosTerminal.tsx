import React, { useState } from 'react';
import { Product, CartItem, Customer, Shop, User } from '../types/pos';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  PauseCircle, 
  PlayCircle, 
  CreditCard, 
  Tag, 
  AlertTriangle, 
  ChevronDown, 
  ShoppingBag, 
  FileEdit, 
  Truck, 
  CheckCircle2, 
  DollarSign,
  ShoppingCart
} from 'lucide-react';

interface PosTerminalProps {
  products: Product[];
  customers: Customer[];
  activeShop: Shop;
  currentUser: User;
  onOpenScanner: () => void;
  onStartCheckout: (
    cart: CartItem[], 
    subtotal: number, 
    discountTotal: number, 
    taxTotal: number, 
    grandTotal: number, 
    selectedCustomer?: Customer
  ) => void;
}

export const PosTerminal: React.FC<PosTerminalProps> = ({
  products,
  customers,
  activeShop,
  currentUser,
  onOpenScanner,
  onStartCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [terminalNotice, setTerminalNotice] = useState<{ message: string; type: 'warning' | 'error' | 'info' } | null>(null);
  const [mobileActiveTab, setMobileActiveTab] = useState<'catalog' | 'cart'>('catalog');
  
  // Cart-level financial adjustments
  const [billDiscountType, setBillDiscountType] = useState<'percent' | 'fixed'>('fixed');
  const [billDiscountValue, setBillDiscountValue] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(activeShop.taxEnabled);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(0);

  // Item note modal or active note editing
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteText, setItemNoteText] = useState('');

  // Held sales stack
  const [heldSales, setHeldSales] = useState<{ id: string; customerId?: string; items: CartItem[]; time: string }[]>([]);

  // Unique categories
  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const showTerminalNotice = (message: string, type: 'warning' | 'error' | 'info' = 'warning') => {
    setTerminalNotice({ message, type });
    setTimeout(() => setTerminalNotice(null), 3500);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !q || 
      p.name.toLowerCase().includes(q) || 
      p.barcode.toLowerCase().includes(q) || 
      p.brand.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    // Validate stock limit if store does not allow negative stock
    const existing = cart.find((item) => item.product.id === product.id);
    const existingQty = existing ? existing.quantity : 0;

    if (!activeShop.allowNegativeStock && existingQty + 1 > product.stockQuantity) {
      showTerminalNotice(`Warning: Stock limit reached for ${product.name} (Max: ${product.stockQuantity})`, 'warning');
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `item_${Date.now()}_${product.id}`,
          product,
          quantity: 1,
          unitPrice: product.sellingPrice,
          itemDiscount: 0,
          itemTaxRate: product.taxPercentage,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (!activeShop.allowNegativeStock && newQty > item.product.stockQuantity) {
              showTerminalNotice(`Cannot exceed inventory of ${item.product.stockQuantity} for ${item.product.name}`, 'warning');
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, itemDiscount: Math.max(0, discount) } : item
      )
    );
  };

  const saveItemNote = (productId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, note: itemNoteText } : item
      )
    );
    setEditingNoteItemId(null);
    setItemNoteText('');
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
    setBillDiscountValue(0);
    setSelectedCustomerId('');
    setDeliveryCharge(0);
    showTerminalNotice('Cart cleared successfully', 'info');
  };

  const holdCurrentSale = () => {
    if (cart.length === 0) return;
    const newHeld = {
      id: `held_${Date.now()}`,
      customerId: selectedCustomerId,
      items: [...cart],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setHeldSales((prev) => [newHeld, ...prev]);
    setCart([]);
    setSelectedCustomerId('');
    setBillDiscountValue(0);
    setDeliveryCharge(0);
    showTerminalNotice('Sale placed on hold (Queue preserved)', 'info');
  };

  const resumeHeldSale = (heldId: string) => {
    const target = heldSales.find((h) => h.id === heldId);
    if (!target) return;
    setCart(target.items);
    setSelectedCustomerId(target.customerId || '');
    setHeldSales((prev) => prev.filter((h) => h.id !== heldId));
    showTerminalNotice('Held sale resumed to active cart', 'info');
  };

  // Financial calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const itemsDiscountSum = cart.reduce((sum, item) => sum + item.itemDiscount, 0);
  
  const billDiscount = 
    billDiscountType === 'percent'
      ? (rawSubtotal * Math.min(100, Math.max(0, billDiscountValue))) / 100
      : Math.min(rawSubtotal, Math.max(0, billDiscountValue));

  const totalDiscount = itemsDiscountSum + billDiscount;
  const taxableSubtotal = Math.max(0, rawSubtotal - totalDiscount);

  const totalTax = taxEnabled
    ? cart.reduce((sum, item) => {
        const itemShare = (item.quantity * item.unitPrice) / (rawSubtotal || 1);
        const itemTaxable = taxableSubtotal * itemShare;
        return sum + (itemTaxable * (item.itemTaxRate || activeShop.defaultTaxRate)) / 100;
      }, 0)
    : 0;

  const grandTotal = Math.round(taxableSubtotal + totalTax + deliveryCharge);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Validate before launching checkout
  const handleCheckoutClick = () => {
    if (cart.length === 0) return;

    // Check for stock shortages
    const stockErrors: string[] = [];
    if (!activeShop.allowNegativeStock) {
      cart.forEach((i) => {
        if (i.quantity > i.product.stockQuantity) {
          stockErrors.push(`${i.product.name} (Max: ${i.product.stockQuantity})`);
        }
      });
    }

    if (stockErrors.length > 0) {
      showTerminalNotice(`Stock shortage detected: ${stockErrors.join(', ')}`, 'error');
      return;
    }

    onStartCheckout(cart, rawSubtotal, totalDiscount, totalTax, grandTotal, selectedCustomer);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {terminalNotice && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
            terminalNotice.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
              : terminalNotice.type === 'warning'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
              : 'bg-blue-500/20 border-blue-500/50 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{terminalNotice.message}</span>
          </div>
          <button
            onClick={() => setTerminalNotice(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Mobile Tab Switcher: Catalog vs Cart */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
        <button
          onClick={() => setMobileActiveTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveTab === 'catalog'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Products ({filteredProducts.length})</span>
        </button>

        <button
          onClick={() => setMobileActiveTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileActiveTab === 'cart'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1">
              PKR {grandTotal.toLocaleString()}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 h-full">
        {/* 1. LEFT PANEL: Categories & Product Catalog */}
        <div className={`flex-1 flex flex-col space-y-3.5 min-w-0 ${mobileActiveTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Search & Actions Bar */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name, barcode, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onOpenScanner}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Barcode className="w-4 h-4" />
              Scan Barcode / QR
            </button>

            {heldSales.length > 0 && (
              <div className="relative group">
                <button className="px-3 py-2 bg-amber-600/20 border border-amber-500/40 text-amber-400 hover:bg-amber-600/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <PlayCircle className="w-4 h-4" />
                  Held ({heldSales.length})
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 hidden group-hover:block z-30">
                  <div className="text-[11px] font-bold text-slate-400 px-2 py-1">Resume Held Sale</div>
                  {heldSales.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => resumeHeldSale(h.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 text-xs text-slate-200 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{h.time}</div>
                        <div className="text-[10px] text-slate-400">{h.items.length} items</div>
                      </div>
                      <span className="text-blue-400 text-[10px] font-bold">Resume</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[640px] pr-1">
          {filteredProducts.map((p) => {
            const isLowStock = p.stockQuantity <= p.minimumStockLimit;
            const inCart = cart.find((item) => item.product.id === p.id);

            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`group relative bg-slate-900 border rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-blue-500/50 ${
                  inCart ? 'border-blue-500/80 bg-blue-950/20' : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-slate-400 uppercase truncate max-w-[80px]">
                    {p.category}
                  </span>
                  {isLowStock ? (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Low ({p.stockQuantity})
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-slate-400 bg-slate-800">
                      {p.stockQuantity} {p.unit}
                    </span>
                  )}
                </div>

                <div className="my-1">
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight">
                    {p.name}
                  </h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    {p.barcode}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    {activeShop.currency} {p.sellingPrice.toLocaleString()}
                  </div>

                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    inCart ? 'bg-blue-600 text-white font-bold text-xs' : 'bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white'
                  }`}>
                    {inCart ? inCart.quantity : <Plus className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MIDDLE PANEL: Active Shopping Cart Items */}
      <div className={`w-full lg:w-[380px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden shrink-0 ${mobileActiveTab === 'catalog' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Cart Header */}
        <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Cart</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} pcs
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={holdCurrentSale}
              disabled={cart.length === 0}
              title="Hold Sale"
              className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              title="Clear Cart"
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customer Selector Dropdown */}
        <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1 px-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) — Due: PKR {c.dueBalance}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Balance Banner if selected */}
        {selectedCustomer && (
          <div className="px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-300">Customer Credit / Due:</span>
            <span className={`font-mono font-bold ${selectedCustomer.dueBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              PKR {selectedCustomer.dueBalance.toLocaleString()}
            </span>
          </div>
        )}

        {/* Cart Item Lines */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[460px]">
          {cart.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <ShoppingBag className="w-7 h-7 mx-auto text-slate-600" />
              <div className="text-xs font-semibold">Cart is empty</div>
              <div className="text-[11px] text-slate-600">Scan barcodes or tap products</div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{item.product.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {activeShop.currency} {item.unitPrice} / {item.product.unit}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white font-mono shrink-0">
                    {activeShop.currency} {(item.quantity * item.unitPrice - item.itemDiscount).toLocaleString()}
                  </div>
                </div>

                {item.note && (
                  <div className="text-[10px] text-amber-300/80 italic flex items-center gap-1">
                    <FileEdit className="w-2.5 h-2.5" />
                    Note: {item.note}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-white font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Item Discount */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-500">Disc:</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={item.itemDiscount || ''}
                      onChange={(e) => updateItemDiscount(item.product.id, Number(e.target.value))}
                      className="w-12 p-0.5 bg-slate-900 border border-slate-700 rounded text-center text-white text-xs font-mono"
                    />
                  </div>

                  {/* Item Note Toggle */}
                  <button
                    onClick={() => {
                      setEditingNoteItemId(item.product.id);
                      setItemNoteText(item.note || '');
                    }}
                    className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Add item note"
                  >
                    <FileEdit className="w-3 h-3" />
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Inline Note Editor if opened */}
                {editingNoteItemId === item.product.id && (
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="e.g. Gift wrap, fragile..."
                      value={itemNoteText}
                      onChange={(e) => setItemNoteText(e.target.value)}
                      className="flex-1 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                    />
                    <button
                      onClick={() => saveItemNote(item.product.id)}
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-semibold"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. RIGHT PANEL: Bill Totals, Discounts & Payment */}
      <div className="w-full lg:w-[320px] bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-xl space-y-4 shrink-0">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Bill Calculation</h3>
            <span className="text-[11px] font-mono text-slate-400">{activeShop.currency}</span>
          </div>

          {/* Overall Bill Discount */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
              <span>Overall Bill Discount</span>
              <span className="text-blue-400 font-bold cursor-pointer" onClick={() => setBillDiscountType(billDiscountType === 'fixed' ? 'percent' : 'fixed')}>
                Mode: {billDiscountType === 'fixed' ? 'PKR (Flat)' : '% (Percent)'}
              </span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                placeholder="0"
                value={billDiscountValue || ''}
                onChange={(e) => setBillDiscountValue(Number(e.target.value))}
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setBillDiscountType(billDiscountType === 'fixed' ? 'percent' : 'fixed')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold rounded-xl text-xs"
              >
                {billDiscountType === 'fixed' ? 'PKR' : '%'}
              </button>
            </div>
          </div>

          {/* Tax & Delivery Charge */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Tax ({activeShop.defaultTaxRate}%)</div>
                <div className="text-[10px] text-slate-500">GST</div>
              </div>
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-0.5">
              <label className="text-[10px] font-semibold text-slate-400">Delivery / Fee</label>
              <input
                type="number"
                placeholder="0"
                value={deliveryCharge || ''}
                onChange={(e) => setDeliveryCharge(Number(e.target.value))}
                className="w-full p-0.5 bg-transparent font-mono text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Detailed Financial Breakdown */}
          <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white font-mono">{activeShop.currency} {rawSubtotal.toLocaleString()}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Total Discount:</span>
                <span className="font-mono">-{activeShop.currency} {totalDiscount.toLocaleString()}</span>
              </div>
            )}
            {taxEnabled && (
              <div className="flex justify-between">
                <span>Tax ({activeShop.defaultTaxRate}%):</span>
                <span className="text-white font-mono">+{activeShop.currency} {Math.round(totalTax).toLocaleString()}</span>
              </div>
            )}
            {deliveryCharge > 0 && (
              <div className="flex justify-between">
                <span>Delivery / Service:</span>
                <span className="text-white font-mono">+{activeShop.currency} {deliveryCharge.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Grand Total & Checkout Button */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Grand Total</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">
                {activeShop.currency} {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer min-h-[44px]"
          >
            <CreditCard className="w-5 h-5" />
            Checkout & Pay ({activeShop.currency} {grandTotal.toLocaleString()})
          </button>
        </div>
      </div>
    </div>

    {/* Floating Mobile Cart Pill when viewing catalog */}
    {mobileActiveTab === 'catalog' && cart.length > 0 && (
      <div className="lg:hidden fixed bottom-16 sm:bottom-4 left-4 right-4 z-30 animate-in slide-in-from-bottom-3 duration-200">
        <button
          onClick={() => setMobileActiveTab('cart')}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-2xl flex items-center justify-between border border-blue-400/30 cursor-pointer min-h-[44px]"
        >
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/20 text-white font-mono text-[11px] flex items-center justify-center font-bold">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
            <span>Items in Cart</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-emerald-300">{activeShop.currency} {grandTotal.toLocaleString()}</span>
            <span className="text-white text-sm font-bold">&rarr;</span>
          </div>
        </button>
      </div>
    )}
    </div>
  );
};
