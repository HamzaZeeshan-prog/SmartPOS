import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { SaaSAuthPortal } from './components/SaaSAuthPortal';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
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
import { generateStarterProducts } from './utils/starterCatalog';
import { findProductByBarcode } from './utils/barcodeUtils';
import { addDaysIso, getEffectiveSubscriptionStatus, getShopEntitlements } from './data/saasConfig';
import {
  syncShopToCloud,
  syncSaasUserToCloud,
  deleteSaasUserFromCloud,
  syncSubscriptionRequestToCloud,
  syncProductToCloud,
  deleteProductFromCloud,
  syncAllProductsToCloud,
  recordCloudStockAdjustment,
  syncSaleToCloud,
  syncCustomerToCloud,
  syncSupplierToCloud,
  syncExpenseToCloud,
  fetchSaasRegistryFromCloud,
  fetchShopOperationalDataFromCloud,
  subscribeToSaasRegistry,
  subscribeToShopOperationalData,
  StockAdjustmentRecord,
} from './services/cloudService';
import { testFirestoreConnection } from './lib/firebase';
import {
  DEMO_USERS,
  DEMO_SHOPS,
  DEMO_PRODUCTS,
  DEMO_CUSTOMERS,
  DEMO_PAST_SALES,
  DEMO_SUPPLIERS,
  DEMO_EXPENSES,
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
  RefundItem,
  SubscriptionRequest,
} from './types/pos';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  History,
  Store,
  UserCheck,
  CheckCircle2,
  Cloud,
  Barcode,
  Users,
  Building2,
  Receipt,
  TrendingUp,
  CloudOff,
  Cpu,
  Menu,
  X,
  MoreHorizontal,
  Settings,
  Calculator,
  LogOut,
  Lock,
} from 'lucide-react';

const SAAS_STORAGE_KEY = 'omnipos_saas_v2';

interface PersistedSaasState {
  registeredUsers: User[];
  shops: Shop[];
  subscriptionRequests: SubscriptionRequest[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  salesHistory: Sale[];
  isAuthenticated?: boolean;
  isSuperAdminAuthenticated?: boolean;
  currentUserId?: string;
  activeShopId?: string;
  initialAuthNotice?: string | null;
}

function mergeById<T extends { id: string }>(localItems: T[], cloudItems: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of cloudItems) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of localItems) {
    if (item && item.id) map.set(item.id, item);
  }
  return Array.from(map.values());
}

function loadInitialSaasState(): PersistedSaasState {
  try {
    const raw = localStorage.getItem(SAAS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedSaasState>;
      if (Array.isArray(parsed.shops) && parsed.shops.length > 0) {
        const users = Array.isArray(parsed.registeredUsers) ? parsed.registeredUsers : DEMO_USERS;
        const shopsList = parsed.shops;
        const restoredShop =
          shopsList.find((s) => s.id === parsed.activeShopId) || shopsList[0] || DEMO_SHOPS[0];
        let isAuth = Boolean(parsed.isAuthenticated);
        const isAdmin = Boolean(parsed.isSuperAdminAuthenticated);
        let initialNotice: string | null = null;

        if (isAuth && !isAdmin && restoredShop) {
          const effStatus = getEffectiveSubscriptionStatus(restoredShop);
          if (effStatus !== 'active') {
            isAuth = false;
            initialNotice =
              effStatus === 'expired'
                ? `Monthly subscription completed for "${restoredShop.name}". Your business data remains safely intact—renew to log back in.`
                : effStatus === 'blocked'
                ? `"${restoredShop.name}" has been blocked by the Super Admin.`
                : null;
          }
        }

        return {
          registeredUsers: users,
          shops: shopsList,
          subscriptionRequests: Array.isArray(parsed.subscriptionRequests) ? parsed.subscriptionRequests : [],
          products: Array.isArray(parsed.products) ? parsed.products : DEMO_PRODUCTS,
          customers: Array.isArray(parsed.customers) ? parsed.customers : DEMO_CUSTOMERS,
          suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : DEMO_SUPPLIERS,
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : DEMO_EXPENSES,
          salesHistory: Array.isArray(parsed.salesHistory) ? parsed.salesHistory : DEMO_PAST_SALES,
          isAuthenticated: isAuth,
          isSuperAdminAuthenticated: isAdmin,
          currentUserId: parsed.currentUserId,
          activeShopId: restoredShop?.id,
          initialAuthNotice: initialNotice,
        };
      }
    }
  } catch {
    // Fallback to initial demo seed on storage parse error
  }

  return {
    registeredUsers: DEMO_USERS,
    shops: DEMO_SHOPS,
    subscriptionRequests: [],
    products: DEMO_PRODUCTS,
    customers: DEMO_CUSTOMERS,
    suppliers: DEMO_SUPPLIERS,
    expenses: DEMO_EXPENSES,
    salesHistory: DEMO_PAST_SALES,
    isAuthenticated: false,
    isSuperAdminAuthenticated: false,
  };
}

export default function App() {
  const initialData = useMemo(() => loadInitialSaasState(), []);

  // Navigation views
  const [currentView, setCurrentView] = useState<
    'pos' | 'dashboard' | 'inventory' | 'history' | 'customers' | 'suppliers' | 'expenses' | 'pnl' | 'architecture'
  >('pos');

  // Mobile navigation drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // SaaS Multi-Tenant Authentication & Admin Session (restores active session across restarts)
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(initialData.registeredUsers);
  const [shops, setShops] = useState<Shop[]>(initialData.shops);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>(
    initialData.subscriptionRequests
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(initialData.isAuthenticated));
  const [isSuperAdminAuthenticated, setIsSuperAdminAuthenticated] = useState<boolean>(
    Boolean(initialData.isSuperAdminAuthenticated)
  );
  const [authNotice, setAuthNotice] = useState<string | null>(initialData.initialAuthNotice ?? null);
  const [editingShop, setEditingShop] = useState<Shop | undefined>(undefined);

  // Active Tenant State
  const [currentUser, setCurrentUser] = useState<User>(
    () =>
      initialData.registeredUsers.find((u) => u.id === initialData.currentUserId) ||
      initialData.registeredUsers[0] ||
      DEMO_USERS[0]
  );
  const [activeShop, setActiveShop] = useState<Shop>(
    () =>
      initialData.shops.find((s) => s.id === initialData.activeShopId) ||
      initialData.shops[0] ||
      DEMO_SHOPS[0]
  );
  const [products, setProducts] = useState<Product[]>(initialData.products);
  const [customers, setCustomers] = useState<Customer[]>(initialData.customers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialData.suppliers);
  const [expenses, setExpenses] = useState<Expense[]>(initialData.expenses);
  const [salesHistory, setSalesHistory] = useState<Sale[]>(initialData.salesHistory);

  const persistedPayloadRef = useRef<PersistedSaasState | null>(null);

  // Persist SaaS session & all multi-tenant data so restarting the app keeps user signed in & preserves all records
  useEffect(() => {
    const payload: PersistedSaasState = {
      registeredUsers,
      shops,
      subscriptionRequests,
      products,
      customers,
      suppliers,
      expenses,
      salesHistory,
      isAuthenticated,
      isSuperAdminAuthenticated,
      currentUserId: currentUser.id,
      activeShopId: activeShop.id,
    };
    persistedPayloadRef.current = payload;
    try {
      localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    registeredUsers,
    shops,
    subscriptionRequests,
    products,
    customers,
    suppliers,
    expenses,
    salesHistory,
    isAuthenticated,
    isSuperAdminAuthenticated,
    currentUser.id,
    activeShop.id,
  ]);

  // Flush snapshot synchronously on tab/app close
  useEffect(() => {
    const flushNow = () => {
      if (!persistedPayloadRef.current) return;
      try {
        localStorage.setItem(SAAS_STORAGE_KEY, JSON.stringify(persistedPayloadRef.current));
      } catch {
        // Ignore storage quota errors
      }
    };
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('beforeunload', flushNow);
    return () => {
      window.removeEventListener('pagehide', flushNow);
      window.removeEventListener('beforeunload', flushNow);
    };
  }, []);

  const mergeCloudRegistry = (cloudUsers: User[], cloudShops: Shop[], cloudReqs: SubscriptionRequest[]) => {
    if (cloudUsers.length > 0) {
      setRegisteredUsers((prev) => mergeById(cloudUsers, prev));
    }
    if (cloudReqs.length > 0) {
      setSubscriptionRequests((prev) => mergeById(cloudReqs, prev));
    }
    if (cloudShops.length > 0) {
      setShops((prev) => mergeById(cloudShops, prev));
      setSubscriptionRequests((prev) => {
        const existingShopIds = new Set(prev.map((r) => r.shopId));
        const derived = cloudShops
          .filter((s) => s.subscriptionStatus === 'pending_approval' && !existingShopIds.has(s.id))
          .map<SubscriptionRequest>((s) => ({
            id: `subreq_cloud_${s.id}`,
            shopId: s.id,
            shopName: s.name,
            ownerName: s.ownerName,
            ownerEmail: s.ownerEmail || '',
            ownerPhone: s.phone,
            planId: s.subscriptionPlanId || 'monthly_starter',
            planName: s.subscriptionPlanName || 'Starter Monthly',
            amount: s.subscriptionFee || 2500,
            currency: 'PKR',
            paymentMethod: s.subscriptionPaymentMethod || 'JazzCash',
            paymentReference: s.subscriptionPaymentRef || 'Pending',
            status: 'pending',
            requestedAt: s.createdAt || new Date().toISOString(),
          }));
        return derived.length > 0 ? [...derived, ...prev] : prev;
      });
    }
  };

  const handleRefreshCloudRegistry = async (): Promise<{
    users: User[];
    shops: Shop[];
    requests: SubscriptionRequest[];
  }> => {
    try {
      const ok = await testFirestoreConnection();
      setCloudConnected(ok);
      const data = await fetchSaasRegistryFromCloud();
      mergeCloudRegistry(data.users, data.shops, data.requests);
      return data;
    } catch (err) {
      console.warn('Cloud registry refresh failed:', err);
      return { users: registeredUsers, shops, requests: subscriptionRequests };
    }
  };

  // Hydrate & subscribe in real-time to SaaS registry (users, shops, subscription requests) from Cloud Firestore
  useEffect(() => {
    let cancelled = false;

    handleRefreshCloudRegistry().catch(() => {});

    const unsubRegistry = subscribeToSaasRegistry({
      onUsers: (cloudUsers) => {
        if (!cancelled) setRegisteredUsers((prev) => mergeById(cloudUsers, prev));
      },
      onShops: (cloudShops) => {
        if (!cancelled) mergeCloudRegistry([], cloudShops, []);
      },
      onRequests: (cloudReqs) => {
        if (!cancelled) setSubscriptionRequests((prev) => mergeById(cloudReqs, prev));
      },
    });

    return () => {
      cancelled = true;
      unsubRegistry();
    };
  }, []);

  // Keep activeShop synchronized with the latest shop record in `shops`
  const currentActiveShop = useMemo(() => {
    return shops.find((s) => s.id === activeShop.id) || activeShop;
  }, [shops, activeShop]);

  const entitlements = useMemo(() => getShopEntitlements(currentActiveShop), [currentActiveShop]);

  // Strict Multi-Tenant Data Isolation: Data belongs strictly to currentActiveShop.id
  const currentShopProducts = useMemo(() => {
    return products.filter((p) => p.shopId === currentActiveShop.id);
  }, [products, currentActiveShop.id]);

  const currentShopSales = useMemo(() => {
    return salesHistory.filter((s) => s.shopId === currentActiveShop.id);
  }, [salesHistory, currentActiveShop.id]);

  const currentShopCustomers = useMemo(() => {
    return customers.filter((c) => c.shopId === currentActiveShop.id);
  }, [customers, currentActiveShop.id]);

  const currentShopSuppliers = useMemo(() => {
    return suppliers.filter((s) => s.shopId === currentActiveShop.id);
  }, [suppliers, currentActiveShop.id]);

  const currentShopExpenses = useMemo(() => {
    return expenses.filter((e) => e.shopId === currentActiveShop.id);
  }, [expenses, currentActiveShop.id]);

  // Stores associated with current logged-in operator (strictly scoped)
  const userShops = useMemo(() => {
    if (currentUser.role !== 'owner' && currentUser.shopId) {
      const assigned = shops.filter((s) => s.id === currentUser.shopId);
      if (assigned.length > 0) return assigned;
    }
    const owned = shops.filter(
      (s) =>
        s.ownerId === currentUser.id ||
        s.ownerEmail?.toLowerCase() === currentUser.email.toLowerCase() ||
        currentUser.businessIds?.includes(s.id) ||
        s.id === currentUser.shopId
    );
    return owned.length > 0 ? owned : [currentActiveShop];
  }, [shops, currentUser, currentActiveShop]);

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
  const [selectedCustomerIdForLedger, setSelectedCustomerIdForLedger] = useState<string | null>(null);
  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [isSyncQueueModalOpen, setIsSyncQueueModalOpen] = useState(false);

  const selectedCustomerForLedger = useMemo(() => {
    if (!selectedCustomerIdForLedger) return null;
    return customers.find((c) => c.id === selectedCustomerIdForLedger) || null;
  }, [customers, selectedCustomerIdForLedger]);

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
  const [scannedProductSignal, setScannedProductSignal] = useState<{ product: Product; seq: number } | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-enforce monthly expiration or Admin block while logged in (preserving all business data)
  useEffect(() => {
    if (!isAuthenticated) return;

    const enforceSubscriptionGuard = () => {
      const status = getEffectiveSubscriptionStatus(currentActiveShop);
      if (status === 'expired' || status === 'blocked') {
        if (status === 'expired' && currentActiveShop.subscriptionStatus !== 'expired') {
          setShops((prev) =>
            prev.map((s) =>
              s.id === currentActiveShop.id ? { ...s, subscriptionStatus: 'expired' } : s
            )
          );
        }
        setIsAuthenticated(false);
        setAuthNotice(
          status === 'expired'
            ? `Monthly subscription completed for "${currentActiveShop.name}". You have been automatically signed out while all your business data remains safely preserved. Renew your monthly subscription to log back in.`
            : `"${currentActiveShop.name}" has been blocked by the Super Admin during its subscription period.`
        );
      }
    };

    enforceSubscriptionGuard();
    const timer = setInterval(enforceSubscriptionGuard, 10000);
    return () => clearInterval(timer);
  }, [isAuthenticated, currentActiveShop]);

  // Test Firestore connection, hydrate & subscribe live to active shop operational collections
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    let cancelled = false;
    let unsubOps: (() => void) | undefined;

    testFirestoreConnection().then(async (ok) => {
      if (cancelled) return;
      setCloudConnected(ok);
      if (ok && isAuthenticated) {
        syncShopToCloud(currentActiveShop).catch(console.error);
        const cloudData = await fetchShopOperationalDataFromCloud(currentActiveShop.id);
        if (cancelled) return;
        if (cloudData.products.length > 0) setProducts((prev) => mergeById(cloudData.products, prev));
        if (cloudData.customers.length > 0) setCustomers((prev) => mergeById(cloudData.customers, prev));
        if (cloudData.suppliers.length > 0) setSuppliers((prev) => mergeById(cloudData.suppliers, prev));
        if (cloudData.expenses.length > 0) setExpenses((prev) => mergeById(cloudData.expenses, prev));
        if (cloudData.sales.length > 0) setSalesHistory((prev) => mergeById(cloudData.sales, prev));

        unsubOps = subscribeToShopOperationalData(currentActiveShop.id, {
          onProducts: (items) => !cancelled && setProducts((prev) => mergeById(items, prev)),
          onCustomers: (items) => !cancelled && setCustomers((prev) => mergeById(items, prev)),
          onSuppliers: (items) => !cancelled && setSuppliers((prev) => mergeById(items, prev)),
          onExpenses: (items) => !cancelled && setExpenses((prev) => mergeById(items, prev)),
          onSales: (items) => !cancelled && setSalesHistory((prev) => mergeById(items, prev)),
        });
      }
    });

    return () => {
      cancelled = true;
      if (unsubOps) unsubOps();
    };
  }, [currentActiveShop.id, isAuthenticated]);

  // Global USB / Bluetooth HID Hardware Barcode Scanner Listener
  useEffect(() => {
    if (!isAuthenticated) return;
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) {
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
          const match = findProductByBarcode(currentShopProducts, barcodeScanned);
          if (match) {
            showToast(`USB Scanned: ${match.name}`);
            setScannedProductSignal((prev) => ({ product: match, seq: (prev?.seq || 0) + 1 }));
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
  }, [currentShopProducts, isAuthenticated]);

  // Handler: Scanner found product
  const handleProductFoundFromScan = (product: Product) => {
    showToast(`Detected: ${product.name} (${currentActiveShop.currency} ${product.sellingPrice}) — Enter quantity`);
    setScannedProductSignal((prev) => ({ product, seq: (prev?.seq || 0) + 1 }));
    setCurrentView('pos');
  };

  // Handler: Add new product from online lookup or manual
  const handleAddNewProductFromScan = async (newProdData: Partial<Product>) => {
    const product: Product = {
      id: `prod_${Date.now()}`,
      shopId: currentActiveShop.id,
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
      expiryDate: newProdData.expiryDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [product, ...prev]);
    if (entitlements.allowCloudSync) {
      await syncProductToCloud(currentActiveShop.id, product).catch(console.error);
      showToast(`Saved to Local & Cloud Firestore: ${product.name}`);
    } else {
      showToast(`Saved locally: ${product.name}`);
    }
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

    if (entitlements.allowCloudSync) {
      await syncProductToCloud(currentActiveShop.id, saved).catch(console.error);
      showToast(`Product "${saved.name}" synced to Cloud Firestore!`);
    } else {
      showToast(`Product "${saved.name}" saved locally!`);
    }
  };

  // Handler: Delete product
  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (entitlements.allowCloudSync) {
      deleteProductFromCloud(currentActiveShop.id, productId).catch(console.error);
    }
    showToast(`Product "${target.name}" removed from inventory.`);
  };

  // Handler: Stock Adjustment
  const handleConfirmStockAdjustment = async (adj: StockAdjustmentRecord) => {
    const existing = products.find((p) => p.id === adj.productId);
    setProducts((prev) =>
      prev.map((p) => (p.id === adj.productId ? { ...p, stockQuantity: adj.newQuantity } : p))
    );
    if (entitlements.allowCloudSync) {
      await recordCloudStockAdjustment(currentActiveShop.id, adj).catch(console.error);
      if (existing) {
        await syncProductToCloud(currentActiveShop.id, { ...existing, stockQuantity: adj.newQuantity }).catch(console.error);
      }
      showToast(`Stock updated: ${adj.productName} -> ${adj.newQuantity} (Synced to Cloud)`);
    } else {
      showToast(`Stock updated locally: ${adj.productName} -> ${adj.newQuantity}`);
    }
  };

  // Handler: Batch Sync all shop entities & SaaS registry to Cloud Firestore
  const handleSyncAllToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const ok = await testFirestoreConnection();
      setCloudConnected(ok);
      const shopUsers = registeredUsers.filter(
        (u) =>
          u.shopId === currentActiveShop.id ||
          u.businessIds?.includes(currentActiveShop.id) ||
          u.id === currentActiveShop.ownerId
      );
      const shopReqs = subscriptionRequests.filter((r) => r.shopId === currentActiveShop.id);

      await Promise.all([
        syncShopToCloud(currentActiveShop),
        ...shopUsers.map((u) => syncSaasUserToCloud(u)),
        ...shopReqs.map((r) => syncSubscriptionRequestToCloud(r)),
      ]);

      const count = await syncAllProductsToCloud(currentActiveShop.id, currentShopProducts);

      await Promise.all([
        ...currentShopCustomers.map((c) => syncCustomerToCloud(currentActiveShop.id, c)),
        ...currentShopSuppliers.map((s) => syncSupplierToCloud(currentActiveShop.id, s)),
        ...currentShopExpenses.map((e) => syncExpenseToCloud(currentActiveShop.id, e)),
        ...currentShopSales.map((s) => syncSaleToCloud(currentActiveShop.id, s)),
      ]);

      setLastSyncCount(count);
      setCloudConnected(true);
      showToast(
        `Synced ${count} products, ${currentShopSales.length} sales & ${currentShopCustomers.length} customers to Cloud Firestore!`
      );
    } catch (err) {
      console.error('Cloud sync failed:', err);
      showToast('Cloud Firestore sync error — check connection or security rules.');
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

  // Handler: Payment succeeded (updates inventory + Udhaar Khata ledger if customer_credit)
  const handlePaymentSuccess = async (payments: PaymentRecord[], invoiceNumber: string) => {
    if (!activeCheckout) return;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber,
      shopId: currentActiveShop.id,
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

    setProducts((prev) =>
      prev.map((p) => {
        const cartItem = activeCheckout.cart.find((item) => item.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stockQuantity: Math.max(0, p.stockQuantity - cartItem.quantity),
          };
        }
        return p;
      })
    );

    // Record Udhaar charge or customer spend in Khata ledger
    if (activeCheckout.customer) {
      const creditAmount = payments
        .filter((p) => p.method === 'customer_credit')
        .reduce((sum, p) => sum + p.amount, 0);

      const targetCustomer =
        customers.find((c) => c.id === activeCheckout.customer?.id) || activeCheckout.customer;
      const newDue = targetCustomer.dueBalance + creditAmount;
      const nextLedger = [...(targetCustomer.ledger || [])];
      if (creditAmount > 0) {
        nextLedger.unshift({
          id: `ent_${Date.now()}`,
          customerId: targetCustomer.id,
          shopId: currentActiveShop.id,
          date: new Date().toISOString(),
          type: 'debit',
          amount: creditAmount,
          balanceAfter: newDue,
          paymentMethod: 'customer_credit',
          note: `Invoice ${invoiceNumber}`,
        });
      }
      const updatedCustomerRecord: Customer = {
        ...targetCustomer,
        dueBalance: newDue,
        totalPurchases: targetCustomer.totalPurchases + activeCheckout.grandTotal,
        loyaltyPoints: targetCustomer.loyaltyPoints + Math.floor(activeCheckout.grandTotal / 100),
        ledger: nextLedger,
      };

      setCustomers((prev) =>
        prev.map((c) => (c.id === targetCustomer.id ? updatedCustomerRecord : c))
      );
      if (entitlements.allowCloudSync) {
        syncCustomerToCloud(currentActiveShop.id, updatedCustomerRecord).catch(console.error);
      }
    }

    setSalesHistory((prev) => [newSale, ...prev]);
    if (entitlements.allowCloudSync) {
      syncSaleToCloud(currentActiveShop.id, newSale).catch(console.error);
    }

    setIsPaymentOpen(false);
    setActiveReceiptSale(newSale);
    setIsReceiptOpen(true);
    showToast(
      entitlements.allowCloudSync
        ? `Order ${invoiceNumber} completed & synced to Cloud!`
        : `Order ${invoiceNumber} saved locally!`
    );
  };

  // Save / Update shop from onboarding wizard
  const handleSaveShop = async (savedShop: Shop, populateStarter?: boolean) => {
    const exists = shops.some((s) => s.id === savedShop.id);
    if (exists) {
      setShops((prev) => prev.map((s) => (s.id === savedShop.id ? savedShop : s)));
    } else {
      if (!entitlements.allowMultiBranch) {
        showToast('Multi-Branch stores are disabled on Starter Monthly. Upgrade to Business Pro.');
        return;
      }
      const branchShop: Shop = {
        ...savedShop,
        ownerId: currentUser.id,
        ownerEmail: currentUser.email,
        subscriptionStatus: currentActiveShop.subscriptionStatus || 'active',
        subscriptionPlanId: currentActiveShop.subscriptionPlanId,
        subscriptionPlanName: currentActiveShop.subscriptionPlanName,
        subscriptionFee: currentActiveShop.subscriptionFee,
        subscriptionStartDate: currentActiveShop.subscriptionStartDate,
        subscriptionExpiresAt: currentActiveShop.subscriptionExpiresAt,
      };
      setShops((prev) => [...prev, branchShop]);
      if (populateStarter) {
        const starter = generateStarterProducts(branchShop.id, branchShop.category, branchShop.currency);
        if (starter.length > 0) {
          setProducts((prev) => [...starter, ...prev]);
          await syncAllProductsToCloud(branchShop.id, starter).catch(console.error);
        }
      }
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.id === currentUser.id
            ? { ...u, businessIds: [...(u.businessIds || []), branchShop.id] }
            : u
        )
      );
      setCurrentUser((prev) => ({
        ...prev,
        businessIds: [...(prev.businessIds || []), branchShop.id],
      }));
      setActiveShop(branchShop);
      await syncShopToCloud(branchShop).catch(console.error);
      showToast(`Business branch "${branchShop.name}" added & activated!`);
      return;
    }

    setActiveShop(savedShop);
    await syncShopToCloud(savedShop).catch(console.error);
    showToast(`Business profile "${savedShop.name}" saved & updated!`);
  };

  // SaaS Authentication & Subscription Lifecycle Handlers
  const handleSaaSLogin = (user: User, preferredShop?: Shop) => {
    setAuthNotice(null);
    setIsSuperAdminAuthenticated(false);
    setCurrentUser(user);
    if (preferredShop) {
      setActiveShop(preferredShop);
    } else {
      const match =
        shops.find(
          (s) =>
            s.id === user.shopId ||
            s.ownerEmail?.toLowerCase() === user.email.toLowerCase() ||
            user.businessIds?.includes(s.id)
        ) || shops[0];
      if (match) setActiveShop(match);
    }
    setCurrentView('pos');
    setIsAuthenticated(true);
    showToast(`Signed in as ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleSuperAdminLogin = () => {
    setAuthNotice(null);
    setIsAuthenticated(false);
    setIsSuperAdminAuthenticated(true);
  };

  // Register new business + submit monthly subscription request -> Pending Admin approval (no auto-login!)
  const handleSaaSRegister = async (
    newUser: User,
    newShop: Shop,
    starterProducts: Product[],
    request: SubscriptionRequest
  ) => {
    setRegisteredUsers((prev) => [newUser, ...prev]);
    setShops((prev) => [newShop, ...prev]);
    setSubscriptionRequests((prev) => [request, ...prev]);
    if (starterProducts.length > 0) {
      setProducts((prev) => [...starterProducts, ...prev]);
    }

    try {
      await Promise.all([
        syncShopToCloud(newShop),
        syncSaasUserToCloud(newUser),
        syncSubscriptionRequestToCloud(request),
        starterProducts.length > 0
          ? syncAllProductsToCloud(newShop.id, starterProducts)
          : Promise.resolve(0),
      ]);
      showToast(`Business "${newShop.name}" saved to Cloud & sent to Super Admin for approval!`);
    } catch (err) {
      console.error('Cloud registration write error:', err);
      showToast(`Business "${newShop.name}" saved locally (Cloud sync retry pending).`);
    }
  };

  // Renewal payment for expired/rejected business -> preserves all business data & restores after Admin approves
  const handleRenewSubscription = async (shopId: string, request: SubscriptionRequest) => {
    setSubscriptionRequests((prev) => [request, ...prev]);
    syncSubscriptionRequestToCloud(request).catch(console.error);
    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const updated: Shop = {
          ...s,
          subscriptionStatus: 'pending_approval',
          subscriptionPlanId: request.planId,
          subscriptionPlanName: request.planName,
          subscriptionFee: request.amount,
          subscriptionPaymentMethod: request.paymentMethod,
          subscriptionPaymentRef: request.paymentReference,
          subscriptionRejectionReason: undefined,
          subscriptionRequests: [request, ...(s.subscriptionRequests || [])],
        };
        syncShopToCloud(updated).catch(console.error);
        return updated;
      })
    );
    showToast('Monthly renewal submitted to Super Admin!');
  };

  // Super Admin actions
  const handleApproveShop = (shopId: string, requestId?: string) => {
    const nowIso = new Date().toISOString();
    const expiresIso = addDaysIso(30);

    setSubscriptionRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId || (r.shopId === shopId && r.status === 'pending')) {
          const updatedReq: SubscriptionRequest = { ...r, status: 'approved', reviewedAt: nowIso };
          syncSubscriptionRequestToCloud(updatedReq).catch(console.error);
          return updatedReq;
        }
        return r;
      })
    );

    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const updated: Shop = {
          ...s,
          subscriptionStatus: 'active',
          subscriptionStartDate: nowIso,
          subscriptionExpiresAt: expiresIso,
          subscriptionRejectionReason: undefined,
        };
        syncShopToCloud(updated).catch(console.error);
        return updated;
      })
    );
    showToast('Shop approved & synced to Cloud Firestore!');
  };

  const handleRejectShop = (shopId: string, reason: string, requestId?: string) => {
    const nowIso = new Date().toISOString();

    setSubscriptionRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId || (r.shopId === shopId && r.status === 'pending')) {
          const updatedReq: SubscriptionRequest = {
            ...r,
            status: 'rejected',
            reviewedAt: nowIso,
            rejectionReason: reason,
          };
          syncSubscriptionRequestToCloud(updatedReq).catch(console.error);
          return updatedReq;
        }
        return r;
      })
    );

    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const updated: Shop = {
          ...s,
          subscriptionStatus: 'rejected',
          subscriptionRejectionReason: reason,
        };
        syncShopToCloud(updated).catch(console.error);
        return updated;
      })
    );
    showToast('Shop rejected & updated in Cloud Firestore.');
  };

  const handleBlockShop = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const updated: Shop = { ...s, subscriptionStatus: 'blocked' };
        syncShopToCloud(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleUnblockShop = (shopId: string) => {
    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const expiredAlready =
          s.subscriptionExpiresAt && new Date(s.subscriptionExpiresAt).getTime() <= Date.now();
        const updated: Shop = {
          ...s,
          subscriptionStatus: expiredAlready ? 'expired' : 'active',
        };
        syncShopToCloud(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleExpireShop = (shopId: string) => {
    const expiredIso = new Date(Date.now() - 60000).toISOString();
    setShops((prev) =>
      prev.map((s) => {
        if (s.id !== shopId) return s;
        const updated: Shop = {
          ...s,
          subscriptionStatus: 'expired',
          subscriptionExpiresAt: expiredIso,
        };
        syncShopToCloud(updated).catch(console.error);
        return updated;
      })
    );
  };

  // Per-Business Owner Staff Management (Business Pro Only: Own Cashier + Optional Manager, scoped to activeShop.id)
  const handleAddStaff = (staffData: Omit<User, 'id' | 'createdAt'>) => {
    if (!entitlements.allowCustomStaff) {
      showToast('Custom Cashiers & Managers require Business Pro Monthly.');
      return;
    }

    if (
      registeredUsers.some(
        (u) => u.email.trim().toLowerCase() === staffData.email.trim().toLowerCase()
      )
    ) {
      showToast('A user with this email already exists.');
      return;
    }

    const newStaff: User = {
      ...staffData,
      id: `usr_${staffData.role}_${Date.now()}`,
      shopId: currentActiveShop.id,
      businessIds: [currentActiveShop.id],
      createdAt: new Date().toISOString(),
    };
    setRegisteredUsers((prev) => [...prev, newStaff]);
    syncSaasUserToCloud(newStaff).catch(console.error);
    showToast(`Added ${newStaff.role}: ${newStaff.name} for ${currentActiveShop.name}`);
  };

  const handleRemoveStaff = (userId: string) => {
    const target = registeredUsers.find((u) => u.id === userId);
    if (!target || target.role === 'owner') return;
    setRegisteredUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteSaasUserFromCloud(userId).catch(console.error);
    showToast(`Removed staff member: ${target.name}`);
  };

  const handleSignOutSaaS = () => {
    setIsAuthenticated(false);
    setIsSuperAdminAuthenticated(false);
    showToast('Signed out to SaaS Portal.');
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
          const updatedSale: Sale = {
            ...s,
            isRefunded: isFull,
            isPartiallyRefunded: !isFull,
            refundAmount: (s.refundAmount || 0) + payload.refundAmount,
            refundDetails: {
              id: `ref_${Date.now()}`,
              saleId: s.id,
              invoiceNumber: s.invoiceNumber,
              shopId: currentActiveShop.id,
              refundedAt: new Date().toISOString(),
              refundedBy: currentUser.name,
              refundAmount: payload.refundAmount,
              items: payload.itemsToRefund,
              reason: payload.reason,
              restockedToInventory: payload.restock,
            },
          };
          if (entitlements.allowCloudSync) {
            syncSaleToCloud(currentActiveShop.id, updatedSale).catch(console.error);
          }
          return updatedSale;
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
            const nextProd = { ...prod, stockQuantity: updatedStock };
            if (cloudConnected && entitlements.allowCloudSync) {
              recordCloudStockAdjustment(currentActiveShop.id, {
                id: `adj_${Date.now()}_${prod.id}`,
                shopId: currentActiveShop.id,
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
              syncProductToCloud(currentActiveShop.id, nextProd).catch(console.error);
            }
            return nextProd;
          }
          return prod;
        })
      );
    }

    showToast(
      `Refund of ${currentActiveShop.currency} ${payload.refundAmount.toLocaleString()} completed!${
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
            shopId: currentActiveShop.id,
            date: new Date().toISOString(),
            type: 'credit',
            amount,
            balanceAfter: newDue,
            paymentMethod: method,
            note: note || 'Customer balance repayment',
          };
          const updatedCustomer: Customer = {
            ...c,
            dueBalance: newDue,
            ledger: [newEntry, ...(c.ledger || [])],
          };
          if (entitlements.allowCloudSync) {
            syncCustomerToCloud(currentActiveShop.id, updatedCustomer).catch(console.error);
          }
          return updatedCustomer;
        }
        return c;
      })
    );
    showToast(`Payment of ${currentActiveShop.currency} ${amount.toLocaleString()} recorded in customer ledger!`);
  };

  // Phase 7: Add Customer (also returns created Customer for POS quick attach)
  const handleAddCustomer = (newCust: Omit<Customer, 'id'>): Customer => {
    const created: Customer = {
      ...newCust,
      shopId: newCust.shopId || currentActiveShop.id,
      id: `cust_${Date.now()}`,
    };
    setCustomers((prev) => [created, ...prev]);
    if (entitlements.allowCloudSync) {
      syncCustomerToCloud(created.shopId, created).catch(console.error);
    }
    showToast(`Customer ${created.name} registered successfully!`);
    return created;
  };

  // Phase 7: Supplier payout
  const handleRecordSupplierPayment = (
    supplierId: string,
    amount: number,
    method: 'cash' | 'bank_transfer' | 'cheque',
    note?: string
  ) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === supplierId) {
          const newBalance = Math.max(0, s.payableBalance - amount);
          const newPayment: SupplierPaymentRecord = {
            id: `spay_${Date.now()}`,
            supplierId: s.id,
            shopId: currentActiveShop.id,
            date: new Date().toISOString(),
            amount,
            method,
            note,
          };
          const updatedSupplier: Supplier = {
            ...s,
            payableBalance: newBalance,
            payments: [newPayment, ...(s.payments || [])],
          };
          if (entitlements.allowCloudSync) {
            syncSupplierToCloud(currentActiveShop.id, updatedSupplier).catch(console.error);
          }
          return updatedSupplier;
        }
        return s;
      })
    );
    showToast(`Supplier payout of ${currentActiveShop.currency} ${amount.toLocaleString()} recorded!`);
  };

  // Phase 7: Add Supplier
  const handleAddSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const created: Supplier = {
      ...newSup,
      id: `sup_${Date.now()}`,
    };
    setSuppliers((prev) => [created, ...prev]);
    if (entitlements.allowCloudSync) {
      syncSupplierToCloud(created.shopId || currentActiveShop.id, created).catch(console.error);
    }
    showToast(`Supplier ${created.name} added!`);
  };

  // Phase 7: Add Expense
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExp,
      id: `exp_${Date.now()}`,
    };
    setExpenses((prev) => [created, ...prev]);
    if (entitlements.allowCloudSync) {
      syncExpenseToCloud(created.shopId || currentActiveShop.id, created).catch(console.error);
    }
    showToast(`Expense of ${currentActiveShop.currency} ${created.amount.toLocaleString()} logged!`);
  };

  // 1. SUPER ADMIN DASHBOARD ROUTE
  if (isSuperAdminAuthenticated) {
    return (
      <FlutterMobileFrame onOpenCodeHub={() => {
        setIsSuperAdminAuthenticated(false);
        setIsAuthenticated(false);
      }}>
        <SuperAdminDashboard
          shops={shops}
          users={registeredUsers}
          subscriptionRequests={subscriptionRequests}
          onApproveShop={handleApproveShop}
          onRejectShop={handleRejectShop}
          onBlockShop={handleBlockShop}
          onUnblockShop={handleUnblockShop}
          onExpireShop={handleExpireShop}
          onRefreshCloud={handleRefreshCloudRegistry}
          onSignOut={() => setIsSuperAdminAuthenticated(false)}
        />
      </FlutterMobileFrame>
    );
  }

  // 2. UNAUTHENTICATED SAAS PORTAL ROUTE (Business Login, Register + Monthly Plan, Admin Login)
  if (!isAuthenticated) {
    return (
      <FlutterMobileFrame>
        <SaaSAuthPortal
          onLogin={handleSaaSLogin}
          onSuperAdminLogin={handleSuperAdminLogin}
          onRegister={handleSaaSRegister}
          onRenewSubscription={handleRenewSubscription}
          onRefreshCloud={handleRefreshCloudRegistry}
          existingShops={shops}
          existingUsers={registeredUsers}
          authNotice={authNotice}
        />
      </FlutterMobileFrame>
    );
  }

  // 3. AUTHENTICATED TENANT STORE WORKSPACE
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
                activeShop={currentActiveShop}
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
                    !entitlements.allowCloudSync
                      ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-amber-500/40'
                      : cloudConnected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                  title={entitlements.allowCloudSync ? 'Inspect SQLite offline mutation sync queue' : 'Local Only (Starter Monthly)'}
                >
                  {!entitlements.allowCloudSync ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : cloudConnected ? (
                    <Cloud className="w-3.5 h-3.5" />
                  ) : (
                    <CloudOff className="w-3.5 h-3.5" />
                  )}
                  {!entitlements.allowCloudSync
                    ? 'Local Only (Starter)'
                    : cloudConnected
                    ? 'Cloud Live (SQLite Sync)'
                    : 'Offline (Local SQLite)'}
                </button>

                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1.5">
                  <Barcode className="w-3.5 h-3.5" />
                  USB Scanner Ready
                </span>
              </div>
            </div>

            {/* Controls: Multi-Shop Switcher, Z-Report, User Profile & Mobile Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsZReportOpen(true)}
                className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer min-h-[36px]"
                title="Daily Closing Z-Report"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Z-Report</span>
              </button>

              {/* Multi-Shop Selector & Add Business (Multi-branch requires Business Pro Monthly) */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs max-w-[140px] sm:max-w-none">
                <Store className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <select
                  value={currentActiveShop.id}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      if (!entitlements.allowMultiBranch) {
                        showToast('Multi-Branch requires Business Pro Monthly.');
                        setIsAuthOpen(true);
                        return;
                      }
                      setEditingShop(undefined);
                      setIsOnboardingOpen(true);
                      return;
                    }
                    const shop = userShops.find((s) => s.id === e.target.value);
                    if (shop) {
                      setActiveShop(shop);
                      showToast(`Active Shop: ${shop.name}`);
                    }
                  }}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer truncate max-w-[105px] sm:max-w-[160px]"
                >
                  {userShops.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name} ({s.city})
                    </option>
                  ))}
                  {currentUser.role === 'owner' && entitlements.allowMultiBranch && (
                    <option value="__add_new__" className="bg-slate-900 text-emerald-400 font-bold">
                      + Add Branch...
                    </option>
                  )}
                </select>
              </div>

              {currentUser.role === 'owner' && (
                entitlements.allowMultiBranch ? (
                  <button
                    onClick={() => {
                      setEditingShop(undefined);
                      setIsOnboardingOpen(true);
                    }}
                    className="hidden sm:flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer min-h-[36px]"
                    title="Register Additional Business Branch"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>+ Branch</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Multi-Branch stores are disabled on Starter Monthly. Upgrade to Business Pro.');
                      setIsAuthOpen(true);
                    }}
                    className="hidden sm:flex items-center gap-1 bg-slate-800/80 border border-slate-700 text-slate-400 rounded-xl px-2.5 py-1.5 text-xs font-semibold cursor-pointer min-h-[36px]"
                    title="Multi-Branch requires Business Pro Monthly"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Branch (Pro)</span>
                  </button>
                )
              )}

              {/* User Session & Staff Button (Opens Auth Modal) */}
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

              <button
                onClick={handleSignOutSaaS}
                className="hidden lg:flex items-center gap-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
                title="Sign out to SaaS Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
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
                Inventory & Catalog ({currentShopProducts.length})
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
                Sales & Refunds ({currentShopSales.length})
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
                Customers & Khata ({currentShopCustomers.length})
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
                Suppliers ({currentShopSuppliers.length})
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
                Expenses ({currentShopExpenses.length})
              </button>

              <button
                onClick={() => setCurrentView('pnl')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  currentView === 'pnl'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {entitlements.allowProfitLoss ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                P&L & Margins
                {!entitlements.allowProfitLoss && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">PRO</span>
                )}
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
          {currentView === 'pos' && (
            <PosTerminal
              products={currentShopProducts}
              customers={currentShopCustomers}
              activeShop={currentActiveShop}
              currentUser={currentUser}
              scannedProductSignal={scannedProductSignal}
              onOpenScanner={() => setIsScannerOpen(true)}
              onAddCustomer={handleAddCustomer}
              onStartCheckout={handleStartCheckout}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              products={currentShopProducts}
              sales={currentShopSales}
              activeShop={currentActiveShop}
              currentUser={currentUser}
              onNavigateToPos={() => setCurrentView('pos')}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNavigateToInventory={() => setCurrentView('inventory')}
              onNavigateToHistory={() => setCurrentView('history')}
              onOpenOnboarding={() => {
                setEditingShop(currentActiveShop);
                setIsOnboardingOpen(true);
              }}
              onViewReceipt={(sale) => {
                setActiveReceiptSale(sale);
                setIsReceiptOpen(true);
              }}
              onOpenZReport={() => setIsZReportOpen(true)}
              onOpenUpgrade={() => setIsAuthOpen(true)}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryManagerView
              products={currentShopProducts}
              activeShop={currentActiveShop}
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
              onOpenUpgrade={() => setIsAuthOpen(true)}
            />
          )}

          {currentView === 'history' && (
            <SalesManagerView
              sales={currentShopSales}
              activeShop={currentActiveShop}
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

          {currentView === 'customers' && (
            <CustomerLedgerView
              customers={currentShopCustomers}
              activeShop={currentActiveShop}
              onSelectCustomer={(customer) => {
                setSelectedCustomerIdForLedger(customer.id);
                setIsCustomerLedgerOpen(true);
              }}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {currentView === 'suppliers' && (
            <SuppliersView
              suppliers={currentShopSuppliers}
              activeShop={currentActiveShop}
              onRecordSupplierPayment={handleRecordSupplierPayment}
              onAddSupplier={handleAddSupplier}
            />
          )}

          {currentView === 'expenses' && (
            <ExpenseTrackerView
              expenses={currentShopExpenses}
              activeShop={currentActiveShop}
              currentUser={currentUser}
              grossSalesRevenue={currentShopSales.reduce((sum, s) => sum + s.grandTotal, 0)}
              onAddExpense={handleAddExpense}
            />
          )}

          {currentView === 'pnl' && (
            <ProfitLossView
              sales={currentShopSales}
              expenses={currentShopExpenses}
              products={currentShopProducts}
              shop={currentActiveShop}
              currentUser={currentUser}
              onOpenUpgrade={() => setIsAuthOpen(true)}
            />
          )}

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
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

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

              <div className="py-4 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Store Operations
                </div>

                {[
                  { id: 'pos', name: 'Cashier POS Terminal', icon: ShoppingCart, count: null },
                  { id: 'dashboard', name: 'Store Dashboard', icon: LayoutDashboard, count: null },
                  { id: 'inventory', name: 'Inventory Catalog', icon: Package, count: currentShopProducts.length },
                  { id: 'history', name: 'Sales & Refunds', icon: History, count: currentShopSales.length },
                  { id: 'customers', name: 'Customers & Khata', icon: Users, count: currentShopCustomers.length },
                  { id: 'suppliers', name: 'Wholesale Suppliers', icon: Building2, count: currentShopSuppliers.length },
                  { id: 'expenses', name: 'Operating Expenses', icon: Receipt, count: currentShopExpenses.length },
                  {
                    id: 'pnl',
                    name: 'P&L & Margins',
                    icon: entitlements.allowProfitLoss ? TrendingUp : Lock,
                    count: entitlements.allowProfitLoss ? null : 'PRO',
                  },
                  { id: 'architecture', name: 'Flutter & Dart Code Hub', icon: Cpu, count: 'ZIP Ready' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id as typeof currentView);
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
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

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
                    setEditingShop(currentActiveShop);
                    setIsOnboardingOpen(true);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 hover:bg-indigo-900/40 cursor-pointer min-h-[44px]"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Store Setup Wizard</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    handleSignOutSaaS();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/40 cursor-pointer min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALS */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          products={currentShopProducts}
          shopCurrency={currentActiveShop.currency}
          onProductFound={handleProductFoundFromScan}
          onAddNewProduct={handleAddNewProductFromScan}
        />

        {activeCheckout && (
          <PaymentModal
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            grandTotal={activeCheckout.grandTotal}
            subtotal={activeCheckout.subtotal}
            discountTotal={activeCheckout.discountTotal}
            taxTotal={activeCheckout.taxTotal}
            deliveryCharge={0}
            shop={currentActiveShop}
            customer={activeCheckout.customer}
            cashierName={currentUser.name}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {activeReceiptSale && (
          <ReceiptModal
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            sale={activeReceiptSale}
            shop={currentActiveShop}
          />
        )}

        <OnboardingWizardModal
          isOpen={isOnboardingOpen}
          onClose={() => {
            setIsOnboardingOpen(false);
            setEditingShop(undefined);
          }}
          onSaveShop={handleSaveShop}
          existingShop={editingShop}
          currentOwnerName={currentUser.name}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          currentUser={currentUser}
          activeShop={currentActiveShop}
          userShops={userShops}
          staffUsers={registeredUsers}
          onSelectShop={(shop) => {
            setActiveShop(shop);
            showToast(`Active business: ${shop.name}`);
          }}
          onLoginUser={(user) => {
            setCurrentUser(user);
            showToast(`Switched shift to ${user.name} (${user.role.toUpperCase()})`);
          }}
          onAddStaff={handleAddStaff}
          onRemoveStaff={handleRemoveStaff}
          onTriggerOnboarding={() => {
            if (!entitlements.allowMultiBranch) {
              showToast('Multi-Branch requires Business Pro Monthly.');
              return;
            }
            setEditingShop(undefined);
            setIsOnboardingOpen(true);
          }}
          onUpgradeToPro={(shopId, req) => {
            handleRenewSubscription(shopId, req);
            setIsAuthenticated(false);
            setAuthNotice(
              `Upgrade to Business Pro Monthly submitted (Ref: ${req.paymentReference}). Once Super Admin approves, log back in to enjoy all Pro features!`
            );
          }}
          onSignOutSaaS={handleSignOutSaaS}
        />

        <StockAdjustmentModal
          isOpen={isStockAdjustmentOpen}
          onClose={() => setIsStockAdjustmentOpen(false)}
          product={selectedProductForAction}
          onConfirmAdjustment={handleConfirmStockAdjustment}
          currentUserName={currentUser.name}
        />

        <ProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          productToEdit={selectedProductForAction}
          shopId={currentActiveShop.id}
          shopCurrency={currentActiveShop.currency}
          products={currentShopProducts}
          onSaveProduct={handleSaveProductFromForm}
        />

        <RefundModal
          isOpen={isRefundModalOpen}
          onClose={() => {
            setIsRefundModalOpen(false);
            setSelectedSaleForRefund(null);
          }}
          sale={selectedSaleForRefund}
          shop={currentActiveShop}
          cashierName={currentUser.name}
          onConfirmRefund={handleConfirmRefund}
        />

        <CustomerLedgerModal
          isOpen={isCustomerLedgerOpen}
          onClose={() => {
            setIsCustomerLedgerOpen(false);
            setSelectedCustomerIdForLedger(null);
          }}
          customer={selectedCustomerForLedger}
          shop={currentActiveShop}
          onRecordPayment={handleRecordCustomerPayment}
        />

        <ZReportModal
          isOpen={isZReportOpen}
          onClose={() => setIsZReportOpen(false)}
          sales={currentShopSales}
          expenses={currentShopExpenses}
          shop={currentActiveShop}
          currentUser={currentUser}
        />

        <SyncQueueStatusModal
          isOpen={isSyncQueueModalOpen}
          onClose={() => setIsSyncQueueModalOpen(false)}
          shop={currentActiveShop}
          isCloudConnected={cloudConnected}
          onToggleCloudMode={() => {
            if (!entitlements.allowCloudSync) {
              showToast('Cloud Sync requires Business Pro Monthly.');
              return;
            }
            const next = !cloudConnected;
            setCloudConnected(next);
            showToast(next ? 'Cloud Online: Auto-sync active' : 'Offline Mode: Writing to Drift SQLite');
          }}
          onForceReplaySync={async () => {
            await handleSyncAllToCloud();
          }}
          onOpenUpgrade={() => setIsAuthOpen(true)}
        />
      </div>
    </FlutterMobileFrame>
  );
}
