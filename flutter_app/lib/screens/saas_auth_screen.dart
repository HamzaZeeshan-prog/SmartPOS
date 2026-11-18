import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../models/models.dart';
import '../store/app_store.dart';
import '../data/saas_config.dart';
import '../data/cities.dart';

class SaaSAuthScreen extends StatefulWidget {
  const SaaSAuthScreen({super.key});

  @override
  State<SaaSAuthScreen> createState() => _SaaSAuthScreenState();
}

class _SaaSAuthScreenState extends State<SaaSAuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Business Login Controllers
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  // Admin Login Controllers
  final _adminEmailController = TextEditingController();
  final _adminPasswordController = TextEditingController();

  // Registration Controllers
  final _regNameController = TextEditingController();
  final _regEmailController = TextEditingController();
  final _regPasswordController = TextEditingController();
  final _regPhoneController = TextEditingController();
  final _regBusinessNameController = TextEditingController();
  final _regAddressController = TextEditingController();
  final _regCustomCityController = TextEditingController();
  final _regPaymentRefController = TextEditingController();

  // Renewal Controllers
  final _renewRefController = TextEditingController();
  SubscriptionPlanOption _renewPlan = SaasConfig.plans[0];
  String _renewPaymentMethod = SaasConfig.paymentMethods[0].id;

  String _selectedCategory = 'Grocery & Supermarket';
  String _selectedCity = 'Mianwali';
  String _selectedCurrency = 'PKR';
  SubscriptionPlanOption _selectedPlan = SaasConfig.plans[0];
  String _selectedPaymentMethod = SaasConfig.paymentMethods[0].id;
  bool _loadStarterProducts = true;

  String? _statusMessage;
  SaaSLoginOutcome? _loginOutcome;
  Shop? _statusShop;
  bool _registrationSubmitted = false;
  bool _isCheckingCloud = false;

  final List<String> _categories = [
    'Grocery & Supermarket',
    'Pharmacy & Healthcare',
    'Electronics & Gadgets',
    'Fashion & Clothing',
    'Restaurant & Fast Food',
    'General Retail',
  ];

  final List<String> _currencies = ['PKR', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _adminEmailController.dispose();
    _adminPasswordController.dispose();
    _regNameController.dispose();
    _regEmailController.dispose();
    _regPasswordController.dispose();
    _regPhoneController.dispose();
    _regBusinessNameController.dispose();
    _regAddressController.dispose();
    _regCustomCityController.dispose();
    _regPaymentRefController.dispose();
    _renewRefController.dispose();
    super.dispose();
  }

  Future<void> _handleSignIn(AppStore store) async {
    if (_isCheckingCloud) return;
    setState(() => _isCheckingCloud = true);
    final result = await store.loginWithCredentialsAsync(
      _loginEmailController.text,
      _loginPasswordController.text,
    );
    if (!mounted) return;
    setState(() => _isCheckingCloud = false);
    if (result.outcome == SaaSLoginOutcome.success || result.outcome == SaaSLoginOutcome.superAdmin) {
      return;
    }
    setState(() {
      _registrationSubmitted = false;
      _loginOutcome = result.outcome;
      _statusMessage = result.message;
      _statusShop = result.shop;
    });
  }

  Future<void> _handleAdminSignIn(AppStore store) async {
    if (_isCheckingCloud) return;
    setState(() => _isCheckingCloud = true);
    final res = await store.loginAsSuperAdminAsync(
      _adminEmailController.text,
      _adminPasswordController.text,
    );
    if (!mounted) return;
    setState(() => _isCheckingCloud = false);
    if (res.outcome != SaaSLoginOutcome.superAdmin) {
      setState(() {
        _registrationSubmitted = false;
        _loginOutcome = res.outcome;
        _statusMessage = res.message;
      });
    }
  }

  Future<void> _handleRegister(AppStore store) async {
    if (_isCheckingCloud) return;
    if (_regNameController.text.trim().isEmpty) {
      store.showToast('Please enter owner full name');
      return;
    }
    if (_regEmailController.text.trim().isEmpty) {
      store.showToast('Please enter a valid email address');
      return;
    }
    if (_regPasswordController.text.trim().length < 4) {
      store.showToast('Please enter a password (at least 4 characters)');
      return;
    }
    if (_regBusinessNameController.text.trim().isEmpty) {
      store.showToast('Please enter your business or shop name');
      return;
    }
    final resolvedCity = _selectedCity == PakistanCities.customOption
        ? _regCustomCityController.text.trim()
        : _selectedCity;
    if (resolvedCity.isEmpty) {
      store.showToast('Please enter your city name');
      return;
    }
    if (_regPaymentRefController.text.trim().isEmpty) {
      store.showToast('Please pay for the 1-month plan and enter Transaction ID');
      return;
    }

    final email = _regEmailController.text.trim();
    final pwd = _regPasswordController.text;

    setState(() => _isCheckingCloud = true);
    final createdShop = await store.registerSaaS(
      fullName: _regNameController.text.trim(),
      email: email,
      password: pwd,
      phone: _regPhoneController.text.trim(),
      businessName: _regBusinessNameController.text.trim(),
      category: _selectedCategory,
      city: resolvedCity,
      address: _regAddressController.text.trim(),
      currency: _selectedCurrency,
      plan: _selectedPlan,
      paymentMethod: _selectedPaymentMethod,
      paymentReference: _regPaymentRefController.text.trim(),
      loadStarterProducts: _loadStarterProducts,
    );
    if (!mounted) return;

    setState(() {
      _isCheckingCloud = false;
      _loginEmailController.text = email;
      _loginPasswordController.text = pwd;
      _registrationSubmitted = true;
      _loginOutcome = SaaSLoginOutcome.pendingApproval;
      _statusShop = createdShop;
      _statusMessage =
          'Subscription request (${createdShop.subscriptionPaymentRef}) sent to Super Admin for "${createdShop.name}". Once approved, sign in from any device with your credentials.';
      _regNameController.clear();
      _regEmailController.clear();
      _regPasswordController.clear();
      _regPhoneController.clear();
      _regBusinessNameController.clear();
      _regAddressController.clear();
      _regCustomCityController.clear();
      _regPaymentRefController.clear();
      _tabController.animateTo(0);
    });
  }

  Future<void> _handleRenew(AppStore store) async {
    if (_statusShop == null || _isCheckingCloud) return;
    if (_renewRefController.text.trim().isEmpty) {
      store.showToast('Enter renewal Transaction ID / Reference');
      return;
    }
    setState(() => _isCheckingCloud = true);
    await store.renewSubscription(
      shopId: _statusShop!.id,
      plan: _renewPlan,
      paymentMethod: _renewPaymentMethod,
      paymentReference: _renewRefController.text.trim(),
    );
    if (!mounted) return;
    setState(() {
      _isCheckingCloud = false;
      _renewRefController.clear();
      _loginOutcome = SaaSLoginOutcome.pendingApproval;
      _statusMessage =
          'Renewal payment submitted to Super Admin! Your business data remains safely intact. Sign in once approved.';
    });
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();

    return Scaffold(
      backgroundColor: AppTheme.slate950,
      body: Stack(
        children: [
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildHeader(),
                  const SizedBox(height: 16),
                  if (store.authNotice != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.amber500.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber, color: AppTheme.amber400, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              store.authNotice!,
                              style: const TextStyle(color: AppTheme.amber300, fontSize: 11.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  _buildTabSelector(),
                  const SizedBox(height: 14),
                  AnimatedBuilder(
                    animation: _tabController,
                    builder: (_, __) {
                      if (_tabController.index == 0) return _buildSignInTab(store);
                      if (_tabController.index == 1) return _buildRegisterTab(store);
                      return _buildAdminLoginTab(store);
                    },
                  ),
                ],
              ),
            ),
          ),
          if (store.toastMessage != null)
            Positioned(
              top: 56,
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

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.blue600, AppTheme.indigo600],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(15),
          ),
          child: const Center(
            child: Icon(Icons.point_of_sale, color: Colors.white, size: 26),
          ),
        ),
        const SizedBox(height: 10),
        const Text(
          'OmniPOS SaaS Cloud',
          style: TextStyle(color: Colors.white, fontSize: 21, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 4),
        const Text(
          'Register your business with a monthly plan • Admin verified • Multi-tenant cloud isolation',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppTheme.slate400, fontSize: 11.5),
        ),
      ],
    );
  }

  Widget _buildTabSelector() {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: TabBar(
        controller: _tabController,
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        indicator: BoxDecoration(
          color: AppTheme.blue600,
          borderRadius: BorderRadius.circular(10),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: AppTheme.slate400,
        labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5),
        tabs: const [
          Tab(text: 'Business Login'),
          Tab(text: 'Register & Plan'),
          Tab(text: 'Admin Login'),
        ],
      ),
    );
  }

  Widget _buildSignInTab(AppStore store) {
    final canRenew = _statusShop != null &&
        (_loginOutcome == SaaSLoginOutcome.expired || _loginOutcome == SaaSLoginOutcome.rejected);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_statusMessage != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: (_loginOutcome == SaaSLoginOutcome.pendingApproval
                      ? AppTheme.amber500
                      : AppTheme.rose500)
                  .withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _loginOutcome == SaaSLoginOutcome.pendingApproval
                    ? AppTheme.amber500
                    : AppTheme.rose500,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _registrationSubmitted
                      ? 'Pending Super Admin Approval'
                      : (_loginOutcome == SaaSLoginOutcome.blocked
                          ? 'Business Access Blocked'
                          : _loginOutcome == SaaSLoginOutcome.expired
                              ? 'Monthly Subscription Expired'
                              : _loginOutcome == SaaSLoginOutcome.pendingApproval
                                  ? 'Subscription Pending Approval'
                                  : 'Sign-In Notice'),
                  style: TextStyle(
                    color: _loginOutcome == SaaSLoginOutcome.pendingApproval
                        ? AppTheme.amber400
                        : AppTheme.rose400,
                    fontWeight: FontWeight.bold,
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _statusMessage!,
                  style: const TextStyle(color: Colors.white, fontSize: 11.5),
                ),
              ],
            ),
          ),
        ],

        if (canRenew) ...[
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 14),
            decoration: BoxDecoration(
              color: AppTheme.slate900,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.emerald500.withValues(alpha: 0.5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Renew 1-Month Plan for ${_statusShop!.name}',
                  style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 4),
                const Text(
                  'All catalog, Khata & sales data remain intact. Renew below to restore login once verified by Admin.',
                  style: TextStyle(color: AppTheme.slate400, fontSize: 10.5),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<SubscriptionPlanOption>(
                  value: _renewPlan,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Select Monthly Plan',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: SaasConfig.plans
                      .map((p) => DropdownMenuItem(value: p, child: Text('${p.name} - PKR ${p.pricePkr.round()}/mo')))
                      .toList(),
                  onChanged: (p) {
                    if (p != null) setState(() => _renewPlan = p);
                  },
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _renewPaymentMethod,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Payment Channel',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: SaasConfig.paymentMethods
                      .map((m) => DropdownMenuItem(value: m.id, child: Text('${m.label} (${m.account})', overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setState(() => _renewPaymentMethod = v);
                  },
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _renewRefController,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Payment Transaction ID / Reference *',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 10),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600, foregroundColor: Colors.white),
                  onPressed: () => _handleRenew(store),
                  child: const Text('Submit Monthly Renewal to Admin', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ],
            ),
          ),
        ],

        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.slate900,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.slate800),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Owner / Staff Sign In',
                style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              const Text(
                'Sign in with the Owner credentials or staff account created by your store owner.',
                style: TextStyle(color: AppTheme.slate400, fontSize: 11),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _loginEmailController,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Registered Email Address',
                  hintText: 'e.g. owner@yourshop.pk',
                  hintStyle: const TextStyle(color: AppTheme.slate600, fontSize: 12),
                  labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
                  prefixIcon: const Icon(Icons.email_outlined, color: AppTheme.slate400, size: 18),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _loginPasswordController,
                obscureText: true,
                style: const TextStyle(color: Colors.white, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Password',
                  labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
                  prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.slate400, size: 18),
                  filled: true,
                  fillColor: AppTheme.slate950,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onSubmitted: (_) => _handleSignIn(store),
              ),
              const SizedBox(height: 14),
              ElevatedButton.icon(
                onPressed: _isCheckingCloud ? null : () => _handleSignIn(store),
                icon: _isCheckingCloud
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.login, size: 18, color: Colors.white),
                label: Text(
                  _isCheckingCloud ? 'Verifying in Cloud...' : 'Sign In to Business',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.blue600,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 10),
              TextButton(
                onPressed: () => _tabController.animateTo(1),
                child: const Text(
                  'New shop owner? Register business & buy monthly plan →',
                  style: TextStyle(color: AppTheme.blue400, fontSize: 11.5, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterTab(AppStore store) {
    final activeMethod = SaasConfig.paymentMethods.firstWhere(
      (m) => m.id == _selectedPaymentMethod,
      orElse: () => SaasConfig.paymentMethods.first,
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Step 1: Owner Credentials',
            style: TextStyle(color: AppTheme.blue400, fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _regNameController,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Owner Full Name *',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _regPhoneController,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Phone / WhatsApp',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _regEmailController,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Login Email *',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _regPasswordController,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Password *',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Step 2: Business Details & City',
            style: TextStyle(color: AppTheme.blue400, fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _regBusinessNameController,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              labelText: 'Business / Store Name *',
              labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
              filled: true,
              fillColor: AppTheme.slate950,
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: DropdownButtonFormField<String>(
                  value: _selectedCategory,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Category',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCategory = val);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: DropdownButtonFormField<String>(
                  value: _selectedCity,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'City',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: PakistanCities.all.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCity = val);
                  },
                ),
              ),
            ],
          ),
          if (_selectedCity == PakistanCities.customOption) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _regCustomCityController,
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: InputDecoration(
                labelText: 'Enter Your City Name *',
                labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                filled: true,
                fillColor: AppTheme.slate950,
                isDense: true,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _regAddressController,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Shop Location / Address',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: DropdownButtonFormField<String>(
                  value: _selectedCurrency,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Currency',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: _currencies.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)))).toList(),
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCurrency = val);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Step 3: Buy 1-Month Subscription',
            style: TextStyle(color: AppTheme.emerald400, fontSize: 12, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          ...SaasConfig.plans.map((p) {
            final isSel = _selectedPlan.id == p.id;
            return GestureDetector(
              onTap: () => setState(() => _selectedPlan = p),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isSel ? AppTheme.emerald600.withValues(alpha: 0.14) : AppTheme.slate950,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: isSel ? AppTheme.emerald500 : AppTheme.slate800),
                ),
                child: Row(
                  children: [
                    Icon(
                      isSel ? Icons.radio_button_checked : Icons.radio_button_off,
                      size: 18,
                      color: isSel ? AppTheme.emerald400 : AppTheme.slate500,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                          Text(p.description, style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        ],
                      ),
                    ),
                    Text(
                      'PKR ${p.pricePkr.round()}/mo',
                      style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.w900, fontSize: 12),
                    ),
                  ],
                ),
              ),
            );
          }),
          DropdownButtonFormField<String>(
            value: _selectedPaymentMethod,
            isExpanded: true,
            dropdownColor: AppTheme.slate900,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              labelText: 'Payment Method',
              labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
              filled: true,
              fillColor: AppTheme.slate950,
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
            items: SaasConfig.paymentMethods
                .map((m) => DropdownMenuItem(value: m.id, child: Text('${m.label} (${m.account})', overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11))))
                .toList(),
            onChanged: (v) {
              if (v != null) setState(() => _selectedPaymentMethod = v);
            },
          ),
          const SizedBox(height: 6),
          Text(
            'Send PKR ${_selectedPlan.pricePkr.round()} to ${activeMethod.label}: ${activeMethod.account}',
            style: const TextStyle(color: AppTheme.cyan400, fontSize: 10.5, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _regPaymentRefController,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              labelText: 'Transaction ID / Payment Reference *',
              hintText: 'e.g. TXN-8841203',
              hintStyle: const TextStyle(color: AppTheme.slate600, fontSize: 11),
              labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
              filled: true,
              fillColor: AppTheme.slate950,
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            dense: true,
            contentPadding: EdgeInsets.zero,
            value: _loadStarterProducts,
            activeThumbColor: AppTheme.blue500,
            title: const Text('Pre-load starter barcode catalog', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            subtitle: const Text('Adds category products once Admin approves', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
            onChanged: (v) => setState(() => _loadStarterProducts = v),
          ),
          const SizedBox(height: 10),
          ElevatedButton.icon(
            onPressed: _isCheckingCloud ? null : () => _handleRegister(store),
            icon: _isCheckingCloud
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.send, size: 17, color: Colors.white),
            label: Text(
              _isCheckingCloud ? 'Uploading to Cloud...' : 'Pay & Submit to Super Admin',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.emerald600,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdminLoginTab(AppStore store) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.indigo500.withValues(alpha: 0.45)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.admin_panel_settings, color: AppTheme.indigo400, size: 22),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Platform Super Admin Login',
                  style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const Text(
            'Approve or reject monthly business payments, monitor active tenants, or block/unblock ongoing businesses.',
            style: TextStyle(color: AppTheme.slate400, fontSize: 11),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _adminEmailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              labelText: 'Admin Email',
              labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
              prefixIcon: const Icon(Icons.shield_outlined, color: AppTheme.indigo400, size: 18),
              filled: true,
              fillColor: AppTheme.slate950,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _adminPasswordController,
            obscureText: true,
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              labelText: 'Admin Password',
              labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
              prefixIcon: const Icon(Icons.vpn_key_outlined, color: AppTheme.indigo400, size: 18),
              filled: true,
              fillColor: AppTheme.slate950,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onSubmitted: (_) => _handleAdminSignIn(store),
          ),
          const SizedBox(height: 14),
          if (_statusMessage != null && _loginOutcome == SaaSLoginOutcome.invalidCredentials)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Text(
                _statusMessage!,
                style: const TextStyle(color: AppTheme.rose400, fontSize: 11.5, fontWeight: FontWeight.bold),
              ),
            ),
          ElevatedButton.icon(
            onPressed: _isCheckingCloud ? null : () => _handleAdminSignIn(store),
            icon: _isCheckingCloud
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Icon(Icons.admin_panel_settings, size: 18, color: Colors.white),
            label: Text(
              _isCheckingCloud ? 'Syncing Cloud...' : 'Open Super Admin Console',
              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.indigo600,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }
}
