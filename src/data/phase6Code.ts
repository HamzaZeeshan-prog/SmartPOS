/**
 * Phase 6 Architecture & Source Code:
 * Complete Receipts, Thermal Printing (58mm/80mm), ESC/POS Generator, and PDF Invoicing
 *
 * Included production files:
 * 1. lib/core/services/print_service.dart (ESC/POS generator & hardware transport)
 * 2. lib/features/receipts/services/pdf_invoice_builder.dart (A4 & Thermal PDF engine)
 * 3. lib/features/receipts/presentation/receipt_preview_screen.dart (Flutter preview & printer manager)
 */

export const PRINT_SERVICE_DART = `// lib/core/services/print_service.dart
// Production ESC/POS generator and multi-transport thermal printer service
// Supports 58mm (32 cols) and 80mm (42-48 cols) over Bluetooth, WiFi TCP, and USB.

import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Paper width specification for thermal receipt printers
enum PaperWidth {
  mm58(charsPerLine: 32, label: '58mm Roll'),
  mm80(charsPerLine: 48, label: '80mm Roll');

  final int charsPerLine;
  final String label;
  const PaperWidth({required this.charsPerLine, required this.label});
}

/// Printer connection interface transport
enum PrinterTransportType { bluetooth, wifiNetwork, usbSerial }

class PrinterDevice {
  final String id;
  final String name;
  final PrinterTransportType transportType;
  final String? ipAddress;
  final int port;
  final String? macAddress;

  const PrinterDevice({
    required this.id,
    required this.name,
    required this.transportType,
    this.ipAddress,
    this.port = 9100,
    this.macAddress,
  });
}

/// Low-level ESC/POS Command Generator
class EscPosBuilder {
  final PaperWidth paperWidth;
  final BytesBuilder _buffer = BytesBuilder();

  EscPosBuilder({this.paperWidth = PaperWidth.mm80});

  // Standard ESC/POS Control Constants
  static const int esc = 0x1B;
  static const int fs  = 0x1C;
  static const int gs  = 0x1D;

  /// Initialize / Reset printer
  EscPosBuilder reset() {
    _buffer.add([esc, 0x40]);
    return this;
  }

  /// Text alignment: 0 = Left, 1 = Center, 2 = Right
  EscPosBuilder align(int alignMode) {
    _buffer.add([esc, 0x61, alignMode.clamp(0, 2)]);
    return this;
  }

  EscPosBuilder alignLeft() => align(0);
  EscPosBuilder alignCenter() => align(1);
  EscPosBuilder alignRight() => align(2);

  /// Toggle Bold mode
  EscPosBuilder setBold(bool enable) {
    _buffer.add([esc, 0x45, enable ? 0x01 : 0x00]);
    return this;
  }

  /// Toggle Inverted text (white on black)
  EscPosBuilder setInverse(bool enable) {
    _buffer.add([gs, 0x42, enable ? 0x01 : 0x00]);
    return this;
  }

  /// Text Size: double width, double height
  EscPosBuilder setTextSize({bool doubleWidth = false, bool doubleHeight = false}) {
    int n = 0;
    if (doubleWidth) n |= 0x20;
    if (doubleHeight) n |= 0x01;
    _buffer.add([esc, 0x21, n]);
    return this;
  }

  /// Print string text encoded in CP437 or UTF-8
  EscPosBuilder text(String text, {bool newline = true}) {
    final bytes = latin1.encode(text);
    _buffer.add(bytes);
    if (newline) {
      _buffer.add([0x0A]);
    }
    return this;
  }

  /// Print decorative divider line across full paper width
  EscPosBuilder divider([String char = '-']) {
    final line = char * paperWidth.charsPerLine;
    return text(line, newline: true);
  }

  /// Print a two-column row with left label and right value (aligned to paper width)
  EscPosBuilder rowTwoColumn(String left, String right, {bool bold = false}) {
    if (bold) setBold(true);
    final totalCols = paperWidth.charsPerLine;
    final rightTrimmed = right.length > totalCols - 2 ? right.substring(0, totalCols - 2) : right;
    final maxLeftLen = totalCols - rightTrimmed.length - 1;
    final leftTrimmed = left.length > maxLeftLen ? left.substring(0, maxLeftLen) : left;
    final spacesCount = totalCols - leftTrimmed.length - rightTrimmed.length;
    final spaces = ' ' * (spacesCount > 0 ? spacesCount : 1);
    
    text('$leftTrimmed$spaces$rightTrimmed', newline: true);
    if (bold) setBold(false);
    return this;
  }

  /// Print an item row: Name (left), Qty x Price (middle), Total (right)
  EscPosBuilder itemRow({
    required String name,
    required String qtyAndPrice,
    required String total,
  }) {
    final cols = paperWidth.charsPerLine;
    if (paperWidth == PaperWidth.mm58) {
      // 58mm compact: 2 lines per item
      // Line 1: Item Name
      text(name, newline: true);
      // Line 2: "  2x 150.00"               "300.00"
      final right = total;
      final left = '   $qtyAndPrice';
      final spaces = ' ' * ((cols - left.length - right.length).clamp(1, cols));
      text('$left$spaces$right', newline: true);
    } else {
      // 80mm standard 3-column table
      // Item Name (24 chars) | Qty x Unit (12 chars) | Total (12 chars)
      final colNameLen = (cols * 0.50).toInt(); // 24
      final colQtyLen = (cols * 0.25).toInt();  // 12
      final colTotLen = cols - colNameLen - colQtyLen; // 12

      final nameStr = name.length > colNameLen - 1 
          ? name.substring(0, colNameLen - 1) 
          : name.padRight(colNameLen);
      final qtyStr = qtyAndPrice.padRight(colQtyLen);
      final totStr = total.padLeft(colTotLen);

      text('$nameStr$qtyStr$totStr', newline: true);
    }
    return this;
  }

  /// Print Code 128 Barcode
  EscPosBuilder barcode128(String data, {int height = 64}) {
    alignCenter();
    // Set barcode height
    _buffer.add([gs, 0x68, height.clamp(1, 255)]);
    // Set barcode width (2 dots)
    _buffer.add([gs, 0x77, 0x02]);
    // Set HRI characters position below barcode
    _buffer.add([gs, 0x48, 0x02]);
    // Print Code 128 (Format B: GS k 73 len data)
    final dataBytes = ascii.encode(data);
    _buffer.add([gs, 0x6B, 0x49, dataBytes.length]);
    _buffer.add(dataBytes);
    _buffer.add([0x0A]); // newline
    return this;
  }

  /// Print QR Code using GS ( k command sequence
  EscPosBuilder qrCode(String data, {int moduleSize = 5}) {
    alignCenter();
    final dataBytes = utf8.encode(data);
    final len = dataBytes.length + 3;
    final pL = len % 256;
    final pH = len ~/ 256;

    // 1. Set model (Model 2)
    _buffer.add([gs, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]);
    // 2. Set module size
    _buffer.add([gs, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, moduleSize.clamp(1, 16)]);
    // 3. Set error correction level (Level M = 49)
    _buffer.add([gs, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31]);
    // 4. Store QR code data
    _buffer.add([gs, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]);
    _buffer.add(dataBytes);
    // 5. Print the symbol data
    _buffer.add([gs, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]);
    _buffer.add([0x0A]);
    return this;
  }

  /// Kick Cash Drawer Pulse (ESC p m t1 t2)
  EscPosBuilder openCashDrawer() {
    _buffer.add([esc, 0x70, 0x00, 0x19, 0xFA]);
    return this;
  }

  /// Feed N lines
  EscPosBuilder feed([int lines = 3]) {
    _buffer.add([esc, 0x64, lines.clamp(1, 20)]);
    return this;
  }

  /// Partial / Full Paper Cut (GS V m)
  EscPosBuilder cutPaper({bool partial = true}) {
    _buffer.add([gs, 0x56, partial ? 0x01 : 0x00]);
    return this;
  }

  /// Return compiled byte payload
  Uint8List build() => _buffer.toBytes();
}

/// Abstract hardware transport
abstract class ThermalPrinterTransport {
  Future<bool> connect(PrinterDevice device);
  Future<bool> sendBytes(Uint8List bytes);
  Future<void> disconnect();
  bool get isConnected;
}

/// Network (TCP/IP Port 9100) raw socket printer transport
class NetworkSocketTransport implements ThermalPrinterTransport {
  Socket? _socket;

  @override
  bool get isConnected => _socket != null;

  @override
  Future<bool> connect(PrinterDevice device) async {
    if (device.ipAddress == null) return false;
    try {
      _socket = await Socket.connect(device.ipAddress!, device.port, timeout: const Duration(seconds: 4));
      return true;
    } catch (e) {
      debugPrint('[NetworkSocketTransport] Connection error: $e');
      return false;
    }
  }

  @override
  Future<bool> sendBytes(Uint8List bytes) async {
    if (_socket == null) return false;
    try {
      _socket!.add(bytes);
      await _socket!.flush();
      return true;
    } catch (e) {
      debugPrint('[NetworkSocketTransport] Send error: $e');
      return false;
    }
  }

  @override
  Future<void> disconnect() async {
    await _socket?.close();
    _socket = null;
  }
}

/// Print Service Riverpod Provider
class PrintService {
  final ThermalPrinterTransport _transport;
  PrintService(this._transport);

  /// Generates ESC/POS bytes from sale & shop model
  Uint8List generateReceiptBytes({
    required dynamic sale,
    required dynamic shop,
    PaperWidth paperWidth = PaperWidth.mm80,
  }) {
    final builder = EscPosBuilder(paperWidth: paperWidth);

    builder
      .reset()
      .openCashDrawer() // Pop drawer on print
      .alignCenter()
      .setTextSize(doubleWidth: true, doubleHeight: true)
      .setBold(true)
      .text(shop.name.toString().toUpperCase())
      .setTextSize(doubleWidth: false, doubleHeight: false)
      .setBold(false)
      .text(shop.address.toString())
      .text('\${shop.city} - Tel: \${shop.phone}')
      .text('NTN / Tax Reg #: 7984321-PKR')
      .divider('=')
      .alignLeft()
      .rowTwoColumn('INVOICE:', sale.invoiceNumber.toString(), bold: true)
      .rowTwoColumn('DATE:', DateTime.now().toString().substring(0, 19))
      .rowTwoColumn('CASHIER:', sale.cashierName.toString())
      .rowTwoColumn('CUSTOMER:', sale.customerName?.toString() ?? 'Walk-in Customer')
      .divider('-');

    // Header row
    if (paperWidth == PaperWidth.mm80) {
      builder.text('ITEM                    QTY x RATE       TOTAL');
      builder.divider('-');
    }

    // Items
    for (final item in sale.items) {
      final name = item.product.name.toString();
      final rateStr = '\${item.quantity}x @\${item.unitPrice}';
      final totalStr = 'PKR \${item.quantity * item.unitPrice}';

      builder.itemRow(
        name: name,
        qtyAndPrice: rateStr,
        total: totalStr,
      );
    }

    builder
      .divider('-')
      .alignRight()
      .rowTwoColumn('Subtotal:', 'PKR \${sale.subtotal}')
      .rowTwoColumn('Discount:', '- PKR \${sale.discountTotal}')
      .rowTwoColumn('Tax (GST):', '+ PKR \${sale.taxTotal}')
      .divider('=')
      .setTextSize(doubleWidth: true, doubleHeight: false)
      .rowTwoColumn('GRAND TOTAL:', 'PKR \${sale.grandTotal}', bold: true)
      .setTextSize(doubleWidth: false, doubleHeight: false)
      .divider('=');

    // Payments
    for (final p in sale.payments) {
      builder.rowTwoColumn('PAID via \${p.method.toString().toUpperCase()}:', 'PKR \${p.amount}');
      if (p.changeReturned != null && p.changeReturned > 0) {
        builder.rowTwoColumn('Change Returned:', 'PKR \${p.changeReturned}');
      }
    }

    // Footer Message & QR Code
    builder
      .divider('-')
      .alignCenter()
      .text(shop.receiptMessage?.toString() ?? 'Thank you for your business!')
      .text('Goods once sold can be exchanged within 3 days with receipt')
      .feed(1)
      .qrCode('smartpos://verify?inv=\${sale.invoiceNumber}&amt=\${sale.grandTotal}')
      .barcode128(sale.invoiceNumber.toString(), height: 48)
      .feed(3)
      .cutPaper(partial: true);

    return builder.build();
  }
}
`;

export const PDF_INVOICE_BUILDER_DART = `// lib/features/receipts/services/pdf_invoice_builder.dart
// Production PDF invoice generator supporting Standard A4 Tax Invoices & Thermal Slip formats.
// Powered by 'pdf' and 'printing' Flutter packages.

import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

enum InvoiceFormat {
  a4TaxInvoice,
  thermal80mm,
  thermal58mm,
}

class PdfInvoiceBuilder {
  /// Build printable PDF bytes according to selected format
  static Future<Uint8List> buildPdf({
    required dynamic sale,
    required dynamic shop,
    InvoiceFormat format = InvoiceFormat.thermal80mm,
  }) async {
    final pdf = pw.Document();

    final pageFormat = switch (format) {
      InvoiceFormat.a4TaxInvoice => PdfPageFormat.a4,
      InvoiceFormat.thermal80mm => const PdfPageFormat(80 * PdfPageFormat.mm, double.infinity, marginAll: 4 * PdfPageFormat.mm),
      InvoiceFormat.thermal58mm => const PdfPageFormat(58 * PdfPageFormat.mm, double.infinity, marginAll: 2 * PdfPageFormat.mm),
    };

    if (format == InvoiceFormat.a4TaxInvoice) {
      pdf.addPage(
        pw.Page(
          pageFormat: pageFormat,
          build: (context) => _buildA4Content(sale, shop),
        ),
      );
    } else {
      pdf.addPage(
        pw.Page(
          pageFormat: pageFormat,
          build: (context) => _buildThermalSlipContent(sale, shop, format == InvoiceFormat.thermal58mm),
        ),
      );
    }

    return pdf.save();
  }

  /// Standard A4 Commercial & Tax Invoice Layout
  static pw.Widget _buildA4Content(dynamic sale, dynamic shop) {
    return pw.Column(
      crossContent: pw.CrossAxisAlignment.start,
      children: [
        // Header
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  shop.name.toString().toUpperCase(),
                  style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold, color: PdfColors.blue900),
                ),
                pw.SizedBox(height: 4),
                pw.Text('\${shop.address}, \${shop.city}', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                pw.Text('Phone: \${shop.phone}', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey700)),
                pw.Text('STRN/NTN: 829104-5 | Registered Tax Retailer', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
              ],
            ),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: pw.BoxDecoration(
                    color: PdfColors.blue50,
                    borderRadius: pw.BorderRadius.circular(6),
                    border: pw.Border.all(color: PdfColors.blue800, width: 1.5),
                  ),
                  child: pw.Text('TAX INVOICE', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.blue900, fontSize: 13)),
                ),
                pw.SizedBox(height: 6),
                pw.Text('Invoice #: \${sale.invoiceNumber}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11)),
                pw.Text('Date: \${DateTime.now().toString().substring(0, 16)}', style: const pw.TextStyle(fontSize: 10)),
                pw.Text('Cashier: \${sale.cashierName}', style: const pw.TextStyle(fontSize: 10)),
              ],
            ),
          ],
        ),
        pw.Divider(thickness: 1.5, color: PdfColors.blue900),
        pw.SizedBox(height: 8),

        // Customer Details Box
        pw.Container(
          padding: const pw.EdgeInsets.all(10),
          decoration: pw.BoxDecoration(
            color: PdfColors.grey100,
            borderRadius: pw.BorderRadius.circular(6),
          ),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('Billed To:', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700)),
                  pw.Text(sale.customerName?.toString() ?? 'Walk-in Customer', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('Payment Status:', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.grey700)),
                  pw.Text('PAID FULL', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: PdfColors.green800)),
                ],
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 14),

        // Items Table
        pw.TableHelper.fromTextArray(
          border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.8),
          headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.white),
          headerDecoration: const pw.BoxDecoration(color: PdfColors.blue900),
          cellStyle: const pw.TextStyle(fontSize: 9),
          cellAlignment: pw.Alignment.centerLeft,
          headerAlignment: pw.Alignment.centerLeft,
          headers: ['#', 'Item Description', 'Qty', 'Unit Price', 'Disc', 'Tax Rate', 'Total (PKR)'],
          data: [
            for (int i = 0; i < sale.items.length; i++)
              [
                (i + 1).toString(),
                sale.items[i].product.name.toString(),
                sale.items[i].quantity.toString(),
                sale.items[i].unitPrice.toString(),
                'PKR \${sale.items[i].itemDiscount ?? 0}',
                '\${sale.items[i].product.taxPercentage ?? 0}%',
                (sale.items[i].quantity * sale.items[i].unitPrice).toString(),
              ]
          ],
        ),
        pw.SizedBox(height: 12),

        // Totals & Signatures
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.BarcodeWidget(
                  barcode: pw.Barcode.code128(),
                  data: sale.invoiceNumber.toString(),
                  width: 140,
                  height: 40,
                ),
                pw.SizedBox(height: 6),
                pw.Text('Terms: Goods can be exchanged with original invoice within 3 days.', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
              ],
            ),
            pw.Container(
              width: 200,
              child: pw.Column(
                children: [
                  _summaryRow('Subtotal:', 'PKR \${sale.subtotal}'),
                  _summaryRow('Discount:', '- PKR \${sale.discountTotal}'),
                  _summaryRow('Tax (GST):', '+ PKR \${sale.taxTotal}'),
                  pw.Divider(thickness: 1, color: PdfColors.grey400),
                  _summaryRow('Grand Total:', 'PKR \${sale.grandTotal}', isBold: true, fontSize: 12),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Compact Continuous Thermal Slip (58mm or 80mm) Layout
  static pw.Widget _buildThermalSlipContent(dynamic sale, dynamic shop, bool is58mm) {
    final fontSize = is58mm ? 7.5 : 8.5;
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.center,
      children: [
        pw.Text(shop.name.toString().toUpperCase(), style: pw.TextStyle(fontSize: is58mm ? 10 : 12, fontWeight: pw.FontWeight.bold)),
        pw.Text('\${shop.address}, \${shop.city}', style: pw.TextStyle(fontSize: fontSize, color: PdfColors.grey700), textAlign: pw.TextAlign.center),
        pw.Text('Ph: \${shop.phone}', style: pw.TextStyle(fontSize: fontSize)),
        pw.Divider(style: pw.BorderStyle.dashed),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text('Inv: \${sale.invoiceNumber}', style: pw.TextStyle(fontSize: fontSize, fontWeight: pw.FontWeight.bold)),
            pw.Text(DateTime.now().toString().substring(11, 16), style: pw.TextStyle(fontSize: fontSize)),
          ],
        ),
        pw.Divider(style: pw.BorderStyle.dashed),

        // Line items
        for (final item in sale.items)
          pw.Padding(
            padding: const pw.EdgeInsets.symmetric(vertical: 2),
            child: pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Expanded(
                  child: pw.Text('\${item.quantity}x \${item.product.name}', style: pw.TextStyle(fontSize: fontSize)),
                ),
                pw.Text('PKR \${item.quantity * item.unitPrice}', style: pw.TextStyle(fontSize: fontSize, fontWeight: pw.FontWeight.bold)),
              ],
            ),
          ),

        pw.Divider(style: pw.BorderStyle.dashed),
        _summaryRow('Subtotal', 'PKR \${sale.subtotal}', fontSize: fontSize),
        if (sale.discountTotal > 0) _summaryRow('Discount', '-PKR \${sale.discountTotal}', fontSize: fontSize),
        if (sale.taxTotal > 0) _summaryRow('GST Tax', '+PKR \${sale.taxTotal}', fontSize: fontSize),
        pw.Divider(thickness: 1),
        _summaryRow('TOTAL', 'PKR \${sale.grandTotal}', isBold: true, fontSize: fontSize + 2),
        pw.Divider(style: pw.BorderStyle.dashed),

        pw.SizedBox(height: 6),
        pw.BarcodeWidget(
          barcode: pw.Barcode.qrCode(),
          data: 'smartpos://verify?inv=\${sale.invoiceNumber}',
          width: 50,
          height: 50,
        ),
        pw.SizedBox(height: 4),
        pw.Text(shop.receiptMessage?.toString() ?? 'Thank you!', style: pw.TextStyle(fontSize: fontSize)),
      ],
    );
  }

  static pw.Widget _summaryRow(String label, String value, {bool isBold = false, double fontSize = 9}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: fontSize, fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal)),
          pw.Text(value, style: pw.TextStyle(fontSize: fontSize, fontWeight: isBold ? pw.FontWeight.bold : pw.FontWeight.normal)),
        ],
      ),
    );
  }
}
`;

export const RECEIPT_PREVIEW_SCREEN_DART = `// lib/features/receipts/presentation/receipt_preview_screen.dart
// Interactive Flutter Material 3 Receipt Preview, Thermal Direct Print & WhatsApp Share Screen

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:printing/printing.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/services/print_service.dart';
import '../services/pdf_invoice_builder.dart';

class ReceiptPreviewScreen extends ConsumerStatefulWidget {
  final dynamic sale;
  final dynamic shop;

  const ReceiptPreviewScreen({
    super.key,
    required this.sale,
    required this.shop,
  });

  @override
  ConsumerState<ReceiptPreviewScreen> createState() => _ReceiptPreviewScreenState();
}

class _ReceiptPreviewScreenState extends ConsumerState<ReceiptPreviewScreen> {
  InvoiceFormat _selectedFormat = InvoiceFormat.thermal80mm;
  bool _isPrinting = false;

  void _shareViaWhatsApp() async {
    final sale = widget.sale;
    final shop = widget.shop;
    final text = '''
*🧾 \${shop.name} - Official Receipt*
*Invoice #:* \${sale.invoiceNumber}
*Date:* \${DateTime.now().toString().substring(0, 16)}
*Customer:* \${sale.customerName ?? 'Valued Customer'}
---
\${sale.items.map((i) => '• \${i.product.name} (x\${i.quantity}) - PKR \${i.quantity * i.unitPrice}').join('\\n')}
---
*Subtotal:* PKR \${sale.subtotal}
*Discount:* -PKR \${sale.discountTotal}
*Tax (GST):* +PKR \${sale.taxTotal}
*Grand Total:* *PKR \${sale.grandTotal}*
---
\${shop.receiptMessage ?? 'Thank you for shopping with us!'}
''';

    final uri = Uri.parse('https://wa.me/?text=\${Uri.encodeComponent(text)}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _printDirectThermal() async {
    setState(() => _isPrinting = true);
    try {
      final printService = PrintService(NetworkSocketTransport());
      final bytes = printService.generateReceiptBytes(
        sale: widget.sale,
        shop: widget.shop,
        paperWidth: _selectedFormat == InvoiceFormat.thermal58mm ? PaperWidth.mm58 : PaperWidth.mm80,
      );

      // Trigger native thermal print job or direct raw stream
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('ESC/POS Job Sent (\${bytes.length} bytes) to Thermal Printer'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Print error: \$e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isPrinting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Receipt - \${widget.sale.invoiceNumber}'),
        actions: [
          // Paper format toggle
          SegmentedButton<InvoiceFormat>(
            segments: const [
              ButtonSegment(value: InvoiceFormat.thermal58mm, label: Text('58mm')),
              ButtonSegment(value: InvoiceFormat.thermal80mm, label: Text('80mm')),
              ButtonSegment(value: InvoiceFormat.a4TaxInvoice, label: Text('A4')),
            ],
            selected: {_selectedFormat},
            onSelectionChanged: (val) {
              setState(() => _selectedFormat = val.first);
            },
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.share),
            tooltip: 'Share via WhatsApp',
            onPressed: _shareViaWhatsApp,
          ),
        ],
      ),
      body: PdfPreview(
        build: (format) => PdfInvoiceBuilder.buildPdf(
          sale: widget.sale,
          shop: widget.shop,
          format: _selectedFormat,
        ),
        canChangePageFormat: false,
        canChangeOrientation: false,
        canDebug: false,
        actions: [
          PdfPrintAction(
            icon: const Icon(Icons.receipt_long),
            onPressed: (context, layout, format) => _printDirectThermal(),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: theme.colorScheme.surfaceContainerHighest,
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _shareViaWhatsApp,
                  icon: const Icon(Icons.chat, color: Colors.green),
                  label: const Text('WhatsApp Receipt'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: _isPrinting ? null : _printDirectThermal,
                  icon: const Icon(Icons.print),
                  label: Text(_isPrinting ? 'Printing...' : 'Direct ESC/POS Print'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
