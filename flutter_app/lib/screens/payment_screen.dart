import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/models.dart';
import 'receipt_screen.dart';

class PaymentScreen extends StatefulWidget {
  final double grandTotal;
  final List<CartItemModel> cart;

  const PaymentScreen({
    super.key,
    required this.grandTotal,
    required this.cart,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedMethod = 'cash';
  late double _cashReceived;

  @override
  void initState() {
    super.initState();
    _cashReceived = widget.grandTotal;
  }

  void _completePayment() {
    final invoiceNumber = 'INV-${DateTime.now().year}${DateTime.now().month.toString().padLeft(2, '0')}${DateTime.now().day.toString().padLeft(2, '0')}-${(100 + DateTime.now().second * 10)}';
    
    final sale = SaleModel(
      id: 'sale_${DateTime.now().millisecondsSinceEpoch}',
      invoiceNumber: invoiceNumber,
      createdAt: DateTime.now(),
      cashierName: 'Tariq Mehmood',
      items: widget.cart,
      subtotal: widget.grandTotal,
      discountTotal: 0,
      taxTotal: 0,
      grandTotal: widget.grandTotal,
      paymentMethod: _selectedMethod.toUpperCase(),
    );

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => ReceiptScreen(sale: sale)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final invoiceNumber = 'INV-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    final qrPayload = 'smartpos://payment?invoiceId=$invoiceNumber&amount=${widget.grandTotal.toInt()}&shopId=shop_1';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout & Payment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Bill Summary Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                children: [
                  const Text('Total Payable Amount', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(
                    'PKR ${widget.grandTotal.toInt()}',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Payment Methods Bar
            Row(
              children: [
                _buildMethodTab('cash', 'Cash', Icons.money),
                _buildMethodTab('jazzcash', 'JazzCash', Icons.phone_android),
                _buildMethodTab('raast', 'Raast QR', Icons.qr_code),
                _buildMethodTab('credit', 'Udhaar', Icons.person),
              ],
            ),

            const SizedBox(height: 16),

            // Cash Mode Content
            if (_selectedMethod == 'cash') ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF1E293B)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Cash Tendered (PKR)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      keyboardType: TextInputType.number,
                      controller: TextEditingController(text: _cashReceived.toInt().toString()),
                      onChanged: (v) => setState(() => _cashReceived = double.tryParse(v) ?? widget.grandTotal),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFF1E293B),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Change to Return:', style: TextStyle(color: Colors.grey)),
                        Text(
                          'PKR ${(_cashReceived - widget.grandTotal).clamp(0, 9999999).toInt()}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF34D399)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            // Raast / Digital QR Mode
            if (_selectedMethod == 'raast' || _selectedMethod == 'jazzcash') ...[
              Center(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: QrImageView(
                    data: qrPayload,
                    version: QrVersions.auto,
                    size: 200.0,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Center(
                child: Text('Scan with Mobile Banking or JazzCash App', style: TextStyle(color: Colors.grey, fontSize: 11)),
              ),
            ],

            // Udhaar / Customer Credit
            if (_selectedMethod == 'credit') ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF581C87).withOpacity(0.3),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF9333EA)),
                ),
                child: const Column(
                  children: [
                    Text('Store Credit (Udhaar)', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFC084FC))),
                    SizedBox(height: 6),
                    Text('This invoice will be charged to the customer\'s Khata ledger balance.', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _completePayment,
              child: const Text('Complete Payment & Print Slip'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMethodTab(String id, String label, IconData icon) {
    final isSelected = _selectedMethod == id;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedMethod = id),
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: isSelected ? const Color(0xFF38BDF8) : const Color(0xFF1E293B)),
          ),
          child: Column(
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : Colors.grey),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
