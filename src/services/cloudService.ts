import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  serverTimestamp, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Sale, Shop } from '../types/pos';

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
 * Save / Update shop profile in Cloud Firestore
 */
export async function syncShopToCloud(shop: Shop): Promise<void> {
  const path = `shops/${shop.id}`;
  try {
    await setDoc(doc(db, 'shops', shop.id), {
      ...shop,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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
    await setDoc(doc(db, 'shops', shopId, 'products', product.id), {
      ...product,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Batch sync all products to Cloud Firestore
 */
export async function syncAllProductsToCloud(shopId: string, products: Product[]): Promise<number> {
  const path = `shops/${shopId}/products`;
  try {
    let synced = 0;
    for (const prod of products) {
      await setDoc(doc(db, 'shops', shopId, 'products', prod.id), {
        ...prod,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      synced++;
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
    await setDoc(doc(db, 'shops', shopId, 'inventory_transactions', adjustment.id), {
      ...adjustment,
      serverTime: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Sync a completed POS Sale to Cloud Firestore
 */
export async function syncSaleToCloud(shopId: string, sale: Sale): Promise<void> {
  const path = `shops/${shopId}/sales/${sale.id}`;
  try {
    await setDoc(doc(db, 'shops', shopId, 'sales', sale.id), {
      ...sale,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
