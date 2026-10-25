import 'package:flutter/material.dart';

class SalesScreen extends StatelessWidget {
  const SalesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final sales = [
      {'inv': 'INV-20261025-081', 'customer': 'Walk-in Customer', 'total': 3750, 'method': 'Cash', 'time': '11:42 AM'},
      {'inv': 'INV-20261025-080', 'customer': 'Muhammad Asif', 'total': 5400, 'method': 'JazzCash', 'time': '11:15 AM'},
      {'inv': 'INV-20261025-079', 'customer': 'Tariq Hussain', 'total': 1850, 'method': 'Udhaar', 'time': '10:50 AM'},
      {'inv': 'INV-20261025-078', 'customer': 'Bilal Ahmed', 'total': 2750, 'method': 'Raast QR', 'time': '10:12 AM'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sales Ledger'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: sales.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          final s = sales[i];
          return Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s['inv'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF38BDF8))),
                    const SizedBox(height: 2),
                    Text('${s['customer']} · ${s['time']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('PKR ${s['total']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF34D399))),
                    const SizedBox(height: 2),
                    Text(s['method'] as String, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
