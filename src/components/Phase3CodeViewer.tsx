import React, { useState } from 'react';
import { PHASE3_FLUTTER_FILES, FlutterPhase3File } from '../data/phase3Code';
import { Code, Copy, Check, FileCode, Database, CheckCircle2, Cloud } from 'lucide-react';

export const Phase3CodeViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FlutterPhase3File>(PHASE3_FLUTTER_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Phase 3 Deliverable: Cloud Firestore Sync & Product/Inventory DAOs
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cloud className="w-6 h-6 text-emerald-400" />
            Phase 3 Dart Cloud & Local Sync Code
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Production Dart source code for CloudSyncService, ProductsRepository, and StockAdjustmentDialog.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all self-start md:self-auto cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-white" />
              Copied to Clipboard!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Selected Dart File
            </>
          )}
        </button>
      </div>

      {/* File Selector Chips */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap gap-2">
        {PHASE3_FLUTTER_FILES.map((f) => (
          <button
            key={f.path}
            onClick={() => setSelectedFile(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedFile.path === f.path
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            {f.path.split('/').pop()}
          </button>
        ))}
      </div>

      {/* File Detail and Code Body */}
      <div className="p-6 space-y-4">
        <div>
          <div className="text-xs font-mono font-bold text-emerald-400">{selectedFile.path}</div>
          <div className="text-xs text-slate-400 mt-0.5">{selectedFile.description}</div>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-emerald-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[550px]">
          {selectedFile.code}
        </pre>
      </div>
    </div>
  );
};
