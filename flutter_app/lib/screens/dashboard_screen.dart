import 'package:flutter/material.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Store Dashboard'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // KPI Summary Row
            Row(
              children: [
                _buildKpiCard('Today Sales', 'PKR 48,250', Icons.attach_money, const Color(0xFF34D399)),
                const SizedBox(width: 10),
                _buildKpiCard('Total Orders', '32 Bills', Icons.shopping_bag, const Color(0xFF38BDF8)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                _buildKpiCard('Est. Profit', 'PKR 11,800', Icons.trending_up, const Color(0xFF818CF8)),
                const SizedBox(width: 10),
                _buildKpiCard('Low Stock', '4 Items', Icons.warning_amber, const Color(0xFFFBBF24)),
              ],
            ),

            const SizedBox(height: 20),

            // Recent Transactions Card
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
                  const Text('Recent Sales Invoices', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 12),
                  _buildTransactionTile('INV-20261025-081', 'Walk-in Customer', 'PKR 3,750', 'Cash'),
                  const Divider(color: Color(0xFF1E293B)),
                  _buildTransactionTile('INV-20261025-080', 'Muhammad Asif', 'PKR 5,400', 'JazzCash'),
                  const Divider(color: Color(0xFF1E293B)),
                  _buildTransactionTile('INV-20261025-079', 'Tariq Hussain', 'PKR 1,850', 'Udhaar'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF1E293B)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                Icon(icon, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 8),
            Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionTile(String inv, String customer, String amount, String method) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(inv, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8))),
            Text(customer, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(amount, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF34D399))),
            Text(method, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          ],
        ),
      ],
    );
  }
}
