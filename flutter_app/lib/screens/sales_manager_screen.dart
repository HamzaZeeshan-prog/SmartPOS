import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../widgets/modals/receipt_modal.dart';
import '../widgets/modals/refund_modal.dart';

class SalesManagerScreen extends StatefulWidget {
  const SalesManagerScreen({super.key});

  @override
  State<SalesManagerScreen> createState() => _SalesManagerScreenState();
}

class _SalesManagerScreenState extends State<SalesManagerScreen> {
  String _filter = 'All';
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final currency = store.activeShop.currency;

    final filtered = store.salesHistory.where((s) {
      final matchesSearch = _search.isEmpty ||
          s.invoiceNumber.toLowerCase().contains(_search.toLowerCase()) ||
          (s.customerName ?? '').toLowerCase().contains(_search.toLowerCase()) ||
          s.cashierName.toLowerCase().contains(_search.toLowerCase());

      if (_filter == 'Refunded') {
        return matchesSearch && (s.isRefunded || s.isPartiallyRefunded);
      } else if (_filter == 'Settled') {
        return matchesSearch && !s.isRefunded;
      }
      return matchesSearch;
    }).toList();

    return Column(
      children: [
        // Summary Header
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.slate900,
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Gross Invoiced', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '$currency ${store.grossSalesRevenue.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Refunded Amount', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '-$currency ${store.refundsTotal.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Net Settled Sales', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '$currency ${store.netRevenue.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Search & Filter Tabs
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchCtrl,
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                      decoration: InputDecoration(
                        hintText: 'Search invoice # or customer...',
                        hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                        prefixIcon: const Icon(Icons.search, size: 16, color: AppTheme.slate400),
                        filled: true,
                        fillColor: AppTheme.slate950,
                        contentPadding: const EdgeInsets.symmetric(vertical: 6),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                      ),
                      onChanged: (val) => setState(() => _search = val),
                    ),
                  ),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: _filter,
                    underline: const SizedBox(),
                    dropdownColor: AppTheme.slate900,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    items: ['All', 'Settled', 'Refunded']
                        .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                        .toList(),
                    onChanged: (f) => setState(() => _filter = f ?? 'All'),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Sales Invoices List
        Expanded(
          child: filtered.isEmpty
              ? const Center(
                  child: Text('No invoices match current filter', style: TextStyle(color: AppTheme.slate500)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final s = filtered[i];
                    final isFullRefund = s.isRefunded;
                    final isPartRefund = s.isPartiallyRefunded;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.slate900,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isFullRefund
                              ? Colors.red.withValues(alpha: 0.4)
                              : (isPartRefund ? Colors.amber.withValues(alpha: 0.4) : AppTheme.slate800),
                        ),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: isFullRefund
                                      ? Colors.red.withValues(alpha: 0.15)
                                      : (isPartRefund ? Colors.amber.withValues(alpha: 0.15) : AppTheme.blue500.withValues(alpha: 0.15)),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  isFullRefund ? Icons.remove_circle : (isPartRefund ? Icons.published_with_changes : Icons.receipt_long),
                                  size: 16,
                                  color: isFullRefund ? Colors.redAccent : (isPartRefund ? Colors.amberAccent : AppTheme.blue400),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      s.invoiceNumber,
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                    Text(
                                      '${s.customerName ?? 'Walk-in'} • Cashier: ${s.cashierName}',
                                      style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '$currency ${s.grandTotal.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      color: isFullRefund ? Colors.redAccent : AppTheme.emerald400,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 14,
                                    ),
                                  ),
                                  if (isFullRefund)
                                    const Text('REFUNDED', style: TextStyle(color: Colors.redAccent, fontSize: 9, fontWeight: FontWeight.bold))
                                  else if (isPartRefund)
                                    Text('REFUNDED -$currency ${s.refundAmount.round()}', style: const TextStyle(color: Colors.amberAccent, fontSize: 9, fontWeight: FontWeight.bold))
                                  else
                                    Text(s.payments.isNotEmpty ? s.payments.first.method.name.toUpperCase() : 'PAID', style: const TextStyle(color: AppTheme.slate400, fontSize: 9)),
                                ],
                              ),
                            ],
                          ),
                          const Divider(color: AppTheme.slate800, height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '${s.items.length} items • ${s.createdAt.length >= 10 ? s.createdAt.substring(0, 10) : ''}',
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppTheme.slate500, fontSize: 10),
                                ),
                              ),
                              Wrap(
                                spacing: 4,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  if (!s.isRefunded)
                                    TextButton.icon(
                                      style: TextButton.styleFrom(
                                        visualDensity: VisualDensity.compact,
                                        padding: const EdgeInsets.symmetric(horizontal: 6),
                                      ),
                                      icon: const Icon(Icons.assignment_return, size: 14, color: Colors.amberAccent),
                                      label: const Text('Refund', style: TextStyle(color: Colors.amberAccent, fontSize: 11)),
                                      onPressed: () {
                                        showModalBottomSheet(
                                          context: context,
                                          isScrollControlled: true,
                                          backgroundColor: Colors.transparent,
                                          builder: (_) => RefundModal(sale: s),
                                        );
                                      },
                                    ),
                                  TextButton.icon(
                                    style: TextButton.styleFrom(
                                      visualDensity: VisualDensity.compact,
                                      padding: const EdgeInsets.symmetric(horizontal: 6),
                                    ),
                                    icon: const Icon(Icons.print, size: 14, color: AppTheme.blue400),
                                    label: const Text('Receipt', style: TextStyle(color: AppTheme.blue400, fontSize: 11)),
                                    onPressed: () {
                                      showModalBottomSheet(
                                        context: context,
                                        isScrollControlled: true,
                                        backgroundColor: Colors.transparent,
                                        builder: (_) => ReceiptModal(sale: s),
                                      );
                                    },
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
