import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Customer,
  Expense,
  Product,
  Sale,
  Shop,
  SubscriptionRequest,
  SubscriptionStatus,
  Supplier,
  User,
  UserRole,
} from '../types/pos';

export interface StockAdjustmentRecord {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  previousQuantity: number;
  changeQuantity: number;
  newQuantity: number;
  type: 'stock_in' | 'stock_out' | 'adjustment' | 'damage' | 'return';
  reason: string;
  performedBy: string;
  createdAt: string;
}

/**
 * Recursively remove `undefined` values & non-finite numbers so Firestore `setDoc` never rejects payloads
 */
export function sanitizeForFirestore<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'number') {
    return (Number.isFinite(input) ? input : 0) as unknown as T;
  }
  if (typeof input !== 'object') {
    return input;
  }
  if (Array.isArray(input)) {
    return input
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  // Preserve Firestore FieldValue sentinels (e.g. serverTimestamp)
  const proto = Object.getPrototypeOf(input);
  if (proto !== null && proto !== Object.prototype) {
    return input;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = sanitizeForFirestore(v);
    }
  }
  return out as T;
}

function normalizeUserRole(raw: unknown): UserRole {
  const s = String(raw || 'cashier').toLowerCase().replace(/_/g, '');
  if (s === 'superadmin') return 'super_admin';
  if (s === 'owner') return 'owner';
  if (s === 'manager') return 'manager';
  return 'cashier';
}

function normalizeSubscriptionStatus(raw: unknown): SubscriptionStatus {
  const s = String(raw || 'active').toLowerCase().replace(/_/g, '');
  if (s === 'pendingapproval') return 'pending_approval';
  if (s === 'expired') return 'expired';
  if (s === 'rejected') return 'rejected';
  if (s === 'blocked') return 'blocked';
  return 'active';
}

export function normalizeCloudUser(raw: Record<string, unknown>): User {
  return {
    ...(raw as unknown as User),
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    email: String(raw.email || ''),
    role: normalizeUserRole(raw.role),
    phone: String(raw.phone || ''),
    businessIds: Array.isArray(raw.businessIds) ? raw.businessIds.map(String) : undefined,
  };
}

export function normalizeCloudShop(raw: Record<string, unknown>): Shop {
  const widthRaw = String(raw.thermalPrinterWidth || '80mm').toLowerCase();
  return {
    ...(raw as unknown as Shop),
    id: String(raw.id || ''),
    name: String(raw.name || ''),
    ownerName: String(raw.ownerName || ''),
    phone: String(raw.phone || ''),
    category: String(raw.category || 'General Retail'),
    address: String(raw.address || ''),
    city: String(raw.city || 'Mianwali'),
    currency: String(raw.currency || 'PKR'),
    taxEnabled: Boolean(raw.taxEnabled ?? true),
    defaultTaxRate: Number(raw.defaultTaxRate ?? 5),
    discountEnabled: Boolean(raw.discountEnabled ?? false),
    defaultDiscountRate: Number(raw.defaultDiscountRate ?? 0),
    receiptMessage: String(raw.receiptMessage || 'Thank you for shopping with us!'),
    allowNegativeStock: Boolean(raw.allowNegativeStock ?? false),
    thermalPrinterWidth: widthRaw === '58mm' || widthRaw === 'mm58' ? '58mm' : '80mm',
    subscriptionStatus: normalizeSubscriptionStatus(raw.subscriptionStatus),
    subscriptionStartDate:
      (raw.subscriptionStartDate as string | undefined) ||
      (raw.subscriptionStartedAt as string | undefined),
  };
}

export function normalizeCloudSubscriptionRequest(raw: Record<string, unknown>): SubscriptionRequest {
  const statusRaw = String(raw.status || 'pending').toLowerCase();
  const status: SubscriptionRequest['status'] =
    statusRaw === 'approved' ? 'approved' : statusRaw === 'rejected' ? 'rejected' : 'pending';
  return {
    ...(raw as unknown as SubscriptionRequest),
    id: String(raw.id || ''),
    shopId: String(raw.shopId || ''),
    shopName: String(raw.shopName || ''),
    ownerName: String(raw.ownerName || ''),
    ownerEmail: String(raw.ownerEmail || ''),
    ownerPhone: String(raw.ownerPhone || ''),
    planId: String(raw.planId || 'monthly_starter'),
    planName: String(raw.planName || 'Starter Monthly'),
    amount: Number(raw.amount ?? 2500),
    currency: String(raw.currency || 'PKR'),
    paymentMethod: String(raw.paymentMethod || 'JazzCash'),
    paymentReference: String(raw.paymentReference || ''),
    status,
    requestedAt: String(raw.requestedAt || new Date().toISOString()),
    rejectionReason: (raw.rejectionReason ?? raw.adminNote) as string | undefined,
  };
}

function normalizePaymentMethod(raw: unknown): Sale['payments'][number]['method'] {
  const s = String(raw || 'cash').toLowerCase().replace(/_/g, '');
  if (s === 'jazzcash') return 'jazzcash';
  if (s === 'easypaisa') return 'easypaisa';
  if (s === 'bankqr') return 'bank_qr';
  if (s === 'card') return 'card';
  if (s === 'customercredit') return 'customer_credit';
  if (s === 'split') return 'split';
  return 'cash';
}

function normalizePaymentStatus(raw: unknown): Sale['paymentStatus'] {
  const s = String(raw || 'paid').toLowerCase().replace(/_/g, '');
  if (s === 'pending' || s === 'partiallypaid') return 'pending';
  if (s === 'cancelled') return 'cancelled';
  if (s === 'refunded') return 'refunded';
  if (s === 'failed') return 'failed';
  return 'paid';
}

export function normalizeCloudSale(raw: Record<string, unknown>): Sale {
  const paymentsRaw = Array.isArray(raw.payments) ? raw.payments : [];
  return {
    ...(raw as unknown as Sale),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus),
    payments: paymentsRaw.map((p) => {
      const pm = (p || {}) as Record<string, unknown>;
      return {
        ...(pm as unknown as Sale['payments'][number]),
        method: normalizePaymentMethod(pm.method),
        status: normalizePaymentStatus(pm.status),
      };
    }),
  };
}

/**
 * Save / Update SaaS user (Owner, Manager, or Cashier) in Cloud Firestore
 */
export async function syncSaasUserToCloud(user: User): Promise<void> {
  const path = `saas_users/${user.id}`;
  try {
    await setDoc(
      doc(db, 'saas_users', user.id),
      sanitizeForFirestore({
        ...user,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete SaaS staff user from Cloud Firestore
 */
export async function deleteSaasUserFromCloud(userId: string): Promise<void> {
  const path = `saas_users/${userId}`;
  try {
    await deleteDoc(doc(db, 'saas_users', userId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Save / Update Monthly Subscription Request in Cloud Firestore for cross-device Super Admin Console
 */
export async function syncSubscriptionRequestToCloud(request: SubscriptionRequest): Promise<void> {
  const path = `subscription_requests/${request.id}`;
  try {
    await setDoc(
      doc(db, 'subscription_requests', request.id),
      sanitizeForFirestore({
        ...request,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Save / Update shop profile in Cloud Firestore
 */
export async function syncShopToCloud(shop: Shop): Promise<void> {
  const path = `shops/${shop.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shop.id),
      sanitizeForFirestore({
        ...shop,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync single product to Cloud Firestore
 */
export async function syncProductToCloud(shopId: string, product: Product): Promise<void> {
  const path = `shops/${shopId}/products/${product.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId, 'products', product.id),
      sanitizeForFirestore({
        ...product,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete product from Cloud Firestore
 */
export async function deleteProductFromCloud(shopId: string, productId: string): Promise<void> {
  const path = `shops/${shopId}/products/${productId}`;
  try {
    await deleteDoc(doc(db, 'shops', shopId, 'products', productId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Batch sync all products to Cloud Firestore
 */
export async function syncAllProductsToCloud(shopId: string, products: Product[]): Promise<number> {
  const path = `shops/${shopId}/products`;
  if (products.length === 0) return 0;
  try {
    let synced = 0;
    const chunkSize = 400;
    for (let i = 0; i < products.length; i += chunkSize) {
      const batch = writeBatch(db);
      const slice = products.slice(i, i + chunkSize);
      const nowIso = new Date().toISOString();
      for (const prod of slice) {
        const ref = doc(db, 'shops', shopId, 'products', prod.id);
        batch.set(
          ref,
          sanitizeForFirestore({
            ...prod,
            updatedAt: nowIso,
          }),
          { merge: true }
        );
        synced++;
      }
      await batch.commit();
    }
    return synced;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return 0;
  }
}

/**
 * Fetch products from Cloud Firestore
 */
export async function fetchProductsFromCloud(shopId: string): Promise<Product[]> {
  const path = `shops/${shopId}/products`;
  try {
    const q = collection(db, 'shops', shopId, 'products');
    const snapshot = await getDocs(q);
    const items: Product[] = [];
    snapshot.forEach((d) => {
      items.push(d.data() as Product);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

/**
 * Record stock adjustment in Cloud Firestore
 */
export async function recordCloudStockAdjustment(
  shopId: string,
  adjustment: StockAdjustmentRecord
): Promise<void> {
  const path = `shops/${shopId}/inventory_transactions/${adjustment.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId, 'inventory_transactions', adjustment.id),
      {
        ...sanitizeForFirestore(adjustment),
        serverTime: serverTimestamp(),
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync a completed or refunded POS Sale to Cloud Firestore
 */
export async function syncSaleToCloud(shopId: string, sale: Sale): Promise<void> {
  const path = `shops/${shopId}/sales/${sale.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId, 'sales', sale.id),
      sanitizeForFirestore({
        ...sale,
        syncedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync Customer & Khata Ledger to Cloud Firestore
 */
export async function syncCustomerToCloud(shopId: string, customer: Customer): Promise<void> {
  const path = `shops/${shopId}/customers/${customer.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId, 'customers', customer.id),
      sanitizeForFirestore({
        ...customer,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync Supplier & Payable Ledger to Cloud Firestore
 */
export async function syncSupplierToCloud(shopId: string, supplier: Supplier): Promise<void> {
  const path = `shops/${shopId}/suppliers/${supplier.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId, 'suppliers', supplier.id),
      sanitizeForFirestore({
        ...supplier,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync Operating Expense to Cloud Firestore
 */
export async function syncExpenseToCloud(shopId: string, expense: Expense): Promise<void> {
  const path = `shops/${shopId}/expenses/${expense.id}`;
  try {
    await setDoc(
      doc(db, 'shops', shopId, 'expenses', expense.id),
      sanitizeForFirestore({
        ...expense,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Fetch SaaS users, registered shops & subscription requests from Cloud Firestore
 */
export async function fetchSaasRegistryFromCloud(): Promise<{
  users: User[];
  shops: Shop[];
  requests: SubscriptionRequest[];
}> {
  const users: User[] = [];
  const shops: Shop[] = [];
  const requests: SubscriptionRequest[] = [];
  try {
    const [usersSnap, shopsSnap, reqSnap] = await Promise.all([
      getDocs(collection(db, 'saas_users')),
      getDocs(collection(db, 'shops')),
      getDocs(collection(db, 'subscription_requests')),
    ]);
    usersSnap.forEach((d) => users.push(normalizeCloudUser(d.data() as Record<string, unknown>)));
    shopsSnap.forEach((d) => shops.push(normalizeCloudShop(d.data() as Record<string, unknown>)));
    reqSnap.forEach((d) =>
      requests.push(normalizeCloudSubscriptionRequest(d.data() as Record<string, unknown>))
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'saas_registry');
  }
  return { users, shops, requests };
}

/**
 * Real-time cross-device subscription to SaaS Users, Shops & Subscription Requests
 */
export function subscribeToSaasRegistry(callbacks: {
  onUsers: (users: User[]) => void;
  onShops: (shops: Shop[]) => void;
  onRequests: (requests: SubscriptionRequest[]) => void;
}): Unsubscribe {
  const unsubUsers = onSnapshot(
    collection(db, 'saas_users'),
    (snap) => {
      const list: User[] = [];
      snap.forEach((d) => list.push(normalizeCloudUser(d.data() as Record<string, unknown>)));
      if (list.length > 0) callbacks.onUsers(list);
    },
    (err) => {
      console.warn('Firestore saas_users listener error:', err);
    }
  );

  const unsubShops = onSnapshot(
    collection(db, 'shops'),
    (snap) => {
      const list: Shop[] = [];
      snap.forEach((d) => list.push(normalizeCloudShop(d.data() as Record<string, unknown>)));
      if (list.length > 0) callbacks.onShops(list);
    },
    (err) => {
      console.warn('Firestore shops listener error:', err);
    }
  );

  const unsubReqs = onSnapshot(
    collection(db, 'subscription_requests'),
    (snap) => {
      const list: SubscriptionRequest[] = [];
      snap.forEach((d) =>
        list.push(normalizeCloudSubscriptionRequest(d.data() as Record<string, unknown>))
      );
      if (list.length > 0) callbacks.onRequests(list);
    },
    (err) => {
      console.warn('Firestore subscription_requests listener error:', err);
    }
  );

  return () => {
    unsubUsers();
    unsubShops();
    unsubReqs();
  };
}

/**
 * Hydrate a shop's operational records (products, customers, suppliers, expenses, sales) from Cloud Firestore
 */
export async function fetchShopOperationalDataFromCloud(shopId: string): Promise<{
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  sales: Sale[];
}> {
  const products: Product[] = [];
  const customers: Customer[] = [];
  const suppliers: Supplier[] = [];
  const expenses: Expense[] = [];
  const sales: Sale[] = [];

  try {
    const [pSnap, cSnap, sSnap, eSnap, saleSnap] = await Promise.all([
      getDocs(collection(db, 'shops', shopId, 'products')),
      getDocs(collection(db, 'shops', shopId, 'customers')),
      getDocs(collection(db, 'shops', shopId, 'suppliers')),
      getDocs(collection(db, 'shops', shopId, 'expenses')),
      getDocs(collection(db, 'shops', shopId, 'sales')),
    ]);
    pSnap.forEach((d) => products.push(d.data() as Product));
    cSnap.forEach((d) => customers.push(d.data() as Customer));
    sSnap.forEach((d) => suppliers.push(d.data() as Supplier));
    eSnap.forEach((d) => expenses.push(d.data() as Expense));
    saleSnap.forEach((d) => sales.push(normalizeCloudSale(d.data() as Record<string, unknown>)));
  } catch (err) {
    console.warn('Cloud shop operational fetch skipped:', err);
  }

  return { products, customers, suppliers, expenses, sales };
}

/**
 * Real-time cross-device subscription to active shop operational subcollections
 */
export function subscribeToShopOperationalData(
  shopId: string,
  callbacks: {
    onProducts: (items: Product[]) => void;
    onCustomers: (items: Customer[]) => void;
    onSuppliers: (items: Supplier[]) => void;
    onExpenses: (items: Expense[]) => void;
    onSales: (items: Sale[]) => void;
  }
): Unsubscribe {
  const unsubProducts = onSnapshot(
    collection(db, 'shops', shopId, 'products'),
    (snap) => {
      const list: Product[] = [];
      snap.forEach((d) => list.push(d.data() as Product));
      if (list.length > 0) callbacks.onProducts(list);
    },
    (err) => console.warn('Firestore products listener error:', err)
  );

  const unsubCustomers = onSnapshot(
    collection(db, 'shops', shopId, 'customers'),
    (snap) => {
      const list: Customer[] = [];
      snap.forEach((d) => list.push(d.data() as Customer));
      if (list.length > 0) callbacks.onCustomers(list);
    },
    (err) => console.warn('Firestore customers listener error:', err)
  );

  const unsubSuppliers = onSnapshot(
    collection(db, 'shops', shopId, 'suppliers'),
    (snap) => {
      const list: Supplier[] = [];
      snap.forEach((d) => list.push(d.data() as Supplier));
      if (list.length > 0) callbacks.onSuppliers(list);
    },
    (err) => console.warn('Firestore suppliers listener error:', err)
  );

  const unsubExpenses = onSnapshot(
    collection(db, 'shops', shopId, 'expenses'),
    (snap) => {
      const list: Expense[] = [];
      snap.forEach((d) => list.push(d.data() as Expense));
      if (list.length > 0) callbacks.onExpenses(list);
    },
    (err) => console.warn('Firestore expenses listener error:', err)
  );

  const unsubSales = onSnapshot(
    collection(db, 'shops', shopId, 'sales'),
    (snap) => {
      const list: Sale[] = [];
      snap.forEach((d) => list.push(normalizeCloudSale(d.data() as Record<string, unknown>)));
      if (list.length > 0) callbacks.onSales(list);
    },
    (err) => console.warn('Firestore sales listener error:', err)
  );

  return () => {
    unsubProducts();
    unsubCustomers();
    unsubSuppliers();
    unsubExpenses();
    unsubSales();
  };
}
