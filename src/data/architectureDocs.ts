export interface SchemaTable {
  name: string;
  description: string;
  columns: {
    name: string;
    type: string;
    constraints: string;
    description: string;
  }[];
  indexes: string[];
  dartCode: string;
}

export const PUBSPEC_CONTENT = `name: smart_pos
description: "A modern cross-platform Smart POS mobile & web app built with Flutter."
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.3.0 <4.0.0'
  flutter: ">=3.19.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # --- State Management & Dependency Injection ---
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # --- Navigation & Routing ---
  go_router: ^14.0.2

  # --- Local Offline Database (Drift / SQLite) ---
  drift: ^2.18.0
  drift_flutter: ^0.1.0
  sqlite3_flutter_libs: ^0.5.24

  # --- Hardware & Peripherals (Camera Scanner & USB) ---
  mobile_scanner: ^5.1.1
  flutter_barcode_scanner: ^2.0.0

  # --- Receipt & Thermal Printing ---
  pdf: ^3.10.8
  printing: ^5.13.1
  esc_pos_utils_plus: ^2.0.4

  # --- Networking & REST ---
  dio: ^5.4.3+1
  connectivity_plus: ^6.0.3

  # --- Data Modeling & Utilities ---
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0
  intl: ^0.19.0
  uuid: ^4.4.0
  collection: ^1.18.0

  # --- UI, Visuals & Icons ---
  lucide_icons: ^0.344.0
  fl_chart: ^0.68.0
  qr_flutter: ^4.1.0
  badges: ^3.1.2
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0

  # --- Secure Storage & Preferences ---
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.3

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

  # --- Code Generation ---
  build_runner: ^2.4.9
  riverpod_generator: ^2.4.0
  drift_dev: ^2.18.0
  freezed: ^2.5.2
  json_serializable: ^6.8.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/
`;

export const FOLDER_STRUCTURE_TEXT = `lib/
├── app/
│   ├── app.dart                        # MaterialApp.router with Material 3 theme & locale
│   ├── app_config.dart                 # Config constants: app name ("Smart POS"), API endpoints
│   ├── observer.dart                   # Riverpod state observer for logging
│   └── router.dart                     # GoRouter configuration with role guards & route redirects
├── core/
│   ├── constants/
│   │   ├── app_colors.dart             # Material 3 dynamic color scheme (Primary, Surface, etc.)
│   │   ├── app_dimensions.dart         # Responsive breakpoints (Mobile, Tablet, Desktop)
│   │   └── app_strings.dart            # Standardized labels, ready for future Urdu localization
│   ├── database/
│   │   ├── app_database.dart           # Drift Database class, tables registration, migrations
│   │   ├── app_database.g.dart         # Generated Drift query code
│   │   ├── connection/                 # Native SQLite vs Web Wasm connection factory
│   │   └── daos/                       # Data Access Objects (ProductsDao, SalesDao, etc.)
│   ├── services/
│   │   ├── connectivity_service.dart   # Network monitor (Online / Offline state stream)
│   │   ├── sync_queue_service.dart     # Offline-first transaction buffer & batch sync processor
│   │   ├── product_lookup_service.dart # Abstract barcode resolver (Local -> API -> Manual)
│   │   ├── payment_service.dart        # Abstract PaymentProvider interface & mock gateways
│   │   ├── print_service.dart          # Thermal ESC/POS (58mm/80mm) & PDF export service
│   │   └── secure_storage_service.dart # Key-value vault for user session tokens
│   ├── theme/
│   │   ├── color_schemes.g.dart        # Material 3 Color Schemes (Light & Dark)
│   │   ├── text_theme.dart             # Typography hierarchy (Display, Title, Body, Code)
│   │   └── theme.dart                  # ThemeData builder with elevation & corner styling
│   └── utils/
│       ├── currency_formatter.dart     # PKR formatting (e.g., "PKR 1,450.00")
│       ├── date_time_utils.dart        # POS invoice timestamping & reporting ranges
│       ├── receipt_builder.dart        # ESC/POS byte sequence and thermal paper formatter
│       └── validators.dart             # Stock, price, phone number, and tax validations
├── features/
│   ├── auth/                           # Login, register, forgot password, session manager
│   ├── onboarding/                     # First-time shop setup wizard (Name, Tax, PKR, Receipt note)
│   ├── dashboard/                      # Daily sales, profit, low-stock cards, 7-day fl_chart
│   ├── shops/                          # Multi-shop selector & shop profile switcher
│   ├── products/                       # Product catalog, categories, brands, variants, image pick
│   ├── inventory/                      # Stock in/out, low stock alerts, expiry alerts, adjustments
│   ├── scanner/                        # mobile_scanner camera view, torch toggle, USB listener
│   ├── pos/                            # Cashier screen: Category filter, product grid, cart panel
│   ├── checkout/                       # Payment dialog: Cash calculator, Split, QR code generator
│   ├── payments/                       # Mock JazzCash, Easypaisa, Bank QR & Card providers
│   ├── receipts/                       # Thermal receipt preview (58mm/80mm), PDF share, reprint
│   ├── sales/                          # Sales history, refund manager (full/partial), audit log
│   ├── customers/                      # Customer ledger, loyalty points, store credit balance
│   ├── suppliers/                      # Supplier directory, payable balances, purchase orders
│   ├── expenses/                       # Shop expense logger (Rent, Utilities, Salaries)
│   ├── reports/                        # Daily closing (Z-Report), P&L, product-wise sales
│   ├── staff/                          # Staff management & role assignment (Owner, Manager, Cashier)
│   └── settings/                       # Printer config, tax rates, payment toggles, backup/export
├── shared/
│   ├── models/                         # Domain entities & Freezed value objects
│   ├── repositories/                   # Abstract Repository interfaces & Drift implementations
│   └── widgets/                        # Reusable buttons, badges, scanner sheets, responsive grid
└── main.dart                           # Entrypoint initializing Drift DB, SharedPreferences & ProviderScope
`;

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    name: 'shops',
    description: 'Stores isolated shop profiles. Multi-tenant root entity.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'Unique shop ID (UUID)' },
      { name: 'name', type: 'TEXT', constraints: 'NOT NULL', description: 'Store trading name' },
      { name: 'owner_id', type: 'TEXT', constraints: 'NOT NULL', description: 'User ID of the shop owner' },
      { name: 'phone', type: 'TEXT', constraints: 'NOT NULL', description: 'Shop contact number' },
      { name: 'category', type: 'TEXT', constraints: 'NOT NULL', description: 'e.g. Grocery, Pharmacy, Apparel' },
      { name: 'address', type: 'TEXT', constraints: 'NOT NULL', description: 'Physical street address' },
      { name: 'city', type: 'TEXT', constraints: 'NOT NULL', description: 'City name' },
      { name: 'currency', type: 'TEXT', constraints: "DEFAULT 'PKR'", description: 'Default currency code' },
      { name: 'tax_enabled', type: 'INTEGER', constraints: 'DEFAULT 1', description: 'Boolean flag for tax calculation' },
      { name: 'default_tax_rate', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Standard tax percentage' },
      { name: 'receipt_message', type: 'TEXT', constraints: 'NULL', description: 'Footer message printed on receipt' },
      { name: 'allow_negative_stock', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Whether sales can exceed stock' },
      { name: 'printer_width', type: 'TEXT', constraints: "DEFAULT '80mm'", description: '58mm or 80mm' },
      { name: 'created_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Unix epoch timestamp' },
      { name: 'updated_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Unix epoch timestamp' }
    ],
    indexes: ['CREATE INDEX idx_shops_owner ON shops(owner_id);'],
    dartCode: `class Shops extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get ownerId => text()();
  TextColumn get phone => text()();
  TextColumn get category => text()();
  TextColumn get address => text()();
  TextColumn get city => text()();
  TextColumn get currency => text().withDefault(const Constant('PKR'))();
  BoolColumn get taxEnabled => boolean().withDefault(const Constant(true))();
  RealColumn get defaultTaxRate => real().withDefault(const Constant(0.0))();
  TextColumn get receiptMessage => text().nullable()();
  BoolColumn get allowNegativeStock => boolean().withDefault(const Constant(false))();
  TextColumn get printerWidth => text().withDefault(const Constant('80mm'))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'users',
    description: 'System users (Owners, Managers, Cashiers) with hashed auth data.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'name', type: 'TEXT', constraints: 'NOT NULL', description: 'Full name' },
      { name: 'email', type: 'TEXT', constraints: 'UNIQUE NOT NULL', description: 'Login email' },
      { name: 'phone', type: 'TEXT', constraints: 'NOT NULL', description: 'Phone number' },
      { name: 'role', type: 'TEXT', constraints: 'NOT NULL', description: 'owner | manager | cashier' },
      { name: 'active_shop_id', type: 'TEXT', constraints: 'NULL', description: 'Currently active shop context' },
      { name: 'created_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Timestamp' }
    ],
    indexes: ['CREATE UNIQUE INDEX idx_users_email ON users(email);'],
    dartCode: `class Users extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get email => text().unique()();
  TextColumn get phone => text()();
  TextColumn get role => text()(); // 'owner', 'manager', 'cashier'
  TextColumn get activeShopId => text().nullable().references(Shops, #id)();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'products',
    description: 'Core inventory catalog with barcodes, pricing, stock levels, and alert thresholds.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'shop_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES shops(id)', description: 'Tenant shop isolation' },
      { name: 'barcode', type: 'TEXT', constraints: 'NOT NULL', description: 'EAN-13, UPC-A, Code-128' },
      { name: 'qr_code', type: 'TEXT', constraints: 'NULL', description: 'Secondary QR code identifier' },
      { name: 'name', type: 'TEXT', constraints: 'NOT NULL', description: 'Product title' },
      { name: 'category', type: 'TEXT', constraints: 'NOT NULL', description: 'Beverages, Dairy, Grocery, etc.' },
      { name: 'brand', type: 'TEXT', constraints: 'NOT NULL', description: 'Brand name' },
      { name: 'description', type: 'TEXT', constraints: 'NULL', description: 'Details & specifications' },
      { name: 'image_url', type: 'TEXT', constraints: 'NULL', description: 'Local path or CDN image URL' },
      { name: 'cost_price', type: 'REAL', constraints: 'NOT NULL', description: 'Wholesale purchase price' },
      { name: 'selling_price', type: 'REAL', constraints: 'NOT NULL', description: 'Retail sale price' },
      { name: 'discount_price', type: 'REAL', constraints: 'NULL', description: 'Promotional selling price' },
      { name: 'tax_percentage', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Product GST/sales tax rate' },
      { name: 'stock_quantity', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Current available stock' },
      { name: 'min_stock_limit', type: 'REAL', constraints: 'DEFAULT 5.0', description: 'Threshold triggering low-stock alert' },
      { name: 'unit', type: 'TEXT', constraints: "DEFAULT 'piece'", description: 'piece, packet, box, kg, litre' },
      { name: 'supplier_id', type: 'TEXT', constraints: 'NULL REFERENCES suppliers(id)', description: 'Default distributor' },
      { name: 'expiry_date', type: 'INTEGER', constraints: 'NULL', description: 'Expiration date timestamp' },
      { name: 'created_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Created timestamp' },
      { name: 'updated_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Updated timestamp' }
    ],
    indexes: [
      'CREATE INDEX idx_products_shop ON products(shop_id);',
      'CREATE INDEX idx_products_barcode ON products(shop_id, barcode);',
      'CREATE INDEX idx_products_category ON products(shop_id, category);'
    ],
    dartCode: `class Products extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text().references(Shops, #id)();
  TextColumn get barcode => text()();
  TextColumn get qrCode => text().nullable()();
  TextColumn get name => text()();
  TextColumn get category => text()();
  TextColumn get brand => text()();
  TextColumn get description => text().nullable()();
  TextColumn get imageUrl => text().nullable()();
  RealColumn get costPrice => real()();
  RealColumn get sellingPrice => real()();
  RealColumn get discountPrice => real().nullable()();
  RealColumn get taxPercentage => real().withDefault(const Constant(0.0))();
  RealColumn get stockQuantity => real().withDefault(const Constant(0.0))();
  RealColumn get minStockLimit => real().withDefault(const Constant(5.0))();
  TextColumn get unit => text().withDefault(const Constant('piece'))();
  TextColumn get supplierId => text().nullable().references(Suppliers, #id)();
  DateTimeColumn get expiryDate => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'sales',
    description: 'Header record for finalized or held customer sales and invoices.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'shop_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES shops(id)', description: 'Shop isolation' },
      { name: 'invoice_number', type: 'TEXT', constraints: 'UNIQUE NOT NULL', description: 'e.g. INV-20261024-001' },
      { name: 'cashier_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES users(id)', description: 'Staff member' },
      { name: 'customer_id', type: 'TEXT', constraints: 'NULL REFERENCES customers(id)', description: 'Attached customer' },
      { name: 'subtotal', type: 'REAL', constraints: 'NOT NULL', description: 'Sum of line totals before tax/discount' },
      { name: 'discount_total', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Sum of item & bill discounts' },
      { name: 'tax_total', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Calculated tax amount' },
      { name: 'delivery_charge', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Service or delivery fee' },
      { name: 'grand_total', type: 'REAL', constraints: 'NOT NULL', description: 'Total payable amount' },
      { name: 'payment_status', type: 'TEXT', constraints: 'NOT NULL', description: 'pending | paid | refunded' },
      { name: 'is_held', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Flag for suspended/held cart' },
      { name: 'created_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Sale completion timestamp' }
    ],
    indexes: [
      'CREATE INDEX idx_sales_shop_date ON sales(shop_id, created_at);',
      'CREATE UNIQUE INDEX idx_sales_invoice ON sales(invoice_number);'
    ],
    dartCode: `class Sales extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text().references(Shops, #id)();
  TextColumn get invoiceNumber => text().unique()();
  TextColumn get cashierId => text().references(Users, #id)();
  TextColumn get customerId => text().nullable().references(Customers, #id)();
  RealColumn get subtotal => real()();
  RealColumn get discountTotal => real().withDefault(const Constant(0.0))();
  RealColumn get taxTotal => real().withDefault(const Constant(0.0))();
  RealColumn get deliveryCharge => real().withDefault(const Constant(0.0))();
  RealColumn get grandTotal => real()();
  TextColumn get paymentStatus => text()(); // 'pending', 'paid', 'refunded'
  BoolColumn get isHeld => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'sale_items',
    description: 'Individual line items inside an invoice.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'sale_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES sales(id)', description: 'Parent invoice' },
      { name: 'product_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES products(id)', description: 'Product' },
      { name: 'product_name', type: 'TEXT', constraints: 'NOT NULL', description: 'Snapshot of name at time of sale' },
      { name: 'quantity', type: 'REAL', constraints: 'NOT NULL', description: 'Purchased quantity' },
      { name: 'unit_price', type: 'REAL', constraints: 'NOT NULL', description: 'Selling price at sale time' },
      { name: 'cost_price', type: 'REAL', constraints: 'NOT NULL', description: 'Cost price snapshot for profit calculation' },
      { name: 'discount', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Item level discount' },
      { name: 'tax_rate', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Tax percentage' },
      { name: 'line_total', type: 'REAL', constraints: 'NOT NULL', description: 'Quantity * Price - Discount + Tax' }
    ],
    indexes: ['CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);'],
    dartCode: `class SaleItems extends Table {
  TextColumn get id => text()();
  TextColumn get saleId => text().references(Sales, #id)();
  TextColumn get productId => text().references(Products, #id)();
  TextColumn get productName => text()();
  RealColumn get quantity => real()();
  RealColumn get unitPrice => real()();
  RealColumn get costPrice => real()();
  RealColumn get discount => real().withDefault(const Constant(0.0))();
  RealColumn get taxRate => real().withDefault(const Constant(0.0))();
  RealColumn get lineTotal => real()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'payments',
    description: 'Payment transactions supporting Cash, JazzCash, Easypaisa, Bank QR, and Split Payments.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'sale_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES sales(id)', description: 'Associated invoice' },
      { name: 'method', type: 'TEXT', constraints: 'NOT NULL', description: 'cash | card | jazzcash | easypaisa | bank_qr' },
      { name: 'amount', type: 'REAL', constraints: 'NOT NULL', description: 'Amount paid' },
      { name: 'status', type: 'TEXT', constraints: 'NOT NULL', description: 'pending | paid | failed | refunded' },
      { name: 'provider', type: 'TEXT', constraints: 'NULL', description: 'Gateway name' },
      { name: 'reference_number', type: 'TEXT', constraints: 'NULL', description: 'Bank/Wallet transaction reference' },
      { name: 'qr_payload', type: 'TEXT', constraints: 'NULL', description: 'smartpos://payment dynamic URI string' },
      { name: 'cash_received', type: 'REAL', constraints: 'NULL', description: 'Tendered cash for change calculation' },
      { name: 'change_returned', type: 'REAL', constraints: 'NULL', description: 'Tendered change returned to customer' },
      { name: 'created_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Timestamp' }
    ],
    indexes: ['CREATE INDEX idx_payments_sale ON payments(sale_id);'],
    dartCode: `class Payments extends Table {
  TextColumn get id => text()();
  TextColumn get saleId => text().references(Sales, #id)();
  TextColumn get method => text()();
  RealColumn get amount => real()();
  TextColumn get status => text()();
  TextColumn get provider => text().nullable()();
  TextColumn get referenceNumber => text().nullable()();
  TextColumn get qrPayload => text().nullable()();
  RealColumn get cashReceived => real().nullable()();
  RealColumn get changeReturned => real().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'sync_queue',
    description: 'Offline-first queue for storing pending mutation jobs until network connectivity resumes.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'shop_id', type: 'TEXT', constraints: 'NOT NULL', description: 'Tenant shop ID' },
      { name: 'entity_type', type: 'TEXT', constraints: 'NOT NULL', description: 'sale | product | customer | expense' },
      { name: 'entity_id', type: 'TEXT', constraints: 'NOT NULL', description: 'Primary ID of changed record' },
      { name: 'action', type: 'TEXT', constraints: 'NOT NULL', description: 'insert | update | delete' },
      { name: 'payload_json', type: 'TEXT', constraints: 'NOT NULL', description: 'Full serialized record JSON' },
      { name: 'status', type: 'TEXT', constraints: "DEFAULT 'pending'", description: 'pending | in_progress | synced | failed' },
      { name: 'retry_count', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Exponential backoff attempts' },
      { name: 'error_message', type: 'TEXT', constraints: 'NULL', description: 'Failure reason from server sync' },
      { name: 'created_at', type: 'INTEGER', constraints: 'NOT NULL', description: 'Timestamp' }
    ],
    indexes: ['CREATE INDEX idx_sync_queue_status ON sync_queue(status, created_at);'],
    dartCode: `class SyncQueue extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text()();
  TextColumn get entityType => text()(); // 'sale', 'product', etc.
  TextColumn get entityId => text()();
  TextColumn get action => text()(); // 'insert', 'update', 'delete'
  TextColumn get payloadJson => text()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  TextColumn get errorMessage => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'customers',
    description: 'Customer profiles, contact records, loyalty points ledger, and store credit due balances.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'shop_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES shops(id)', description: 'Tenant isolation' },
      { name: 'name', type: 'TEXT', constraints: 'NOT NULL', description: 'Customer full name' },
      { name: 'phone', type: 'TEXT', constraints: 'NOT NULL', description: 'Phone number' },
      { name: 'email', type: 'TEXT', constraints: 'NULL', description: 'Optional email' },
      { name: 'address', type: 'TEXT', constraints: 'NULL', description: 'Delivery address' },
      { name: 'loyalty_points', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Accumulated points' },
      { name: 'due_balance', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Unpaid store credit balance' },
      { name: 'total_purchases', type: 'REAL', constraints: 'DEFAULT 0.0', description: 'Lifetime spending sum' },
      { name: 'notes', type: 'TEXT', constraints: 'NULL', description: 'Cashier/Owner notes' }
    ],
    indexes: ['CREATE INDEX idx_customers_phone ON customers(shop_id, phone);'],
    dartCode: `class Customers extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text().references(Shops, #id)();
  TextColumn get name => text()();
  TextColumn get phone => text()();
  TextColumn get email => text().nullable()();
  TextColumn get address => text().nullable()();
  IntColumn get loyaltyPoints => integer().withDefault(const Constant(0))();
  RealColumn get dueBalance => real().withDefault(const Constant(0.0))();
  RealColumn get totalPurchases => real().withDefault(const Constant(0.0))();
  TextColumn get notes => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};
}`
  },
  {
    name: 'audit_logs',
    description: 'Immutable security log for discounts, stock adjustments, refunds, and voids.',
    columns: [
      { name: 'id', type: 'TEXT', constraints: 'PRIMARY KEY', description: 'UUID' },
      { name: 'shop_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES shops(id)', description: 'Shop' },
      { name: 'user_id', type: 'TEXT', constraints: 'NOT NULL REFERENCES users(id)', description: 'Actor user' },
      { name: 'action', type: 'TEXT', constraints: 'NOT NULL', description: 'refund | discount | price_override | stock_adjust' },
      { name: 'target_id', type: 'TEXT', constraints: 'NOT NULL', description: 'Target entity ID' },
      { name: 'details', type: 'TEXT', constraints: 'NOT NULL', description: 'JSON diff / reasoning' },
      { name: 'timestamp', type: 'INTEGER', constraints: 'NOT NULL', description: 'Unix epoch timestamp' }
    ],
    indexes: ['CREATE INDEX idx_audit_shop_time ON audit_logs(shop_id, timestamp);'],
    dartCode: `class AuditLogs extends Table {
  TextColumn get id => text()();
  TextColumn get shopId => text().references(Shops, #id)();
  TextColumn get userId => text().references(Users, #id)();
  TextColumn get action => text()();
  TextColumn get targetId => text()();
  TextColumn get details => text()();
  DateTimeColumn get timestamp => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}`
  }
];

export const ROADMAP_PHASES = [
  {
    phase: 'Phase 1',
    title: 'Architecture Blueprint, Packages, Folder Layout & Schema',
    status: 'completed',
    summary: 'Define clean architecture layers, pubspec.yaml dependencies, feature tree, Drift database schema, and roadmap.',
    deliverables: [
      'Clean architecture layers: Core, Presentation, Domain, Data, Services',
      'Production-ready pubspec.yaml with Riverpod 2.x, GoRouter, Drift, mobile_scanner',
      'Scalable feature-first directory layout (17 modular feature modules)',
      'Drift SQLite table schemas with FKs, indexes, sync queue, and audit trails',
      'Step-by-step 8-phase execution blueprint'
    ]
  },
  {
    phase: 'Phase 2',
    title: 'Flutter Foundation, Theme, Shell, Auth & Dashboard',
    status: 'upcoming',
    summary: 'Material 3 design system, responsive shell (Mobile/Tablet/Desktop), GoRouter role guards, Riverpod providers, mock auth, onboarding wizard, and KPI dashboard.',
    deliverables: [
      'Material 3 Light/Dark theme with responsive navigation rail & bottom bar',
      'GoRouter configuration with redirect guards for Owner, Manager, and Cashier',
      'Shop onboarding wizard (Shop Name, PKR currency, Tax rates, Receipt notes)',
      'Multi-shop selector dropdown with shopId scoped state',
      'Dashboard cards: Today Sales, Profit estimate, Low Stock, 7-day fl_chart'
    ]
  },
  {
    phase: 'Phase 3',
    title: 'Products, Categories, Inventory & Local Database DAOs',
    status: 'upcoming',
    summary: 'Complete product catalog management, category & brand filters, stock in/out adjustments, low-stock notifications, expiry alerts, and CSV import/export.',
    deliverables: [
      'Drift DAOs for Products, Categories, Brands, and InventoryTransactions',
      'Product form with barcode generation, unit selector (kg, piece, litre), image upload',
      'Stock adjustment modal with mandatory audit reason logging',
      'Low-stock and expiring products notification center',
      'CSV batch import/export engine'
    ]
  },
  {
    phase: 'Phase 4',
    title: 'Barcode & QR Scanner with Online ProductLookupService',
    status: 'upcoming',
    summary: 'mobile_scanner integration with torch/camera toggle, USB HID keyboard barcode scanner listener for web/desktop, and smart ProductLookupService fallback.',
    deliverables: [
      'mobile_scanner view with scanning reticle, flash toggle, and sound feedback',
      'USB / Bluetooth HID keyboard wedge listener for web and desktop POS',
      'ProductLookupService interface with Mock, OpenFoodFacts, and Manual fallback',
      'Instant "Add to Cart" if found locally vs "Review & Save to Inventory" if looked up'
    ]
  },
  {
    phase: 'Phase 5',
    title: 'POS Cashier Terminal, Cart Engine & Multi-Payment Checkout',
    status: 'upcoming',
    summary: 'High-speed POS sales terminal. 3-column layout on desktop, bottom sheet cart on mobile. PKR/% discounts, tax, hold/resume sales, Cash calculator, Split payments, and dynamic QR.',
    deliverables: [
      'Fast product grid with instant search by name, category, or barcode',
      'Cart with PKR/% item and bill discounts, tax toggling, and customer attachment',
      'Hold sale and resume held sales stack',
      'Payment modal: Cash change calculator, Split payment validation',
      'Mock JazzCash, Easypaisa, Bank QR providers with smartpos:// QR payload'
    ]
  },
  {
    phase: 'Phase 6',
    title: 'Receipts, Thermal Printer Engine (58mm/80mm) & PDF',
    status: 'upcoming',
    summary: 'Professional ESC/POS thermal receipt generation for 58mm and 80mm printers, Bluetooth/Network/USB printing, PDF sharing, and browser printing.',
    deliverables: [
      '58mm and 80mm thermal receipt layouts with shop header and barcode/QR',
      'ESC/POS byte sequence generation via esc_pos_utils_plus',
      'PDF invoice compilation and system share sheet via printing package',
      'Past sales reprint and web window.print() bridge'
    ]
  },
  {
    phase: 'Phase 7',
    title: 'Sales History, Refunds, Customers, Suppliers & Expenses',
    status: 'upcoming',
    summary: 'Comprehensive sales ledger with full and partial refund processing (restoring stock), customer loyalty and credit tracking, supplier purchase orders, and daily expense logging.',
    deliverables: [
      'Searchable sales history with invoice filters and date ranges',
      'Full and partial refund modal with reason tracking and stock restoration',
      'Customer credit ledger (due balance collection & loyalty points)',
      'Supplier purchase orders with cost price tracking and payable ledger',
      'Shop expenses logger (Rent, Electricity, Salaries, Misc) impacting net profit'
    ]
  },
  {
    phase: 'Phase 8',
    title: 'Reports, Security Hardening, Offline Sync Queue & Verification',
    status: 'upcoming',
    summary: 'Z-Report daily closing, P&L statements, multi-tenant security verification, offline SQLite SyncQueue with exponential backoff, and Firebase/Supabase synchronization blueprint.',
    deliverables: [
      'Daily Closing Z-Report, P&L, product-wise sales, and tax reports',
      'Role-based permission matrix enforcement (Owner vs Manager vs Cashier)',
      'SyncQueue engine handling offline persistence, retry counts, and conflict resolution',
      'Firebase Firestore / Supabase cloud sync adapter blueprint',
      'Comprehensive integration and automated testing checklist'
    ]
  }
];
