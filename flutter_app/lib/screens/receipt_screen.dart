import 'package:flutter/material.dart';
import '../models/models.dart';

class ReceiptScreen extends StatelessWidget {
  final SaleModel sale;

  const ReceiptScreen({super.key, required this.sale});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thermal Receipt'),
        actions: [
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Receipt link copied to clipboard for WhatsApp!')),
              );
            },
          ),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Container(
            width: 320,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
              boxShadow: const [
                BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Center(
                  child: Text(
                    'AL-MADINA CASH & CARRY',
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                const Center(
                  child: Text(
                    'Main Commercial Market, G-11 Markaz\nTel: +92 51 2289410',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.black54, fontSize: 10),
                  ),
                ),
                const Divider(color: Colors.black54),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Invoice: ${sale.invoiceNumber}', style: const TextStyle(color: Colors.black87, fontSize: 11)),
                    Text(sale.paymentMethod, style: const TextStyle(color: Colors.black87, fontSize: 11, fontWeight: FontWeight.bold)),
                  ],
                ),
                const Divider(color: Colors.black54),
                ...sale.items.map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${item.product.name} (x${item.quantity})',
                          style: const TextStyle(color: Colors.black87, fontSize: 11),
                        ),
                      ),
                      Text(
                        'PKR ${item.lineTotal.toInt()}',
                        style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ],
                  ),
                )),
                const Divider(color: Colors.black54),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('GRAND TOTAL', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text('PKR ${sale.grandTotal.toInt()}', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 16),
                const Center(
                  child: Text(
                    'Thank you for your visit!\nExchange valid within 3 days with receipt.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.black54, fontSize: 9),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ElevatedButton.icon(
            icon: const Icon(Icons.print),
            label: const Text('Print ESC/POS Slip'),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Printing 80mm ESC/POS slip to Bluetooth thermal printer...')),
              );
              Navigator.pop(context);
            },
          ),
        ),
      ),
    );
  }
}
