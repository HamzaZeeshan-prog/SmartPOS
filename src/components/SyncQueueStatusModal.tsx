import React, { useState } from 'react';
import { SyncQueueItem, Shop } from '../types/pos';
import { getShopEntitlements } from '../data/saasConfig';
import { 
  X, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Database, 
  Wifi, 
  WifiOff, 
  Lock
} from 'lucide-react';

interface SyncQueueStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  isCloudConnected: boolean;
  onToggleCloudMode: () => void;
  onForceReplaySync: () => Promise<void>;
  onOpenUpgrade?: () => void;
}

export const SyncQueueStatusModal: React.FC<SyncQueueStatusModalProps> = ({
  isOpen,
  onClose,
  shop,
  isCloudConnected,
  onToggleCloudMode,
  onForceReplaySync,
  onOpenUpgrade,
}) => {
  const entitlements = getShopEntitlements(shop);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([
    {
      id: 'sync_001',
      shopId: shop.id,
      entityType: 'sale',
      entityId: 'INV-20261024-001',
      action: 'insert',
      payloadJson: '{"invoiceNumber": "INV-20261024-001", "grandTotal": 2040}',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      status: 'synced',
      retryCount: 0,
    },
    {
      id: 'sync_002',
      shopId: shop.id,
      entityType: 'inventory_transaction',
      entityId: 'adj_prod_001',
      action: 'update',
      payloadJson: '{"productId": "prod_001", "newQuantity": 48}',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      status: 'synced',
      retryCount: 0,
    },
  ]);

  if (!isOpen) return null;

  const handleForceSync = async () => {
    setIsSyncing(true);
    await onForceReplaySync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  const handleAddSimulatedPendingItem = () => {
    const newItem: SyncQueueItem = {
      id: `sync_${Date.now()}`,
      shopId: shop.id,
      entityType: 'sale',
      entityId: `INV-OFFLINE-${Date.now().toString().slice(-4)}`,
      action: 'insert',
      payloadJson: '{"offlineMode": true, "total": 1250, "items": 3}',
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };
    setQueueItems((prev) => [newItem, ...prev]);
  };

  const pendingCount = queueItems.filter((i) => i.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isCloudConnected
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              {isCloudConnected ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Drift SQLite Offline Sync Engine</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isCloudConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isCloudConnected ? 'Cloud Online' : 'Local Offline Mode'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Store: {shop.name} • Target: Cloud Firestore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Plan Gate Banner on Starter Monthly */}
          {!entitlements.allowCloudSync && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">Cloud Sync Disabled on {entitlements.planName}</div>
                  <p className="text-[11px] text-slate-400">
                    Your store runs locally on this device. Upgrade to Business Pro Monthly to enable Cloud Firestore sync across branches.
                  </p>
                </div>
              </div>
              {onOpenUpgrade && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpgrade();
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] shrink-0 cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          )}

          {/* Status Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Local Drift/SQLite Database Status
              </div>
              <p className="text-slate-400 mt-0.5">
                {entitlements.allowCloudSync
                  ? 'All transactions write locally to SQLite first, then stream to Cloud Firestore in batches.'
                  : 'All transactions stay stored locally in SQLite on Starter Monthly.'}
              </p>
            </div>

            <button
              onClick={onToggleCloudMode}
              disabled={!entitlements.allowCloudSync}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 ${
                !entitlements.allowCloudSync
                  ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                  : isCloudConnected
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 cursor-pointer'
                  : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 cursor-pointer'
              }`}
            >
              {isCloudConnected ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              {isCloudConnected ? 'Simulate Offline' : 'Reconnect Online'}
            </button>
          </div>

          {/* Pending Sync Queue Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Pending Mutations</span>
              <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
                {pendingCount} items
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Waiting for connection</div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">Synced to Firestore</span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {queueItems.filter((i) => i.status === 'synced').length} items
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {entitlements.allowCloudSync ? 'Active mirroring' : 'Requires Business Pro'}
              </div>
            </div>
          </div>

          {/* Actions toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={handleAddSimulatedPendingItem}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              + Enqueue Offline Sale Mutation
            </button>

            <button
              onClick={handleForceSync}
              disabled={isSyncing || !entitlements.allowCloudSync}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                !entitlements.allowCloudSync
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : entitlements.allowCloudSync ? 'Force Replay Queue' : 'Pro Required'}
            </button>
          </div>

          {/* Queue items list */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300">SQLite sync_queue Inspection</h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {queueItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400">{item.entityId}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-slate-800 text-slate-300">
                        {item.entityType} ({item.action})
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-sm">
                      {item.payloadJson}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'synced'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
