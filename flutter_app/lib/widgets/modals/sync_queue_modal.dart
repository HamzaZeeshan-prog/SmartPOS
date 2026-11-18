import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../store/app_store.dart';

class SyncQueueModal extends StatelessWidget {
  const SyncQueueModal({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final ent = store.entitlements;
    final queue = store.shopSyncQueue;
    final pendingCount = queue.where((q) => q.status == 'pending').length;

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
                Icon(
                  !ent.allowCloudSync
                      ? Icons.lock_outline
                      : (store.cloudConnected ? Icons.cloud_done : Icons.cloud_off),
                  color: !ent.allowCloudSync
                      ? AppTheme.amber400
                      : (store.cloudConnected ? AppTheme.emerald400 : AppTheme.amber400),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Offline SQLite & Cloud Sync Engine', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                      Text(
                        !ent.allowCloudSync
                            ? 'Local Storage Only (${ent.planName})'
                            : (store.cloudConnected ? 'Bidirectional Firestore Sync Active' : 'Offline Mode (Local SQLite Write Queue)'),
                        style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                      ),
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
                if (!ent.allowCloudSync) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.amber500.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.45)),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.lock_outline, color: AppTheme.amber400, size: 18),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Cloud Sync is disabled on Starter Monthly. Upgrade to Business Pro Monthly from your Account menu to sync across branches.',
                            style: TextStyle(color: AppTheme.amber300, fontSize: 11),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Connection toggle & counters
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Network Connection State', overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                Text(
                                  !ent.allowCloudSync
                                      ? 'Local-only persistence active'
                                      : (pendingCount > 0 ? '$pendingCount local changes waiting for cloud upload' : 'All local records synced with cloud'),
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: ent.allowCloudSync && store.cloudConnected,
                            activeThumbColor: AppTheme.emerald400,
                            onChanged: ent.allowCloudSync ? (_) => store.toggleCloudMode() : null,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.amber400,
                                side: const BorderSide(color: AppTheme.amber500, width: 0.8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                              ),
                              onPressed: () => store.simulateOfflinePendingItem(),
                              icon: const Icon(Icons.wifi_off, size: 15),
                              label: const Text('Queue Offline', overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: ent.allowCloudSync ? AppTheme.blue600 : AppTheme.slate800,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
                              ),
                              onPressed: (!ent.allowCloudSync || store.isSyncingCloud)
                                  ? null
                                  : () => store.forceReplaySyncQueue(),
                              icon: store.isSyncingCloud
                                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Icon(ent.allowCloudSync ? Icons.sync : Icons.lock_outline, size: 15),
                              label: Text(
                                store.isSyncingCloud
                                    ? 'Syncing...'
                                    : (ent.allowCloudSync ? 'Sync Now' : 'Pro Required'),
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text('TRANSACTION SYNC QUEUE', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                    ),
                    const SizedBox(width: 8),
                    Text('${queue.length} Events', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                  ],
                ),
                const SizedBox(height: 8),

                if (queue.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(child: Text('No sync events recorded for this shop', style: TextStyle(color: AppTheme.slate500, fontSize: 12))),
                  )
                else
                  ...queue.map((item) {
                    final isPending = item.status == 'pending';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.slate950,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isPending ? AppTheme.amber500.withValues(alpha: 0.4) : AppTheme.slate800),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: (isPending ? AppTheme.amber400 : AppTheme.emerald400).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              isPending ? Icons.hourglass_top : Icons.check_circle,
                              size: 16,
                              color: isPending ? AppTheme.amber400 : AppTheme.emerald400,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item.payloadSummary, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                                Text(
                                  '${item.entityType.toUpperCase()} • ${item.action.toUpperCase()} • ${item.entityId}',
                                  style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: (isPending ? AppTheme.amber500 : AppTheme.emerald500).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              item.status.toUpperCase(),
                              style: TextStyle(
                                color: isPending ? AppTheme.amber400 : AppTheme.emerald400,
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
        ],
      ),
    );
  }
}
