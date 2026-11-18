import '../models/models.dart';
import 'saas_config.dart';

class DemoData {
  static List<User> get users => [
        const User(
          id: 'usr_owner_1',
          name: 'Tariq Mehmood',
          email: 'tariq@citymart.pk',
          role: UserRole.owner,
          phone: '+92 300 1234567',
          password: 'password123',
          shopId: 'shop_001',
          businessIds: ['shop_001', 'shop_002'],
          subscriptionPlan: 'Business Pro Monthly',
          createdAt: '2026-08-01T00:00:00Z',
        ),
        const User(
          id: 'usr_owner_2',
          name: 'Dr. Ayesha Noor',
          email: 'ayesha@medcare.pk',
          role: UserRole.owner,
          phone: '+92 312 9988776',
          password: 'password123',
          shopId: 'shop_003',
          businessIds: ['shop_003'],
          subscriptionPlan: 'Starter Monthly',
          createdAt: '2026-10-01T00:00:00Z',
        ),
      ];

  static List<Shop> get shops {
    final nowIso = DateTime.now().toIso8601String();
    final nextMonthIso = SaasConfig.addDaysIso(30);
    return [
      Shop(
        id: 'shop_001',
        name: 'City Mart - Main Branch',
        ownerName: 'Tariq Mehmood',
        ownerId: 'usr_owner_1',
        ownerEmail: 'tariq@citymart.pk',
        phone: '+92 51 2891234',
        category: 'Grocery & Supermarket',
        address: 'Shop 14-16, F-7 Markaz, Jinnah Super',
        city: 'Islamabad',
        currency: 'PKR',
        taxEnabled: true,
        defaultTaxRate: 5,
        receiptMessage: 'Thank you for shopping at City Mart! Exchange within 3 days with receipt.',
        allowNegativeStock: false,
        thermalPrinterWidth: PrinterWidth.mm80,
        subscriptionStatus: SubscriptionStatus.active,
        subscriptionPlanId: 'pro_monthly',
        subscriptionPlanName: 'Business Pro Monthly',
        subscriptionFee: 4900,
        subscriptionPaymentMethod: 'JazzCash',
        subscriptionPaymentRef: 'JC-881029',
        subscriptionStartedAt: nowIso,
        subscriptionExpiresAt: nextMonthIso,
        createdAt: '2026-08-01T00:00:00Z',
      ),
      Shop(
        id: 'shop_002',
        name: 'City Mart - Mianwali Branch',
        ownerName: 'Tariq Mehmood',
        ownerId: 'usr_owner_1',
        ownerEmail: 'tariq@citymart.pk',
        phone: '+92 459 231456',
        category: 'Convenience Store',
        address: 'Main PAF Road, Commercial Market',
        city: 'Mianwali',
        currency: 'PKR',
        taxEnabled: false,
        defaultTaxRate: 0,
        receiptMessage: 'Fast & Fresh in Mianwali! Visit us again soon.',
        allowNegativeStock: false,
        thermalPrinterWidth: PrinterWidth.mm58,
        subscriptionStatus: SubscriptionStatus.active,
        subscriptionPlanId: 'pro_monthly',
        subscriptionPlanName: 'Business Pro Monthly',
        subscriptionFee: 4900,
        subscriptionPaymentMethod: 'JazzCash',
        subscriptionPaymentRef: 'JC-881030',
        subscriptionStartedAt: nowIso,
        subscriptionExpiresAt: nextMonthIso,
        createdAt: '2026-09-15T00:00:00Z',
      ),
      Shop(
        id: 'shop_003',
        name: 'MedCare 24/7 Pharmacy',
        ownerName: 'Dr. Ayesha Noor',
        ownerId: 'usr_owner_2',
        ownerEmail: 'ayesha@medcare.pk',
        phone: '+92 42 35789012',
        category: 'Pharmacy & Healthcare',
        address: 'Commercial Zone, Gulberg III',
        city: 'Lahore',
        currency: 'PKR',
        taxEnabled: false,
        defaultTaxRate: 0,
        receiptMessage: 'Your Health, Our Priority. Fast prescription delivery.',
        allowNegativeStock: false,
        thermalPrinterWidth: PrinterWidth.mm80,
        subscriptionStatus: SubscriptionStatus.active,
        subscriptionPlanId: 'starter_monthly',
        subscriptionPlanName: 'Starter Monthly',
        subscriptionFee: 2500,
        subscriptionPaymentMethod: 'Easypaisa',
        subscriptionPaymentRef: 'EP-559102',
        subscriptionStartedAt: nowIso,
        subscriptionExpiresAt: nextMonthIso,
        createdAt: '2026-10-01T00:00:00Z',
      ),
    ];
  }

  static List<Supplier> get suppliers => [
        Supplier(
          id: 'sup_001',
          shopId: 'shop_001',
          name: 'National Wholesale Distributors',
          phone: '+92 301 5550192',
          email: 'orders@nationaldist.com.pk',
          address: 'I-9 Industrial Area, Islamabad',
          payableBalance: 45000,
          notes: 'Primary FMCG distributor for Nestle, Unilever, and Engro foods.',
        ),
        Supplier(
          id: 'sup_002',
          shopId: 'shop_001',
          name: 'Punjab Agro & Dairy Suppliers',
          phone: '+92 345 8881290',
          email: 'supplies@punjabagro.pk',
          address: 'G.T. Road, Rawalpindi',
          payableBalance: 18500,
          notes: 'Fresh dairy, milk cartons, and bakery goods.',
        ),
      ];

  static List<Customer> get customers => [
        Customer(
          id: 'cust_001', shopId: 'shop_001', name: 'Ali Raza', phone: '+92 300 4455667',
          email: 'ali.raza@gmail.com', address: 'House 42, St 12, F-7/2, Islamabad',
          loyaltyPoints: 340, dueBalance: 1250, totalPurchases: 48900,
          notes: 'Regular customer, prefers delivery for monthly staples.',
        ),
        Customer(
          id: 'cust_002', shopId: 'shop_001', name: 'Dr. Fatima Noor', phone: '+92 312 9988776',
          email: 'dr.fatima@hospital.org', address: 'Flat 301, Silver Oaks, F-10, Islamabad',
          loyaltyPoints: 780, dueBalance: 0, totalPurchases: 92400,
          notes: 'VIP customer, always pays via JazzCash or Bank QR.',
        ),
        Customer(
          id: 'cust_003', shopId: 'shop_001', name: 'Kamran Sheikh', phone: '+92 334 1122334',
          email: 'kamran.shk@yahoo.com', address: 'Plaza 8, Blue Area, Islamabad',
          loyaltyPoints: 120, dueBalance: 4800, totalPurchases: 27500,
          notes: 'Office supplies account, clears balance every 15th.',
        ),
      ];

  static List<Product> get products => [
    Product(id: 'prod_001', shopId: 'shop_001', barcode: '896400012001', qrCode: 'CM-BEV-001', name: 'Rooh Afza Syrup 800ml', category: 'Beverages', brand: 'Hamdard', description: 'Traditional herbal red syrup drink for refreshing sharbat.', costPrice: 410, sellingPrice: 470, taxPercentage: 5, stockQuantity: 48, minimumStockLimit: 10, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-10-20T14:30:00Z'),
    Product(id: 'prod_002', shopId: 'shop_001', barcode: '896400012002', qrCode: 'CM-BEV-002', name: 'Nestle Fruita Vitals Apple 1L', category: 'Beverages', brand: 'Nestle', description: '100% premium clear apple juice with no added preservatives.', costPrice: 280, sellingPrice: 340, taxPercentage: 5, stockQuantity: 24, minimumStockLimit: 8, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-10-22T11:00:00Z'),
    Product(id: 'prod_003', shopId: 'shop_001', barcode: '896400012003', qrCode: 'CM-BEV-003', name: 'Coca Cola 1.5 Litre PET', category: 'Beverages', brand: 'Coca Cola', description: 'Refreshing carbonated soft drink 1.5L bottle.', costPrice: 170, sellingPrice: 210, taxPercentage: 5, stockQuantity: 62, minimumStockLimit: 15, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-10-24T08:00:00Z'),
    Product(id: 'prod_004', shopId: 'shop_001', barcode: '896400012004', qrCode: 'CM-BEV-004', name: 'Tapal Danedar Tea Bag Box 100s', category: 'Beverages', brand: 'Tapal', description: 'Strong Kenyan leaf tea blend round tea bags.', costPrice: 620, sellingPrice: 720, taxPercentage: 0, stockQuantity: 30, minimumStockLimit: 5, unit: ProductUnit.box, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-01T10:00:00Z', updatedAt: '2026-10-21T09:15:00Z'),
    Product(id: 'prod_005', shopId: 'shop_001', barcode: '896400013001', qrCode: 'CM-DRY-001', name: 'Olpers Full Cream Milk 1 Litre', category: 'Dairy', brand: 'Engro Olpers', description: 'UHT processed homogenized 100% pure milk carton.', costPrice: 285, sellingPrice: 320, taxPercentage: 0, stockQuantity: 4, minimumStockLimit: 12, unit: ProductUnit.packet, supplierId: 'sup_002', supplierName: 'Punjab Agro & Dairy Suppliers', expiryDate: '2026-12-15', createdAt: '2026-09-05T08:00:00Z', updatedAt: '2026-10-23T16:00:00Z'),
    Product(id: 'prod_006', shopId: 'shop_001', barcode: '896400013002', qrCode: 'CM-DRY-002', name: 'Nurpur Pure Butter 200g', category: 'Dairy', brand: 'Nurpur', description: 'Salted creamy butter made from pure cow and buffalo cream.', costPrice: 390, sellingPrice: 460, taxPercentage: 5, stockQuantity: 18, minimumStockLimit: 6, unit: ProductUnit.piece, supplierId: 'sup_002', supplierName: 'Punjab Agro & Dairy Suppliers', expiryDate: '2026-11-20', createdAt: '2026-09-05T08:00:00Z', updatedAt: '2026-10-18T10:30:00Z'),
    Product(id: 'prod_007', shopId: 'shop_001', barcode: '896400013003', qrCode: 'CM-DRY-003', name: 'Nestle Everyday Milk Powder 850g Pouch', category: 'Dairy', brand: 'Nestle', description: 'Special tea creamer powdered dairy milk mix.', costPrice: 1150, sellingPrice: 1320, taxPercentage: 5, stockQuantity: 15, minimumStockLimit: 5, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-08T12:00:00Z', updatedAt: '2026-10-15T11:45:00Z'),
    Product(id: 'prod_008', shopId: 'shop_001', barcode: '896400014001', qrCode: 'CM-GRC-001', name: 'Guard Super Basmati Rice 5kg Bag', category: 'Grocery', brand: 'Guard', description: 'Aged long-grain aromatic kernel basmati rice.', costPrice: 1750, sellingPrice: 2050, taxPercentage: 0, stockQuantity: 28, minimumStockLimit: 8, unit: ProductUnit.box, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-02T09:00:00Z', updatedAt: '2026-10-20T17:00:00Z'),
    Product(id: 'prod_009', shopId: 'shop_001', barcode: '896400014002', qrCode: 'CM-GRC-002', name: 'Dalda Premium Cooking Oil 5L Can', category: 'Grocery', brand: 'Dalda', description: 'Triple refined cooking oil enriched with Vitamin A & D.', costPrice: 2480, sellingPrice: 2750, taxPercentage: 0, stockQuantity: 3, minimumStockLimit: 6, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-02T09:00:00Z', updatedAt: '2026-10-23T19:00:00Z'),
    Product(id: 'prod_010', shopId: 'shop_001', barcode: '896400014003', qrCode: 'CM-GRC-003', name: 'National Biryani Recipe Mix 50g Double Pack', category: 'Grocery', brand: 'National Foods', description: 'Authentic aromatic spice blend for restaurant-style Sindhi Biryani.', costPrice: 130, sellingPrice: 160, taxPercentage: 5, stockQuantity: 85, minimumStockLimit: 20, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-03T14:00:00Z', updatedAt: '2026-10-22T10:00:00Z'),
    Product(id: 'prod_011', shopId: 'shop_001', barcode: '896400014004', qrCode: 'CM-GRC-004', name: 'Sunridge Chakki Atta (Flour) 10kg', category: 'Grocery', brand: 'Sunridge', description: '100% whole wheat stone-ground chakki fresh flour with natural fiber.', costPrice: 1320, sellingPrice: 1480, taxPercentage: 0, stockQuantity: 22, minimumStockLimit: 10, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-04T11:00:00Z', updatedAt: '2026-10-21T15:20:00Z'),
    Product(id: 'prod_012', shopId: 'shop_001', barcode: '896400014005', qrCode: 'CM-GRC-005', name: 'National Himalayan Pink Salt 800g Pouch', category: 'Grocery', brand: 'National Foods', description: 'Pure gourmet mineral rock salt directly from Khewra mines.', costPrice: 85, sellingPrice: 110, taxPercentage: 5, stockQuantity: 45, minimumStockLimit: 15, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-04T11:00:00Z', updatedAt: '2026-10-19T13:40:00Z'),
    Product(id: 'prod_013', shopId: 'shop_001', barcode: '896400015001', qrCode: 'CM-SNK-001', name: 'Lays Classic Masala Chips 50g', category: 'Snacks', brand: 'Lays', description: 'Crispy golden potato chips with spicy Pakistani masala seasoning.', costPrice: 75, sellingPrice: 100, taxPercentage: 5, stockQuantity: 70, minimumStockLimit: 25, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-06T10:00:00Z', updatedAt: '2026-10-23T18:00:00Z'),
    Product(id: 'prod_014', shopId: 'shop_001', barcode: '896400015002', qrCode: 'CM-SNK-002', name: 'LU Prince Chocolate Biscuits Half Roll', category: 'Snacks', brand: 'LU', description: 'Crunchy sandwich biscuits with rich chocolate cream filling.', costPrice: 42, sellingPrice: 60, taxPercentage: 5, stockQuantity: 96, minimumStockLimit: 30, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-06T10:00:00Z', updatedAt: '2026-10-24T06:00:00Z'),
    Product(id: 'prod_015', shopId: 'shop_001', barcode: '896400015003', qrCode: 'CM-SNK-003', name: 'Cadbury Dairy Milk Silk 150g', category: 'Snacks', brand: 'Cadbury', description: 'Smooth, melt-in-the-mouth premium milk chocolate bar.', costPrice: 420, sellingPrice: 520, taxPercentage: 5, stockQuantity: 2, minimumStockLimit: 10, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-07T12:00:00Z', updatedAt: '2026-10-23T20:00:00Z'),
    Product(id: 'prod_016', shopId: 'shop_001', barcode: '896400015004', qrCode: 'CM-SNK-004', name: 'Super Crisp BBQ Nimco 120g', category: 'Snacks', brand: 'Tri-Pack', description: 'Traditional savoury spicy nimco mix with crunchy peanuts.', costPrice: 110, sellingPrice: 140, taxPercentage: 5, stockQuantity: 34, minimumStockLimit: 12, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-07T12:00:00Z', updatedAt: '2026-10-20T16:00:00Z'),
    Product(id: 'prod_017', shopId: 'shop_001', barcode: '896400016001', qrCode: 'CM-PC-001', name: 'Lifebuoy Total 10 Antibacterial Soap 135g', category: 'Personal Care', brand: 'Unilever', description: 'Germ protection formula soap bar with Active Silver shield.', costPrice: 135, sellingPrice: 170, taxPercentage: 5, stockQuantity: 52, minimumStockLimit: 20, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-09T09:00:00Z', updatedAt: '2026-10-22T14:15:00Z'),
    Product(id: 'prod_018', shopId: 'shop_001', barcode: '896400016002', qrCode: 'CM-PC-002', name: 'Sunsilk Black Shine Shampoo 380ml', category: 'Personal Care', brand: 'Unilever', description: 'Enriched with Amla pearl complex for long, lustrous black hair.', costPrice: 590, sellingPrice: 710, taxPercentage: 5, stockQuantity: 19, minimumStockLimit: 8, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-09T09:00:00Z', updatedAt: '2026-10-21T18:00:00Z'),
    Product(id: 'prod_019', shopId: 'shop_001', barcode: '896400016003', qrCode: 'CM-PC-003', name: 'Colgate Maximum Cavity Protection 150g', category: 'Personal Care', brand: 'Colgate', description: 'Calcium and active fluoride formula strengthens enamel.', costPrice: 220, sellingPrice: 270, taxPercentage: 5, stockQuantity: 41, minimumStockLimit: 12, unit: ProductUnit.piece, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-10T10:00:00Z', updatedAt: '2026-10-23T11:00:00Z'),
    Product(id: 'prod_020', shopId: 'shop_001', barcode: '896400016004', qrCode: 'CM-PC-004', name: 'Surf Excel Quick Wash Detergent 1kg', category: 'Personal Care', brand: 'Unilever', description: 'Superior stain removal technology in 1 easy wash step.', costPrice: 470, sellingPrice: 560, taxPercentage: 5, stockQuantity: 35, minimumStockLimit: 10, unit: ProductUnit.packet, supplierId: 'sup_001', supplierName: 'National Wholesale Distributors', createdAt: '2026-09-10T10:00:00Z', updatedAt: '2026-10-22T16:30:00Z'),
    // Shop 002 (Express Branch) products
    Product(id: 'prod_201', shopId: 'shop_002', barcode: '896400021001', name: 'Nestle Pure Life Water 1.5L', category: 'Beverages', brand: 'Nestle', costPrice: 70, sellingPrice: 100, taxPercentage: 0, stockQuantity: 90, minimumStockLimit: 20, unit: ProductUnit.piece, createdAt: '2026-10-01T09:00:00Z'),
    Product(id: 'prod_202', shopId: 'shop_002', barcode: '896400021002', name: 'Sting Berry Energy Drink 500ml', category: 'Beverages', brand: 'PepsiCo', costPrice: 110, sellingPrice: 150, taxPercentage: 5, stockQuantity: 45, minimumStockLimit: 12, unit: ProductUnit.piece, createdAt: '2026-10-01T09:00:00Z'),
    Product(id: 'prod_203', shopId: 'shop_002', barcode: '896400021003', name: 'Dawn Chicken Sandwich Bread', category: 'Bakery', brand: 'Dawn', costPrice: 140, sellingPrice: 175, taxPercentage: 0, stockQuantity: 18, minimumStockLimit: 6, unit: ProductUnit.packet, createdAt: '2026-10-01T09:00:00Z'),
    Product(id: 'prod_204', shopId: 'shop_002', barcode: '896400021004', name: 'K&Ns Nuggets 500g Pack', category: 'Frozen', brand: 'K&Ns', costPrice: 680, sellingPrice: 820, taxPercentage: 0, stockQuantity: 6, minimumStockLimit: 8, unit: ProductUnit.packet, createdAt: '2026-10-01T09:00:00Z'),
    // Shop 003 (MedCare Pharmacy) products
    Product(id: 'prod_301', shopId: 'shop_003', barcode: '896400031001', name: 'Panadol Extra 500mg Tablets 100s', category: 'Analgesics', brand: 'GSK', costPrice: 320, sellingPrice: 380, taxPercentage: 0, stockQuantity: 55, minimumStockLimit: 15, unit: ProductUnit.box, createdAt: '2026-10-05T09:00:00Z'),
    Product(id: 'prod_302', shopId: 'shop_003', barcode: '896400031002', name: 'Augmentin 625mg Tablets 14s', category: 'Antibiotics', brand: 'GSK', costPrice: 520, sellingPrice: 610, taxPercentage: 0, stockQuantity: 32, minimumStockLimit: 10, unit: ProductUnit.packet, createdAt: '2026-10-05T09:00:00Z'),
    Product(id: 'prod_303', shopId: 'shop_003', barcode: '896400031003', name: 'Brufen 400mg Suspension 120ml', category: 'Anti-inflammatory', brand: 'Abbott', costPrice: 110, sellingPrice: 140, taxPercentage: 0, stockQuantity: 40, minimumStockLimit: 10, unit: ProductUnit.piece, createdAt: '2026-10-05T09:00:00Z'),
    Product(id: 'prod_304', shopId: 'shop_003', barcode: '896400031004', name: 'Dettol Antiseptic Liquid 250ml', category: 'Antiseptics', brand: 'Reckitt', costPrice: 390, sellingPrice: 460, taxPercentage: 5, stockQuantity: 18, minimumStockLimit: 6, unit: ProductUnit.piece, createdAt: '2026-10-05T09:00:00Z'),
    Product(id: 'prod_305', shopId: 'shop_003', barcode: '896400031005', name: 'Omron Digital Thermometer', category: 'Medical Devices', brand: 'Omron', costPrice: 550, sellingPrice: 780, taxPercentage: 5, stockQuantity: 4, minimumStockLimit: 8, unit: ProductUnit.piece, createdAt: '2026-10-05T09:00:00Z'),
  ];

  static List<Sale> get pastSales {
    final p = products;
    return [
      Sale(
        id: 'sale_1001', invoiceNumber: 'INV-20261024-001', shopId: 'shop_001',
        cashierId: 'usr_cashier_1', cashierName: 'Hamza Farooq',
        customerId: 'cust_001', customerName: 'Ali Raza',
        items: [
          CartItem(id: 'item_101', product: p[0], quantity: 2, unitPrice: 470, itemDiscount: 0, itemTaxRate: 5),
          CartItem(id: 'item_102', product: p[2], quantity: 1, unitPrice: 210, itemDiscount: 10, itemTaxRate: 5),
        ],
        subtotal: 1150, discountTotal: 10, taxTotal: 57, deliveryCharge: 0, grandTotal: 1197,
        payments: [PaymentRecord(id: 'pay_101', method: PaymentMethod.cash, amount: 1197, status: PaymentStatus.paid, cashReceived: 1200, changeReturned: 3)],
        paymentStatus: PaymentStatus.paid, createdAt: '2026-10-24T07:15:00Z',
      ),
      Sale(
        id: 'sale_1002', invoiceNumber: 'INV-20261024-002', shopId: 'shop_001',
        cashierId: 'usr_cashier_1', cashierName: 'Hamza Farooq',
        customerId: 'cust_002', customerName: 'Dr. Fatima Noor',
        items: [
          CartItem(id: 'item_201', product: p[7], quantity: 1, unitPrice: 2050, itemDiscount: 50, itemTaxRate: 0),
          CartItem(id: 'item_202', product: p[8], quantity: 1, unitPrice: 2750, itemDiscount: 0, itemTaxRate: 0),
        ],
        subtotal: 4800, discountTotal: 50, taxTotal: 0, deliveryCharge: 150, grandTotal: 4900,
        payments: [PaymentRecord(id: 'pay_201', method: PaymentMethod.jazzcash, amount: 4900, status: PaymentStatus.paid, provider: 'JazzCash Merchant API', referenceNumber: 'JC-902194821')],
        paymentStatus: PaymentStatus.paid, createdAt: '2026-10-24T08:30:00Z',
      ),
      Sale(
        id: 'sale_1003', invoiceNumber: 'INV-20261024-003', shopId: 'shop_001',
        cashierId: 'usr_cashier_1', cashierName: 'Hamza Farooq',
        items: [
          CartItem(id: 'item_301', product: p[12], quantity: 3, unitPrice: 100, itemDiscount: 0, itemTaxRate: 5),
          CartItem(id: 'item_302', product: p[13], quantity: 2, unitPrice: 60, itemDiscount: 0, itemTaxRate: 5),
        ],
        subtotal: 420, discountTotal: 0, taxTotal: 21, deliveryCharge: 0, grandTotal: 441,
        payments: [PaymentRecord(id: 'pay_301', method: PaymentMethod.easypaisa, amount: 441, status: PaymentStatus.paid, provider: 'Easypaisa QR Gateway', referenceNumber: 'EP-55102918')],
        paymentStatus: PaymentStatus.paid, createdAt: '2026-10-24T09:12:00Z',
      ),
      Sale(
        id: 'sale_2001', invoiceNumber: 'INV-EXP-001', shopId: 'shop_002',
        cashierId: 'usr_owner_1', cashierName: 'Tariq Mehmood',
        items: [
          CartItem(id: 'item_2001', product: p[20], quantity: 4, unitPrice: 100),
          CartItem(id: 'item_2002', product: p[23], quantity: 1, unitPrice: 820),
        ],
        subtotal: 1220, discountTotal: 0, taxTotal: 0, deliveryCharge: 0, grandTotal: 1220,
        payments: [PaymentRecord(id: 'pay_2001', method: PaymentMethod.cash, amount: 1220, cashReceived: 1500, changeReturned: 280)],
        paymentStatus: PaymentStatus.paid, createdAt: '2026-10-24T10:00:00Z',
      ),
      Sale(
        id: 'sale_3001', invoiceNumber: 'INV-MED-001', shopId: 'shop_003',
        cashierId: 'usr_owner_2', cashierName: 'Dr. Ayesha Noor',
        items: [
          CartItem(id: 'item_3001', product: p[24], quantity: 2, unitPrice: 380),
          CartItem(id: 'item_3002', product: p[25], quantity: 1, unitPrice: 610),
        ],
        subtotal: 1370, discountTotal: 0, taxTotal: 0, deliveryCharge: 0, grandTotal: 1370,
        payments: [PaymentRecord(id: 'pay_3001', method: PaymentMethod.bankQr, amount: 1370, provider: 'Raast QR', referenceNumber: 'RS-7731209')],
        paymentStatus: PaymentStatus.paid, createdAt: '2026-10-24T11:20:00Z',
      ),
    ];
  }

  static List<Expense> get expenses => [
        Expense(id: 'exp_001', shopId: 'shop_001', amount: 15000, date: '2026-10-20T10:00:00Z', category: ExpenseCategory.Electricity, description: 'Commercial electricity bill (IESCO Oct billing)', createdBy: 'Tariq Mehmood'),
        Expense(id: 'exp_002', shopId: 'shop_001', amount: 3500, date: '2026-10-22T14:15:00Z', category: ExpenseCategory.Internet, description: 'Nayatel optical fiber high-speed internet & static IP', createdBy: 'Bilal Khan'),
        Expense(id: 'exp_003', shopId: 'shop_001', amount: 8500, date: '2026-10-23T16:30:00Z', category: ExpenseCategory.Transport, description: 'Bulk delivery van fuel and Sabzi Mandi pickup charges', createdBy: 'Hamza Farooq'),
        Expense(id: 'exp_004', shopId: 'shop_001', amount: 4200, date: '2026-10-24T11:00:00Z', category: ExpenseCategory.Miscellaneous, description: 'Thermal receipt paper rolls (80mm x 50 rolls) and packaging shopping bags', createdBy: 'Bilal Khan'),
        Expense(id: 'exp_301', shopId: 'shop_003', amount: 12000, date: '2026-10-22T12:00:00Z', category: ExpenseCategory.Utilities, description: 'Cold chain refrigeration backup & clinic utilities', createdBy: 'Dr. Ayesha Noor'),
      ];
}
