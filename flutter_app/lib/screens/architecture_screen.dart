import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../store/app_store.dart';

class ArchitectureScreen extends StatelessWidget {
  const ArchitectureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final ent = store.entitlements;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF312E81), Color(0xFF1E1B4B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.indigo500.withValues(alpha: 0.3)),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.flutter_dash, color: Colors.lightBlueAccent, size: 24),
                    SizedBox(width: 8),
                    Text(
                      'Production Flutter Mobile App',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
                SizedBox(height: 6),
                Text(
                  '100% Native Dart & Flutter Codebase with Provider State Management, Drift SQLite Offline Storage, and Cloud Firestore Realtime Sync.',
                  style: TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Architecture Highlights
          _buildArchCard(
            'State Management & Reactive Store',
            'Implemented via Provider + ChangeNotifier (AppStore) managing reactive product catalog, stock decrements, cart mutations, customer khata ledger, and cloud synchronization.',
            Icons.account_tree,
            Colors.tealAccent,
          ),
          const SizedBox(height: 10),
          _buildArchCard(
            'Offline-First Local + Cloud Engine',
            'All POS transactions and inventory mutations are written locally with zero-latency. When online, changes automatically sync to Cloud Firestore.',
            Icons.cloud_sync,
            AppTheme.blue400,
          ),
          const SizedBox(height: 10),
          _buildArchCard(
            'Hardware & POS Peripheral Rails',
            'Thermal Receipt generation formatted for 58mm & 80mm ESC/POS roll printers, barcode camera scanning with viewfinder, and WhatsApp digital receipt sharing.',
            Icons.print,
            AppTheme.emerald400,
          ),
          const SizedBox(height: 10),
          _buildArchCard(
            'Pakistani Payment Rails & Khata',
            'Supports Cash with quick tender calculators, JazzCash & Easypaisa digital wallet gateways, State Bank Raast P2M Dynamic QR, and Udhaar ledger tracking.',
            Icons.payments,
            Colors.amberAccent,
          ),

          const SizedBox(height: 20),

          // Cloud Status details
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
                const Text('ENVIRONMENT & CONNECTION', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 8),
                _buildEnvRow('Active Package', ent.planName),
                _buildEnvRow('Cloud Firestore DB', 'ai-studio-omnipos-c17c88f1'),
                _buildEnvRow(
                  'Cloud Status',
                  !ent.allowCloudSync
                      ? 'LOCAL ONLY (Starter Plan)'
                      : (store.cloudConnected ? 'ONLINE (Sync Active)' : 'OFFLINE (Local Mode)'),
                ),
                _buildEnvRow('Target Platform', 'Flutter 3.x (Android / iOS / Web)'),
                _buildEnvRow('Architecture Pattern', 'Clean Architecture (Data, Domain, Presentation)'),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: ent.allowCloudSync ? AppTheme.blue400 : AppTheme.amber400,
                      side: BorderSide(color: ent.allowCloudSync ? AppTheme.blue500 : AppTheme.amber500),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: Icon(ent.allowCloudSync ? Icons.refresh : Icons.lock_outline, size: 16),
                    label: Text(ent.allowCloudSync ? 'Test Cloud Firestore Ping' : 'Cloud Sync Locked (Business Pro Only)'),
                    onPressed: ent.allowCloudSync
                        ? () => store.testCloudConnection()
                        : () => store.showToast('Cloud Sync is disabled on Starter Monthly. Upgrade to Business Pro.'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArchCard(String title, String desc, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(color: AppTheme.slate400, fontSize: 11, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnvRow(String key, String val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(key, style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              val,
              textAlign: TextAlign.right,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
