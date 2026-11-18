import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../widgets/modals/customer_ledger_modal.dart';

class CustomerLedgerScreen extends StatefulWidget {
  const CustomerLedgerScreen({super.key});

  @override
  State<CustomerLedgerScreen> createState() => _CustomerLedgerScreenState();
}

class _CustomerLedgerScreenState extends State<CustomerLedgerScreen> {
  String _search = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _showAddCustomerDialog(BuildContext context, AppStore store) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(text: '+92 3');
    final addressCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
        title: const Text('Register New Khata Customer', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Full Name *', labelStyle: TextStyle(color: AppTheme.slate400))),
              const SizedBox(height: 8),
              TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Mobile Phone *', labelStyle: TextStyle(color: AppTheme.slate400))),
              const SizedBox(height: 8),
              TextField(controller: addressCtrl, style: const TextStyle(color: Colors.white), decoration: const InputDecoration(labelText: 'Delivery Address / Area', labelStyle: TextStyle(color: AppTheme.slate400))),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400))),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600),
            onPressed: () {
              if (nameCtrl.text.trim().isEmpty) return;
              store.addCustomer(Customer(
                id: 'cust_${DateTime.now().millisecondsSinceEpoch}',
                shopId: store.activeShop.id,
                name: nameCtrl.text.trim(),
                phone: phoneCtrl.text.trim(),
                address: addressCtrl.text.trim(),
              ));
              Navigator.pop(ctx);
            },
            child: const Text('Save Customer', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showWasooliDialog(BuildContext context, Customer c, AppStore store) {
    final amountCtrl = TextEditingController(text: c.dueBalance.toStringAsFixed(0));
    String method = 'Cash';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
        title: Text('Record Wasooli: ${c.name}', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Current Due Balance: ${store.activeShop.currency} ${c.dueBalance.round()}', style: const TextStyle(color: Colors.amberAccent, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                decoration: InputDecoration(
                  labelText: 'Amount Received (${store.activeShop.currency})',
                  labelStyle: const TextStyle(color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: method,
                isExpanded: true,
                dropdownColor: AppTheme.slate900,
                decoration: InputDecoration(
                  labelText: 'Payment Method',
                  labelStyle: const TextStyle(color: AppTheme.slate400),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                items: ['Cash', 'JazzCash', 'Easypaisa', 'Bank Transfer'].map((m) => DropdownMenuItem(value: m, child: Text(m, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)))).toList(),
                onChanged: (m) => method = m ?? 'Cash',
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
              store.recordCustomerPayment(c.id, amt, method);
              Navigator.pop(ctx);
            },
            child: const Text('Confirm Wasooli', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final shop = store.activeShop;
    final currency = shop.currency;

    final q = _search.trim().toLowerCase();
    final filtered = store.customers.where((c) {
      return q.isEmpty ||
          c.name.toLowerCase().contains(q) ||
          c.phone.toLowerCase().contains(q) ||
          c.address.toLowerCase().contains(q);
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
                        const Text('Total Outstanding Udhaar (Receivables)', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '$currency ${store.totalReceivables.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.orangeAccent, fontWeight: FontWeight.w900, fontSize: 18),
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
                    icon: const Icon(Icons.person_add, size: 16),
                    label: const Text('Add Customer', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: () => _showAddCustomerDialog(context, store),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: Colors.white, fontSize: 12),
                decoration: InputDecoration(
                  hintText: 'Search Khata customer name, phone or address...',
                  hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                  prefixIcon: const Icon(Icons.search, size: 16, color: AppTheme.slate400),
                  suffixIcon: _search.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 16, color: AppTheme.slate400),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _search = '');
                          },
                        )
                      : null,
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
              ? const Center(child: Text('No customers found', style: TextStyle(color: AppTheme.slate500)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final c = filtered[i];
                    final hasDebt = c.dueBalance > 0;

                    return GestureDetector(
                      onTap: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => CustomerLedgerModal(customerId: c.id),
                        );
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.slate900,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: hasDebt ? Colors.orange.withValues(alpha: 0.4) : AppTheme.slate800),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: hasDebt ? Colors.orange.withValues(alpha: 0.2) : AppTheme.blue600.withValues(alpha: 0.2),
                                  child: Text(c.name[0], style: TextStyle(color: hasDebt ? Colors.orangeAccent : AppTheme.blue400, fontWeight: FontWeight.bold)),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(c.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                      Text('${c.phone} • ${c.address}', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '$currency ${c.dueBalance.toStringAsFixed(0)}',
                                      style: TextStyle(
                                        color: hasDebt ? Colors.orangeAccent : AppTheme.emerald400,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15,
                                      ),
                                    ),
                                    Text(hasDebt ? 'DUE / UDHAAR' : 'CLEAR', style: TextStyle(color: hasDebt ? Colors.orangeAccent : AppTheme.emerald400, fontSize: 9, fontWeight: FontWeight.bold)),
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
                                    'Loyalty: ${c.loyaltyPoints} pts • Tap for Khata',
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppTheme.slate500, fontSize: 10),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (hasDebt)
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppTheme.emerald600,
                                          foregroundColor: Colors.white,
                                          visualDensity: VisualDensity.compact,
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                        icon: const Icon(Icons.payments, size: 14),
                                        label: const Text('Wasooli', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                        onPressed: () => _showWasooliDialog(context, c, store),
                                      ),
                                    const SizedBox(width: 6),
                                    IconButton(
                                      visualDensity: VisualDensity.compact,
                                      constraints: const BoxConstraints(),
                                      icon: const Icon(Icons.share, size: 16, color: AppTheme.emerald400),
                                      tooltip: 'Send WhatsApp Reminder',
                                      onPressed: () {
                                        final msg = 'Assalam-o-Alaikum ${c.name}, polite Khata reminder from *${shop.name}*. Current pending balance: *$currency ${c.dueBalance.round()}*.';
                                        SharePlus.instance.share(
                                          ShareParams(text: msg, subject: 'Khata Reminder - ${shop.name}'),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
