import { Shop, SubscriptionStatus } from '../types/pos';

export const SUPER_ADMIN_CREDENTIALS = {
  id: 'usr_super_admin',
  name: 'Platform Super Admin',
  email: 'admin@omnipos.pk',
  password: 'Admin@2026#',
  phone: '+92 300 0000001',
};

export interface SubscriptionPlanOption {
  id: string;
  name: string;
  pricePkr: number;
  durationDays: number;
  description: string;
  badge: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanOption[] = [
  {
    id: 'monthly_starter',
    name: 'Starter Monthly',
    pricePkr: 2500,
    durationDays: 30,
    description: '1 Store • POS, Inventory, Khata & Cross-Device Cloud Backup (No Multi-Branch or Staff)',
    badge: '30 Days',
  },
  {
    id: 'monthly_pro',
    name: 'Business Pro Monthly',
    pricePkr: 4900,
    durationDays: 30,
    description: 'Multi-Branch • Custom Cashiers & Managers, Expiry Alerts, P&L & Cloud Sync',
    badge: 'Popular • 30 Days',
  },
];

export interface ShopEntitlements {
  isPro: boolean;
  planId: string;
  planName: string;
  allowMultiBranch: boolean;
  allowCustomStaff: boolean;
  allowProfitLoss: boolean;
  allowExpiryAlerts: boolean;
  allowCloudSync: boolean;
}

export function isBusinessProPlan(shop?: Shop | null): boolean {
  if (!shop) return false;
  const id = (shop.subscriptionPlanId || '').toLowerCase();
  const name = (shop.subscriptionPlanName || '').toLowerCase();
  return id === 'monthly_pro' || id === 'pro_monthly' || name.includes('pro');
}

export function getShopEntitlements(shop?: Shop | null): ShopEntitlements {
  const isPro = isBusinessProPlan(shop);
  return {
    isPro,
    planId: shop?.subscriptionPlanId || (isPro ? 'monthly_pro' : 'monthly_starter'),
    planName: shop?.subscriptionPlanName || (isPro ? 'Business Pro Monthly' : 'Starter Monthly'),
    allowMultiBranch: isPro,
    allowCustomStaff: isPro,
    allowProfitLoss: isPro,
    allowExpiryAlerts: isPro,
    allowCloudSync: true,
  };
}

export const SUBSCRIPTION_PAYMENT_METHODS = [
  { id: 'JazzCash', label: 'JazzCash Merchant', account: '0300-8451920' },
  { id: 'Easypaisa', label: 'Easypaisa Business', account: '0345-8451920' },
  { id: 'Bank Transfer / Raast', label: 'Bank / Raast IBAN', account: 'PK36MEZN000123456789' },
  { id: 'Card', label: 'Debit / Credit Card', account: 'Online Gateway' },
];

export function getEffectiveSubscriptionStatus(shop?: Shop | null): SubscriptionStatus {
  if (!shop) return 'pending_approval';
  const rawStatus = shop.subscriptionStatus || 'active';

  if (rawStatus === 'blocked' || rawStatus === 'rejected' || rawStatus === 'pending_approval') {
    return rawStatus;
  }

  if (rawStatus === 'expired') {
    return 'expired';
  }

  if (shop.subscriptionExpiresAt) {
    const expTime = new Date(shop.subscriptionExpiresAt).getTime();
    if (!Number.isNaN(expTime) && Date.now() >= expTime) {
      return 'expired';
    }
  }

  return 'active';
}

export function getRemainingSubscriptionDays(shop?: Shop | null): number {
  if (!shop?.subscriptionExpiresAt) return 0;
  const diffMs = new Date(shop.subscriptionExpiresAt).getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function addDaysIso(days: number, fromDate = new Date()): string {
  return new Date(fromDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}
