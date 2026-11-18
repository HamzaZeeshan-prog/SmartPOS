import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../widgets/modals/scanner_modal.dart';
import '../widgets/modals/payment_modal.dart';

class PosTerminalScreen extends StatefulWidget {
  const PosTerminalScreen({super.key});

  @override
  State<PosTerminalScreen> createState() => _PosTerminalScreenState();
}

class _PosTerminalScreenState extends State<PosTerminalScreen> {
  String _selectedCategory = 'All';
  String _searchQuery = '';
  int _mobileTab = 0; // 0 = Catalog, 1 = Cart & Checkout
  final List<CartItem> _cart = [];
  Customer? _selectedCustomer;
  String? _lastShopId;

  // Cart-level adjustments (Discount toggle mirrors GST toggle)
  bool _discountEnabled = false;
  bool _billDiscountIsPercent = true;
  double _billDiscountValue = 0;
  bool _taxEnabled = true;
  double _deliveryCharge = 0;

  final _searchController = TextEditingController();
  final _discountCtrl = TextEditingController(text: '0');
  final _deliveryCtrl = TextEditingController(text: '0');

  @override
  void dispose() {
    _searchController.dispose();
    _discountCtrl.dispose();
    _deliveryCtrl.dispose();
    super.dispose();
  }

  void _syncWithShop(AppStore store) {
    if (_lastShopId != store.activeShop.id) {
      _lastShopId = store.activeShop.id;
      _cart.clear();
      _selectedCustomer = null;
      _selectedCategory = 'All';
      _taxEnabled = store.activeShop.taxEnabled;
      _discountEnabled = store.activeShop.discountEnabled;
      _billDiscountIsPercent = store.activeShop.discountEnabled;
      _billDiscountValue = store.activeShop.discountEnabled ? store.activeShop.defaultDiscountRate : 0;
      _deliveryCharge = 0;
      _discountCtrl.text = _billDiscountValue > 0 ? _billDiscountValue.toStringAsFixed(0) : '0';
      _deliveryCtrl.text = '0';
    }
  }

  void _addToCart(Product product, {int quantity = 1}) {
    final store = context.read<AppStore>();
    final safeQty = quantity.clamp(1, 9999);
    final existingIdx = _cart.indexWhere((item) => item.product.id == product.id);
    final existingQty = existingIdx >= 0 ? _cart[existingIdx].quantity : 0;

    if (!store.activeShop.allowNegativeStock && existingQty + safeQty > product.stockQuantity) {
      store.showToast(
        product.stockQuantity <= 0
            ? 'Out of stock: ${product.name}'
            : 'Only ${product.stockQuantity - existingQty} remaining in stock for ${product.name}',
      );
      return;
    }

    setState(() {
      if (existingIdx >= 0) {
        _cart[existingIdx] = _cart[existingIdx].copyWith(quantity: _cart[existingIdx].quantity + safeQty);
      } else {
        _cart.add(CartItem(
          id: 'item_${DateTime.now().millisecondsSinceEpoch}_${product.id}',
          product: product,
          quantity: safeQty,
          unitPrice: product.sellingPrice,
          itemTaxRate: product.taxPercentage,
        ));
      }
    });
  }

  Future<void> _showScannedQuantityDialog(Product product, AppStore store) async {
    final qtyCtrl = TextEditingController(text: '1');
    int qtyValue = 1;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) {
          final currency = store.activeShop.currency;
          final maxAllowed = store.activeShop.allowNegativeStock ? 9999 : product.stockQuantity.clamp(0, 9999);

          void setQty(int next) {
            final clamped = next.clamp(1, maxAllowed > 0 ? maxAllowed : 9999);
            setDlgState(() {
              qtyValue = clamped;
              qtyCtrl.text = '$clamped';
              qtyCtrl.selection = TextSelection.collapsed(offset: qtyCtrl.text.length);
            });
          }

          return AlertDialog(
            backgroundColor: AppTheme.slate900,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
              side: const BorderSide(color: AppTheme.blue500, width: 1.5),
            ),
            titlePadding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            contentPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.blue600.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.qr_code_2, color: AppTheme.blue400, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Product Detected',
                        style: TextStyle(color: AppTheme.emerald400, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        product.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.slate950,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.slate800),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Unit Price: $currency ${product.sellingPrice.round()}',
                              style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                            Text(
                              'Stock: ${product.stockQuantity} ${product.unitName}',
                              style: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                            ),
                          ],
                        ),
                        if (product.hasExpiryAlert) ...[
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: (product.isExpired ? AppTheme.rose500 : AppTheme.amber500).withValues(alpha: 0.16),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              product.isExpired
                                  ? 'WARNING: Expired (${product.expiryDate})'
                                  : 'Alert: Expires in ${product.daysUntilExpiry} days (${product.expiryDate})',
                              style: TextStyle(
                                color: product.isExpired ? AppTheme.rose400 : AppTheme.amber400,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Enter Quantity to Add:',
                    style: TextStyle(color: AppTheme.slate300, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      IconButton.filled(
                        style: IconButton.styleFrom(backgroundColor: AppTheme.slate800),
                        onPressed: () => setQty(qtyValue - 1),
                        icon: const Icon(Icons.remove, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: qtyCtrl,
                          autofocus: true,
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: AppTheme.slate950,
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onChanged: (v) {
                            final parsed = int.tryParse(v) ?? 1;
                            setDlgState(() => qtyValue = parsed.clamp(1, 9999));
                          },
                          onSubmitted: (_) {
                            final finalQty = int.tryParse(qtyCtrl.text) ?? qtyValue;
                            _addToCart(product, quantity: finalQty);
                            store.showToast('Added $finalQty x ${product.name}');
                            Navigator.pop(ctx);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        style: IconButton.styleFrom(backgroundColor: AppTheme.blue600),
                        onPressed: () => setQty(qtyValue + 1),
                        icon: const Icon(Icons.add, color: Colors.white, size: 18),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    alignment: WrapAlignment.center,
                    children: [1, 2, 5, 10].map((preset) {
                      return ChoiceChip(
                        label: Text('x$preset', style: const TextStyle(fontSize: 11, color: Colors.white)),
                        selected: qtyValue == preset,
                        selectedColor: AppTheme.blue600,
                        backgroundColor: AppTheme.slate950,
                        onSelected: (_) => setQty(preset),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Line Total: $currency ${(product.sellingPrice * qtyValue).round()}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400)),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600, foregroundColor: Colors.white),
                onPressed: () {
                  final finalQty = int.tryParse(qtyCtrl.text) ?? qtyValue;
                  _addToCart(product, quantity: finalQty);
                  store.showToast('Added $finalQty x ${product.name}');
                  Navigator.pop(ctx);
                },
                icon: const Icon(Icons.add_shopping_cart, size: 16),
                label: const Text('Add to Cart', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _removeFromCart(String productId) {
    setState(() {
      _cart.removeWhere((item) => item.product.id == productId);
    });
  }

  void _updateQuantity(String productId, int delta) {
    final store = context.read<AppStore>();
    setState(() {
      final index = _cart.indexWhere((item) => item.product.id == productId);
      if (index >= 0) {
        final newQty = _cart[index].quantity + delta;
        if (newQty <= 0) {
          _cart.removeAt(index);
        } else if (store.activeShop.allowNegativeStock || newQty <= _cart[index].product.stockQuantity) {
          _cart[index] = _cart[index].copyWith(quantity: newQty);
        } else {
          store.showToast('Max available stock reached (${_cart[index].product.stockQuantity})');
        }
      }
    });
  }

  void _showItemEditDialog(CartItem item, String currency) {
    final discCtrl = TextEditingController(text: item.itemDiscount.toStringAsFixed(0));
    final noteCtrl = TextEditingController(text: item.note ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
        title: Text('Edit: ${item.product.name}', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: discCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Line Item Discount ($currency)',
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: noteCtrl,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Item Note (e.g. chilled, gift wrap)',
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600),
            onPressed: () {
              final disc = (double.tryParse(discCtrl.text) ?? 0).clamp(0.0, item.unitPrice * item.quantity);
              setState(() {
                final idx = _cart.indexWhere((c) => c.id == item.id);
                if (idx >= 0) {
                  _cart[idx] = _cart[idx].copyWith(
                    itemDiscount: disc,
                    note: noteCtrl.text.trim().isNotEmpty ? noteCtrl.text.trim() : null,
                  );
                }
              });
              Navigator.pop(ctx);
            },
            child: const Text('Apply', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showHeldSalesSheet(AppStore store) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.slate900,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.pause_circle, color: AppTheme.amber400),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('Held Bills (${store.heldSales.length})', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                ),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, color: AppTheme.slate400)),
              ],
            ),
            const Divider(color: AppTheme.slate800),
            if (store.heldSales.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(child: Text('No held bills in queue', style: TextStyle(color: AppTheme.slate500))),
              )
            else
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: store.heldSales.map((h) {
                    final total = h.items.fold(0.0, (s, i) => s + i.lineTotal);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(color: AppTheme.slate950, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppTheme.slate800)),
                      child: ListTile(
                        dense: true,
                        title: Text('${h.items.length} items • ${store.activeShop.currency} ${total.round()}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        subtitle: Text('${h.customerName ?? 'Walk-in'} • Held at ${h.timeLabel}', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600, visualDensity: VisualDensity.compact),
                          onPressed: () {
                            final resumed = store.resumeHeldSale(h.id);
                            if (resumed != null) {
                              setState(() {
                                _cart
                                  ..clear()
                                  ..addAll(resumed.items);
                                _selectedCustomer = resumed.customerId != null
                                    ? store.customers.cast<Customer?>().firstWhere((c) => c?.id == resumed.customerId, orElse: () => null)
                                    : null;
                                _mobileTab = 1;
                              });
                            }
                            Navigator.pop(ctx);
                          },
                          child: const Text('Resume', style: TextStyle(color: Colors.white, fontSize: 11)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleBarcodeScanned(String barcode, AppStore store) async {
    final prod = store.findProductByBarcode(barcode);
    await Future.delayed(const Duration(milliseconds: 140));
    if (!mounted) return;

    if (prod != null) {
      await _showScannedQuantityDialog(prod, store);
    } else {
      store.showToast('Product with barcode $barcode not found');
    }
  }

  Future<void> _showCustomerSearchSheet(AppStore store, String currency) async {
    String q = '';
    final searchCtrl = TextEditingController();

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final term = q.trim().toLowerCase();
          final matches = store.customers.where((c) {
            if (term.isEmpty) return true;
            return c.name.toLowerCase().contains(term) ||
                c.phone.toLowerCase().contains(term) ||
                c.address.toLowerCase().contains(term);
          }).toList();

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Container(
              height: MediaQuery.of(ctx).size.height * 0.72,
              decoration: const BoxDecoration(
                color: AppTheme.slate900,
                borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
                border: Border(top: BorderSide(color: AppTheme.slate800)),
              ),
              child: Column(
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(color: AppTheme.slate700, borderRadius: BorderRadius.circular(2)),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 12, 8),
                    child: Row(
                      children: [
                        const Icon(Icons.person_search, color: AppTheme.blue400, size: 20),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Select Khata / Customer',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () async {
                            final nameCtrl = TextEditingController(text: q.trim());
                            final phoneCtrl = TextEditingController(text: '+92 3');
                            final addrCtrl = TextEditingController();
                            final created = await showDialog<Customer>(
                              context: ctx,
                              builder: (dCtx) => AlertDialog(
                                backgroundColor: AppTheme.slate900,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
                                title: const Text('New Khata Customer', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                                content: SingleChildScrollView(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      TextField(controller: nameCtrl, autofocus: true, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Full Name *', labelStyle: TextStyle(color: AppTheme.slate400))),
                                      const SizedBox(height: 8),
                                      TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Phone / WhatsApp *', labelStyle: TextStyle(color: AppTheme.slate400))),
                                      const SizedBox(height: 8),
                                      TextField(controller: addrCtrl, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Area / City', labelStyle: TextStyle(color: AppTheme.slate400))),
                                    ],
                                  ),
                                ),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400))),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600),
                                    onPressed: () {
                                      if (nameCtrl.text.trim().isEmpty) return;
                                      final newCust = store.addCustomer(Customer(
                                        id: 'cust_${DateTime.now().millisecondsSinceEpoch}',
                                        shopId: store.activeShop.id,
                                        name: nameCtrl.text.trim(),
                                        phone: phoneCtrl.text.trim(),
                                        address: addrCtrl.text.trim(),
                                      ));
                                      Navigator.pop(dCtx, newCust);
                                    },
                                    child: const Text('Save & Select', style: TextStyle(color: Colors.white)),
                                  ),
                                ],
                              ),
                            );
                            if (created != null && mounted) {
                              setState(() => _selectedCustomer = created);
                              if (sheetCtx.mounted) Navigator.pop(sheetCtx);
                            }
                          },
                          icon: const Icon(Icons.person_add, size: 15, color: AppTheme.emerald400),
                          label: const Text('+ New', style: TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                        IconButton(
                          visualDensity: VisualDensity.compact,
                          onPressed: () => Navigator.pop(sheetCtx),
                          icon: const Icon(Icons.close, color: AppTheme.slate400, size: 19),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: TextField(
                      controller: searchCtrl,
                      autofocus: true,
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'Search by customer name, phone or address...',
                        hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 12),
                        prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.slate400),
                        suffixIcon: q.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16, color: AppTheme.slate400),
                                onPressed: () {
                                  searchCtrl.clear();
                                  setSheetState(() => q = '');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppTheme.slate950,
                        isDense: true,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                      ),
                      onChanged: (v) => setSheetState(() => q = v),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      children: [
                        Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: _selectedCustomer == null ? AppTheme.blue600.withValues(alpha: 0.15) : AppTheme.slate950,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: _selectedCustomer == null ? AppTheme.blue500 : AppTheme.slate800),
                          ),
                          child: ListTile(
                            dense: true,
                            leading: const Icon(Icons.directions_walk, color: AppTheme.slate300, size: 19),
                            title: const Text('Walk-in Customer', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            subtitle: const Text('Cash / instant retail sale (No Khata credit)', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                            trailing: _selectedCustomer == null ? const Icon(Icons.check_circle, color: AppTheme.blue400, size: 18) : null,
                            onTap: () {
                              setState(() => _selectedCustomer = null);
                              Navigator.pop(sheetCtx);
                            },
                          ),
                        ),
                        if (matches.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 28),
                            child: Center(
                              child: Text(
                                'No Khata customer matched. Tap "+ New" above to add.',
                                style: TextStyle(color: AppTheme.slate500, fontSize: 12),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          )
                        else
                          ...matches.map((c) {
                            final isSel = _selectedCustomer?.id == c.id;
                            final hasDue = c.dueBalance > 0;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 6),
                              decoration: BoxDecoration(
                                color: isSel ? AppTheme.blue600.withValues(alpha: 0.16) : AppTheme.slate950,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: isSel ? AppTheme.blue500 : AppTheme.slate800),
                              ),
                              child: ListTile(
                                dense: true,
                                leading: CircleAvatar(
                                  radius: 15,
                                  backgroundColor: (hasDue ? AppTheme.amber500 : AppTheme.emerald500).withValues(alpha: 0.2),
                                  child: Text(
                                    c.name.isNotEmpty ? c.name[0].toUpperCase() : '?',
                                    style: TextStyle(color: hasDue ? AppTheme.amber400 : AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                ),
                                title: Text(c.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12.5)),
                                subtitle: Text(
                                  c.address.isNotEmpty ? '${c.phone} • ${c.address}' : c.phone,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      hasDue ? 'Due $currency ${c.dueBalance.round()}' : 'Clear',
                                      style: TextStyle(
                                        color: hasDue ? AppTheme.amber400 : AppTheme.emerald400,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 11,
                                      ),
                                    ),
                                    if (isSel) const Icon(Icons.check_circle, color: AppTheme.blue400, size: 14),
                                  ],
                                ),
                                onTap: () {
                                  setState(() => _selectedCustomer = c);
                                  Navigator.pop(sheetCtx);
                                },
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  double get _rawSubtotal => _cart.fold(0.0, (sum, item) => sum + (item.unitPrice * item.quantity));
  double get _itemDiscounts => _cart.fold(0.0, (sum, item) => sum + item.itemDiscount);
  double get _billDiscount {
    if (!_discountEnabled) return 0;
    return _billDiscountIsPercent
        ? (_rawSubtotal * _billDiscountValue.clamp(0, 100)) / 100
        : _billDiscountValue.clamp(0, _rawSubtotal);
  }

  double get _totalDiscount => _itemDiscounts + _billDiscount;
  double get _taxableSubtotal => (_rawSubtotal - _totalDiscount).clamp(0.0, double.infinity);

  double get _taxTotal {
    final store = context.read<AppStore>();
    if (!_taxEnabled || _cart.isEmpty || _rawSubtotal <= 0) return 0;
    return _cart.fold(0.0, (sum, item) {
      final share = (item.unitPrice * item.quantity) / _rawSubtotal;
      final itemTaxable = _taxableSubtotal * share;
      final rate = item.itemTaxRate > 0 ? item.itemTaxRate : store.activeShop.defaultTaxRate;
      return sum + ((itemTaxable * rate) / 100);
    });
  }

  double get _grandTotal => (_taxableSubtotal + _taxTotal + _deliveryCharge).roundToDouble();

  void _openPaymentModal(AppStore store) {
    if (_cart.isEmpty) {
      store.showToast('Cart is empty. Add products to checkout.');
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PaymentModal(
        cart: List.from(_cart),
        subtotal: _rawSubtotal,
        discountTotal: _totalDiscount,
        taxTotal: _taxTotal,
        deliveryCharge: _deliveryCharge,
        grandTotal: _grandTotal,
        selectedCustomer: _selectedCustomer,
      ),
    ).then((completed) {
      if (completed == true) {
        setState(() {
          _cart.clear();
          _selectedCustomer = null;
          _discountEnabled = store.activeShop.discountEnabled;
          _billDiscountValue = _discountEnabled ? store.activeShop.defaultDiscountRate : 0;
          _deliveryCharge = 0;
          _discountCtrl.text = _billDiscountValue > 0 ? _billDiscountValue.toStringAsFixed(0) : '0';
          _deliveryCtrl.text = '0';
          _mobileTab = 0;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    _syncWithShop(store);

    final currency = store.activeShop.currency;
    final dynamicCats = <String>{'All', ...store.products.map((p) => p.category)}.toList();
    if (!dynamicCats.contains(_selectedCategory)) {
      _selectedCategory = 'All';
    }

    final filtered = store.products.where((p) {
      final matchesCategory = _selectedCategory == 'All' || p.category.toLowerCase() == _selectedCategory.toLowerCase();
      final q = _searchQuery.toLowerCase().trim();
      final matchesSearch = q.isEmpty ||
          p.name.toLowerCase().contains(q) ||
          p.barcode.toLowerCase().contains(q) ||
          p.brand.toLowerCase().contains(q) ||
          p.category.toLowerCase().contains(q);
      return matchesCategory && matchesSearch;
    }).toList();

    return Column(
      children: [
        // Top Segmented Switch: Catalog vs Cart + Held Sales
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: AppTheme.slate900,
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(3),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _mobileTab = 0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 7),
                            decoration: BoxDecoration(
                              color: _mobileTab == 0 ? AppTheme.blue600 : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(
                                'Catalog (${store.products.length})',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: _mobileTab == 0 ? Colors.white : AppTheme.slate400,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _mobileTab = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 4),
                            decoration: BoxDecoration(
                              color: _mobileTab == 1 ? AppTheme.emerald600 : Colors.transparent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(
                                'Cart (${_cart.length})${_cart.isNotEmpty ? ' • $currency ${_grandTotal.round()}' : ''}',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: _mobileTab == 1 ? Colors.white : AppTheme.slate400,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (store.heldSales.isNotEmpty) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => _showHeldSalesSheet(store),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.amber500.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.play_circle_outline, size: 15, color: AppTheme.amber400),
                        const SizedBox(width: 4),
                        Text('Held (${store.heldSales.length})', style: const TextStyle(color: AppTheme.amber400, fontWeight: FontWeight.bold, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),

        Expanded(
          child: _mobileTab == 0
              ? _buildCatalogView(store, currency, dynamicCats, filtered)
              : _buildCartView(store, currency),
        ),

        // Persistent Checkout Bottom Bar on Catalog Tab
        if (_mobileTab == 0 && _cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: const BoxDecoration(
              color: AppTheme.slate900,
              border: Border(top: BorderSide(color: AppTheme.slate800)),
            ),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => setState(() => _mobileTab = 1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    decoration: BoxDecoration(
                      color: AppTheme.slate950,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.slate800),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.shopping_cart, size: 16, color: AppTheme.blue400),
                        const SizedBox(width: 5),
                        Text('${_cart.length} items', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Grand Total', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text('$currency ${_grandTotal.round()}', style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.w900, fontSize: 15)),
                      ),
                    ],
                  ),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.emerald600,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('PAY NOW', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                  onPressed: () => _openPaymentModal(store),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildCatalogView(AppStore store, String currency, List<String> categories, List<Product> filtered) {
    return Column(
      children: [
        // Search & Scanner Bar
        Container(
          padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
          color: AppTheme.slate900,
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search or scan barcode...',
                    hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 12),
                    prefixIcon: const Icon(Icons.search, size: 18, color: AppTheme.slate400),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 16, color: AppTheme.slate400),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: AppTheme.slate950,
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                  onSubmitted: (val) {
                    final code = val.trim();
                    if (code.isEmpty) return;
                    final exact = store.findProductByBarcode(code);
                    if (exact != null) {
                      _searchController.clear();
                      setState(() => _searchQuery = '');
                      _showScannedQuantityDialog(exact, store);
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                style: IconButton.styleFrom(
                  backgroundColor: AppTheme.blue600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.qr_code_scanner, size: 20),
                onPressed: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => ScannerModal(
                      onScanned: (code) => _handleBarcodeScanned(code, store),
                    ),
                  );
                },
              ),
            ],
          ),
        ),

        // Dynamic Category Horizontal Tabs
        Container(
          height: 44,
          color: AppTheme.slate900,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            itemCount: categories.length,
            itemBuilder: (ctx, i) {
              final cat = categories[i];
              final isSel = _selectedCategory == cat;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: ChoiceChip(
                  label: Text(
                    cat,
                    style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal, color: isSel ? Colors.white : AppTheme.slate400),
                  ),
                  selected: isSel,
                  selectedColor: AppTheme.blue600,
                  backgroundColor: AppTheme.slate950,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSel ? AppTheme.blue500 : AppTheme.slate800)),
                  onSelected: (val) {
                    if (val) setState(() => _selectedCategory = cat);
                  },
                ),
              );
            },
          ),
        ),

        // Responsive Product Grid
        Expanded(
          child: filtered.isEmpty
              ? const Center(
                  child: Text('No products found in this shop category', style: TextStyle(color: AppTheme.slate500)),
                )
              : LayoutBuilder(
                  builder: (ctx, constraints) {
                    final cols = constraints.maxWidth > 540 ? 3 : 2;
                    return GridView.builder(
                      padding: const EdgeInsets.all(10),
                      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: cols,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        mainAxisExtent: 156,
                      ),
                      itemCount: filtered.length,
                      itemBuilder: (ctx, i) {
                        final p = filtered[i];
                        final inCartQty = _cart.where((c) => c.product.id == p.id).fold(0, (sum, c) => sum + c.quantity);

                        return GestureDetector(
                          onTap: () => _addToCart(p),
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: AppTheme.slate900,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: inCartQty > 0
                                    ? AppTheme.blue500
                                    : (p.isExpired ? AppTheme.rose500.withValues(alpha: 0.7) : AppTheme.slate800),
                                width: inCartQty > 0 ? 1.5 : 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Flexible(
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: p.isLowStock ? Colors.amber.withValues(alpha: 0.2) : AppTheme.slate800,
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          p.stockQuantity <= 0 ? 'Out' : '${p.stockQuantity} ${p.unitName}',
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontWeight: FontWeight.bold,
                                            color: p.isLowStock ? Colors.amberAccent : AppTheme.slate400,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    if (inCartQty > 0)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(color: AppTheme.blue600, borderRadius: BorderRadius.circular(10)),
                                        child: Text('$inCartQty', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                                      )
                                    else if (p.hasExpiryAlert)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: (p.isExpired ? AppTheme.rose500 : AppTheme.amber500).withValues(alpha: 0.18),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          p.isExpired ? 'EXP' : '${p.daysUntilExpiry}d',
                                          style: TextStyle(
                                            fontSize: 8,
                                            fontWeight: FontWeight.bold,
                                            color: p.isExpired ? AppTheme.rose400 : AppTheme.amber400,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                const Spacer(),
                                Text(
                                  p.name,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  p.brand.isNotEmpty ? '${p.category} • ${p.brand}' : p.category,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppTheme.slate500, fontSize: 10),
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        '$currency ${p.sellingPrice.round()}',
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.w900, fontSize: 12.5),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: AppTheme.blue600.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Icon(Icons.add, size: 14, color: AppTheme.blue400),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildCartView(AppStore store, String currency) {
    return Column(
      children: [
        // Cart Action Bar (Hold, Resume, Clear) & Customer Dropdown
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: AppTheme.slate900,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => _showCustomerSearchSheet(store, currency),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
                        decoration: BoxDecoration(
                          color: AppTheme.slate950,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _selectedCustomer != null ? AppTheme.blue500 : AppTheme.slate800,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.person_search,
                              size: 16,
                              color: _selectedCustomer != null ? AppTheme.blue400 : AppTheme.slate400,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _selectedCustomer != null
                                    ? '${_selectedCustomer!.name} (${_selectedCustomer!.phone})'
                                    : 'Search Khata Customer / Walk-in...',
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  color: _selectedCustomer != null ? Colors.white : AppTheme.slate400,
                                  fontSize: 11.5,
                                  fontWeight: _selectedCustomer != null ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                            if (_selectedCustomer != null)
                              GestureDetector(
                                onTap: () => setState(() => _selectedCustomer = null),
                                child: const Padding(
                                  padding: EdgeInsets.only(left: 4),
                                  child: Icon(Icons.close, size: 15, color: AppTheme.slate400),
                                ),
                              )
                            else
                              const Icon(Icons.keyboard_arrow_down, size: 16, color: AppTheme.slate400),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    tooltip: 'Hold Sale',
                    visualDensity: VisualDensity.compact,
                    onPressed: _cart.isEmpty
                        ? null
                        : () {
                            store.holdSale(_cart, _selectedCustomer);
                            setState(() {
                              _cart.clear();
                              _selectedCustomer = null;
                              _billDiscountValue = _discountEnabled ? store.activeShop.defaultDiscountRate : 0;
                              _deliveryCharge = 0;
                              _discountCtrl.text = _billDiscountValue > 0 ? _billDiscountValue.toStringAsFixed(0) : '0';
                              _deliveryCtrl.text = '0';
                            });
                          },
                    icon: const Icon(Icons.pause_circle_outline, color: AppTheme.amber400, size: 22),
                  ),
                  IconButton(
                    tooltip: 'Clear Cart',
                    visualDensity: VisualDensity.compact,
                    onPressed: _cart.isEmpty
                        ? null
                        : () {
                            setState(() {
                              _cart.clear();
                              _billDiscountValue = _discountEnabled ? store.activeShop.defaultDiscountRate : 0;
                              _deliveryCharge = 0;
                              _discountCtrl.text = _billDiscountValue > 0 ? _billDiscountValue.toStringAsFixed(0) : '0';
                              _deliveryCtrl.text = '0';
                            });
                          },
                    icon: const Icon(Icons.delete_sweep, color: AppTheme.rose400, size: 22),
                  ),
                ],
              ),
              if (_selectedCustomer != null && _selectedCustomer!.dueBalance > 0) ...[
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.amber500.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber, size: 14, color: AppTheme.amber400),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${_selectedCustomer!.name} has existing Khata due: $currency ${_selectedCustomer!.dueBalance.round()}',
                          style: const TextStyle(color: AppTheme.amber400, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        // Responsive Cart Items List
        Expanded(
          child: _cart.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.shopping_cart_outlined, size: 42, color: AppTheme.slate600),
                      const SizedBox(height: 8),
                      const Text('Cart is empty', style: TextStyle(color: AppTheme.slate400, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600, foregroundColor: Colors.white),
                        onPressed: () => setState(() => _mobileTab = 0),
                        child: const Text('Browse Catalog'),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(10),
                  itemCount: _cart.length,
                  itemBuilder: (ctx, i) {
                    final item = _cart[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.slate900,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.slate800),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.product.name,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '$currency ${item.unitPrice.round()} each${item.itemDiscount > 0 ? ' • Disc -$currency ${item.itemDiscount.round()}' : ''}',
                                      style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '$currency ${item.lineTotal.round()}',
                                style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(width: 4),
                              InkWell(
                                onTap: () => _removeFromCart(item.product.id),
                                borderRadius: BorderRadius.circular(6),
                                child: const Padding(
                                  padding: EdgeInsets.all(2),
                                  child: Icon(Icons.close, size: 16, color: AppTheme.slate500),
                                ),
                              ),
                            ],
                          ),
                          if (item.note != null && item.note!.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text('Note: ${item.note}', style: const TextStyle(color: AppTheme.cyan400, fontSize: 10, fontStyle: FontStyle.italic)),
                          ],
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              InkWell(
                                onTap: () => _showItemEditDialog(item, currency),
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.slate950,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: AppTheme.slate800),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.edit_note, size: 14, color: AppTheme.blue400),
                                      SizedBox(width: 4),
                                      Text('Item Disc / Note', style: TextStyle(color: AppTheme.slate300, fontSize: 10)),
                                    ],
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Container(
                                decoration: BoxDecoration(
                                  color: AppTheme.slate950,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.slate800),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    InkWell(
                                      onTap: () => _updateQuantity(item.product.id, -1),
                                      child: const Padding(
                                        padding: EdgeInsets.all(6),
                                        child: Icon(Icons.remove, size: 15, color: AppTheme.slate300),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 8),
                                      child: Text('${item.quantity}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                    ),
                                    InkWell(
                                      onTap: () => _updateQuantity(item.product.id, 1),
                                      child: const Padding(
                                        padding: EdgeInsets.all(6),
                                        child: Icon(Icons.add, size: 15, color: AppTheme.blue400),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),

        // Cart Financial Adjustments (Optional Discount toggle like GST + Delivery Fee)
        if (_cart.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: AppTheme.slate900,
              border: Border(top: BorderSide(color: AppTheme.slate800)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _discountEnabled = !_discountEnabled;
                          if (_discountEnabled && _billDiscountValue == 0) {
                            _billDiscountValue = store.activeShop.defaultDiscountRate > 0 ? store.activeShop.defaultDiscountRate : 5;
                            _billDiscountIsPercent = true;
                            _discountCtrl.text = _billDiscountValue.toStringAsFixed(0);
                          }
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: _discountEnabled ? AppTheme.amber500.withValues(alpha: 0.15) : AppTheme.slate950,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _discountEnabled ? AppTheme.amber500 : AppTheme.slate800),
                        ),
                        child: Text(
                          'Disc ${_discountEnabled ? 'ON' : 'OFF'}',
                          style: TextStyle(color: _discountEnabled ? AppTheme.amber400 : AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _taxEnabled = !_taxEnabled),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: _taxEnabled ? AppTheme.emerald500.withValues(alpha: 0.15) : AppTheme.slate950,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: _taxEnabled ? AppTheme.emerald500 : AppTheme.slate800),
                        ),
                        child: Text(
                          'GST ${_taxEnabled ? 'ON' : 'OFF'}',
                          style: TextStyle(color: _taxEnabled ? AppTheme.emerald400 : AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    if (_discountEnabled)
                      GestureDetector(
                        onTap: () => setState(() => _billDiscountIsPercent = !_billDiscountIsPercent),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
                          decoration: BoxDecoration(
                            color: AppTheme.slate950,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.slate700),
                          ),
                          child: Text(
                            _billDiscountIsPercent ? 'Mode: %' : 'Mode: $currency',
                            style: const TextStyle(color: AppTheme.cyan400, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (_discountEnabled) ...[
                      Expanded(
                        child: TextField(
                          controller: _discountCtrl,
                          keyboardType: TextInputType.number,
                          style: const TextStyle(color: Colors.white, fontSize: 12),
                          decoration: InputDecoration(
                            prefixText: _billDiscountIsPercent ? 'Disc % ' : 'Disc $currency ',
                            prefixStyle: const TextStyle(color: AppTheme.amber400, fontSize: 10, fontWeight: FontWeight.bold),
                            isDense: true,
                            filled: true,
                            fillColor: AppTheme.slate950,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onChanged: (v) => setState(() => _billDiscountValue = double.tryParse(v) ?? 0),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Expanded(
                      child: TextField(
                        controller: _deliveryCtrl,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                        decoration: InputDecoration(
                          prefixText: 'Del ',
                          prefixStyle: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                          isDense: true,
                          filled: true,
                          fillColor: AppTheme.slate950,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onChanged: (v) => setState(() => _deliveryCharge = (double.tryParse(v) ?? 0).clamp(0, 99999)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 4,
                  alignment: WrapAlignment.spaceBetween,
                  children: [
                    Text('Subtotal: $currency ${_rawSubtotal.round()}', style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                    if (_totalDiscount > 0)
                      Text('Disc: -$currency ${_totalDiscount.round()}', style: const TextStyle(color: AppTheme.emerald400, fontSize: 11)),
                    if (_taxTotal > 0)
                      Text('Tax: +$currency ${_taxTotal.round()}', style: const TextStyle(color: AppTheme.slate300, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Expanded(
                      child: Text('Grand Total Payable:', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                    Text('$currency ${_grandTotal.round()}', style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.w900, fontSize: 17)),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.emerald600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => _openPaymentModal(store),
                    icon: const Icon(Icons.payments, size: 18),
                    label: Text('PROCEED TO CHECKOUT • $currency ${_grandTotal.round()}', overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
