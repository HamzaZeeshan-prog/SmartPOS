import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../data/demo_data.dart';
import '../services/cloud_service.dart';

class AppStore extends ChangeNotifier {
  User currentUser = DemoData.users[0];
  List<Shop> shops = DemoData.shops;
  Shop activeShop = DemoData.shops[0];
  List<Product> products = DemoData.products;
  List<Customer> customers = DemoData.customers;
  List<Supplier> suppliers = DemoData.suppliers;
  List<Expense> expenses = DemoData.expenses;
  List<Sale> salesHistory = DemoData.pastSales;

  bool cloudConnected = false;
  bool isSyncingCloud = false;
  int? lastSyncCount;

  String? toastMessage;

  void showToast(String msg) {
    toastMessage = msg;
    notifyListeners();
    Future.delayed(const Duration(seconds: 3, milliseconds: 500), () {
      toastMessage = null;
      notifyListeners();
    });
  }

  Future<void> testCloudConnection() async {
    final ok = await CloudService.testConnection();
    cloudConnected = ok;
    if (ok) {
      CloudService.syncShopToCloud(activeShop);
    }
    notifyListeners();
  }

  void setActiveShop(Shop shop) {
    activeShop = shop;
    showToast('Active Shop: ${shop.name}');
    notifyListeners();
  }

  void setCurrentUser(User user) {
    currentUser = user;
    notifyListeners();
  }

  void handleLogout() {
    currentUser = DemoData.users[2];
    showToast('Signed out. Switched to Cashier role.');
    notifyListeners();
  }

  // Product handlers
  Future<void> addNewProductFromScan(Product newProd) async {
    final product = Product(
      id: 'prod_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      barcode: newProd.barcode,
      qrCode: newProd.qrCode,
      name: newProd.name,
      category: newProd.category,
      brand: newProd.brand,
      description: newProd.description,
      costPrice: newProd.costPrice,
      sellingPrice: newProd.sellingPrice,
      taxPercentage: newProd.taxPercentage,
      stockQuantity: newProd.stockQuantity,
      minimumStockLimit: 5,
      unit: newProd.unit,
      createdAt: DateTime.now().toIso8601String(),
      updatedAt: DateTime.now().toIso8601String(),
    );
    products.insert(0, product);
    await CloudService.syncProductToCloud(activeShop.id, product);
    showToast('Saved to Local & Cloud Firestore: ${product.name}');
    notifyListeners();
  }

  Future<void> saveProductFromForm(Product saved) async {
    final idx = products.indexWhere((p) => p.id == saved.id);
    if (idx >= 0) {
      products[idx] = saved;
    } else {
      products.insert(0, saved);
    }
    await CloudService.syncProductToCloud(activeShop.id, saved);
    showToast('Product "${saved.name}" synced to Cloud Firestore!');
    notifyListeners();
  }

  void deleteProduct(String productId) {
    final target = products.firstWhere((p) => p.id == productId);
    products.removeWhere((p) => p.id == productId);
    showToast('Product "${target.name}" removed from inventory.');
    notifyListeners();
  }

  Future<void> confirmStockAdjustment(StockAdjustmentRecord adj) async {
    final idx = products.indexWhere((p) => p.id == adj.productId);
    if (idx >= 0) {
      products[idx].stockQuantity = adj.newQuantity;
    }
    await CloudService.recordCloudStockAdjustment(activeShop.id, adj);
    showToast('Stock updated: ${adj.productName} -> ${adj.newQuantity} (Synced to Cloud)');
    notifyListeners();
  }

  Future<void> syncAllToCloud() async {
    isSyncingCloud = true;
    notifyListeners();
    try {
      final count = await CloudService.syncAllProductsToCloud(activeShop.id, products);
      lastSyncCount = count;
      showToast('Successfully synced $count items to Cloud Firestore!');
    } catch (e) {
      showToast('Cloud sync failed.');
    }
    isSyncingCloud = false;
    notifyListeners();
  }

  // Sale completion
  Future<void> completeSale({
    required List<CartItem> cart,
    required double subtotal,
    required double discountTotal,
    required double taxTotal,
    required double grandTotal,
    required List<PaymentRecord> payments,
    required String invoiceNumber,
    Customer? customer,
  }) async {
    final newSale = Sale(
      id: 'sale_${DateTime.now().millisecondsSinceEpoch}',
      invoiceNumber: invoiceNumber,
      shopId: activeShop.id,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: customer?.id,
      customerName: customer?.name,
      items: cart,
      subtotal: subtotal,
      discountTotal: discountTotal,
      taxTotal: taxTotal,
      deliveryCharge: 0,
      grandTotal: grandTotal,
      payments: payments,
      paymentStatus: PaymentStatus.paid,
      createdAt: DateTime.now().toIso8601String(),
    );

    // Decrement stock
    for (final item in cart) {
      final idx = products.indexWhere((p) => p.id == item.product.id);
      if (idx >= 0) {
        products[idx].stockQuantity = (products[idx].stockQuantity - item.quantity).clamp(0, 999999);
      }
    }

    salesHistory.insert(0, newSale);
    CloudService.syncSaleToCloud(activeShop.id, newSale);
    showToast('Order $invoiceNumber completed & synced to Cloud!');
    notifyListeners();
  }

  // Shop onboarding
  Future<void> saveShop(Shop savedShop) async {
    final idx = shops.indexWhere((s) => s.id == savedShop.id);
    if (idx >= 0) {
      shops[idx] = savedShop;
    } else {
      shops.add(savedShop);
    }
    activeShop = savedShop;
    await CloudService.syncShopToCloud(savedShop);
    showToast('Store profile "${savedShop.name}" saved & synced to Cloud!');
    notifyListeners();
  }

  // Refund processing
  void confirmRefund({
    required String saleId,
    required double refundAmount,
    required List<RefundItem> itemsToRefund,
    required String reason,
    required bool restock,
  }) {
    final idx = salesHistory.indexWhere((s) => s.id == saleId);
    if (idx < 0) return;
    final sale = salesHistory[idx];
    final isFull = refundAmount >= sale.grandTotal;
    sale.isRefunded = isFull;
    sale.isPartiallyRefunded = !isFull;
    sale.refundAmount += refundAmount;
    sale.refundDetails = RefundRecord(
      id: 'ref_${DateTime.now().millisecondsSinceEpoch}',
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      shopId: activeShop.id,
      refundedAt: DateTime.now().toIso8601String(),
      refundedBy: currentUser.name,
      refundAmount: refundAmount,
      items: itemsToRefund,
      reason: reason,
      restockedToInventory: restock,
    );

    if (restock) {
      for (final ri in itemsToRefund) {
        final pidx = products.indexWhere((p) => p.id == ri.productId);
        if (pidx >= 0) {
          final updatedStock = products[pidx].stockQuantity + ri.quantityRefunded;
          if (cloudConnected) {
            CloudService.recordCloudStockAdjustment(activeShop.id, StockAdjustmentRecord(
              id: 'adj_${DateTime.now().millisecondsSinceEpoch}_${products[pidx].id}',
              shopId: activeShop.id,
              productId: products[pidx].id,
              productName: products[pidx].name,
              previousQuantity: products[pidx].stockQuantity,
              changeQuantity: ri.quantityRefunded,
              newQuantity: updatedStock,
              type: 'return',
              reason: 'Customer Refund - $reason',
              performedBy: currentUser.name,
              createdAt: DateTime.now().toIso8601String(),
            ));
          }
          products[pidx].stockQuantity = updatedStock;
        }
      }
    }

    showToast('Refund of ${activeShop.currency} ${refundAmount.round()} completed!${restock ? ' Inventory restocked.' : ''}');
    notifyListeners();
  }

  // Customer ledger repayment
  void recordCustomerPayment(String customerId, double amount, String method, [String? note]) {
    final idx = customers.indexWhere((c) => c.id == customerId);
    if (idx < 0) return;
    final c = customers[idx];
    final newDue = (c.dueBalance - amount).clamp(0.0, double.infinity);
    final newEntry = CustomerLedgerEntry(
      id: 'ent_${DateTime.now().millisecondsSinceEpoch}',
      customerId: c.id,
      shopId: activeShop.id,
      date: DateTime.now().toIso8601String(),
      type: 'credit',
      amount: amount,
      balanceAfter: newDue,
      paymentMethod: method,
      note: note ?? 'Customer balance repayment',
    );
    c.dueBalance = newDue;
    c.ledger ??= [];
    c.ledger!.insert(0, newEntry);
    showToast('Payment of ${activeShop.currency} ${amount.round()} recorded in customer ledger!');
    notifyListeners();
  }

  void addCustomer(Customer newCust) {
    final created = Customer(
      id: 'cust_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      name: newCust.name,
      phone: newCust.phone,
      email: newCust.email,
      address: newCust.address,
      loyaltyPoints: 0,
      dueBalance: 0,
      totalPurchases: 0,
      notes: newCust.notes,
    );
    customers.insert(0, created);
    showToast('Customer ${created.name} registered successfully!');
    notifyListeners();
  }

  // Supplier handlers
  void recordSupplierPayment(String supplierId, double amount, String method, [String? note]) {
    final idx = suppliers.indexWhere((s) => s.id == supplierId);
    if (idx < 0) return;
    final s = suppliers[idx];
    final newBalance = (s.payableBalance - amount).clamp(0.0, double.infinity);
    final newPayment = SupplierPaymentRecord(
      id: 'spay_${DateTime.now().millisecondsSinceEpoch}',
      supplierId: s.id,
      shopId: activeShop.id,
      date: DateTime.now().toIso8601String(),
      amount: amount,
      method: method,
      note: note,
    );
    s.payableBalance = newBalance;
    s.payments ??= [];
    s.payments!.insert(0, newPayment);
    showToast('Supplier payout of ${activeShop.currency} ${amount.round()} recorded!');
    notifyListeners();
  }

  void addSupplier(Supplier newSup) {
    final created = Supplier(
      id: 'sup_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      name: newSup.name,
      phone: newSup.phone,
      email: newSup.email,
      address: newSup.address.isNotEmpty ? newSup.address : 'Pakistan',
      payableBalance: 0,
      notes: newSup.notes,
    );
    suppliers.insert(0, created);
    showToast('Supplier ${created.name} added!');
    notifyListeners();
  }

  void addExpense(Expense newExp) {
    final created = Expense(
      id: 'exp_${DateTime.now().millisecondsSinceEpoch}',
      shopId: activeShop.id,
      amount: newExp.amount,
      date: DateTime.now().toIso8601String(),
      category: newExp.category,
      description: newExp.description,
      createdBy: currentUser.name,
    );
    expenses.insert(0, created);
    showToast('Expense of ${activeShop.currency} ${created.amount.round()} logged!');
    notifyListeners();
  }

  void toggleCloudMode() {
    cloudConnected = !cloudConnected;
    showToast(cloudConnected ? 'Cloud Online: Auto-sync active' : 'Offline Mode: Writing to Drift SQLite');
    notifyListeners();
  }

  // Computed getters
  double get grossSalesRevenue => salesHistory.fold(0.0, (sum, s) => sum + s.grandTotal);
  double get refundsTotal => salesHistory.fold(0.0, (sum, s) => sum + (s.refundAmount > 0 ? s.refundAmount : (s.isRefunded ? s.grandTotal : 0)));
  double get netRevenue => grossSalesRevenue - refundsTotal;
  int get lowStockCount => products.where((p) => p.isLowStock).length;
  double get totalReceivables => customers.fold(0.0, (sum, c) => sum + c.dueBalance);
  double get totalPayables => suppliers.fold(0.0, (sum, s) => sum + s.payableBalance);
  double get totalExpenses => expenses.fold(0.0, (sum, e) => sum + e.amount);
  double get inventoryCostValue => products.fold(0.0, (sum, p) => sum + (p.costPrice * p.stockQuantity));
  double get inventoryRetailValue => products.fold(0.0, (sum, p) => sum + (p.sellingPrice * p.stockQuantity));
  double get estimatedGrossProfit {
    double profit = 0;
    for (final sale in salesHistory) {
      if (sale.isRefunded) continue;
      for (final item in sale.items) {
        final cost = item.product.costPrice > 0 ? item.product.costPrice : item.unitPrice * 0.75;
        profit += (item.unitPrice - cost) * item.quantity - item.itemDiscount;
      }
    }
    return profit;
  }
}
