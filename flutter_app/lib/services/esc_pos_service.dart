import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import '../models/models.dart';

class EscPosService {
  /// Generates ESC/POS byte commands for 80mm or 58mm thermal printers
  static Future<List<int>> generateReceiptBytes({
    required SaleModel sale,
    required String shopName,
    required String shopAddress,
    required String shopPhone,
    PaperSize paperSize = PaperSize.mm80,
  }) async {
    final profile = await CapabilityProfile.load();
    final generator = Generator(paperSize, profile);
    List<int> bytes = [];

    // Reset & kick drawer solenoid (ESC p 0 25 250)
    bytes += generator.reset();
    bytes += generator.drawer();

    // Store Header
    bytes += generator.text(
      shopName.toUpperCase(),
      styles: const PosStyles(
        align: PosAlign.center,
        height: PosTextSize.size2,
        width: PosTextSize.size2,
        bold: true,
      ),
    );
    bytes += generator.text(shopAddress, styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('Tel: $shopPhone', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text('STRN / NTN Tax Reg #: 892104-5', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.hr();

    // Invoice Meta
    bytes += generator.text('Invoice #: ${sale.invoiceNumber}');
    bytes += generator.text('Date: ${sale.createdAt.toLocal().toString().substring(0, 19)}');
    bytes += generator.text('Cashier: ${sale.cashierName}');
    if (sale.customerName != null) {
      bytes += generator.text('Customer: ${sale.customerName}');
    }
    bytes += generator.hr();

    // Line Items
    for (final item in sale.items) {
      bytes += generator.row([
        PosColumn(
          text: '${item.product.name} (x${item.quantity})',
          width: 8,
          styles: const PosStyles(align: PosAlign.left),
        ),
        PosColumn(
          text: '${item.lineTotal.toInt()}',
          width: 4,
          styles: const PosStyles(align: PosAlign.right, bold: true),
        ),
      ]);
    }
    bytes += generator.hr();

    // Financial Totals
    bytes += generator.row([
      PosColumn(text: 'Subtotal:', width: 6),
      PosColumn(text: 'PKR ${sale.subtotal.toInt()}', width: 6, styles: const PosStyles(align: PosAlign.right)),
    ]);
    bytes += generator.row([
      PosColumn(
        text: 'GRAND TOTAL:',
        width: 6,
        styles: const PosStyles(bold: true, height: PosTextSize.size2),
      ),
      PosColumn(
        text: 'PKR ${sale.grandTotal.toInt()}',
        width: 6,
        styles: const PosStyles(align: PosAlign.right, bold: true, height: PosTextSize.size2),
      ),
    ]);
    bytes += generator.text('Payment: ${sale.paymentMethod}');
    bytes += generator.hr();

    // Verification QR Code
    bytes += generator.qrcode('smartpos://verify?inv=${sale.invoiceNumber}');
    bytes += generator.text(
      'Thank you for shopping with us!\nExchange valid within 3 days with receipt.',
      styles: const PosStyles(align: PosAlign.center),
    );

    // Feed & Cut Paper
    bytes += generator.feed(2);
    bytes += generator.cut();

    return bytes;
  }
}
