import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../widgets/modals/auth_modal.dart';

class ProfitLossScreen extends StatelessWidget {
  const ProfitLossScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final ent = store.entitlements;

    if (!ent.allowProfitLoss) {
      return Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 420),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppTheme.slate900,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.indigo500.withValues(alpha: 0.4)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.indigo500.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.indigo500.withValues(alpha: 0.3)),
                  ),
                  child: const Icon(Icons.lock_outline, size: 32, color: AppTheme.indigo400),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.amber500.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.4)),
                  ),
                  child: const Text(
                    'BUSINESS PRO MONTHLY FEATURE',
                    style: TextStyle(color: AppTheme.amber300, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'P&L & Margin Analytics Disabled',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Your business "${store.activeShop.name}" is on ${ent.planName}. Profit & Loss analytics, Multi-Branch stores, Custom Cashiers & Managers, Expiry Alerts, and Cloud Sync require Business Pro Monthly.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppTheme.slate400, fontSize: 12, height: 1.4),
                ),
                if (store.currentUser.role == UserRole.owner) ...[
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.indigo600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => showDialog(context: context, builder: (_) => const AuthModal()),
                    icon: const Icon(Icons.workspace_premium, size: 17),
                    label: const Text('Upgrade to Business Pro', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ],
            ),
          ),
        ),
      );
    }

    final currency = store.activeShop.currency;
    final isCashier = store.currentUser.role == UserRole.cashier;

    final grossRevenue = store.grossSalesRevenue;
    final refunds = store.refundsTotal;
    final netRevenue = store.netRevenue;
    final grossProfit = store.estimatedGrossProfit;
    final cogs = (netRevenue - grossProfit).clamp(0.0, double.infinity);
    final expenses = store.totalExpenses;
    final netOperatingProfit = grossProfit - expenses;

    final grossMarginPct = netRevenue > 0 ? ((grossProfit / netRevenue) * 100).toStringAsFixed(1) : '0.0';
    final netMarginPct = netRevenue > 0 ? ((netOperatingProfit / netRevenue) * 100).toStringAsFixed(1) : '0.0';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Cashier RBAC Warning
          if (isCashier)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.amber.shade900.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.shade700),
              ),
              child: Row(
                children: [
                  const Icon(Icons.lock, size: 20, color: Colors.amberAccent),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Cashier Mode Active', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        Text('P&L figures are confidential. Switch to Owner role to edit margins.', style: TextStyle(color: AppTheme.slate300, fontSize: 10)),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () => showDialog(context: context, builder: (_) => const AuthModal()),
                    child: const Text('Unlock', style: TextStyle(color: Colors.amberAccent, fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
                ],
              ),
            ),

          // Net Profit Highlights Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: netOperatingProfit >= 0
                    ? [const Color(0xFF065F46), const Color(0xFF064E3B)]
                    : [const Color(0xFF7F1D1D), const Color(0xFF450A0A)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('NET OPERATING PROFIT', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 6),
                Text(
                  '$currency ${netOperatingProfit.toStringAsFixed(0)}',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 26),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(6)),
                      child: Text('Net Margin: $netMarginPct%', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(6)),
                      child: Text('Gross Margin: $grossMarginPct%', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // P&L Statement Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.slate900,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.slate800),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('INCOME STATEMENT (STATEMENT OF PROFIT & LOSS)', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 12),
                _buildStatementRow('Gross Revenue Invoiced', '$currency ${grossRevenue.toStringAsFixed(0)}', isBold: true),
                _buildStatementRow('Less: Customer Returns & Refunds', '-$currency ${refunds.toStringAsFixed(0)}', color: Colors.redAccent),
                const Divider(color: AppTheme.slate800),
                _buildStatementRow('Net Sales Revenue', '$currency ${netRevenue.toStringAsFixed(0)}', isBold: true, color: AppTheme.emerald400),
                const SizedBox(height: 4),
                _buildStatementRow('Less: Cost of Goods Sold (COGS)', '-$currency ${cogs.toStringAsFixed(0)}', color: AppTheme.slate400),
                const Divider(color: AppTheme.slate800),
                _buildStatementRow('Gross Profit', '$currency ${grossProfit.toStringAsFixed(0)}', isBold: true, color: Colors.purpleAccent),
                const SizedBox(height: 4),
                _buildStatementRow('Less: Total Operating Expenses', '-$currency ${expenses.toStringAsFixed(0)}', color: AppTheme.rose400),
                const Divider(color: AppTheme.slate800),
                _buildStatementRow(
                  'Net Operating Income (EBIT)',
                  '$currency ${netOperatingProfit.toStringAsFixed(0)}',
                  isBold: true,
                  color: netOperatingProfit >= 0 ? AppTheme.emerald400 : Colors.redAccent,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Inventory Valuation Summary
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.slate900,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.slate800),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('BALANCE SHEET HIGHLIGHTS', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 12),
                _buildStatementRow('Inventory On-Hand Cost Value', '$currency ${store.inventoryCostValue.toStringAsFixed(0)}'),
                _buildStatementRow('Inventory Retail Potential Value', '$currency ${store.inventoryRetailValue.toStringAsFixed(0)}'),
                _buildStatementRow('Accounts Receivable (Customer Udhaar)', '$currency ${store.totalReceivables.toStringAsFixed(0)}', color: Colors.orangeAccent),
                _buildStatementRow('Accounts Payable (Supplier Debt)', '$currency ${store.totalPayables.toStringAsFixed(0)}', color: AppTheme.rose400),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatementRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isBold ? Colors.white : AppTheme.slate300,
                fontSize: 12,
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            flex: 0,
            child: Text(
              value,
              style: TextStyle(
                color: color ?? (isBold ? Colors.white : AppTheme.slate200),
                fontSize: 12,
                fontWeight: isBold ? FontWeight.w900 : FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
