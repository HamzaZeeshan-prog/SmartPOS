import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';

class RefundModal extends StatefulWidget {
  final Sale sale;

  const RefundModal({super.key, required this.sale});

  @override
  State<RefundModal> createState() => _RefundModalState();
}

class _RefundModalState extends State<RefundModal> {
  final Map<String, int> _refundQuantities = {};
  bool _restock = true;
  String _reason = 'Customer Request';

  @override
  void initState() {
    super.initState();
    for (final item in widget.sale.items) {
      _refundQuantities[item.product.id] = item.quantity;
    }
  }

  double get _totalRefundAmount {
    double total = 0;
    for (final item in widget.sale.items) {
      final qty = _refundQuantities[item.product.id] ?? 0;
      total += qty * item.unitPrice;
    }
    return total;
  }

  void _submitRefund(AppStore store) {
    if (_totalRefundAmount <= 0) {
      store.showToast('Please select at least 1 item quantity to refund');
      return;
    }

    final List<RefundItem> itemsToRefund = [];
    for (final item in widget.sale.items) {
      final qty = _refundQuantities[item.product.id] ?? 0;
      if (qty > 0) {
        itemsToRefund.add(RefundItem(
          productId: item.product.id,
          productName: item.product.name,
          quantityRefunded: qty,
          unitPrice: item.unitPrice,
          subtotal: qty * item.unitPrice,
        ));
      }
    }

    store.confirmRefund(
      saleId: widget.sale.id,
      refundAmount: _totalRefundAmount,
      itemsToRefund: itemsToRefund,
      reason: _reason,
      restock: _restock,
    );

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final currency = store.activeShop.currency;

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: [
                const Icon(Icons.assignment_return, color: Colors.amberAccent),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Refund Invoice #${widget.sale.invoiceNumber}', overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                      const Text('Item Return & Restock Manager', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 11)),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppTheme.slate400),
                ),
              ],
            ),
          ),
          const Divider(color: AppTheme.slate800, height: 1),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                const Text('SELECT ITEMS & RETURN QUANTITIES', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 8),
                ...widget.sale.items.map((item) {
                  final curQty = _refundQuantities[item.product.id] ?? 0;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.slate950,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.slate800),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.product.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                              Text('Billed: ${item.quantity} x $currency ${item.unitPrice.round()}', style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                            ],
                          ),
                        ),
                        // Qty selector
                        Row(
                          children: [
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              constraints: const BoxConstraints(),
                              icon: const Icon(Icons.remove_circle_outline, color: AppTheme.slate400, size: 20),
                              onPressed: curQty > 0 ? () => setState(() => _refundQuantities[item.product.id] = curQty - 1) : null,
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              child: Text('$curQty', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            ),
                            IconButton(
                              visualDensity: VisualDensity.compact,
                              constraints: const BoxConstraints(),
                              icon: const Icon(Icons.add_circle_outline, color: AppTheme.blue400, size: 20),
                              onPressed: curQty < item.quantity ? () => setState(() => _refundQuantities[item.product.id] = curQty + 1) : null,
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),

                const SizedBox(height: 12),

                // Restock checkbox
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: CheckboxListTile(
                    dense: true,
                    title: const Text('Restock returned items back to inventory', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    subtitle: const Text('Automatically adds quantity back into inventory stock', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                    value: _restock,
                    activeColor: AppTheme.emerald600,
                    onChanged: (val) => setState(() => _restock = val ?? true),
                  ),
                ),

                const SizedBox(height: 12),

                // Reason dropdown
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('RETURN REASON', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: _reason,
                      isExpanded: true,
                      dropdownColor: AppTheme.slate900,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppTheme.slate950,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                      ),
                      items: [
                        'Customer Request',
                        'Defective / Damaged Item',
                        'Wrong Product Billed',
                        'Quality Issue',
                        'Other',
                      ].map((r) => DropdownMenuItem(value: r, child: Text(r, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)))).toList(),
                      onChanged: (r) => setState(() => _reason = r ?? 'Customer Request'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Action
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppTheme.slate950,
              border: Border(top: BorderSide(color: AppTheme.slate800)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber.shade700,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.assignment_return, size: 18),
                label: Text('Issue Refund • $currency ${_totalRefundAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () => _submitRefund(store),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
