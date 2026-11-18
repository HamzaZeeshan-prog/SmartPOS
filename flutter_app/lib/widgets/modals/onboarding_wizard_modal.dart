import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';
import '../../data/cities.dart';
import '../../data/saas_config.dart';

class OnboardingWizardModal extends StatefulWidget {
  final Shop? shopToEdit;

  const OnboardingWizardModal({super.key, this.shopToEdit});

  @override
  State<OnboardingWizardModal> createState() => _OnboardingWizardModalState();
}

class _OnboardingWizardModalState extends State<OnboardingWizardModal> {
  final _nameCtrl = TextEditingController();
  final _ownerCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _taxRateCtrl = TextEditingController();
  final _discountRateCtrl = TextEditingController();
  final _receiptMsgCtrl = TextEditingController();
  final _customCityCtrl = TextEditingController();

  String _category = 'Grocery & Supermarket';
  String _city = 'Mianwali';
  String _currency = 'PKR';
  bool _taxEnabled = true;
  bool _discountEnabled = false;
  bool _allowNegativeStock = false;
  PrinterWidth _printerWidth = PrinterWidth.mm80;
  bool _loadStarter = true;
  bool _isSaving = false;

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
    final shop = widget.shopToEdit;
    if (shop != null) {
      _nameCtrl.text = shop.name;
      _ownerCtrl.text = shop.ownerName;
      _phoneCtrl.text = shop.phone;
      _addressCtrl.text = shop.address;
      _taxRateCtrl.text = shop.defaultTaxRate.toStringAsFixed(0);
      _discountRateCtrl.text = shop.defaultDiscountRate.toStringAsFixed(0);
      _receiptMsgCtrl.text = shop.receiptMessage;
      _category = _categories.contains(shop.category) ? shop.category : _categories.first;
      if (PakistanCities.all.contains(shop.city) && shop.city != PakistanCities.customOption) {
        _city = shop.city;
      } else {
        _city = PakistanCities.customOption;
        _customCityCtrl.text = shop.city;
      }
      _currency = _currencies.contains(shop.currency) ? shop.currency : 'PKR';
      _taxEnabled = shop.taxEnabled;
      _discountEnabled = shop.discountEnabled;
      _allowNegativeStock = shop.allowNegativeStock;
      _printerWidth = shop.thermalPrinterWidth;
      _loadStarter = false;
    } else {
      _taxRateCtrl.text = '5';
      _discountRateCtrl.text = '5';
      _receiptMsgCtrl.text = 'Thank you for shopping with us! Exchange within 3 days with receipt.';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ownerCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _taxRateCtrl.dispose();
    _discountRateCtrl.dispose();
    _receiptMsgCtrl.dispose();
    _customCityCtrl.dispose();
    super.dispose();
  }

  Future<void> _save(AppStore store) async {
    if (_nameCtrl.text.trim().isEmpty) {
      store.showToast('Please enter a store or branch name');
      return;
    }
    setState(() => _isSaving = true);

    final resolvedCity = _city == PakistanCities.customOption
        ? (_customCityCtrl.text.trim().isNotEmpty ? _customCityCtrl.text.trim() : 'Mianwali')
        : _city;

    final isEdit = widget.shopToEdit != null;
    final refShop = widget.shopToEdit ?? store.activeShop;
    final shop = Shop(
      id: widget.shopToEdit?.id ?? 'shop_${DateTime.now().millisecondsSinceEpoch}',
      name: _nameCtrl.text.trim(),
      ownerName: _ownerCtrl.text.trim().isNotEmpty ? _ownerCtrl.text.trim() : store.currentUser.name,
      ownerId: widget.shopToEdit?.ownerId ?? store.currentUser.id,
      ownerEmail: widget.shopToEdit?.ownerEmail ?? store.currentUser.email,
      phone: _phoneCtrl.text.trim().isNotEmpty ? _phoneCtrl.text.trim() : '+92 300 0000000',
      category: _category,
      address: _addressCtrl.text.trim().isNotEmpty ? _addressCtrl.text.trim() : 'Main Commercial Market',
      city: resolvedCity,
      currency: _currency,
      taxEnabled: _taxEnabled,
      defaultTaxRate: _taxEnabled ? (double.tryParse(_taxRateCtrl.text) ?? 5) : 0,
      discountEnabled: _discountEnabled,
      defaultDiscountRate: _discountEnabled ? (double.tryParse(_discountRateCtrl.text) ?? 5) : 0,
      receiptMessage: _receiptMsgCtrl.text.trim().isNotEmpty
          ? _receiptMsgCtrl.text.trim()
          : 'Thank you for visiting ${_nameCtrl.text.trim()}!',
      allowNegativeStock: _allowNegativeStock,
      thermalPrinterWidth: _printerWidth,
      subscriptionStatus: refShop.subscriptionStatus,
      subscriptionPlanId: refShop.subscriptionPlanId ?? SaasConfig.plans.first.id,
      subscriptionPlanName: refShop.subscriptionPlanName ?? SaasConfig.plans.first.name,
      subscriptionFee: refShop.subscriptionFee ?? SaasConfig.plans.first.pricePkr,
      subscriptionPaymentMethod: refShop.subscriptionPaymentMethod,
      subscriptionPaymentRef: refShop.subscriptionPaymentRef,
      subscriptionStartedAt: refShop.subscriptionStartedAt,
      subscriptionExpiresAt: refShop.subscriptionExpiresAt,
      subscriptionRejectionReason: refShop.subscriptionRejectionReason,
      createdAt: widget.shopToEdit?.createdAt ?? DateTime.now().toIso8601String(),
    );

    await store.saveShop(shop, loadStarter: !isEdit && _loadStarter);
    if (!mounted) return;
    setState(() => _isSaving = false);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final isEdit = widget.shopToEdit != null;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.88,
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
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.indigo500.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.store_mall_directory, color: AppTheme.indigo400, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEdit ? 'Store Settings & Configuration' : 'Add New Business / Branch',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      Text(
                        isEdit ? 'Configure GST, thermal printer & receipt footer' : 'Launch an isolated multi-tenant store instantly',
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
              padding: const EdgeInsets.all(20),
              children: [
                _field('Business / Shop Name *', _nameCtrl, 'e.g. City Mart - Gulberg Branch'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _field('Owner Name', _ownerCtrl, store.currentUser.name)),
                    const SizedBox(width: 10),
                    Expanded(child: _field('Phone / WhatsApp', _phoneCtrl, '+92 300 1234567')),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: _dropdown('Business Category', _category, _categories, (v) => setState(() => _category = v)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: _dropdown('City', _city, PakistanCities.all, (v) => setState(() => _city = v)),
                    ),
                  ],
                ),
                if (_city == PakistanCities.customOption) ...[
                  const SizedBox(height: 10),
                  _field('Custom City Name *', _customCityCtrl, 'e.g. Kalabagh / Esa Khel'),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: _field('Store Address', _addressCtrl, 'Shop 14, Main Markaz'),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: _dropdown('Currency', _currency, _currencies, (v) => setState(() => _currency = v)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'TAX, INVENTORY & THERMAL HARDWARE',
                  style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Column(
                    children: [
                      SwitchListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        value: _taxEnabled,
                        activeThumbColor: AppTheme.emerald400,
                        title: const Text('Enable Default Sales Tax / GST', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: const Text('Automatically apply GST on checkout bills', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        onChanged: (v) => setState(() => _taxEnabled = v),
                      ),
                      if (_taxEnabled) ...[
                        const SizedBox(height: 8),
                        _field('Default Tax Rate (%)', _taxRateCtrl, '5', isNum: true),
                      ],
                      const Divider(color: AppTheme.slate800),
                      SwitchListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        value: _discountEnabled,
                        activeThumbColor: AppTheme.amber400,
                        title: const Text('Enable Optional Bill Discount', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: const Text('Like GST, toggle discount ON/OFF on checkout bills', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        onChanged: (v) => setState(() => _discountEnabled = v),
                      ),
                      if (_discountEnabled) ...[
                        const SizedBox(height: 8),
                        _field('Default Discount Rate (%)', _discountRateCtrl, '5', isNum: true),
                      ],
                      const Divider(color: AppTheme.slate800),
                      SwitchListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        value: _allowNegativeStock,
                        activeThumbColor: AppTheme.blue400,
                        title: const Text('Allow Negative Stock Billing', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: const Text('Let cashiers bill items even if stock reaches zero', style: TextStyle(color: AppTheme.slate400, fontSize: 10)),
                        onChanged: (v) => setState(() => _allowNegativeStock = v),
                      ),
                      const Divider(color: AppTheme.slate800),
                      Row(
                        children: [
                          const Expanded(
                            child: Text('Thermal Printer Roll Width', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 8),
                          SegmentedButton<PrinterWidth>(
                            segments: const [
                              ButtonSegment(value: PrinterWidth.mm58, label: Text('58mm', style: TextStyle(fontSize: 11))),
                              ButtonSegment(value: PrinterWidth.mm80, label: Text('80mm', style: TextStyle(fontSize: 11))),
                            ],
                            selected: {_printerWidth},
                            onSelectionChanged: (s) => setState(() => _printerWidth = s.first),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _field('Thermal Receipt Footer Message', _receiptMsgCtrl, 'Thank you for shopping with us!'),
                if (!isEdit) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.slate950,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.slate800),
                    ),
                    child: SwitchListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      value: _loadStarter,
                      activeThumbColor: AppTheme.blue400,
                      title: const Text('Pre-load starter inventory catalog', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      subtitle: Text('Loads curated $_category barcodes immediately', style: const TextStyle(color: AppTheme.slate400, fontSize: 10)),
                      onChanged: (v) => setState(() => _loadStarter = v),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppTheme.slate950,
              border: Border(top: BorderSide(color: AppTheme.slate800)),
            ),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.blue600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _isSaving ? null : () => _save(store),
                icon: _isSaving
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.check_circle, size: 18),
                label: Text(isEdit ? 'Save Store Settings' : 'Launch Business Branch', style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, String hint, {bool isNum = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        TextField(
          controller: ctrl,
          keyboardType: isNum ? TextInputType.number : TextInputType.text,
          style: const TextStyle(color: Colors.white, fontSize: 12),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppTheme.slate600, fontSize: 11),
            filled: true,
            fillColor: AppTheme.slate950,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(String label, String value, List<String> items, ValueChanged<String> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          value: value,
          isExpanded: true,
          dropdownColor: AppTheme.slate900,
          style: const TextStyle(color: Colors.white, fontSize: 12),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppTheme.slate950,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
          ),
          items: items.map((i) => DropdownMenuItem(value: i, child: Text(i, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11)))).toList(),
          onChanged: (v) {
            if (v != null) onChanged(v);
          },
        ),
      ],
    );
  }
}
