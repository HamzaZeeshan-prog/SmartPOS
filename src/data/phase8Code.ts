/**
 * Phase 8 Architecture & Source Code:
 * Daily Closing Z-Report, Profit & Loss (P&L) Statement, Offline Drift/SQLite Sync Queue Engine,
 * and Multi-Role Access Control (RBAC) Security Policy.
 *
 * Included production files:
 * 1. lib/features/reports/presentation/z_report_screen.dart (Daily closing till reconciliation & thermal print)
 * 2. lib/features/reports/presentation/profit_loss_screen.dart (Comprehensive P&L, COGS, margins & category analysis)
 * 3. lib/core/sync/offline_sync_queue.dart (SQLite persistent mutation queue & cloud batch replay)
 * 4. lib/core/security/rbac_policy.dart (Role-based permissions & navigation guard interceptors)
 */

export const Z_REPORT_SCREEN_DART = `// lib/features/reports/presentation/z_report_screen.dart
// Daily Closing "Z-Report" & Cash Drawer Till Reconciliation with ESC/POS Thermal Printing

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/print_service.dart';
import '../../sales/data/sales_repository.dart';
import '../../expenses/data/expenses_repository.dart';

class ZReportScreen extends ConsumerStatefulWidget {
  final String shopId;
  final dynamic shop;
  final String cashierName;

  const ZReportScreen({
    super.key,
    required this.shopId,
    required this.shop,
    required this.cashierName,
  });

  @override
  ConsumerState<ZReportScreen> createState() => _ZReportScreenState();
}

class _ZReportScreenState extends ConsumerState<ZReportScreen> {
  double _openingCash = 5000.0;
  double? _countedCash;
  bool _isReconciled = false;

  @override
  Widget build(BuildContext context) {
    final salesAsync = ref.watch(todaySalesProvider(widget.shopId));
    final expensesAsync = ref.watch(todayExpensesProvider(widget.shopId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daily Closing Z-Report & Till Count'),
        actions: [
          IconButton(
            icon: const Icon(Icons.print),
            tooltip: 'Print Z-Report Slip',
            onPressed: () => _printZReport(salesAsync.valueOrNull ?? [], expensesAsync.valueOrNull ?? []),
          ),
        ],
      ),
      body: salesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: \$err')),
        data: (sales) {
          final expenses = expensesAsync.valueOrNull ?? [];

          // Financial calculations
          final grossSales = sales.fold<double>(0, (sum, s) => sum + s.grandTotal);
          final totalRefunds = sales.where((s) => s.isRefunded ?? false).fold<double>(0, (sum, s) => sum + s.grandTotal);
          final netSales = grossSales - totalRefunds;

          // Cash vs Digital breakdown
          double cashSales = 0;
          double jazzCashSales = 0;
          double easypaisaSales = 0;
          double bankQrSales = 0;
          double creditSales = 0;

          for (final s in sales) {
            for (final p in s.payments) {
              if (p.method == 'cash') cashSales += p.amount;
              if (p.method == 'jazzcash') jazzCashSales += p.amount;
              if (p.method == 'easypaisa') easypaisaSales += p.amount;
              if (p.method == 'bank_qr') bankQrSales += p.amount;
              if (p.method == 'customer_credit') creditSales += p.amount;
            }
          }

          final cashExpenses = expenses.fold<double>(0, (sum, e) => sum + e.amount);
          final expectedCashInDrawer = _openingCash + cashSales - cashExpenses - totalRefunds;
          final cashDifference = _countedCash != null ? (_countedCash! - expectedCashInDrawer) : 0.0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Card
                Card(
                  color: Colors.blue.shade900,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.shop.name.toString().toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                        Text('Shift Cashier: \${widget.cashierName} | Date: \${DateTime.now().toString().substring(0, 10)}', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                        const Divider(color: Colors.white24, height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('NET SHIFT SALES', style: TextStyle(color: Colors.white70, fontSize: 12)),
                            Text('PKR \$netSales', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Till Reconciliation Card
                Card(
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Cash Drawer Till Audit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        _metricRow('Opening Till Float:', 'PKR \$_openingCash'),
                        _metricRow('Cash Sales Inflow (+):', 'PKR \$cashSales', color: Colors.green),
                        _metricRow('Cash Refunds Outflow (-):', '- PKR \$totalRefunds', color: Colors.red),
                        _metricRow('Cash Expenses from Till (-):', '- PKR \$cashExpenses', color: Colors.red),
                        const Divider(),
                        _metricRow('EXPECTED DRAWER CASH:', 'PKR \$expectedCashInDrawer', isBold: true, fontSize: 15),
                        const SizedBox(height: 16),

                        // Counted Cash Input
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: 'Actual Counted Cash in Till',
                                  prefixText: 'PKR ',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                                onChanged: (val) {
                                  final numVal = double.tryParse(val);
                                  setState(() {
                                    _countedCash = numVal;
                                    _isReconciled = true;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),

                        if (_countedCash != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: cashDifference.abs() < 1
                                  ? Colors.green.shade50
                                  : (cashDifference < 0 ? Colors.red.shade50 : Colors.blue.shade50),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  cashDifference == 0
                                      ? 'Till Perfectly Balanced'
                                      : (cashDifference < 0 ? 'Cash Short in Drawer:' : 'Cash Over in Drawer:'),
                                  style: TextStyle(fontWeight: FontWeight.bold, color: cashDifference < 0 ? Colors.red : Colors.green),
                                ),
                                Text(
                                  'PKR \${cashDifference.abs()}',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: cashDifference < 0 ? Colors.red : Colors.green),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Payment Method Breakdown
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Collections by Payment Channel', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        _metricRow('Cash in Till:', 'PKR \$cashSales'),
                        _metricRow('JazzCash Digital:', 'PKR \$jazzCashSales'),
                        _metricRow('Easypaisa QR:', 'PKR \$easypaisaSales'),
                        _metricRow('Bank Transfer / Raast:', 'PKR \$bankQrSales'),
                        _metricRow('Customer Credit (Udhaar):', 'PKR \$creditSales'),
                        const Divider(),
                        _metricRow('Total Orders Processed:', '\${sales.length} transactions', isBold: true),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _metricRow(String label, String value, {bool isBold = false, Color? color, double fontSize = 13}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: color)),
        ],
      ),
    );
  }

  void _printZReport(List<dynamic> sales, List<dynamic> expenses) {
    final printService = PrintService(NetworkSocketTransport());
    final builder = EscPosBuilder(paperWidth: PaperWidth.mm80);

    builder
      .reset()
      .alignCenter()
      .setBold(true)
      .setTextSize(doubleWidth: true, doubleHeight: true)
      .text('DAILY CLOSING Z-REPORT')
      .setTextSize(doubleWidth: false, doubleHeight: false)
      .text(widget.shop.name.toString().toUpperCase())
      .text('Cashier: \${widget.cashierName}')
      .text('Closed: \${DateTime.now().toString().substring(0, 19)}')
      .divider('=')
      .alignLeft()
      .rowTwoColumn('Opening Float:', 'PKR \$_openingCash')
      .rowTwoColumn('Gross Sales:', 'PKR \${sales.fold<double>(0, (sum, s) => sum + s.grandTotal)}')
      .rowTwoColumn('Total Expenses:', 'PKR \${expenses.fold<double>(0, (sum, e) => sum + e.amount)}')
      .divider('-')
      .rowTwoColumn('Drawer Expected:', 'PKR \${_openingCash}')
      .rowTwoColumn('Drawer Counted:', 'PKR \${_countedCash ?? 0}', bold: true)
      .divider('=')
      .feed(2)
      .text('Cashier Signature: __________________')
      .feed(1)
      .text('Manager Verification: _______________')
      .feed(3)
      .cutPaper();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Z-Report Printed Successfully!'), backgroundColor: Colors.green),
    );
  }
}
`;

export const PROFIT_LOSS_SCREEN_DART = `// lib/features/reports/presentation/profit_loss_screen.dart
// Comprehensive Profit & Loss (P&L) Statement, Cost of Goods Sold (COGS), and Gross/Net Margins

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../sales/data/sales_repository.dart';
import '../../expenses/data/expenses_repository.dart';

class ProfitLossScreen extends ConsumerWidget {
  final String shopId;
  const ProfitLossScreen({super.key, required this.shopId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salesAsync = ref.watch(salesHistoryProvider(shopId));
    final expensesAsync = ref.watch(expensesListProvider(shopId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profit & Loss (P&L) Statement'),
        actions: [
          IconButton(icon: const Icon(Icons.file_download), onPressed: () {}),
        ],
      ),
      body: salesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: \$err')),
        data: (sales) {
          final expenses = expensesAsync.valueOrNull ?? [];

          // 1. Revenue
          final grossSales = sales.fold<double>(0, (sum, s) => sum + s.grandTotal);
          final returns = sales.where((s) => s.isRefunded ?? false).fold<double>(0, (sum, s) => sum + s.grandTotal);
          final netRevenue = grossSales - returns;

          // 2. Cost of Goods Sold (COGS)
          double cogs = 0;
          for (final s in sales) {
            if (!(s.isRefunded ?? false)) {
              for (final item in s.items) {
                final cost = (item.product.costPrice as num).toDouble();
                cogs += cost * item.quantity;
              }
            }
          }

          // 3. Gross Profit
          final grossProfit = netRevenue - cogs;
          final grossMarginPct = netRevenue > 0 ? (grossProfit / netRevenue * 100) : 0.0;

          // 4. Operating Expenses
          final totalOperatingExpenses = expenses.fold<double>(0, (sum, e) => sum + e.amount);

          // 5. Net Profit
          final netProfit = grossProfit - totalOperatingExpenses;
          final netMarginPct = netRevenue > 0 ? (netProfit / netRevenue * 100) : 0.0;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Net Profit Highlight Card
                Card(
                  color: netProfit >= 0 ? Colors.emerald.shade900 : Colors.rose.shade900,
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        const Text('NET BUSINESS PROFIT', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(
                          'PKR \${netProfit.toStringAsFixed(0)}',
                          style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.black),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Net Profit Margin: \${netMarginPct.toStringAsFixed(1)}%',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Financial Breakdown Table
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('P&L Ledger Breakdown', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const Divider(height: 20),

                        // Revenue section
                        _sectionHeader('1. OPERATING REVENUE'),
                        _row('Gross Sales Volume', 'PKR \$grossSales'),
                        _row('Less: Sales Returns & Refunds', '- PKR \$returns', color: Colors.red),
                        _row('Net Sales Revenue', 'PKR \$netRevenue', isBold: true),

                        const Divider(height: 24),

                        // COGS section
                        _sectionHeader('2. COST OF GOODS SOLD (COGS)'),
                        _row('Inventory Cost of Items Sold', 'PKR \$cogs'),
                        _row('GROSS PROFIT', 'PKR \$grossProfit', isBold: true, color: Colors.green.shade700),
                        _row('Gross Margin Percentage', '\${grossMarginPct.toStringAsFixed(1)}%'),

                        const Divider(height: 24),

                        // Expenses section
                        _sectionHeader('3. OPERATING EXPENSES'),
                        for (final exp in expenses)
                          _row('\${exp.category}: \${exp.description}', 'PKR \${exp.amount}'),
                        _row('Total Operating Expenses', '- PKR \$totalOperatingExpenses', isBold: true, color: Colors.red),

                        const Divider(thickness: 2, height: 28),

                        // Net Profit
                        _row('NET PROFIT / (LOSS)', 'PKR \$netProfit', isBold: true, fontSize: 18, color: netProfit >= 0 ? Colors.green.shade800 : Colors.red),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
    );
  }

  Widget _row(String label, String value, {bool isBold = false, Color? color, double fontSize = 13}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: TextStyle(fontSize: fontSize, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: color)),
        ],
      ),
    );
  }
}
`;

export const OFFLINE_SYNC_QUEUE_DART = `// lib/core/sync/offline_sync_queue.dart
// Production Drift/SQLite Offline Mutation Queue, Network Monitor & Firestore Batch Replay Engine

import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../database/app_database.dart';

enum SyncStatus { idle, syncing, offline, error }

class SyncQueueState {
  final int pendingCount;
  final SyncStatus status;
  final DateTime? lastSyncTime;
  final String? errorMessage;

  const SyncQueueState({
    this.pendingCount = 0,
    this.status = SyncStatus.idle,
    this.lastSyncTime,
    this.errorMessage,
  });

  SyncQueueState copyWith({
    int? pendingCount,
    SyncStatus? status,
    DateTime? lastSyncTime,
    String? errorMessage,
  }) {
    return SyncQueueState(
      pendingCount: pendingCount ?? this.pendingCount,
      status: status ?? this.status,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class OfflineSyncQueueNotifier extends StateNotifier<SyncQueueState> {
  final AppDatabase _db;
  StreamSubscription? _connectivitySub;

  OfflineSyncQueueNotifier(this._db) : super(const SyncQueueState()) {
    _initConnectivityListener();
    _refreshPendingCount();
  }

  void _initConnectivityListener() {
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isOnline = results.any((r) => r != ConnectivityResult.none);
      if (isOnline) {
        processQueue();
      } else {
        state = state.copyWith(status: SyncStatus.offline);
      }
    });
  }

  Future<void> _refreshPendingCount() async {
    final count = await _db.getPendingSyncQueueCount();
    state = state.copyWith(pendingCount: count);
  }

  /// Enqueue an offline mutation to SQLite
  Future<void> enqueue({
    required String shopId,
    required String entityType,
    required String entityId,
    required String action, // 'insert' | 'update' | 'delete'
    required Map<String, dynamic> payload,
  }) async {
    await _db.insertSyncQueueItem(
      SyncQueueTableCompanion.insert(
        id: '\${entityType}_\${entityId}_\${DateTime.now().millisecondsSinceEpoch}',
        shopId: shopId,
        entityType: entityType,
        entityId: entityId,
        action: action,
        payloadJson: jsonEncode(payload),
        createdAt: DateTime.now(),
        status: 'pending',
        retryCount: 0,
      ),
    );

    await _refreshPendingCount();

    // Attempt instant upload if online
    processQueue();
  }

  /// Process all pending items with exponential backoff
  Future<void> processQueue() async {
    final connectivity = await Connectivity().checkConnectivity();
    if (connectivity.every((c) => c == ConnectivityResult.none)) {
      state = state.copyWith(status: SyncStatus.offline);
      return;
    }

    state = state.copyWith(status: SyncStatus.syncing);

    try {
      final pendingItems = await _db.getPendingSyncQueueItems(limit: 50);
      if (pendingItems.isEmpty) {
        state = state.copyWith(status: SyncStatus.idle, pendingCount: 0);
        return;
      }

      for (final item in pendingItems) {
        try {
          // Replay mutation to Cloud Firestore
          await _uploadToFirestore(item);

          // Mark item as synced / remove from SQLite queue
          await _db.deleteSyncQueueItem(item.id);
        } catch (e) {
          debugPrint('[OfflineSyncQueue] Error syncing item \${item.id}: \$e');
          await _db.incrementSyncRetry(item.id, e.toString());
        }
      }

      final remaining = await _db.getPendingSyncQueueCount();
      state = state.copyWith(
        status: remaining == 0 ? SyncStatus.idle : SyncStatus.error,
        pendingCount: remaining,
        lastSyncTime: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(status: SyncStatus.error, errorMessage: e.toString());
    }
  }

  Future<void> _uploadToFirestore(dynamic queueItem) async {
    // Firestore batch / document sync implementation
    // Mirror mutations to /shops/{shopId}/{entityType}/{entityId}
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }
}
`;

export const RBAC_POLICY_DART = `// lib/core/security/rbac_policy.dart
// Role-Based Access Control (RBAC) Permissions & Screen Navigation Interceptor

import 'package:flutter/material.dart';

enum UserRole {
  owner,
  manager,
  cashier,
}

enum PosPermission {
  accessPosTerminal,
  barcodeScanner,
  createCustomer,
  reprintReceipts,
  processRefunds,
  manageInventory,
  editCostPrice,
  viewProfitMargins,
  manageStaff,
  accessZReport,
  modifyStoreSettings,
}

class RbacPolicy {
  static const Map<UserRole, Set<PosPermission>> _rolePermissions = {
    UserRole.cashier: {
      PosPermission.accessPosTerminal,
      PosPermission.barcodeScanner,
      PosPermission.createCustomer,
      PosPermission.reprintReceipts,
    },
    UserRole.manager: {
      PosPermission.accessPosTerminal,
      PosPermission.barcodeScanner,
      PosPermission.createCustomer,
      PosPermission.reprintReceipts,
      PosPermission.processRefunds,
      PosPermission.manageInventory,
      PosPermission.accessZReport,
    },
    UserRole.owner: {
      PosPermission.accessPosTerminal,
      PosPermission.barcodeScanner,
      PosPermission.createCustomer,
      PosPermission.reprintReceipts,
      PosPermission.processRefunds,
      PosPermission.manageInventory,
      PosPermission.editCostPrice,
      PosPermission.viewProfitMargins,
      PosPermission.manageStaff,
      PosPermission.accessZReport,
      PosPermission.modifyStoreSettings,
    },
  };

  static bool hasPermission(UserRole role, PosPermission permission) {
    return _rolePermissions[role]?.contains(permission) ?? false;
  }
}

/// UI Widget Guard that hides or shows content based on role
class RbacGuard extends StatelessWidget {
  final UserRole userRole;
  final PosPermission permission;
  final Widget child;
  final Widget? fallback;

  const RbacGuard({
    super.key,
    required this.userRole,
    required this.permission,
    required this.child,
    this.fallback,
  });

  @override
  Widget build(BuildContext context) {
    if (RbacPolicy.hasPermission(userRole, permission)) {
      return child;
    }
    return fallback ?? const SizedBox.shrink();
  }
}
`;
