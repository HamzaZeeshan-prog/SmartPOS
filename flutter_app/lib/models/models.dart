double _toDouble(dynamic value, [double fallback = 0.0]) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

int _toInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value) ?? fallback;
  return fallback;
}

bool _toBool(dynamic value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true';
  return fallback;
}

String _normEnumKey(dynamic value) {
  return value.toString().replaceAll('_', '').trim().toLowerCase();
}

enum UserRole {
  superAdmin,
  owner,
  manager,
  cashier,
}

enum SubscriptionStatus {
  pendingApproval,
  active,
  expired,
  rejected,
  blocked,
}

enum PrinterWidth {
  mm58,
  mm80,
}

enum ProductUnit {
  piece,
  packet,
  box,
  kg,
  gram,
  litre,
}

enum PaymentMethod {
  cash,
  jazzcash,
  easypaisa,
  bankQr,
  card,
  customerCredit,
  split,
}

enum PaymentStatus {
  paid,
  pending,
  partiallyPaid,
  refunded,
  failed,
}

enum ExpenseCategory {
  Rent,
  Utilities,
  Electricity,
  Internet,
  Transport,
  Salaries,
  Supplies,
  Maintenance,
  Marketing,
  Miscellaneous,
}

class SubscriptionRequest {
  final String id;
  final String shopId;
  final String shopName;
  final String ownerName;
  final String ownerEmail;
  final String ownerPhone;
  final String planId;
  final String planName;
  final double amount;
  final String currency;
  final String paymentMethod;
  final String paymentReference;
  String status; // 'pending' | 'approved' | 'rejected'
  final String requestedAt;
  String? reviewedAt;
  String? adminNote;

  SubscriptionRequest({
    required this.id,
    required this.shopId,
    required this.shopName,
    required this.ownerName,
    required this.ownerEmail,
    required this.ownerPhone,
    required this.planId,
    required this.planName,
    required this.amount,
    this.currency = 'PKR',
    required this.paymentMethod,
    required this.paymentReference,
    this.status = 'pending',
    required this.requestedAt,
    this.reviewedAt,
    this.adminNote,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'shopName': shopName,
    'ownerName': ownerName,
    'ownerEmail': ownerEmail,
    'ownerPhone': ownerPhone,
    'planId': planId,
    'planName': planName,
    'amount': amount,
    'currency': currency,
    'paymentMethod': paymentMethod,
    'paymentReference': paymentReference,
    'status': status,
    'requestedAt': requestedAt,
    if (reviewedAt != null) 'reviewedAt': reviewedAt,
    if (adminNote != null) 'adminNote': adminNote,
  };

  factory SubscriptionRequest.fromJson(Map<String, dynamic> json) => SubscriptionRequest(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    shopName: json['shopName']?.toString() ?? '',
    ownerName: json['ownerName']?.toString() ?? '',
    ownerEmail: json['ownerEmail']?.toString() ?? '',
    ownerPhone: json['ownerPhone']?.toString() ?? '',
    planId: json['planId']?.toString() ?? 'starter_monthly',
    planName: json['planName']?.toString() ?? 'Starter Monthly',
    amount: _toDouble(json['amount']),
    currency: json['currency']?.toString() ?? 'PKR',
    paymentMethod: json['paymentMethod']?.toString() ?? 'JazzCash',
    paymentReference: json['paymentReference']?.toString() ?? '',
    status: json['status']?.toString() ?? 'pending',
    requestedAt: json['requestedAt']?.toString() ?? '',
    reviewedAt: json['reviewedAt']?.toString(),
    adminNote: json['adminNote']?.toString(),
  );
}

class User {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String phone;
  final String? password;
  final String? shopId;
  final List<String>? businessIds;
  final String? subscriptionPlan;
  final String? createdAt;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone = '',
    this.password,
    this.shopId,
    this.businessIds,
    this.subscriptionPlan,
    this.createdAt,
  });

  String get canonicalRole {
    return role == UserRole.superAdmin ? 'super_admin' : role.name;
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'role': canonicalRole,
    'phone': phone,
    if (password != null) 'password': password,
    if (shopId != null) 'shopId': shopId,
    if (businessIds != null) 'businessIds': businessIds,
    if (subscriptionPlan != null) 'subscriptionPlan': subscriptionPlan,
    if (createdAt != null) 'createdAt': createdAt,
  };

  factory User.fromJson(Map<String, dynamic> json) {
    final roleKey = _normEnumKey(json['role'] ?? 'cashier');
    return User(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: UserRole.values.firstWhere(
        (r) => _normEnumKey(r.name) == roleKey,
        orElse: () => UserRole.cashier,
      ),
      phone: json['phone']?.toString() ?? '',
      password: json['password']?.toString(),
      shopId: json['shopId']?.toString(),
      businessIds: (json['businessIds'] as List<dynamic>?)?.map((e) => e.toString()).toList(),
      subscriptionPlan: json['subscriptionPlan']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class Shop {
  final String id;
  final String name;
  final String ownerName;
  final String? ownerId;
  final String? ownerEmail;
  final String phone;
  final String category;
  final String address;
  final String city;
  final String currency;
  final bool taxEnabled;
  final double defaultTaxRate;
  final bool discountEnabled;
  final double defaultDiscountRate;
  final String receiptMessage;
  final bool allowNegativeStock;
  final PrinterWidth thermalPrinterWidth;
  final SubscriptionStatus subscriptionStatus;
  final String? subscriptionPlanId;
  final String? subscriptionPlanName;
  final double? subscriptionFee;
  final String? subscriptionPaymentMethod;
  final String? subscriptionPaymentRef;
  final String? subscriptionStartedAt;
  final String? subscriptionExpiresAt;
  final String? subscriptionRejectionReason;
  final String? createdAt;

  const Shop({
    required this.id,
    required this.name,
    required this.ownerName,
    this.ownerId,
    this.ownerEmail,
    required this.phone,
    required this.category,
    required this.address,
    required this.city,
    this.currency = 'PKR',
    this.taxEnabled = true,
    this.defaultTaxRate = 5,
    this.discountEnabled = false,
    this.defaultDiscountRate = 0,
    this.receiptMessage = 'Thank you for your visit!',
    this.allowNegativeStock = false,
    this.thermalPrinterWidth = PrinterWidth.mm80,
    this.subscriptionStatus = SubscriptionStatus.active,
    this.subscriptionPlanId,
    this.subscriptionPlanName,
    this.subscriptionFee,
    this.subscriptionPaymentMethod,
    this.subscriptionPaymentRef,
    this.subscriptionStartedAt,
    this.subscriptionExpiresAt,
    this.subscriptionRejectionReason,
    this.createdAt,
  });

  Shop copyWith({
    String? id,
    String? name,
    String? ownerName,
    String? ownerId,
    String? ownerEmail,
    String? phone,
    String? category,
    String? address,
    String? city,
    String? currency,
    bool? taxEnabled,
    double? defaultTaxRate,
    bool? discountEnabled,
    double? defaultDiscountRate,
    String? receiptMessage,
    bool? allowNegativeStock,
    PrinterWidth? thermalPrinterWidth,
    SubscriptionStatus? subscriptionStatus,
    String? subscriptionPlanId,
    String? subscriptionPlanName,
    double? subscriptionFee,
    String? subscriptionPaymentMethod,
    String? subscriptionPaymentRef,
    String? subscriptionStartedAt,
    String? subscriptionExpiresAt,
    String? subscriptionRejectionReason,
    String? createdAt,
  }) {
    return Shop(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerName: ownerName ?? this.ownerName,
      ownerId: ownerId ?? this.ownerId,
      ownerEmail: ownerEmail ?? this.ownerEmail,
      phone: phone ?? this.phone,
      category: category ?? this.category,
      address: address ?? this.address,
      city: city ?? this.city,
      currency: currency ?? this.currency,
      taxEnabled: taxEnabled ?? this.taxEnabled,
      defaultTaxRate: defaultTaxRate ?? this.defaultTaxRate,
      discountEnabled: discountEnabled ?? this.discountEnabled,
      defaultDiscountRate: defaultDiscountRate ?? this.defaultDiscountRate,
      receiptMessage: receiptMessage ?? this.receiptMessage,
      allowNegativeStock: allowNegativeStock ?? this.allowNegativeStock,
      thermalPrinterWidth: thermalPrinterWidth ?? this.thermalPrinterWidth,
      subscriptionStatus: subscriptionStatus ?? this.subscriptionStatus,
      subscriptionPlanId: subscriptionPlanId ?? this.subscriptionPlanId,
      subscriptionPlanName: subscriptionPlanName ?? this.subscriptionPlanName,
      subscriptionFee: subscriptionFee ?? this.subscriptionFee,
      subscriptionPaymentMethod: subscriptionPaymentMethod ?? this.subscriptionPaymentMethod,
      subscriptionPaymentRef: subscriptionPaymentRef ?? this.subscriptionPaymentRef,
      subscriptionStartedAt: subscriptionStartedAt ?? this.subscriptionStartedAt,
      subscriptionExpiresAt: subscriptionExpiresAt ?? this.subscriptionExpiresAt,
      subscriptionRejectionReason: subscriptionRejectionReason,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  String get canonicalSubscriptionStatus {
    return subscriptionStatus == SubscriptionStatus.pendingApproval
        ? 'pending_approval'
        : subscriptionStatus.name;
  }

  String get canonicalPrinterWidth {
    return thermalPrinterWidth == PrinterWidth.mm58 ? '58mm' : '80mm';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'ownerName': ownerName,
    if (ownerId != null) 'ownerId': ownerId,
    if (ownerEmail != null) 'ownerEmail': ownerEmail,
    'phone': phone,
    'category': category,
    'address': address,
    'city': city,
    'currency': currency,
    'taxEnabled': taxEnabled,
    'defaultTaxRate': defaultTaxRate,
    'discountEnabled': discountEnabled,
    'defaultDiscountRate': defaultDiscountRate,
    'receiptMessage': receiptMessage,
    'allowNegativeStock': allowNegativeStock,
    'thermalPrinterWidth': canonicalPrinterWidth,
    'subscriptionStatus': canonicalSubscriptionStatus,
    if (subscriptionPlanId != null) 'subscriptionPlanId': subscriptionPlanId,
    if (subscriptionPlanName != null) 'subscriptionPlanName': subscriptionPlanName,
    if (subscriptionFee != null) 'subscriptionFee': subscriptionFee,
    if (subscriptionPaymentMethod != null) 'subscriptionPaymentMethod': subscriptionPaymentMethod,
    if (subscriptionPaymentRef != null) 'subscriptionPaymentRef': subscriptionPaymentRef,
    if (subscriptionStartedAt != null) 'subscriptionStartedAt': subscriptionStartedAt,
    if (subscriptionStartedAt != null) 'subscriptionStartDate': subscriptionStartedAt,
    if (subscriptionExpiresAt != null) 'subscriptionExpiresAt': subscriptionExpiresAt,
    if (subscriptionRejectionReason != null) 'subscriptionRejectionReason': subscriptionRejectionReason,
    if (createdAt != null) 'createdAt': createdAt,
  };

  factory Shop.fromJson(Map<String, dynamic> json) {
    final widthStr = json['thermalPrinterWidth']?.toString() ?? '80mm';
    final subKey = _normEnumKey(json['subscriptionStatus'] ?? 'active');
    return Shop(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      ownerName: json['ownerName']?.toString() ?? '',
      ownerId: json['ownerId']?.toString(),
      ownerEmail: json['ownerEmail']?.toString(),
      phone: json['phone']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General Store',
      address: json['address']?.toString() ?? '',
      city: json['city']?.toString() ?? 'Mianwali',
      currency: json['currency']?.toString() ?? 'PKR',
      taxEnabled: _toBool(json['taxEnabled'], true),
      defaultTaxRate: _toDouble(json['defaultTaxRate'], 5),
      discountEnabled: _toBool(json['discountEnabled'], false),
      defaultDiscountRate: _toDouble(json['defaultDiscountRate'], 0),
      receiptMessage: json['receiptMessage']?.toString() ?? 'Thank you for your visit!',
      allowNegativeStock: _toBool(json['allowNegativeStock'], false),
      thermalPrinterWidth: (widthStr == '58mm' || widthStr == 'mm58') ? PrinterWidth.mm58 : PrinterWidth.mm80,
      subscriptionStatus: SubscriptionStatus.values.firstWhere(
        (s) => _normEnumKey(s.name) == subKey,
        orElse: () => SubscriptionStatus.active,
      ),
      subscriptionPlanId: json['subscriptionPlanId']?.toString(),
      subscriptionPlanName: json['subscriptionPlanName']?.toString(),
      subscriptionFee: json['subscriptionFee'] != null ? _toDouble(json['subscriptionFee']) : null,
      subscriptionPaymentMethod: json['subscriptionPaymentMethod']?.toString(),
      subscriptionPaymentRef: json['subscriptionPaymentRef']?.toString(),
      subscriptionStartedAt: (json['subscriptionStartDate'] ?? json['subscriptionStartedAt'])?.toString(),
      subscriptionExpiresAt: json['subscriptionExpiresAt']?.toString(),
      subscriptionRejectionReason: json['subscriptionRejectionReason']?.toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }
}

class SupplierPaymentRecord {
  final String id;
  final String supplierId;
  final String shopId;
  final String date;
  final double amount;
  final String method;
  final String? note;

  const SupplierPaymentRecord({
    required this.id,
    required this.supplierId,
    required this.shopId,
    required this.date,
    required this.amount,
    required this.method,
    this.note,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'supplierId': supplierId,
    'shopId': shopId,
    'date': date,
    'amount': amount,
    'method': method,
    'note': note,
  };

  factory SupplierPaymentRecord.fromJson(Map<String, dynamic> json) => SupplierPaymentRecord(
    id: json['id']?.toString() ?? '',
    supplierId: json['supplierId']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    date: json['date']?.toString() ?? '',
    amount: _toDouble(json['amount']),
    method: json['method']?.toString() ?? 'Cash',
    note: json['note']?.toString(),
  );
}

class Supplier {
  final String id;
  final String shopId;
  final String name;
  final String phone;
  final String email;
  final String address;
  double payableBalance;
  final String notes;
  List<SupplierPaymentRecord>? payments;

  Supplier({
    required this.id,
    required this.shopId,
    required this.name,
    required this.phone,
    this.email = '',
    this.address = '',
    this.payableBalance = 0,
    this.notes = '',
    this.payments,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'name': name,
    'phone': phone,
    'email': email,
    'address': address,
    'payableBalance': payableBalance,
    'notes': notes,
    'payments': payments?.map((p) => p.toJson()).toList() ?? [],
  };

  factory Supplier.fromJson(Map<String, dynamic> json) => Supplier(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    phone: json['phone']?.toString() ?? '',
    email: json['email']?.toString() ?? '',
    address: json['address']?.toString() ?? '',
    payableBalance: _toDouble(json['payableBalance']),
    notes: json['notes']?.toString() ?? '',
    payments: (json['payments'] as List<dynamic>?)
        ?.whereType<Map>()
        .map((p) => SupplierPaymentRecord.fromJson(Map<String, dynamic>.from(p)))
        .toList(),
  );
}

class CustomerLedgerEntry {
  final String id;
  final String customerId;
  final String shopId;
  final String date;
  final String type; // 'debit' | 'credit'
  final double amount;
  final double balanceAfter;
  final String paymentMethod;
  final String? note;

  const CustomerLedgerEntry({
    required this.id,
    required this.customerId,
    required this.shopId,
    required this.date,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    required this.paymentMethod,
    this.note,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'customerId': customerId,
    'shopId': shopId,
    'date': date,
    'type': type,
    'amount': amount,
    'balanceAfter': balanceAfter,
    'paymentMethod': paymentMethod,
    'note': note,
  };

  factory CustomerLedgerEntry.fromJson(Map<String, dynamic> json) => CustomerLedgerEntry(
    id: json['id']?.toString() ?? '',
    customerId: json['customerId']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    date: json['date']?.toString() ?? '',
    type: json['type']?.toString() ?? 'debit',
    amount: _toDouble(json['amount']),
    balanceAfter: _toDouble(json['balanceAfter']),
    paymentMethod: json['paymentMethod']?.toString() ?? 'Cash',
    note: json['note']?.toString(),
  );
}

class Customer {
  final String id;
  final String shopId;
  final String name;
  final String phone;
  final String email;
  final String address;
  int loyaltyPoints;
  double dueBalance;
  double totalPurchases;
  final String notes;
  List<CustomerLedgerEntry>? ledger;

  Customer({
    required this.id,
    required this.shopId,
    required this.name,
    required this.phone,
    this.email = '',
    this.address = '',
    this.loyaltyPoints = 0,
    this.dueBalance = 0,
    this.totalPurchases = 0,
    this.notes = '',
    this.ledger,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'name': name,
    'phone': phone,
    'email': email,
    'address': address,
    'loyaltyPoints': loyaltyPoints,
    'dueBalance': dueBalance,
    'totalPurchases': totalPurchases,
    'notes': notes,
    'ledger': ledger?.map((l) => l.toJson()).toList() ?? [],
  };

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    name: json['name']?.toString() ?? '',
    phone: json['phone']?.toString() ?? '',
    email: json['email']?.toString() ?? '',
    address: json['address']?.toString() ?? '',
    loyaltyPoints: _toInt(json['loyaltyPoints']),
    dueBalance: _toDouble(json['dueBalance']),
    totalPurchases: _toDouble(json['totalPurchases']),
    notes: json['notes']?.toString() ?? '',
    ledger: (json['ledger'] as List<dynamic>?)
        ?.whereType<Map>()
        .map((l) => CustomerLedgerEntry.fromJson(Map<String, dynamic>.from(l)))
        .toList(),
  );
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
  final double costPrice;
  final double sellingPrice;
  final double taxPercentage;
  int stockQuantity;
  final int minimumStockLimit;
  final dynamic unit;
  final String? supplierId;
  final String? supplierName;
  final String? expiryDate;
  final String? createdAt;
  final String? updatedAt;

  Product({
    required this.id,
    required this.shopId,
    required this.barcode,
    this.qrCode,
    required this.name,
    required this.category,
    this.brand = '',
    this.description = '',
    required this.costPrice,
    required this.sellingPrice,
    this.taxPercentage = 0,
    required this.stockQuantity,
    this.minimumStockLimit = 5,
    this.unit = ProductUnit.piece,
    this.supplierId,
    this.supplierName,
    this.expiryDate,
    this.createdAt,
    this.updatedAt,
  });

  bool get isLowStock => stockQuantity <= minimumStockLimit;

  DateTime? get parsedExpiryDate {
    if (expiryDate == null || expiryDate!.trim().isEmpty) return null;
    try {
      return DateTime.parse(expiryDate!.trim());
    } catch (_) {
      return null;
    }
  }

  int? get daysUntilExpiry {
    final dt = parsedExpiryDate;
    if (dt == null) return null;
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final expDay = DateTime(dt.year, dt.month, dt.day);
    return expDay.difference(today).inDays;
  }

  bool get isExpired {
    final days = daysUntilExpiry;
    return days != null && days < 0;
  }

  bool get isNearExpiry {
    final days = daysUntilExpiry;
    return days != null && days >= 0 && days <= 30;
  }

  bool get hasExpiryAlert => isExpired || isNearExpiry;

  String get unitName {
    if (unit is ProductUnit) {
      return (unit as ProductUnit).name;
    }
    return unit?.toString() ?? 'piece';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'barcode': barcode,
    'qrCode': qrCode,
    'name': name,
    'category': category,
    'brand': brand,
    'description': description,
    'costPrice': costPrice,
    'sellingPrice': sellingPrice,
    'taxPercentage': taxPercentage,
    'stockQuantity': stockQuantity,
    'minimumStockLimit': minimumStockLimit,
    'unit': unitName,
    'supplierId': supplierId,
    'supplierName': supplierName,
    'expiryDate': expiryDate,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };

  factory Product.fromJson(Map<String, dynamic> json) {
    final unitKey = _normEnumKey(json['unit'] ?? 'piece');
    final matchedUnit = ProductUnit.values.firstWhere(
      (u) => _normEnumKey(u.name) == unitKey,
      orElse: () => ProductUnit.piece,
    );
    return Product(
      id: json['id']?.toString() ?? '',
      shopId: json['shopId']?.toString() ?? '',
      barcode: json['barcode']?.toString() ?? '',
      qrCode: json['qrCode']?.toString(),
      name: json['name']?.toString() ?? '',
      category: json['category']?.toString() ?? 'General',
      brand: json['brand']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      costPrice: _toDouble(json['costPrice']),
      sellingPrice: _toDouble(json['sellingPrice']),
      taxPercentage: _toDouble(json['taxPercentage']),
      stockQuantity: _toInt(json['stockQuantity']),
      minimumStockLimit: _toInt(json['minimumStockLimit'], 5),
      unit: matchedUnit,
      supplierId: json['supplierId']?.toString(),
      supplierName: json['supplierName']?.toString(),
      expiryDate: json['expiryDate']?.toString(),
      createdAt: json['createdAt']?.toString(),
      updatedAt: json['updatedAt']?.toString(),
    );
  }

  Product copyWith({
    String? id,
    String? shopId,
    String? barcode,
    String? qrCode,
    String? name,
    String? category,
    String? brand,
    String? description,
    double? costPrice,
    double? sellingPrice,
    double? taxPercentage,
    int? stockQuantity,
    int? minimumStockLimit,
    dynamic unit,
    String? supplierId,
    String? supplierName,
    String? expiryDate,
    String? createdAt,
    String? updatedAt,
  }) {
    return Product(
      id: id ?? this.id,
      shopId: shopId ?? this.shopId,
      barcode: barcode ?? this.barcode,
      qrCode: qrCode ?? this.qrCode,
      name: name ?? this.name,
      category: category ?? this.category,
      brand: brand ?? this.brand,
      description: description ?? this.description,
      costPrice: costPrice ?? this.costPrice,
      sellingPrice: sellingPrice ?? this.sellingPrice,
      taxPercentage: taxPercentage ?? this.taxPercentage,
      stockQuantity: stockQuantity ?? this.stockQuantity,
      minimumStockLimit: minimumStockLimit ?? this.minimumStockLimit,
      unit: unit ?? this.unit,
      supplierId: supplierId ?? this.supplierId,
      supplierName: supplierName ?? this.supplierName,
      expiryDate: expiryDate ?? this.expiryDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class CartItem {
  final String id;
  final Product product;
  final int quantity;
  final double unitPrice;
  final double itemDiscount;
  final double itemTaxRate;
  final String? note;

  const CartItem({
    required this.id,
    required this.product,
    required this.quantity,
    required this.unitPrice,
    this.itemDiscount = 0,
    this.itemTaxRate = 0,
    this.note,
  });

  double get lineTotal => (unitPrice * quantity) - itemDiscount;

  CartItem copyWith({
    String? id,
    Product? product,
    int? quantity,
    double? unitPrice,
    double? itemDiscount,
    double? itemTaxRate,
    String? note,
  }) {
    return CartItem(
      id: id ?? this.id,
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      itemDiscount: itemDiscount ?? this.itemDiscount,
      itemTaxRate: itemTaxRate ?? this.itemTaxRate,
      note: note ?? this.note,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'productId': product.id,
    'productName': product.name,
    'product': product.toJson(),
    'quantity': quantity,
    'unitPrice': unitPrice,
    'itemDiscount': itemDiscount,
    'itemTaxRate': itemTaxRate,
    if (note != null) 'note': note,
    'lineTotal': lineTotal,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) {
    final unitPrice = _toDouble(json['unitPrice']);
    final prodMap = json['product'];
    final product = prodMap is Map
        ? Product.fromJson(Map<String, dynamic>.from(prodMap))
        : Product(
            id: json['productId']?.toString() ?? '',
            shopId: '',
            barcode: '',
            name: json['productName']?.toString() ?? 'Item',
            category: 'General',
            costPrice: unitPrice * 0.75,
            sellingPrice: unitPrice,
            stockQuantity: 0,
          );
    return CartItem(
      id: json['id']?.toString() ?? '',
      product: product,
      quantity: _toInt(json['quantity'], 1),
      unitPrice: unitPrice,
      itemDiscount: _toDouble(json['itemDiscount']),
      itemTaxRate: _toDouble(json['itemTaxRate']),
      note: json['note']?.toString(),
    );
  }
}

class HeldSale {
  final String id;
  final String shopId;
  final String? customerId;
  final String? customerName;
  final List<CartItem> items;
  final String timeLabel;

  const HeldSale({
    required this.id,
    required this.shopId,
    this.customerId,
    this.customerName,
    required this.items,
    required this.timeLabel,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'customerId': customerId,
    'customerName': customerName,
    'items': items.map((i) => i.toJson()).toList(),
    'timeLabel': timeLabel,
  };

  factory HeldSale.fromJson(Map<String, dynamic> json) => HeldSale(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    customerId: json['customerId']?.toString(),
    customerName: json['customerName']?.toString(),
    items: (json['items'] as List<dynamic>?)
            ?.whereType<Map>()
            .map((i) => CartItem.fromJson(Map<String, dynamic>.from(i)))
            .toList() ??
        [],
    timeLabel: json['timeLabel']?.toString() ?? '',
  );
}

class SyncQueueItem {
  final String id;
  final String shopId;
  final String entityType;
  final String entityId;
  final String action;
  final String payloadSummary;
  final String createdAt;
  String status;

  SyncQueueItem({
    required this.id,
    required this.shopId,
    required this.entityType,
    required this.entityId,
    required this.action,
    required this.payloadSummary,
    required this.createdAt,
    this.status = 'synced',
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'entityType': entityType,
    'entityId': entityId,
    'action': action,
    'payloadSummary': payloadSummary,
    'createdAt': createdAt,
    'status': status,
  };

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) => SyncQueueItem(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    entityType: json['entityType']?.toString() ?? 'sale',
    entityId: json['entityId']?.toString() ?? '',
    action: json['action']?.toString() ?? 'insert',
    payloadSummary: json['payloadSummary']?.toString() ?? '',
    createdAt: json['createdAt']?.toString() ?? '',
    status: json['status']?.toString() ?? 'synced',
  );
}

class PaymentRecord {
  final String id;
  final PaymentMethod method;
  final double amount;
  final PaymentStatus status;
  final double? cashReceived;
  final double? changeReturned;
  final String? provider;
  final String? referenceNumber;
  final String? timestamp;

  const PaymentRecord({
    required this.id,
    required this.method,
    required this.amount,
    this.status = PaymentStatus.paid,
    this.cashReceived,
    this.changeReturned,
    this.provider,
    this.referenceNumber,
    this.timestamp,
  });

  String get canonicalMethod {
    switch (method) {
      case PaymentMethod.bankQr:
        return 'bank_qr';
      case PaymentMethod.customerCredit:
        return 'customer_credit';
      default:
        return method.name;
    }
  }

  String get canonicalStatus {
    return status == PaymentStatus.partiallyPaid ? 'partially_paid' : status.name;
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'method': canonicalMethod,
    'amount': amount,
    'status': canonicalStatus,
    if (cashReceived != null) 'cashReceived': cashReceived,
    if (changeReturned != null) 'changeReturned': changeReturned,
    if (provider != null) 'provider': provider,
    if (referenceNumber != null) 'referenceNumber': referenceNumber,
    if (timestamp != null) 'timestamp': timestamp,
  };

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    final methodKey = _normEnumKey(json['method'] ?? 'cash');
    final statusKey = _normEnumKey(json['status'] ?? 'paid');
    return PaymentRecord(
      id: json['id']?.toString() ?? '',
      method: PaymentMethod.values.firstWhere(
        (m) => _normEnumKey(m.name) == methodKey,
        orElse: () => PaymentMethod.cash,
      ),
      amount: _toDouble(json['amount']),
      status: PaymentStatus.values.firstWhere(
        (s) => _normEnumKey(s.name) == statusKey,
        orElse: () => PaymentStatus.paid,
      ),
      cashReceived: json['cashReceived'] != null ? _toDouble(json['cashReceived']) : null,
      changeReturned: json['changeReturned'] != null ? _toDouble(json['changeReturned']) : null,
      provider: json['provider']?.toString(),
      referenceNumber: json['referenceNumber']?.toString(),
      timestamp: json['timestamp']?.toString(),
    );
  }
}

class RefundItem {
  final String productId;
  final String productName;
  final int quantityRefunded;
  final double unitPrice;
  final double subtotal;

  const RefundItem({
    required this.productId,
    required this.productName,
    required this.quantityRefunded,
    required this.unitPrice,
    required this.subtotal,
  });

  Map<String, dynamic> toJson() => {
    'productId': productId,
    'productName': productName,
    'quantityRefunded': quantityRefunded,
    'unitPrice': unitPrice,
    'subtotal': subtotal,
  };

  factory RefundItem.fromJson(Map<String, dynamic> json) => RefundItem(
    productId: json['productId']?.toString() ?? '',
    productName: json['productName']?.toString() ?? '',
    quantityRefunded: _toInt(json['quantityRefunded'], 1),
    unitPrice: _toDouble(json['unitPrice']),
    subtotal: _toDouble(json['subtotal']),
  );
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

  const RefundRecord({
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

  Map<String, dynamic> toJson() => {
    'id': id,
    'saleId': saleId,
    'invoiceNumber': invoiceNumber,
    'shopId': shopId,
    'refundedAt': refundedAt,
    'refundedBy': refundedBy,
    'refundAmount': refundAmount,
    'items': items.map((i) => i.toJson()).toList(),
    'reason': reason,
    'restockedToInventory': restockedToInventory,
  };

  factory RefundRecord.fromJson(Map<String, dynamic> json) => RefundRecord(
    id: json['id']?.toString() ?? '',
    saleId: json['saleId']?.toString() ?? '',
    invoiceNumber: json['invoiceNumber']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    refundedAt: json['refundedAt']?.toString() ?? '',
    refundedBy: json['refundedBy']?.toString() ?? '',
    refundAmount: _toDouble(json['refundAmount']),
    items: (json['items'] as List<dynamic>?)
            ?.whereType<Map>()
            .map((i) => RefundItem.fromJson(Map<String, dynamic>.from(i)))
            .toList() ??
        [],
    reason: json['reason']?.toString() ?? '',
    restockedToInventory: _toBool(json['restockedToInventory'], false),
  );
}

class StockAdjustmentRecord {
  final String id;
  final String shopId;
  final String productId;
  final String productName;
  final int previousQuantity;
  final int changeQuantity;
  final int newQuantity;
  final String type; // 'damage' | 'loss' | 'restock' | 'correction' | 'return'
  final String reason;
  final String performedBy;
  final String createdAt;

  const StockAdjustmentRecord({
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

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'productId': productId,
    'productName': productName,
    'previousQuantity': previousQuantity,
    'changeQuantity': changeQuantity,
    'newQuantity': newQuantity,
    'type': type,
    'reason': reason,
    'performedBy': performedBy,
    'createdAt': createdAt,
  };

  factory StockAdjustmentRecord.fromJson(Map<String, dynamic> json) => StockAdjustmentRecord(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    productId: json['productId']?.toString() ?? '',
    productName: json['productName']?.toString() ?? '',
    previousQuantity: _toInt(json['previousQuantity']),
    changeQuantity: _toInt(json['changeQuantity']),
    newQuantity: _toInt(json['newQuantity']),
    type: json['type']?.toString() ?? 'correction',
    reason: json['reason']?.toString() ?? '',
    performedBy: json['performedBy']?.toString() ?? '',
    createdAt: json['createdAt']?.toString() ?? '',
  );
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
    this.deliveryCharge = 0,
    required this.grandTotal,
    required this.payments,
    this.paymentStatus = PaymentStatus.paid,
    required this.createdAt,
    this.isRefunded = false,
    this.isPartiallyRefunded = false,
    this.refundAmount = 0,
    this.refundDetails,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'invoiceNumber': invoiceNumber,
    'shopId': shopId,
    'cashierId': cashierId,
    'cashierName': cashierName,
    'customerId': customerId,
    'customerName': customerName,
    'items': items.map((i) => i.toJson()).toList(),
    'subtotal': subtotal,
    'discountTotal': discountTotal,
    'taxTotal': taxTotal,
    'deliveryCharge': deliveryCharge,
    'grandTotal': grandTotal,
    'payments': payments.map((p) => p.toJson()).toList(),
    'paymentStatus': paymentStatus.name,
    'createdAt': createdAt,
    'isRefunded': isRefunded,
    'isPartiallyRefunded': isPartiallyRefunded,
    'refundAmount': refundAmount,
    'refundDetails': refundDetails?.toJson(),
  };

  factory Sale.fromJson(Map<String, dynamic> json) {
    final statusKey = _normEnumKey(json['paymentStatus'] ?? 'paid');
    return Sale(
      id: json['id']?.toString() ?? '',
      invoiceNumber: json['invoiceNumber']?.toString() ?? '',
      shopId: json['shopId']?.toString() ?? '',
      cashierId: json['cashierId']?.toString() ?? '',
      cashierName: json['cashierName']?.toString() ?? '',
      customerId: json['customerId']?.toString(),
      customerName: json['customerName']?.toString(),
      items: (json['items'] as List<dynamic>?)
              ?.whereType<Map>()
              .map((i) => CartItem.fromJson(Map<String, dynamic>.from(i)))
              .toList() ??
          [],
      subtotal: _toDouble(json['subtotal']),
      discountTotal: _toDouble(json['discountTotal']),
      taxTotal: _toDouble(json['taxTotal']),
      deliveryCharge: _toDouble(json['deliveryCharge']),
      grandTotal: _toDouble(json['grandTotal']),
      payments: (json['payments'] as List<dynamic>?)
              ?.whereType<Map>()
              .map((p) => PaymentRecord.fromJson(Map<String, dynamic>.from(p)))
              .toList() ??
          [],
      paymentStatus: PaymentStatus.values.firstWhere(
        (s) => _normEnumKey(s.name) == statusKey,
        orElse: () => PaymentStatus.paid,
      ),
      createdAt: json['createdAt']?.toString() ?? '',
      isRefunded: _toBool(json['isRefunded']),
      isPartiallyRefunded: _toBool(json['isPartiallyRefunded']),
      refundAmount: _toDouble(json['refundAmount']),
      refundDetails: json['refundDetails'] is Map
          ? RefundRecord.fromJson(Map<String, dynamic>.from(json['refundDetails']))
          : null,
    );
  }
}

class Expense {
  final String id;
  final String shopId;
  final double amount;
  final String date;
  final dynamic category;
  final String description;
  final String createdBy;

  const Expense({
    required this.id,
    required this.shopId,
    required this.amount,
    required this.date,
    required this.category,
    required this.description,
    required this.createdBy,
  });

  String get categoryName {
    if (category is ExpenseCategory) {
      return (category as ExpenseCategory).name;
    }
    return category?.toString() ?? 'Miscellaneous';
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'shopId': shopId,
    'amount': amount,
    'date': date,
    'category': categoryName,
    'description': description,
    'createdBy': createdBy,
  };

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
    id: json['id']?.toString() ?? '',
    shopId: json['shopId']?.toString() ?? '',
    amount: _toDouble(json['amount']),
    date: json['date']?.toString() ?? '',
    category: json['category']?.toString() ?? 'Miscellaneous',
    description: json['description']?.toString() ?? '',
    createdBy: json['createdBy']?.toString() ?? '',
  );
}

// Backward compatibility aliases
typedef ProductModel = Product;
typedef CartItemModel = CartItem;
typedef CustomerModel = Customer;
typedef SaleModel = Sale;
typedef PaymentMethodType = PaymentMethod;
