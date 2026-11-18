import 'dart:convert';
import '../models/models.dart';

class EscPosService {
  /// Generates pure ESC/POS command byte buffer for 58mm or 80mm thermal printers.
  static List<int> generateReceiptBytes({
    required Sale sale,
    required Shop shop,
  }) {
    final List<int> bytes = [];
    final int lineWidth = shop.thermalPrinterWidth == PrinterWidth.mm58 ? 32 : 48;
    final String divider = '-' * lineWidth;
    final String doubleDivider = '=' * lineWidth;

    void addLine(String text) {
      bytes.addAll(utf8.encode('$text\n'));
    }

    // ESC @ (Initialize printer)
    bytes.addAll([0x1B, 0x40]);
    // Kick cash drawer pulse: ESC p 0 25 250
    bytes.addAll([0x1B, 0x70, 0x00, 0x19, 0xFA]);

    // Center align header: ESC a 1
    bytes.addAll([0x1B, 0x61, 0x01]);
    // Bold on: ESC E 1
    bytes.addAll([0x1B, 0x45, 0x01]);
    addLine(shop.name.toUpperCase());
    // Bold off: ESC E 0
    bytes.addAll([0x1B, 0x45, 0x00]);
    addLine(shop.address);
    addLine('${shop.city} | Tel: ${shop.phone}');
    addLine(doubleDivider);

    // Left align metadata: ESC a 0
    bytes.addAll([0x1B, 0x61, 0x00]);
    addLine('Invoice #: ${sale.invoiceNumber}');
    addLine('Date: ${sale.createdAt.length >= 16 ? sale.createdAt.substring(0, 16).replaceAll("T", " ") : sale.createdAt}');
    addLine('Cashier: ${sale.cashierName}');
    if (sale.customerName != null) {
      addLine('Customer: ${sale.customerName}');
    }
    addLine(divider);

    // Items
    for (final item in sale.items) {
      final qtyLabel = '${item.quantity}x ${item.product.name}';
      final priceLabel = '${shop.currency} ${item.lineTotal.toStringAsFixed(0)}';
      final spaces = (lineWidth - qtyLabel.length - priceLabel.length).clamp(1, lineWidth);
      if (qtyLabel.length + priceLabel.length + 1 <= lineWidth) {
        addLine('$qtyLabel${' ' * spaces}$priceLabel');
      } else {
        addLine(qtyLabel);
        addLine('${' ' * (lineWidth - priceLabel.length).clamp(0, lineWidth)}$priceLabel');
      }
    }
    addLine(divider);

    // Totals
    addLine('Subtotal: ${shop.currency} ${sale.subtotal.toStringAsFixed(0)}');
    if (sale.discountTotal > 0) {
      addLine('Discount: -${shop.currency} ${sale.discountTotal.toStringAsFixed(0)}');
    }
    if (sale.taxTotal > 0) {
      addLine('Tax: +${shop.currency} ${sale.taxTotal.toStringAsFixed(0)}');
    }
    if (sale.deliveryCharge > 0) {
      addLine('Delivery: +${shop.currency} ${sale.deliveryCharge.toStringAsFixed(0)}');
    }
    bytes.addAll([0x1B, 0x45, 0x01]);
    addLine('GRAND TOTAL: ${shop.currency} ${sale.grandTotal.toStringAsFixed(0)}');
    bytes.addAll([0x1B, 0x45, 0x00]);

    if (sale.payments.isNotEmpty) {
      addLine('Payment: ${sale.payments.first.method.name.toUpperCase()}');
    }
    addLine(doubleDivider);

    // Center footer
    bytes.addAll([0x1B, 0x61, 0x01]);
    addLine(shop.receiptMessage);
    addLine('*** Powered by Smart POS Pro ***');

    // Feed 3 lines & Partial Cut: GS V 66 0
    bytes.addAll([0x0A, 0x0A, 0x0A]);
    bytes.addAll([0x1D, 0x56, 0x42, 0x00]);

    return bytes;
  }

  /// Generates clean formatted text receipt for WhatsApp / Share Sheet.
  static String formatShareableText({
    required Sale sale,
    required Shop shop,
  }) {
    final buf = StringBuffer();
    buf.writeln('*${shop.name.toUpperCase()}*');
    buf.writeln('${shop.address}, ${shop.city}');
    buf.writeln('Tel: ${shop.phone}');
    buf.writeln('--------------------------------');
    buf.writeln('Invoice: *${sale.invoiceNumber}*');
    buf.writeln('Date: ${sale.createdAt.length >= 16 ? sale.createdAt.substring(0, 16).replaceAll("T", " ") : sale.createdAt}');
    buf.writeln('Cashier: ${sale.cashierName}');
    if (sale.customerName != null) {
      buf.writeln('Customer: ${sale.customerName}');
    }
    buf.writeln('--------------------------------');
    for (final item in sale.items) {
      buf.writeln('${item.quantity}x ${item.product.name} — ${shop.currency} ${item.lineTotal.toStringAsFixed(0)}');
    }
    buf.writeln('--------------------------------');
    buf.writeln('Subtotal: ${shop.currency} ${sale.subtotal.toStringAsFixed(0)}');
    if (sale.discountTotal > 0) {
      buf.writeln('Discount: -${shop.currency} ${sale.discountTotal.toStringAsFixed(0)}');
    }
    if (sale.taxTotal > 0) {
      buf.writeln('Tax: +${shop.currency} ${sale.taxTotal.toStringAsFixed(0)}');
    }
    if (sale.deliveryCharge > 0) {
      buf.writeln('Delivery: +${shop.currency} ${sale.deliveryCharge.toStringAsFixed(0)}');
    }
    buf.writeln('*GRAND TOTAL: ${shop.currency} ${sale.grandTotal.toStringAsFixed(0)}*');
    if (sale.payments.isNotEmpty) {
      buf.writeln('Paid via: ${sale.payments.first.method.name.toUpperCase()}');
    }
    buf.writeln('--------------------------------');
    buf.writeln(shop.receiptMessage);
    return buf.toString();
  }
}
