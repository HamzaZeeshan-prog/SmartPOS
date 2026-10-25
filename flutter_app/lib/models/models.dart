import 'package:flutter/foundation.dart';

enum PaymentMethodType {
  cash,
  jazzcash,
  easypaisa,
  bankQr,
  card,
  customerCredit,
}

class ProductModel {
  final String id;
  final String shopId;
  final String barcode;
  final String name;
  final String category;
  final String brand;
  final double costPrice;
  final double sellingPrice;
  final double taxPercentage;
  final int stockQuantity;
  final int minimumStockLimit;
  final String unit;

  const ProductModel({
    required this.id,
    required this.shopId,
    required this.barcode,
    required this.name,
    required this.category,
    required this.brand,
    required this.costPrice,
    required this.sellingPrice,
    required this.taxPercentage,
    required this.stockQuantity,
    required this.minimumStockLimit,
    this.unit = 'piece',
  });

  bool get isLowStock => stockQuantity <= minimumStockLimit;
}

class CartItemModel {
  final String id;
  final ProductModel product;
  final int quantity;
  final double unitPrice;
  final double itemDiscount;

  const CartItemModel({
    required this.id,
    required this.product,
    required this.quantity,
    required this.unitPrice,
    this.itemDiscount = 0,
  });

  double get lineTotal => (unitPrice * quantity) - itemDiscount;

  CartItemModel copyWith({int? quantity, double? itemDiscount}) {
    return CartItemModel(
      id: id,
      product: product,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice,
      itemDiscount: itemDiscount ?? this.itemDiscount,
    );
  }
}

class CustomerModel {
  final String id;
  final String name;
  final String phone;
  final double dueBalance;
  final int loyaltyPoints;
  final double totalPurchases;

  const CustomerModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.dueBalance,
    this.loyaltyPoints = 0,
    this.totalPurchases = 0,
  });
}

class SaleModel {
  final String id;
  final String invoiceNumber;
  final DateTime createdAt;
  final String cashierName;
  final String? customerName;
  final List<CartItemModel> items;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double grandTotal;
  final String paymentMethod;
  final bool isRefunded;

  const SaleModel({
    required this.id,
    required this.invoiceNumber,
    required this.createdAt,
    required this.cashierName,
    this.customerName,
    required this.items,
    required this.subtotal,
    required this.discountTotal,
    required this.taxTotal,
    required this.grandTotal,
    required this.paymentMethod,
    this.isRefunded = false,
  });
}
