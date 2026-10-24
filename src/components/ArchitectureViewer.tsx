import React, { useState } from 'react';
import { 
  PUBSPEC_CONTENT, 
  FOLDER_STRUCTURE_TEXT, 
  SCHEMA_TABLES, 
  ROADMAP_PHASES,
  SchemaTable 
} from '../data/architectureDocs';
import { 
  Layers, 
  Package, 
  FolderTree, 
  Database, 
  GitPullRequest, 
  Copy, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Store, 
  WifiOff, 
  RefreshCw,
  Terminal,
  Code
} from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'pubspec' | 'folders' | 'database' | 'roadmap'>('blueprint');
  const [selectedTable, setSelectedTable] = useState<SchemaTable>(SCHEMA_TABLES[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Phase 1 Deliverable: System Architecture & Data Schema
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Smart POS Architecture Specification
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-3xl">
              Cross-platform Flutter POS built on Clean Architecture, Riverpod 2.x, Drift offline SQLite, GoRouter role guards, and modular multi-tenant shop isolation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Null Safety
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Multi-Shop
            </span>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" />
              Offline-First
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 mt-6 pt-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'blueprint'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            1. Architecture Blueprint
          </button>
          <button
            onClick={() => setActiveTab('pubspec')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'pubspec'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            2. pubspec.yaml Dependencies
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'folders'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            3. Scalable Folder Tree
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            4. Drift SQLite Schema
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'roadmap'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            5. Phase 1-8 Roadmap
          </button>
        </div>
      </div>

      {/* Tab 1: Architecture Blueprint */}
      {activeTab === 'blueprint' && (
        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-blue-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Clean Feature Architecture</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Presentation, Domain, and Data layer separation within self-contained features (<code className="text-blue-300">features/pos</code>, <code className="text-blue-300">features/inventory</code>). High cohesion, testability, and isolated state.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <WifiOff className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Offline-First Drift Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Zero network dependency for checkouts. All sales, items, and inventory changes write atomically to local SQLite via Drift DAOs, queueing into <code className="text-emerald-300">SyncQueue</code> for background cloud sync.
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 hover:border-indigo-500/40 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Shop & RBAC Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Mandatory <code className="text-indigo-300">shopId</code> scoping across all tables and queries. Strict role enforcement: Owner (full access), Manager (inventory/staff), Cashier (scanning/billing only).
              </p>
            </div>
          </div>

          {/* Architecture Diagram Visualization */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              Cross-Platform Flow & Data Pipeline
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="border border-blue-900/60 bg-blue-950/30 rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-1">UI / Presentation</div>
                <div className="text-sm font-semibold text-white">Flutter Material 3 Shell</div>
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  <div>Mobile / Tablet / Web Layout</div>
                  <div>Riverpod AsyncNotifiers</div>
                  <div>GoRouter Guards</div>
                </div>
              </div>

              <div className="border border-indigo-900/60 bg-indigo-950/30 rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-wider font-bold text-indigo-400 mb-1">Domain Logic</div>
                <div className="text-sm font-semibold text-white">Use Cases & Contracts</div>
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  <div>ProcessSaleUseCase</div>
                  <div>ProductLookupService</div>
                  <div>PaymentProvider Interface</div>
                </div>
              </div>

              <div className="border border-emerald-900/60 bg-emerald-950/30 rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-1">Local Storage</div>
                <div className="text-sm font-semibold text-white">Drift SQLite Database</div>
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  <div>Atomic Transactions</div>
                  <div>Typed DAOs & Foreign Keys</div>
                  <div>SyncQueue Table</div>
                </div>
              </div>

              <div className="border border-amber-900/60 bg-amber-950/30 rounded-lg p-4 text-center">
                <div className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-1">External & Peripherals</div>
                <div className="text-sm font-semibold text-white">Hardware & Cloud APIs</div>
                <div className="text-xs text-slate-400 mt-2 space-y-1">
                  <div>ESC/POS 58/80mm Printers</div>
                  <div>Camera & USB Barcode HID</div>
                  <div>Firebase / Supabase Sync</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Design Principles Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white">Core Architectural Tenets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <span className="text-blue-400 font-bold text-lg">01</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Zero-Secret Client Rule</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    No payment gateway private keys (JazzCash/Easypaisa merchant secrets) ever reside in Flutter code. In demo mode, mock providers simulate responses with formal interfaces. In production, server-side Cloud Functions or Supabase Edge Functions issue tokens and verify webhooks.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <span className="text-blue-400 font-bold text-lg">02</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Atomic Checkout Transactions</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Checkout execution runs inside a single Drift SQLite transaction: (1) insert sale record, (2) insert sale item lines, (3) insert payment record, (4) decrement inventory stock, (5) write immutable audit entry, (6) push mutation to SyncQueue. If any step fails, the entire transaction rolls back.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <span className="text-blue-400 font-bold text-lg">03</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Hardware Abstraction: Dual Scanner Support</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Camera scanning on iOS & Android using <code className="text-slate-300">mobile_scanner</code> with flash/camera toggle. Seamless USB/Bluetooth HID keyboard barcode scanners on Web and Desktop through a global key event listener.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex gap-3">
                <span className="text-blue-400 font-bold text-lg">04</span>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Dynamic Thermal ESC/POS Engine</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Modular receipt generator supporting both 58mm (32 characters per line) and 80mm (48 characters per line) thermal paper widths, printing invoice barcodes, payment QR codes, and tax breakdowns via ESC/POS command streams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: pubspec.yaml */}
      {activeTab === 'pubspec' && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Production pubspec.yaml Dependencies
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Carefully selected, null-safe packages targeting Flutter 3.19+ and Dart 3.3+.
              </p>
            </div>
            <button
              onClick={() => handleCopy(PUBSPEC_CONTENT, 'pubspec')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
            >
              {copiedKey === 'pubspec' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Copied pubspec.yaml!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy pubspec.yaml
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block font-medium">State Management</span>
              <span className="text-white font-bold text-sm">flutter_riverpod 2.5</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block font-medium">Local SQLite</span>
              <span className="text-white font-bold text-sm">drift 2.18 (Null-Safe)</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block font-medium">Navigation</span>
              <span className="text-white font-bold text-sm">go_router 14.0</span>
            </div>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-400 block font-medium">Hardware Scanners</span>
              <span className="text-white font-bold text-sm">mobile_scanner 5.1</span>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[500px]">
              {PUBSPEC_CONTENT}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Folder Structure */}
      {activeTab === 'folders' && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-400" />
                Scalable Feature-First Clean Architecture
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Modular organization allowing independent development and testing of all 17 POS modules.
              </p>
            </div>
            <button
              onClick={() => handleCopy(FOLDER_STRUCTURE_TEXT, 'folders')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-600/30"
            >
              {copiedKey === 'folders' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Copied Folder Structure!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Structure
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-[550px]">
            {FOLDER_STRUCTURE_TEXT}
          </pre>
        </div>
      )}

      {/* Tab 4: Drift SQLite Schema */}
      {activeTab === 'database' && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Drift / SQLite Relational Schema
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Normalized offline database schema with foreign keys, compound indexes, and SyncQueue.
              </p>
            </div>
            <button
              onClick={() => handleCopy(selectedTable.dartCode, selectedTable.name)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/30"
            >
              {copiedKey === selectedTable.name ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Copied {selectedTable.name} Dart Code!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Dart Table Class
                </>
              )}
            </button>
          </div>

          {/* Table selector chips */}
          <div className="flex flex-wrap gap-2">
            {SCHEMA_TABLES.map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTable(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  selectedTable.name === t.name
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* Selected table details */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-emerald-400 uppercase">TABLE</span>
                <span className="text-lg font-bold text-white font-mono">{selectedTable.name}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">{selectedTable.description}</p>
            </div>

            {/* Column List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="py-2 px-3">Column Name</th>
                    <th className="py-2 px-3">SQLite Type</th>
                    <th className="py-2 px-3">Constraints</th>
                    <th className="py-2 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-900/60">
                      <td className="py-2.5 px-3 text-emerald-300 font-semibold">{col.name}</td>
                      <td className="py-2.5 px-3 text-blue-400">{col.type}</td>
                      <td className="py-2.5 px-3 text-amber-300">{col.constraints}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-sans">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Indexes */}
            {selectedTable.indexes.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Indexes</span>
                <div className="space-y-1">
                  {selectedTable.indexes.map((idx, i) => (
                    <div key={i} className="text-xs font-mono text-purple-300 bg-purple-950/30 p-2 rounded border border-purple-900/50">
                      {idx}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drift Dart Class Preview */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Generated Drift Table Definition (Dart)
              </span>
              <pre className="bg-slate-900 p-4 rounded-lg text-emerald-300 text-xs font-mono overflow-x-auto border border-slate-800">
                {selectedTable.dartCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-amber-400" />
                8-Phase Master Implementation Roadmap
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                Engineered step-by-step roadmap to deliver production quality without breaking changes.
              </p>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
              Current: Phase 1 Active & Complete
            </div>
          </div>

          <div className="space-y-4">
            {ROADMAP_PHASES.map((p, idx) => (
              <div 
                key={p.phase}
                className={`p-5 rounded-xl border transition-all ${
                  p.status === 'completed'
                    ? 'bg-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-500/5'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      p.status === 'completed' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-400">{p.phase}</span>
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium self-start md:self-auto ${
                    p.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.status === 'completed' ? 'Delivered & Validated' : 'Ready for Next Phase'}
                  </span>
                </div>

                <p className="text-slate-400 text-xs mb-3 pl-10">{p.summary}</p>

                <div className="pl-10 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {p.deliverables.map((item, dIdx) => (
                    <div key={dIdx} className="flex items-center gap-2 text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === 'completed' ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
