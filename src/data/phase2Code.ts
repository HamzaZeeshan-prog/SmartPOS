export interface FlutterCodeFile {
  path: string;
  description: string;
  code: string;
}

export const PHASE2_FLUTTER_FILES: FlutterCodeFile[] = [
  {
    path: 'lib/core/theme/theme.dart',
    description: 'Material 3 ColorScheme, dynamic typography, and responsive component themes.',
    code: `import 'package:flutter/material.dart';

class AppTheme {
  // Brand color palette
  static const Color primaryBlue = Color(0xFF1E40AF); // Deep Indigo/Blue
  static const Color primaryDark = Color(0xFF0F172A); // Slate 900
  static const Color accentCyan = Color(0xFF06B6D4);
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningAmber = Color(0xFFF59E0B);
  static const Color errorRed = Color(0xFFEF4444);

  // Material 3 Light Theme
  static ThemeData get lightTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryBlue,
      brightness: Brightness.light,
      primary: primaryBlue,
      surface: Colors.white,
      surfaceContainerLowest: const Color(0xFFF8FAFC),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      fontFamily: 'Inter',
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 1,
        titleTextStyle: TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 18,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        color: Colors.white,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryBlue, width: 2),
        ),
      ),
    );
  }

  // Material 3 Dark Theme
  static ThemeData get darkTheme {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primaryBlue,
      brightness: Brightness.dark,
      primary: const Color(0xFF3B82F6),
      surface: const Color(0xFF0F172A),
      surfaceContainerLowest: const Color(0xFF020617),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: const Color(0xFF020617),
      fontFamily: 'Inter',
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 1,
      ),
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF1E293B)),
        ),
        color: const Color(0xFF0F172A),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF0F172A),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF334155)),
        ),
      ),
    );
  }
}`
  },
  {
    path: 'lib/app/router.dart',
    description: 'GoRouter navigation with role-based route guards and auth redirect logic.',
    code: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../features/auth/data/auth_notifier.dart';
import '../features/auth/presentation/splash_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/auth/presentation/forgot_password_screen.dart';
import '../features/onboarding/presentation/onboarding_wizard_screen.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/dashboard/presentation/widgets/responsive_shell.dart';
import '../features/pos/presentation/pos_screen.dart';
import '../features/inventory/presentation/inventory_screen.dart';
import '../features/reports/presentation/reports_screen.dart';
import '../features/settings/presentation/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authNotifierProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (BuildContext context, GoRouterState state) {
      final isAuth = authState.isAuthenticated;
      final isGoingToSplash = state.matchedLocation == '/splash';
      final isGoingToAuth = state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup' ||
          state.matchedLocation == '/forgot-password';

      // 1. Initial Splash check
      if (authState.isLoading) return '/splash';
      if (isGoingToSplash && !isAuth) return '/login';

      // 2. Redirect unauthenticated users
      if (!isAuth && !isGoingToAuth) return '/login';

      // 3. First-time login requires Onboarding wizard
      if (isAuth && authState.needsOnboarding && state.matchedLocation != '/onboarding') {
        return '/onboarding';
      }

      // 4. Role-based route protection
      final role = authState.userRole; // 'owner', 'manager', 'cashier'
      if (state.matchedLocation.startsWith('/reports') ||
          state.matchedLocation.startsWith('/settings')) {
        // Cashiers cannot access sensitive reports or shop settings
        if (role == 'cashier') {
          return '/pos';
        }
      }

      if (isAuth && isGoingToAuth) return '/dashboard';

      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
      GoRoute(path: '/forgot-password', builder: (context, state) => const ForgotPasswordScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingWizardScreen()),

      // Responsive Shell wrapping Main Tabs
      ShellRoute(
        builder: (context, state, child) => ResponsiveShell(child: child),
        routes: [
          GoRoute(path: '/dashboard', builder: (context, state) => const DashboardScreen()),
          GoRoute(path: '/pos', builder: (context, state) => const PosScreen()),
          GoRoute(path: '/inventory', builder: (context, state) => const InventoryScreen()),
          GoRoute(path: '/reports', builder: (context, state) => const ReportsScreen()),
          GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
        ],
      ),
    ],
  );
});`
  },
  {
    path: 'lib/features/auth/data/auth_notifier.dart',
    description: 'Riverpod AuthNotifier managing User session, multi-shop context, and role checks.',
    code: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/models/shop_model.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final bool needsOnboarding;
  final UserModel? user;
  final ShopModel? activeShop;
  final List<ShopModel> userShops;
  final String? errorMessage;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.needsOnboarding = false,
    this.user,
    this.activeShop,
    this.userShops = const [],
    this.errorMessage,
  });

  String get userRole => user?.role ?? 'cashier';
  bool get isOwner => userRole == 'owner';
  bool get isManager => userRole == 'manager' || isOwner;
  bool get isCashier => userRole == 'cashier';

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    bool? needsOnboarding,
    UserModel? user,
    ShopModel? activeShop,
    List<ShopModel>? userShops,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      needsOnboarding: needsOnboarding ?? this.needsOnboarding,
      user: user ?? this.user,
      activeShop: activeShop ?? this.activeShop,
      userShops: userShops ?? this.userShops,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  Future<void> loginWithCredentials(String email, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await Future.delayed(const Duration(milliseconds: 600)); // Mock network latency
      // Authenticate user & load associated shops
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: true,
        user: UserModel(
          id: 'usr_owner_1',
          name: 'Tariq Mehmood',
          email: email,
          phone: '+92 300 1234567',
          role: 'owner',
        ),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  void switchActiveShop(ShopModel newShop) {
    state = state.copyWith(activeShop: newShop);
  }

  void switchRoleDemo(String role) {
    if (state.user == null) return;
    state = state.copyWith(
      user: state.user!.copyWith(role: role),
    );
  }

  void completeOnboarding(ShopModel newShop) {
    state = state.copyWith(
      needsOnboarding: false,
      activeShop: newShop,
      userShops: [...state.userShops, newShop],
    );
  }

  void logout() {
    state = const AuthState();
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});`
  },
  {
    path: 'lib/features/onboarding/presentation/onboarding_wizard_screen.dart',
    description: 'First-time setup wizard capturing shop profile, PKR currency, tax, and receipt note.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/data/auth_notifier.dart';
import '../../../shared/models/shop_model.dart';

class OnboardingWizardScreen extends ConsumerStatefulWidget {
  const OnboardingWizardScreen({super.key});

  @override
  ConsumerState<OnboardingWizardScreen> createState() => _OnboardingWizardScreenState();
}

class _OnboardingWizardScreenState extends ConsumerState<OnboardingWizardScreen> {
  final _formKey = GlobalKey<FormState>();
  final _shopNameController = TextEditingController(text: 'City Mart');
  final _ownerNameController = TextEditingController(text: 'Tariq Mehmood');
  final _phoneController = TextEditingController(text: '+92 51 2891234');
  final _categoryController = TextEditingController(text: 'Grocery & Supermarket');
  final _addressController = TextEditingController(text: 'Shop 14-16, F-7 Markaz');
  final _cityController = TextEditingController(text: 'Islamabad');
  final _receiptMsgController = TextEditingController(
    text: 'Thank you for shopping at City Mart! Exchange within 3 days with receipt.',
  );

  String _currency = 'PKR';
  bool _taxEnabled = true;
  double _taxRate = 5.0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Setup Wizard'),
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Welcome to Smart POS',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Configure your store profile. All settings can be adjusted later in Settings.',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const Divider(height: 32),

                      TextFormField(
                        controller: _shopNameController,
                        decoration: const InputDecoration(labelText: 'Shop Name *'),
                        validator: (v) => v!.isEmpty ? 'Required' : null,
                      ),
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _ownerNameController,
                              decoration: const InputDecoration(labelText: 'Owner Name *'),
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _phoneController,
                              decoration: const InputDecoration(labelText: 'Store Phone *'),
                              validator: (v) => v!.isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: _categoryController,
                        decoration: const InputDecoration(labelText: 'Business Category *'),
                      ),
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextFormField(
                              controller: _addressController,
                              decoration: const InputDecoration(labelText: 'Store Address *'),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: TextFormField(
                              controller: _cityController,
                              decoration: const InputDecoration(labelText: 'City *'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Currency & Tax
                      Row(
                        children: [
                          Expanded(
                            child: InputDecorator(
                              decoration: const InputDecoration(labelText: 'Default Currency'),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _currency,
                                  isDense: true,
                                  items: const [
                                    DropdownMenuItem(value: 'PKR', child: Text('PKR - Pakistani Rupee')),
                                    DropdownMenuItem(value: 'USD', child: Text('USD - US Dollar')),
                                  ],
                                  onChanged: (v) => setState(() => _currency = v!),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: SwitchListTile(
                              title: const Text('GST / Sales Tax', style: TextStyle(fontSize: 13)),
                              subtitle: Text(_taxEnabled ? 'Enabled (\${_taxRate.toInt()}%)' : 'Disabled'),
                              value: _taxEnabled,
                              onChanged: (val) => setState(() => _taxEnabled = val),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      TextFormField(
                        controller: _receiptMsgController,
                        maxLines: 2,
                        decoration: const InputDecoration(labelText: 'Receipt Footer Message'),
                      ),
                      const SizedBox(height: 28),

                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: () {
                            if (_formKey.currentState!.validate()) {
                              final newShop = ShopModel(
                                id: 'shop_\${DateTime.now().millisecondsSinceEpoch}',
                                name: _shopNameController.text,
                                ownerName: _ownerNameController.text,
                                phone: _phoneController.text,
                                category: _categoryController.text,
                                address: _addressController.text,
                                city: _cityController.text,
                                currency: _currency,
                                taxEnabled: _taxEnabled,
                                defaultTaxRate: _taxRate,
                                receiptMessage: _receiptMsgController.text,
                              );
                              ref.read(authNotifierProvider.notifier).completeOnboarding(newShop);
                              context.go('/dashboard');
                            }
                          },
                          child: const Text('Complete Setup & Launch Dashboard'),
                        ),
                      ),
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
}`
  },
  {
    path: 'lib/features/dashboard/presentation/dashboard_screen.dart',
    description: 'KPI metrics, 7-day sales chart, quick actions, and recent sales ledger.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:go_router/go_router.dart';
import '../../auth/data/auth_notifier.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authNotifierProvider);
    final isCashier = authState.isCashier;

    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back, \${authState.user?.name ?? "User"}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Store: \${authState.activeShop?.name ?? "City Mart"} • Role: \${authState.userRole.toUpperCase()}',
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => context.go('/pos'),
                  icon: const Icon(Icons.point_of_sale),
                  label: const Text('New Sale'),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // 5 Top KPI Cards
            LayoutBuilder(
              builder: (context, constraints) {
                final isWide = constraints.maxWidth > 800;
                return GridView.count(
                  crossAxisCount: isWide ? 5 : 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollButtonPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: isWide ? 1.6 : 1.3,
                  children: [
                    _buildKpiCard('Today Sales', 'PKR 6,538', Icons.attach_money, Colors.green),
                    _buildKpiCard('Today Orders', '4 Orders', Icons.receipt_long, Colors.blue),
                    if (!isCashier)
                      _buildKpiCard('Est. Profit', 'PKR 1,420', Icons.trending_up, Colors.indigo)
                    else
                      _buildKpiCard('Shift Register', 'Active', Icons.verified_user, Colors.teal),
                    _buildKpiCard('Low Stock', '3 Items', Icons.warning_amber, Colors.amber),
                    _buildKpiCard('Total Valuation', 'PKR 142,800', Icons.inventory_2, Colors.purple),
                  ],
                );
              },
            ),
            const SizedBox(height: 28),

            // Quick Actions Bar
            const Text('Quick Operations', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _buildActionButton(context, 'New Sale', Icons.shopping_cart, '/pos', Colors.blue),
                _buildActionButton(context, 'Scan Product', Icons.qr_code_scanner, '/pos', Colors.teal),
                _buildActionButton(context, 'View Inventory', Icons.inventory, '/inventory', Colors.indigo),
                if (!isCashier)
                  _buildActionButton(context, 'Sales Reports', Icons.bar_chart, '/reports', Colors.purple),
              ],
            ),
            const SizedBox(height: 28),

            // 7-Day Sales Chart (fl_chart)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Sales Trend (Last 7 Days)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 20),
                    SizedBox(
                      height: 220,
                      child: BarChart(
                        BarChartData(
                          borderData: FlBorderData(show: false),
                          titlesData: const FlTitlesData(topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false))),
                          barGroups: [
                            BarChartGroupData(x: 1, barRods: [BarChartRodData(toY: 4200, color: Colors.blue)]),
                            BarChartGroupData(x: 2, barRods: [BarChartRodData(toY: 5800, color: Colors.blue)]),
                            BarChartGroupData(x: 3, barRods: [BarChartRodData(toY: 3900, color: Colors.blue)]),
                            BarChartGroupData(x: 4, barRods: [BarChartRodData(toY: 7100, color: Colors.blue)]),
                            BarChartGroupData(x: 5, barRods: [BarChartRodData(toY: 6400, color: Colors.blue)]),
                            BarChartGroupData(x: 6, barRods: [BarChartRodData(toY: 8900, color: Colors.blue)]),
                            BarChartGroupData(x: 7, barRods: [BarChartRodData(toY: 6538, color: Colors.indigo)]),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, String title, IconData icon, String route, Color color) {
    return ActionChip(
      avatar: Icon(icon, color: color, size: 18),
      label: Text(title),
      onPressed: () => context.go(route),
    );
  }
}`
  },
  {
    path: 'lib/features/dashboard/presentation/widgets/responsive_shell.dart',
    description: 'Responsive Material 3 navigation shell adapting between Mobile, Tablet, and Desktop.',
    code: `import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/data/auth_notifier.dart';

class ResponsiveShell extends ConsumerWidget {
  final Widget child;
  const ResponsiveShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final authState = ref.watch(authNotifierProvider);
    final isCashier = authState.isCashier;

    final isDesktop = MediaQuery.of(context).size.width >= 1024;

    int calculateSelectedIndex() {
      if (location.startsWith('/dashboard')) return 0;
      if (location.startsWith('/pos')) return 1;
      if (location.startsWith('/inventory')) return 2;
      if (location.startsWith('/reports')) return 3;
      if (location.startsWith('/settings')) return 4;
      return 0;
    }

    void onDestinationSelected(int index) {
      switch (index) {
        case 0:
          context.go('/dashboard');
          break;
        case 1:
          context.go('/pos');
          break;
        case 2:
          context.go('/inventory');
          break;
        case 3:
          if (!isCashier) context.go('/reports');
          break;
        case 4:
          if (!isCashier) context.go('/settings');
          break;
      }
    }

    if (isDesktop) {
      // Desktop / Tablet Landscape: Navigation Rail Layout
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              extended: MediaQuery.of(context).size.width > 1200,
              selectedIndex: calculateSelectedIndex(),
              onDestinationSelected: onDestinationSelected,
              leading: const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Text('Smart POS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              ),
              destinations: [
                const NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: Text('Dashboard')),
                const NavigationRailDestination(icon: Icon(Icons.point_of_sale_outlined), selectedIcon: Icon(Icons.point_of_sale), label: Text('Cashier POS')),
                const NavigationRailDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: Text('Inventory')),
                if (!isCashier)
                  const NavigationRailDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: Text('Reports')),
                if (!isCashier)
                  const NavigationRailDestination(icon: Icon(Icons.settings_outlined), selectedIcon: Icon(Icons.settings), label: Text('Settings')),
              ],
            ),
            const VerticalDivider(thickness: 1, width: 1),
            Expanded(child: child),
          ],
        ),
      );
    }

    // Mobile Phone Layout: Bottom Navigation Bar
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: calculateSelectedIndex(),
        onDestinationSelected: onDestinationSelected,
        destinations: [
          const NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
          const NavigationDestination(icon: Icon(Icons.point_of_sale_outlined), selectedIcon: Icon(Icons.point_of_sale), label: 'POS'),
          const NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Inventory'),
          if (!isCashier)
            const NavigationDestination(icon: Icon(Icons.bar_chart_outlined), selectedIcon: Icon(Icons.bar_chart), label: 'Reports'),
        ],
      ),
    );
  }
}`
  }
];
