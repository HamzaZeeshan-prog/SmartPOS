export type UserRole = 'owner' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
}

export interface Shop {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  category: string;
  address: string;
  city: string;
  currency: string; // 'PKR'
  taxEnabled: boolean;
  defaultTaxRate: number; // e.g. 5%
  receiptMessage: string;
  logoUrl?: string;
  allowNegativeStock: boolean;
  thermalPrinterWidth: '58mm' | '80mm';
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g. "500ml", "1kg", "Large"
  barcode?: string;
  additionalCost: number;
  additionalPrice: number;
  stock: number;
}

export interface Product {
  id: string;
  shopId: string;
  barcode: string;
  qrCode?: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  image?: string;
  costPrice: number;
  sellingPrice: number;
  discountPrice?: number;
  taxPercentage: number;
  stockQuantity: number;
  minimumStockLimit: number;
  unit: 'piece' | 'packet' | 'box' | 'kg' | 'gram' | 'litre';
  supplierId?: string;
  supplierName?: string;
  expiryDate?: string;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  itemDiscount: number; // in PKR
  itemTaxRate: number;
  note?: string;
}

export type PaymentMethod = 
  | 'cash' 
  | 'card' 
  | 'jazzcash' 
  | 'easypaisa' 
  | 'bank_qr' 
  | 'customer_credit' 
  | 'split';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentRecord {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  provider?: string;
  referenceNumber?: string;
  qrPayload?: string;
  cashReceived?: number;
  changeReturned?: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  shopId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  deliveryCharge: number;
  grandTotal: number;
  payments: PaymentRecord[];
  paymentStatus: PaymentStatus;
  createdAt: string;
  note?: string;
  isRefunded?: boolean;
  isPartiallyRefunded?: boolean;
  refundAmount?: number;
  refundDetails?: RefundRecord;
}

export interface RefundItem {
  cartItemId: string;
  productId: string;
  productName: string;
  quantityRefunded: number;
  unitPrice: number;
  totalRefundAmount: number;
}

export interface RefundRecord {
  id: string;
  saleId: string;
  invoiceNumber: string;
  shopId: string;
  refundedAt: string;
  refundedBy: string;
  refundAmount: number;
  items: RefundItem[];
  reason: string;
  restockedToInventory: boolean;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  shopId: string;
  date: string;
  type: 'debit' | 'credit'; // debit = credit sale (increases balance), credit = repayment (reduces balance)
  amount: number;
  balanceAfter: number;
  referenceInvoice?: string;
  paymentMethod?: string;
  note?: string;
}

export interface Customer {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  dueBalance: number;
  totalPurchases: number;
  notes?: string;
  ledger?: CustomerLedgerEntry[];
}

export interface SupplierPaymentRecord {
  id: string;
  supplierId: string;
  shopId: string;
  date: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'cheque';
  reference?: string;
  note?: string;
}

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  payableBalance: number;
  notes?: string;
  payments?: SupplierPaymentRecord[];
}

export interface Expense {
  id: string;
  shopId: string;
  amount: number;
  date: string;
  category: 'Rent' | 'Electricity' | 'Internet' | 'Transport' | 'Salaries' | 'Maintenance' | 'Miscellaneous';
  description: string;
  receiptImage?: string;
  createdBy: string;
}

export interface SyncQueueItem {
  id: string;
  shopId: string;
  entityType: 'sale' | 'product' | 'customer' | 'expense' | 'inventory_transaction';
  entityId: string;
  action: 'insert' | 'update' | 'delete';
  payloadJson: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  errorMessage?: string;
}

export interface ZReportData {
  reportId: string;
  shopId: string;
  generatedAt: string;
  generatedBy: string;
  openingCash: number;
  grossSales: number;
  refundsTotal: number;
  netSales: number;
  taxCollected: number;
  totalOrders: number;
  paymentBreakdown: { [method: string]: number };
  expensesPaidFromDrawer: number;
  expectedCashInDrawer: number;
  actualCountedCash?: number;
  cashDifference?: number;
}

