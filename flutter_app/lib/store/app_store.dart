import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../data/demo_data.dart';
import '../data/saas_config.dart';
import '../data/starter_catalog.dart';
import '../services/cloud_service.dart';
import '../services/local_storage_service.dart';

enum SaaSLoginOutcome {
  success,
  superAdmin,
  pendingApproval,
  expired,
  rejected,
  blocked,
  invalidCredentials,
}

class SaaSLoginResult {
  final SaaSLoginOutcome outcome;
  final Shop? shop;
  final String? message;

  const SaaSLoginResult({
    required this.outcome,
    this.shop,
    this.message,
  });
}

class AppStore extends ChangeNotifier {
  // Initialization flag while restoring saved local state
  bool isRestoring = true;

  // SaaS Authentication & Admin Session (restores persisted active session across restarts)
  bool isAuthenticated = false;
  bool isSuperAdmin = false;
  String? authNotice;

  User currentUser = DemoData.users[0];
  List<User> registeredUsers = List.from(DemoData.users);
  List<SubscriptionRequest> subscriptionRequests = [];

  // Multi-tenant Data Stores
  List<Shop> allShops = List.from(DemoData.shops);
  Shop activeShop = DemoData.shops[0];

  List<Product> allProducts = List.from(DemoData.products);
  List<Customer> allCustomers = List.from(DemoData.customers);
  List<Supplier> allSuppliers = List.from(DemoData.suppliers);
  List<Expense> allExpenses = List.from(DemoData.expenses);
  List<Sale> allSales = List.from(DemoData.pastSales);
  List<HeldSale> allHeldSales = [];
  List<SyncQueueItem> syncQueue = [
    SyncQueueItem(
      id: 'sync_001',
      shopId: 'shop_001',
      entityType: 'sale',
      entityId: 'INV-20261024-001',
      action: 'insert',
      payloadSummary: 'POS Bill INV-20261024-001 (PKR 1,197)',
      createdAt: '2026-10-24T07:15:00Z',
      status: 'synced',
    ),
    SyncQueueItem(
      id: 'sync_002',
      shopId: 'shop_001',
      entityType: 'inventory_transaction',
      entityId: 'adj_prod_001',
      action: 'update',
      payloadSummary: 'Rooh Afza Syrup stock verification (48 pcs)',
      createdAt: '2026-10-24T08:00:00Z',
      status: 'synced',
    ),
  ];

  Timer? _subscriptionGuardTimer;
  final List<StreamSubscription> _registrySubs = [];
  final List<StreamSubscription> _shopOpsSubs = [];
  String? _listeningOpsShopId;

  // Sound & HUD Settings
  bool soundEnabled = true;

  // Cloud Sync
  bool cloudConnected = false;
  bool isSyncingCloud = false;
  int? lastSyncCount;

  String? toastMessage;

  AppStore() {
    _startSubscriptionGuard();
  }

  List<T> _mergeLists<T>(List<T> primary, List<T> secondary, String Function(T) getId) {
    final map = <String, T>{};
    for (final item in secondary) {
      final id = getId(item);
      if (id.isNotEmpty) map[id] = item;
    }
    for (final item in primary) {
      final id = getId(item);
      if (id.isNotEmpty) map[id] = item;
    }
    return map.values.toList();
  }

  List<T> _decodeList<T>(
    dynamic rawList,
    T Function(Map<String, dynamic>) fromJson,
    List<T> fallback,
  ) {
    if (rawList is! List) return List.from(fallback);
    final items = <T>[];
    for (final item in rawList) {
      if (item is Map) {
        try {
          items.add(fromJson(Map<String, dynamic>.from(item)));
        } catch (_) {
          // Skip malformed record without losing the rest of saved business data
        }
      }
    }
    return items;
  }

  Future<void> initialize() async {
    try {
      final saved = await LocalStorageService.loadState();
      if (saved != null) {
        if (saved['registeredUsers'] is List) {
          final parsedUsers = _decodeList(saved['registeredUsers'], User.fromJson, DemoData.users);
          if (parsedUsers.isNotEmpty) registeredUsers = parsedUsers;
        }
        if (saved['allShops'] is List) {
          final parsedShops = _decodeList(saved['allShops'], Shop.fromJson, DemoData.shops);
          if (parsedShops.isNotEmpty) allShops = parsedShops;
        }
        if (saved['subscriptionRequests'] is List) {
          subscriptionRequests = _decodeList(saved['subscriptionRequests'], SubscriptionRequest.fromJson, []);
        }
        if (saved['allProducts'] is List) {
          allProducts = _decodeList(saved['allProducts'], Product.fromJson, DemoData.products);
        }
        if (saved['allCustomers'] is List) {
          allCustomers = _decodeList(saved['allCustomers'], Customer.fromJson, DemoData.customers);
        }
        if (saved['allSuppliers'] is List) {
          allSuppliers = _decodeList(saved['allSuppliers'], Supplier.fromJson, DemoData.suppliers);
        }
        if (saved['allExpenses'] is List) {
          allExpenses = _decodeList(saved['allExpenses'], Expense.fromJson, DemoData.expenses);
        }
        if (saved['allSales'] is List) {
          allSales = _decodeList(saved['allSales'], Sale.fromJson, DemoData.pastSales);
        }
        if (saved['allHeldSales'] is List) {
          allHeldSales = _decodeList(saved['allHeldSales'], HeldSale.fromJson, []);
        }
        if (saved['syncQueue'] is List) {
          syncQueue = _decodeList(saved['syncQueue'], SyncQueueItem.fromJson, syncQueue);
        }
        if (saved['soundEnabled'] is bool) {
          soundEnabled = saved['soundEnabled'] as bool;
        }

        final savedShopId = saved['activeShopId']?.toString();
        if (savedShopId != null && savedShopId.isNotEmpty) {
          activeShop = allShops.firstWhere(
            (s) => s.id == savedShopId,
            orElse: () => allShops.first,
          );
        } else if (allShops.isNotEmpty) {
          activeShop = allShops.first;
        }

        final savedUserId = saved['currentUserId']?.toString();
        if (savedUserId != null && savedUserId.isNotEmpty) {
          currentUser = registeredUsers.firstWhere(
            (u) => u.id == savedUserId,
            orElse: () => registeredUsers.first,
          );
        } else if (registeredUsers.isNotEmpty) {
          currentUser = registeredUsers.first;
        }

        isSuperAdmin = saved['isSuperAdmin'] == true;
        final savedAuth = saved['isAuthenticated'] == true;

        if (!isSuperAdmin && savedAuth) {
          final effStatus = SaasConfig.getEffectiveStatus(activeShop);
          if (effStatus == SubscriptionStatus.active) {
            isAuthenticated = true;
          } else {
            isAuthenticated = false;
            if (effStatus == SubscriptionStatus.expired) {
              authNotice =
                  'Monthly subscription completed for "${activeShop.name}". Your business data remains safely intact—renew to log back in.';
            } else if (effStatus == SubscriptionStatus.blocked) {
              authNotice = '"${activeShop.name}" has been blocked by Super Admin.';
            }
          }
        }
      }
    } catch (_) {
      // Keep default seeded state if local storage fails
    }

    isRestoring = false;
    notifyListeners();

    // Hydrate from Cloud Firestore & start real-time listeners
    await testCloudConnection();
    await _hydrateFromCloud();
    _startRegistryListeners();
    if (isAuthenticated && !isSuperAdmin) {
      _startShopOpsListeners(activeShop.id);
    }
  }

  Future<void> refreshCloudRegistry() async {
    await testCloudConnection();
    await _hydrateFromCloud();
  }

  void _startRegistryListeners() {
    if (_registrySubs.isNotEmpty) return;
    _registrySubs.addAll(
      CloudService.subscribeToSaasRegistry(
        onUsers: (cloudUsers) {
          registeredUsers = _mergeLists(cloudUsers, registeredUsers, (u) => u.id);
          final matched = registeredUsers.cast<User?>().firstWhere(
                (u) => u?.id == currentUser.id,
                orElse: () => null,
              );
          if (matched != null) currentUser = matched;
          cloudConnected = true;
          _persistState();
          notifyListeners();
        },
        onShops: (cloudShops) {
          allShops = _mergeLists(cloudShops, allShops, (s) => s.id);
          final matched = allShops.cast<Shop?>().firstWhere(
                (s) => s?.id == activeShop.id,
                orElse: () => null,
              );
          if (matched != null) activeShop = matched;
          cloudConnected = true;
          enforceActiveSubscriptionGuard();
          _persistState();
          notifyListeners();
        },
        onRequests: (cloudReqs) {
          subscriptionRequests = _mergeLists(cloudReqs, subscriptionRequests, (r) => r.id);
          cloudConnected = true;
          _persistState();
          notifyListeners();
        },
      ),
    );
  }

  void _stopShopOpsListeners() {
    for (final sub in _shopOpsSubs) {
      sub.cancel();
    }
    _shopOpsSubs.clear();
    _listeningOpsShopId = null;
  }

  void _startShopOpsListeners(String shopId) {
    if (_listeningOpsShopId == shopId && _shopOpsSubs.isNotEmpty) return;
    _stopShopOpsListeners();
    _listeningOpsShopId = shopId;
    _shopOpsSubs.addAll(
      CloudService.subscribeToShopOperationalData(
        shopId,
        onProducts: (cloudProducts) {
          allProducts = _mergeLists(cloudProducts, allProducts, (p) => p.id);
          _persistState();
          notifyListeners();
        },
        onCustomers: (cloudCustomers) {
          allCustomers = _mergeLists(cloudCustomers, allCustomers, (c) => c.id);
          _persistState();
          notifyListeners();
        },
        onSuppliers: (cloudSuppliers) {
          allSuppliers = _mergeLists(cloudSuppliers, allSuppliers, (s) => s.id);
          _persistState();
          notifyListeners();
        },
        onExpenses: (cloudExpenses) {
          allExpenses = _mergeLists(cloudExpenses, allExpenses, (e) => e.id);
          _persistState();
          notifyListeners();
        },
        onSales: (cloudSales) {
          allSales = _mergeLists(cloudSales, allSales, (s) => s.id);
          _persistState();
          notifyListeners();
        },
      ),
    );
  }

  Future<void> _hydrateFromCloud() async {
    try {
      final registry = await CloudService.fetchSaasRegistryFromCloud();
      bool changed = false;

      if (registry.users.isNotEmpty) {
        registeredUsers = _mergeLists(registry.users, registeredUsers, (u) => u.id);
        final matchedUser = registeredUsers.cast<User?>().firstWhere(
              (u) => u?.id == currentUser.id,
              orElse: () => null,
            );
        if (matchedUser != null) currentUser = matchedUser;
        changed = true;
      }

      if (registry.requests.isNotEmpty) {
        subscriptionRequests = _mergeLists(registry.requests, subscriptionRequests, (r) => r.id);
        changed = true;
      }

      if (registry.shops.isNotEmpty) {
        allShops = _mergeLists(registry.shops, allShops, (s) => s.id);
        final matchedShop = allShops.cast<Shop?>().firstWhere(
              (s) => s?.id == activeShop.id,
              orElse: () => null,
            );
        if (matchedShop != null) activeShop = matchedShop;

        for (final cs in registry.shops) {
          if (cs.subscriptionStatus == SubscriptionStatus.pendingApproval &&
              !subscriptionRequests.any((r) => r.shopId == cs.id && r.status == 'pending')) {
            subscriptionRequests.insert(
              0,
              SubscriptionRequest(
                id: 'subreq_cloud_${cs.id}',
                shopId: cs.id,
                shopName: cs.name,
                ownerName: cs.ownerName,
                ownerEmail: cs.ownerEmail ?? '',
                ownerPhone: cs.phone,
                planId: cs.subscriptionPlanId ?? 'starter_monthly',
                planName: cs.subscriptionPlanName ?? 'Starter Monthly',
                amount: cs.subscriptionFee ?? 2500,
                paymentMethod: cs.subscriptionPaymentMethod ?? 'JazzCash',
                paymentReference: cs.subscriptionPaymentRef ?? 'CLOUD-SYNC',
                status: 'pending',
                requestedAt: cs.createdAt ?? DateTime.now().toIso8601String(),
              ),
            );
          }
        }
        changed = true;
      }

      if (isAuthenticated && !isSuperAdmin) {
        final ops = await CloudService.fetchShopOperationalDataFromCloud(activeShop.id);
        if (ops.products.isNotEmpty) {
          allProducts = _mergeLists(ops.products, allProducts, (p) => p.id);
          changed = true;
        }
        if (ops.customers.isNotEmpty) {
          allCustomers = _mergeLists(ops.customers, allCustomers, (c) => c.id);
          changed = true;
        }
        if (ops.suppliers.isNotEmpty) {
          allSuppliers = _mergeLists(ops.suppliers, allSuppliers, (s) => s.id);
          changed = true;
        }
        if (ops.expenses.isNotEmpty) {
          allExpenses = _mergeLists(ops.expenses, allExpenses, (e) => e.id);
          changed = true;
        }
        if (ops.sales.isNotEmpty) {
          allSales = _mergeLists(ops.sales, allSales, (s) => s.id);
          changed = true;
        }
      }

      if (changed) {
        enforceActiveSubscriptionGuard();
        _persistState();
        notifyListeners();
      }
    } catch (_) {
      // Cloud hydration optional in offline mode
    }
  }

  void _persistState() {
    LocalStorageService.saveState({
      'isAuthenticated': isAuthenticated,
      'isSuperAdmin': isSuperAdmin,
      'currentUserId': currentUser.id,
      'activeShopId': activeShop.id,
      'soundEnabled': soundEnabled,
      'registeredUsers': registeredUsers.map((u) => u.toJson()).toList(),
      'allShops': allShops.map((s) => s.toJson()).toList(),
      'subscriptionRequests': subscriptionRequests.map((r) => r.toJson()).toList(),
      'allProducts': allProducts.map((p) => p.toJson()).toList(),
      'allCustomers': allCustomers.map((c) => c.toJson()).toList(),
      'allSuppliers': allSuppliers.map((s) => s.toJson()).toList(),
      'allExpenses': allExpenses.map((e) => e.toJson()).toList(),
      'allSales': allSales.map((s) => s.toJson()).toList(),
      'allHeldSales': allHeldSales.map((h) => h.toJson()).toList(),
      'syncQueue': syncQueue.map((q) => q.toJson()).toList(),
    });
  }

  void _startSubscriptionGuard() {
    _subscriptionGuardTimer?.cancel();
    _subscriptionGuardTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      enforceActiveSubscriptionGuard();
    });
  }

  @override
  void dispose() {
    _subscriptionGuardTimer?.cancel();
    for (final sub in _registrySubs) {
      sub.cancel();
    }
    _registrySubs.clear();
    _stopShopOpsListeners();
    super.dispose();
  }

  void enforceActiveSubscriptionGuard() {
    if (!isAuthenticated || isSuperAdmin) return;
    final idx = allShops.indexWhere((s) => s.id == activeShop.id);
    if (idx >= 0) {
      activeShop = allShops[idx];
    }
    final status = SaasConfig.getEffectiveStatus(activeShop);
    if (status == SubscriptionStatus.expired || status == SubscriptionStatus.blocked) {
      if (status == SubscriptionStatus.expired && idx >= 0) {
        allShops[idx] = allShops[idx].copyWith(subscriptionStatus: SubscriptionStatus.expired);
        activeShop = allShops[idx];
        CloudService.syncShopToCloud(activeShop);
      }
      isAuthenticated = false;
      _stopShopOpsListeners();
      authNotice = status == SubscriptionStatus.expired
          ? 'Monthly subscription completed for "${activeShop.name}". You have been signed out automatically while all your business data remains safely preserved.'
          : '"${activeShop.name}" has been blocked by Super Admin.';
      _persistState();
      notifyListeners();
    }
  }

  void showToast(String msg) {
    toastMessage = msg;
    notifyListeners();
    Future.delayed(const Duration(seconds: 3, milliseconds: 500), () {
      if (toastMessage == msg) {
        toastMessage = null;
        notifyListeners();
      }
    });
  }

  void toggleSound() {
    soundEnabled = !soundEnabled;
    _persistState();
    showToast(soundEnabled ? 'POS Scanner beep enabled' : 'POS Scanner beep muted');
    notifyListeners();
  }

  ShopEntitlements get entitlements => SaasConfig.getEntitlements(activeShop);

  Future<void> testCloudConnection() async {
    final ok = await CloudService.testConnection();
    cloudConnected = ok;
    if (ok) {
      _startRegistryListeners();
      if (isAuthenticated && !isSuperAdmin) {
        CloudService.syncShopToCloud(activeShop);
      }
    }
    notifyListeners();
  }

  // Normalized Barcode / QR Matcher for Hardware & Camera Scanners
  Product? findProductByBarcode(String rawCode) {
    final cleaned = rawCode.replaceAll(RegExp(r'\s+'), '').trim();
    if (cleaned.isEmpty) return null;

    final candidates = <String>{
      cleaned,
      cleaned.toLowerCase(),
    };
    if (cleaned.length == 13 && cleaned.startsWith('0')) {
      candidates.add(cleaned.substring(1));
    } else if (cleaned.length == 12 && RegExp(r'^\d+$').hasMatch(cleaned)) {
      candidates.add('0$cleaned');
    }

    for (final p in products) {
      final pBar = p.barcode.replaceAll(RegExp(r'\s+'), '').trim();
      final pQr = (p.qrCode ?? '').replaceAll(RegExp(r'\s+'), '').trim();
      if (candidates.contains(pBar) || candidates.contains(pBar.toLowerCase())) {
        return p;
      }
      if (pQr.isNotEmpty && (candidates.contains(pQr) || candidates.contains(pQr.toLowerCase()))) {
        return p;
      }
    }
    return null;
  }

  // Tenant-Isolated Getters
  List<Shop> get userShops {
    if (currentUser.role == UserRole.owner) {
      final owned = allShops.where((s) {
        if (s.ownerId != null && s.ownerId == currentUser.id) return true;
        if (currentUser.businessIds != null && currentUser.businessIds!.contains(s.id)) return true;
        if (s.ownerEmail != null && s.ownerEmail!.toLowerCase() == currentUser.email.toLowerCase()) return true;
        return false;
      }).toList();
      return owned.isNotEmpty ? owned : [activeShop];
    } else {
      final assigned = allShops.where((s) {
        if (currentUser.shopId != null && s.id == currentUser.shopId) return true;
        return currentUser.businessIds != null && currentUser.businessIds!.contains(s.id);
      }).toList();
      return assigned.isNotEmpty ? assigned : [activeShop];
    }
  }

  List<Shop> get shops => userShops;

  List<User> staffForShop(String shopId) {
    return registeredUsers.where((u) => u.shopId == shopId && u.role != UserRole.owner).toList();
  }

  List<Product> get products => allProducts.where((p) => p.shopId == activeShop.id).toList();
  List<Customer> get customers => allCustomers.where((c) => c.shopId == activeShop.id).toList();
  List<Supplier> get suppliers => allSuppliers.where((s) => s.shopId == activeShop.id).toList();
  List<Expense> get expenses => allExpenses.where((e) => e.shopId == activeShop.id).toList();
  List<Sale> get salesHistory => allSales.where((s) => s.shopId == activeShop.id).toList();
  List<HeldSale> get heldSales => allHeldSales.where((h) => h.shopId == activeShop.id).toList();
  List<SyncQueueItem> get shopSyncQueue => syncQueue.where((q) => q.shopId == activeShop.id).toList();

  void setActiveShop(Shop shop) {
    activeShop = shop;
    enforceActiveSubscriptionGuard();
    if (isAuthenticated && !isSuperAdmin) {
      _startShopOpsListeners(shop.id);
      _hydrateFromCloud();
    }
    _persistState();
    showToast('Active Shop: ${shop.name}');
    notifyListeners();
  }

  void setCurrentUser(User user) {
    currentUser = user;
    _persistState();
    showToast('Switched operator to ${user.name} (${user.role.name.toUpperCase()})');
    notifyListeners();
  }

  void _enqueueSync(String entityType, String entityId, String action, String summary) {
    syncQueue.insert(
      0,
      SyncQueueItem(
        id: 'sync_${DateTime.now().millisecondsSinceEpoch}',
        shopId: activeShop.id,
        entityType: entityType,
        entityId: entityId,
        action: action,
        payloadSummary: summary,
        createdAt: DateTime.now().toIso8601String(),
        status: cloudConnected ? 'synced' : 'pending',
      ),
    );
  }

  Future<void> forceReplaySyncQueue() async {
    await syncAllToCloud();
  }

  void simulateOfflinePendingItem() {
    syncQueue.insert(
      0,
      SyncQueueItem(
        id: 'sync_${DateTime.now().millisecondsSinceEpoch}',
        shopId: activeShop.id,
        entityType: 'sale',
        entityId: 'INV-OFF-${DateTime.now().millisecondsSinceEpoch.toString().substring(9)}',
        action: 'insert',
        payloadSummary: 'Local offline bill waiting for network replay',
        createdAt: DateTime.now().toIso8601String(),
        status: 'pending',
      ),
    );
    _persistState();
    notifyListeners();
  }

  // Held Sales Management
  void holdSale(List<CartItem> items, Customer? customer) {
    if (items.isEmpty) return;
    final timeNow = TimeOfDayHelper.nowLabel();
    allHeldSales.insert(
      0,
      HeldSale(
        id: 'held_${DateTime.now().millisecondsSinceEpoch}',
        shopId: activeShop.id,
        customerId: customer?.id,
        customerName: customer?.name,
        items: List.from(items),
        timeLabel: timeNow,
      ),
    );
    _persistState();
    showToast('Sale placed on hold (${items.length} items saved)');
    notifyListeners();
  }

  HeldSale? resumeHeldSale(String heldId) {
    final idx = allHeldSales.indexWhere((h) => h.id == heldId);
    if (idx < 0) return null;
    final target = allHeldSales.removeAt(idx);
    _persistState();
    showToast('Resumed held sale (${target.items.length} items)');
    notifyListeners();
    return target;
  }

  void deleteHeldSale(String heldId) {
    allHeldSales.removeWhere((h) => h.id == heldId);
    _persistState();
    notifyListeners();
  }

  Future<SaaSLoginResult> loginWithCredentialsAsync(String rawEmail, String password) async {
    await refreshCloudRegistry();
    final res = loginWithCredentials(rawEmail, password);
    if (res.outcome == SaaSLoginOutcome.success) {
      await _hydrateFromCloud();
      _startShopOpsListeners(activeShop.id);
    } else if (res.outcome == SaaSLoginOutcome.superAdmin) {
      _startRegistryListeners();
    }
    return res;
  }

  // SaaS Authentication + Super Admin + Subscription Enforcement
  SaaSLoginResult loginWithCredentials(String rawEmail, String password) {
    authNotice = null;
    final email = rawEmail.trim().toLowerCase();
    if (email.isEmpty || password.isEmpty) {
      return const SaaSLoginResult(
        outcome: SaaSLoginOutcome.invalidCredentials,
        message: 'Please enter both email and password.',
      );
    }

    if (email == SaasConfig.superAdminEmail.toLowerCase() &&
        password == SaasConfig.superAdminPassword) {
      isSuperAdmin = true;
      isAuthenticated = false;
      _persistState();
      notifyListeners();
      return const SaaSLoginResult(outcome: SaaSLoginOutcome.superAdmin);
    }

    final user = registeredUsers.cast<User?>().firstWhere(
      (u) => u?.email.trim().toLowerCase() == email,
      orElse: () => null,
    );

    if (user == null || (user.password ?? '') != password) {
      return const SaaSLoginResult(
        outcome: SaaSLoginOutcome.invalidCredentials,
        message: 'Invalid email or password. Register your business if you are new.',
      );
    }

    final userShop = allShops.cast<Shop?>().firstWhere(
      (s) {
        if (s == null) return false;
        if (user.shopId != null && s.id == user.shopId) return true;
        if (user.businessIds != null && user.businessIds!.contains(s.id)) return true;
        if (s.ownerId == user.id) return true;
        if (s.ownerEmail?.toLowerCase() == email) return true;
        return false;
      },
      orElse: () => null,
    );

    if (userShop == null) {
      return const SaaSLoginResult(
        outcome: SaaSLoginOutcome.invalidCredentials,
        message: 'No business profile is linked to this user.',
      );
    }

    final effective = SaasConfig.getEffectiveStatus(userShop);
    if (effective == SubscriptionStatus.pendingApproval) {
      return SaaSLoginResult(
        outcome: SaaSLoginOutcome.pendingApproval,
        shop: userShop,
        message: 'Your subscription request (${userShop.subscriptionPaymentRef ?? 'Pending'}) is waiting for Super Admin approval.',
      );
    }
    if (effective == SubscriptionStatus.blocked) {
      return SaaSLoginResult(
        outcome: SaaSLoginOutcome.blocked,
        shop: userShop,
        message: 'Business access has been blocked by the Super Admin.',
      );
    }
    if (effective == SubscriptionStatus.rejected) {
      return SaaSLoginResult(
        outcome: SaaSLoginOutcome.rejected,
        shop: userShop,
        message: 'Subscription payment rejected: ${userShop.subscriptionRejectionReason ?? 'Unverified reference'}.',
      );
    }
    if (effective == SubscriptionStatus.expired) {
      return SaaSLoginResult(
        outcome: SaaSLoginOutcome.expired,
        shop: userShop,
        message: 'Your 1-month subscription has expired. All business data is intact—renew below to restore login.',
      );
    }

    currentUser = user;
    activeShop = userShop;
    isSuperAdmin = false;
    isAuthenticated = true;
    _persistState();
    showToast('Signed in as ${user.name} (${user.role.name.toUpperCase()})');
    notifyListeners();
    _hydrateFromCloud();
    _startShopOpsListeners(userShop.id);
    return SaaSLoginResult(outcome: SaaSLoginOutcome.success, shop: userShop);
  }

  Future<SaaSLoginResult> loginAsSuperAdminAsync(String rawEmail, String password) async {
    final res = loginAsSuperAdmin(rawEmail, password);
    if (res.outcome == SaaSLoginOutcome.superAdmin) {
      await refreshCloudRegistry();
      _startRegistryListeners();
    }
    return res;
  }

  SaaSLoginResult loginAsSuperAdmin(String rawEmail, String password) {
    if (rawEmail.trim().toLowerCase() == SaasConfig.superAdminEmail.toLowerCase() &&
        password == SaasConfig.superAdminPassword) {
      authNotice = null;
      isSuperAdmin = true;
      isAuthenticated = false;
      _persistState();
      notifyListeners();
      return const SaaSLoginResult(outcome: SaaSLoginOutcome.superAdmin);
    }
    return const SaaSLoginResult(
      outcome: SaaSLoginOutcome.invalidCredentials,
      message: 'Invalid Super Admin credentials.',
    );
  }

  Future<Shop> registerSaaS({
    required String fullName,
    required String email,
    required String password,
    required String businessName,
    required String category,
    required String city,
    required String address,
    required String currency,
    required SubscriptionPlanOption plan,
    required String paymentMethod,
    required String paymentReference,
    String phone = '',
    bool loadStarterProducts = true,
  }) async {
    final nowIso = DateTime.now().toIso8601String();
    final newUserId = 'usr_owner_${DateTime.now().millisecondsSinceEpoch}';
    final newShopId = 'shop_${DateTime.now().millisecondsSinceEpoch}';

    final req = SubscriptionRequest(
      id: 'subreq_${DateTime.now().millisecondsSinceEpoch}',
      shopId: newShopId,
      shopName: businessName,
      ownerName: fullName,
      ownerEmail: email,
      ownerPhone: phone.isNotEmpty ? phone : '+92 300 0000000',
      planId: plan.id,
      planName: plan.name,
      amount: plan.pricePkr,
      currency: 'PKR',
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
      status: 'pending',
      requestedAt: nowIso,
    );

    final newShop = Shop(
      id: newShopId,
      name: businessName,
      ownerName: fullName,
      ownerId: newUserId,
      ownerEmail: email,
      phone: phone.isNotEmpty ? phone : '+92 300 0000000',
      category: category,
      address: address.isNotEmpty ? address : 'Main Market',
      city: city.isNotEmpty ? city : 'Mianwali',
      currency: currency,
      taxEnabled: true,
      defaultTaxRate: 5,
      receiptMessage: 'Thank you for shopping with $businessName!',
      allowNegativeStock: false,
      thermalPrinterWidth: PrinterWidth.mm80,
      subscriptionStatus: SubscriptionStatus.pendingApproval,
      subscriptionPlanId: plan.id,
      subscriptionPlanName: plan.name,
      subscriptionFee: plan.pricePkr,
      subscriptionPaymentMethod: paymentMethod,
      subscriptionPaymentRef: paymentReference,
      createdAt: nowIso,
    );

    final newUser = User(
      id: newUserId,
      name: fullName,
      email: email,
      role: UserRole.owner,
      phone: phone,
      password: password,
      shopId: newShopId,
      businessIds: [newShopId],
      subscriptionPlan: plan.name,
      createdAt: nowIso,
    );

    registeredUsers.insert(0, newUser);
    allShops.insert(0, newShop);
    subscriptionRequests.insert(0, req);

    List<Product> starter = const [];
    if (loadStarterProducts) {
      starter = StarterCatalog.generate(newShopId, category, currency);
      allProducts.insertAll(0, starter);
    }

    // Stay unauthenticated until Super Admin approves the subscription request!
    _enqueueSync('shop', newShopId, 'insert', 'Pending Admin approval: $businessName ($paymentReference)');
    _persistState();
    notifyListeners();

    await CloudService.initialize();
    final okShop = await CloudService.syncShopToCloud(newShop);
    final okUser = await CloudService.syncSaasUserToCloud(newUser);
    final okReq = await CloudService.syncSubscriptionRequestToCloud(req);
    if (starter.isNotEmpty) {
      await CloudService.syncAllProductsToCloud(newShopId, starter);
    }
    cloudConnected = okShop && okUser && okReq;
    showToast(
      cloudConnected
          ? 'Business registered & synced to Cloud! Sent to Super Admin for approval.'
          : 'Business saved locally — connect to internet so Admin receives request.',
    );
    notifyListeners();
    return newShop;
  }

  Future<void> renewSubscription({
    required String shopId,
    required SubscriptionPlanOption plan,
    required String paymentMethod,
    required String paymentReference,
  }) async {
    final idx = allShops.indexWhere((s) => s.id == shopId);
    if (idx < 0) return;
    final shop = allShops[idx];
    final nowIso = DateTime.now().toIso8601String();

    final req = SubscriptionRequest(
      id: 'subreq_${DateTime.now().millisecondsSinceEpoch}',
      shopId: shop.id,
      shopName: shop.name,
      ownerName: shop.ownerName,
      ownerEmail: shop.ownerEmail ?? '',
      ownerPhone: shop.phone,
      planId: plan.id,
      planName: plan.name,
      amount: plan.pricePkr,
      currency: 'PKR',
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
      status: 'pending',
      requestedAt: nowIso,
    );
    subscriptionRequests.insert(0, req);

    allShops[idx] = shop.copyWith(
      subscriptionStatus: SubscriptionStatus.pendingApproval,
      subscriptionPlanId: plan.id,
      subscriptionPlanName: plan.name,
      subscriptionFee: plan.pricePkr,
      subscriptionPaymentMethod: paymentMethod,
      subscriptionPaymentRef: paymentReference,
      subscriptionRejectionReason: null,
    );
    _persistState();
    notifyListeners();
    await CloudService.syncShopToCloud(allShops[idx]);
    await CloudService.syncSubscriptionRequestToCloud(req);
    showToast('Monthly renewal submitted to Super Admin! Business data remains safe.');
  }

  void requestProUpgrade({
    required String paymentMethod,
    required String paymentReference,
  }) {
    final proPlan = SaasConfig.plans[1];
    renewSubscription(
      shopId: activeShop.id,
      plan: proPlan,
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
    );
    isAuthenticated = false;
    authNotice =
        'Upgrade to Business Pro Monthly submitted (Ref: $paymentReference). Once Super Admin approves, log back in to unlock Multi-Branch, Custom Staff, P&L, Expiry Alerts & Cloud Sync!';
    _persistState();
    notifyListeners();
  }

  // Super Admin Actions
  void approveShop(String shopId) {
    final nowIso = DateTime.now().toIso8601String();
    final expiresIso = SaasConfig.addDaysIso(SaasConfig.defaultSubscriptionDays);

    for (final r in subscriptionRequests) {
      if (r.shopId == shopId && r.status == 'pending') {
        r.status = 'approved';
        r.reviewedAt = nowIso;
        CloudService.syncSubscriptionRequestToCloud(r);
      }
    }

    final idx = allShops.indexWhere((s) => s.id == shopId);
    if (idx >= 0) {
      allShops[idx] = allShops[idx].copyWith(
        subscriptionStatus: SubscriptionStatus.active,
        subscriptionStartedAt: nowIso,
        subscriptionExpiresAt: expiresIso,
        subscriptionRejectionReason: null,
      );
      if (activeShop.id == shopId) activeShop = allShops[idx];
      CloudService.syncShopToCloud(allShops[idx]);
      _persistState();
      showToast('Approved "${allShops[idx].name}" for 30 days!');
      notifyListeners();
    }
  }

  void rejectShop(String shopId, String reason) {
    final nowIso = DateTime.now().toIso8601String();
    for (final r in subscriptionRequests) {
      if (r.shopId == shopId && r.status == 'pending') {
        r.status = 'rejected';
        r.reviewedAt = nowIso;
        r.adminNote = reason;
        CloudService.syncSubscriptionRequestToCloud(r);
      }
    }

    final idx = allShops.indexWhere((s) => s.id == shopId);
    if (idx >= 0) {
      allShops[idx] = allShops[idx].copyWith(
        subscriptionStatus: SubscriptionStatus.rejected,
        subscriptionRejectionReason: reason,
      );
      if (activeShop.id == shopId) activeShop = allShops[idx];
      CloudService.syncShopToCloud(allShops[idx]);
      _persistState();
      showToast('Rejected "${allShops[idx].name}".');
      notifyListeners();
    }
  }

  void blockShop(String shopId) {
    final idx = allShops.indexWhere((s) => s.id == shopId);
    if (idx >= 0) {
      allShops[idx] = allShops[idx].copyWith(subscriptionStatus: SubscriptionStatus.blocked);
      if (activeShop.id == shopId) activeShop = allShops[idx];
      CloudService.syncShopToCloud(allShops[idx]);
      _persistState();
      showToast('Blocked "${allShops[idx].name}" during ongoing subscription.');
      notifyListeners();
    }
  }

  void unblockShop(String shopId) {
    final idx = allShops.indexWhere((s) => s.id == shopId);
    if (idx >= 0) {
      final exp = allShops[idx].subscriptionExpiresAt != null
          ? DateTime.tryParse(allShops[idx].subscriptionExpiresAt!)
          : null;
      final isExpiredAlready = exp != null && DateTime.now().isAfter(exp);
      allShops[idx] = allShops[idx].copyWith(
        subscriptionStatus: isExpiredAlready ? SubscriptionStatus.expired : SubscriptionStatus.active,
      );
      if (activeShop.id == shopId) activeShop = allShops[idx];
      CloudService.syncShopToCloud(allShops[idx]);
      _persistState();
      showToast('Unblocked "${allShops[idx].name}".');
      notifyListeners();
    }
  }

  void expireShopNow(String shopId) {
    final idx = allShops.indexWhere((s) => s.id == shopId);
    if (idx >= 0) {
      final pastIso = DateTime.now().subtract(const Duration(minutes: 2)).toIso8601String();
      allShops[idx] = allShops[idx].copyWith(
        subscriptionStatus: SubscriptionStatus.expired,
        subscriptionExpiresAt: pastIso,
      );
      if (activeShop.id == shopId) activeShop = allShops[idx];
      CloudService.syncShopToCloud(allShops[idx]);
      _persistState();
      showToast('Completed month for "${allShops[idx].name}" — login blocked until renewal.');
      notifyListeners();
    }
  }

  // Per-Business Staff Management (Business Pro Monthly Only: Custom Cashiers & Optional Managers)
  bool addStaffMember({
    required String shopId,
    required String name,
    required String email,
    required String password,
    required UserRole role,
    String phone = '',
  }) {
    final targetShop = allShops.firstWhere((s) => s.id == shopId, orElse: () => activeShop);
    if (!SaasConfig.getEntitlements(targetShop).allowCustomStaff) {
      showToast('Custom Cashiers & Managers require Business Pro Monthly.');
      return false;
    }

    final cleanEmail = email.trim().toLowerCase();
    if (registeredUsers.any((u) => u.email.trim().toLowerCase() == cleanEmail)) {
      showToast('A user with this email already exists.');
      return false;
    }

    final staff = User(
      id: 'usr_${role.name}_${DateTime.now().millisecondsSinceEpoch}',
      name: name.trim(),
      email: email.trim(),
      role: role,
      phone: phone.trim(),
      password: password,
      shopId: shopId,
      businessIds: [shopId],
      subscriptionPlan: activeShop.subscriptionPlanName,
      createdAt: DateTime.now().toIso8601String(),
    );
    registeredUsers.add(staff);
    CloudService.syncSaasUserToCloud(staff);
    _persistState();
    showToast('Added ${role.name}: ${staff.name}');
    notifyListeners();
    return true;
  }

  void removeStaffMember(String userId) {
    final idx = registeredUsers.indexWhere((u) => u.id == userId);
    if (idx < 0) return;
    if (registeredUsers[idx].role == UserRole.owner) return;
    final removed = registeredUsers.removeAt(idx);
    CloudService.deleteSaasUserFromCloud(userId);
    _persistState();
    showToast('Removed ${removed.name} from staff.');
    notifyListeners();
  }

  void addBusinessBranch({
    required String businessName,
    required String category,
    required String city,
    required String address,
    required String phone,
    required String currency,
    bool taxEnabled = true,
    double defaultTaxRate = 5,
    bool discountEnabled = false,
    double defaultDiscountRate = 0,
    String receiptMessage = '',
    bool allowNegativeStock = false,
    PrinterWidth thermalPrinterWidth = PrinterWidth.mm80,
    bool loadStarterProducts = true,
  }) {
    if (!entitlements.allowMultiBranch) {
      showToast('Multi-Branch stores are disabled on Starter Monthly.');
      return;
    }
    final newShopId = 'shop_${DateTime.now().millisecondsSinceEpoch}';

    final newShop = Shop(
      id: newShopId,
      name: businessName,
      ownerName: currentUser.name,
      ownerId: currentUser.id,
      ownerEmail: currentUser.email,
      phone: phone.isNotEmpty ? phone : currentUser.phone,
      category: category,
      address: address.isNotEmpty ? address : 'Main Market',
      city: city,
      currency: currency,
      taxEnabled: taxEnabled,
      defaultTaxRate: taxEnabled ? defaultTaxRate : 0,
      discountEnabled: discountEnabled,
      defaultDiscountRate: discountEnabled ? defaultDiscountRate : 0,
      receiptMessage: receiptMessage.isNotEmpty ? receiptMessage : 'Thank you for visiting $businessName!',
      allowNegativeStock: allowNegativeStock,
      thermalPrinterWidth: thermalPrinterWidth,
      subscriptionStatus: activeShop.subscriptionStatus,
      subscriptionPlanId: activeShop.subscriptionPlanId,
      subscriptionPlanName: activeShop.subscriptionPlanName,
      subscriptionFee: activeShop.subscriptionFee,
      subscriptionStartedAt: activeShop.subscriptionStartedAt,
      subscriptionExpiresAt: activeShop.subscriptionExpiresAt,
      createdAt: DateTime.now().toIso8601String(),
    );

    allShops.insert(0, newShop);

    final updatedIds = List<String>.from(currentUser.businessIds ?? []);
    updatedIds.add(newShopId);
    final userIdx = registeredUsers.indexWhere((u) => u.id == currentUser.id);
    if (userIdx >= 0) {
      final updatedUser = User(
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        phone: currentUser.phone,
        password: currentUser.password,
        shopId: currentUser.shopId,
        businessIds: updatedIds,
        subscriptionPlan: currentUser.subscriptionPlan,
        createdAt: currentUser.createdAt,
      );
      registeredUsers[userIdx] = updatedUser;
      currentUser = updatedUser;
      CloudService.syncSaasUserToCloud(updatedUser);
    }

    if (loadStarterProducts) {
      final starter = StarterCatalog.generate(newShopId, category, currency);
      allProducts.insertAll(0, starter);
    }

    activeShop = newShop;
    _enqueueSync('shop', newShopId, 'insert', 'Added branch: $businessName');
    CloudService.syncShopToCloud(newShop);
    _persistState();
    showToast('New Branch "$businessName" added!');
    notifyListeners();
  }

  void logoutSaaS() {
    isAuthenticated = false;
    isSuperAdmin = false;
    _stopShopOpsListeners();
    _persistState();
    showToast('Signed out to SaaS Portal.');
    notifyListeners();
  }

  void openSaaSPortal() {
    isAuthenticated = false;
    isSuperAdmin = false;
    _stopShopOpsListeners();
    _persistState();
    notifyListeners();
  }

  void handleLogout() {
    logoutSaaS();
  }

  // Product Handlers
  Future<void> addNewProductFromScan(Product newProd) async {
    final product = Product(
      id: 'prod_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      barcode: newProd.barcode,
      qrCode: newProd.qrCode,
      name: newProd.name,
      category: newProd.category,
      brand: newProd.brand,
      description: newProd.description,
      costPrice: newProd.costPrice,
      sellingPrice: newProd.sellingPrice,
      taxPercentage: newProd.taxPercentage,
      stockQuantity: newProd.stockQuantity,
      minimumStockLimit: 5,
      unit: newProd.unit,
      expiryDate: newProd.expiryDate,
      createdAt: DateTime.now().toIso8601String(),
      updatedAt: DateTime.now().toIso8601String(),
    );
    allProducts.insert(0, product);
    _enqueueSync('product', product.id, 'insert', 'Scanned new product: ${product.name}');
    _persistState();
    await CloudService.syncProductToCloud(activeShop.id, product);
    showToast('Added "${product.name}" to Inventory!');
    notifyListeners();
  }

  Future<void> saveProductFromForm(Product saved) async {
    final idx = allProducts.indexWhere((p) => p.id == saved.id);
    if (idx >= 0) {
      allProducts[idx] = saved;
    } else {
      allProducts.insert(0, saved);
    }
    _enqueueSync('product', saved.id, idx >= 0 ? 'update' : 'insert', 'Product: ${saved.name}');
    _persistState();
    await CloudService.syncProductToCloud(activeShop.id, saved);
    showToast('Product "${saved.name}" saved!');
    notifyListeners();
  }

  void deleteProduct(String productId) {
    final idx = allProducts.indexWhere((p) => p.id == productId);
    if (idx < 0) return;
    final target = allProducts[idx];
    allProducts.removeAt(idx);
    _enqueueSync('product', productId, 'delete', 'Deleted product: ${target.name}');
    _persistState();
    CloudService.deleteProductFromCloud(activeShop.id, productId);
    showToast('Removed "${target.name}" from inventory.');
    notifyListeners();
  }

  Future<void> confirmStockAdjustment(StockAdjustmentRecord adj) async {
    final idx = allProducts.indexWhere((p) => p.id == adj.productId);
    if (idx >= 0) {
      allProducts[idx].stockQuantity = adj.newQuantity;
      await CloudService.syncProductToCloud(activeShop.id, allProducts[idx]);
    }
    _enqueueSync('inventory_transaction', adj.id, 'update', '${adj.productName} -> ${adj.newQuantity}');
    _persistState();
    await CloudService.recordCloudStockAdjustment(activeShop.id, adj);
    showToast('Stock updated: ${adj.productName} -> ${adj.newQuantity}');
    notifyListeners();
  }

  Future<void> syncAllToCloud() async {
    isSyncingCloud = true;
    notifyListeners();
    try {
      await CloudService.initialize();
      final shopOk = await CloudService.syncShopToCloud(activeShop);
      final shopUsers = registeredUsers.where((u) =>
          u.shopId == activeShop.id ||
          (u.businessIds?.contains(activeShop.id) ?? false) ||
          u.id == activeShop.ownerId ||
          u.id == currentUser.id);
      for (final u in shopUsers) {
        await CloudService.syncSaasUserToCloud(u);
      }
      for (final r in subscriptionRequests.where((r) => r.shopId == activeShop.id)) {
        await CloudService.syncSubscriptionRequestToCloud(r);
      }
      final count = await CloudService.syncAllProductsToCloud(activeShop.id, products);
      for (final c in customers) {
        await CloudService.syncCustomerToCloud(activeShop.id, c);
      }
      for (final s in suppliers) {
        await CloudService.syncSupplierToCloud(activeShop.id, s);
      }
      for (final e in expenses) {
        await CloudService.syncExpenseToCloud(activeShop.id, e);
      }
      for (final sale in salesHistory) {
        await CloudService.syncSaleToCloud(activeShop.id, sale);
      }
      for (final item in syncQueue) {
        if (item.shopId == activeShop.id) {
          item.status = shopOk ? 'synced' : 'pending';
        }
      }
      cloudConnected = shopOk;
      lastSyncCount = count;
      showToast(
        shopOk
            ? 'Synced ${activeShop.name}: $count products, ${salesHistory.length} bills & ${customers.length} customers to Firestore!'
            : 'Saved locally (Firestore unreachable — check internet connection).',
      );
    } catch (_) {
      cloudConnected = false;
      showToast('Saved locally on device (Offline mode).');
    }
    isSyncingCloud = false;
    _persistState();
    notifyListeners();
  }

  // Sale Completion
  Future<void> completeSale({
    required List<CartItem> cart,
    required double subtotal,
    required double discountTotal,
    required double taxTotal,
    double deliveryCharge = 0,
    required double grandTotal,
    required List<PaymentRecord> payments,
    required String invoiceNumber,
    Customer? customer,
  }) async {
    final newSale = Sale(
      id: 'sale_${DateTime.now().millisecondsSinceEpoch}',
      invoiceNumber: invoiceNumber,
      shopId: activeShop.id,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: customer?.id,
      customerName: customer?.name,
      items: cart,
      subtotal: subtotal,
      discountTotal: discountTotal,
      taxTotal: taxTotal,
      deliveryCharge: deliveryCharge,
      grandTotal: grandTotal,
      payments: payments,
      paymentStatus: PaymentStatus.paid,
      createdAt: DateTime.now().toIso8601String(),
    );

    // Decrement stock in allProducts
    for (final item in cart) {
      final idx = allProducts.indexWhere((p) => p.id == item.product.id);
      if (idx >= 0) {
        final nextQty = allProducts[idx].stockQuantity - item.quantity;
        allProducts[idx].stockQuantity = activeShop.allowNegativeStock ? nextQty : nextQty.clamp(0, 999999);
        if (entitlements.allowCloudSync) {
          CloudService.syncProductToCloud(activeShop.id, allProducts[idx]);
        }
      }
    }

    // Update customer total purchases & loyalty points (+ Udhaar debt if customerCredit used)
    if (customer != null) {
      final cIdx = allCustomers.indexWhere((c) => c.id == customer.id);
      if (cIdx >= 0) {
        final c = allCustomers[cIdx];
        c.totalPurchases += grandTotal;
        c.loyaltyPoints += (grandTotal / 100).floor();
        final creditAmount = payments
            .where((p) => p.method == PaymentMethod.customerCredit)
            .fold(0.0, (s, p) => s + p.amount);
        if (creditAmount > 0) {
          c.dueBalance += creditAmount;
          c.ledger ??= [];
          c.ledger!.insert(
            0,
            CustomerLedgerEntry(
              id: 'ent_${DateTime.now().millisecondsSinceEpoch}',
              customerId: c.id,
              shopId: activeShop.id,
              date: DateTime.now().toIso8601String(),
              type: 'debit',
              amount: creditAmount,
              balanceAfter: c.dueBalance,
              paymentMethod: 'Khata Credit',
              note: 'POS Bill: $invoiceNumber',
            ),
          );
        }
        if (entitlements.allowCloudSync) {
          CloudService.syncCustomerToCloud(activeShop.id, c);
        }
      }
    }

    allSales.insert(0, newSale);
    _enqueueSync('sale', newSale.id, 'insert', 'Bill $invoiceNumber (${activeShop.currency} ${grandTotal.round()})');
    _persistState();
    if (entitlements.allowCloudSync) {
      CloudService.syncSaleToCloud(activeShop.id, newSale);
    }
    showToast('Order $invoiceNumber completed!');
    notifyListeners();
  }

  // Shop Onboarding / Settings Update
  Future<void> saveShop(Shop savedShop, {bool loadStarter = false}) async {
    final idx = allShops.indexWhere((s) => s.id == savedShop.id);
    if (idx >= 0) {
      allShops[idx] = savedShop;
    } else {
      if (!entitlements.allowMultiBranch) {
        showToast('Multi-Branch stores are disabled on Starter Monthly.');
        return;
      }
      allShops.insert(0, savedShop);
      final updatedIds = List<String>.from(currentUser.businessIds ?? []);
      if (!updatedIds.contains(savedShop.id)) {
        updatedIds.add(savedShop.id);
      }
      currentUser = User(
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        phone: currentUser.phone,
        password: currentUser.password,
        shopId: currentUser.shopId,
        businessIds: updatedIds,
        subscriptionPlan: currentUser.subscriptionPlan,
        createdAt: currentUser.createdAt,
      );
      if (loadStarter) {
        final starter = StarterCatalog.generate(savedShop.id, savedShop.category, savedShop.currency);
        allProducts.insertAll(0, starter);
      }
    }
    activeShop = savedShop;
    _enqueueSync('shop', savedShop.id, idx >= 0 ? 'update' : 'insert', 'Store: ${savedShop.name}');
    _persistState();
    if (entitlements.allowCloudSync) {
      await CloudService.syncShopToCloud(savedShop);
    }
    showToast('Store "${savedShop.name}" saved!');
    notifyListeners();
  }

  // Refund Processing
  void confirmRefund({
    required String saleId,
    required double refundAmount,
    required List<RefundItem> itemsToRefund,
    required String reason,
    required bool restock,
  }) {
    final idx = allSales.indexWhere((s) => s.id == saleId);
    if (idx < 0) return;
    final sale = allSales[idx];
    final isFull = refundAmount >= sale.grandTotal;
    sale.isRefunded = isFull;
    sale.isPartiallyRefunded = !isFull;
    sale.refundAmount += refundAmount;
    sale.refundDetails = RefundRecord(
      id: 'ref_${DateTime.now().millisecondsSinceEpoch}',
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      shopId: activeShop.id,
      refundedAt: DateTime.now().toIso8601String(),
      refundedBy: currentUser.name,
      refundAmount: refundAmount,
      items: itemsToRefund,
      reason: reason,
      restockedToInventory: restock,
    );

    if (restock) {
      for (final ri in itemsToRefund) {
        final pidx = allProducts.indexWhere((p) => p.id == ri.productId);
        if (pidx >= 0) {
          final updatedStock = allProducts[pidx].stockQuantity + ri.quantityRefunded;
          if (cloudConnected && entitlements.allowCloudSync) {
            CloudService.recordCloudStockAdjustment(activeShop.id, StockAdjustmentRecord(
              id: 'adj_${DateTime.now().millisecondsSinceEpoch}_${allProducts[pidx].id}',
              shopId: activeShop.id,
              productId: allProducts[pidx].id,
              productName: allProducts[pidx].name,
              previousQuantity: allProducts[pidx].stockQuantity,
              changeQuantity: ri.quantityRefunded,
              newQuantity: updatedStock,
              type: 'return',
              reason: 'Customer Refund - $reason',
              performedBy: currentUser.name,
              createdAt: DateTime.now().toIso8601String(),
            ));
          }
          allProducts[pidx].stockQuantity = updatedStock;
          if (entitlements.allowCloudSync) {
            CloudService.syncProductToCloud(activeShop.id, allProducts[pidx]);
          }
        }
      }
    }

    if (entitlements.allowCloudSync) {
      CloudService.syncSaleToCloud(activeShop.id, sale);
    }
    _enqueueSync('refund', sale.invoiceNumber, 'insert', 'Refund ${activeShop.currency} ${refundAmount.round()}');
    _persistState();
    showToast('Refund of ${activeShop.currency} ${refundAmount.round()} completed!${restock ? ' Inventory restocked.' : ''}');
    notifyListeners();
  }

  // Customer Ledger Repayment
  void recordCustomerPayment(String customerId, double amount, String method, [String? note]) {
    final idx = allCustomers.indexWhere((c) => c.id == customerId);
    if (idx < 0) return;
    final c = allCustomers[idx];
    final newDue = (c.dueBalance - amount).clamp(0.0, double.infinity);
    final newEntry = CustomerLedgerEntry(
      id: 'ent_${DateTime.now().millisecondsSinceEpoch}',
      customerId: c.id,
      shopId: activeShop.id,
      date: DateTime.now().toIso8601String(),
      type: 'credit',
      amount: amount,
      balanceAfter: newDue,
      paymentMethod: method,
      note: note ?? 'Customer balance repayment',
    );
    c.dueBalance = newDue;
    c.ledger ??= [];
    c.ledger!.insert(0, newEntry);
    if (entitlements.allowCloudSync) {
      CloudService.syncCustomerToCloud(activeShop.id, c);
    }
    _enqueueSync('customer', c.id, 'update', 'Wasooli ${activeShop.currency} ${amount.round()} from ${c.name}');
    _persistState();
    showToast('Wasooli of ${activeShop.currency} ${amount.round()} recorded!');
    notifyListeners();
  }

  Customer addCustomer(Customer newCust) {
    final created = Customer(
      id: 'cust_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      name: newCust.name,
      phone: newCust.phone,
      email: newCust.email,
      address: newCust.address,
      loyaltyPoints: 0,
      dueBalance: 0,
      totalPurchases: 0,
      notes: newCust.notes,
    );
    allCustomers.insert(0, created);
    if (entitlements.allowCloudSync) {
      CloudService.syncCustomerToCloud(activeShop.id, created);
    }
    _enqueueSync('customer', created.id, 'insert', 'Registered Khata customer: ${created.name}');
    _persistState();
    showToast('Customer ${created.name} registered!');
    notifyListeners();
    return created;
  }

  // Supplier Handlers
  void recordSupplierPayment(String supplierId, double amount, String method, [String? note]) {
    final idx = allSuppliers.indexWhere((s) => s.id == supplierId);
    if (idx < 0) return;
    final s = allSuppliers[idx];
    final newBalance = (s.payableBalance - amount).clamp(0.0, double.infinity);
    final newPayment = SupplierPaymentRecord(
      id: 'spay_${DateTime.now().millisecondsSinceEpoch}',
      supplierId: s.id,
      shopId: activeShop.id,
      date: DateTime.now().toIso8601String(),
      amount: amount,
      method: method,
      note: note,
    );
    s.payableBalance = newBalance;
    s.payments ??= [];
    s.payments!.insert(0, newPayment);
    if (entitlements.allowCloudSync) {
      CloudService.syncSupplierToCloud(activeShop.id, s);
    }
    _enqueueSync('supplier', s.id, 'update', 'Payout ${activeShop.currency} ${amount.round()} to ${s.name}');
    _persistState();
    showToast('Supplier payout of ${activeShop.currency} ${amount.round()} recorded!');
    notifyListeners();
  }

  void addSupplier(Supplier newSup) {
    final created = Supplier(
      id: 'sup_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      name: newSup.name,
      phone: newSup.phone,
      email: newSup.email,
      address: newSup.address.isNotEmpty ? newSup.address : 'Pakistan',
      payableBalance: 0,
      notes: newSup.notes,
    );
    allSuppliers.insert(0, created);
    if (entitlements.allowCloudSync) {
      CloudService.syncSupplierToCloud(activeShop.id, created);
    }
    _enqueueSync('supplier', created.id, 'insert', 'Added supplier: ${created.name}');
    _persistState();
    showToast('Supplier ${created.name} added!');
    notifyListeners();
  }

  void addExpense(Expense newExp) {
    final created = Expense(
      id: 'exp_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      amount: newExp.amount,
      date: DateTime.now().toIso8601String(),
      category: newExp.category,
      description: newExp.description,
      createdBy: currentUser.name,
    );
    allExpenses.insert(0, created);
    if (entitlements.allowCloudSync) {
      CloudService.syncExpenseToCloud(activeShop.id, created);
    }
    _enqueueSync('expense', created.id, 'insert', 'Expense: ${created.description}');
    _persistState();
    showToast('Expense of ${activeShop.currency} ${created.amount.round()} logged!');
    notifyListeners();
  }

  void toggleCloudMode() {
    cloudConnected = !cloudConnected;
    _persistState();
    showToast(cloudConnected ? 'Cloud Online: Auto-sync active' : 'Offline Mode: Saving locally on device');
    notifyListeners();
  }

  // Computed Getters (Strictly Tenant-Isolated)
  double get grossSalesRevenue => salesHistory.fold(0.0, (sum, s) => sum + s.grandTotal);
  double get refundsTotal => salesHistory.fold(0.0, (sum, s) => sum + (s.refundAmount > 0 ? s.refundAmount : (s.isRefunded ? s.grandTotal : 0)));
  double get netRevenue => grossSalesRevenue - refundsTotal;
  int get lowStockCount => products.where((p) => p.isLowStock).length;
  List<Product> get expiredProducts => products.where((p) => p.isExpired).toList();
  List<Product> get nearExpiryProducts => products.where((p) => p.isNearExpiry).toList();
  List<Product> get expiryAlertProducts => products.where((p) => p.hasExpiryAlert).toList();
  int get expiryAlertCount => expiryAlertProducts.length;
  double get totalReceivables => customers.fold(0.0, (sum, c) => sum + c.dueBalance);
  double get totalPayables => suppliers.fold(0.0, (sum, s) => sum + s.payableBalance);
  double get totalExpenses => expenses.fold(0.0, (sum, e) => sum + e.amount);
  double get inventoryCostValue => products.fold(0.0, (sum, p) => sum + (p.costPrice * p.stockQuantity));
  double get inventoryRetailValue => products.fold(0.0, (sum, p) => sum + (p.sellingPrice * p.stockQuantity));
  double get estimatedGrossProfit {
    double profit = 0;
    for (final sale in salesHistory) {
      if (sale.isRefunded) continue;
      for (final item in sale.items) {
        final cost = item.product.costPrice > 0 ? item.product.costPrice : item.unitPrice * 0.75;
        profit += (item.unitPrice - cost) * item.quantity - item.itemDiscount;
      }
    }
    return profit;
  }
}

class TimeOfDayHelper {
  static String nowLabel() {
    final now = DateTime.now();
    final h = now.hour.toString().padLeft(2, '0');
    final m = now.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
