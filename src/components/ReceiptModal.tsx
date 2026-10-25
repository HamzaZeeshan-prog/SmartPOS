import React, { useState } from 'react';
import { Sale, Shop } from '../types/pos';
import { 
  Printer, 
  Download, 
  Share2, 
  Check, 
  X, 
  Store, 
  QrCode, 
  Code, 
  FileText, 
  Terminal, 
  DollarSign, 
  ExternalLink,
  Barcode,
  Layers,
  Sparkles
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  shop: Shop;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  shop,
}) => {
  const [viewMode, setViewMode] = useState<'thermal' | 'a4' | 'escpos'>('thermal');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>(shop.thermalPrinterWidth || '80mm');
  const [isCopied, setIsCopied] = useState(false);
  const [drawerKicked, setDrawerKicked] = useState(false);

  if (!isOpen) return null;

  // Simulate cash drawer pulse
  const handleKickCashDrawer = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio fallback
    }

    setDrawerKicked(true);
    setTimeout(() => setDrawerKicked(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate plain-text representation
  const generateRawReceiptText = () => {
    const cols = paperWidth === '58mm' ? 32 : 48;
    const dividerChar = '=';
    const sepChar = '-';
    let text = `${dividerChar.repeat(cols)}\n`;
    text += `${shop.name.toUpperCase().padStart((cols + shop.name.length) / 2)}\n`;
    text += `${shop.address.padStart((cols + shop.address.length) / 2)}\n`;
    text += `${(shop.city + ' | Tel: ' + shop.phone).padStart((cols + shop.city.length + 10) / 2)}\n`;
    text += `STRN / NTN Tax Reg #: 892104-5\n`;
    text += `${dividerChar.repeat(cols)}\n`;
    text += `Invoice #: ${sale.invoiceNumber}\n`;
    text += `Date:      ${new Date(sale.createdAt).toLocaleString()}\n`;
    text += `Cashier:   ${sale.cashierName}\n`;
    if (sale.customerName) {
      text += `Customer:  ${sale.customerName}\n`;
    }
    text += `${sepChar.repeat(cols)}\n`;
    text += `ITEM                QTY    PRICE\n`;
    text += `${sepChar.repeat(cols)}\n`;
    sale.items.forEach((item) => {
      const name = item.product.name.slice(0, 18).padEnd(19);
      const qty = `${item.quantity}x`.padEnd(6);
      const total = `${item.quantity * item.unitPrice}`;
      text += `${name} ${qty} ${total}\n`;
    });
    text += `${sepChar.repeat(cols)}\n`;
    text += `Subtotal:           ${shop.currency} ${sale.subtotal}\n`;
    if (sale.discountTotal > 0) {
      text += `Discount:          -${shop.currency} ${sale.discountTotal}\n`;
    }
    if (sale.taxTotal > 0) {
      text += `Tax (GST):         +${shop.currency} ${sale.taxTotal}\n`;
    }
    text += `${dividerChar.repeat(cols)}\n`;
    text += `GRAND TOTAL:        ${shop.currency} ${sale.grandTotal}\n`;
    text += `${dividerChar.repeat(cols)}\n`;
    sale.payments.forEach((p) => {
      text += `Payment: ${p.method.toUpperCase()}   ${shop.currency} ${p.amount}\n`;
      if (p.changeReturned && p.changeReturned > 0) {
        text += `Change Returned:    ${shop.currency} ${p.changeReturned}\n`;
      }
    });
    text += `${sepChar.repeat(cols)}\n`;
    text += `${shop.receiptMessage || 'Thank you for shopping with us!'}\n`;
    text += `Exchange valid within 3 days with receipt.\n`;
    text += `${dividerChar.repeat(cols)}\n`;
    return text;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateRawReceiptText());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // WhatsApp formatted receipt link generator
  const handleShareWhatsApp = () => {
    const summary = `*🧾 ${shop.name} - Official Receipt*
*Invoice #:* ${sale.invoiceNumber}
*Date:* ${new Date(sale.createdAt).toLocaleString()}
*Customer:* ${sale.customerName || 'Valued Customer'}
*Cashier:* ${sale.cashierName}
----------------------------
${sale.items.map((i) => `• ${i.product.name} (x${i.quantity}) - ${shop.currency} ${i.quantity * i.unitPrice}`).join('\n')}
----------------------------
*Subtotal:* ${shop.currency} ${sale.subtotal}
*Discount:* -${shop.currency} ${sale.discountTotal}
*Tax (GST):* +${shop.currency} ${sale.taxTotal}
*Grand Total:* *${shop.currency} ${sale.grandTotal}*
*Payment:* ${sale.payments.map((p) => `${p.method.toUpperCase()} (${shop.currency} ${p.amount})`).join(', ')}
----------------------------
${shop.receiptMessage || 'Thank you for shopping with us!'}`;

    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);

    const url = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      // Handled via clipboard copy
    }
  };

  // Disassembled ESC/POS command stream simulation
  const getEscPosDisassembly = () => {
    return [
      { hex: '1B 40', desc: 'ESC @', explanation: 'Initialize & reset thermal printer' },
      { hex: '1B 70 00 19 FA', desc: 'ESC p 0 25 250', explanation: 'Kick cash drawer solenoid pulse (RJ11/12)' },
      { hex: '1B 61 01', desc: 'ESC a 1', explanation: 'Align center' },
      { hex: '1D 21 11', desc: 'GS ! 17', explanation: 'Set double width & double height' },
      { hex: '43 49 54 59 20 ...', desc: `TXT "${shop.name.toUpperCase()}"`, explanation: 'Store branding name banner' },
      { hex: '1D 21 00', desc: 'GS ! 0', explanation: 'Restore normal font size' },
      { hex: '1B 61 00', desc: 'ESC a 0', explanation: 'Align left' },
      { hex: '2D 2D 2D ...', desc: 'DIVIDER', explanation: `${paperWidth === '58mm' ? '32' : '48'} columns divider` },
      { hex: '49 4E 56 4F ...', desc: `TXT "INV: ${sale.invoiceNumber}"`, explanation: 'Invoice number and cashier metadata' },
      ...sale.items.map((item, idx) => ({
        hex: `49 54 4D ${idx.toString(16).padStart(2, '0')}`,
        desc: `ITEM [${item.quantity}x] ${item.product.name.slice(0, 16)}`,
        explanation: `Rate: ${item.unitPrice} | Tot: ${item.quantity * item.unitPrice}`,
      })),
      { hex: '1D 21 01', desc: 'GS ! 1', explanation: 'Set double height for grand total' },
      { hex: '54 4F 54 41 4C ...', desc: `TXT "GRAND TOTAL: ${shop.currency} ${sale.grandTotal}"`, explanation: 'Final bill net amount' },
      { hex: '1D 21 00', desc: 'GS ! 0', explanation: 'Restore normal font size' },
      { hex: '1D 28 6B 04 00 31 41 32 00', desc: 'GS ( k QR_MODEL', explanation: 'Set QR Code model 2' },
      { hex: '1D 28 6B ... 31 51 30', desc: 'GS ( k QR_PRINT', explanation: `smartpos://verify?inv=${sale.invoiceNumber}` },
      { hex: '1D 68 30 1D 77 02 1D 6B 49 ...', desc: 'GS k CODE128', explanation: 'Code128 barcode symbol' },
      { hex: '1B 64 03', desc: 'ESC d 3', explanation: 'Feed 3 blank lines' },
      { hex: '1D 56 42 00', desc: 'GS V 66 0', explanation: 'Execute partial paper cutter' },
    ];
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header & Controls */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Receipt Engine</h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    ESC/POS · 80mm
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Invoice #{sale.invoiceNumber}</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="sm:hidden w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg flex text-xs">
              <button
                onClick={() => setViewMode('thermal')}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                  viewMode === 'thermal'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Thermal</span>
              </button>

              <button
                onClick={() => setViewMode('a4')}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                  viewMode === 'a4'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Tax</span>
              </button>

              <button
                onClick={() => setViewMode('escpos')}
                className={`px-2.5 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                  viewMode === 'escpos'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>ESC/POS</span>
              </button>
            </div>

            {/* 58mm / 80mm toggle (only for thermal) */}
            {viewMode === 'thermal' && (
              <div className="bg-slate-800 p-0.5 rounded-lg flex text-xs">
                <button
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2 py-1.5 rounded-md font-semibold transition-colors min-h-[36px] ${
                    paperWidth === '58mm'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  58mm
                </button>
                <button
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2 py-1.5 rounded-md font-semibold transition-colors min-h-[36px] ${
                    paperWidth === '80mm'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  80mm
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="hidden sm:flex w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-950/90 flex justify-center flex-1">
          {/* VIEW 1: Thermal Slip */}
          {viewMode === 'thermal' && (
            <div
              id="thermal-receipt"
              className={`bg-white text-slate-900 font-mono shadow-2xl p-5 sm:p-6 rounded-sm border border-slate-300 transition-all ${
                paperWidth === '58mm' ? 'w-[290px] text-[11px]' : 'w-[370px] text-xs'
              }`}
            >
              {/* Perforated Top Edge Accent */}
              <div className="w-full flex justify-between mb-3 border-b-2 border-dotted border-slate-400 pb-1 text-[9px] text-slate-400 uppercase tracking-widest text-center">
                <span>••• THERMAL RECEIPT ({paperWidth}) •••</span>
              </div>

              {/* Shop Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-0.5">
                <div className="font-extrabold text-base tracking-wider uppercase">
                  {shop.name}
                </div>
                <div className="text-[10px] text-slate-600 leading-tight">{shop.address}</div>
                <div className="text-[10px] text-slate-600">{shop.city} • Ph: {shop.phone}</div>
                <div className="text-[9px] font-bold text-slate-800 mt-1 inline-block px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded">
                  STRN / NTN: 892104-5 PKR
                </div>
              </div>

              {/* Invoice Metadata */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">INVOICE:</span>
                  <span className="font-bold">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">DATE:</span>
                  <span>{new Date(sale.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">CASHIER:</span>
                  <span>{sale.cashierName}</span>
                </div>
                {sale.customerName && (
                  <div className="flex justify-between text-blue-900 font-semibold">
                    <span className="text-slate-600">CUSTOMER:</span>
                    <span>{sale.customerName}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold pb-1 text-[10px] border-b border-slate-300">
                  <span>ITEM</span>
                  <div className="flex gap-4">
                    <span>QTY</span>
                    <span>TOTAL</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 py-1 space-y-1">
                  {sale.items.map((item, index) => (
                    <div key={index} className="pt-1">
                      <div className="flex justify-between items-start font-medium leading-snug">
                        <span className="truncate max-w-[170px]">{item.product.name}</span>
                        <div className="flex gap-4 font-bold text-right shrink-0">
                          <span className="text-slate-600 font-normal">{item.quantity}x</span>
                          <span>{shop.currency} {item.quantity * item.unitPrice}</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-slate-500">
                        @{shop.currency} {item.unitPrice} / {item.product.unit || 'unit'}
                        {item.itemDiscount && item.itemDiscount > 0 ? ` (Disc: -${item.itemDiscount})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Financial Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span>{shop.currency} {sale.subtotal.toLocaleString()}</span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-{shop.currency} {sale.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                {sale.taxTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST / Sales Tax</span>
                    <span>+{shop.currency} {sale.taxTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm sm:text-base pt-1 border-t-2 border-black">
                  <span>GRAND TOTAL</span>
                  <span>{shop.currency} {sale.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
                {sale.payments.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-slate-600 uppercase">Paid via {p.method}:</span>
                    <span className="font-bold">{shop.currency} {p.amount.toLocaleString()}</span>
                  </div>
                ))}
                {sale.payments[0]?.changeReturned && sale.payments[0].changeReturned > 0 ? (
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Change Returned:</span>
                    <span>{shop.currency} {sale.payments[0].changeReturned}</span>
                  </div>
                ) : null}
              </div>

              {/* Dynamic QR & Code 128 Barcode */}
              <div className="py-4 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-2 border-2 border-black rounded-lg inline-block">
                    <QrCode className="w-16 h-16 text-black" />
                  </div>
                </div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Scan to Verify Invoice #{sale.invoiceNumber}
                </div>

                {/* Simulated Barcode */}
                <div className="flex justify-center items-center gap-0.5 h-8 pt-1">
                  {[2, 1, 3, 1, 4, 1, 2, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 3].map((w, i) => (
                    <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                  ))}
                </div>
                <div className="text-[9px] tracking-widest text-slate-600 font-mono">
                  *{sale.invoiceNumber}*
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2 border-t border-dashed border-slate-400 space-y-1">
                <div className="font-bold text-[10px]">
                  {shop.receiptMessage || 'Thank you for shopping with us!'}
                </div>
                <div className="text-[9px] text-slate-500">
                  Exchange possible within 3 days with this invoice.
                </div>
                <div className="text-[8px] text-slate-400 pt-1">
                  Powered by Smart POS • Multi-Platform
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: A4 Tax Invoice */}
          {viewMode === 'a4' && (
            <div className="bg-white text-slate-900 shadow-2xl p-8 rounded-lg w-full max-w-xl text-xs space-y-6 border border-slate-300">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{shop.name}</h1>
                  <p className="text-slate-600 mt-1">{shop.address}, {shop.city}</p>
                  <p className="text-slate-600">Tel: {shop.phone}</p>
                  <p className="text-slate-800 font-bold mt-1 text-[11px]">STRN/NTN: 892104-5 PKR (FBR Registered)</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-slate-900 text-white font-black text-sm tracking-wider rounded">
                    TAX INVOICE
                  </span>
                  <div className="mt-3 text-slate-600 font-mono text-[11px]">
                    <div><strong className="text-slate-900">Invoice:</strong> {sale.invoiceNumber}</div>
                    <div><strong className="text-slate-900">Date:</strong> {new Date(sale.createdAt).toLocaleDateString()}</div>
                    <div><strong className="text-slate-900">Cashier:</strong> {sale.cashierName}</div>
                  </div>
                </div>
              </div>

              {/* Bill To Card */}
              <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center border border-slate-200">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billed To</div>
                  <div className="text-sm font-bold text-slate-900">{sale.customerName || 'Walk-in Retail Customer'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Status</div>
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    PAID IN FULL
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px]">
                    <th className="p-2 border border-slate-400">#</th>
                    <th className="p-2 border border-slate-400">Description</th>
                    <th className="p-2 border border-slate-400 text-center">Qty</th>
                    <th className="p-2 border border-slate-400 text-right">Rate</th>
                    <th className="p-2 border border-slate-400 text-right">Tax %</th>
                    <th className="p-2 border border-slate-400 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 text-[11px]">
                  {sale.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-medium">{item.product.name}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{item.quantity}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{shop.currency} {item.unitPrice}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono">{item.product.taxPercentage || 0}%</td>
                      <td className="p-2 border border-slate-300 text-right font-bold font-mono">
                        {shop.currency} {item.quantity * item.unitPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Bottom */}
              <div className="flex justify-between items-start pt-2">
                <div className="space-y-2 max-w-[260px]">
                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    <strong>Terms & Warranty:</strong> Please preserve this computerized receipt. All returns or adjustments require presentation of original invoice within 3 days.
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-700">
                    Verification Code: {sale.invoiceNumber}
                  </div>
                </div>

                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{shop.currency} {sale.subtotal.toLocaleString()}</span>
                  </div>
                  {sale.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span>-{shop.currency} {sale.discountTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {sale.taxTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST (5%):</span>
                      <span>+{shop.currency} {sale.taxTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-2 border-t-2 border-slate-900 text-slate-900">
                    <span>GRAND TOTAL:</span>
                    <span>{shop.currency} {sale.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: ESC/POS Hex & Byte Stream Inspector */}
          {viewMode === 'escpos' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 w-full font-mono text-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">ESC/POS Command Stream & Hex Disassembly</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  Target: {paperWidth} Thermal Head (Port 9100 / BLE)
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2">
                {getEscPosDisassembly().map((cmd, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 w-6">#{i + 1}</span>
                      <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        {cmd.desc}
                      </span>
                      <span className="text-slate-400 text-xs">{cmd.explanation}</span>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 font-mono tracking-wider">
                      {cmd.hex}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Kicked Alert Feedback */}
        {drawerKicked && (
          <div className="bg-amber-500/20 border-y border-amber-500/40 px-4 py-2 text-center text-xs text-amber-300 font-bold flex items-center justify-center gap-2">
            <DollarSign className="w-4 h-4 animate-bounce" />
            Cash Drawer Solenoid Pulse Fired (ESC p 0 25 250) - Drawer Opened!
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
              {isCopied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              WhatsApp Slip
            </button>

            <button
              onClick={handleKickCashDrawer}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
              title="Send ESC/POS pulse to open physical cash drawer"
            >
              <DollarSign className="w-4 h-4" />
              Kick Drawer
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              Print ({viewMode === 'thermal' ? paperWidth : 'A4 PDF'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
