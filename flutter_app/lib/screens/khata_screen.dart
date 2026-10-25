import 'package:flutter/material.dart';

class KhataScreen extends StatelessWidget {
  const KhataScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final customers = [
      {'name': 'Muhammad Asif', 'phone': '+92 300 1234567', 'due': 8500, 'pts': 140},
      {'name': 'Tariq Hussain', 'phone': '+92 321 9876543', 'due': 12400, 'pts': 210},
      {'name': 'Bilal Ahmed', 'phone': '+92 333 4567890', 'due': 0, 'pts': 95},
      {'name': 'Hamza Sheikh', 'phone': '+92 345 6789012', 'due': 3200, 'pts': 50},
    ];

    final totalDue = customers.fold(0, (sum, c) => sum + (c['due'] as int));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Khata Ledger'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF881337).withOpacity(0.3),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF43F5E).withOpacity(0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Total Receivables (Udhaar Due)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  const SizedBox(height: 4),
                  Text(
                    'PKR $totalDue',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFFB7185)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text('Customer Accounts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 10),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: customers.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final c = customers[i];
                final hasDue = (c['due'] as int) > 0;
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
                          Text(c['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 2),
                          Text('${c['phone']} · ${c['pts']} pts', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'PKR ${c['due']}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: hasDue ? const Color(0xFFFB7185) : Colors.grey,
                            ),
                          ),
                          Text(hasDue ? 'Udhaar Due' : 'Settled', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
