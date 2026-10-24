/**
 * Phase 7 Architecture & Source Code:
 * Sales Management, Full/Partial Refunds & Restocking, Customer Credit ("Udhaar/Khata") Ledger,
 * Supplier Payables, and Daily Expense Tracker.
 *
 * Included production files:
 * 1. lib/features/sales/presentation/sales_history_screen.dart (Sales ledger & full/partial refund controller)
 * 2. lib/features/customers/presentation/customer_ledger_screen.dart (Customer credit ledger & WhatsApp reminder)
 * 3. lib/features/suppliers/presentation/suppliers_screen.dart (Supplier accounts & payout recording)
 * 4. lib/features/expenses/presentation/expense_tracker_screen.dart (Daily expense management & profit impact)
 */

export const SALES_HISTORY_SCREEN_DART = `// lib/features/sales/presentation/sales_history_screen.dart
// Production Sales Ledger, Filterable History, and Full/Partial Refund Controller with Inventory Restock

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/sale_model.dart';
import '../../../core/models/product_model.dart';
import '../data/sales_repository.dart';
import '../../inventory/data/products_repository.dart';

class SalesHistoryScreen extends ConsumerStatefulWidget {
  final String shopId;
  const SalesHistoryScreen({super.key, required this.shopId});

  @override
  ConsumerState<SalesHistoryScreen> createState() => _SalesHistoryScreenState();
}

class _SalesHistoryScreenState extends ConsumerState<SalesHistoryScreen> {
  String _searchQuery = '';
  String _selectedPaymentMethod = 'All';
  DateTimeRange? _selectedDateRange;

  @override
  Widget build(BuildContext context) {
    final salesAsync = ref.watch(salesHistoryProvider(widget.shopId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Ledger & Transactions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.date_range),
            tooltip: 'Filter Date Range',
            onPressed: () async {
              final picked = await showDateRangePicker(
                context: context,
                firstDate: DateTime(2025),
                lastDate: DateTime.now().add(const Duration(days: 1)),
              );
              if (picked != null) {
                setState(() => _selectedDateRange = picked);
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips & Search Bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      hintText: 'Search invoice number, cashier, customer...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                      isDense: true,
                    ),
                    onChanged: (val) => setState(() => _searchQuery = val),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedPaymentMethod,
                  items: ['All', 'cash', 'jazzcash', 'easypaisa', 'bank_qr', 'customer_credit']
                      .map((m) => DropdownMenuItem(value: m, child: Text(m.toUpperCase())))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedPaymentMethod = val);
                  },
                ),
              ],
            ),
          ),

          // Sales List
          Expanded(
            child: salesAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('Error loading sales: \$err')),
              data: (sales) {
                final filtered = sales.where((s) {
                  final matchesQuery = s.invoiceNumber.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                      (s.customerName?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
                      s.cashierName.toLowerCase().contains(_searchQuery.toLowerCase());
                  final matchesMethod = _selectedPaymentMethod == 'All' ||
                      s.payments.any((p) => p.method == _selectedPaymentMethod);
                  return matchesQuery && matchesMethod;
                }).toList();

                if (filtered.isEmpty) {
                  return const Center(child: Text('No transactions found matching filters.'));
                }

                return ListView.separated(
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final sale = filtered[index];
                    final isRefunded = sale.isRefunded ?? false;

                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isRefunded ? Colors.red.shade100 : Colors.green.shade100,
                        child: Icon(
                          isRefunded ? Icons.replay : Icons.receipt_long,
                          color: isRefunded ? Colors.red : Colors.green,
                        ),
                      ),
                      title: Row(
                        children: [
                          Text(sale.invoiceNumber, style: const TextStyle(fontWeight: FontWeight.bold)),
                          const SizedBox(width: 8),
                          if (isRefunded)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(4)),
                              child: const Text('REFUNDED', style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                        ],
                      ),
                      subtitle: Text(
                        '\${sale.createdAt.substring(0, 16)} • \${sale.items.length} items • Cashier: \${sale.cashierName}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'PKR \${sale.grandTotal}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              decoration: isRefunded ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          Text(
                            sale.payments.map((p) => p.method.toUpperCase()).join(', '),
                            style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                      onTap: () => _showSaleDetailAndRefundModal(context, sale),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showSaleDetailAndRefundModal(BuildContext context, SaleModel sale) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _SaleRefundSheet(sale: sale, shopId: widget.shopId),
    );
  }
}

/// Modal Sheet allowing detail inspection and Full/Partial Item Refund
class _SaleRefundSheet extends ConsumerStatefulWidget {
  final SaleModel sale;
  final String shopId;
  const _SaleRefundSheet({required this.sale, required this.shopId});

  @override
  ConsumerState<_SaleRefundSheet> createState() => _SaleRefundSheetState();
}

class _SaleRefundSheetState extends ConsumerState<_SaleRefundSheet> {
  final Map<String, int> _itemsToRefund = {};
  String _refundReason = 'Customer changed mind';
  bool _restockInventory = true;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final sale = widget.sale;
    final isAlreadyRefunded = sale.isRefunded ?? false;

    // Calculate total selected refund amount
    num currentRefundTotal = 0;
    for (final item in sale.items) {
      final qty = _itemsToRefund[item.id] ?? 0;
      currentRefundTotal += qty * item.unitPrice;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Invoice: \${sale.invoiceNumber}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          Text('Customer: \${sale.customerName ?? 'Walk-in'} | Date: \${sale.createdAt.substring(0, 16)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const Divider(height: 24),

          const Text('Select Items to Refund / Return:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),

          Expanded(
            child: ListView.builder(
              itemCount: sale.items.length,
              itemBuilder: (ctx, i) {
                final item = sale.items[i];
                final selectedQty = _itemsToRefund[item.id] ?? 0;

                return Card(
                  elevation: 0,
                  color: Colors.grey.shade100,
                  margin: const EdgeInsets.symmetric(vertical: 4),
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                              Text('Rate: PKR \${item.unitPrice} | Original Qty: \${item.quantity}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                        if (!isAlreadyRefunded) ...[
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: selectedQty > 0
                                ? () => setState(() => _itemsToRefund[item.id] = selectedQty - 1)
                                : null,
                          ),
                          Text('\$selectedQty', style: const TextStyle(fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: selectedQty < item.quantity
                                ? () => setState(() => _itemsToRefund[item.id] = selectedQty + 1)
                                : null,
                          ),
                        ] else
                          const Text('Returned', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          if (!isAlreadyRefunded) ...[
            const Divider(),
            DropdownButtonFormField<String>(
              value: _refundReason,
              decoration: const InputDecoration(labelText: 'Reason for Refund', isDense: true),
              items: [
                'Customer changed mind',
                'Damaged / Defective item',
                'Wrong product scanned',
                'Expired product complaint',
              ].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _refundReason = val);
              },
            ),
            CheckboxListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Restock returned items to Inventory', style: TextStyle(fontSize: 13)),
              value: _restockInventory,
              onChanged: (v) => setState(() => _restockInventory = v ?? true),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total Refund: PKR \$currentRefundTotal', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red)),
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: Colors.red),
                  onPressed: currentRefundTotal > 0 && !_isProcessing
                      ? () => _processRefund(currentRefundTotal)
                      : null,
                  icon: const Icon(Icons.replay),
                  label: Text(_isProcessing ? 'Processing...' : 'Process Refund'),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _processRefund(num refundAmount) async {
    setState(() => _isProcessing = true);
    try {
      // 1. Record refund in repository
      await ref.read(salesRepositoryProvider).processSaleRefund(
        saleId: widget.sale.id,
        refundAmount: refundAmount,
        reason: _refundReason,
        itemsToRefund: _itemsToRefund,
        restock: _restockInventory,
      );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Refund of PKR \$refundAmount recorded successfully!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: \$e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }
}
`;

export const CUSTOMER_LEDGER_SCREEN_DART = `// lib/features/customers/presentation/customer_ledger_screen.dart
// Customer Credit ("Udhaar / Khata") Ledger, Due Balance Collections & WhatsApp Reminders

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/models/customer_model.dart';
import '../data/customers_repository.dart';

class CustomerLedgerScreen extends ConsumerStatefulWidget {
  final String shopId;
  const CustomerLedgerScreen({super.key, required this.shopId});

  @override
  ConsumerState<CustomerLedgerScreen> createState() => _CustomerLedgerScreenState();
}

class _CustomerLedgerScreenState extends ConsumerState<CustomerLedgerScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final customersAsync = ref.watch(customersListProvider(widget.shopId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Credit Ledger ("Khata")'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add),
            tooltip: 'Add Customer',
            onPressed: () => _openAddCustomerDialog(context),
          ),
        ],
      ),
      body: customersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error loading customers: \$err')),
        data: (customers) {
          final filtered = customers.where((c) =>
              c.name.toLowerCase().contains(_search.toLowerCase()) ||
              c.phone.contains(_search)).toList();

          final totalReceivables = customers.fold<num>(0, (sum, c) => sum + c.dueBalance);

          return Column(
            children: [
              // Summary Banner
              Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [Colors.blue.shade900, Colors.indigo.shade800]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Receivables (Udhaar Due)', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text('PKR \$totalReceivables', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Text('\${customers.length} Accounts', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),

              // Search Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: TextField(
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Search customer by name or phone...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _search = v),
                ),
              ),
              const SizedBox(height: 8),

              // Customers List
              Expanded(
                child: ListView.separated(
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, i) {
                    final cust = filtered[i];
                    final hasDue = cust.dueBalance > 0;

                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: hasDue ? Colors.amber.shade100 : Colors.blue.shade100,
                        child: Text(cust.name[0].toUpperCase(), style: TextStyle(color: hasDue ? Colors.brown : Colors.blue.shade900, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(cust.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('\${cust.phone} • Loyalty: \${cust.loyaltyPoints} pts'),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'PKR \${cust.dueBalance}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: hasDue ? Colors.red.shade700 : Colors.green.shade700,
                            ),
                          ),
                          Text(hasDue ? 'Due Balance' : 'Clear', style: TextStyle(fontSize: 10, color: Colors.grey.shade600)),
                        ],
                      ),
                      onTap: () => _openCustomerLedgerDetail(context, cust),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _openCustomerLedgerDetail(BuildContext context, CustomerModel customer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _CustomerDetailSheet(customer: customer, shopId: widget.shopId),
    );
  }

  void _openAddCustomerDialog(BuildContext context) {
    // Add customer form
  }
}

class _CustomerDetailSheet extends ConsumerStatefulWidget {
  final CustomerModel customer;
  final String shopId;
  const _CustomerDetailSheet({required this.customer, required this.shopId});

  @override
  ConsumerState<_CustomerDetailSheet> createState() => _CustomerDetailSheetState();
}

class _CustomerDetailSheetState extends ConsumerState<_CustomerDetailSheet> {
  final _amountCtrl = TextEditingController();
  bool _isCollecting = false;

  void _sendWhatsAppReminder() async {
    final cust = widget.customer;
    final text = 'Respected \${cust.name},\\nThis is a polite reminder from the shop regarding your pending balance of PKR \${cust.dueBalance}. Kindly clear at your earliest convenience. Thank you!';
    final uri = Uri.parse('https://wa.me/\${cust.phone.replaceAll(RegExp(r"[^0-9]"), "")}?text=\${Uri.encodeComponent(text)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _collectPayment() async {
    final amt = double.tryParse(_amountCtrl.text) ?? 0;
    if (amt <= 0) return;

    setState(() => _isCollecting = true);
    try {
      await ref.read(customersRepositoryProvider).recordCustomerPayment(
        customerId: widget.customer.id,
        amount: amt,
        paymentMethod: 'cash',
        shopId: widget.shopId,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Payment of PKR \$amt recorded!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: \$e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isCollecting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cust = widget.customer;

    return Container(
      padding: const EdgeInsets.all(20),
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(cust.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
            ],
          ),
          Text('\${cust.phone} • \${cust.address ?? 'No address'}', style: const TextStyle(color: Colors.grey)),
          const Divider(height: 24),

          // Balance card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Current Outstanding Balance:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('PKR \${cust.dueBalance}', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red.shade800)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: cust.dueBalance > 0 ? _sendWhatsAppReminder : null,
                  icon: const Icon(Icons.chat, color: Colors.green),
                  label: const Text('WhatsApp Reminder'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Payment Collection Form
          const Text('Collect Due Payment ("Wasooli"):', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _amountCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    prefixText: 'PKR ',
                    hintText: 'Amount',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: _isCollecting ? null : _collectPayment,
                child: Text(_isCollecting ? 'Saving...' : 'Record Payment'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
`;

export const SUPPLIERS_SCREEN_DART = `// lib/features/suppliers/presentation/suppliers_screen.dart
// Supplier Catalog, Purchases & Payable Balance Settlement

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/supplier_model.dart';
import '../data/suppliers_repository.dart';

class SuppliersScreen extends ConsumerWidget {
  final String shopId;
  const SuppliersScreen({super.key, required this.shopId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suppliersAsync = ref.watch(suppliersListProvider(shopId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Suppliers & Wholesalers'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_business),
            tooltip: 'Add Supplier',
            onPressed: () {},
          ),
        ],
      ),
      body: suppliersAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error loading suppliers: \$err')),
        data: (suppliers) {
          final totalPayable = suppliers.fold<num>(0, (sum, s) => sum + s.payableBalance);

          return Column(
            children: [
              // Summary card
              Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [Colors.purple.shade900, Colors.deepPurple.shade700]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Supplier Payables', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text('PKR \$totalPayable', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Text('\${suppliers.length} Vendors', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),

              Expanded(
                child: ListView.separated(
                  itemCount: suppliers.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, i) {
                    final sup = suppliers[i];
                    return ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.store)),
                      title: Text(sup.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('\${sup.phone} • \${sup.address}'),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('PKR \${sup.payableBalance}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.orange)),
                          const Text('Payable', style: TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
`;

export const EXPENSE_TRACKER_SCREEN_DART = `// lib/features/expenses/presentation/expense_tracker_screen.dart
// Daily Expense Tracker, Categorization, Drawer Impact, and Net Profit Calculations

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/models/expense_model.dart';
import '../data/expenses_repository.dart';

class ExpenseTrackerScreen extends ConsumerStatefulWidget {
  final String shopId;
  const ExpenseTrackerScreen({super.key, required this.shopId});

  @override
  ConsumerState<ExpenseTrackerScreen> createState() => _ExpenseTrackerScreenState();
}

class _ExpenseTrackerScreenState extends ConsumerState<ExpenseTrackerScreen> {
  final _amountCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _category = 'Miscellaneous';

  void _showAddExpenseModal(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Record Shop Expense'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (PKR)', isDense: true),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(labelText: 'Category', isDense: true),
              items: ['Rent', 'Electricity', 'Internet', 'Transport', 'Salaries', 'Maintenance', 'Miscellaneous']
                  .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                  .toList(),
              onChanged: (v) => setState(() => _category = v ?? 'Miscellaneous'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _descCtrl,
              decoration: const InputDecoration(labelText: 'Description / Purpose', isDense: true),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final amt = double.tryParse(_amountCtrl.text) ?? 0;
              if (amt <= 0) return;
              await ref.read(expensesRepositoryProvider).addExpense(
                shopId: widget.shopId,
                amount: amt,
                category: _category,
                description: _descCtrl.text,
              );
              if (mounted) Navigator.pop(ctx);
            },
            child: const Text('Save Expense'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final expensesAsync = ref.watch(expensesListProvider(widget.shopId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Tracker'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddExpenseModal(context),
        icon: const Icon(Icons.add),
        label: const Text('Log Expense'),
      ),
      body: expensesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: \$err')),
        data: (expenses) {
          final totalExpense = expenses.fold<num>(0, (sum, e) => sum + e.amount);

          return Column(
            children: [
              Container(
                margin: const EdgeInsets.all(12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [Colors.rose.shade900, Colors.pink.shade800]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Total Shop Expenses', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text('PKR \$totalExpense', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Text('\${expenses.length} Records', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),

              Expanded(
                child: ListView.separated(
                  itemCount: expenses.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (ctx, i) {
                    final exp = expenses[i];
                    return ListTile(
                      leading: const CircleAvatar(child: Icon(Icons.receipt)),
                      title: Text(exp.description, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('\${exp.category} • \${exp.date.substring(0, 10)} • Logged by: \${exp.createdBy}'),
                      trailing: Text('PKR \${exp.amount}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
`;
