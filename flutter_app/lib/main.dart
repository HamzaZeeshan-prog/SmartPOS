import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'models/models.dart';
import 'services/cloud_service.dart';
import 'store/app_store.dart';
import 'screens/pos_terminal_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/inventory_screen.dart';
import 'screens/sales_manager_screen.dart';
import 'screens/customer_ledger_screen.dart';
import 'screens/suppliers_screen.dart';
import 'screens/expenses_screen.dart';
import 'screens/profit_loss_screen.dart';
import 'screens/architecture_screen.dart';
import 'screens/saas_auth_screen.dart';
import 'screens/admin_dashboard_screen.dart';
import 'widgets/modals/auth_modal.dart';
import 'widgets/modals/onboarding_wizard_modal.dart';
import 'widgets/modals/scanner_modal.dart';
import 'widgets/modals/sync_queue_modal.dart';
import 'widgets/modals/z_report_modal.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await CloudService.initialize();
  runApp(const SmartPosApp());
}

class SmartPosApp extends StatelessWidget {
  const SmartPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppStore()..initialize(),
      child: MaterialApp(
        title: 'Smart POS Pro',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: const MainShell(),
      ),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  bool _drawerOpen = false;
  late AnimationController _pulseCtrl;

  final _allViews = [
    {'id': 0, 'name': 'Cashier POS Terminal', 'icon': Icons.shopping_cart},
    {'id': 1, 'name': 'Store Dashboard', 'icon': Icons.dashboard},
    {'id': 2, 'name': 'Inventory Catalog', 'icon': Icons.inventory_2},
    {'id': 3, 'name': 'Sales & Refunds', 'icon': Icons.receipt_long},
    {'id': 4, 'name': 'Customers & Khata', 'icon': Icons.people},
    {'id': 5, 'name': 'Wholesale Suppliers', 'icon': Icons.business},
    {'id': 6, 'name': 'Operating Expenses', 'icon': Icons.receipt},
    {'id': 7, 'name': 'P&L & Margins', 'icon': Icons.trending_up},
    {'id': 8, 'name': 'Flutter & Dart Code Hub', 'icon': Icons.memory},
  ];

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  Widget _buildScreen(int index) {
    switch (index) {
      case 0:
        return const PosTerminalScreen();
      case 1:
        return DashboardScreen(
          onNavigateToPos: () => _navigateTo(0),
          onNavigateToInventory: () => _navigateTo(2),
        );
      case 2:
        return const InventoryScreen();
      case 3:
        return const SalesManagerScreen();
      case 4:
        return const CustomerLedgerScreen();
      case 5:
        return const SuppliersScreen();
      case 6:
        return const ExpensesScreen();
      case 7:
        return const ProfitLossScreen();
      case 8:
        return const ArchitectureScreen();
      default:
        return const PosTerminalScreen();
    }
  }

  void _navigateTo(int index) {
    setState(() {
      _currentIndex = index;
      _drawerOpen = false;
    });
  }

  void _openDiagnosticsHud(BuildContext context, AppStore store) {
    HapticFeedback.lightImpact();
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: AppTheme.slate900,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppTheme.slate800),
        ),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.blue500.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.bolt, color: AppTheme.cyan400, size: 18),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Terminal Diagnostics HUD', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('Smart POS System Health', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close, color: AppTheme.slate400, size: 18),
                    ),
                  ],
                ),
                const Divider(color: AppTheme.slate800),
                _hudStatusRow(
                  Icons.cloud,
                  'Database Engine',
                  !store.entitlements.allowCloudSync
                      ? 'Starter Local SQLite Cache'
                      : (store.cloudConnected ? 'Cloud Firestore ↔ Local Cache' : 'Offline Local Mode'),
                  !store.entitlements.allowCloudSync
                      ? 'LOCAL ONLY'
                      : (store.cloudConnected ? 'ONLINE' : 'OFFLINE'),
                  !store.entitlements.allowCloudSync
                      ? AppTheme.amber400
                      : (store.cloudConnected ? AppTheme.emerald400 : AppTheme.amber400),
                ),
                _hudStatusRow(
                  Icons.qr_code_scanner,
                  'USB / Camera Scanner',
                  'Optical & HID Wedge Active',
                  'READY',
                  AppTheme.blue400,
                ),
                _hudStatusRow(
                  Icons.print,
                  'Receipt Printer',
                  '${store.activeShop.thermalPrinterWidth == PrinterWidth.mm58 ? '58mm' : '80mm'} ESC/POS Engine',
                  'ACTIVE',
                  AppTheme.indigo400,
                ),
                const SizedBox(height: 12),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 2.3,
                  children: [
                    _hudToolBtn(
                      store.soundEnabled ? Icons.volume_up : Icons.volume_off,
                      'Scan Audio',
                      store.soundEnabled ? 'Enabled' : 'Muted',
                      store.soundEnabled ? AppTheme.emerald400 : AppTheme.slate400,
                      () {
                        Navigator.pop(ctx);
                        store.toggleSound();
                      },
                    ),
                    _hudToolBtn(
                      Icons.calculate,
                      'Z-Report',
                      'Till Close',
                      AppTheme.emerald400,
                      () {
                        Navigator.pop(ctx);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const ZReportModal(),
                        );
                      },
                    ),
                    _hudToolBtn(
                      Icons.settings,
                      'Shop Wizard',
                      'GST & Receipt',
                      AppTheme.indigo400,
                      () {
                        Navigator.pop(ctx);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => OnboardingWizardModal(shopToEdit: store.activeShop),
                        );
                      },
                    ),
                    _hudToolBtn(
                      Icons.logout,
                      'SaaS Portal',
                      'Switch Tenant',
                      AppTheme.rose400,
                      () {
                        Navigator.pop(ctx);
                        store.logoutSaaS();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _hudStatusRow(IconData icon, String title, String sub, String badge, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                Text(sub, style: const TextStyle(color: AppTheme.slate400, fontSize: 9)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
            child: Text(badge, style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _hudToolBtn(IconData icon, String title, String sub, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.slate950,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.slate800),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                  Text(sub, style: const TextStyle(color: AppTheme.slate400, fontSize: 9)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();

    if (store.isRestoring) {
      return Scaffold(
        backgroundColor: AppTheme.slate950,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppTheme.blue600, AppTheme.indigo600]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text('SP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
                ),
              ),
              const SizedBox(height: 16),
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.blue400),
              ),
              const SizedBox(height: 12),
              const Text(
                'Restoring business session & data...',
                style: TextStyle(color: AppTheme.slate300, fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
      );
    }

    if (store.isSuperAdmin) {
      return const AdminDashboardScreen();
    }

    if (!store.isAuthenticated) {
      return const SaaSAuthScreen();
    }

    return Scaffold(
      backgroundColor: AppTheme.slate950,
      body: Stack(
        children: [
          Column(
            children: [
              _buildAppBar(context, store),
              Expanded(child: _buildScreen(_currentIndex)),
            ],
          ),
          if (_drawerOpen) _buildDrawer(context, store),
          if (store.toastMessage != null) _buildToast(store),
        ],
      ),
      bottomNavigationBar: _currentIndex < 4 ? _buildBottomNav() : null,
      bottomSheet: _currentIndex >= 4 ? _buildBackBar() : null,
    );
  }

  Widget _buildAppBar(BuildContext context, AppStore store) {
    final pendingCount = store.shopSyncQueue.where((q) => q.status == 'pending').length;

    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: const BoxDecoration(
          color: AppTheme.slate900,
          border: Border(bottom: BorderSide(color: AppTheme.slate800)),
        ),
        child: Row(
          children: [
            _buildInteractiveLogo(context, store),
            const SizedBox(width: 6),
            Flexible(
              flex: 0,
              child: GestureDetector(
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => const SyncQueueModal(),
                  );
                },
                child: Builder(
                  builder: (_) {
                    final allowCloud = store.entitlements.allowCloudSync;
                    final isLiveCloud = allowCloud && store.cloudConnected;
                    final pillColor = isLiveCloud ? AppTheme.emerald400 : AppTheme.amber400;
                    final bgColor = isLiveCloud
                        ? AppTheme.emerald500.withValues(alpha: 0.1)
                        : AppTheme.amber500.withValues(alpha: 0.1);
                    final borderColor = isLiveCloud
                        ? AppTheme.emerald500.withValues(alpha: 0.35)
                        : AppTheme.amber500.withValues(alpha: 0.35);

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: borderColor),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            !allowCloud ? Icons.lock_outline : (store.cloudConnected ? Icons.cloud : Icons.cloud_off),
                            size: 13,
                            color: pillColor,
                          ),
                          const SizedBox(width: 3),
                          Text(
                            !allowCloud
                                ? 'Local Only'
                                : (pendingCount > 0 ? 'Sync ($pendingCount)' : (store.cloudConnected ? 'Cloud' : 'Offline')),
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: pillColor,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(width: 4),
            const Spacer(),
            IconButton(
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(),
              padding: const EdgeInsets.symmetric(horizontal: 5),
              tooltip: 'Daily Z-Report',
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const ZReportModal(),
                );
              },
              icon: const Icon(Icons.calculate_outlined, size: 19, color: AppTheme.emerald400),
            ),
            Flexible(
              flex: 2,
              child: _buildShopSelector(context, store),
            ),
            const SizedBox(width: 5),
            Flexible(
              flex: 1,
              child: _buildUserButton(context, store),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractiveLogo(BuildContext context, AppStore store) {
    return GestureDetector(
      onTap: () => _openDiagnosticsHud(context, store),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 36,
            height: 36,
            padding: const EdgeInsets.all(1.5),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.blue600, AppTheme.indigo600, AppTheme.cyan500],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(11),
              boxShadow: [
                BoxShadow(color: AppTheme.blue500.withValues(alpha: 0.3), blurRadius: 8),
              ],
            ),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.slate950,
                borderRadius: BorderRadius.circular(9.5),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'SP',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, height: 1),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(width: 2, height: 4, color: AppTheme.blue400),
                      const SizedBox(width: 1.5),
                      Container(width: 1.5, height: 3, color: AppTheme.cyan400),
                      const SizedBox(width: 1.5),
                      Container(width: 2, height: 4, color: AppTheme.blue400),
                      const SizedBox(width: 1.5),
                      Container(width: 1.5, height: 3, color: AppTheme.cyan400),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: -3,
            right: -3,
            child: FadeTransition(
              opacity: Tween<double>(begin: 0.45, end: 1.0).animate(_pulseCtrl),
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppTheme.cyan400,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppTheme.slate900, width: 1.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShopSelector(BuildContext context, AppStore store) {
    final availableShops = store.userShops;
    final selectedId = availableShops.any((s) => s.id == store.activeShop.id)
        ? store.activeShop.id
        : (availableShops.isNotEmpty ? availableShops.first.id : store.activeShop.id);

    return ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 118),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(
          color: AppTheme.slate950,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppTheme.slate800),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            value: selectedId,
            isDense: true,
            isExpanded: true,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.slate200),
            dropdownColor: AppTheme.slate900,
            items: [
              ...availableShops.map(
                (s) => DropdownMenuItem<String>(
                  value: s.id,
                  child: Text(
                    s.name,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11),
                  ),
                ),
              ),
              if (store.currentUser.role == UserRole.owner && store.entitlements.allowMultiBranch)
                const DropdownMenuItem<String>(
                  value: '__add_new__',
                  child: Text(
                    '+ Add Business',
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: AppTheme.cyan400, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
            onChanged: (id) {
              if (id == '__add_new__') {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  backgroundColor: Colors.transparent,
                  builder: (_) => const OnboardingWizardModal(),
                );
              } else if (id != null) {
                final target = availableShops.cast<Shop?>().firstWhere((s) => s?.id == id, orElse: () => null);
                if (target != null) store.setActiveShop(target);
              }
            },
          ),
        ),
      ),
    );
  }

  Widget _buildUserButton(BuildContext context, AppStore store) {
    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          builder: (_) => const AuthModal(),
        );
      },
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 88),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
          decoration: BoxDecoration(
            color: AppTheme.slate950,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.slate800),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.verified_user, size: 13, color: AppTheme.emerald400),
              const SizedBox(width: 3),
              Flexible(
                child: Text(
                  store.currentUser.name.split(' ').first,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
              const SizedBox(width: 3),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                decoration: BoxDecoration(
                  color: AppTheme.blue500.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  store.currentUser.role.name[0].toUpperCase(),
                  style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.blue300),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.slate900,
        border: Border(top: BorderSide(color: AppTheme.slate800)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(0, Icons.shopping_cart, 'Terminal'),
              _navItem(1, Icons.dashboard, 'Dashboard'),
              _navItem(2, Icons.inventory_2, 'Catalog'),
              _navItem(3, Icons.receipt_long, 'Sales'),
              _navMoreItem(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final selected = _currentIndex == index;
    return GestureDetector(
      onTap: () => _navigateTo(index),
      child: SizedBox(
        width: 56,
        height: 48,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: selected ? AppTheme.blue400 : AppTheme.slate400),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                color: selected ? AppTheme.blue400 : AppTheme.slate400,
                fontWeight: selected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _navMoreItem() {
    return GestureDetector(
      onTap: () => setState(() => _drawerOpen = true),
      child: SizedBox(
        width: 56,
        height: 48,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.more_horiz, size: 20, color: _drawerOpen ? AppTheme.indigo400 : AppTheme.slate400),
            const SizedBox(height: 2),
            Text(
              'More',
              style: TextStyle(
                fontSize: 10,
                color: _drawerOpen ? AppTheme.indigo400 : AppTheme.slate400,
                fontWeight: _drawerOpen ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBackBar() {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.slate900,
        border: Border(top: BorderSide(color: AppTheme.slate800)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              IconButton(
                onPressed: () => _navigateTo(0),
                icon: const Icon(Icons.arrow_back, color: AppTheme.slate300),
              ),
              Expanded(
                child: Text(
                  _allViews[_currentIndex]['name'] as String,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
              const SizedBox(width: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, AppStore store) {
    final drawerWidth = (MediaQuery.of(context).size.width * 0.85).clamp(240.0, 320.0);
    return Positioned.fill(
      child: GestureDetector(
        onTap: () => setState(() => _drawerOpen = false),
        child: Container(
          color: Colors.black.withValues(alpha: 0.8),
          child: Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: () {},
              child: Container(
                width: drawerWidth,
                height: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppTheme.slate900,
                  border: Border(left: BorderSide(color: AppTheme.slate800)),
                ),
                child: SafeArea(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(colors: [AppTheme.blue600, AppTheme.indigo600]),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Center(
                              child: Text('SP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
                            ),
                          ),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Smart POS Pro', overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                Text('Enterprise Retail Management', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => setState(() => _drawerOpen = false),
                            icon: const Icon(Icons.close, color: AppTheme.slate400, size: 20),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'STORE OPERATIONS',
                        style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 8),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _allViews.length,
                          itemBuilder: (ctx, i) {
                            final v = _allViews[i];
                            final viewId = v['id'] as int;
                            final selected = _currentIndex == viewId;
                            final count = _getCount(store, viewId);
                            final isLockedProView = viewId == 7 && !store.entitlements.allowProfitLoss;
                            return ListTile(
                              dense: true,
                              selected: selected,
                              selectedTileColor: AppTheme.blue600,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              leading: Icon(
                                isLockedProView ? Icons.lock_outline : (v['icon'] as IconData),
                                size: 18,
                                color: selected
                                    ? Colors.white
                                    : (isLockedProView ? AppTheme.amber400 : AppTheme.blue400),
                              ),
                              title: Text(
                                v['name'] as String,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: selected
                                      ? Colors.white
                                      : (isLockedProView ? AppTheme.slate400 : AppTheme.slate300),
                                ),
                              ),
                              trailing: isLockedProView
                                  ? Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppTheme.amber500.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                        border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.35)),
                                      ),
                                      child: const Text(
                                        'PRO',
                                        style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.amber400),
                                      ),
                                    )
                                  : count != null
                                      ? Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: selected ? AppTheme.blue700.withValues(alpha: 0.5) : AppTheme.slate800,
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text('$count', style: TextStyle(fontSize: 10, color: selected ? Colors.white : AppTheme.slate400)),
                                        )
                                      : null,
                              onTap: () => _navigateTo(viewId),
                            );
                          },
                        ),
                      ),
                      const Divider(color: AppTheme.slate800),
                      const Text(
                        'QUICK SHORTCUTS',
                        style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                      ),
                      const SizedBox(height: 6),
                      _buildDrawerShortcut(Icons.settings, 'Shop Setup Wizard', AppTheme.cyan400, () {
                        setState(() => _drawerOpen = false);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => OnboardingWizardModal(shopToEdit: store.activeShop),
                        );
                      }),
                      _buildDrawerShortcut(Icons.calculate, 'Daily Z-Report Till', AppTheme.emerald400, () {
                        setState(() => _drawerOpen = false);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const ZReportModal(),
                        );
                      }),
                      _buildDrawerShortcut(Icons.qr_code_scanner, 'Quick Barcode Scan', AppTheme.blue400, () {
                        setState(() => _drawerOpen = false);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => ScannerModal(onScanned: (code) => store.showToast('Barcode: $code')),
                        );
                      }),
                      _buildDrawerShortcut(Icons.cloud_sync, 'Sync Queue & Cloud Status', AppTheme.indigo400, () {
                        setState(() => _drawerOpen = false);
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => const SyncQueueModal(),
                        );
                      }),
                      _buildDrawerShortcut(Icons.logout, 'SaaS Account / Logout', AppTheme.rose400, () {
                        setState(() => _drawerOpen = false);
                        store.logoutSaaS();
                      }),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  int? _getCount(AppStore store, int id) {
    switch (id) {
      case 2:
        return store.products.length;
      case 3:
        return store.salesHistory.length;
      case 4:
        return store.customers.length;
      case 5:
        return store.suppliers.length;
      case 6:
        return store.expenses.length;
      default:
        return null;
    }
  }

  Widget _buildDrawerShortcut(IconData icon, String label, Color color, VoidCallback onTap) {
    return ListTile(
      dense: true,
      visualDensity: VisualDensity.compact,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      leading: Icon(icon, size: 17, color: color),
      title: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
      onTap: onTap,
    );
  }

  Widget _buildToast(AppStore store) {
    return Positioned(
      top: 60,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppTheme.emerald600,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20)],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, size: 16, color: AppTheme.emerald200),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    store.toastMessage!,
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
