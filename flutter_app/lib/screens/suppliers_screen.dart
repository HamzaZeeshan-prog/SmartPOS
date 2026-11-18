import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';

class SuppliersScreen extends StatefulWidget {
  const SuppliersScreen({super.key});

  @override
  State<SuppliersScreen> createState() => _SuppliersScreenState();
}

class _SuppliersScreenState extends State<SuppliersScreen> {
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _showAddSupplierDialog(BuildContext context, AppStore store) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(text: '+92 3');
    final addressCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
        title: const Text('Add Wholesale Supplier', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Company / Distributor Name *', labelStyle: TextStyle(color: AppTheme.slate400))),
              const SizedBox(height: 8),
              TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Contact Phone *', labelStyle: TextStyle(color: AppTheme.slate400))),
              const SizedBox(height: 8),
              TextField(controller: addressCtrl, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Warehouse Address / City', labelStyle: TextStyle(color: AppTheme.slate400))),
              const SizedBox(height: 8),
              TextField(controller: notesCtrl, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Notes / Brands Supplied', labelStyle: TextStyle(color: AppTheme.slate400))),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600),
            onPressed: () {
              if (nameCtrl.text.trim().isEmpty) return;
              store.addSupplier(Supplier(
                id: 'sup_${DateTime.now().millisecondsSinceEpoch}',
                shopId: store.activeShop.id,
                name: nameCtrl.text.trim(),
                phone: phoneCtrl.text.trim(),
                address: addressCtrl.text.trim(),
                notes: notesCtrl.text.trim(),
              ));
              Navigator.pop(ctx);
            },
            child: const Text('Save Supplier', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showPayoutDialog(BuildContext context, Supplier s, AppStore store) {
    final amountCtrl = TextEditingController(text: s.payableBalance.toStringAsFixed(0));
    final noteCtrl = TextEditingController();
    String method = 'Bank Transfer';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
        title: Text('Record Payout: ${s.name}', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Current Payable Balance: ${store.activeShop.currency} ${s.payableBalance.round()}', style: const TextStyle(color: AppTheme.rose400, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'Amount Paid (${store.activeShop.currency})',
                  labelStyle: const TextStyle(color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 10),
              DropdownButtonFormField<String>(
                value: method,
                isExpanded: true,
                dropdownColor: AppTheme.slate900,
                decoration: InputDecoration(
                  labelText: 'Payment Channel',
                  labelStyle: const TextStyle(color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: ['Bank Transfer', 'Cash (Till)', 'Cheque', 'JazzCash'].map((m) => DropdownMenuItem(value: m, child: Text(m, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)))).toList(),
                onChanged: (m) => method = m ?? 'Bank Transfer',
              ),
              const SizedBox(height: 10),
              TextField(
                controller: noteCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: InputDecoration(
                  labelText: 'Reference / Invoice Note (Optional)',
                  labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
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
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600),
            onPressed: () {
              final amt = double.tryParse(amountCtrl.text) ?? 0;
              if (amt <= 0) return;
              store.recordSupplierPayment(s.id, amt, method, noteCtrl.text.trim().isNotEmpty ? noteCtrl.text.trim() : null);
              Navigator.pop(ctx);
            },
            child: const Text('Confirm Payout', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showPayoutHistorySheet(BuildContext context, Supplier s, String currency) {
    final payments = s.payments ?? [];
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
                const Icon(Icons.history, color: AppTheme.blue400),
                const SizedBox(width: 8),
                Expanded(
                  child: Text('${s.name} • Payout History', overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                ),
                IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(Icons.close, color: AppTheme.slate400)),
              ],
            ),
            const Divider(color: AppTheme.slate800),
            if (payments.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Center(child: Text('No payouts logged for this supplier yet', style: TextStyle(color: AppTheme.slate500, fontSize: 12))),
              )
            else
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 280),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: payments.length,
                  itemBuilder: (_, i) {
                    final pay = payments[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.slate950,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.slate800),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle, size: 16, color: AppTheme.emerald400),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(pay.method, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                Text('${pay.date.length >= 10 ? pay.date.substring(0, 10) : pay.date}${pay.note != null ? ' • ${pay.note}' : ''}', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                              ],
                            ),
                          ),
                          Text('$currency ${pay.amount.round()}', style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 13)),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final currency = store.activeShop.currency;

    final filtered = store.suppliers.where((s) {
      return _search.isEmpty ||
          s.name.toLowerCase().contains(_search.toLowerCase()) ||
          s.phone.contains(_search) ||
          s.notes.toLowerCase().contains(_search.toLowerCase());
    }).toList();

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.slate900,
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Wholesale Payables', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '$currency ${store.totalPayables.toStringAsFixed(0)}',
                            style: const TextStyle(color: AppTheme.rose400, fontWeight: FontWeight.w900, fontSize: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.blue600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    icon: const Icon(Icons.add_business, size: 16),
                    label: const Text('Add Supplier', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: () => _showAddSupplierDialog(context, store),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: InputDecoration(
                  hintText: 'Search supplier or distributor...',
                  hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                  prefixIcon: const Icon(Icons.search, size: 16, color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  contentPadding: const EdgeInsets.symmetric(vertical: 6),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                ),
                onChanged: (val) => setState(() => _search = val),
              ),
            ],
          ),
        ),

        Expanded(
          child: filtered.isEmpty
              ? const Center(child: Text('No suppliers found', style: TextStyle(color: AppTheme.slate500)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final s = filtered[i];
                    final hasPayable = s.payableBalance > 0;
                    final payoutCount = s.payments?.length ?? 0;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.slate900,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: hasPayable ? AppTheme.rose500.withValues(alpha: 0.4) : AppTheme.slate800),
                      ),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: hasPayable ? AppTheme.rose500.withValues(alpha: 0.2) : AppTheme.blue600.withValues(alpha: 0.2),
                                child: Text(s.name[0], style: TextStyle(color: hasPayable ? AppTheme.rose400 : AppTheme.blue400, fontWeight: FontWeight.bold)),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(s.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                    Text('${s.phone} • ${s.address}', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '$currency ${s.payableBalance.toStringAsFixed(0)}',
                                    style: TextStyle(
                                      color: hasPayable ? AppTheme.rose400 : AppTheme.emerald400,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 15,
                                    ),
                                  ),
                                  Text(hasPayable ? 'PAYABLE' : 'CLEARED', style: TextStyle(color: hasPayable ? AppTheme.rose400 : AppTheme.emerald400, fontSize: 9, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            ],
                          ),
                          if (s.notes.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Text(s.notes, style: const TextStyle(color: AppTheme.slate400, fontSize: 10, fontStyle: FontStyle.italic)),
                            ),
                          ],
                          const Divider(color: AppTheme.slate800, height: 16),
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              TextButton.icon(
                                style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
                                onPressed: () => _showPayoutHistorySheet(context, s, currency),
                                icon: const Icon(Icons.history, size: 14, color: AppTheme.blue400),
                                label: Text('Payouts ($payoutCount)', style: const TextStyle(color: AppTheme.blue400, fontSize: 11)),
                              ),
                              if (hasPayable)
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.emerald600,
                                    foregroundColor: Colors.white,
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  icon: const Icon(Icons.payment, size: 14),
                                  label: const Text('Record Payout', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  onPressed: () => _showPayoutDialog(context, s, store),
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
