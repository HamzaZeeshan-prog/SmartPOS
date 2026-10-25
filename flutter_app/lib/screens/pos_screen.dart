import 'package:flutter/material.dart';
import '../models/models.dart';
import 'payment_screen.dart';

class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen> {
  String _selectedCategory = 'All';
  String _searchQuery = '';
  final List<CartItemModel> _cart = [];

  final List<ProductModel> _demoProducts = const [
    ProductModel(
      id: 'prod_1',
      shopId: 'shop_1',
      barcode: '896400012001',
      name: 'Super Basmati Rice 5kg',
      category: 'Grains & Pulses',
      brand: 'Guard Rice',
      costPrice: 1550,
      sellingPrice: 1850,
      taxPercentage: 0,
      stockQuantity: 42,
      minimumStockLimit: 10,
      unit: 'bag',
    ),
    ProductModel(
      id: 'prod_2',
      shopId: 'shop_1',
      barcode: '896400012002',
      name: 'Dal Chana Premium 1kg',
      category: 'Grains & Pulses',
      brand: 'National Foods',
      costPrice: 280,
      sellingPrice: 340,
      taxPercentage: 0,
      stockQuantity: 18,
      minimumStockLimit: 15,
      unit: 'kg',
    ),
    ProductModel(
      id: 'prod_3',
      shopId: 'shop_1',
      barcode: '896400012003',
      name: 'Premium Cooking Oil 5L Can',
      category: 'Cooking & Oils',
      brand: 'Dalda',
      costPrice: 2450,
      sellingPrice: 2750,
      taxPercentage: 5,
      stockQuantity: 28,
      minimumStockLimit: 8,
      unit: 'can',
    ),
    ProductModel(
      id: 'prod_4',
      shopId: 'shop_1',
      barcode: '896400012004',
      name: 'Danedar Tea 900g Pouch',
      category: 'Beverages & Dairy',
      brand: 'Tapal',
      costPrice: 1350,
      sellingPrice: 1550,
      taxPercentage: 0,
      stockQuantity: 22,
      minimumStockLimit: 10,
      unit: 'pack',
    ),
  ];

  double get _subtotal => _cart.fold(0, (sum, i) => sum + i.lineTotal);
  int get _cartCount => _cart.fold(0, (sum, i) => sum + i.quantity);

  void _addToCart(ProductModel product) {
    final index = _cart.indexWhere((item) => item.product.id == product.id);
    setState(() {
      if (index >= 0) {
        _cart[index] = _cart[index].copyWith(quantity: _cart[index].quantity + 1);
      } else {
        _cart.add(CartItemModel(
          id: 'item_${DateTime.now().millisecondsSinceEpoch}',
          product: product,
          quantity: 1,
          unitPrice: product.sellingPrice,
        ));
      }
    });

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added ${product.name} to cart'),
        duration: const Duration(milliseconds: 900),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showCartSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
            top: 16,
            left: 16,
            right: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  Text(
                    'Shopping Cart ($_cartCount items)',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(color: Color(0xFF1E293B)),
              ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 280),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _cart.length,
                  separatorBuilder: (_, __) => const Divider(color: Color(0xFF1E293B)),
                  itemBuilder: (_, i) {
                    final item = _cart[i];
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.product.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text('PKR ${item.unitPrice.toInt()} each', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, size: 20),
                              onPressed: () {
                                setSheetState(() {
                                  setState(() {
                                    if (item.quantity > 1) {
                                      _cart[i] = item.copyWith(quantity: item.quantity - 1);
                                    } else {
                                      _cart.removeAt(i);
                                    }
                                  });
                                });
                              },
                            ),
                            Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline, size: 20),
                              onPressed: () {
                                setSheetState(() {
                                  setState(() {
                                    _cart[i] = item.copyWith(quantity: item.quantity + 1);
                                  });
                                });
                              },
                            ),
                          ],
                        ),
                        Text(
                          'PKR ${item.lineTotal.toInt()}',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF34D399)),
                        ),
                      ],
                    );
                  },
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _cart.isEmpty
                    ? null
                    : () {
                        Navigator.pop(ctx);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => PaymentScreen(
                              grandTotal: _subtotal,
                              cart: _cart,
                            ),
                          ),
                        );
                      },
                child: Text('Checkout · PKR ${_subtotal.toInt()}'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final categories = ['All', 'Grains & Pulses', 'Cooking & Oils', 'Beverages & Dairy'];
    final filtered = _demoProducts.where((p) {
      final matchesCat = _selectedCategory == 'All' || p.category == _selectedCategory;
      final matchesQuery = p.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          p.barcode.contains(_searchQuery);
      return matchesCat && matchesQuery;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart POS Terminal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: _showCartSheet,
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Search product name or barcode...',
                prefixIcon: const Icon(Icons.search, size: 20),
                filled: true,
                fillColor: const Color(0xFF0F172A),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF1E293B)),
                ),
              ),
            ),
          ),

          // Category Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: categories.map((cat) {
                final isSelected = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(cat),
                    selected: isSelected,
                    onSelected: (_) => setState(() => _selectedCategory = cat),
                    selectedColor: const Color(0xFF2563EB),
                    backgroundColor: const Color(0xFF0F172A),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 8),

          // Products Grid
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(12),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.85,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemCount: filtered.length,
              itemBuilder: (context, i) {
                final product = filtered[i];
                return InkWell(
                  onTap: () => _addToCart(product),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
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
                            Text(product.brand, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                            if (product.isLowStock)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text('Low', style: TextStyle(color: Colors.amber, fontSize: 9, fontWeight: FontWeight.bold)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          product.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const Spacer(),
                        Text(
                          'PKR ${product.sellingPrice.toInt()}',
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF34D399),
                          ),
                        ),
                        Text(
                          'Stock: ${product.stockQuantity} ${product.unit}',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      bottomSheet: _cart.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: Color(0xFF0F172A),
                border: Border(top: BorderSide(color: Color(0xFF1E293B))),
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('$_cartCount Items · Cart', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                          Text('PKR ${_subtotal.toInt()}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF34D399))),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _showCartSheet,
                      child: const Text('View Cart & Pay'),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }
}
