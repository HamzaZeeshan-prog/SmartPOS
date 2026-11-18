import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme.dart';
import '../../models/models.dart';
import '../../store/app_store.dart';

class ZReportModal extends StatefulWidget {
  const ZReportModal({super.key});

  @override
  State<ZReportModal> createState() => _ZReportModalState();
}

class _ZReportModalState extends State<ZReportModal> {
  final _cashCountController = TextEditingController();
  double _openingCash = 5000;
  double _actualCashInTill = 0;

  @override
  void initState() {
    super.initState();
    _actualCashInTill = _openingCash;
    _cashCountController.text = _openingCash.toStringAsFixed(0);
  }

  @override
  void dispose() {
    _cashCountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = context.watch<AppStore>();
    final currency = store.activeShop.currency;

    // Calculations for today's till
    double cashSales = 0;
    double digitalSales = 0;
    double cardSales = 0;
    double creditSales = 0;

    for (final sale in store.salesHistory) {
      if (sale.isRefunded) continue;
      for (final p in sale.payments) {
        if (p.method == PaymentMethod.cash) {
          cashSales += p.amount;
        } else if (p.method == PaymentMethod.card) {
          cardSales += p.amount;
        } else if (p.method == PaymentMethod.customerCredit) {
          creditSales += p.amount;
        } else {
          digitalSales += p.amount;
        }
      }
    }

    final totalExpenses = store.totalExpenses;
    final totalRefunds = store.refundsTotal;
    final expectedCashInDrawer = _openingCash + cashSales - totalExpenses - totalRefunds;
    final variance = _actualCashInTill - expectedCashInDrawer;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
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
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  const Icon(Icons.calculate, color: AppTheme.emerald400),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('End of Day Z-Report', overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                        Text('Till Closure & Register Reconciliation', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate400, fontSize: 11)),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: AppTheme.slate400),
                  ),
                ],
              ),
            ),
          const Divider(color: AppTheme.slate800, height: 1),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                // Register Info
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Register: POS-01 (Main Till)', overflow: TextOverflow.ellipsis, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                            Text('Shift Operator: ${store.currentUser.name}', overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(DateTime.now().toString().substring(0, 10), style: const TextStyle(color: AppTheme.slate400, fontSize: 11)),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Payment Rails Breakdown
                const Text('SALES BREAKDOWN BY PAYMENT METHOD', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 8),
                _buildBreakdownTile('Opening Float Cash', '$currency ${_openingCash.toStringAsFixed(0)}', Icons.account_balance, Colors.blueGrey),
                _buildBreakdownTile('Cash Inflow (Sales)', '+$currency ${cashSales.toStringAsFixed(0)}', Icons.money, AppTheme.emerald400),
                _buildBreakdownTile('Digital QR (JazzCash/Easypaisa/Raast)', '+$currency ${digitalSales.toStringAsFixed(0)}', Icons.qr_code, Colors.tealAccent),
                _buildBreakdownTile('Card Machine (POS Terminal)', '+$currency ${cardSales.toStringAsFixed(0)}', Icons.credit_card, Colors.purpleAccent),
                _buildBreakdownTile('Khata Credit (Udhaar Purchases)', '+$currency ${creditSales.toStringAsFixed(0)}', Icons.book, Colors.orangeAccent),
                _buildBreakdownTile('Petty Cash Expenses Paid Out', '-$currency ${totalExpenses.toStringAsFixed(0)}', Icons.receipt, Colors.redAccent),
                _buildBreakdownTile('Customer Refunds Returned', '-$currency ${totalRefunds.toStringAsFixed(0)}', Icons.replay, Colors.amberAccent),

                const SizedBox(height: 16),

                // Drawer Cash Count
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.slate950,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.slate800),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text('Expected Cash in Drawer:', overflow: TextOverflow.ellipsis, style: TextStyle(color: AppTheme.slate300, fontSize: 12)),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$currency ${expectedCashInDrawer.toStringAsFixed(0)}',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text('PHYSICALLY COUNTED CASH IN TILL', style: TextStyle(color: AppTheme.slate400, fontSize: 10, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _cashCountController,
                        keyboardType: TextInputType.number,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        decoration: InputDecoration(
                          prefixText: '$currency ',
                          prefixStyle: const TextStyle(color: AppTheme.slate400),
                          filled: true,
                          fillColor: AppTheme.slate900,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.slate700)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        ),
                        onChanged: (val) {
                          setState(() {
                            _actualCashInTill = double.tryParse(val) ?? 0;
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: variance == 0
                              ? AppTheme.emerald950.withValues(alpha: 0.3)
                              : (variance > 0 ? Colors.blue.withValues(alpha: 0.2) : Colors.red.withValues(alpha: 0.2)),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: variance == 0 ? AppTheme.emerald500 : (variance > 0 ? Colors.blue : Colors.red),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                variance == 0
                                    ? 'Drawer Balanced Perfectly'
                                    : (variance > 0 ? 'Cash Surplus (Over)' : 'Cash Shortage (Short)'),
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '$currency ${variance.abs().toStringAsFixed(0)}',
                              style: TextStyle(
                                color: variance >= 0 ? AppTheme.emerald400 : Colors.redAccent,
                                fontWeight: FontWeight.w900,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Bottom Action
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppTheme.slate950,
              border: Border(top: BorderSide(color: AppTheme.slate800)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.emerald600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.print, size: 18),
                    label: const Text('Print Z-Report & Close Till', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      store.showToast('Daily Till Closed! Z-Report printed successfully.');
                      Navigator.pop(context);
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      ),
    );
  }

  Widget _buildBreakdownTile(String label, String value, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.slate950,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.slate800),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(child: Text(label, style: const TextStyle(color: AppTheme.slate300, fontSize: 11))),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}
