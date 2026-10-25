import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/models.dart';

class CloudService {
  static final FirebaseFirestore _db = FirebaseFirestore.instance;
  static bool _initialized = false;

  static Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
  }

  static Future<bool> testConnection() async {
    try {
      await _db.collection('test').doc('connection').get();
      return true;
    } catch (e) {
      if (e.toString().contains('offline')) return false;
      return true;
    }
  }

  static Future<void> syncShopToCloud(Shop shop) async {
    try {
      await _db.collection('shops').doc(shop.id).set({
        ...shop.toJson(),
        'updatedAt': DateTime.now().toIso8601String(),
      }, SetOptions(merge: true));
    } catch (e) {
      print('Firestore sync shop error: $e');
    }
  }

  static Future<void> syncProductToCloud(String shopId, Product product) async {
    try {
      await _db.collection('shops').doc(shopId).collection('products').doc(product.id).set({
        ...product.toJson(),
        'updatedAt': DateTime.now().toIso8601String(),
      }, SetOptions(merge: true));
    } catch (e) {
      print('Firestore sync product error: $e');
    }
  }

  static Future<int> syncAllProductsToCloud(String shopId, List<Product> products) async {
    int synced = 0;
    try {
      for (final prod in products) {
        await _db.collection('shops').doc(shopId).collection('products').doc(prod.id).set({
          ...prod.toJson(),
          'updatedAt': DateTime.now().toIso8601String(),
        }, SetOptions(merge: true));
        synced++;
      }
    } catch (e) {
      print('Firestore batch sync error: $e');
    }
    return synced;
  }

  static Future<void> recordCloudStockAdjustment(String shopId, StockAdjustmentRecord adj) async {
    try {
      await _db.collection('shops').doc(shopId).collection('inventory_transactions').doc(adj.id).set({
        'id': adj.id, 'shopId': adj.shopId, 'productId': adj.productId, 'productName': adj.productName,
        'previousQuantity': adj.previousQuantity, 'changeQuantity': adj.changeQuantity,
        'newQuantity': adj.newQuantity, 'type': adj.type, 'reason': adj.reason,
        'performedBy': adj.performedBy, 'createdAt': adj.createdAt,
        'serverTime': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Firestore stock adj error: $e');
    }
  }

  static Future<void> syncSaleToCloud(String shopId, Sale sale) async {
    try {
      await _db.collection('shops').doc(shopId).collection('sales').doc(sale.id).set({
        'id': sale.id, 'invoiceNumber': sale.invoiceNumber, 'shopId': sale.shopId,
        'cashierId': sale.cashierId, 'cashierName': sale.cashierName,
        'customerId': sale.customerId, 'customerName': sale.customerName,
        'subtotal': sale.subtotal, 'discountTotal': sale.discountTotal, 'taxTotal': sale.taxTotal,
        'deliveryCharge': sale.deliveryCharge, 'grandTotal': sale.grandTotal,
        'payments': sale.payments.map((p) => p.toJson()).toList(),
        'paymentStatus': sale.paymentStatus.name, 'createdAt': sale.createdAt,
        'syncedAt': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      print('Firestore sync sale error: $e');
    }
  }
}
