import '../models/models.dart';

class SubscriptionPlanOption {
  final String id;
  final String name;
  final double pricePkr;
  final int durationDays;
  final String badge;
  final String description;

  const SubscriptionPlanOption({
    required this.id,
    required this.name,
    required this.pricePkr,
    required this.durationDays,
    required this.badge,
    required this.description,
  });
}

class SaasPaymentMethod {
  final String id;
  final String label;
  final String account;

  const SaasPaymentMethod({
    required this.id,
    required this.label,
    required this.account,
  });
}

class ShopEntitlements {
  final bool isPro;
  final String planId;
  final String planName;
  final bool allowMultiBranch;
  final bool allowCustomStaff;
  final bool allowProfitLoss;
  final bool allowExpiryAlerts;
  final bool allowCloudSync;

  const ShopEntitlements({
    required this.isPro,
    required this.planId,
    required this.planName,
    required this.allowMultiBranch,
    required this.allowCustomStaff,
    required this.allowProfitLoss,
    required this.allowExpiryAlerts,
    required this.allowCloudSync,
  });
}

class SaasConfig {
  // Hardcoded Platform Super Admin Credentials
  static const String superAdminEmail = 'admin@omnipos.pk';
  static const String superAdminPassword = 'Admin@2026#';
  static const String superAdminName = 'Platform Super Admin';

  static const int defaultSubscriptionDays = 30;

  static const List<SubscriptionPlanOption> plans = [
    SubscriptionPlanOption(
      id: 'starter_monthly',
      name: 'Starter Monthly',
      pricePkr: 2500,
      durationDays: 30,
      badge: '1 Month',
      description: '1 Storefront, POS, Inventory, Khata, PDF Receipts & Cloud Backup (No Multi-Branch/Staff)',
    ),
    SubscriptionPlanOption(
      id: 'pro_monthly',
      name: 'Business Pro Monthly',
      pricePkr: 4900,
      durationDays: 30,
      badge: 'Popular • 1 Month',
      description: 'Multi-Branch, Custom Cashiers & Managers, Expiry Alerts, Cloud Sync & P&L',
    ),
  ];

  static bool isBusinessPro(Shop shop) {
    final id = (shop.subscriptionPlanId ?? '').toLowerCase();
    final name = (shop.subscriptionPlanName ?? '').toLowerCase();
    return id == 'pro_monthly' || id == 'monthly_pro' || name.contains('pro');
  }

  static ShopEntitlements getEntitlements(Shop shop) {
    final isPro = isBusinessPro(shop);
    return ShopEntitlements(
      isPro: isPro,
      planId: shop.subscriptionPlanId ?? (isPro ? 'pro_monthly' : 'starter_monthly'),
      planName: shop.subscriptionPlanName ?? (isPro ? 'Business Pro Monthly' : 'Starter Monthly'),
      allowMultiBranch: isPro,
      allowCustomStaff: isPro,
      allowProfitLoss: isPro,
      allowExpiryAlerts: isPro,
      allowCloudSync: true,
    );
  }

  static const List<SaasPaymentMethod> paymentMethods = [
    SaasPaymentMethod(id: 'JazzCash', label: 'JazzCash Merchant', account: '0300-8899112 (OmniPOS)'),
    SaasPaymentMethod(id: 'Easypaisa', label: 'Easypaisa Business', account: '0345-8899112 (OmniPOS)'),
    SaasPaymentMethod(id: 'Bank Transfer', label: 'Meezan Bank / IBFT', account: 'PK42MEZN00028101048921'),
    SaasPaymentMethod(id: 'Card / Online', label: 'Debit / Credit Card', account: 'Instant Gateway'),
  ];

  static SubscriptionStatus getEffectiveStatus(Shop shop) {
    if (shop.subscriptionStatus == SubscriptionStatus.blocked) {
      return SubscriptionStatus.blocked;
    }
    if (shop.subscriptionStatus == SubscriptionStatus.rejected) {
      return SubscriptionStatus.rejected;
    }
    if (shop.subscriptionStatus == SubscriptionStatus.pendingApproval) {
      return SubscriptionStatus.pendingApproval;
    }
    if (shop.subscriptionStatus == SubscriptionStatus.expired) {
      return SubscriptionStatus.expired;
    }
    if (shop.subscriptionExpiresAt != null && shop.subscriptionExpiresAt!.isNotEmpty) {
      final exp = DateTime.tryParse(shop.subscriptionExpiresAt!);
      if (exp != null && DateTime.now().isAfter(exp)) {
        return SubscriptionStatus.expired;
      }
    }
    return SubscriptionStatus.active;
  }

  static int getRemainingDays(Shop shop) {
    if (shop.subscriptionExpiresAt == null || shop.subscriptionExpiresAt!.isEmpty) {
      return defaultSubscriptionDays;
    }
    final exp = DateTime.tryParse(shop.subscriptionExpiresAt!);
    if (exp == null) return 0;
    final diff = exp.difference(DateTime.now()).inDays;
    return diff < 0 ? 0 : diff + 1;
  }

  static String addDaysIso(int days, [DateTime? from]) {
    final base = from ?? DateTime.now();
    return base.add(Duration(days: days)).toIso8601String();
  }
}
