import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../models/models.dart';
import 'pdf_file_helper_stub.dart' if (dart.library.io) 'pdf_file_helper_io.dart';

class PdfReceiptService {
  static Future<Uint8List> buildReceiptPdf({
    required Sale sale,
    required Shop shop,
    String? rollWidth,
  }) async {
    final doc = pw.Document();
    final is58 = (rollWidth ?? (shop.thermalPrinterWidth == PrinterWidth.mm58 ? '58mm' : '80mm')) == '58mm';
    final pageFormat = PdfPageFormat(
      (is58 ? 58 : 80) * PdfPageFormat.mm,
      double.infinity,
      marginAll: 4 * PdfPageFormat.mm,
    );

    final formattedDate = _formatDate(sale.createdAt);
    final paymentText = sale.payments.isNotEmpty
        ? sale.payments.map((p) => p.method.name.toUpperCase()).join(', ')
        : 'CASH';
    final totalPaid = sale.payments.fold<double>(0.0, (s, p) => s + p.amount);
    final changeDue = sale.payments.fold<double>(0.0, (s, p) => s + (p.changeReturned ?? 0.0));

    doc.addPage(
      pw.Page(
        pageFormat: pageFormat,
        build: (pw.Context ctx) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: [
              pw.Text(
                shop.name.toUpperCase(),
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: is58 ? 11 : 13, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 2),
              pw.Text(
                '${shop.address}, ${shop.city}',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: is58 ? 7 : 8),
              ),
              pw.Text(
                'Tel: ${shop.phone}',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: is58 ? 7 : 8),
              ),
              pw.SizedBox(height: 5),
              pw.Divider(thickness: 0.7),
              _metaRow('Invoice:', sale.invoiceNumber, is58),
              _metaRow('Date:', formattedDate, is58),
              _metaRow('Cashier:', sale.cashierName, is58),
              if (sale.customerName != null && sale.customerName!.isNotEmpty)
                _metaRow('Customer:', sale.customerName!, is58),
              pw.SizedBox(height: 3),
              pw.Divider(thickness: 0.7),
              pw.Row(
                children: [
                  pw.Expanded(
                    flex: 5,
                    child: pw.Text('ITEM', style: pw.TextStyle(fontSize: is58 ? 7 : 8, fontWeight: pw.FontWeight.bold)),
                  ),
                  pw.Expanded(
                    flex: 2,
                    child: pw.Text('QTY', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: is58 ? 7 : 8, fontWeight: pw.FontWeight.bold)),
                  ),
                  pw.Expanded(
                    flex: 3,
                    child: pw.Text('AMT', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: is58 ? 7 : 8, fontWeight: pw.FontWeight.bold)),
                  ),
                ],
              ),
              pw.Divider(thickness: 0.5),
              ...sale.items.map((item) => pw.Padding(
                    padding: const pw.EdgeInsets.symmetric(vertical: 2),
                    child: pw.Row(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Expanded(
                          flex: 5,
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text(item.product.name, style: pw.TextStyle(fontSize: is58 ? 7.5 : 8.5, fontWeight: pw.FontWeight.bold)),
                              pw.Text(
                                '${shop.currency} ${item.unitPrice.toStringAsFixed(0)} x ${item.quantity}',
                                style: pw.TextStyle(fontSize: is58 ? 6.5 : 7.5, color: PdfColors.grey700),
                              ),
                            ],
                          ),
                        ),
                        pw.Expanded(
                          flex: 2,
                          child: pw.Text('${item.quantity}', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: is58 ? 7.5 : 8.5)),
                        ),
                        pw.Expanded(
                          flex: 3,
                          child: pw.Text(
                            item.lineTotal.toStringAsFixed(0),
                            textAlign: pw.TextAlign.right,
                            style: pw.TextStyle(fontSize: is58 ? 7.5 : 8.5, fontWeight: pw.FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  )),
              pw.Divider(thickness: 0.7),
              _totalRow('Subtotal', '${shop.currency} ${sale.subtotal.toStringAsFixed(0)}', is58),
              if (sale.discountTotal > 0)
                _totalRow('Discount', '- ${shop.currency} ${sale.discountTotal.toStringAsFixed(0)}', is58),
              if (sale.deliveryCharge > 0)
                _totalRow('Delivery', '${shop.currency} ${sale.deliveryCharge.toStringAsFixed(0)}', is58),
              if (sale.taxTotal > 0)
                _totalRow('GST / Tax', '${shop.currency} ${sale.taxTotal.toStringAsFixed(0)}', is58),
              pw.SizedBox(height: 3),
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 4),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(width: 0.8),
                  borderRadius: pw.BorderRadius.circular(2),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('NET TOTAL', style: pw.TextStyle(fontSize: is58 ? 9 : 10.5, fontWeight: pw.FontWeight.bold)),
                    pw.Text(
                      '${shop.currency} ${sale.grandTotal.toStringAsFixed(0)}',
                      style: pw.TextStyle(fontSize: is58 ? 9 : 10.5, fontWeight: pw.FontWeight.bold),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 4),
              _totalRow('Payment Mode', paymentText, is58),
              _totalRow('Amount Paid', '${shop.currency} ${totalPaid.toStringAsFixed(0)}', is58),
              if (changeDue > 0)
                _totalRow('Change Returned', '${shop.currency} ${changeDue.toStringAsFixed(0)}', is58),
              pw.SizedBox(height: 6),
              pw.Divider(thickness: 0.5),
              pw.SizedBox(height: 3),
              pw.Text(
                shop.receiptMessage,
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: is58 ? 7.5 : 8.5, fontStyle: pw.FontStyle.italic),
              ),
              pw.SizedBox(height: 2),
              pw.Text(
                'Powered by ${shop.name}',
                textAlign: pw.TextAlign.center,
                style: pw.TextStyle(fontSize: 6.5, color: PdfColors.grey600),
              ),
            ],
          );
        },
      ),
    );

    return doc.save();
  }

  static pw.Widget _metaRow(String label, String val, bool is58) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: is58 ? 7 : 8, color: PdfColors.grey700)),
          pw.Flexible(
            child: pw.Text(
              val,
              textAlign: pw.TextAlign.right,
              style: pw.TextStyle(fontSize: is58 ? 7 : 8, fontWeight: pw.FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  static pw.Widget _totalRow(String label, String val, bool is58) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: is58 ? 7.5 : 8.5)),
          pw.Text(val, style: pw.TextStyle(fontSize: is58 ? 7.5 : 8.5, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }

  static String _formatDate(String iso) {
    try {
      return DateFormat('dd MMM yyyy hh:mm a').format(DateTime.parse(iso));
    } catch (_) {
      return iso;
    }
  }

  static Future<void> shareReceiptPdf({
    required Sale sale,
    required Shop shop,
    String? rollWidth,
  }) async {
    final bytes = await buildReceiptPdf(sale: sale, shop: shop, rollWidth: rollWidth);
    final safeInv = sale.invoiceNumber.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    final fileName = 'Receipt_$safeInv.pdf';

    await sharePdfBytes(
      bytes: bytes,
      fileName: fileName,
      subject: '${shop.name} Receipt ${sale.invoiceNumber}',
      text: 'Receipt ${sale.invoiceNumber} from ${shop.name} — Total: ${shop.currency} ${sale.grandTotal.toStringAsFixed(0)}',
    );
  }
}
