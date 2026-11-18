import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../widgets/modals/auth_modal.dart';
import '../widgets/modals/product_form_modal.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  String _search = '';
  String _selectedCategory = 'All';
  bool _onlyLowStock = false;
  bool _onlyExpiring = false;
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _showStockAdjustDialog(BuildContext context, Product p, AppStore store) {
    final qtyCtrl = TextEditingController(text: p.stockQuantity.toString());
    String reason = 'Physical Audit Count';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppTheme.slate800),
        ),
        title: Text(
          'Adjust Stock: ${p.name}',
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Current Stock: ${p.stockQuantity} ${p.unitName}', style: const TextStyle(color: AppTheme.slate400, fontSize: 12)),
              const SizedBox(height: 12),
              TextField(
                controller: qtyCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'New Stock Quantity',
                  labelStyle: const TextStyle(color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: reason,
                isExpanded: true,
                dropdownColor: AppTheme.slate900,
                decoration: InputDecoration(
                  labelText: 'Reason',
                  labelStyle: const TextStyle(color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: [
                  'Physical Audit Count',
                  'Damaged Goods Written Off',
                  'Supplier Delivery Restock',
                  'Inventory Correction',
                ].map((r) => DropdownMenuItem(value: r, child: Text(r, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)))).toList(),
                onChanged: (r) => reason = r ?? 'Physical Audit Count',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600),
            onPressed: () {
              final newQty = int.tryParse(qtyCtrl.text) ?? p.stockQuantity;
              final adj = StockAdjustmentRecord(
                id: 'adj_${DateTime.now().millisecondsSinceEpoch}',
                shopId: store.activeShop.id,
                productId: p.id,
                productName: p.name,
                previousQuantity: p.stockQuantity,
                changeQuantity: newQty - p.stockQuantity,
                newQuantity: newQty,
                type: 'correction',
                reason: reason,
                performedBy: store.currentUser.name,
                createdAt: DateTime.now().toIso8601String(),
              );
              store.confirmStockAdjustment(adj);
              Navigator.pop(ctx);
            },
            child: const Text('Save Stock', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteProduct(BuildContext context, Product p, AppStore store) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
        title: const Text('Delete Product?', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
        content: Text('Remove "${p.name}" from ${store.activeShop.name} catalog?', style: const TextStyle(color: AppTheme.slate300, fontSize: 12)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.rose600),
            onPressed: () {
              store.deleteProduct(p.id);
              Navigator.pop(ctx);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final ent = store.entitlements;
    final currency = store.activeShop.currency;
    final categories = <String>{'All', ...store.products.map((p) => p.category)}.toList();
    if (!categories.contains(_selectedCategory)) {
      _selectedCategory = 'All';
    }

    final filtered = store.products.where((p) {
      final matchesCat = _selectedCategory == 'All' || p.category == _selectedCategory;
      final matchesSearch = _search.isEmpty ||
          p.name.toLowerCase().contains(_search.toLowerCase()) ||
          p.barcode.contains(_search) ||
          p.brand.toLowerCase().contains(_search.toLowerCase()) ||
          p.category.toLowerCase().contains(_search.toLowerCase());
      final matchesLowStock = !_onlyLowStock || p.isLowStock;
      final matchesExpiring = !(ent.allowExpiryAlerts && _onlyExpiring) || p.hasExpiryAlert;
      return matchesCat && matchesSearch && matchesLowStock && matchesExpiring;
    }).toList();

    return Column(
      children: [
        // Valuation & Stats Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          color: AppTheme.slate900,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Cost Value', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '$currency ${store.inventoryCostValue.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Retail Value', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '$currency ${store.inventoryRetailValue.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: ent.allowCloudSync ? 'Sync catalog to Firestore' : 'Cloud Sync requires Business Pro Monthly',
                    onPressed: !ent.allowCloudSync
                        ? () {
                            store.showToast('Cloud Sync requires Business Pro Monthly.');
                            showDialog(context: context, builder: (_) => const AuthModal());
                          }
                        : (store.isSyncingCloud ? null : () => store.syncAllToCloud()),
                    icon: Icon(
                      ent.allowCloudSync ? Icons.cloud_sync : Icons.lock_outline,
                      color: !ent.allowCloudSync
                          ? AppTheme.amber400
                          : (store.isSyncingCloud ? AppTheme.slate500 : AppTheme.indigo400),
                      size: 20,
                    ),
                  ),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.blue600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add Item', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        backgroundColor: Colors.transparent,
                        builder: (_) => const ProductFormModal(),
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: InputDecoration(
                  hintText: 'Filter by name, brand or barcode...',
                  hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                  prefixIcon: const Icon(Icons.search, size: 16, color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  contentPadding: const EdgeInsets.symmetric(vertical: 6),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                ),
                onChanged: (val) => setState(() => _search = val),
              ),
              const SizedBox(height: 8),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    FilterChip(
                      label: Text(
                        'Low Stock (${store.lowStockCount})',
                        style: TextStyle(
                          fontSize: 11,
                          color: _onlyLowStock ? Colors.white : AppTheme.slate300,
                          fontWeight: _onlyLowStock ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      selected: _onlyLowStock,
                      selectedColor: Colors.amber.shade800,
                      backgroundColor: AppTheme.slate950,
                      visualDensity: VisualDensity.compact,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      onSelected: (val) => setState(() => _onlyLowStock = val),
                    ),
                    const SizedBox(width: 6),
                    if (ent.allowExpiryAlerts)
                      FilterChip(
                        avatar: Icon(
                          Icons.event_busy,
                          size: 14,
                          color: _onlyExpiring ? Colors.white : (store.expiryAlertCount > 0 ? AppTheme.rose400 : AppTheme.slate400),
                        ),
                        label: Text(
                          'Expiring / Expired (${store.expiryAlertCount})',
                          style: TextStyle(
                            fontSize: 11,
                            color: _onlyExpiring ? Colors.white : (store.expiryAlertCount > 0 ? AppTheme.rose400 : AppTheme.slate300),
                            fontWeight: (_onlyExpiring || store.expiryAlertCount > 0) ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        selected: _onlyExpiring,
                        selectedColor: AppTheme.rose600,
                        backgroundColor: AppTheme.slate950,
                        visualDensity: VisualDensity.compact,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        onSelected: (val) => setState(() => _onlyExpiring = val),
                      )
                    else
                      ActionChip(
                        avatar: const Icon(Icons.lock_outline, size: 13, color: AppTheme.amber400),
                        label: const Text(
                          'Expiry Alerts (Pro)',
                          style: TextStyle(fontSize: 11, color: AppTheme.amber300, fontWeight: FontWeight.bold),
                        ),
                        backgroundColor: AppTheme.amber500.withValues(alpha: 0.1),
                        side: BorderSide(color: AppTheme.amber500.withValues(alpha: 0.35)),
                        visualDensity: VisualDensity.compact,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        onPressed: () {
                          store.showToast('Near-Expiry Alerts require Business Pro Monthly.');
                          showDialog(context: context, builder: (_) => const AuthModal());
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 32,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: categories.length,
                  itemBuilder: (ctx, i) {
                    final cat = categories[i];
                    final sel = _selectedCategory == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(cat, style: TextStyle(fontSize: 10, color: sel ? Colors.white : AppTheme.slate400)),
                        selected: sel,
                        selectedColor: AppTheme.blue600,
                        backgroundColor: AppTheme.slate950,
                        visualDensity: VisualDensity.compact,
                        onSelected: (v) {
                          if (v) setState(() => _selectedCategory = cat);
                        },
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),

        // Product Catalog List
        Expanded(
          child: filtered.isEmpty
              ? const Center(
                  child: Text('No products found', style: TextStyle(color: AppTheme.slate500)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final p = filtered[i];
                    final daysLeft = p.daysUntilExpiry;
                    final hasExpAlert = ent.allowExpiryAlerts && p.hasExpiryAlert;
                    final borderColor = (ent.allowExpiryAlerts && p.isExpired)
                        ? AppTheme.rose500.withValues(alpha: 0.55)
                        : (ent.allowExpiryAlerts && p.isNearExpiry)
                            ? Colors.orange.withValues(alpha: 0.55)
                            : p.isLowStock
                                ? Colors.amber.withValues(alpha: 0.5)
                                : AppTheme.slate800;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.slate900,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  p.name,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                const SizedBox(height: 4),
                                Wrap(
                                  spacing: 6,
                                  runSpacing: 4,
                                  children: [
                                    if (p.isLowStock)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.amber.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text('LOW STOCK', style: TextStyle(color: Colors.amberAccent, fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                    if (ent.allowExpiryAlerts && p.isExpired)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppTheme.rose500.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'EXPIRED (${daysLeft?.abs() ?? 0}d ago)',
                                          style: const TextStyle(color: AppTheme.rose400, fontSize: 9, fontWeight: FontWeight.bold),
                                        ),
                                      )
                                    else if (ent.allowExpiryAlerts && p.isNearExpiry)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Colors.orange.withValues(alpha: 0.2),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          daysLeft == 0 ? 'EXPIRES TODAY' : 'EXPIRING IN ${daysLeft}d',
                                          style: const TextStyle(color: Colors.orangeAccent, fontSize: 9, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'SKU: ${p.barcode} • ${p.category}${p.brand.isNotEmpty ? ' • ${p.brand}' : ''}',
                                  style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                ),
                                if (p.expiryDate != null && p.expiryDate!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Expiry: ${p.expiryDate}',
                                    style: TextStyle(
                                      color: hasExpAlert ? (p.isExpired ? AppTheme.rose400 : Colors.orangeAccent) : AppTheme.slate400,
                                      fontSize: 10,
                                      fontWeight: hasExpAlert ? FontWeight.bold : FontWeight.normal,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 4),
                                Wrap(
                                  spacing: 10,
                                  runSpacing: 2,
                                  children: [
                                    Text('Cost: $currency ${p.costPrice.round()}', style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                                    Text('Price: $currency ${p.sellingPrice.round()}', style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 11)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${p.stockQuantity} ${p.unitName}',
                                style: TextStyle(
                                  color: p.isLowStock ? Colors.amberAccent : Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    icon: const Icon(Icons.tune, size: 18, color: AppTheme.blue400),
                                    tooltip: 'Adjust stock',
                                    onPressed: () => _showStockAdjustDialog(context, p, store),
                                  ),
                                  const SizedBox(width: 10),
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    icon: const Icon(Icons.edit, size: 18, color: AppTheme.slate300),
                                    tooltip: 'Edit details',
                                    onPressed: () {
                                      showModalBottomSheet(
                                        context: context,
                                        isScrollControlled: true,
                                        backgroundColor: Colors.transparent,
                                        builder: (_) => ProductFormModal(productToEdit: p),
                                      );
                                    },
                                  ),
                                  const SizedBox(width: 10),
                                  IconButton(
                                    visualDensity: VisualDensity.compact,
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.rose400),
                                    tooltip: 'Delete product',
                                    onPressed: () => _confirmDeleteProduct(context, p, store),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
