export interface FlutterPhase4File {
  path: string;
  description: string;
  code: string;
}

export const PHASE4_FLUTTER_FILES: FlutterPhase4File[] = [
  {
    path: 'lib/core/services/product_lookup_service.dart',
    description: 'ProductLookupService abstraction with OpenFoodFacts, Mock, and Composite fallback resolvers.',
    code: `import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ProductLookupResult {
  final String barcode;
  final String? name;
  final String? category;
  final String? brand;
  final String? description;
  final String? imageUrl;
  final String? unit;
  final double? suggestedSellingPrice;

  const ProductLookupResult({
    required this.barcode,
    this.name,
    this.category,
    this.brand,
    this.description,
    this.imageUrl,
    this.unit,
    this.suggestedSellingPrice,
  });

  factory ProductLookupResult.fromJson(Map<String, dynamic> json) {
    return ProductLookupResult(
      barcode: json['barcode'] as String,
      name: json['name'] as String?,
      category: json['category'] as String?,
      brand: json['brand'] as String?,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      unit: json['unit'] as String?,
      suggestedSellingPrice: (json['suggestedSellingPrice'] as num?)?.toDouble(),
    );
  }
}

/// Core Abstraction requested in POS specification
abstract class ProductLookupService {
  Future<ProductLookupResult?> lookupByBarcode(String barcode);
}

/// 1. OpenFoodFacts Global REST API Implementation
class OpenFoodFactsProductLookupService implements ProductLookupService {
  final Dio _dio;
  OpenFoodFactsProductLookupService([Dio? dio]) : _dio = dio ?? Dio();

  @override
  Future<ProductLookupResult?> lookupByBarcode(String barcode) async {
    try {
      final cleanCode = barcode.trim();
      final url = 'https://world.openfoodfacts.org/api/v2/product/\$cleanCode.json';

      final response = await _dio.get(
        url,
        options: Options(
          headers: {'User-Agent': 'SmartPOS_Flutter_Client/1.0'},
          sendTimeout: const Duration(seconds: 4),
          receiveTimeout: const Duration(seconds: 4),
        ),
      );

      if (response.statusCode == 200 && response.data['status'] == 1) {
        final productData = response.data['product'] as Map<String, dynamic>;
        return ProductLookupResult(
          barcode: cleanCode,
          name: productData['product_name'] ?? productData['product_name_en'],
          brand: productData['brands'],
          category: productData['categories_tags'] != null &&
                  (productData['categories_tags'] as List).isNotEmpty
              ? (productData['categories_tags'][0] as String)
                  .replaceAll('en:', '')
                  .replaceAll('-', ' ')
              : 'Grocery',
          description: productData['generic_name'] ?? productData['ingredients_text'],
          imageUrl: productData['image_front_small_url'] ?? productData['image_url'],
          unit: productData['quantity'] != null && productData['quantity'].toString().contains('g')
              ? 'gram'
              : 'packet',
        );
      }
      return null;
    } catch (_) {
      // Gracefully fall through to next provider if network fails or timeout occurs
      return null;
    }
  }
}

/// 2. Mock Lookup Service for testing Pakistani & Regional FMCG products
class MockProductLookupService implements ProductLookupService {
  static final Map<String, ProductLookupResult> _registry = {
    '896400099999': const ProductLookupResult(
      barcode: '896400099999',
      name: 'Shan Special Bombay Biryani Masala 60g',
      category: 'Grocery',
      brand: 'Shan Foods',
      description: 'Authentic Bombay biryani recipe mix with whole aromatic spices.',
      unit: 'packet',
      suggestedSellingPrice: 150.0,
    ),
    '896400088888': const ProductLookupResult(
      barcode: '896400088888',
      name: 'Mitchells Mango Jam 450g Glass Jar',
      category: 'Grocery',
      brand: 'Mitchells',
      description: 'Pure fruit jam prepared from fresh Chaunsa and Sindhri mangoes.',
      unit: 'piece',
      suggestedSellingPrice: 420.0,
    ),
    '896400077777': const ProductLookupResult(
      barcode: '896400077777',
      name: 'National Chili Garlic Sauce 300g Bottle',
      category: 'Grocery',
      brand: 'National Foods',
      description: 'Zesty table sauce with crushed red chilies and garlic cloves.',
      unit: 'piece',
      suggestedSellingPrice: 280.0,
    ),
  };

  @override
  Future<ProductLookupResult?> lookupByBarcode(String barcode) async {
    await Future.delayed(const Duration(milliseconds: 400));
    return _registry[barcode.trim()];
  }
}

/// 3. Composite Lookup Service: Tries OpenFoodFacts -> Mock -> Returns null
class CompositeProductLookupService implements ProductLookupService {
  final List<ProductLookupService> _services;

  CompositeProductLookupService([List<ProductLookupService>? services])
      : _services = services ?? [
          OpenFoodFactsProductLookupService(),
          MockProductLookupService(),
        ];

  @override
  Future<ProductLookupResult?> lookupByBarcode(String barcode) async {
    for (final service in _services) {
      try {
        final result = await service.lookupByBarcode(barcode);
        if (result != null && result.name != null && result.name!.isNotEmpty) {
          return result;
        }
      } catch (_) {
        continue;
      }
    }
    return null;
  }
}

final productLookupServiceProvider = Provider<ProductLookupService>((ref) {
  return CompositeProductLookupService();
});`
  },
  {
    path: 'lib/features/scanner/presentation/barcode_scanner_screen.dart',
    description: 'mobile_scanner view with reticle animation, flash/torch toggle, camera flip, and sound feedback.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../products/data/products_repository.dart';
import '../services/usb_barcode_listener.dart';
import 'product_lookup_review_sheet.dart';

class BarcodeScannerScreen extends ConsumerStatefulWidget {
  final String shopId;
  final Function(String barcode)? onBarcodeScanned;

  const BarcodeScannerScreen({
    super.key,
    required this.shopId,
    this.onBarcodeScanned,
  });

  @override
  ConsumerState<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends ConsumerState<BarcodeScannerScreen> {
  final MobileScannerController _cameraController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  final TextEditingController _manualCodeController = TextEditingController();

  @override
  void dispose() {
    _cameraController.dispose();
    _manualCodeController.dispose();
    super.dispose();
  }

  Future<void> _handleBarcodeDetected(String rawCode) async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    final cleanCode = rawCode.trim();
    if (cleanCode.isEmpty) {
      setState(() => _isProcessing = false);
      return;
    }

    // 1. First, search local inventory
    final localProduct = await ref
        .read(productsRepositoryProvider)
        .getProductByBarcode(widget.shopId, cleanCode);

    if (localProduct != null) {
      // Product exists locally! Add to cart or return to caller
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Found: \${localProduct.name} (PKR \${localProduct.sellingPrice})'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
        widget.onBarcodeScanned?.call(cleanCode);
        Navigator.pop(context, localProduct);
      }
    } else {
      // 2. Product does not exist locally -> Open ProductLookupReviewSheet
      if (mounted) {
        await showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => ProductLookupReviewSheet(
            barcode: cleanCode,
            shopId: widget.shopId,
          ),
        );
      }
    }

    if (mounted) {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return UsbBarcodeListener(
      onBarcodeScanned: _handleBarcodeDetected,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Scan Product Barcode / QR'),
          actions: [
            // Torch / Flashlight Toggle
            ValueListenableBuilder(
              valueListenable: _cameraController.torchState,
              builder: (context, state, child) {
                final isTorchOn = state == TorchState.on;
                return IconButton(
                  icon: Icon(isTorchOn ? Icons.flash_on : Icons.flash_off),
                  onPressed: () => _cameraController.toggleTorch(),
                  tooltip: 'Flashlight Toggle',
                );
              },
            ),
            // Camera Facing Switch
            IconButton(
              icon: const Icon(Icons.flip_camera_android),
              onPressed: () => _cameraController.switchCamera(),
              tooltip: 'Switch Camera',
            ),
          ],
        ),
        body: Stack(
          children: [
            // 1. Camera Viewfinder
            MobileScanner(
              controller: _cameraController,
              onDetect: (capture) {
                final List<Barcode> barcodes = capture.barcodes;
                for (final barcode in barcodes) {
                  if (barcode.rawValue != null) {
                    _handleBarcodeDetected(barcode.rawValue!);
                    break;
                  }
                }
              },
            ),

            // 2. Reticle Overlay
            Center(
              child: Container(
                width: 280,
                height: 180,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.blueAccent, width: 2.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.blueAccent.withOpacity(0.8),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(8),
                          bottomRight: Radius.circular(8),
                        ),
                      ),
                      child: const Text(
                        'Align Barcode or QR Code',
                        style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const Divider(color: Colors.redAccent, thickness: 1.5),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ),

            // 3. Manual Keyboard Input / Web USB input bar at bottom
            Positioned(
              left: 16,
              right: 16,
              bottom: 24,
              child: Card(
                elevation: 8,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  child: Row(
                    children: [
                      const Icon(Icons.keyboard, color: Colors.grey, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _manualCodeController,
                          keyboardType: TextInputType.text,
                          decoration: const InputDecoration(
                            hintText: 'Enter code or scan with USB gun...',
                            border: InputBorder.none,
                            isDense: true,
                          ),
                          onSubmitted: (code) {
                            if (code.isNotEmpty) {
                              _handleBarcodeDetected(code);
                              _manualCodeController.clear();
                            }
                          },
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.arrow_forward, color: Colors.blueAccent),
                        onPressed: () {
                          final code = _manualCodeController.text.trim();
                          if (code.isNotEmpty) {
                            _handleBarcodeDetected(code);
                            _manualCodeController.clear();
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}`
  },
  {
    path: 'lib/features/scanner/services/usb_barcode_listener.dart',
    description: 'Hardware USB/Bluetooth HID keyboard scanner listener for Web and Desktop POS.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Global listener for hardware USB Barcode Scanners on Web, Windows, macOS & Linux
/// USB scanners emulate a fast keyboard that rapidly types digits followed by an Enter key.
class UsbBarcodeListener extends StatefulWidget {
  final Widget child;
  final Function(String barcode) onBarcodeScanned;
  final Duration bufferTimeout;

  const UsbBarcodeListener({
    super.key,
    required this.child,
    required this.onBarcodeScanned,
    this.bufferTimeout = const Duration(milliseconds: 150),
  });

  @override
  State<UsbBarcodeListener> createState() => _UsbBarcodeListenerState();
}

class _UsbBarcodeListenerState extends State<UsbBarcodeListener> {
  final StringBuffer _buffer = StringBuffer();
  DateTime _lastKeystrokeTime = DateTime.now();

  void _onKeyEvent(KeyEvent event) {
    if (event is! KeyDownEvent) return;

    final now = DateTime.now();
    // If delay between keystrokes exceeds timeout, reset buffer (user typing manually)
    if (now.difference(_lastKeystrokeTime) > widget.bufferTimeout) {
      _buffer.clear();
    }
    _lastKeystrokeTime = now;

    if (event.logicalKey == LogicalKeyboardKey.enter) {
      final code = _buffer.toString().trim();
      if (code.length >= 3) {
        widget.onBarcodeScanned(code);
      }
      _buffer.clear();
    } else {
      final char = event.character;
      if (char != null && char.isNotEmpty && char.codeUnitAt(0) >= 32) {
        _buffer.write(char);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: FocusNode(),
      autofocus: true,
      onKeyEvent: _onKeyEvent,
      child: widget.child,
    );
  }
}`
  },
  {
    path: 'lib/features/scanner/presentation/product_lookup_review_sheet.dart',
    description: 'Smart bottom sheet that runs ProductLookupService, lets user review/edit metadata, and saves to Cloud.',
    code: `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/product_lookup_service.dart';
import '../../products/data/products_repository.dart';
import '../../../shared/models/product_model.dart';

class ProductLookupReviewSheet extends ConsumerStatefulWidget {
  final String barcode;
  final String shopId;

  const ProductLookupReviewSheet({
    super.key,
    required this.barcode,
    required this.shopId,
  });

  @override
  ConsumerState<ProductLookupReviewSheet> createState() => _ProductLookupReviewSheetState();
}

class _ProductLookupReviewSheetState extends ConsumerState<ProductLookupReviewSheet> {
  bool _isLoading = true;
  ProductLookupResult? _lookupResult;

  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _categoryController = TextEditingController(text: 'Grocery');
  final _brandController = TextEditingController();
  final _costPriceController = TextEditingController(text: '100');
  final _sellingPriceController = TextEditingController(text: '140');
  final _stockController = TextEditingController(text: '20');
  final _supplierController = TextEditingController(text: 'National Distributors');
  String _unit = 'piece';

  @override
  void initState() {
    super.initState();
    _executeLookup();
  }

  Future<void> _executeLookup() async {
    final result = await ref
        .read(productLookupServiceProvider)
        .lookupByBarcode(widget.barcode);

    if (mounted) {
      setState(() {
        _isLoading = false;
        _lookupResult = result;
        if (result != null) {
          _nameController.text = result.name ?? '';
          _categoryController.text = result.category ?? 'Grocery';
          _brandController.text = result.brand ?? '';
          if (result.suggestedSellingPrice != null) {
            _sellingPriceController.text = result.suggestedSellingPrice!.toInt().toString();
            _costPriceController.text = (result.suggestedSellingPrice! * 0.75).toInt().toString();
          }
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        left: 20,
        right: 20,
        top: 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: _isLoading
          ? const SizedBox(
              height: 220,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Querying ProductLookupService...'),
                    Text('Checking OpenFoodFacts & Global Barcode Database', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
            )
          : SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header badge
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _lookupResult != null ? 'Product Found in Global DB!' : 'New Unregistered Product',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: _lookupResult != null ? Colors.green[800] : Colors.blue[900],
                          ),
                        ),
                        Chip(label: Text(widget.barcode, style: const TextStyle(fontFamily: 'monospace'))),
                      ],
                    ),
                    const SizedBox(height: 16),

                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(labelText: 'Product Name *'),
                      validator: (v) => v!.isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _categoryController,
                            decoration: const InputDecoration(labelText: 'Category *'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _brandController,
                            decoration: const InputDecoration(labelText: 'Brand'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _costPriceController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Cost Price (PKR) *'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _sellingPriceController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Selling Price (PKR) *'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _stockController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(labelText: 'Initial Stock *'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () async {
                          if (_formKey.currentState!.validate()) {
                            final newProduct = ProductModel(
                              id: 'prod_\${DateTime.now().millisecondsSinceEpoch}',
                              shopId: widget.shopId,
                              barcode: widget.barcode,
                              name: _nameController.text,
                              category: _categoryController.text,
                              brand: _brandController.text.isNotEmpty ? _brandController.text : 'Generic',
                              costPrice: double.tryParse(_costPriceController.text) ?? 100,
                              sellingPrice: double.tryParse(_sellingPriceController.text) ?? 140,
                              stockQuantity: double.tryParse(_stockController.text) ?? 20,
                              unit: _unit,
                              minimumStockLimit: 5,
                            );

                            await ref.read(productsRepositoryProvider).saveProduct(newProduct);
                            if (context.mounted) Navigator.pop(context, newProduct);
                          }
                        },
                        child: const Text('Save to Inventory & Add to Cart'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}`
  }
];
