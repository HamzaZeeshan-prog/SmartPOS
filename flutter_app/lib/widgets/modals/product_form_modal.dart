import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';
import '../../services/barcode_lookup_service.dart';
import 'scanner_modal.dart';

class ProductFormModal extends StatefulWidget {
  final Product? productToEdit;
  final String? initialBarcode;

  const ProductFormModal({super.key, this.productToEdit, this.initialBarcode});

  @override
  State<ProductFormModal> createState() => _ProductFormModalState();
}

class _ProductFormModalState extends State<ProductFormModal> {
  final _nameCtrl = TextEditingController();
  final _barcodeCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController();
  final _brandCtrl = TextEditingController();
  final _costCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _stockCtrl = TextEditingController();
  final _minLimitCtrl = TextEditingController();
  ProductUnit _selectedUnit = ProductUnit.piece;
  String? _expiryDate;
  String? _lookupBanner;
  bool _isLookingUp = false;

  @override
  void initState() {
    super.initState();
    if (widget.productToEdit != null) {
      final p = widget.productToEdit!;
      _nameCtrl.text = p.name;
      _barcodeCtrl.text = p.barcode;
      _categoryCtrl.text = p.category;
      _brandCtrl.text = p.brand;
      _costCtrl.text = p.costPrice.toStringAsFixed(0);
      _priceCtrl.text = p.sellingPrice.toStringAsFixed(0);
      _stockCtrl.text = p.stockQuantity.toString();
      _minLimitCtrl.text = p.minimumStockLimit.toString();
      _expiryDate = p.expiryDate;
      if (p.unit is ProductUnit) {
        _selectedUnit = p.unit as ProductUnit;
      }
    } else {
      _barcodeCtrl.text = widget.initialBarcode ?? '8964000${(10000 + DateTime.now().millisecond).toString()}';
      _costCtrl.text = '100';
      _priceCtrl.text = '140';
      _stockCtrl.text = '25';
      _minLimitCtrl.text = '5';
      _categoryCtrl.text = 'Grocery';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _barcodeCtrl.dispose();
    _categoryCtrl.dispose();
    _brandCtrl.dispose();
    _costCtrl.dispose();
    _priceCtrl.dispose();
    _stockCtrl.dispose();
    _minLimitCtrl.dispose();
    super.dispose();
  }

  void _applyLookupResult(String code, BarcodeLookupResult? lookup, AppStore store) {
    _barcodeCtrl.text = code;
    if (lookup != null && lookup.found) {
      _nameCtrl.text = lookup.name;
      _brandCtrl.text = lookup.brand;
      _categoryCtrl.text = lookup.category;
      _costCtrl.text = lookup.costPrice.toStringAsFixed(0);
      _priceCtrl.text = lookup.sellingPrice.toStringAsFixed(0);
      setState(() {
        _selectedUnit = lookup.unit;
        _lookupBanner = 'Auto-filled via ${lookup.source} (${lookup.priceSource})';
      });
      store.showToast('Fetched "${lookup.name}" from ${lookup.source}');
    } else {
      setState(() {
        _lookupBanner = 'Barcode $code scanned (no online match — complete manually)';
      });
    }
  }

  Future<void> _openBarcodeScanner(AppStore store) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ScannerModal(
        pickMode: true,
        onPickedBarcode: (code, lookup) {
          if (!mounted) return;
          _applyLookupResult(code, lookup, store);
        },
      ),
    );
  }

  Future<void> _lookupCurrentBarcodeOnline(AppStore store) async {
    final code = _barcodeCtrl.text.trim();
    if (code.isEmpty) {
      store.showToast('Enter or scan a barcode first');
      return;
    }
    setState(() => _isLookingUp = true);
    final res = await BarcodeLookupService.lookupOnline(code, shopCurrency: store.activeShop.currency);
    if (!mounted) return;
    setState(() => _isLookingUp = false);
    _applyLookupResult(code, res, store);
  }

  Future<void> _pickExpiryDate() async {
    final now = DateTime.now();
    DateTime initial = now.add(const Duration(days: 180));
    if (_expiryDate != null && _expiryDate!.isNotEmpty) {
      try {
        initial = DateTime.parse(_expiryDate!);
      } catch (_) {}
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 10),
    );
    if (picked != null && mounted) {
      setState(() {
        _expiryDate =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  String? _expiryStatusLabel() {
    if (_expiryDate == null || _expiryDate!.isEmpty) return null;
    try {
      final dt = DateTime.parse(_expiryDate!);
      final now = DateTime.now();
      final diff = DateTime(dt.year, dt.month, dt.day).difference(DateTime(now.year, now.month, now.day)).inDays;
      if (diff < 0) return 'EXPIRED (${diff.abs()}d ago)';
      if (diff <= 30) return 'NEAR EXPIRY (${diff}d left)';
      return 'Valid (${diff}d left)';
    } catch (_) {
      return null;
    }
  }

  void _save(AppStore store) {
    if (_nameCtrl.text.trim().isEmpty) {
      store.showToast('Please enter a product name');
      return;
    }
    if (_barcodeCtrl.text.trim().isEmpty) {
      store.showToast('Please scan or enter a barcode');
      return;
    }

    final prod = Product(
      id: widget.productToEdit?.id ?? 'prod_${DateTime.now().millisecondsSinceEpoch}',
      shopId: store.activeShop.id,
      barcode: _barcodeCtrl.text.trim(),
      name: _nameCtrl.text.trim(),
      category: _categoryCtrl.text.trim().isNotEmpty ? _categoryCtrl.text.trim() : 'General',
      brand: _brandCtrl.text.trim(),
      costPrice: double.tryParse(_costCtrl.text) ?? 0,
      sellingPrice: double.tryParse(_priceCtrl.text) ?? 0,
      stockQuantity: int.tryParse(_stockCtrl.text) ?? 0,
      minimumStockLimit: int.tryParse(_minLimitCtrl.text) ?? 5,
      unit: _selectedUnit,
      expiryDate: (_expiryDate != null && _expiryDate!.trim().isNotEmpty) ? _expiryDate!.trim() : null,
      createdAt: widget.productToEdit?.createdAt ?? DateTime.now().toIso8601String(),
      updatedAt: DateTime.now().toIso8601String(),
    );

    store.saveProductFromForm(prod);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final isEdit = widget.productToEdit != null;
    final expStatus = _expiryStatusLabel();

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
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              child: Row(
                children: [
                  Icon(isEdit ? Icons.edit : Icons.add_box, color: AppTheme.blue400),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isEdit ? 'Edit Product Catalog' : 'Add New Inventory Item',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      overflow: TextOverflow.ellipsis,
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
                  if (_lookupBanner != null) ...[
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.emerald500.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.emerald500.withValues(alpha: 0.35)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.auto_awesome, color: AppTheme.emerald400, size: 15),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _lookupBanner!,
                              style: const TextStyle(color: AppTheme.emerald400, fontSize: 11, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Barcode Row with Scan Barcode + Internet Lookup button
                  const Text('Barcode / SKU *', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _barcodeCtrl,
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontFamily: 'monospace'),
                          decoration: InputDecoration(
                            hintText: '8964...',
                            hintStyle: const TextStyle(color: AppTheme.slate600, fontSize: 12),
                            filled: true,
                            fillColor: AppTheme.slate950,
                            isDense: true,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.blue600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => _openBarcodeScanner(store),
                        icon: const Icon(Icons.qr_code_scanner, size: 16),
                        label: const Text('Scan', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                      const SizedBox(width: 6),
                      IconButton(
                        tooltip: 'Fetch details from Internet',
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.emerald600.withValues(alpha: 0.2),
                          foregroundColor: AppTheme.emerald400,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                            side: BorderSide(color: AppTheme.emerald500.withValues(alpha: 0.4)),
                          ),
                        ),
                        onPressed: _isLookingUp ? null : () => _lookupCurrentBarcodeOnline(store),
                        icon: _isLookingUp
                            ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.emerald400))
                            : const Icon(Icons.public, size: 18),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  _buildField('Product Title / Description *', _nameCtrl, 'e.g. Rooh Afza 800ml'),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(child: _buildField('Category', _categoryCtrl, 'Beverages, Dairy, etc.')),
                      const SizedBox(width: 10),
                      Expanded(child: _buildField('Brand Name', _brandCtrl, 'Hamdard, Nestle...')),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Unit of Measure', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            DropdownButtonFormField<ProductUnit>(
                              value: _selectedUnit,
                              isExpanded: true,
                              dropdownColor: AppTheme.slate900,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: AppTheme.slate950,
                                isDense: true,
                                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                              ),
                              items: ProductUnit.values
                                  .map((u) => DropdownMenuItem(
                                        value: u,
                                        child: Text(u.name, style: const TextStyle(color: Colors.white, fontSize: 12)),
                                      ))
                                  .toList(),
                              onChanged: (u) => setState(() => _selectedUnit = u ?? ProductUnit.piece),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Expiry Date (Optional)', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            InkWell(
                              onTap: _pickExpiryDate,
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                height: 42,
                                padding: const EdgeInsets.symmetric(horizontal: 10),
                                decoration: BoxDecoration(
                                  color: AppTheme.slate950,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: (expStatus != null && (expStatus.startsWith('EXPIRED') || expStatus.startsWith('NEAR')))
                                        ? AppTheme.amber500
                                        : AppTheme.slate800,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.calendar_today, size: 14, color: AppTheme.amber400),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        _expiryDate ?? 'Tap to pick date',
                                        style: TextStyle(
                                          color: _expiryDate != null ? Colors.white : AppTheme.slate500,
                                          fontSize: 11,
                                          fontFamily: _expiryDate != null ? 'monospace' : null,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (_expiryDate != null)
                                      GestureDetector(
                                        onTap: () => setState(() => _expiryDate = null),
                                        child: const Icon(Icons.close, size: 15, color: AppTheme.slate400),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (expStatus != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Expiry Status: $expStatus',
                      style: TextStyle(
                        color: expStatus.startsWith('EXPIRED')
                            ? AppTheme.rose400
                            : expStatus.startsWith('NEAR')
                                ? AppTheme.amber400
                                : AppTheme.emerald400,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(child: _buildField('Cost Price (${store.activeShop.currency})', _costCtrl, '410', isNum: true)),
                      const SizedBox(width: 10),
                      Expanded(child: _buildField('Selling Price (${store.activeShop.currency}) *', _priceCtrl, '470', isNum: true)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _buildField('Stock Quantity On-Hand', _stockCtrl, '48', isNum: true)),
                      const SizedBox(width: 10),
                      Expanded(child: _buildField('Min Alert Threshold', _minLimitCtrl, '5', isNum: true)),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: const BoxDecoration(
                color: AppTheme.slate950,
                border: Border(top: BorderSide(color: AppTheme.slate800)),
              ),
              child: SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.blue600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.cloud_upload, size: 18),
                  label: Text(isEdit ? 'Update & Sync Item' : 'Add to Catalog & Cloud', style: const TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () => _save(store),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildField(String label, TextEditingController ctrl, String hint, {bool isNum = false}) {
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
            hintStyle: const TextStyle(color: AppTheme.slate600, fontSize: 12),
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
}
