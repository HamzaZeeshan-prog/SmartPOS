import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';
import '../../data/cities.dart';
import '../../data/saas_config.dart';

class AuthModal extends StatelessWidget {
  const AuthModal({super.key});

  void _showUpgradeProDialog(BuildContext context, AppStore store) {
    final proPlan = SaasConfig.plans[1];
    String selectedMethod = SaasConfig.paymentMethods.first.id;
    final refCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dCtx, setDlgState) => AlertDialog(
          backgroundColor: AppTheme.slate900,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: AppTheme.amber500.withValues(alpha: 0.4)),
          ),
          title: const Row(
            children: [
              Icon(Icons.workspace_premium, color: AppTheme.amber400, size: 20),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Upgrade to Business Pro',
                  style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.amber500.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${proPlan.name} • PKR ${proPlan.pricePkr.toStringAsFixed(0)}/month',
                        style: const TextStyle(color: AppTheme.amber300, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        proPlan.description,
                        style: const TextStyle(color: AppTheme.slate300, fontSize: 10.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: selectedMethod,
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
                      .map((m) => DropdownMenuItem(
                            value: m.id,
                            child: Text('${m.label} (${m.account})', overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) setDlgState(() => selectedMethod = v);
                  },
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: refCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Transaction ID / Payment Reference *',
                    hintText: 'e.g. JC-9948210',
                    hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.amber500, foregroundColor: Colors.black),
              onPressed: () {
                if (refCtrl.text.trim().isEmpty) {
                  store.showToast('Please enter payment transaction reference.');
                  return;
                }
                store.requestProUpgrade(
                  paymentMethod: selectedMethod,
                  paymentReference: refCtrl.text.trim(),
                );
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('Submit Pro Upgrade', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddBranchDialog(BuildContext context, AppStore store) {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final customCityCtrl = TextEditingController();
    String category = store.activeShop.category;
    String city = PakistanCities.all.contains(store.activeShop.city)
        ? store.activeShop.city
        : 'Mianwali';
    String currency = store.activeShop.currency;
    bool loadStarter = true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dialogCtx, setModalState) => AlertDialog(
          backgroundColor: AppTheme.slate900,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppTheme.slate800),
          ),
          title: const Text(
            'Add Business Branch',
            style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Branch Name (e.g. City Mart Mianwali)',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: addressCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Street Address',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  value: city,
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
                  items: PakistanCities.all
                      .map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (v) => setModalState(() => city = v ?? city),
                ),
                if (city == PakistanCities.customOption) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: customCityCtrl,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      labelText: 'Enter Custom City Name',
                      labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 12),
                      filled: true,
                      fillColor: AppTheme.slate950,
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                SwitchListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  value: loadStarter,
                  activeThumbColor: AppTheme.blue500,
                  title: const Text('Preload starter inventory', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                  onChanged: (v) => setModalState(() => loadStarter = v),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.blue600),
              onPressed: () {
                if (nameCtrl.text.trim().isEmpty) return;
                final resolvedCity = city == PakistanCities.customOption
                    ? (customCityCtrl.text.trim().isNotEmpty ? customCityCtrl.text.trim() : 'Mianwali')
                    : city;
                store.addBusinessBranch(
                  businessName: nameCtrl.text.trim(),
                  category: category,
                  city: resolvedCity,
                  address: addressCtrl.text.trim(),
                  phone: phoneCtrl.text.trim(),
                  currency: currency,
                  loadStarterProducts: loadStarter,
                );
                Navigator.pop(ctx);
                Navigator.pop(context);
              },
              child: const Text('Create Branch', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddStaffDialog(BuildContext context, AppStore store) {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController(text: '+92 3');
    final passwordCtrl = TextEditingController();
    UserRole role = UserRole.cashier;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (dCtx, setDlgState) => AlertDialog(
          backgroundColor: AppTheme.slate900,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: AppTheme.slate800),
          ),
          title: Text(
            'Add Staff for ${store.activeShop.name}',
            style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<UserRole>(
                  value: role,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Staff Role',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: const [
                    DropdownMenuItem(value: UserRole.cashier, child: Text('Cashier (POS Terminal & Khata)')),
                    DropdownMenuItem(value: UserRole.manager, child: Text('Manager (Optional - Inventory & Reports)')),
                  ],
                  onChanged: (r) {
                    if (r != null) setDlgState(() => role = r);
                  },
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: nameCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Staff Full Name *',
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Login Email *',
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Mobile Phone',
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: passwordCtrl,
                  obscureText: true,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Login Password *',
                    filled: true,
                    fillColor: AppTheme.slate950,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: AppTheme.slate400)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600, foregroundColor: Colors.white),
              onPressed: () {
                if (nameCtrl.text.trim().isEmpty ||
                    emailCtrl.text.trim().isEmpty ||
                    passwordCtrl.text.isEmpty) {
                  store.showToast('Name, email and password are required.');
                  return;
                }
                final ok = store.addStaffMember(
                  shopId: store.activeShop.id,
                  name: nameCtrl.text,
                  email: emailCtrl.text,
                  password: passwordCtrl.text,
                  role: role,
                  phone: phoneCtrl.text,
                );
                if (ok) Navigator.pop(ctx);
              },
              child: const Text('Create Staff Account', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final user = store.currentUser;
    final shops = store.userShops;
    final ent = store.entitlements;
    final remDays = SaasConfig.getRemainingDays(store.activeShop);
    final shopStaff = store.staffForShop(store.activeShop.id);
    final shopOwner = store.registeredUsers.cast<User?>().firstWhere(
      (u) =>
          u != null &&
          u.role == UserRole.owner &&
          (u.id == store.activeShop.ownerId || u.email.toLowerCase() == (store.activeShop.ownerEmail ?? '').toLowerCase()),
      orElse: () => null,
    );

    return Dialog(
      backgroundColor: AppTheme.slate900,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: AppTheme.slate800),
      ),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 420),
        padding: const EdgeInsets.all(20),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.blue500.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.storefront, color: AppTheme.blue400, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user.name,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        Text(
                          '${user.role.name.toUpperCase()} • ${user.email}',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: AppTheme.slate400, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Active Monthly Subscription Card
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (ent.isPro ? AppTheme.emerald600 : AppTheme.amber500).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: (ent.isPro ? AppTheme.emerald500 : AppTheme.amber500).withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      ent.isPro ? Icons.verified : Icons.workspace_premium_outlined,
                      color: ent.isPro ? AppTheme.emerald400 : AppTheme.amber400,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            ent.planName,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11.5),
                          ),
                          Text(
                            'Active • $remDays days left • ${ent.isPro ? 'All Pro Features Enabled' : '1 Storefront Only'}',
                            style: TextStyle(color: ent.isPro ? AppTheme.emerald400 : AppTheme.amber300, fontSize: 10),
                          ),
                        ],
                      ),
                    ),
                    if (user.role == UserRole.owner && !ent.isPro) ...[
                      const SizedBox(width: 6),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.amber500,
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: () => _showUpgradeProDialog(context, store),
                        child: const Text('Upgrade Pro', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Business Branches Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Expanded(
                    child: Text(
                      'YOUR BUSINESSES & BRANCHES',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                    ),
                  ),
                  if (user.role == UserRole.owner && ent.allowMultiBranch) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => _showAddBranchDialog(context, store),
                      child: const Text(
                        '+ Add Branch',
                        style: TextStyle(color: AppTheme.blue400, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ] else if (!ent.allowMultiBranch) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.amber500.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.35)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.lock_outline, size: 11, color: AppTheme.amber400),
                          SizedBox(width: 3),
                          Text('Multi-Branch (Pro)', style: TextStyle(color: AppTheme.amber300, fontSize: 9.5, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              if (!ent.allowMultiBranch) ...[
                const SizedBox(height: 6),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.25)),
                  ),
                  child: const Text(
                    'Starter Monthly includes 1 storefront. Upgrade to Business Pro Monthly to add multiple branches.',
                    style: TextStyle(color: AppTheme.slate300, fontSize: 10),
                  ),
                ),
              ],
              const SizedBox(height: 8),

              ...shops.map((s) {
                final isActive = store.activeShop.id == s.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  decoration: BoxDecoration(
                    color: isActive ? AppTheme.blue600.withValues(alpha: 0.15) : AppTheme.slate950,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: isActive ? AppTheme.blue500 : AppTheme.slate800),
                  ),
                  child: ListTile(
                    dense: true,
                    onTap: () {
                      store.setActiveShop(s);
                      Navigator.pop(context);
                    },
                    leading: Icon(Icons.store, color: isActive ? AppTheme.blue400 : AppTheme.slate400, size: 18),
                    title: Text(
                      s.name,
                      style: TextStyle(color: Colors.white, fontWeight: isActive ? FontWeight.bold : FontWeight.w500, fontSize: 12),
                    ),
                    subtitle: Text('${s.category} • ${s.city}', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                    trailing: isActive
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(color: AppTheme.blue500, borderRadius: BorderRadius.circular(6)),
                            child: const Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                          )
                        : null,
                  ),
                );
              }),

              const SizedBox(height: 12),
              const Divider(color: AppTheme.slate800),
              const SizedBox(height: 8),

              // Per-Business Owner Staff Section (Cashiers & Optional Managers)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${store.activeShop.name.toUpperCase()} STAFF',
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                    ),
                  ),
                  if (user.role == UserRole.owner && ent.allowCustomStaff)
                    GestureDetector(
                      onTap: () => _showAddStaffDialog(context, store),
                      child: const Text(
                        '+ Add Cashier / Manager',
                        style: TextStyle(color: AppTheme.emerald400, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    )
                  else if (!ent.allowCustomStaff)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.amber500.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.35)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.lock_outline, size: 11, color: AppTheme.amber400),
                          SizedBox(width: 3),
                          Text('Pro Required', style: TextStyle(color: AppTheme.amber300, fontSize: 9.5, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 8),

              if (!ent.allowCustomStaff)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.amber500.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.amber500.withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.lock_outline, size: 16, color: AppTheme.amber400),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Custom Cashiers & Optional Managers are disabled on Starter Monthly. Upgrade to Business Pro Monthly above to create custom Cashier and Manager logins.',
                          style: TextStyle(color: AppTheme.slate300, fontSize: 10.5),
                        ),
                      ),
                    ],
                  ),
                )
              else ...[
                if (shopOwner != null && shopOwner.id != user.id)
                  _staffTile(context, store, shopOwner, canDelete: false),

                if (shopStaff.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.slate950,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.slate800),
                    ),
                    child: const Text(
                      'No cashiers or optional managers added for this business yet. Owner can add custom staff above.',
                      style: TextStyle(color: AppTheme.slate400, fontSize: 10.5),
                    ),
                  )
                else
                  ...shopStaff.map(
                    (m) => _staffTile(context, store, m, canDelete: user.role == UserRole.owner && m.id != user.id),
                  ),
              ],

              const SizedBox(height: 16),

              // SaaS Sign Out Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    store.logoutSaaS();
                  },
                  icon: const Icon(Icons.logout, size: 16, color: AppTheme.rose400),
                  label: const Text('Sign Out of SaaS Account', style: TextStyle(color: AppTheme.rose400, fontSize: 12)),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppTheme.rose500, width: 0.8),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _staffTile(BuildContext context, AppStore store, User m, {required bool canDelete}) {
    final isCurrent = store.currentUser.id == m.id;
    final roleColor = m.role == UserRole.owner
        ? AppTheme.amber400
        : m.role == UserRole.manager
            ? AppTheme.indigo400
            : AppTheme.emerald400;

    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: isCurrent ? AppTheme.blue600.withValues(alpha: 0.14) : AppTheme.slate950,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isCurrent ? AppTheme.blue500 : AppTheme.slate800),
      ),
      child: ListTile(
        dense: true,
        onTap: isCurrent
            ? null
            : () {
                store.setCurrentUser(m);
                Navigator.pop(context);
              },
        leading: CircleAvatar(
          radius: 13,
          backgroundColor: roleColor.withValues(alpha: 0.2),
          child: Text(
            m.name.isNotEmpty ? m.name[0].toUpperCase() : '?',
            style: TextStyle(color: roleColor, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(m.name, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
        subtitle: Text('${m.role.name.toUpperCase()} • ${m.email}', overflow: TextOverflow.ellipsis, style: TextStyle(color: roleColor, fontSize: 9.5)),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (!isCurrent)
              const Text('Switch', style: TextStyle(color: AppTheme.blue400, fontSize: 10.5, fontWeight: FontWeight.bold))
            else
              const Text('ACTIVE', style: TextStyle(color: AppTheme.emerald400, fontSize: 9.5, fontWeight: FontWeight.bold)),
            if (canDelete) ...[
              const SizedBox(width: 4),
              IconButton(
                visualDensity: VisualDensity.compact,
                constraints: const BoxConstraints(),
                padding: EdgeInsets.zero,
                onPressed: () => store.removeStaffMember(m.id),
                icon: const Icon(Icons.delete_outline, size: 16, color: AppTheme.rose400),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
