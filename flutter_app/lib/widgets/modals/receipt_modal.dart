import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../services/esc_pos_service.dart';
import '../../services/pdf_receipt_service.dart';
import '../../store/app_store.dart';

class ReceiptModal extends StatefulWidget {
  final Sale sale;

  const ReceiptModal({super.key, required this.sale});

  @override
  State<ReceiptModal> createState() => _ReceiptModalState();
}

class _ReceiptModalState extends State<ReceiptModal> {
  late PrinterWidth _previewWidth;
  bool _isSharingPdf = false;

  @override
  void initState() {
    super.initState();
    _previewWidth = context.read<AppStore>().activeShop.thermalPrinterWidth;
  }

  Future<void> _sharePdf(AppStore store, Sale sale, Shop shop, bool is58mm) async {
    setState(() => _isSharingPdf = true);
    try {
      await PdfReceiptService.shareReceiptPdf(
        sale: sale,
        shop: shop,
        rollWidth: is58mm ? '58mm' : '80mm',
      );
    } catch (e) {
      store.showToast('Could not share PDF receipt: $e');
    } finally {
      if (mounted) setState(() => _isSharingPdf = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final shop = store.activeShop;
    final sale = widget.sale;
    final is58mm = _previewWidth == PrinterWidth.mm58;

    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: const BoxDecoration(
        color: AppTheme.slate900,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(top: BorderSide(color: AppTheme.slate800)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(color: AppTheme.slate700, borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 12, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    const Icon(Icons.receipt_long, color: AppTheme.blue400, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Receipt #${sale.invoiceNumber}',
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    IconButton(
                      tooltip: 'Copy Text Receipt',
                      visualDensity: VisualDensity.compact,
                      onPressed: () {
                        final text = EscPosService.formatShareableText(sale: sale, shop: shop);
                        Clipboard.setData(ClipboardData(text: text));
                        store.showToast('Receipt text copied to clipboard');
                      },
                      icon: const Icon(Icons.copy, color: AppTheme.slate400, size: 18),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close, color: AppTheme.slate400),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Text('Roll Width:', style: TextStyle(color: AppTheme.slate400, fontSize: 11)),
                    const SizedBox(width: 8),
                    SegmentedButton<PrinterWidth>(
                      style: SegmentedButton.styleFrom(
                        visualDensity: VisualDensity.compact,
                        selectedBackgroundColor: AppTheme.blue600,
                        selectedForegroundColor: Colors.white,
                      ),
                      segments: const [
                        ButtonSegment(value: PrinterWidth.mm58, label: Text('58mm', style: TextStyle(fontSize: 10))),
                        ButtonSegment(value: PrinterWidth.mm80, label: Text('80mm', style: TextStyle(fontSize: 10))),
                      ],
                      selected: {_previewWidth},
                      onSelectionChanged: (s) => setState(() => _previewWidth = s.first),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(color: AppTheme.slate800, height: 1),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(14),
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: is58mm ? 260 : 320,
                    padding: EdgeInsets.all(is58mm ? 12 : 16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(4),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 12),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          shop.name.toUpperCase(),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.black,
                            fontFamily: 'monospace',
                            fontSize: is58mm ? 14 : 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${shop.address}, ${shop.city}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.black87, fontFamily: 'monospace', fontSize: 10),
                        ),
                        Text(
                          'Ph: ${shop.phone}',
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.black87, fontFamily: 'monospace', fontSize: 10),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          '================================',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black54, fontFamily: 'monospace', fontSize: 10),
                        ),

                        _buildReceiptRow('Invoice:', sale.invoiceNumber),
                        _buildReceiptRow(
                          'Date/Time:',
                          sale.createdAt.length >= 16
                              ? sale.createdAt.substring(0, 16).replaceAll('T', ' ')
                              : sale.createdAt,
                        ),
                        _buildReceiptRow('Cashier:', sale.cashierName),
                        if (sale.customerName != null) _buildReceiptRow('Customer:', sale.customerName!),

                        const Text(
                          '--------------------------------',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black54, fontFamily: 'monospace', fontSize: 10),
                        ),

                        const Row(
                          children: [
                            Expanded(child: Text('ITEM', style: TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 28, child: Text('QTY', textAlign: TextAlign.center, style: TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 44, child: Text('PRICE', textAlign: TextAlign.right, style: TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.bold))),
                            SizedBox(width: 50, child: Text('TOTAL', textAlign: TextAlign.right, style: TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.bold))),
                          ],
                        ),
                        const SizedBox(height: 4),

                        ...sale.items.map((item) {
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        item.product.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10),
                                      ),
                                    ),
                                    SizedBox(
                                      width: 28,
                                      child: Text('${item.quantity}', textAlign: TextAlign.center, style: const TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10)),
                                    ),
                                    SizedBox(
                                      width: 44,
                                      child: Text(item.unitPrice.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10)),
                                    ),
                                    SizedBox(
                                      width: 50,
                                      child: Text(item.lineTotal.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                  ],
                                ),
                                if (item.itemDiscount > 0)
                                  Text(
                                    '  Disc: -${shop.currency} ${item.itemDiscount.round()}',
                                    style: const TextStyle(color: Colors.black54, fontFamily: 'monospace', fontSize: 9),
                                  ),
                                if (item.note != null && item.note!.isNotEmpty)
                                  Text(
                                    '  Note: ${item.note}',
                                    style: const TextStyle(color: Colors.black54, fontFamily: 'monospace', fontSize: 9, fontStyle: FontStyle.italic),
                                  ),
                              ],
                            ),
                          );
                        }),

                        const Text(
                          '--------------------------------',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black54, fontFamily: 'monospace', fontSize: 10),
                        ),

                        _buildReceiptRow('Subtotal:', '${shop.currency} ${sale.subtotal.toStringAsFixed(0)}'),
                        if (sale.discountTotal > 0)
                          _buildReceiptRow('Discount:', '- ${shop.currency} ${sale.discountTotal.toStringAsFixed(0)}'),
                        if (sale.taxTotal > 0)
                          _buildReceiptRow('Tax:', '+ ${shop.currency} ${sale.taxTotal.toStringAsFixed(0)}'),
                        if (sale.deliveryCharge > 0)
                          _buildReceiptRow('Delivery:', '+ ${shop.currency} ${sale.deliveryCharge.toStringAsFixed(0)}'),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('GRAND TOTAL:', style: TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 12, fontWeight: FontWeight.w900)),
                            Text('${shop.currency} ${sale.grandTotal.toStringAsFixed(0)}', style: const TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 14, fontWeight: FontWeight.w900)),
                          ],
                        ),

                        const Text(
                          '================================',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black54, fontFamily: 'monospace', fontSize: 10),
                        ),

                        if (sale.payments.isNotEmpty) ...[
                          ...sale.payments.map((p) => Column(
                                children: [
                                  _buildReceiptRow('Paid (${p.method.name.toUpperCase()}):', '${shop.currency} ${p.amount.toStringAsFixed(0)}'),
                                  if (p.cashReceived != null)
                                    _buildReceiptRow('Cash Given:', '${shop.currency} ${p.cashReceived!.toStringAsFixed(0)}'),
                                  if (p.changeReturned != null && p.changeReturned! > 0)
                                    _buildReceiptRow('Change:', '${shop.currency} ${p.changeReturned!.toStringAsFixed(0)}'),
                                  if (p.referenceNumber != null)
                                    _buildReceiptRow('Ref:', p.referenceNumber!),
                                ],
                              )),
                        ],

                        const SizedBox(height: 8),
                        Text(
                          shop.receiptMessage,
                          textAlign: TextAlign.center,
                          style: const TextStyle(color: Colors.black87, fontFamily: 'monospace', fontSize: 9, fontStyle: FontStyle.italic),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '*** Software by Smart POS Pro ***',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.black45, fontFamily: 'monospace', fontSize: 8),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),

          Container(
            padding: const EdgeInsets.all(14),
            decoration: const BoxDecoration(
              color: AppTheme.slate950,
              border: Border(top: BorderSide(color: AppTheme.slate800)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.emerald400,
                      side: const BorderSide(color: AppTheme.emerald600),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: _isSharingPdf
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.emerald400))
                        : const Icon(Icons.picture_as_pdf, size: 18),
                    label: Text(_isSharingPdf ? 'Creating PDF...' : 'Share PDF', overflow: TextOverflow.ellipsis),
                    onPressed: _isSharingPdf ? null : () => _sharePdf(store, sale, shop, is58mm),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.blue600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.print, size: 18),
                    label: Text('Print ${is58mm ? '58mm' : '80mm'}', overflow: TextOverflow.ellipsis),
                    onPressed: () {
                      final bytes = EscPosService.generateReceiptBytes(sale: sale, shop: shop);
                      store.showToast('ESC/POS Buffer (${bytes.length} bytes) ready for ${is58mm ? '58mm' : '80mm'} thermal printer!');
                      Navigator.pop(context);
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black87, fontFamily: 'monospace', fontSize: 10)),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              value,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.black, fontFamily: 'monospace', fontSize: 10, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
