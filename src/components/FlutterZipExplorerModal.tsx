import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  FolderArchive,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  FLUTTER_PROJECT_FILES,
  downloadFlutterProjectZip,
  FlutterFile,
} from '../services/flutterExportService';

interface FlutterZipExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KEY_UPDATED_FILES = new Set([
  'lib/data/cities.dart',
  'lib/data/saas_config.dart',
  'lib/data/demo_data.dart',
  'lib/models/models.dart',
  'lib/store/app_store.dart',
  'lib/screens/saas_auth_screen.dart',
  'lib/screens/admin_dashboard_screen.dart',
  'lib/screens/architecture_screen.dart',
  'lib/screens/dashboard_screen.dart',
  'lib/screens/inventory_screen.dart',
  'lib/screens/profit_loss_screen.dart',
  'lib/screens/pos_terminal_screen.dart',
  'lib/screens/customer_ledger_screen.dart',
  'lib/services/barcode_lookup_service.dart',
  'lib/services/pdf_receipt_service.dart',
  'lib/services/local_storage_service.dart',
  'lib/services/cloud_service.dart',
  'lib/widgets/modals/scanner_modal.dart',
  'lib/widgets/modals/auth_modal.dart',
  'lib/widgets/modals/onboarding_wizard_modal.dart',
  'lib/widgets/modals/product_form_modal.dart',
  'lib/widgets/modals/receipt_modal.dart',
  'lib/widgets/modals/payment_modal.dart',
  'lib/widgets/modals/sync_queue_modal.dart',
  'lib/theme.dart',
  'lib/main.dart',
  'pubspec.yaml',
  'README.md',
]);

export const FlutterZipExplorerModal: React.FC<FlutterZipExplorerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(
    () =>
      FLUTTER_PROJECT_FILES.find((f) => f.path === 'lib/screens/saas_auth_screen.dart') ||
      FLUTTER_PROJECT_FILES[0]
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onlyUpdated, setOnlyUpdated] = useState(false);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return FLUTTER_PROJECT_FILES.filter((f) => {
      if (onlyUpdated && !KEY_UPDATED_FILES.has(f.path)) return false;
      if (!q) return true;
      return f.path.toLowerCase().includes(q) || f.content.toLowerCase().includes(q);
    });
  }, [searchQuery, onlyUpdated]);

  const totalKb = useMemo(() => {
    const bytes = FLUTTER_PROJECT_FILES.reduce((sum, f) => sum + f.sizeBytes, 0);
    return (bytes / 1024).toFixed(1);
  }, []);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFlutterProjectZip();
      setDownloadDone(true);
      setTimeout(() => setDownloadDone(false), 3000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                Flutter Project ZIP Explorer
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {FLUTTER_PROJECT_FILES.length} files • {totalKb} KB
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Live verified manifest packaged directly into Smart_POS_Flutter_Mobile_App.zip
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              {downloadDone ? (
                <Check className="w-4 h-4 text-emerald-300" />
              ) : (
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              )}
              <span>
                {downloadDone
                  ? 'Complete ZIP Downloaded!'
                  : isDownloading
                  ? 'Packaging ZIP...'
                  : `Download Complete ZIP (${FLUTTER_PROJECT_FILES.length})`}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              aria-label="Close ZIP explorer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: File list + Code preview */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          {/* Left sidebar: File tree */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 flex flex-col max-h-[38vh] md:max-h-none">
            <div className="p-2.5 border-b border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files or Dart symbols..."
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => setOnlyUpdated((v) => !v)}
                  className={`px-2 py-1 rounded-md font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                    onlyUpdated
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Updated Only ({KEY_UPDATED_FILES.size})</span>
                </button>
                <span className="text-slate-500">
                  {filteredFiles.length}/{FLUTTER_PROJECT_FILES.length} files
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
              {filteredFiles.map((file) => {
                const isActive = selectedFile?.path === file.path;
                const isUpdated = KEY_UPDATED_FILES.has(file.path);
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 text-white border border-blue-500/40'
                        : 'text-slate-300 hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-blue-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="truncate font-mono text-[11px]">
                        flutter_app/{file.path}
                      </span>
                    </div>
                    {isUpdated && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-bold shrink-0 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        UPDATED
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredFiles.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500">
                  No matching files in ZIP bundle.
                </div>
              )}
            </div>
          </div>

          {/* Right pane: Selected File Source Code */}
          <div className="flex-1 min-w-0 flex flex-col bg-slate-950">
            {selectedFile && (
              <>
                <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-xs text-cyan-300 truncate">
                      flutter_app/{selectedFile.path}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {(selectedFile.sizeBytes / 1024).toFixed(1)} KB •{' '}
                      {selectedFile.content.split('\n').length} lines
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy File</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="flex-1 overflow-auto p-4 text-[11px] leading-relaxed font-mono text-slate-200">
                  <code>{selectedFile.content}</code>
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
