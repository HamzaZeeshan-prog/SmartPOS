import 'dart:async';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import '../models/models.dart';

class CloudShopOperationalData {
  final List<Product> products;
  final List<Customer> customers;
  final List<Supplier> suppliers;
  final List<Expense> expenses;
  final List<Sale> sales;

  const CloudShopOperationalData({
    this.products = const [],
    this.customers = const [],
    this.suppliers = const [],
    this.expenses = const [],
    this.sales = const [],
  });
}

class CloudSaasRegistryData {
  final List<User> users;
  final List<Shop> shops;
  final List<SubscriptionRequest> requests;

  const CloudSaasRegistryData({
    this.users = const [],
    this.shops = const [],
    this.requests = const [],
  });
}

class CloudService {
  // CRITICAL: Matches firebase-applet-config.json so Flutter & Web read/write the exact same database
  static const String _databaseId = 'ai-studio-omnipos-c17c88f1-a840-453e-8205-ef312a4f43b6';

  static const FirebaseOptions _defaultFirebaseOptions = FirebaseOptions(
    apiKey: 'AIzaSyCMRWIC0IyAXjCDSFTAQOOmWVpB3zG7tqM',
    appId: '1:226421275737:web:f26edf1525e9ba96c08548',
    messagingSenderId: '226421275737',
    projectId: 'exemplary-quasar-zc9s2',
    authDomain: 'exemplary-quasar-zc9s2.firebaseapp.com',
    storageBucket: 'exemplary-quasar-zc9s2.firebasestorage.app',
  );

  static bool _firebaseAvailable = false;

  static FirebaseFirestore? get _db {
    if (!_firebaseAvailable && Firebase.apps.isEmpty) return null;
    try {
      return FirebaseFirestore.instanceFor(
        app: Firebase.app(),
        databaseId: _databaseId,
      );
    } catch (_) {
      try {
        return FirebaseFirestore.instance;
      } catch (_) {
        return null;
      }
    }
  }

  static Future<FirebaseFirestore?> _ensureDb() async {
    if (_db == null) {
      await initialize();
    }
    return _db;
  }

  static dynamic _sanitizeValue(dynamic value) {
    if (value == null) return null;
    if (value is num) {
      if (value is double && (!value.isFinite)) return 0.0;
      return value;
    }
    if (value is Map) {
      final out = <String, dynamic>{};
      value.forEach((k, v) {
        if (v != null) {
          final cleaned = _sanitizeValue(v);
          if (cleaned != null) {
            out[k.toString()] = cleaned;
          }
        }
      });
      return out;
    }
    if (value is List) {
      return value
          .where((e) => e != null)
          .map(_sanitizeValue)
          .where((e) => e != null)
          .toList();
    }
    return value;
  }

  static Map<String, dynamic> _sanitizeMap(Map<String, dynamic> raw) {
    final cleaned = _sanitizeValue(raw);
    if (cleaned is Map<String, dynamic>) return cleaned;
    return Map<String, dynamic>.from(cleaned as Map);
  }

  static Future<void> initialize() async {
    try {
      if (Firebase.apps.isEmpty) {
        try {
          await Firebase.initializeApp();
        } catch (_) {
          await Firebase.initializeApp(options: _defaultFirebaseOptions);
        }
      }
      _firebaseAvailable = Firebase.apps.isNotEmpty;
    } catch (e) {
      debugPrint('Firebase initialize error: $e');
      _firebaseAvailable = false;
    }
  }

  static Future<bool> testConnection() async {
    await initialize();
    final db = _db;
    if (db == null) return false;
    try {
      await db
          .collection('test')
          .doc('connection')
          .get(const GetOptions(source: Source.server))
          .timeout(const Duration(seconds: 5));
      return true;
    } catch (e) {
      final msg = e.toString().toLowerCase();
      if (msg.contains('offline') || msg.contains('unavailable') || msg.contains('timeout')) {
        return false;
      }
      // Permission or not-found response confirms active Firestore server reachability
      return true;
    }
  }

  static Future<bool> syncShopToCloud(Shop shop) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shop.id).set(
            _sanitizeMap({
              ...shop.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncShopToCloud error: $e');
      return false;
    }
  }

  static Future<bool> syncSaasUserToCloud(User user) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('saas_users').doc(user.id).set(
            _sanitizeMap({
              ...user.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncSaasUserToCloud error: $e');
      return false;
    }
  }

  static Future<void> deleteSaasUserFromCloud(String userId) async {
    final db = await _ensureDb();
    if (db == null) return;
    try {
      await db.collection('saas_users').doc(userId).delete();
    } catch (e) {
      debugPrint('deleteSaasUserFromCloud error: $e');
    }
  }

  static Future<bool> syncSubscriptionRequestToCloud(SubscriptionRequest req) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('subscription_requests').doc(req.id).set(
            _sanitizeMap({
              ...req.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncSubscriptionRequestToCloud error: $e');
      return false;
    }
  }

  static Future<bool> syncProductToCloud(String shopId, Product product) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shopId).collection('products').doc(product.id).set(
            _sanitizeMap({
              ...product.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncProductToCloud error: $e');
      return false;
    }
  }

  static Future<void> deleteProductFromCloud(String shopId, String productId) async {
    final db = await _ensureDb();
    if (db == null) return;
    try {
      await db.collection('shops').doc(shopId).collection('products').doc(productId).delete();
    } catch (e) {
      debugPrint('deleteProductFromCloud error: $e');
    }
  }

  static Future<int> syncAllProductsToCloud(String shopId, List<Product> products) async {
    if (products.isEmpty) return 0;
    final db = await _ensureDb();
    if (db == null) return 0;
    int synced = 0;
    try {
      const chunkSize = 400;
      final nowIso = DateTime.now().toIso8601String();
      for (int i = 0; i < products.length; i += chunkSize) {
        final end = (i + chunkSize < products.length) ? i + chunkSize : products.length;
        final batch = db.batch();
        for (int j = i; j < end; j++) {
          final prod = products[j];
          final ref = db.collection('shops').doc(shopId).collection('products').doc(prod.id);
          batch.set(
            ref,
            _sanitizeMap({
              ...prod.toJson(),
              'updatedAt': nowIso,
            }),
            SetOptions(merge: true),
          );
          synced++;
        }
        await batch.commit();
      }
      return synced;
    } catch (e) {
      debugPrint('syncAllProductsToCloud error: $e');
      return 0;
    }
  }

  static Future<bool> recordCloudStockAdjustment(String shopId, StockAdjustmentRecord adj) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shopId).collection('inventory_transactions').doc(adj.id).set({
        ..._sanitizeMap(adj.toJson()),
        'serverTime': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      debugPrint('recordCloudStockAdjustment error: $e');
      return false;
    }
  }

  static Future<bool> syncSaleToCloud(String shopId, Sale sale) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shopId).collection('sales').doc(sale.id).set(
            _sanitizeMap({
              ...sale.toJson(),
              'syncedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncSaleToCloud error: $e');
      return false;
    }
  }

  static Future<bool> syncCustomerToCloud(String shopId, Customer customer) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shopId).collection('customers').doc(customer.id).set(
            _sanitizeMap({
              ...customer.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncCustomerToCloud error: $e');
      return false;
    }
  }

  static Future<bool> syncSupplierToCloud(String shopId, Supplier supplier) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shopId).collection('suppliers').doc(supplier.id).set(
            _sanitizeMap({
              ...supplier.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncSupplierToCloud error: $e');
      return false;
    }
  }

  static Future<bool> syncExpenseToCloud(String shopId, Expense expense) async {
    final db = await _ensureDb();
    if (db == null) return false;
    try {
      await db.collection('shops').doc(shopId).collection('expenses').doc(expense.id).set(
            _sanitizeMap({
              ...expense.toJson(),
              'updatedAt': DateTime.now().toIso8601String(),
            }),
            SetOptions(merge: true),
          );
      return true;
    } catch (e) {
      debugPrint('syncExpenseToCloud error: $e');
      return false;
    }
  }

  static Future<CloudSaasRegistryData> fetchSaasRegistryFromCloud() async {
    final db = await _ensureDb();
    if (db == null) return const CloudSaasRegistryData();
    try {
      final results = await Future.wait([
        db.collection('saas_users').get().timeout(const Duration(seconds: 6)),
        db.collection('shops').get().timeout(const Duration(seconds: 6)),
        db.collection('subscription_requests').get().timeout(const Duration(seconds: 6)),
      ]);
      final users = results[0].docs.map((d) => User.fromJson(d.data())).toList();
      final shops = results[1].docs.map((d) => Shop.fromJson(d.data())).toList();
      final requests = results[2].docs.map((d) => SubscriptionRequest.fromJson(d.data())).toList();
      return CloudSaasRegistryData(users: users, shops: shops, requests: requests);
    } catch (e) {
      debugPrint('fetchSaasRegistryFromCloud error: $e');
      return const CloudSaasRegistryData();
    }
  }

  static List<StreamSubscription> subscribeToSaasRegistry({
    required void Function(List<User>) onUsers,
    required void Function(List<Shop>) onShops,
    required void Function(List<SubscriptionRequest>) onRequests,
  }) {
    final db = _db;
    if (db == null) return const [];
    final subs = <StreamSubscription>[];

    subs.add(
      db.collection('saas_users').snapshots().listen(
        (snap) {
          final users = snap.docs.map((d) => User.fromJson(d.data())).toList();
          if (users.isNotEmpty) onUsers(users);
        },
        onError: (e) => debugPrint('saas_users stream error: $e'),
      ),
    );

    subs.add(
      db.collection('shops').snapshots().listen(
        (snap) {
          final shops = snap.docs.map((d) => Shop.fromJson(d.data())).toList();
          if (shops.isNotEmpty) onShops(shops);
        },
        onError: (e) => debugPrint('shops stream error: $e'),
      ),
    );

    subs.add(
      db.collection('subscription_requests').snapshots().listen(
        (snap) {
          final requests = snap.docs.map((d) => SubscriptionRequest.fromJson(d.data())).toList();
          if (requests.isNotEmpty) onRequests(requests);
        },
        onError: (e) => debugPrint('subscription_requests stream error: $e'),
      ),
    );

    return subs;
  }

  static Future<CloudShopOperationalData> fetchShopOperationalDataFromCloud(String shopId) async {
    final db = await _ensureDb();
    if (db == null) return const CloudShopOperationalData();
    try {
      final shopRef = db.collection('shops').doc(shopId);
      final snaps = await Future.wait([
        shopRef.collection('products').get().timeout(const Duration(seconds: 6)),
        shopRef.collection('customers').get().timeout(const Duration(seconds: 6)),
        shopRef.collection('suppliers').get().timeout(const Duration(seconds: 6)),
        shopRef.collection('expenses').get().timeout(const Duration(seconds: 6)),
        shopRef.collection('sales').get().timeout(const Duration(seconds: 6)),
      ]);
      return CloudShopOperationalData(
        products: snaps[0].docs.map((d) => Product.fromJson(d.data())).toList(),
        customers: snaps[1].docs.map((d) => Customer.fromJson(d.data())).toList(),
        suppliers: snaps[2].docs.map((d) => Supplier.fromJson(d.data())).toList(),
        expenses: snaps[3].docs.map((d) => Expense.fromJson(d.data())).toList(),
        sales: snaps[4].docs.map((d) => Sale.fromJson(d.data())).toList(),
      );
    } catch (e) {
      debugPrint('fetchShopOperationalDataFromCloud error: $e');
      return const CloudShopOperationalData();
    }
  }

  static List<StreamSubscription> subscribeToShopOperationalData(
    String shopId, {
    required void Function(List<Product>) onProducts,
    required void Function(List<Customer>) onCustomers,
    required void Function(List<Supplier>) onSuppliers,
    required void Function(List<Expense>) onExpenses,
    required void Function(List<Sale>) onSales,
  }) {
    final db = _db;
    if (db == null) return const [];
    final shopRef = db.collection('shops').doc(shopId);
    final subs = <StreamSubscription>[];

    subs.add(
      shopRef.collection('products').snapshots().listen(
        (snap) {
          final list = snap.docs.map((d) => Product.fromJson(d.data())).toList();
          if (list.isNotEmpty) onProducts(list);
        },
        onError: (e) => debugPrint('products stream error: $e'),
      ),
    );

    subs.add(
      shopRef.collection('customers').snapshots().listen(
        (snap) {
          final list = snap.docs.map((d) => Customer.fromJson(d.data())).toList();
          if (list.isNotEmpty) onCustomers(list);
        },
        onError: (e) => debugPrint('customers stream error: $e'),
      ),
    );

    subs.add(
      shopRef.collection('suppliers').snapshots().listen(
        (snap) {
          final list = snap.docs.map((d) => Supplier.fromJson(d.data())).toList();
          if (list.isNotEmpty) onSuppliers(list);
        },
        onError: (e) => debugPrint('suppliers stream error: $e'),
      ),
    );

    subs.add(
      shopRef.collection('expenses').snapshots().listen(
        (snap) {
          final list = snap.docs.map((d) => Expense.fromJson(d.data())).toList();
          if (list.isNotEmpty) onExpenses(list);
        },
        onError: (e) => debugPrint('expenses stream error: $e'),
      ),
    );

    subs.add(
      shopRef.collection('sales').snapshots().listen(
        (snap) {
          final list = snap.docs.map((d) => Sale.fromJson(d.data())).toList();
          if (list.isNotEmpty) onSales(list);
        },
        onError: (e) => debugPrint('sales stream error: $e'),
      ),
    );

    return subs;
  }
}
