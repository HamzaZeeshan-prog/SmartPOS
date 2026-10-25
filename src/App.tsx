import React, { useState, useEffect } from 'react';
import { FlutterMobileFrame } from './components/FlutterMobileFrame';
import { InteractiveLogo } from './components/InteractiveLogo';
import { FlutterArchitectureHub } from './components/FlutterArchitectureHub';
import { DashboardView } from './components/DashboardView';
import { PosTerminal } from './components/PosTerminal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { OnboardingWizardModal } from './components/OnboardingWizardModal';
import { AuthModal } from './components/AuthModal';
import { ZReportModal } from './components/ZReportModal';
import { ProfitLossView } from './components/ProfitLossView';
import { SyncQueueStatusModal } from './components/SyncQueueStatusModal';
import { SalesManagerView } from './components/SalesManagerView';
import { CustomerLedgerView } from './components/CustomerLedgerView';
import { CustomerLedgerModal } from './components/CustomerLedgerModal';
import { SuppliersView } from './components/SuppliersView';
import { ExpenseTrackerView } from './components/ExpenseTrackerView';
import { RefundModal } from './components/RefundModal';
import { InventoryManagerView } from './components/InventoryManagerView';
import { StockAdjustmentModal } from './components/StockAdjustmentModal';
import { ProductFormModal } from './components/ProductFormModal';
import { 
  syncShopToCloud, 
  syncProductToCloud, 
  syncAllProductsToCloud, 
  recordCloudStockAdjustment, 
  syncSaleToCloud,
  StockAdjustmentRecord 
} from './services/cloudService';
import { testFirestoreConnection } from './lib/firebase';
import { 
  DEMO_USERS, 
  DEMO_SHOPS, 
  DEMO_PRODUCTS, 
  DEMO_CUSTOMERS, 
  DEMO_PAST_SALES,
  DEMO_SUPPLIERS,
  DEMO_EXPENSES
} from './data/demoData';
import { 
  Product, 
  CartItem, 
  Customer, 
  CustomerLedgerEntry,
  Sale, 
  PaymentRecord, 
  Shop, 
  User,
  Supplier,
  SupplierPaymentRecord,
  Expense,
  RefundItem
} from './types/pos';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Store, 
  UserCheck, 
  Wifi, 
  CheckCircle2, 
  Layers,
  FileCode,
  Database,
  Cloud,
  Barcode,
  CreditCard,
  Printer,
  Users,
  Building2,
  Receipt,
  RefreshCw,
  Calculator,
  TrendingUp,
  CloudOff,
  Cpu,
  Menu,
  X,
  MoreHorizontal,
  Settings,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Navigation views
  const [currentView, setCurrentView] = useState<
    'pos' | 'dashboard' | 'inventory' | 'history' | 'customers' | 'suppliers' | 'expenses' | 'pnl' | 'architecture'
  >('pos');

  // Mobile navigation drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Application State
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Default: Tariq (Owner)
  const [shops, setShops] = useState<Shop[]>(DEMO_SHOPS);
  const [activeShop, setActiveShop] = useState<Shop>(DEMO_SHOPS[0]);
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(DEMO_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEMO_SUPPLIERS);
  const [expenses, setExpenses] = useState<Expense[]>(DEMO_EXPENSES);
  const [salesHistory, setSalesHistory] = useState<Sale[]>(DEMO_PAST_SALES);

  // Cloud Sync Status
  const [cloudConnected, setCloudConnected] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [lastSyncCount, setLastSyncCount] = useState<number | null>(null);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProductForAction, setSelectedProductForAction] = useState<Product | null>(null);
  const [selectedSaleForRefund, setSelectedSaleForRefund] = useState<Sale | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);
  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isSyncQueueModalOpen, setIsSyncQueueModalOpen] = useState(false);

  // Checkout payload in progress
  const [activeCheckout, setActiveCheckout] = useState<{
    cart: CartItem[];
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    customer?: Customer;
  } | null>(null);

  // Active receipt to display
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Test Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection().then((ok) => {
      setCloudConnected(ok);
      if (ok) {
        syncShopToCloud(activeShop).catch(console.error);
      }
    });
  }, [activeShop]);

  // Global USB / Bluetooth HID Hardware Barcode Scanner Listener
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 160) {
        keyBuffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        const barcodeScanned = keyBuffer.trim();
        if (barcodeScanned.length >= 3) {
          e.preventDefault();
          const match = products.find((p) => p.barcode === barcodeScanned);
          if (match) {
            showToast(`USB Scanned: ${match.name}`);
            setCurrentView('pos');
          } else {
            setIsScannerOpen(true);
          }
        }
        keyBuffer = '';
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handler: Scanner found product
  const handleProductFoundFromScan = (product: Product) => {
    showToast(`Scanned: ${product.name} (${activeShop.currency} ${product.sellingPrice})`);
    setCurrentView('pos');
  };

  // Handler: Add new product from online lookup or manual
  const handleAddNewProductFromScan = async (newProdData: Partial<Product>) => {
    const product: Product = {
      id: `prod_${Date.now()}`,
      shopId: activeShop.id,
      barcode: newProdData.barcode || `8964${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: newProdData.name || 'Custom Product',
      category: newProdData.category || 'General',
      brand: newProdData.brand || 'Generic',
      description: newProdData.description || '',
      costPrice: newProdData.costPrice || 100,
      sellingPrice: newProdData.sellingPrice || 150,
      taxPercentage: newProdData.taxPercentage || 5,
      stockQuantity: newProdData.stockQuantity || 20,
      minimumStockLimit: 5,
      unit: newProdData.unit || 'piece',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [product, ...prev]);
    await syncProductToCloud(activeShop.id, product).catch(console.error);
    showToast(`Saved to Local & Cloud Firestore: ${product.name}`);
    setCurrentView('inventory');
  };

  // Handler: Save product from ProductFormModal (Add or Edit)
  const handleSaveProductFromForm = async (saved: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [saved, ...prev];
    });

    await syncProductToCloud(activeShop.id, saved);
    showToast(`Product "${saved.name}" synced to Cloud Firestore!`);
  };

  // Handler: Delete product
  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast(`Product "${target.name}" removed from inventory.`);
  };

  // Handler: Stock Adjustment
  const handleConfirmStockAdjustment = async (adj: StockAdjustmentRecord) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === adj.productId ? { ...p, stockQuantity: adj.newQuantity } : p))
    );
    await recordCloudStockAdjustment(activeShop.id, adj);
    showToast(`Stock updated: ${adj.productName} -> ${adj.newQuantity} (Synced to Cloud)`);
  };

  // Handler: Batch Sync all products to Cloud Firestore
  const handleSyncAllToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const count = await syncAllProductsToCloud(activeShop.id, products);
      setLastSyncCount(count);
      showToast(`Successfully synced ${count} items to Cloud Firestore!`);
    } catch (err) {
      console.error(err);
      showToast('Cloud sync failed.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Handler: Start Checkout from POS Terminal
  const handleStartCheckout = (
    cart: CartItem[],
    subtotal: number,
    discountTotal: number,
    taxTotal: number,
    grandTotal: number,
    customer?: Customer
  ) => {
    setActiveCheckout({
      cart,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      customer,
    });
    setIsPaymentOpen(true);
  };

  // Handler: Payment succeeded
  const handlePaymentSuccess = async (payments: PaymentRecord[], invoiceNumber: string) => {
    if (!activeCheckout) return;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber,
      shopId: activeShop.id,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: activeCheckout.customer?.id,
      customerName: activeCheckout.customer?.name,
      items: activeCheckout.cart,
      subtotal: activeCheckout.subtotal,
      discountTotal: activeCheckout.discountTotal,
      taxTotal: activeCheckout.taxTotal,
      deliveryCharge: 0,
      grandTotal: activeCheckout.grandTotal,
      payments,
      paymentStatus: 'paid',
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => {
      return prev.map((p) => {
        const cartItem = activeCheckout.cart.find((item) => item.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity),
          };
        }
        return p;
      });
    });

    setSalesHistory((prev) => [newSale, ...prev]);
    syncSaleToCloud(activeShop.id, newSale).catch(console.error);

    setIsPaymentOpen(false);
    setActiveReceiptSale(newSale);
    setIsReceiptOpen(true);
    showToast(`Order ${invoiceNumber} completed & synced to Cloud!`);
  };

  // Save / Update shop from onboarding wizard
  const handleSaveShop = async (savedShop: Shop) => {
    const exists = shops.some((s) => s.id === savedShop.id);
    if (exists) {
      setShops((prev) => prev.map((s) => (s.id === savedShop.id ? savedShop : s)));
    } else {
      setShops((prev) => [...prev, savedShop]);
    }
    setActiveShop(savedShop);
    await syncShopToCloud(savedShop).catch(console.error);
    showToast(`Store profile "${savedShop.name}" saved & synced to Cloud!`);
  };

  // Phase 7: Process Sale Refund with Restock
  const handleConfirmRefund = (payload: {
    saleId: string;
    refundAmount: number;
    itemsToRefund: RefundItem[];
    reason: string;
    restock: boolean;
  }) => {
    setSalesHistory((prev) =>
      prev.map((s) => {
        if (s.id === payload.saleId) {
          const isFull = payload.refundAmount >= s.grandTotal;
          return {
            ...s,
            isRefunded: isFull,
            isPartiallyRefunded: !isFull,
            refundAmount: (s.refundAmount || 0) + payload.refundAmount,
            refundDetails: {
              id: `ref_${Date.now()}`,
              saleId: s.id,
              invoiceNumber: s.invoiceNumber,
              shopId: activeShop.id,
              refundedAt: new Date().toISOString(),
              refundedBy: currentUser.name,
              refundAmount: payload.refundAmount,
              items: payload.itemsToRefund,
              reason: payload.reason,
              restockedToInventory: payload.restock,
            },
          };
        }
        return s;
      })
    );

    if (payload.restock) {
      setProducts((prev) =>
        prev.map((prod) => {
          const refundItem = payload.itemsToRefund.find((ri) => ri.productId === prod.id);
          if (refundItem) {
            const updatedStock = prod.stockQuantity + refundItem.quantityRefunded;
            if (cloudConnected) {
              recordCloudStockAdjustment(activeShop.id, {
                id: `adj_${Date.now()}_${prod.id}`,
                shopId: activeShop.id,
                productId: prod.id,
                productName: prod.name,
                previousQuantity: prod.stockQuantity,
                changeQuantity: refundItem.quantityRefunded,
                newQuantity: updatedStock,
                type: 'return',
                reason: `Customer Refund - ${payload.reason}`,
                performedBy: currentUser.name,
                createdAt: new Date().toISOString(),
              }).catch(console.error);
            }
            return { ...prod, stockQuantity: updatedStock };
          }
          return prod;
        })
      );
    }

    showToast(
      `Refund of ${activeShop.currency} ${payload.refundAmount.toLocaleString()} completed!${
        payload.restock ? ' Inventory restocked.' : ''
      }`
    );
  };

  // Phase 7: Record Customer Khata Repayment
  const handleRecordCustomerPayment = (customerId: string, amount: number, method: string, note?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newDue = Math.max(0, c.dueBalance - amount);
          const newEntry: CustomerLedgerEntry = {
            id: `ent_${Date.now()}`,
            customerId: c.id,
            shopId: activeShop.id,
            date: new Date().toISOString(),
            type: 'credit',
            amount,
            balanceAfter: newDue,
            paymentMethod: method,
            note: note || 'Customer balance repayment',
          };
          return {
            ...c,
            dueBalance: newDue,
            ledger: [newEntry, ...(c.ledger || [])],
          };
        }
        return c;
      })
    );
    showToast(`Payment of ${activeShop.currency} ${amount.toLocaleString()} recorded in customer ledger!`);
  };

  // Phase 7: Add Customer
  const handleAddCustomer = (newCust: Omit<Customer, 'id'>) => {
    const created: Customer = {
      ...newCust,
      id: `cust_${Date.now()}`,
    };
    setCustomers((prev) => [created, ...prev]);
    showToast(`Customer ${created.name} registered successfully!`);
  };

  // Phase 7: Supplier payout
  const handleRecordSupplierPayment = (supplierId: string, amount: number, method: 'cash' | 'bank_transfer' | 'cheque', note?: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const newBalance = Math.max(0, s.payableBalance - amount);
          const newPayment: SupplierPaymentRecord = {
            id: `spay_${Date.now()}`,
            supplierId: s.id,
            shopId: activeShop.id,
            date: new Date().toISOString(),
            amount,
            method,
            note,
          };
          return {
            ...s,
            payableBalance: newBalance,
            payments: [newPayment, ...(s.payments || [])],
          };
        }
        return s;
      })
    );
    showToast(`Supplier payout of ${activeShop.currency} ${amount.toLocaleString()} recorded!`);
  };

  // Phase 7: Add Supplier
  const handleAddSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const created: Supplier = {
      ...newSup,
      id: `sup_${Date.now()}`,
    };
    setSuppliers((prev) => [created, ...prev]);
    showToast(`Supplier ${created.name} added!`);
  };

  // Phase 7: Add Expense
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
    };
    setExpenses((prev) => [created, ...prev]);
    showToast(`Expense of ${activeShop.currency} ${created.amount.toLocaleString()} logged!`);
  };

  const handleLogout = () => {
    setCurrentUser(DEMO_USERS[2]);
    showToast('Signed out. Switched to Cashier role.');
  };

  return (
    <FlutterMobileFrame onOpenCodeHub={() => setCurrentView('architecture')}>
      <div className="w-full min-h-full flex-1 flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative">
        {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-bounce border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          {toastMessage}
        </div>
      )}

      {/* Top Navigation Shell */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Interactive Brand Logo */}
          <div className="flex items-center gap-3">
            <InteractiveLogo
              activeShop={activeShop}
              currentUser={currentUser}
              cloudConnected={cloudConnected}
              onOpenZReport={() => setIsZReportOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNavigateToPos={() => setCurrentView('pos')}
            />

            {/* Cloud Firestore & USB Scanner ready indicator (Desktop/Tablet) */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setIsSyncQueueModalOpen(true)}
                className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  cloudConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title="Inspect SQLite offline mutation sync queue"
              >
                {cloudConnected ? <Cloud className="w-3.5 h-3.5" /> : <CloudOff className="w-3.5 h-3.5" />}
                {cloudConnected ? 'Cloud Live (SQLite Sync)' : 'Offline (Local SQLite)'}
              </button>

              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5" />
                USB Scanner Ready
              </span>
            </div>
          </div>

          {/* Controls: Multi-Shop Switcher, Z-Report, User Profile & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Z-Report Button */}
            <button
              onClick={() => setIsZReportOpen(true)}
              className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer min-h-[36px]"
              title="Daily Closing Z-Report"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Z-Report</span>
            </button>

            {/* Multi-Shop Selector */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs max-w-[130px] sm:max-w-none">
              <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <select
                value={activeShop.id}
                onChange={(e) => {
                  const shop = shops.find((s) => s.id === e.target.value);
                  if (shop) {
                    setActiveShop(shop);
                    showToast(`Active Shop: ${shop.name}`);
                  }
                }}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer truncate"
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* User Session & Role Button (Opens Auth Modal) */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl px-2 sm:px-3 py-1.5 text-xs transition-colors cursor-pointer min-h-[36px]"
              title={`Logged in as ${currentUser.name} (${currentUser.role})`}
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                {currentUser.role[0].toUpperCase()}
              </span>
            </button>

            {/* Mobile Drawer Hamburger Button */}
            <button
              onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px]"
              title="Toggle Navigation Menu"
            >
              {isMobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Desktop / Tablet View Tabs */}
        <div className="hidden md:block border-t border-slate-800/80 bg-slate-900/60 px-4">
          <div className="max-w-7xl mx-auto flex overflow-x-auto gap-2 py-2 scrollbar-none">
            <button
              onClick={() => setCurrentView('pos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'pos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Cashier POS Terminal
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Store Dashboard
            </button>

            <button
              onClick={() => setCurrentView('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'inventory'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory & Catalog ({products.length})
            </button>

            <button
              onClick={() => setCurrentView('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'history'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Sales & Refunds ({salesHistory.length})
            </button>

            <button
              onClick={() => setCurrentView('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'customers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              Customers & Khata ({customers.length})
            </button>

            <button
              onClick={() => setCurrentView('suppliers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'suppliers'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-purple-400" />
              Suppliers ({suppliers.length})
            </button>

            <button
              onClick={() => setCurrentView('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'expenses'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4 text-rose-400" />
              Expenses ({expenses.length})
            </button>

            <button
              onClick={() => setCurrentView('pnl')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'pnl'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              P&L & Margins
            </button>

            <button
              onClick={() => setCurrentView('architecture')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                currentView === 'architecture'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-indigo-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4 text-indigo-400" />
              Flutter & Dart Code Hub
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 space-y-6 pb-24 md:pb-6">
        {/* VIEW 1: Cashier POS Terminal (Phase 5 Primary Screen) */}
        {currentView === 'pos' && (
          <PosTerminal
            products={products}
            customers={customers}
            activeShop={activeShop}
            currentUser={currentUser}
            onOpenScanner={() => setIsScannerOpen(true)}
            onStartCheckout={handleStartCheckout}
          />
        )}

        {/* VIEW 2: Store Dashboard */}
        {currentView === 'dashboard' && (
          <DashboardView
            products={products}
            sales={salesHistory}
            activeShop={activeShop}
            currentUser={currentUser}
            onNavigateToPos={() => setCurrentView('pos')}
            onOpenScanner={() => setIsScannerOpen(true)}
            onNavigateToInventory={() => setCurrentView('inventory')}
            onNavigateToHistory={() => setCurrentView('history')}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onViewReceipt={(sale) => {
              setActiveReceiptSale(sale);
              setIsReceiptOpen(true);
            }}
            onOpenZReport={() => setIsZReportOpen(true)}
          />
        )}

        {/* VIEW 3: Inventory Catalog */}
        {currentView === 'inventory' && (
          <InventoryManagerView
            products={products}
            activeShop={activeShop}
            onOpenAddProduct={() => {
              setSelectedProductForAction(null);
              setIsProductFormOpen(true);
            }}
            onOpenEditProduct={(p) => {
              setSelectedProductForAction(p);
              setIsProductFormOpen(true);
            }}
            onOpenStockAdjustment={(p) => {
              setSelectedProductForAction(p);
              setIsStockAdjustmentOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onSyncAllToCloud={handleSyncAllToCloud}
            isSyncing={isSyncingCloud}
            cloudSyncCount={lastSyncCount}
          />
        )}

        {/* VIEW 4: Sales Management & Refunds (Phase 7 Primary) */}
        {currentView === 'history' && (
          <SalesManagerView
            sales={salesHistory}
            activeShop={activeShop}
            currentUser={currentUser}
            onOpenReceipt={(sale) => {
              setActiveReceiptSale(sale);
              setIsReceiptOpen(true);
            }}
            onOpenRefund={(sale) => {
              setSelectedSaleForRefund(sale);
              setIsRefundModalOpen(true);
            }}
          />
        )}

        {/* VIEW 5: Customer Accounts & Khata Ledger (Phase 7) */}
        {currentView === 'customers' && (
          <CustomerLedgerView
            customers={customers}
            activeShop={activeShop}
            onSelectCustomer={(customer) => {
              setSelectedCustomerForLedger(customer);
              setIsCustomerLedgerOpen(true);
            }}
            onAddCustomer={handleAddCustomer}
          />
        )}

        {/* VIEW 6: Suppliers & Wholesale Accounts (Phase 7) */}
        {currentView === 'suppliers' && (
          <SuppliersView
            suppliers={suppliers}
            activeShop={activeShop}
            onRecordSupplierPayment={handleRecordSupplierPayment}
            onAddSupplier={handleAddSupplier}
          />
        )}

        {/* VIEW 7: Operating Expenses Tracker (Phase 7) */}
        {currentView === 'expenses' && (
          <ExpenseTrackerView
            expenses={expenses}
            activeShop={activeShop}
            currentUser={currentUser}
            grossSalesRevenue={salesHistory.reduce((sum, s) => sum + s.grandTotal, 0)}
            onAddExpense={handleAddExpense}
          />
        )}

        {/* VIEW 8: Profit & Loss Statement (Phase 8) */}
        {currentView === 'pnl' && (
          <ProfitLossView
            sales={salesHistory}
            expenses={expenses}
            products={products}
            shop={activeShop}
            currentUser={currentUser}
          />
        )}

        {/* VIEW 9: Flutter & Dart Architecture & Code Hub (Consolidated Phases 1-8) */}
        {currentView === 'architecture' && <FlutterArchitectureHub />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-3 py-1 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => {
            setCurrentView('pos');
            setIsMobileDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] min-h-[44px] ${
            currentView === 'pos' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Terminal</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('dashboard');
            setIsMobileDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] min-h-[44px] ${
            currentView === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Dashboard</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('inventory');
            setIsMobileDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] min-h-[44px] ${
            currentView === 'inventory' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Catalog</span>
        </button>

        <button
          onClick={() => {
            setCurrentView('history');
            setIsMobileDrawerOpen(false);
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] min-h-[44px] ${
            currentView === 'history' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">Sales</span>
        </button>

        <button
          onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors cursor-pointer min-w-[56px] min-h-[44px] ${
            isMobileDrawerOpen ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)} 
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs bg-slate-900 border-l border-slate-800 p-5 flex flex-col h-full shadow-2xl z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs">
                  SP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Smart POS</h3>
                  <p className="text-[10px] text-slate-400">All Modules & Tools</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="py-4 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Store Operations
              </div>

              {[
                { id: 'pos', name: 'Cashier POS Terminal', icon: ShoppingCart, count: null },
                { id: 'dashboard', name: 'Store Dashboard', icon: LayoutDashboard, count: null },
                { id: 'inventory', name: 'Inventory Catalog', icon: Package, count: products.length },
                { id: 'history', name: 'Sales & Refunds', icon: History, count: salesHistory.length },
                { id: 'customers', name: 'Customers & Khata', icon: Users, count: customers.length },
                { id: 'suppliers', name: 'Wholesale Suppliers', icon: Building2, count: suppliers.length },
                { id: 'expenses', name: 'Operating Expenses', icon: Receipt, count: expenses.length },
                { id: 'pnl', name: 'P&L & Margins', icon: TrendingUp, count: null },
                { id: 'architecture', name: 'Flutter & Dart Code Hub', icon: Cpu, count: 'Phases 1-8' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as any);
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.count !== null && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions & Modals */}
            <div className="pt-4 border-t border-slate-800 space-y-2 mt-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Quick Shortcuts
              </div>

              <button
                onClick={() => {
                  setIsZReportOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40 cursor-pointer min-h-[44px]"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Daily Closing Z-Report</span>
              </button>

              <button
                onClick={() => {
                  setIsScannerOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-blue-300 bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/40 cursor-pointer min-h-[44px]"
              >
                <Barcode className="w-4 h-4 text-blue-400" />
                <span>Camera Barcode Scanner</span>
              </button>

              <button
                onClick={() => {
                  setIsOnboardingOpen(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/40 cursor-pointer min-h-[44px]"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Store Setup Wizard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* 1. Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onProductFound={handleProductFoundFromScan}
        onAddNewProduct={handleAddNewProductFromScan}
      />

      {/* 2. Payment Modal */}
      {activeCheckout && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          grandTotal={activeCheckout.grandTotal}
          subtotal={activeCheckout.subtotal}
          discountTotal={activeCheckout.discountTotal}
          taxTotal={activeCheckout.taxTotal}
          deliveryCharge={0}
          shop={activeShop}
          customer={activeCheckout.customer}
          cashierName={currentUser.name}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* 3. Receipt Modal */}
      {activeReceiptSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          sale={activeReceiptSale}
          shop={activeShop}
        />
      )}

      {/* 4. Onboarding Setup Wizard Modal */}
      <OnboardingWizardModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSaveShop={handleSaveShop}
        existingShop={activeShop}
      />

      {/* 5. Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginUser={(user) => {
          setCurrentUser(user);
          showToast(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
        }}
        onLogout={handleLogout}
        onTriggerOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* 6. Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isStockAdjustmentOpen}
        onClose={() => setIsStockAdjustmentOpen(false)}
        product={selectedProductForAction}
        onConfirmAdjustment={handleConfirmStockAdjustment}
        currentUserName={currentUser.name}
      />

      {/* 7. Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        productToEdit={selectedProductForAction}
        shopId={activeShop.id}
        onSaveProduct={handleSaveProductFromForm}
      />

      {/* 8. Phase 7: Sale Refund Modal */}
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setSelectedSaleForRefund(null);
        }}
        sale={selectedSaleForRefund}
        shop={activeShop}
        cashierName={currentUser.name}
        onConfirmRefund={handleConfirmRefund}
      />

      {/* 9. Phase 7: Customer Khata Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isCustomerLedgerOpen}
        onClose={() => {
          setIsCustomerLedgerOpen(false);
          setSelectedCustomerForLedger(null);
        }}
        customer={selectedCustomerForLedger}
        shop={activeShop}
        onRecordPayment={handleRecordCustomerPayment}
      />

      {/* 10. Phase 8: Daily Closing Z-Report Modal */}
      <ZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        sales={salesHistory}
        expenses={expenses}
        shop={activeShop}
        currentUser={currentUser}
      />

      {/* 11. Phase 8: Offline SQLite Sync Queue Inspector Modal */}
      <SyncQueueStatusModal
        isOpen={isSyncQueueModalOpen}
        onClose={() => setIsSyncQueueModalOpen(false)}
        shop={activeShop}
        isCloudConnected={cloudConnected}
        onToggleCloudMode={() => {
          const next = !cloudConnected;
          setCloudConnected(next);
          showToast(next ? 'Cloud Online: Auto-sync active' : 'Offline Mode: Writing to Drift SQLite');
        }}
        onForceReplaySync={async () => {
          await handleSyncAllToCloud();
        }}
      />
      </div>
    </FlutterMobileFrame>
  );
}
