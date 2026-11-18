import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../widgets/modals/auth_modal.dart';
import '../widgets/modals/onboarding_wizard_modal.dart';
import '../widgets/modals/receipt_modal.dart';
import '../widgets/modals/scanner_modal.dart';
import '../widgets/modals/z_report_modal.dart';

class DashboardScreen extends StatelessWidget {
  final VoidCallback? onNavigateToPos;
  final VoidCallback? onNavigateToInventory;

  const DashboardScreen({
    super.key,
    this.onNavigateToPos,
    this.onNavigateToInventory,
  });

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final ent = store.entitlements;
    final currency = store.activeShop.currency;
    final isCashier = store.currentUser.role == UserRole.cashier;

    // 7-day sales trend ending with Today's live revenue
    final todayTotal = store.grossSalesRevenue;
    final sevenDaySales = [
      {'day': 'Mon', 'total': 18450.0},
      {'day': 'Tue', 'total': 22100.0},
      {'day': 'Wed', 'total': 16900.0},
      {'day': 'Thu', 'total': 24500.0},
      {'day': 'Fri', 'total': 31200.0},
      {'day': 'Sat', 'total': 28900.0},
      {'day': 'Today', 'total': todayTotal > 0 ? todayTotal : 1200.0},
    ];
    final maxDayTotal = sevenDaySales.map((d) => d['total'] as double).reduce((a, b) => a > b ? a : b);

    // Top-selling items aggregation
    final Map<String, Map<String, dynamic>> productAgg = {};
    for (final s in store.salesHistory) {
      if (s.isRefunded) continue;
      for (final item in s.items) {
        final existing = productAgg[item.product.id];
        if (existing != null) {
          existing['qty'] = (existing['qty'] as int) + item.quantity;
          existing['rev'] = (existing['rev'] as double) + item.lineTotal;
        } else {
          productAgg[item.product.id] = {
            'name': item.product.name,
            'category': item.product.category,
            'qty': item.quantity,
            'rev': item.lineTotal,
          };
        }
      }
    }
    final topSelling = productAgg.values.toList()
      ..sort((a, b) => (b['qty'] as int).compareTo(a['qty'] as int));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Greeting & Shop Overview Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF1E3A8A), Color(0xFF1E1B4B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.blue600.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        store.activeShop.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        store.currentUser.role.name.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Operator: ${store.currentUser.name} • ${store.activeShop.category} • ${store.activeShop.city}',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (onNavigateToPos != null)
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.blue600,
                          foregroundColor: Colors.white,
                          visualDensity: VisualDensity.compact,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: onNavigateToPos,
                        icon: const Icon(Icons.add_shopping_cart, size: 14),
                        label: const Text('New POS Sale', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: BorderSide(color: Colors.white.withValues(alpha: 0.25)),
                        visualDensity: VisualDensity.compact,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => OnboardingWizardModal(shopToEdit: store.activeShop),
                        );
                      },
                      icon: const Icon(Icons.settings, size: 14, color: AppTheme.cyan400),
                      label: const Text('Shop Setup Wizard', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Primary KPI Grid
          Row(
            children: [
              _buildKpiCard(
                'Today Gross Sales',
                '$currency ${store.grossSalesRevenue.toStringAsFixed(0)}',
                Icons.trending_up,
                AppTheme.emerald400,
              ),
              const SizedBox(width: 10),
              _buildKpiCard(
                'Total Orders',
                '${store.salesHistory.length} Bills',
                Icons.shopping_bag,
                AppTheme.blue400,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildKpiCard(
                'Est. Gross Profit',
                isCashier ? 'Restricted' : '$currency ${store.estimatedGrossProfit.toStringAsFixed(0)}',
                isCashier ? Icons.lock : Icons.auto_graph,
                isCashier ? AppTheme.slate500 : AppTheme.purple400,
              ),
              const SizedBox(width: 10),
              _buildKpiCard(
                'Inventory Value',
                isCashier ? 'Restricted' : '$currency ${store.inventoryCostValue.toStringAsFixed(0)}',
                Icons.inventory_2,
                isCashier ? AppTheme.slate500 : AppTheme.indigo400,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildKpiCard(
                'Low Stock Items',
                '${store.lowStockCount} Products',
                Icons.warning_amber,
                AppTheme.amber400,
                onTap: onNavigateToInventory,
              ),
              const SizedBox(width: 10),
              _buildKpiCard(
                'Udhaar Receivables',
                '$currency ${store.totalReceivables.toStringAsFixed(0)}',
                Icons.account_balance_wallet,
                Colors.orangeAccent,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildKpiCard(
                'Supplier Payables',
                '$currency ${store.totalPayables.toStringAsFixed(0)}',
                Icons.business,
                AppTheme.rose400,
              ),
              const SizedBox(width: 10),
              _buildKpiCard(
                'Operating Expenses',
                '$currency ${store.totalExpenses.toStringAsFixed(0)}',
                Icons.receipt,
                AppTheme.cyan400,
              ),
            ],
          ),

          if (!ent.allowExpiryAlerts) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => showDialog(context: context, builder: (_) => const AuthModal()),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.amber500.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lock_outline, size: 18, color: AppTheme.amber400),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Near-Expiry Alerts Disabled on Starter Monthly • Tap to Upgrade to Pro',
                        style: TextStyle(color: AppTheme.amber300, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.amber400),
                  ],
                ),
              ),
            ),
          ] else if (store.expiryAlertCount > 0) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: onNavigateToInventory,
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: store.expiredProducts.isNotEmpty
                      ? AppTheme.rose500.withValues(alpha: 0.12)
                      : Colors.amber.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: store.expiredProducts.isNotEmpty
                        ? AppTheme.rose500.withValues(alpha: 0.45)
                        : Colors.amber.withValues(alpha: 0.45),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.event_busy,
                          size: 18,
                          color: store.expiredProducts.isNotEmpty ? AppTheme.rose400 : AppTheme.amber400,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Expiry Alert: ${store.expiredProducts.length} Expired • ${store.nearExpiryProducts.length} Near Expiry (≤30d)',
                            style: TextStyle(
                              color: store.expiredProducts.isNotEmpty ? AppTheme.rose400 : AppTheme.amber400,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.slate400),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...store.expiryAlertProducts.take(3).map((p) {
                      final days = p.daysUntilExpiry ?? 0;
                      final statusText = days < 0 ? 'EXPIRED ${days.abs()}d ago' : (days == 0 ? 'Expires TODAY' : 'Expires in ${days}d');
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${p.name} (${p.expiryDate})',
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.white, fontSize: 11),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: (days < 0 ? AppTheme.rose500 : Colors.amber).withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                statusText,
                                style: TextStyle(
                                  color: days < 0 ? AppTheme.rose400 : AppTheme.amber400,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 20),

          // Quick Operations Panel
          const Text(
            'QUICK SHORTCUTS',
            style: TextStyle(color: AppTheme.slate400, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildActionTile(
                  context,
                  'Daily Z-Report',
                  Icons.calculate,
                  AppTheme.emerald400,
                  () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const ZReportModal(),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionTile(
                  context,
                  'Barcode Scan',
                  Icons.qr_code_scanner,
                  AppTheme.blue400,
                  () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => ScannerModal(
                      onScanned: (c) => store.showToast('Scanned SKU: $c'),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildActionTile(
                  context,
                  ent.allowCloudSync ? 'Cloud Sync' : 'Cloud Sync (Pro)',
                  ent.allowCloudSync ? Icons.cloud_sync : Icons.lock_outline,
                  ent.allowCloudSync ? AppTheme.indigo400 : AppTheme.amber400,
                  ent.allowCloudSync
                      ? () => store.syncAllToCloud()
                      : () {
                          store.showToast('Cloud Sync requires Business Pro Monthly.');
                          showDialog(context: context, builder: (_) => const AuthModal());
                        },
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // 7-Day Revenue Bar Chart
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
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text('7-Day Sales Revenue Trend', overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    ),
                    SizedBox(width: 8),
                    Text('Live Analytics', style: TextStyle(color: AppTheme.cyan400, fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 130,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: sevenDaySales.map((d) {
                      final total = d['total'] as double;
                      final ratio = maxDayTotal > 0 ? (total / maxDayTotal).clamp(0.15, 1.0) : 0.2;
                      final isToday = d['day'] == 'Today';

                      return Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            Text(
                              '${(total / 1000).toStringAsFixed(1)}k',
                              style: TextStyle(
                                color: isToday ? AppTheme.cyan400 : AppTheme.slate500,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              width: 20,
                              height: 82 * ratio,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: isToday
                                      ? [AppTheme.cyan400, AppTheme.blue600]
                                      : [AppTheme.blue500.withValues(alpha: 0.7), AppTheme.indigo600.withValues(alpha: 0.5)],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                                borderRadius: BorderRadius.circular(6),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              d['day'] as String,
                              style: TextStyle(
                                color: isToday ? Colors.white : AppTheme.slate400,
                                fontSize: 10,
                                fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Top-Selling Items Leaderboard
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
                const Text('Top-Selling Products', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 10),
                if (topSelling.isEmpty)
                  const Text('Complete a sale to see top movers', style: TextStyle(color: AppTheme.slate500, fontSize: 12))
                else
                  ...topSelling.take(5).map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppTheme.blue500.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.star, size: 14, color: AppTheme.amber400),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['name'] as String, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                  Text('${item['category']} • ${item['qty']} units sold', overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              '$currency ${(item['rev'] as double).round()}',
                              style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 12),
                            ),
                          ],
                        ),
                      )),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Recent Invoices List
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Recent Sales Invoices', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                    Text('${store.salesHistory.length} Total', style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 12),
                if (store.salesHistory.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Center(child: Text('No sales recorded yet', style: TextStyle(color: AppTheme.slate500))),
                  )
                else
                  ...store.salesHistory.take(5).map((s) {
                    final isRefund = s.isRefunded;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.slate950,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.slate800),
                      ),
                      child: ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: isRefund ? Colors.red.withValues(alpha: 0.1) : AppTheme.emerald500.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            isRefund ? Icons.replay : Icons.receipt,
                            size: 18,
                            color: isRefund ? Colors.redAccent : AppTheme.emerald400,
                          ),
                        ),
                        title: Text(s.invoiceNumber, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        subtitle: Text('${s.customerName ?? 'Walk-in'} • ${s.items.length} items', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$currency ${s.grandTotal.toStringAsFixed(0)}',
                              style: TextStyle(
                                color: isRefund ? Colors.redAccent : AppTheme.emerald400,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.chevron_right, size: 16, color: AppTheme.slate500),
                          ],
                        ),
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => ReceiptModal(sale: s),
                          );
                        },
                      ),
                    );
                  }),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color, {VoidCallback? onTap}) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.slate900,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.slate800),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 16, color: color),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(label, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  value,
                  style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 15),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActionTile(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.slate900,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.slate800),
        ),
        child: Column(
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 4),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
