import 'package:flutter/material.dart';

class CatalogScreen extends StatelessWidget {
  const CatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      {'name': 'Super Basmati Rice 5kg', 'brand': 'Guard Rice', 'price': 1850, 'stock': 42, 'code': '896400012001'},
      {'name': 'Dal Chana Premium 1kg', 'brand': 'National Foods', 'price': 340, 'stock': 18, 'code': '896400012002'},
      {'name': 'Cooking Oil 5L Can', 'brand': 'Dalda', 'price': 2750, 'stock': 28, 'code': '896400012003'},
      {'name': 'Danedar Tea 900g', 'brand': 'Tapal', 'price': 1550, 'stock': 22, 'code': '896400012004'},
      {'name': 'Wheat Flour (Atta) 10kg', 'brand': 'Sunridge', 'price': 1420, 'stock': 35, 'code': '896400012005'},
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventory Catalog'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, i) {
          final item = items[i];
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1E293B)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['name'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text('${item['brand']} · Barcode: ${item['code']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      const SizedBox(height: 4),
                      Text('Stock: ${item['stock']} in warehouse', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ],
                  ),
                ),
                Text(
                  'PKR ${item['price']}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF34D399)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
