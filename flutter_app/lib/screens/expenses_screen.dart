import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  void _showAddExpenseDialog(BuildContext context, AppStore store) {
    final amountCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    ExpenseCategory category = ExpenseCategory.Miscellaneous;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDlgState) => AlertDialog(
          backgroundColor: AppTheme.slate900,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: AppTheme.slate800)),
          title: const Text('Log Operating Expense', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: amountCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    labelText: 'Amount (${store.activeShop.currency}) *',
                    labelStyle: const TextStyle(color: AppTheme.slate400),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<ExpenseCategory>(
                  value: category,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  decoration: InputDecoration(
                    labelText: 'Expense Category',
                    labelStyle: const TextStyle(color: AppTheme.slate400),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: ExpenseCategory.values.map((c) => DropdownMenuItem(value: c, child: Text(c.name, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)))).toList(),
                  onChanged: (c) => setDlgState(() => category = c ?? ExpenseCategory.Miscellaneous),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descCtrl,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Description / Payee',
                    labelStyle: const TextStyle(color: AppTheme.slate400),
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
                final amt = double.tryParse(amountCtrl.text) ?? 0;
                if (amt <= 0) return;
                store.addExpense(Expense(
                  id: 'exp_${DateTime.now().millisecondsSinceEpoch}',
                  shopId: store.activeShop.id,
                  amount: amt,
                  date: DateTime.now().toIso8601String(),
                  category: category,
                  description: descCtrl.text.trim().isNotEmpty ? descCtrl.text.trim() : category.name,
                  createdBy: store.currentUser.name,
                ));
                Navigator.pop(ctx);
              },
              child: const Text('Save Expense', style: TextStyle(color: Colors.white)),
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

    return Column(
      children: [
        // Total Expense Banner
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.slate900,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total Logged Overheads', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        '$currency ${store.totalExpenses.toStringAsFixed(0)}',
                        style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w900, fontSize: 18),
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
                icon: const Icon(Icons.add, size: 16),
                label: const Text('Log Expense', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () => _showAddExpenseDialog(context, store),
              ),
            ],
          ),
        ),

        // Expense Items List
        Expanded(
          child: store.expenses.isEmpty
              ? const Center(child: Text('No expenses recorded', style: TextStyle(color: AppTheme.slate500)))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: store.expenses.length,
                  itemBuilder: (ctx, i) {
                    final exp = store.expenses[i];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.slate900,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.slate800),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.redAccent.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.receipt, color: Colors.redAccent, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(exp.categoryName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                Text(exp.description, style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                                const SizedBox(height: 2),
                                Text(
                                  'By: ${exp.createdBy} • ${exp.date.length >= 10 ? exp.date.substring(0, 10) : ''}',
                                  style: const TextStyle(color: AppTheme.slate500, fontSize: 9),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            '$currency ${exp.amount.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w900, fontSize: 14),
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
