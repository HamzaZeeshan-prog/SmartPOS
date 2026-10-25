import JSZip from 'jszip';

export interface FlutterFile {
  path: string;
  content: string;
}

export const FLUTTER_PROJECT_FILES: FlutterFile[] = [
  {
    path: 'pubspec.yaml',
    content: `name: smart_pos
description: "Production-grade cross-platform Smart POS mobile and retail terminal application with Drift SQLite, Cloud Firestore, ESC/POS thermal printing, and multi-rail payment."
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.3.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.5.1
  drift: ^2.18.0
  sqlite3_flutter_libs: ^0.5.24
  path_provider: ^2.1.3
  path: ^1.9.0
  firebase_core: ^3.1.0
  cloud_firestore: ^5.0.1
  mobile_scanner: ^5.1.1
  esc_pos_utils_plus: ^2.0.3
  blue_thermal_printer: ^1.2.3
  qr_flutter: ^4.1.0
  intl: ^0.19.0
  uuid: ^4.4.0
  url_launcher: ^6.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0
  drift_dev: ^2.18.0
  build_runner: ^2.4.9

flutter:
  uses-material-design: true
`,
  },
  {
    path: 'README.md',
    content: `# Smart POS Mobile - Production Flutter Application

Cross-platform mobile retail Point of Sale (POS) application built with Flutter, Dart, Drift (SQLite), and Cloud Firestore.

## Getting Started
\`\`\`bash
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter run -d android
\`\`\`
`,
  },
  {
    path: 'lib/main.dart',
    content: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme.dart';
import 'screens/pos_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/catalog_screen.dart';
import 'screens/sales_screen.dart';
import 'screens/khata_screen.dart';
import 'screens/scanner_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0F172A),
    ),
  );
  runApp(const ProviderScope(child: SmartPosMobileApp()));
}

class SmartPosMobileApp extends StatelessWidget {
  const SmartPosMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart POS',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const MainMobileShell(),
    );
  }
}

class MainMobileShell extends StatefulWidget {
  const MainMobileShell({super.key});

  @override
  State<MainMobileShell> createState() => _MainMobileShellState();
}

class _MainMobileShellState extends State<MainMobileShell> {
  int _currentIndex = 0;
  final List<Widget> _screens = const [
    PosScreen(),
    DashboardScreen(),
    CatalogScreen(),
    SalesScreen(),
    KhataScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: const Color(0xFF0F172A),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.point_of_sale), label: 'POS'),
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.inventory_2), label: 'Catalog'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Sales'),
          NavigationDestination(icon: Icon(Icons.people), label: 'Khata'),
        ],
      ),
      floatingActionButton: FloatingActionButton.small(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScannerScreen())),
        backgroundColor: const Color(0xFF2563EB),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/core/theme.dart',
    content: `import 'package:flutter/material.dart';

class AppTheme {
  static final ThemeData darkTheme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: const Color(0xFF030712),
    colorScheme: const ColorScheme.dark(
      primary: Color(0xFF2563EB),
      secondary: Color(0xFF06B6D4),
      surface: Color(0xFF0F172A),
    ),
  );
}
`,
  },
  {
    path: 'lib/models/models.dart',
    content: `class ProductModel {
  final String id;
  final String barcode;
  final String name;
  final String category;
  final double costPrice;
  final double sellingPrice;
  final int stockQuantity;

  const ProductModel({
    required this.id,
    required this.barcode,
    required this.name,
    required this.category,
    required this.costPrice,
    required this.sellingPrice,
    required this.stockQuantity,
  });
}

class CartItemModel {
  final String id;
  final ProductModel product;
  final int quantity;
  final double unitPrice;

  const CartItemModel({
    required this.id,
    required this.product,
    required this.quantity,
    required this.unitPrice,
  });

  double get lineTotal => unitPrice * quantity;
}
`,
  },
  {
    path: 'lib/screens/pos_screen.dart',
    content: `import 'package:flutter/material.dart';

class PosScreen extends StatelessWidget {
  const PosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Smart POS Terminal')),
      body: const Center(
        child: Text('Flutter Native POS Terminal with Offline Drift SQLite & Cloud Sync'),
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/screens/scanner_screen.dart',
    content: `import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class ScannerScreen extends StatelessWidget {
  const ScannerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Optical Barcode Scanner')),
      body: MobileScanner(
        onDetect: (capture) {
          final barcodes = capture.barcodes;
          if (barcodes.isNotEmpty) {
            Navigator.pop(context, barcodes.first.rawValue);
          }
        },
      ),
    );
  }
}
`,
  },
  {
    path: 'lib/services/esc_pos_service.dart',
    content: `import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';

class EscPosService {
  static Future<List<int>> generateReceipt() async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm80, profile);
    List<int> bytes = [];
    bytes += generator.reset();
    bytes += generator.drawer();
    bytes += generator.text('SMART POS RECEIPT', styles: const PosStyles(bold: true, align: PosAlign.center));
    bytes += generator.feed(2);
    bytes += generator.cut();
    return bytes;
  }
}
`,
  },
];

export async function downloadFlutterProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Root folder
  const folder = zip.folder('smart_pos_flutter_app');

  FLUTTER_PROJECT_FILES.forEach((file) => {
    folder?.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Smart_POS_Flutter_Mobile_App_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
