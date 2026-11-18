import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';
import '../../services/barcode_lookup_service.dart';

class ScannerModal extends StatefulWidget {
  final Function(String barcode)? onScanned;
  final bool pickMode;
  final Function(String barcode, BarcodeLookupResult? lookup)? onPickedBarcode;

  const ScannerModal({
    super.key,
    this.onScanned,
    this.pickMode = false,
    this.onPickedBarcode,
  });

  @override
  State<ScannerModal> createState() => _ScannerModalState();
}

class _ScannerModalState extends State<ScannerModal> {
  final _manualCodeController = TextEditingController();
  final _quickNameCtrl = TextEditingController();
  final _quickBrandCtrl = TextEditingController();
  final _quickCategoryCtrl = TextEditingController(text: 'Grocery');
  final _quickCostCtrl = TextEditingController(text: '100');
  final _quickPriceCtrl = TextEditingController(text: '140');
  final _quickStockCtrl = TextEditingController(text: '20');

  bool _torchOn = false;
  bool _useLiveCamera = false;
  bool _isSearchingOnline = false;
  bool _isProcessingCode = false;
  String? _notFoundBarcode;
  String? _quickExpiryDate;
  BarcodeLookupResult? _lookupResult;
  ProductUnit _quickUnit = ProductUnit.piece;
  MobileScannerController? _cameraController;

  @override
  void dispose() {
    _manualCodeController.dispose();
    _quickNameCtrl.dispose();
    _quickBrandCtrl.dispose();
    _quickCategoryCtrl.dispose();
    _quickCostCtrl.dispose();
    _quickPriceCtrl.dispose();
    _quickStockCtrl.dispose();
    _cameraController?.dispose();
    super.dispose();
  }

  void _toggleCamera() {
    setState(() {
      _useLiveCamera = !_useLiveCamera;
      if (_useLiveCamera && _cameraController == null) {
        _cameraController = MobileScannerController(
          detectionSpeed: DetectionSpeed.noDuplicates,
          torchEnabled: _torchOn,
        );
      }
    });
  }

  Future<void> _stopCameraSafely() async {
    try {
      await _cameraController?.stop();
    } catch (_) {}
  }

  Future<void> _handleCode(String rawCode, AppStore store) async {
    final code = rawCode.trim();
    if (code.isEmpty || _isProcessingCode) return;
    _isProcessingCode = true;

    if (widget.pickMode) {
      await _stopCameraSafely();
      if (!mounted) return;
      setState(() {
        _useLiveCamera = false;
        _isSearchingOnline = true;
      });

      final localProd = store.findProductByBarcode(code);
      BarcodeLookupResult? lookup;
      if (localProd != null) {
        lookup = BarcodeLookupResult(
          barcode: code,
          found: true,
          source: 'Existing Store Catalog',
          name: localProd.name,
          brand: localProd.brand,
          category: localProd.category,
          unit: localProd.unit,
          description: localProd.description,
          costPrice: localProd.costPrice,
          sellingPrice: localProd.sellingPrice,
          priceSource: 'Catalog Price',
        );
      } else {
        lookup = await BarcodeLookupService.lookupOnline(
          code,
          shopCurrency: store.activeShop.currency,
        );
      }

      if (!mounted) return;
      setState(() => _isSearchingOnline = false);
      _isProcessingCode = false;
      Navigator.pop(context);
      widget.onPickedBarcode?.call(code, lookup);
      return;
    }

    final matched = store.findProductByBarcode(code);
    if (matched != null) {
      await _stopCameraSafely();
      if (!mounted) return;
      _isProcessingCode = false;
      Navigator.pop(context);
      widget.onScanned?.call(matched.barcode);
      return;
    }

    await _stopCameraSafely();
    if (!mounted) return;
    setState(() {
      _useLiveCamera = false;
      _isSearchingOnline = true;
      _notFoundBarcode = code;
      _lookupResult = null;
      _quickNameCtrl.clear();
      _quickBrandCtrl.clear();
      _quickExpiryDate = null;
    });

    final result = await BarcodeLookupService.lookupOnline(
      code,
      shopCurrency: store.activeShop.currency,
    );

    if (!mounted) return;
    setState(() {
      _isSearchingOnline = false;
      _isProcessingCode = false;
      _lookupResult = result;
      if (result != null) {
        _quickNameCtrl.text = result.name;
        _quickBrandCtrl.text = result.brand;
        _quickCategoryCtrl.text = result.category;
        _quickCostCtrl.text = result.costPrice.toStringAsFixed(0);
        _quickPriceCtrl.text = result.sellingPrice.toStringAsFixed(0);
        _quickStockCtrl.text = '24';
        _quickUnit = result.unit;
      } else {
        _quickCategoryCtrl.text = 'Grocery';
        _quickCostCtrl.text = '100';
        _quickPriceCtrl.text = '140';
        _quickStockCtrl.text = '20';
      }
    });
  }

  Future<void> _pickQuickExpiryDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 180)),
      firstDate: now.subtract(const Duration(days: 30)),
      lastDate: DateTime(now.year + 10),
    );
    if (picked != null && mounted) {
      setState(() {
        _quickExpiryDate =
            '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  Future<void> _quickRegisterAndAdd(AppStore store) async {
    if (_notFoundBarcode == null) return;
    if (_quickNameCtrl.text.trim().isEmpty) {
      store.showToast('Please enter a product name');
      return;
    }

    final savedBarcode = _notFoundBarcode!;
    final newProd = Product(
      id: 'prod_${DateTime.now().millisecondsSinceEpoch}',
      shopId: store.activeShop.id,
      barcode: savedBarcode,
      name: _quickNameCtrl.text.trim(),
      brand: _quickBrandCtrl.text.trim(),
      category: _quickCategoryCtrl.text.trim().isNotEmpty ? _quickCategoryCtrl.text.trim() : 'General',
      description: _lookupResult?.description ?? '',
      costPrice: double.tryParse(_quickCostCtrl.text) ?? 0,
      sellingPrice: double.tryParse(_quickPriceCtrl.text) ?? 0,
      stockQuantity: int.tryParse(_quickStockCtrl.text) ?? 10,
      minimumStockLimit: 5,
      unit: _quickUnit,
      expiryDate: _quickExpiryDate,
    );

    await store.addNewProductFromScan(newProd);
    if (!mounted) return;
    Navigator.pop(context);
    widget.onScanned?.call(savedBarcode);
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();

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
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                children: [
                  const Icon(Icons.qr_code_scanner, color: AppTheme.blue400, size: 22),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.pickMode ? 'Scan & Auto-Fill Product' : 'Smart Barcode Scanner',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          widget.pickMode
                              ? 'Detects barcode & searches internet details'
                              : 'Local match opens qty • New codes auto-lookup online',
                          style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  TextButton.icon(
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    onPressed: _toggleCamera,
                    icon: Icon(_useLiveCamera ? Icons.videocam_off : Icons.camera_alt, size: 15, color: AppTheme.cyan400),
                    label: Text(_useLiveCamera ? 'Hide' : 'Cam', style: const TextStyle(color: AppTheme.cyan400, fontSize: 11)),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    onPressed: () {
                      setState(() => _torchOn = !_torchOn);
                      _cameraController?.toggleTorch();
                    },
                    icon: Icon(
                      _torchOn ? Icons.flash_on : Icons.flash_off,
                      color: _torchOn ? Colors.amber : AppTheme.slate400,
                      size: 19,
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: AppTheme.slate400, size: 20),
                  ),
                ],
              ),
            ),
            const Divider(color: AppTheme.slate800, height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_isSearchingOnline) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppTheme.slate950,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.blue500.withValues(alpha: 0.4)),
                      ),
                      child: Column(
                        children: [
                          const CircularProgressIndicator(color: AppTheme.blue400),
                          const SizedBox(height: 14),
                          const Text(
                            'Searching Online Barcode Databases...',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Querying OpenFoodFacts, UPCitemdb & global registries for $_notFoundBarcode',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ] else if (_notFoundBarcode != null && !widget.pickMode) ...[
                    _buildQuickRegisterCard(store),
                    const SizedBox(height: 16),
                  ] else ...[
                    Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 300),
                        child: Container(
                          width: double.infinity,
                          height: 185,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppTheme.blue500, width: 2),
                          ),
                          child: _useLiveCamera && _cameraController != null
                              ? MobileScanner(
                                  controller: _cameraController!,
                                  onDetect: (capture) {
                                    final barcodes = capture.barcodes;
                                    if (barcodes.isNotEmpty && barcodes.first.rawValue != null) {
                                      _handleCode(barcodes.first.rawValue!, store);
                                    }
                                  },
                                  errorBuilder: (ctx, err) => const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(12),
                                      child: Text(
                                        'Camera preview unavailable. Use manual barcode lookup or tap quick presets below.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(color: AppTheme.slate400, fontSize: 11),
                                      ),
                                    ),
                                  ),
                                )
                              : Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    const Icon(Icons.qr_code_2, size: 52, color: Colors.white12),
                                    Container(width: 220, height: 2, color: Colors.redAccent.withValues(alpha: 0.85)),
                                    Positioned(
                                      bottom: 12,
                                      child: GestureDetector(
                                        onTap: _toggleCamera,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                          decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(20)),
                                          child: const Text(
                                            'Tap "Cam" for Live Hardware Scanner',
                                            style: TextStyle(color: AppTheme.cyan400, fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  const Text(
                    'MANUAL / USB BARCODE LOOKUP',
                    style: TextStyle(color: AppTheme.slate400, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _manualCodeController,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Enter or scan barcode (e.g. 3017620422003)...',
                            hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
                            filled: true,
                            fillColor: AppTheme.slate950,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate800)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                          ),
                          onSubmitted: (v) => _handleCode(v, store),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.blue600,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => _handleCode(_manualCodeController.text, store),
                        child: const Text('Lookup', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                    ],
                  ),

                  const SizedBox(height: 18),
                  const Text(
                    'ONLINE INTELLIGENT LOOKUP PRESETS',
                    style: TextStyle(color: AppTheme.slate400, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _presetChip('Nutella 400g', '3017620422003', AppTheme.emerald400, store),
                      _presetChip('Coca-Cola 330ml', '5449000000996', AppTheme.blue400, store),
                      _presetChip('Tapal Tea 450g', '8964000200334', AppTheme.amber400, store),
                    ],
                  ),

                  if (!widget.pickMode) ...[
                    const SizedBox(height: 18),
                    const Text(
                      'QUICK TAP TO SCAN (STORE CATALOG)',
                      style: TextStyle(color: AppTheme.slate400, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                    ),
                    const SizedBox(height: 8),
                    ...store.products.take(6).map((p) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.slate950,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.slate800),
                        ),
                        child: ListTile(
                          dense: true,
                          leading: const Icon(Icons.qr_code, size: 20, color: AppTheme.blue400),
                          title: Text(p.name, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                          subtitle: Text('Barcode: ${p.barcode} • ${store.activeShop.currency} ${p.sellingPrice.round()}', style: const TextStyle(color: AppTheme.slate400, fontSize: 10), overflow: TextOverflow.ellipsis),
                          trailing: const Icon(Icons.add_shopping_cart, size: 18, color: AppTheme.emerald400),
                          onTap: () => _handleCode(p.barcode, store),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _presetChip(String title, String barcode, Color color, AppStore store) {
    return ActionChip(
      backgroundColor: color.withValues(alpha: 0.12),
      side: BorderSide(color: color.withValues(alpha: 0.35)),
      avatar: Icon(Icons.public, size: 14, color: color),
      label: Text('$title ($barcode)', style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
      onPressed: () => _handleCode(barcode, store),
    );
  }

  Widget _buildQuickRegisterCard(AppStore store) {
    final foundOnline = _lookupResult != null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: foundOnline ? AppTheme.emerald500.withValues(alpha: 0.6) : AppTheme.amber500.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                foundOnline ? Icons.public : Icons.new_releases,
                color: foundOnline ? AppTheme.emerald400 : AppTheme.amber400,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      foundOnline
                          ? 'Auto-Fetched via ${_lookupResult!.source}'
                          : 'Unregistered Barcode: $_notFoundBarcode',
                      style: TextStyle(
                        color: foundOnline ? AppTheme.emerald400 : AppTheme.amber400,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    if (foundOnline)
                      Text(
                        'Price basis: ${_lookupResult!.priceSource} • Barcode $_notFoundBarcode',
                        style: const TextStyle(color: AppTheme.slate400, fontSize: 10),
                      ),
                  ],
                ),
              ),
              IconButton(
                visualDensity: VisualDensity.compact,
                onPressed: () => setState(() {
                  _notFoundBarcode = null;
                  _lookupResult = null;
                }),
                icon: const Icon(Icons.close, size: 16, color: AppTheme.slate400),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _quickNameCtrl,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              labelText: 'Product Title *',
              filled: true,
              fillColor: AppTheme.slate900,
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _quickBrandCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Brand',
                    filled: true,
                    fillColor: AppTheme.slate900,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _quickCategoryCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Category',
                    filled: true,
                    fillColor: AppTheme.slate900,
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
                  controller: _quickCostCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Cost (${store.activeShop.currency})',
                    filled: true,
                    fillColor: AppTheme.slate900,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _quickPriceCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Selling (${store.activeShop.currency})',
                    filled: true,
                    fillColor: AppTheme.slate900,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: _quickStockCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Stock',
                    filled: true,
                    fillColor: AppTheme.slate900,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          InkWell(
            onTap: _pickQuickExpiryDate,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: AppTheme.slate900,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.slate700),
              ),
              child: Row(
                children: [
                  const Icon(Icons.event, size: 16, color: AppTheme.amber400),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _quickExpiryDate != null ? 'Expiry Date: $_quickExpiryDate' : 'Set Expiry Date (Optional)',
                      style: TextStyle(color: _quickExpiryDate != null ? Colors.white : AppTheme.slate400, fontSize: 11),
                    ),
                  ),
                  if (_quickExpiryDate != null)
                    GestureDetector(
                      onTap: () => setState(() => _quickExpiryDate = null),
                      child: const Icon(Icons.clear, size: 15, color: AppTheme.slate400),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.emerald600, foregroundColor: Colors.white),
              onPressed: () => _quickRegisterAndAdd(store),
              icon: const Icon(Icons.add_box, size: 16),
              label: const Text('Save to Catalog & Detect on POS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }
}
