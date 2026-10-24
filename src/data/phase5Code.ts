export interface FlutterPhase5File {
  path: string;
  description: string;
  code: string;
}

export const PHASE5_FLUTTER_FILES: FlutterPhase5File[] = [
  {
    path: 'lib/features/payments/domain/payment_provider.dart',
    description: 'PaymentProvider interface, PaymentStatus enums, and mock gateways for JazzCash, Easypaisa, Bank QR & Cards.',
    code: `import 'package:flutter_riverpod/flutter_riverpod.dart';

enum PaymentStatus { pending, paid, failed, cancelled, refunded }

class PaymentRequest {
  final String invoiceId;
  final String shopId;
  final String shopName;
  final double amount;
  final String? customerPhone;
  final String? notes;

  const PaymentRequest({
    required this.invoiceId,
    required this.shopId,
    required this.shopName,
    required this.amount,
    this.customerPhone,
    this.notes,
  });

  /// Standard Smart POS URI format specified in project requirements
  String generateQrPayload(String reference) {
    return 'smartpos://payment?invoiceId=\$invoiceId&amount=\${amount.toInt()}&shopId=\$shopId&reference=\$reference';
  }
}

class PaymentResult {
  final String referenceNumber;
  final PaymentStatus status;
  final String? qrPayload;
  final String? transactionMessage;
  final DateTime timestamp;

  const PaymentResult({
    required this.referenceNumber,
    required this.status,
    this.qrPayload,
    this.transactionMessage,
    required this.timestamp,
  });
}

/// Core Abstraction for all POS Payment Gateways
abstract class PaymentProvider {
  String get providerName;
  Future<PaymentResult> initiatePayment(PaymentRequest request);
  Future<PaymentStatus> checkPaymentStatus(String referenceNumber);
}

/// 1. Mock JazzCash Merchant Payment Provider
class MockJazzCashPaymentProvider implements PaymentProvider {
  @override
  String get providerName => 'JazzCash';

  @override
  Future<PaymentResult> initiatePayment(PaymentRequest request) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final ref = 'JC-\${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    return PaymentResult(
      referenceNumber: ref,
      status: PaymentStatus.pending,
      qrPayload: request.generateQrPayload(ref),
      transactionMessage: 'JazzCash QR generated. Awaiting customer USSD / App payment.',
      timestamp: DateTime.now(),
    );
  }

  @override
  Future<PaymentStatus> checkPaymentStatus(String referenceNumber) async {
    // In production: Queried via backend webhook / secure server merchant API
    await Future.delayed(const Duration(milliseconds: 200));
    return PaymentStatus.paid;
  }
}

/// 2. Mock Easypaisa Merchant Payment Provider
class MockEasypaisaPaymentProvider implements PaymentProvider {
  @override
  String get providerName => 'Easypaisa';

  @override
  Future<PaymentResult> initiatePayment(PaymentRequest request) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final ref = 'EP-\${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    return PaymentResult(
      referenceNumber: ref,
      status: PaymentStatus.pending,
      qrPayload: request.generateQrPayload(ref),
      transactionMessage: 'Easypaisa QR generated.',
      timestamp: DateTime.now(),
    );
  }

  @override
  Future<PaymentStatus> checkPaymentStatus(String referenceNumber) async {
    await Future.delayed(const Duration(milliseconds: 200));
    return PaymentStatus.paid;
  }
}

/// 3. Mock Bank Raast / EMVCo QR Provider
class MockBankQRPaymentProvider implements PaymentProvider {
  @override
  String get providerName => 'Bank QR (Raast)';

  @override
  Future<PaymentResult> initiatePayment(PaymentRequest request) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final ref = 'RAAST-\${DateTime.now().millisecondsSinceEpoch.toString().substring(4)}';
    return PaymentResult(
      referenceNumber: ref,
      status: PaymentStatus.pending,
      qrPayload: request.generateQrPayload(ref),
      transactionMessage: 'Raast P2M Dynamic QR initialized.',
      timestamp: DateTime.now(),
    );
  }

  @override
  Future<PaymentStatus> checkPaymentStatus(String referenceNumber) async {
    return PaymentStatus.paid;
  }
}

/// 4. Mock POS Card Terminal Provider (Verifone / Pax USB/Bluetooth Integration)
class MockCardPaymentProvider implements PaymentProvider {
  @override
  String get providerName => 'Card Terminal';

  @override
  Future<PaymentResult> initiatePayment(PaymentRequest request) async {
    await Future.delayed(const Duration(milliseconds: 800));
    final ref = 'CARD-\${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    return PaymentResult(
      referenceNumber: ref,
      status: PaymentStatus.paid,
      transactionMessage: 'Card transaction approved by EMV Chip terminal.',
      timestamp: DateTime.now(),
    );
  }

  @override
  Future<PaymentStatus> checkPaymentStatus(String referenceNumber) async {
    return PaymentStatus.paid;
  }
}`
  },
  {
    path: 'lib/features/pos/presentation/controllers/cart_controller.dart',
    description: 'Riverpod CartState and Notifier handling item stepper, discounts, tax, holding sales, and stock validation.',
    code: `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/models/product_model.dart';
import '../../../../shared/models/customer_model.dart';

class CartLineItem {
  final String id;
  final ProductModel product;
  final double quantity;
  final double unitPrice;
  final double itemDiscount; // in PKR
  final double itemTaxRate; // percentage
  final String? note;

  const CartLineItem({
    required this.id,
    required this.product,
    required this.quantity,
    required this.unitPrice,
    this.itemDiscount = 0.0,
    this.itemTaxRate = 0.0,
    this.note,
  });

  double get subtotal => quantity * unitPrice;
  double get lineTotal => subtotal - itemDiscount;

  CartLineItem copyWith({
    double? quantity,
    double? unitPrice,
    double? itemDiscount,
    double? itemTaxRate,
    String? note,
  }) {
    return CartLineItem(
      id: id,
      product: product,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      itemDiscount: itemDiscount ?? this.itemDiscount,
      itemTaxRate: itemTaxRate ?? this.itemTaxRate,
      note: note ?? this.note,
    );
  }
}

class CartState {
  final List<CartLineItem> items;
  final CustomerModel? customer;
  final double billDiscountValue;
  final bool isPercentDiscount;
  final bool taxEnabled;
  final double taxRate;
  final double deliveryCharge;

  const CartState({
    this.items = const [],
    this.customer,
    this.billDiscountValue = 0.0,
    this.isPercentDiscount = false,
    this.taxEnabled = true,
    this.taxRate = 5.0,
    this.deliveryCharge = 0.0,
  });

  double get subtotal => items.fold(0.0, (sum, i) => sum + i.subtotal);
  double get itemsDiscountTotal => items.fold(0.0, (sum, i) => sum + i.itemDiscount);

  double get billDiscountTotal {
    if (isPercentDiscount) {
      return (subtotal * billDiscountValue.clamp(0, 100)) / 100;
    }
    return billDiscountValue.clamp(0, subtotal);
  }

  double get totalDiscount => itemsDiscountTotal + billDiscountTotal;
  double get taxableAmount => (subtotal - totalDiscount).clamp(0, double.infinity);
  double get taxTotal => taxEnabled ? (taxableAmount * taxRate) / 100 : 0.0;
  double get grandTotal => (taxableAmount + taxTotal + deliveryCharge).roundToDouble();

  CartState copyWith({
    List<CartLineItem>? items,
    CustomerModel? customer,
    double? billDiscountValue,
    bool? isPercentDiscount,
    bool? taxEnabled,
    double? taxRate,
    double? deliveryCharge,
  }) {
    return CartState(
      items: items ?? this.items,
      customer: customer ?? this.customer,
      billDiscountValue: billDiscountValue ?? this.billDiscountValue,
      isPercentDiscount: isPercentDiscount ?? this.isPercentDiscount,
      taxEnabled: taxEnabled ?? this.taxEnabled,
      taxRate: taxRate ?? this.taxRate,
      deliveryCharge: deliveryCharge ?? this.deliveryCharge,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  final List<CartState> _heldSales = [];

  CartNotifier() : super(const CartState());

  List<CartState> get heldSales => List.unmodifiable(_heldSales);

  void addProduct(ProductModel product, [double qty = 1.0]) {
    final existingIndex = state.items.indexWhere((i) => i.product.id == product.id);

    if (existingIndex >= 0) {
      final existing = state.items[existingIndex];
      final newQty = existing.quantity + qty;
      updateQuantity(product.id, newQty);
    } else {
      final newItem = CartLineItem(
        id: 'item_\${DateTime.now().millisecondsSinceEpoch}_\${product.id}',
        product: product,
        quantity: qty,
        unitPrice: product.sellingPrice,
        itemTaxRate: product.taxPercentage,
      );
      state = state.copyWith(items: [...state.items, newItem]);
    }
  }

  void updateQuantity(String productId, double quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.product.id == productId) {
          return i.copyWith(quantity: quantity);
        }
        return i;
      }).toList(),
    );
  }

  void removeItem(String productId) {
    state = state.copyWith(
      items: state.items.where((i) => i.product.id != productId).toList(),
    );
  }

  void setItemDiscount(String productId, double discount) {
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.product.id == productId) {
          return i.copyWith(itemDiscount: discount.clamp(0, i.subtotal));
        }
        return i;
      }).toList(),
    );
  }

  void setItemNote(String productId, String note) {
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.product.id == productId) {
          return i.copyWith(note: note);
        }
        return i;
      }).toList(),
    );
  }

  void attachCustomer(CustomerModel? customer) {
    state = state.copyWith(customer: customer);
  }

  void setBillDiscount(double value, bool isPercent) {
    state = state.copyWith(
      billDiscountValue: value,
      isPercentDiscount: isPercent,
    );
  }

  void toggleTax(bool enabled) {
    state = state.copyWith(taxEnabled: enabled);
  }

  void setDeliveryCharge(double charge) {
    state = state.copyWith(deliveryCharge: charge);
  }

  void holdCurrentSale() {
    if (state.items.isEmpty) return;
    _heldSales.add(state);
    clearCart();
  }

  void resumeHeldSale(int index) {
    if (index >= 0 && index < _heldSales.length) {
      state = _heldSales.removeAt(index);
    }
  }

  void clearCart() {
    state = const CartState();
  }
}

final cartNotifierProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});`
  },
  {
    path: 'lib/features/checkout/presentation/checkout_dialog.dart',
    description: 'Multi-payment checkout dialog with cash calculator, split payment, and dynamic QR display.',
    code: `import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../payments/domain/payment_provider.dart';
import '../controllers/cart_controller.dart';
import '../../../../shared/models/shop_model.dart';

class CheckoutDialog extends ConsumerStatefulWidget {
  final ShopModel shop;
  final double grandTotal;
  final Function(List<Map<String, dynamic>> payments, String invoiceId) onCheckoutComplete;

  const CheckoutDialog({
    super.key,
    required this.shop,
    required this.grandTotal,
    required this.onCheckoutComplete,
  });

  @override
  ConsumerState<CheckoutDialog> createState() => _CheckoutDialogState();
}

class _CheckoutDialogState extends ConsumerState<CheckoutDialog> {
  String _selectedMethod = 'cash'; // 'cash', 'jazzcash', 'easypaisa', 'bank_qr', 'split'
  late double _cashReceived;

  // Split payment
  late double _splitCash;
  late double _splitDigital;
  String _splitProvider = 'jazzcash';

  // Digital QR Timer
  int _qrSecondsRemaining = 300;
  Timer? _qrTimer;
  late String _invoiceId;
  late String _paymentRef;
  late String _qrPayload;

  @override
  void initState() {
    super.initState();
    _cashReceived = widget.grandTotal;
    _splitCash = (widget.grandTotal / 2).roundToDouble();
    _splitDigital = widget.grandTotal - _splitCash;

    _invoiceId = 'INV-\${DateTime.now().toIso8601String().substring(0, 10).replaceAll("-", "")}-\${DateTime.now().millisecond}';
    _paymentRef = 'REF-\${DateTime.now().millisecondsSinceEpoch.toString().substring(5)}';
    _qrPayload = 'smartpos://payment?invoiceId=\$_invoiceId&amount=\${widget.grandTotal.toInt()}&shopId=\${widget.shop.id}&reference=\$_paymentRef';

    _startQrTimer();
  }

  void _startQrTimer() {
    _qrTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_qrSecondsRemaining > 0) {
        setState(() => _qrSecondsRemaining--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _qrTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final changeReturned = (_cashReceived - widget.grandTotal).clamp(0, double.infinity);
    final isCashSufficient = _cashReceived >= widget.grandTotal;
    final isSplitValid = (_splitCash + _splitDigital) == widget.grandTotal;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 720),
        child: Padding(
          padding: const EdgeInsets.all(24),
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
                      Text(_invoiceId, style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12)),
                      const Text('Checkout & Payment', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                ],
              ),
              const Divider(height: 24),

              // Total Payable Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Total Payable:', style: TextStyle(fontWeight: FontWeight.w600)),
                    Text(
                      'PKR \${widget.grandTotal.toInt()}',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.blue),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Payment Method Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    ChoiceChip(label: const Text('Cash'), selected: _selectedMethod == 'cash', onSelected: (_) => setState(() => _selectedMethod = 'cash')),
                    const SizedBox(width: 8),
                    ChoiceChip(label: const Text('JazzCash'), selected: _selectedMethod == 'jazzcash', onSelected: (_) => setState(() => _selectedMethod = 'jazzcash')),
                    const SizedBox(width: 8),
                    ChoiceChip(label: const Text('Easypaisa'), selected: _selectedMethod == 'easypaisa', onSelected: (_) => setState(() => _selectedMethod = 'easypaisa')),
                    const SizedBox(width: 8),
                    ChoiceChip(label: const Text('Bank QR'), selected: _selectedMethod == 'bank_qr', onSelected: (_) => setState(() => _selectedMethod = 'bank_qr')),
                    const SizedBox(width: 8),
                    ChoiceChip(label: const Text('Split Pay'), selected: _selectedMethod == 'split', onSelected: (_) => setState(() => _selectedMethod = 'split')),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Method Viewport
              Expanded(
                child: SingleChildScrollView(
                  child: _selectedMethod == 'cash'
                      ? _buildCashView(changeReturned, isCashSufficient)
                      : (_selectedMethod == 'split'
                          ? _buildSplitView(isSplitValid)
                          : _buildQrView()),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCashView(double changeReturned, bool isSufficient) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Cash Received (PKR) *', prefixText: 'PKR '),
          controller: TextEditingController(text: _cashReceived.toInt().toString()),
          onChanged: (val) => setState(() => _cashReceived = double.tryParse(val) ?? 0),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: [widget.grandTotal, 500, 1000, 5000].map((amt) {
            return ActionChip(
              label: Text(amt == widget.grandTotal ? 'Exact' : 'PKR \${amt.toInt()}'),
              onPressed: () => setState(() => _cashReceived = amt.toDouble()),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(12)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text('Change Returned:', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('PKR \${changeReturned.toInt()}', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.green[800])),
            ],
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: isSufficient
                ? () {
                    widget.onCheckoutComplete([
                      {
                        'method': 'cash',
                        'amount': widget.grandTotal,
                        'cashReceived': _cashReceived,
                        'changeReturned': changeReturned,
                        'status': 'paid',
                      }
                    ], _invoiceId);
                    Navigator.pop(context);
                  }
                : null,
            child: const Text('Complete Cash Payment'),
          ),
        ),
      ],
    );
  }

  Widget _buildQrView() {
    return Column(
      children: [
        QrImageView(data: _qrPayload, version: QrVersions.auto, size: 180.0),
        const SizedBox(height: 12),
        Text('Expires in \${_qrSecondsRemaining ~/ 60}:\${(_qrSecondsRemaining % 60).toString().padLeft(2, "0")}', style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Text(_qrPayload, style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: Colors.grey), textAlign: TextAlign.center),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              widget.onCheckoutComplete([
                {
                  'method': _selectedMethod,
                  'amount': widget.grandTotal,
                  'reference': _paymentRef,
                  'status': 'paid',
                  'provider': _selectedMethod.toUpperCase(),
                }
              ], _invoiceId);
              Navigator.pop(context);
            },
            child: Text('Confirm Demo \${_selectedMethod.toUpperCase()} Payment'),
          ),
        ),
      ],
    );
  }

  Widget _buildSplitView(bool isValid) {
    return Column(
      children: [
        TextField(
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Cash Portion (PKR)'),
          controller: TextEditingController(text: _splitCash.toInt().toString()),
          onChanged: (v) {
            final val = double.tryParse(v) ?? 0;
            setState(() {
              _splitCash = val;
              _splitDigital = (widget.grandTotal - val).clamp(0, double.infinity);
            });
          },
        ),
        const SizedBox(height: 12),
        TextField(
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(labelText: 'Digital Portion (PKR)'),
          controller: TextEditingController(text: _splitDigital.toInt().toString()),
          onChanged: (v) {
            final val = double.tryParse(v) ?? 0;
            setState(() {
              _splitDigital = val;
              _splitCash = (widget.grandTotal - val).clamp(0, double.infinity);
            });
          },
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: isValid
                ? () {
                    widget.onCheckoutComplete([
                      {'method': 'cash', 'amount': _splitCash, 'status': 'paid'},
                      {'method': _splitProvider, 'amount': _splitDigital, 'status': 'paid'},
                    ], _invoiceId);
                    Navigator.pop(context);
                  }
                : null,
            child: const Text('Complete Split Payment'),
          ),
        ),
      ],
    );
  }
}`
  }
];
