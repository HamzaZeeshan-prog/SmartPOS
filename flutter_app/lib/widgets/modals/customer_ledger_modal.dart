import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';

class CustomerLedgerModal extends StatefulWidget {
  final String customerId;

  const CustomerLedgerModal({super.key, required this.customerId});

  @override
  State<CustomerLedgerModal> createState() => _CustomerLedgerModalState();
}

class _CustomerLedgerModalState extends State<CustomerLedgerModal> {
  final _amountCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  String _method = 'Cash';

  @override
  void dispose() {
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  void _sendWhatsAppReminder(Customer customer, Shop shop) {
    final msg = 'Assalam-o-Alaikum ${customer.name},\n\n'
        'This is a polite payment reminder from *${shop.name}* (${shop.city}).\n'
        'Your current Khata / Udhaar pending balance is *${shop.currency} ${customer.dueBalance.toStringAsFixed(0)}*.\n'
        'Please clear at your earliest convenience. Thank you!\n'
        'Tel: ${shop.phone}';
    SharePlus.instance.share(
      ShareParams(text: msg, subject: 'Khata Payment Reminder - ${shop.name}'),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final shop = store.activeShop;
    final currency = shop.currency;
    final customer = store.customers.cast<Customer?>().firstWhere(
          (c) => c?.id == widget.customerId,
          orElse: () => null,
        );

    if (customer == null) {
      return const SizedBox.shrink();
    }

    if (_amountCtrl.text.isEmpty && customer.dueBalance > 0) {
      _amountCtrl.text = customer.dueBalance.toStringAsFixed(0);
    }

    final ledger = customer.ledger ?? [];
    final hasDebt = customer.dueBalance > 0;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.9,
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
                CircleAvatar(
                  backgroundColor: hasDebt ? Colors.orange.withValues(alpha: 0.2) : AppTheme.blue600.withValues(alpha: 0.2),
                  child: Text(
                    customer.name.isNotEmpty ? customer.name[0] : 'C',
                    style: TextStyle(color: hasDebt ? Colors.orangeAccent : AppTheme.blue400, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(customer.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                      Text('${customer.phone} • Loyalty: ${customer.loyaltyPoints} pts', style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
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
              padding: const EdgeInsets.all(16),
              children: [
                // Balance Summary Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: hasDebt ? Colors.orange.withValues(alpha: 0.4) : AppTheme.emerald500.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('OUTSTANDING KHATA DUE', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            FittedBox(
                              fit: BoxFit.scaleDown,
                              alignment: Alignment.centerLeft,
                              child: Text(
                                '$currency ${customer.dueBalance.toStringAsFixed(0)}',
                                style: TextStyle(
                                  color: hasDebt ? Colors.orangeAccent : AppTheme.emerald400,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 22,
                                ),
                              ),
                            ),
                            Text('Lifetime Spend: $currency ${customer.totalPurchases.round()}', overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.slate500, fontSize: 10)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.emerald600,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => _sendWhatsAppReminder(customer, shop),
                        icon: const Icon(Icons.share, size: 16),
                        label: const Text('WhatsApp\nReminder', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Inline Record Wasooli Form
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('RECORD WASOOLI (PAYMENT RECEIVED)', style: TextStyle(color: AppTheme.emerald400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _amountCtrl,
                              keyboardType: TextInputType.number,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              decoration: InputDecoration(
                                labelText: 'Amount ($currency)',
                                labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                                filled: true,
                                fillColor: AppTheme.slate900,
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _method,
                              isExpanded: true,
                              dropdownColor: AppTheme.slate900,
                              style: const TextStyle(color: Colors.white, fontSize: 12),
                              decoration: InputDecoration(
                                labelText: 'Channel',
                                labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                                filled: true,
                                fillColor: AppTheme.slate900,
                                isDense: true,
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              items: ['Cash', 'JazzCash', 'Easypaisa', 'Bank Transfer']
                                  .map((m) => DropdownMenuItem(value: m, child: Text(m, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11))))
                                  .toList(),
                              onChanged: (v) => setState(() => _method = v ?? 'Cash'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _noteCtrl,
                        style: const TextStyle(color: Colors.white, fontSize: 12),
                        decoration: InputDecoration(
                          hintText: 'Receipt note (optional)',
                          hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                          filled: true,
                          fillColor: AppTheme.slate900,
                          isDense: true,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.emerald600,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () {
                            final amt = double.tryParse(_amountCtrl.text) ?? 0;
                            if (amt <= 0) {
                              store.showToast('Enter a valid repayment amount');
                              return;
                            }
                            store.recordCustomerPayment(
                              customer.id,
                              amt,
                              _method,
                              _noteCtrl.text.trim().isNotEmpty ? _noteCtrl.text.trim() : null,
                            );
                            _amountCtrl.clear();
                            _noteCtrl.clear();
                          },
                          icon: const Icon(Icons.payments, size: 16),
                          label: const Text('Confirm Wasooli & Update Khata', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                const Text('KHATA TRANSACTION TIMELINE', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 8),
                if (ledger.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppTheme.slate950,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.slate800),
                    ),
                    child: const Center(
                      child: Text('No credit or repayment entries recorded yet', style: TextStyle(color: AppTheme.slate500, fontSize: 12)),
                    ),
                  )
                else
                  ...ledger.map((entry) {
                    final isDebit = entry.type == 'debit';
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
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (isDebit ? Colors.orangeAccent : AppTheme.emerald400).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              isDebit ? Icons.arrow_upward : Icons.arrow_downward,
                              size: 16,
                              color: isDebit ? Colors.orangeAccent : AppTheme.emerald400,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isDebit ? 'Udhaar / Credit Bill' : 'Wasooli (${entry.paymentMethod})',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                                Text(
                                  '${entry.note ?? ''} • ${entry.date.length >= 10 ? entry.date.substring(0, 10) : entry.date}',
                                  style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${isDebit ? '+' : '-'}$currency ${entry.amount.toStringAsFixed(0)}',
                                style: TextStyle(
                                  color: isDebit ? Colors.orangeAccent : AppTheme.emerald400,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 13,
                                ),
                              ),
                              Text(
                                'Bal: $currency ${entry.balanceAfter.toStringAsFixed(0)}',
                                style: const TextStyle(color: AppTheme.slate500, fontSize: 9),
                              ),
                            ],
                          ),
                        ],
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
  }
}
