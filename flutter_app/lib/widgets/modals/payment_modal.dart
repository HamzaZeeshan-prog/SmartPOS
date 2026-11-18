import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';
import 'receipt_modal.dart';

class PaymentModal extends StatefulWidget {
  final List<CartItem> cart;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double deliveryCharge;
  final double grandTotal;
  final Customer? selectedCustomer;

  const PaymentModal({
    super.key,
    required this.cart,
    required this.subtotal,
    required this.discountTotal,
    required this.taxTotal,
    this.deliveryCharge = 0,
    required this.grandTotal,
    this.selectedCustomer,
  });

  @override
  State<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends State<PaymentModal> {
  PaymentMethod _selectedMethod = PaymentMethod.cash;
  final _cashController = TextEditingController();
  final _splitCashController = TextEditingController();
  final _refController = TextEditingController();
  double _cashGiven = 0;
  double _splitCashAmount = 0;
  PaymentMethod _splitSecondMethod = PaymentMethod.jazzcash;
  Customer? _customer;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _customer = widget.selectedCustomer;
    _cashGiven = widget.grandTotal;
    _cashController.text = widget.grandTotal.toStringAsFixed(0);
    _splitCashAmount = (widget.grandTotal / 2).roundToDouble();
    _splitCashController.text = _splitCashAmount.toStringAsFixed(0);
  }

  @override
  void dispose() {
    _cashController.dispose();
    _splitCashController.dispose();
    _refController.dispose();
    super.dispose();
  }

  double get _changeAmount => (_cashGiven - widget.grandTotal).clamp(0.0, double.infinity);
  double get _splitSecondAmount => (widget.grandTotal - _splitCashAmount).clamp(0.0, widget.grandTotal);

  void _onQuickCash(double amount) {
    setState(() {
      _cashGiven = amount;
      _cashController.text = amount.toStringAsFixed(0);
    });
  }

  Future<void> _processPayment(AppStore store) async {
    if (_selectedMethod == PaymentMethod.customerCredit && _customer == null) {
      store.showToast('Please select a Khata customer for Udhaar billing');
      return;
    }

    setState(() => _isProcessing = true);
    await Future.delayed(const Duration(milliseconds: 350));

    final invNum =
        'INV-${DateTime.now().year}${DateTime.now().month.toString().padLeft(2, '0')}${DateTime.now().day.toString().padLeft(2, '0')}-${(store.salesHistory.length + 1).toString().padLeft(3, '0')}';

    final List<PaymentRecord> paymentRecords = [];
    if (_selectedMethod == PaymentMethod.split) {
      if (_splitCashAmount > 0) {
        paymentRecords.add(PaymentRecord(
          id: 'pay_${DateTime.now().millisecondsSinceEpoch}_1',
          method: PaymentMethod.cash,
          amount: _splitCashAmount,
          status: PaymentStatus.paid,
          cashReceived: _splitCashAmount,
          changeReturned: 0,
          timestamp: DateTime.now().toIso8601String(),
        ));
      }
      if (_splitSecondAmount > 0) {
        paymentRecords.add(PaymentRecord(
          id: 'pay_${DateTime.now().millisecondsSinceEpoch}_2',
          method: _splitSecondMethod,
          amount: _splitSecondAmount,
          status: PaymentStatus.paid,
          provider: _splitSecondMethod == PaymentMethod.jazzcash
              ? 'JazzCash API'
              : _splitSecondMethod == PaymentMethod.easypaisa
                  ? 'Easypaisa Gateway'
                  : 'POS Terminal',
          referenceNumber: _refController.text.trim().isNotEmpty
              ? _refController.text.trim()
              : 'SPL-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
          timestamp: DateTime.now().toIso8601String(),
        ));
      }
    } else {
      paymentRecords.add(PaymentRecord(
        id: 'pay_${DateTime.now().millisecondsSinceEpoch}',
        method: _selectedMethod,
        amount: widget.grandTotal,
        status: PaymentStatus.paid,
        cashReceived: _selectedMethod == PaymentMethod.cash ? _cashGiven : null,
        changeReturned: _selectedMethod == PaymentMethod.cash ? _changeAmount : null,
        provider: _selectedMethod == PaymentMethod.jazzcash
            ? 'JazzCash API'
            : _selectedMethod == PaymentMethod.easypaisa
                ? 'Easypaisa Gateway'
                : _selectedMethod == PaymentMethod.bankQr
                    ? 'State Bank Raast P2M'
                    : null,
        referenceNumber: _selectedMethod != PaymentMethod.cash
            ? (_refController.text.trim().isNotEmpty
                ? _refController.text.trim()
                : 'REF-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}')
            : null,
        timestamp: DateTime.now().toIso8601String(),
      ));
    }

    await store.completeSale(
      cart: widget.cart,
      subtotal: widget.subtotal,
      discountTotal: widget.discountTotal,
      taxTotal: widget.taxTotal,
      deliveryCharge: widget.deliveryCharge,
      grandTotal: widget.grandTotal,
      payments: paymentRecords,
      invoiceNumber: invNum,
      customer: _customer,
    );

    if (!mounted) return;
    setState(() => _isProcessing = false);
    Navigator.pop(context, true);

    final latestSale = store.salesHistory.first;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ReceiptModal(sale: latestSale),
    );
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final currency = store.activeShop.currency;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.9,
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
              decoration: BoxDecoration(
                color: AppTheme.slate700,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.emerald500.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.payment, color: AppTheme.emerald400, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Checkout & Payment Rails',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        Text(
                          'Total Payable: $currency ${widget.grandTotal.toStringAsFixed(0)}',
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.bold, fontSize: 12),
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
                const Text(
                  'SELECT PAYMENT METHOD',
                  style: TextStyle(color: AppTheme.slate400, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildMethodChip(PaymentMethod.cash, 'Cash', Icons.money, AppTheme.emerald400),
                    _buildMethodChip(PaymentMethod.jazzcash, 'JazzCash', Icons.phone_android, AppTheme.amber400),
                    _buildMethodChip(PaymentMethod.easypaisa, 'Easypaisa', Icons.account_balance_wallet, Colors.tealAccent),
                    _buildMethodChip(PaymentMethod.bankQr, 'Raast QR', Icons.qr_code, Colors.lightBlueAccent),
                    _buildMethodChip(PaymentMethod.card, 'Card POS', Icons.credit_card, AppTheme.purple400),
                    _buildMethodChip(PaymentMethod.customerCredit, 'Udhaar / Khata', Icons.book, Colors.orangeAccent),
                    _buildMethodChip(PaymentMethod.split, 'Split Pay', Icons.call_split, AppTheme.cyan400),
                  ],
                ),

                const SizedBox(height: 18),

                if (_selectedMethod == PaymentMethod.cash)
                  _buildCashTenderView(currency)
                else if (_selectedMethod == PaymentMethod.jazzcash ||
                    _selectedMethod == PaymentMethod.easypaisa ||
                    _selectedMethod == PaymentMethod.bankQr)
                  _buildDigitalPaymentView()
                else if (_selectedMethod == PaymentMethod.customerCredit)
                  _buildCustomerCreditView(store)
                else if (_selectedMethod == PaymentMethod.split)
                  _buildSplitPaymentView(currency)
                else
                  _buildCardTerminalView(),

                const SizedBox(height: 18),

                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Column(
                    children: [
                      _buildSummaryRow('Subtotal (${widget.cart.length} items)', '$currency ${widget.subtotal.toStringAsFixed(0)}'),
                      if (widget.discountTotal > 0)
                        _buildSummaryRow('Discounts', '- $currency ${widget.discountTotal.toStringAsFixed(0)}', color: AppTheme.emerald400),
                      if (widget.taxTotal > 0)
                        _buildSummaryRow('Sales Tax (${store.activeShop.defaultTaxRate.round()}%)', '+$currency ${widget.taxTotal.toStringAsFixed(0)}'),
                      if (widget.deliveryCharge > 0)
                        _buildSummaryRow('Delivery / Service Fee', '+$currency ${widget.deliveryCharge.toStringAsFixed(0)}'),
                      const Divider(color: AppTheme.slate800),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text('Grand Total Payable', overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                          const SizedBox(width: 8),
                          Text('$currency ${widget.grandTotal.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.emerald400, fontWeight: FontWeight.w900, fontSize: 16)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.emerald600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                onPressed: _isProcessing ? null : () => _processPayment(store),
                child: _isProcessing
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.check_circle, size: 20),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              'COMPLETE SALE • $currency ${widget.grandTotal.toStringAsFixed(0)}',
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                            ),
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

  Widget _buildMethodChip(PaymentMethod method, String label, IconData icon, Color color) {
    final selected = _selectedMethod == method;
    return GestureDetector(
      onTap: () => setState(() => _selectedMethod = method),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? color.withValues(alpha: 0.15) : AppTheme.slate950,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? color : AppTheme.slate800,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: selected ? color : AppTheme.slate400),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: selected ? color : AppTheme.slate300,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCashTenderView(String currency) {
    final exact = widget.grandTotal;
    final p500 = ((widget.grandTotal / 500).ceil() * 500).toDouble();
    final p1000 = ((widget.grandTotal / 1000).ceil() * 1000).toDouble();
    final p5000 = ((widget.grandTotal / 5000).ceil() * 5000).toDouble();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('CASH TENDERED', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _cashController,
            keyboardType: TextInputType.number,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
            decoration: InputDecoration(
              prefixText: '$currency ',
              prefixStyle: const TextStyle(color: AppTheme.slate400, fontSize: 18),
              filled: true,
              fillColor: AppTheme.slate900,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate700)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            onChanged: (val) => setState(() => _cashGiven = double.tryParse(val) ?? 0),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            children: [
              ActionChip(
                label: const Text('Exact Cash', style: TextStyle(fontSize: 11)),
                onPressed: () => _onQuickCash(exact),
                backgroundColor: AppTheme.slate900,
              ),
              if (p500 > exact)
                ActionChip(
                  label: Text('$currency ${p500.round()}', style: const TextStyle(fontSize: 11)),
                  onPressed: () => _onQuickCash(p500),
                  backgroundColor: AppTheme.slate900,
                ),
              if (p1000 > exact && p1000 != p500)
                ActionChip(
                  label: Text('$currency ${p1000.round()}', style: const TextStyle(fontSize: 11)),
                  onPressed: () => _onQuickCash(p1000),
                  backgroundColor: AppTheme.slate900,
                ),
              if (p5000 > exact && p5000 != p1000)
                ActionChip(
                  label: Text('$currency ${p5000.round()}', style: const TextStyle(fontSize: 11)),
                  onPressed: () => _onQuickCash(p5000),
                  backgroundColor: AppTheme.slate900,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _changeAmount > 0 ? AppTheme.emerald950.withValues(alpha: 0.3) : AppTheme.slate900,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _changeAmount > 0 ? AppTheme.emerald600 : AppTheme.slate800),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Change to Return:', style: TextStyle(color: AppTheme.slate300, fontWeight: FontWeight.w600, fontSize: 13)),
                Text(
                  '$currency ${_changeAmount.toStringAsFixed(0)}',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: _changeAmount > 0 ? AppTheme.emerald400 : AppTheme.slate400,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDigitalPaymentView() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Column(
        children: [
          Container(
            width: 132,
            height: 132,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.qr_code_2, size: 84, color: Colors.black87),
                Text(
                  _selectedMethod.name.toUpperCase(),
                  style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Scan with ${_selectedMethod == PaymentMethod.bankQr ? 'Any Banking App (Raast)' : _selectedMethod.name.toUpperCase()}',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _refController,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              hintText: 'Transaction Reference ID (optional)',
              hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
              filled: true,
              fillColor: AppTheme.slate900,
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSplitPaymentView(String currency) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SPLIT TENDER (CASH + DIGITAL / CARD)', style: TextStyle(color: AppTheme.cyan400, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _splitCashController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  decoration: InputDecoration(
                    labelText: 'Cash Portion ($currency)',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate900,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onChanged: (v) {
                    setState(() {
                      _splitCashAmount = (double.tryParse(v) ?? 0).clamp(0, widget.grandTotal);
                    });
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<PaymentMethod>(
                  value: _splitSecondMethod,
                  isExpanded: true,
                  dropdownColor: AppTheme.slate900,
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  decoration: InputDecoration(
                    labelText: 'Second Rail',
                    labelStyle: const TextStyle(color: AppTheme.slate400, fontSize: 11),
                    filled: true,
                    fillColor: AppTheme.slate900,
                    isDense: true,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: [PaymentMethod.jazzcash, PaymentMethod.easypaisa, PaymentMethod.bankQr, PaymentMethod.card]
                      .map((m) => DropdownMenuItem(value: m, child: Text(m.name.toUpperCase(), overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11))))
                      .toList(),
                  onChanged: (m) => setState(() => _splitSecondMethod = m ?? PaymentMethod.jazzcash),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.slate900,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppTheme.slate800),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text('Remaining via ${_splitSecondMethod.name.toUpperCase()}:', overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.slate300, fontSize: 12)),
                ),
                const SizedBox(width: 8),
                Text('$currency ${_splitSecondAmount.toStringAsFixed(0)}', style: const TextStyle(color: AppTheme.cyan400, fontWeight: FontWeight.bold, fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCreditView(AppStore store) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('KHATA / UDHAAR CUSTOMER', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          DropdownButtonFormField<Customer>(
            value: _customer,
            isExpanded: true,
            decoration: InputDecoration(
              filled: true,
              fillColor: AppTheme.slate900,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate700)),
            ),
            dropdownColor: AppTheme.slate900,
            hint: const Text('Select registered customer', style: TextStyle(color: AppTheme.slate400, fontSize: 12)),
            items: store.customers.map((c) {
              return DropdownMenuItem(
                value: c,
                child: Text('${c.name} (Due: ${store.activeShop.currency} ${c.dueBalance.round()})', overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12)),
              );
            }).toList(),
            onChanged: (c) => setState(() => _customer = c),
          ),
          if (_customer != null) ...[
            const SizedBox(height: 8),
            Text(
              'Current balance: ${store.activeShop.currency} ${_customer!.dueBalance.round()} -> New: ${store.activeShop.currency} ${(_customer!.dueBalance + widget.grandTotal).round()}',
              style: const TextStyle(color: Colors.amberAccent, fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCardTerminalView() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Column(
        children: [
          const Icon(Icons.contactless, size: 40, color: AppTheme.blue400),
          const SizedBox(height: 10),
          const Text('Tap or Insert Card on POS Terminal', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(height: 4),
          const Text('Supports PayPak, Visa & Mastercard', style: TextStyle(color: AppTheme.slate400, fontSize: 11)),
          const SizedBox(height: 10),
          TextField(
            controller: _refController,
            style: const TextStyle(color: Colors.white, fontSize: 12),
            decoration: InputDecoration(
              hintText: 'Last 4 digits / Approval Code (optional)',
              hintStyle: const TextStyle(color: AppTheme.slate500, fontSize: 11),
              filled: true,
              fillColor: AppTheme.slate900,
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.slate400, fontSize: 12)),
          Text(value, style: TextStyle(color: color ?? Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
