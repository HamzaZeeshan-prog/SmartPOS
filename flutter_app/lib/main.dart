import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
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
import 'widgets/modals/auth_modal.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  CloudServiceInit();
  runApp(const SmartPosApp());
}

void CloudServiceInit() async {
  await CloudServiceInit();
}

class CloudServiceInit {
  static Future<void> call() async {
    await CloudServiceInit.call();
  }
}

// Fix: proper init
import 'services/cloud_service.dart';

class SmartPosApp extends StatelessWidget {
  const SmartPosApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppStore()..testCloudConnection(),
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

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;
  bool _drawerOpen = false;
  bool _isAuthOpen = false;

  final _screens = [
    const PosTerminalScreen(),
    const DashboardScreen(),
    const InventoryScreen(),
    const SalesManagerScreen(),
  ];

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

  Widget _buildScreen(int index) {
    switch (index) {
      case 0: return const PosTerminalScreen();
      case 1: return const DashboardScreen();
      case 2: return const InventoryScreen();
      case 3: return const SalesManagerScreen();
      case 4: return const CustomerLedgerScreen();
      case 5: return const SuppliersScreen();
      case 6: return const ExpensesScreen();
      case 7: return const ProfitLossScreen();
      case 8: return const ArchitectureScreen();
      default: return const PosTerminalScreen();
    }
  }

  void _navigateTo(int index) {
    setState(() {
      _currentIndex = index;
      _drawerOpen = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();

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
    return SafeArea(
      bottom: false,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: const BoxDecoration(
          color: AppTheme.slate900,
          border: Border(bottom: BorderSide(color: AppTheme.slate800)),
        ),
        child: Row(
          children: [
            _buildLogo(store),
            const SizedBox(width: 8),
            if (store.cloudConnected)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.emerald500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.emerald500.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cloud, size: 14, color: AppTheme.emerald400),
                    SizedBox(width: 4),
                    Text('Cloud Live', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.emerald400)),
                  ],
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.amber500.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.3)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cloud_off, size: 14, color: AppTheme.amber400),
                    SizedBox(width: 4),
                    Text('Offline', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.amber400)),
                  ],
                ),
              ),
            const Spacer(),
            _buildShopSelector(store),
            const SizedBox(width: 6),
            _buildUserButton(store),
          ],
        ),
      ),
    );
  }

  Widget _buildLogo(AppStore store) {
    return GestureDetector(
      onTap: () => _navigateTo(0),
      child: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [AppTheme.blue600, AppTheme.indigo600], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Center(
          child: Text('SP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
        ),
      ),
    );
  }

  Widget _buildShopSelector(AppStore store) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.store, size: 14, color: AppTheme.blue400),
          const SizedBox(width: 4),
          DropdownButton<Shop>(
            value: store.activeShop,
            underline: const SizedBox(),
            isDense: true,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.slate200),
            dropdownColor: AppTheme.slate900,
            items: store.shops.map((s) => DropdownMenuItem(value: s, child: Text(s.name, style: const TextStyle(fontSize: 12)))).toList(),
            onChanged: (s) { if (s != null) store.setActiveShop(s); },
          ),
        ],
      ),
    );
  }

  Widget _buildUserButton(AppStore store) {
    return GestureDetector(
      onTap: () => setState(() => _isAuthOpen = true),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.slate950,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.slate800),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.verified_user, size: 14, color: AppTheme.emerald400),
            const SizedBox(width: 4),
            Text(store.currentUser.name.split(' ').first, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: AppTheme.blue500.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(4)),
              child: Text(store.currentUser.role.name[0].toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.blue300)),
            ),
          ],
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
        width: 56, height: 48,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: selected ? AppTheme.blue400 : AppTheme.slate400),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 10, color: selected ? AppTheme.blue400 : AppTheme.slate400, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
          ],
        ),
      ),
    );
  }

  Widget _navMoreItem() {
    return GestureDetector(
      onTap: () => setState(() => _drawerOpen = true),
      child: SizedBox(
        width: 56, height: 48,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.more_horiz, size: 18, color: _drawerOpen ? AppTheme.indigo400 : AppTheme.slate400),
            const SizedBox(height: 2),
            Text('More', style: TextStyle(fontSize: 10, color: _drawerOpen ? AppTheme.indigo400 : AppTheme.slate400, fontWeight: _drawerOpen ? FontWeight.bold : FontWeight.normal)),
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              IconButton(
                onPressed: () => _navigateTo(0),
                icon: const Icon(Icons.arrow_back, color: AppTheme.slate300),
              ),
              const Spacer(),
              Text(_allViews[_currentIndex]['name'] as String, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              const Spacer(),
              const SizedBox(width: 48),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, AppStore store) {
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
                width: MediaQuery.of(context).size.width * 0.8,
                height: double.infinity,
                padding: const EdgeInsets.all(20),
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
                          Container(width: 32, height: 32, decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppTheme.blue600, AppTheme.indigo600]), borderRadius: BorderRadius.circular(10)), child: const Center(child: Text('SP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)))),
                          const SizedBox(width: 8),
                          const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('Smart POS', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            Text('All Modules & Tools', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                          ]),
                          const Spacer(),
                          IconButton(onPressed: () => setState(() => _drawerOpen = false), icon: const Icon(Icons.close, color: AppTheme.slate400, size: 18)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      const Text('STORE OPERATIONS', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                      const SizedBox(height: 8),
                      Expanded(
                        child: ListView.builder(
                          itemCount: _allViews.length,
                          itemBuilder: (ctx, i) {
                            final v = _allViews[i];
                            final selected = _currentIndex == v['id'] as int;
                            final count = _getCount(store, v['id'] as int);
                            return ListTile(
                              dense: true,
                              selected: selected,
                              selectedTileColor: AppTheme.blue600,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              leading: Icon(v['icon'] as IconData, size: 18, color: selected ? Colors.white : AppTheme.blue400),
                              title: Text(v['name'] as String, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppTheme.slate300)),
                              trailing: count != null ? Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: selected ? AppTheme.blue700.withValues(alpha: 0.5) : AppTheme.slate800, borderRadius: BorderRadius.circular(4)), child: Text('$count', style: TextStyle(fontSize: 10, color: selected ? Colors.white : AppTheme.slate400))) : null,
                              onTap: () => _navigateTo(v['id'] as int),
                            );
                          },
                        ),
                      ),
                      const Divider(color: AppTheme.slate800),
                      const Text('QUICK SHORTCUTS', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                      const SizedBox(height: 8),
                      _buildDrawerShortcut(Icons.calculate, 'Daily Z-Report', AppTheme.emerald400, () { setState(() => _drawerOpen = false); }),
                      _buildDrawerShortcut(Icons.qr_code_scanner, 'Barcode Scanner', AppTheme.blue400, () { setState(() => _drawerOpen = false); }),
                      _buildDrawerShortcut(Icons.settings, 'Store Setup Wizard', AppTheme.indigo400, () { setState(() => _drawerOpen = false); }),
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
      case 2: return store.products.length;
      case 3: return store.salesHistory.length;
      case 4: return store.customers.length;
      case 5: return store.suppliers.length;
      case 6: return store.expenses.length;
      case 8: return null;
      default: return null;
    }
  }

  Widget _buildDrawerShortcut(IconData icon, String label, Color color, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        dense: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        leading: Icon(icon, size: 18, color: color),
        title: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        onTap: onTap,
      ),
    );
  }

  Widget _buildToast(AppStore store) {
    return Positioned(
      top: 60, left: 0, right: 0,
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
                Flexible(child: Text(store.toastMessage!, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold))),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
