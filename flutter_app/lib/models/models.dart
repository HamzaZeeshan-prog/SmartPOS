enum UserRole { owner, manager, cashier }

class User {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String phone;
  final String? avatarUrl;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.phone,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'],
        name: json['name'],
        email: json['email'],
        role: UserRole.values.byName(json['role']),
        phone: json['phone'],
        avatarUrl: json['avatarUrl'],
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role.name,
        'phone': phone,
        'avatarUrl': avatarUrl,
      };
}

enum PrinterWidth { mm58, mm80 }

class Shop {
  final String id;
  final String name;
  final String ownerName;
  final String phone;
  final String category;
  final String address;
  final String city;
  final String currency;
  final bool taxEnabled;
  final double defaultTaxRate;
  final String receiptMessage;
  final String? logoUrl;
  final bool allowNegativeStock;
  final PrinterWidth thermalPrinterWidth;

  Shop({
    required this.id,
    required this.name,
    required this.ownerName,
    required this.phone,
    required this.category,
    required this.address,
    required this.city,
    required this.currency,
    required this.taxEnabled,
    required this.defaultTaxRate,
    required this.receiptMessage,
    this.logoUrl,
    required this.allowNegativeStock,
    required this.thermalPrinterWidth,
  });

  factory Shop.fromJson(Map<String, dynamic> json) => Shop(
        id: json['id'],
        name: json['name'],
        ownerName: json['ownerName'],
        phone: json['phone'],
        category: json['category'],
        address: json['address'],
        city: json['city'],
        currency: json['currency'] ?? 'PKR',
        taxEnabled: json['taxEnabled'] ?? true,
        defaultTaxRate: (json['defaultTaxRate'] ?? 0).toDouble(),
        receiptMessage: json['receiptMessage'] ?? '',
        logoUrl: json['logoUrl'],
        allowNegativeStock: json['allowNegativeStock'] ?? false,
        thermalPrinterWidth:
            json['thermalPrinterWidth'] == '58mm' ? PrinterWidth.mm58 : PrinterWidth.mm80,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'ownerName': ownerName,
        'phone': phone,
        'category': category,
        'address': address,
        'city': city,
        'currency': currency,
        'taxEnabled': taxEnabled,
        'defaultTaxRate': defaultTaxRate,
        'receiptMessage': receiptMessage,
        'logoUrl': logoUrl,
        'allowNegativeStock': allowNegativeStock,
        'thermalPrinterWidth': thermalPrinterWidth == PrinterWidth.mm58 ? '58mm' : '80mm',
      };
}

enum ProductUnit { piece, packet, box, kg, gram, litre }

class ProductVariant {
  final String id;
  final String productId;
  final String name;
  final String? barcode;
  final double additionalCost;
  final double additionalPrice;
  final int stock;

  ProductVariant({
    required this.id,
    required this.productId,
    required this.name,
    this.barcode,
    required this.additionalCost,
    required this.additionalPrice,
    required this.stock,
  });
}

class Product {
  final String id;
  final String shopId;
  final String barcode;
  final String? qrCode;
  final String name;
  final String category;
  final String brand;
  final String description;
  final String? image;
  final double costPrice;
  final double sellingPrice;
  final double? discountPrice;
  final double taxPercentage;
  int stockQuantity;
  final int minimumStockLimit;
  final ProductUnit unit;
  final String? supplierId;
  final String? supplierName;
  final String? expiryDate;
  final List<ProductVariant>? variants;
  final String createdAt;
  final String updatedAt;

  Product({
    required this.id,
    required this.shopId,
    required this.barcode,
    this.qrCode,
    required this.name,
    required this.category,
    required this.brand,
    required this.description,
    this.image,
    required this.costPrice,
    required this.sellingPrice,
    this.discountPrice,
    required this.taxPercentage,
    required this.stockQuantity,
    required this.minimumStockLimit,
    required this.unit,
    this.supplierId,
    this.supplierName,
    this.expiryDate,
    this.variants,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'],
        shopId: json['shopId'],
        barcode: json['barcode'],
        qrCode: json['qrCode'],
        name: json['name'],
        category: json['category'],
        brand: json['brand'],
        description: json['description'] ?? '',
        image: json['image'],
        costPrice: (json['costPrice'] ?? 0).toDouble(),
        sellingPrice: (json['sellingPrice'] ?? 0).toDouble(),
        discountPrice: json['discountPrice']?.toDouble(),
        taxPercentage: (json['taxPercentage'] ?? 0).toDouble(),
        stockQuantity: json['stockQuantity'] ?? 0,
        minimumStockLimit: json['minimumStockLimit'] ?? 5,
        unit: ProductUnit.values.byName(json['unit'] ?? 'piece'),
        supplierId: json['supplierId'],
        supplierName: json['supplierName'],
        expiryDate: json['expiryDate'],
        createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
        updatedAt: json['updatedAt'] ?? DateTime.now().toIso8601String(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'shopId': shopId,
        'barcode': barcode,
        'qrCode': qrCode,
        'name': name,
        'category': category,
        'brand': brand,
        'description': description,
        'image': image,
        'costPrice': costPrice,
        'sellingPrice': sellingPrice,
        'discountPrice': discountPrice,
        'taxPercentage': taxPercentage,
        'stockQuantity': stockQuantity,
        'minimumStockLimit': minimumStockLimit,
        'unit': unit.name,
        'supplierId': supplierId,
        'supplierName': supplierName,
        'expiryDate': expiryDate,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  bool get isLowStock => stockQuantity <= minimumStockLimit;
  double get margin => sellingPrice > 0
      ? ((sellingPrice - costPrice) / sellingPrice) * 100
      : 0;
}

class CartItem {
  final String id;
  final Product product;
  final ProductVariant? variant;
  int quantity;
  final double unitPrice;
  double itemDiscount;
  final double itemTaxRate;
  String? note;

  CartItem({
    required this.id,
    required this.product,
    this.variant,
    required this.quantity,
    required this.unitPrice,
    required this.itemDiscount,
    required this.itemTaxRate,
    this.note,
  });

  double get lineTotal => (unitPrice * quantity) - itemDiscount;
  double get taxableAmount => lineTotal;
  double get taxAmount => taxableAmount * (itemTaxRate / 100);
}

enum PaymentMethod {
  cash, jazzcash, easypaisa, bank_qr, card, customer_credit, split
}

enum PaymentStatus { pending, paid, failed, cancelled, refunded }

class PaymentRecord {
  final String id;
  final PaymentMethod method;
  final double amount;
  final PaymentStatus status;
  final String? provider;
  final String? referenceNumber;
  final String? qrPayload;
  final double? cashReceived;
  final double? changeReturned;

  PaymentRecord({
    required this.id,
    required this.method,
    required this.amount,
    required this.status,
    this.provider,
    this.referenceNumber,
    this.qrPayload,
    this.cashReceived,
    this.changeReturned,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'method': method.name,
        'amount': amount,
        'status': status.name,
        'provider': provider,
        'referenceNumber': referenceNumber,
        'qrPayload': qrPayload,
        'cashReceived': cashReceived,
        'changeReturned': changeReturned,
      };
}

class RefundItem {
  final String cartItemId;
  final String productId;
  final String productName;
  final int quantityRefunded;
  final double unitPrice;
  final double totalRefundAmount;

  RefundItem({
    required this.cartItemId,
    required this.productId,
    required this.productName,
    required this.quantityRefunded,
    required this.unitPrice,
    required this.totalRefundAmount,
  });
}

class RefundRecord {
  final String id;
  final String saleId;
  final String invoiceNumber;
  final String shopId;
  final String refundedAt;
  final String refundedBy;
  final double refundAmount;
  final List<RefundItem> items;
  final String reason;
  final bool restockedToInventory;

  RefundRecord({
    required this.id,
    required this.saleId,
    required this.invoiceNumber,
    required this.shopId,
    required this.refundedAt,
    required this.refundedBy,
    required this.refundAmount,
    required this.items,
    required this.reason,
    required this.restockedToInventory,
  });
}

class Sale {
  final String id;
  final String invoiceNumber;
  final String shopId;
  final String cashierId;
  final String cashierName;
  final String? customerId;
  final String? customerName;
  final List<CartItem> items;
  final double subtotal;
  final double discountTotal;
  final double taxTotal;
  final double deliveryCharge;
  final double grandTotal;
  final List<PaymentRecord> payments;
  final PaymentStatus paymentStatus;
  final String createdAt;
  final String? note;
  bool isRefunded;
  bool isPartiallyRefunded;
  double refundAmount;
  RefundRecord? refundDetails;

  Sale({
    required this.id,
    required this.invoiceNumber,
    required this.shopId,
    required this.cashierId,
    required this.cashierName,
    this.customerId,
    this.customerName,
    required this.items,
    required this.subtotal,
    required this.discountTotal,
    required this.taxTotal,
    required this.deliveryCharge,
    required this.grandTotal,
    required this.payments,
    required this.paymentStatus,
    required this.createdAt,
    this.note,
    this.isRefunded = false,
    this.isPartiallyRefunded = false,
    this.refundAmount = 0,
    this.refundDetails,
  });
}

class CustomerLedgerEntry {
  final String id;
  final String customerId;
  final String shopId;
  final String date;
  final String type; // 'debit' | 'credit'
  final double amount;
  final double balanceAfter;
  final String? referenceInvoice;
  final String? paymentMethod;
  final String? note;

  CustomerLedgerEntry({
    required this.id,
    required this.customerId,
    required this.shopId,
    required this.date,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    this.referenceInvoice,
    this.paymentMethod,
    this.note,
  });
}

class Customer {
  final String id;
  final String shopId;
  final String name;
  final String phone;
  final String? email;
  final String? address;
  double loyaltyPoints;
  double dueBalance;
  double totalPurchases;
  final String? notes;
  List<CustomerLedgerEntry>? ledger;

  Customer({
    required this.id,
    required this.shopId,
    required this.name,
    required this.phone,
    this.email,
    this.address,
    required this.loyaltyPoints,
    required this.dueBalance,
    required this.totalPurchases,
    this.notes,
    this.ledger,
  });
}

class SupplierPaymentRecord {
  final String id;
  final String supplierId;
  final String shopId;
  final String date;
  final double amount;
  final String method;
  final String? reference;
  final String? note;

  SupplierPaymentRecord({
    required this.id,
    required this.supplierId,
    required this.shopId,
    required this.date,
    required this.amount,
    required this.method,
    this.reference,
    this.note,
  });
}

class Supplier {
  final String id;
  final String shopId;
  final String name;
  final String phone;
  final String? email;
  final String address;
  double payableBalance;
  final String? notes;
  List<SupplierPaymentRecord>? payments;

  Supplier({
    required this.id,
    required this.shopId,
    required this.name,
    required this.phone,
    this.email,
    required this.address,
    required this.payableBalance,
    this.notes,
    this.payments,
  });
}

enum ExpenseCategory {
  Rent, Electricity, Internet, Transport, Salaries, Maintenance, Miscellaneous
}

class Expense {
  final String id;
  final String shopId;
  final double amount;
  final String date;
  final ExpenseCategory category;
  final String description;
  final String? receiptImage;
  final String createdBy;

  Expense({
    required this.id,
    required this.shopId,
    required this.amount,
    required this.date,
    required this.category,
    required this.description,
    this.receiptImage,
    required this.createdBy,
  });
}

enum SyncEntityType { sale, product, customer, expense, inventory_transaction }
enum SyncAction { insert, update, delete }
enum SyncStatus { pending, synced, failed }

class SyncQueueItem {
  final String id;
  final String shopId;
  final SyncEntityType entityType;
  final String entityId;
  final SyncAction action;
  final String payloadJson;
  final String createdAt;
  SyncStatus status;
  int retryCount;
  String? errorMessage;

  SyncQueueItem({
    required this.id,
    required this.shopId,
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.payloadJson,
    required this.createdAt,
    required this.status,
    required this.retryCount,
    this.errorMessage,
  });
}

class StockAdjustmentRecord {
  final String id;
  final String shopId;
  final String productId;
  final String productName;
  final int previousQuantity;
  final int changeQuantity;
  final int newQuantity;
  final String type;
  final String reason;
  final String performedBy;
  final String createdAt;

  StockAdjustmentRecord({
    required this.id,
    required this.shopId,
    required this.productId,
    required this.productName,
    required this.previousQuantity,
    required this.changeQuantity,
    required this.newQuantity,
    required this.type,
    required this.reason,
    required this.performedBy,
    required this.createdAt,
  });
}
