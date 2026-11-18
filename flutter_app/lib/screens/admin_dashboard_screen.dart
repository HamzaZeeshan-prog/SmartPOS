import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../data/saas_config.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  String _filter = 'pendingApproval';
  bool _isRefreshing = false;

  Future<void> _syncCloud(AppStore store) async {
    if (_isRefreshing) return;
    setState(() => _isRefreshing = true);
    await store.refreshCloudRegistry();
    if (!mounted) return;
    setState(() => _isRefreshing = false);
    store.showToast('Synced live requests from Cloud Firestore!');
  }

  Future<void> _showRejectDialog(AppStore store, Shop shop) async {
    final reasonCtrl = TextEditingController(text: 'Payment transaction reference could not be verified');
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppTheme.slate800),
        ),
        title: Text(
          'Reject Subscription: ${shop.name}',
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
        ),
        content: TextField(
          controller: reasonCtrl,
          maxLines: 3,
          style: const TextStyle(color: Colors.white, fontSize: 12),
          decoration: InputDecoration(
            labelText: 'Rejection Reason',
            labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
            filled: true,
            fillColor: AppTheme.slate950,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.rose600, foregroundColor: Colors.white),
            onPressed: () {
              final reason = reasonCtrl.text.trim().isNotEmpty
                  ? reasonCtrl.text.trim()
                  : 'Payment not verified by Admin';
              store.rejectShop(shop.id, reason);
              Navigator.pop(ctx);
            },
            child: const Text('Confirm Reject', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final shops = store.allShops;

    int pendingCount = 0;
    int activeCount = 0;
    int blockedOrExpCount = 0;
    double activeMrr = 0;

    for (final s in shops) {
      final st = SaasConfig.getEffectiveStatus(s);
      if (st == SubscriptionStatus.pendingApproval) {
        pendingCount++;
      } else if (st == SubscriptionStatus.active) {
        activeCount++;
        activeMrr += s.subscriptionFee ?? 2500;
      } else {
        blockedOrExpCount++;
      }
    }

    final filtered = shops.where((s) {
      final st = SaasConfig.getEffectiveStatus(s);
      if (_filter == 'all') return true;
      if (_filter == 'pendingApproval') return st == SubscriptionStatus.pendingApproval;
      if (_filter == 'active') return st == SubscriptionStatus.active;
      if (_filter == 'blocked') return st == SubscriptionStatus.blocked;
      return st == SubscriptionStatus.expired || st == SubscriptionStatus.rejected;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.slate950,
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              children: [
                // Top Admin AppBar
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: const BoxDecoration(
                    color: AppTheme.slate900,
                    border: Border(bottom: BorderSide(color: AppTheme.slate800)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.indigo600.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.indigo500.withValues(alpha: 0.4)),
                        ),
                        child: const Icon(Icons.admin_panel_settings, color: AppTheme.indigo400, size: 20),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Super Admin Console',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 15),
                            ),
                            Text(
                              'Live Cloud Sync • Monthly Approvals • Tenant Access',
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: AppTheme.slate400, fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.blue500, width: 0.9),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: _isRefreshing ? null : () => _syncCloud(store),
                        icon: _isRefreshing
                            ? const SizedBox(
                                width: 12,
                                height: 12,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.blue400),
                              )
                            : const Icon(Icons.cloud_sync, size: 14, color: AppTheme.blue400),
                        label: const Text('Sync', style: TextStyle(color: AppTheme.blue400, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 6),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.rose500, width: 0.9),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        onPressed: () => store.logoutSaaS(),
                        icon: const Icon(Icons.logout, size: 14, color: AppTheme.rose400),
                        label: const Text('Exit', style: TextStyle(color: AppTheme.rose400, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),

                // KPI Grid
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
                  child: GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    childAspectRatio: 2.5,
                    children: [
                      _kpiCard('Pending Approvals', '$pendingCount', AppTheme.amber400, Icons.hourglass_top),
                      _kpiCard('Active Businesses', '$activeCount', AppTheme.emerald400, Icons.verified),
                      _kpiCard('Blocked / Expired', '$blockedOrExpCount', AppTheme.rose400, Icons.block),
                      _kpiCard('Active Monthly MRR', 'PKR ${activeMrr.round()}', AppTheme.blue400, Icons.payments),
                    ],
                  ),
                ),

                // Filter Chips
                SizedBox(
                  height: 40,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    children: [
                      _filterChip('pendingApproval', 'Pending ($pendingCount)', AppTheme.amber400),
                      _filterChip('active', 'Active ($activeCount)', AppTheme.emerald400),
                      _filterChip('blocked', 'Blocked', AppTheme.rose400),
                      _filterChip('expired', 'Exp / Rejected', AppTheme.slate400),
                      _filterChip('all', 'All (${shops.length})', AppTheme.blue400),
                    ],
                  ),
                ),
                const SizedBox(height: 6),

                // Shop Cards List
                Expanded(
                  child: filtered.isEmpty
                      ? const Center(
                          child: Text(
                            'No businesses match this subscription filter.',
                            style: TextStyle(color: AppTheme.slate500, fontSize: 12),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
                          itemCount: filtered.length,
                          itemBuilder: (ctx, i) {
                            final shop = filtered[i];
                            final st = SaasConfig.getEffectiveStatus(shop);
                            final remDays = SaasConfig.getRemainingDays(shop);

                            Color statusColor;
                            String statusLabel;
                            switch (st) {
                              case SubscriptionStatus.pendingApproval:
                                statusColor = AppTheme.amber400;
                                statusLabel = 'PENDING APPROVAL';
                                break;
                              case SubscriptionStatus.active:
                                statusColor = AppTheme.emerald400;
                                statusLabel = 'ACTIVE (${remDays}d left)';
                                break;
                              case SubscriptionStatus.blocked:
                                statusColor = AppTheme.rose400;
                                statusLabel = 'BLOCKED';
                                break;
                              case SubscriptionStatus.rejected:
                                statusColor = AppTheme.rose400;
                                statusLabel = 'REJECTED';
                                break;
                              case SubscriptionStatus.expired:
                                statusColor = AppTheme.slate400;
                                statusLabel = 'MONTH EXPIRED';
                                break;
                            }

                            return Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppTheme.slate900,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: st == SubscriptionStatus.pendingApproval
                                      ? AppTheme.amber500.withValues(alpha: 0.5)
                                      : AppTheme.slate800,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          shop.name,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: statusColor.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                                        ),
                                        child: Text(
                                          statusLabel,
                                          style: TextStyle(color: statusColor, fontSize: 9.5, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Owner: ${shop.ownerName} • ${shop.city} • ${shop.category}',
                                    style: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                                  ),
                                  Text(
                                    'Email: ${shop.ownerEmail ?? 'N/A'} • Phone: ${shop.phone}',
                                    style: const TextStyle(color: AppTheme.slate500, fontSize: 10),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.slate950,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppTheme.slate800),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.receipt, size: 14, color: AppTheme.blue400),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            '${shop.subscriptionPlanName ?? 'Starter Monthly'} (PKR ${(shop.subscriptionFee ?? 2500).round()}) • ${shop.subscriptionPaymentMethod ?? 'JazzCash'} Ref: ${shop.subscriptionPaymentRef ?? 'N/A'}',
                                            style: const TextStyle(color: AppTheme.slate300, fontSize: 10.5),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (shop.subscriptionRejectionReason != null &&
                                      shop.subscriptionRejectionReason!.isNotEmpty) ...[
                                    const SizedBox(height: 6),
                                    Text(
                                      'Reason: ${shop.subscriptionRejectionReason}',
                                      style: const TextStyle(color: AppTheme.rose400, fontSize: 10.5),
                                    ),
                                  ],
                                  const SizedBox(height: 10),
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 6,
                                    children: [
                                      if (st == SubscriptionStatus.pendingApproval ||
                                          st == SubscriptionStatus.rejected ||
                                          st == SubscriptionStatus.expired)
                                        ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.emerald600,
                                            foregroundColor: Colors.white,
                                            visualDensity: VisualDensity.compact,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => store.approveShop(shop.id),
                                          icon: const Icon(Icons.check_circle, size: 14),
                                          label: const Text('Approve (30d)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                        ),
                                      if (st == SubscriptionStatus.pendingApproval)
                                        OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            side: const BorderSide(color: AppTheme.rose500),
                                            visualDensity: VisualDensity.compact,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => _showRejectDialog(store, shop),
                                          icon: const Icon(Icons.close, size: 14, color: AppTheme.rose400),
                                          label: const Text('Reject', style: TextStyle(fontSize: 11, color: AppTheme.rose400, fontWeight: FontWeight.bold)),
                                        ),
                                      if (st == SubscriptionStatus.active) ...[
                                        OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            side: const BorderSide(color: AppTheme.rose500),
                                            visualDensity: VisualDensity.compact,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => store.blockShop(shop.id),
                                          icon: const Icon(Icons.block, size: 14, color: AppTheme.rose400),
                                          label: const Text('Block Business', style: TextStyle(fontSize: 11, color: AppTheme.rose400, fontWeight: FontWeight.bold)),
                                        ),
                                        OutlinedButton.icon(
                                          style: OutlinedButton.styleFrom(
                                            side: const BorderSide(color: AppTheme.amber500),
                                            visualDensity: VisualDensity.compact,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => store.expireShopNow(shop.id),
                                          icon: const Icon(Icons.timer_off, size: 14, color: AppTheme.amber400),
                                          label: const Text('Complete Month', style: TextStyle(fontSize: 11, color: AppTheme.amber400, fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                      if (st == SubscriptionStatus.blocked)
                                        ElevatedButton.icon(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.blue600,
                                            foregroundColor: Colors.white,
                                            visualDensity: VisualDensity.compact,
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          ),
                                          onPressed: () => store.unblockShop(shop.id),
                                          icon: const Icon(Icons.lock_open, size: 14),
                                          label: const Text('Unblock', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
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
            ),
          ),
          if (store.toastMessage != null)
            Positioned(
              top: 60,
              left: 16,
              right: 16,
              child: SafeArea(
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                    decoration: BoxDecoration(
                      color: AppTheme.emerald600,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      store.toastMessage!,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _kpiCard(String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.slate400, fontSize: 9.5)),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(value, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 14)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String id, String label, Color color) {
    final selected = _filter == id;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : AppTheme.slate400,
            fontSize: 11,
            fontWeight: selected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        selected: selected,
        selectedColor: color.withValues(alpha: 0.7),
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: selected ? color : AppTheme.slate800),
        ),
        onSelected: (_) => setState(() => _filter = id),
      ),
    );
  }
}
