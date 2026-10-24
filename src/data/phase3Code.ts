export interface FlutterPhase3File {
  path: string;
  description: string;
  code: string;
}

export const PHASE3_FLUTTER_FILES: FlutterPhase3File[] = [
  {
    path: 'lib/core/services/cloud_sync_service.dart',
    description: 'Cloud Firestore synchronization service handling offline Drift to Cloud syncing.',
    code: `import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../database/app_database.dart';
import '../../shared/models/product_model.dart';

final cloudSyncServiceProvider = Provider<CloudSyncService>((ref) {
  final firestore = FirebaseFirestore.instance;
  final db = ref.watch(appDatabaseProvider);
  return CloudSyncService(firestore, db);
});

class CloudSyncService {
  final FirebaseFirestore _firestore;
  final AppDatabase _db;

  CloudSyncService(this._firestore, this._db);

  /// Synchronize all pending local SyncQueue items to Cloud Firestore
  Future<int> processPendingSyncQueue(String shopId) async {
    final pendingItems = await _db.getPendingSyncQueue(shopId);
    int syncedCount = 0;

    for (final item in pendingItems) {
      try {
        final collectionRef = _firestore
            .collection('shops')
            .doc(shopId)
            .collection(item.entityType);

        if (item.action == 'insert' || item.action == 'update') {
          await collectionRef.doc(item.entityId).set(
            item.payloadJson,
            SetOptions(merge: true),
          );
        } else if (item.action == 'delete') {
          await collectionRef.doc(item.entityId).delete();
        }

        // Mark item as synced in local SQLite
        await _db.markSyncQueueItemSynced(item.id);
        syncedCount++;
      } catch (e) {
        // Increment retry count with exponential backoff
        await _db.incrementSyncQueueRetry(item.id, e.toString());
      }
    }

    return syncedCount;
  }

  /// Real-time stream of Products from Cloud Firestore
  Stream<List<ProductModel>> watchCloudProducts(String shopId) {
    return _firestore
        .collection('shops')
        .doc(shopId)
        .collection('products')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => ProductModel.fromJson(doc.data()))
          .toList();
    });
  }

  /// Push single product to Cloud Firestore
  Future<void> pushProductToCloud(String shopId, ProductModel product) async {
    await _firestore
        .collection('shops')
        .doc(shopId)
        .collection('products')
        .doc(product.id)
        .set(product.toJson(), SetOptions(merge: true));
  }

  /// Log an inventory stock adjustment transaction in Cloud Firestore
  Future<void> recordCloudInventoryTransaction({
    required String shopId,
    required String productId,
    required String productName,
    required double changeQuantity,
    required double newQuantity,
    required String type,
    required String reason,
    required String performedBy,
  }) async {
    final docId = 'tx_\${DateTime.now().millisecondsSinceEpoch}';
    await _firestore
        .collection('shops')
        .doc(shopId)
        .collection('inventory_transactions')
        .doc(docId)
        .set({
      'id': docId,
      'shopId': shopId,
      'productId': productId,
      'productName': productName,
      'changeQuantity': changeQuantity,
      'newQuantity': newQuantity,
      'type': type,
      'reason': reason,
      'performedBy': performedBy,
      'serverTimestamp': FieldValue.serverTimestamp(),
      'createdAt': DateTime.now().toIso8601String(),
    });
  }
}`
  },
  {
    path: 'lib/features/products/data/products_repository.dart',
    description: 'Repository implementing dual-layer persistence: local Drift SQLite + Cloud Firestore.',
    code: `import 'package:drift/drift.dart';
import '../../core/database/app_database.dart';
import '../../core/services/cloud_sync_service.dart';
import '../../../shared/models/product_model.dart';

abstract class ProductsRepository {
  Stream<List<ProductModel>> watchProducts(String shopId);
  Future<List<ProductModel>> searchProducts(String shopId, String query);
  Future<ProductModel?> getProductByBarcode(String shopId, String barcode);
  Future<void> saveProduct(ProductModel product);
  Future<void> deleteProduct(String shopId, String productId);
  Future<void> adjustStock(String shopId, String productId, double delta, String reason, String user);
}

class ProductsRepositoryImpl implements ProductsRepository {
  final AppDatabase _db;
  final CloudSyncService _cloudSync;

  ProductsRepositoryImpl(this._db, this._cloudSync);

  @override
  Stream<List<ProductModel>> watchProducts(String shopId) {
    // Reactive Drift stream ensures instant local offline updates
    return _db.productsDao.watchProductsByShop(shopId);
  }

  @override
  Future<ProductModel?> getProductByBarcode(String shopId, String barcode) async {
    return _db.productsDao.findByBarcode(shopId, barcode);
  }

  @override
  Future<void> saveProduct(ProductModel product) async {
    // 1. Write to local Drift SQLite
    await _db.productsDao.upsertProduct(product);

    // 2. Queue for Cloud Sync (or push immediately if online)
    await _cloudSync.pushProductToCloud(product.shopId, product);
  }

  @override
  Future<void> adjustStock(
    String shopId, 
    String productId, 
    double delta, 
    String reason, 
    String user
  ) async {
    final current = await _db.productsDao.getProductById(productId);
    if (current == null) return;

    final newQty = current.stockQuantity + delta;
    if (newQty < 0 && !current.allowNegativeStock) {
      throw Exception('Stock cannot fall below zero.');
    }

    // Atomic SQLite transaction
    await _db.transaction(() async {
      await _db.productsDao.updateStock(productId, newQty);
      await _db.inventoryTransactionsDao.insertTransaction(
        productId: productId,
        changeQuantity: delta,
        newStockQuantity: newQty,
        type: delta > 0 ? 'stock_in' : 'stock_out',
        reason: reason,
        performedBy: user,
      );
    });

    // Mirror to Cloud Firestore
    await _cloudSync.recordCloudInventoryTransaction(
      shopId: shopId,
      productId: productId,
      productName: current.name,
      changeQuantity: delta,
      newQuantity: newQty,
      type: delta > 0 ? 'stock_in' : 'stock_out',
      reason: reason,
      performedBy: user,
    );
  }

  @override
  Future<void> deleteProduct(String shopId, String productId) async {
    await _db.productsDao.deleteProduct(productId);
  }

  @override
  Future<List<ProductModel>> searchProducts(String shopId, String query) async {
    return _db.productsDao.search(shopId, query);
  }
}`
  },
  {
    path: 'lib/features/inventory/presentation/stock_adjustment_dialog.dart',
    description: 'Stock in / stock out dialog with mandatory audit reason logging.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../products/data/products_repository.dart';
import '../../../shared/models/product_model.dart';

class StockAdjustmentDialog extends ConsumerStatefulWidget {
  final ProductModel product;
  const StockAdjustmentDialog({super.key, required this.product});

  @override
  ConsumerState<StockAdjustmentDialog> createState() => _StockAdjustmentDialogState();
}

class _StockAdjustmentDialogState extends ConsumerState<StockAdjustmentDialog> {
  final _qtyController = TextEditingController(text: '10');
  String _actionType = 'stock_in'; // 'stock_in' or 'stock_out'
  String _reason = 'Supplier Restock';

  final _reasonsList = const [
    'Supplier Restock',
    'Damaged in Store',
    'Customer Return',
    'Physical Audit Correction',
    'Expired Item Removal',
    'Theft / Shrinkage',
    'Sample / Promotion',
  ];

  @override
  Widget build(BuildContext context) {
    final currentStock = widget.product.stockQuantity;

    return AlertDialog(
      title: Text('Adjust Stock: \${widget.product.name}'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Stock: \$currentStock \${widget.product.unit}',
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            // Operation Type Toggle
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'stock_in', label: Text('Stock In (+)'), icon: Icon(Icons.add_box)),
                ButtonSegment(value: 'stock_out', label: Text('Stock Out (-)'), icon: Icon(Icons.indeterminate_check_box)),
              ],
              selected: {_actionType},
              onSelectionChanged: (val) => setState(() => _actionType = val.first),
            ),
            const SizedBox(height: 16),

            // Quantity input
            TextField(
              controller: _qtyController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Quantity to \${_actionType == "stock_in" ? "Add" : "Deduct"}',
                suffixText: widget.product.unit,
              ),
            ),
            const SizedBox(height: 16),

            // Reason selector
            DropdownButtonFormField<String>(
              value: _reason,
              decoration: const InputDecoration(labelText: 'Adjustment Reason *'),
              items: _reasonsList
                  .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
              onChanged: (val) => setState(() => _reason = val!),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: () async {
            final qty = double.tryParse(_qtyController.text) ?? 0;
            if (qty <= 0) return;

            final delta = _actionType == 'stock_in' ? qty : -qty;
            await ref.read(productsRepositoryProvider).adjustStock(
                  widget.product.shopId,
                  widget.product.id,
                  delta,
                  _reason,
                  'Active Staff',
                );

            if (context.mounted) Navigator.pop(context);
          },
          child: const Text('Confirm & Save to Cloud'),
        ),
      ],
    );
  }
}`
  }
];
