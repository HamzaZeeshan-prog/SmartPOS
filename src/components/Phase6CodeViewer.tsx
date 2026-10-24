import React, { useState } from 'react';
import { 
  PRINT_SERVICE_DART, 
  PDF_INVOICE_BUILDER_DART, 
  RECEIPT_PREVIEW_SCREEN_DART 
} from '../data/phase6Code';
import { 
  Printer, 
  FileText, 
  Smartphone, 
  Copy, 
  Check, 
  Sliders, 
  Zap, 
  Wifi, 
  Bluetooth, 
  Usb, 
  QrCode,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const Phase6CodeViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'escpos' | 'pdf' | 'ui'>('escpos');
  const [copied, setCopied] = useState(false);

  const getCodeContent = () => {
    switch (activeTab) {
      case 'escpos':
        return PRINT_SERVICE_DART;
      case 'pdf':
        return PDF_INVOICE_BUILDER_DART;
      case 'ui':
        return RECEIPT_PREVIEW_SCREEN_DART;
      default:
        return '';
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'escpos':
        return 'lib/core/services/print_service.dart';
      case 'pdf':
        return 'lib/features/receipts/services/pdf_invoice_builder.dart';
      case 'ui':
        return 'lib/features/receipts/presentation/receipt_preview_screen.dart';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Printer className="w-48 h-48 text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Phase 6 Production Deliverable
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Thermal ESC/POS (58mm/80mm), PDF Invoices & WhatsApp Receipt Dispatcher
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Multi-transport thermal printing engine engineered for Bluetooth, WiFi Network (Port 9100), and USB OTG/Desktop hardware.
            Features dynamic dual-format PDF generator (A4 Tax Invoice & Continuous Thermal Roll), automatic cash drawer kicker,
            Code128 barcode & FBR tax validation QR code sequences.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Bluetooth className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">Bluetooth BLE</div>
                <div className="text-[10px] text-slate-400">Mobile handhelds</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">WiFi TCP :9100</div>
                <div className="text-[10px] text-slate-400">Kitchen & Counter LAN</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <Usb className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">USB / Serial OTG</div>
                <div className="text-[10px] text-slate-400">Windows & Android POS</div>
              </div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="font-bold text-slate-200">GS ( k QR & Code128</div>
                <div className="text-[10px] text-slate-400">Hardware rasterization</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Navigation Bar */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('escpos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'escpos'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Printer className="w-4 h-4" />
              1. ESC/POS Engine & Hardware Transport
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'pdf'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              2. PDF Tax Invoice & Slip Builder
            </button>

            <button
              onClick={() => setActiveTab('ui')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'ui'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              3. Flutter Receipt Preview & WhatsApp Screen
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {getFileName()}
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Source'}
            </button>
          </div>
        </div>

        {/* Code View Canvas */}
        <div className="p-4 sm:p-6 overflow-x-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed max-h-[650px] overflow-y-auto">
          <pre>{getCodeContent()}</pre>
        </div>

        {/* Technical Specification Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Direct Hardware Cash Drawer Pulse</strong>
              Sends standard <code className="text-emerald-400 font-mono text-[11px]">ESC p 0 25 250</code> pulse to the RJ11/RJ12 drawer port upon bill finalization.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sliders className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">58mm & 80mm Column Auto-Reflow</strong>
              Dynamic text wrapping automatically compresses column layouts to 32 characters on 58mm rolls and 48 characters on 80mm rolls.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200 block">Tax Compliance & QR Validation</strong>
              Generates Code128 machine-readable barcodes for fast POS return lookups and dynamic verification QR code payload.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
