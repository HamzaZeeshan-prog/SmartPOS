import React, { useState } from 'react';
import { Shop, SubscriptionRequest, SubscriptionStatus, User } from '../types/pos';
import { getEffectiveSubscriptionStatus, getRemainingSubscriptionDays } from '../data/saasConfig';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  LogOut,
  Building2,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  User as UserIcon,
  RefreshCw,
  AlertTriangle,
  Store,
  Unlock,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  shops: Shop[];
  users: User[];
  subscriptionRequests: SubscriptionRequest[];
  onApproveShop: (shopId: string, requestId?: string) => void;
  onRejectShop: (shopId: string, reason: string, requestId?: string) => void;
  onBlockShop: (shopId: string) => void;
  onUnblockShop: (shopId: string) => void;
  onExpireShop: (shopId: string) => void;
  onRefreshCloud?: () => Promise<unknown>;
  onSignOut: () => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  shops,
  users,
  subscriptionRequests,
  onApproveShop,
  onRejectShop,
  onBlockShop,
  onUnblockShop,
  onExpireShop,
  onRefreshCloud,
  onSignOut,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'active' | 'blocked' | 'expired_rejected'>('pending_approval');
  const [rejectingShopId, setRejectingShopId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid payment reference or unverified transfer.');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getLatestRequest = (shopId: string): SubscriptionRequest | undefined => {
    return subscriptionRequests.find((r) => r.shopId === shopId);
  };

  const getShopEffectiveStatus = (shop: Shop): SubscriptionStatus => {
    return getEffectiveSubscriptionStatus(shop);
  };

  const pendingCount = shops.filter((s) => getShopEffectiveStatus(s) === 'pending_approval').length;
  const activeCount = shops.filter((s) => getShopEffectiveStatus(s) === 'active').length;
  const blockedCount = shops.filter((s) => getShopEffectiveStatus(s) === 'blocked').length;
  const expiredRejectedCount = shops.filter((s) => {
    const st = getShopEffectiveStatus(s);
    return st === 'expired' || st === 'rejected';
  }).length;

  const monthlyRevenue = shops
    .filter((s) => getShopEffectiveStatus(s) === 'active')
    .reduce((sum, s) => sum + (s.subscriptionFee || 0), 0);

  const filteredShops = shops.filter((shop) => {
    const st = getShopEffectiveStatus(shop);
    if (filter === 'all') return true;
    if (filter === 'expired_rejected') return st === 'expired' || st === 'rejected';
    return st === filter;
  });

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'pending_approval':
        return { label: 'Pending Approval', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
      case 'active':
        return { label: 'Active Subscription', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
      case 'blocked':
        return { label: 'Blocked by Admin', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'expired':
        return { label: 'Month Expired', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
      case 'rejected':
        return { label: 'Payment Rejected', cls: 'bg-red-500/20 text-red-300 border-red-500/40' };
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white">OmniPOS SaaS Super Admin</h1>
              <p className="text-[11px] text-slate-400">Monthly Subscription Approvals, Tenant Control & Blocking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshCloud && (
              <button
                onClick={async () => {
                  setIsRefreshing(true);
                  await onRefreshCloud().catch(() => {});
                  setTimeout(() => setIsRefreshing(false), 400);
                }}
                disabled={isRefreshing}
                className="px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Fetch latest subscription requests from Cloud Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            )}
            <button
              onClick={onSignOut}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 hover:text-rose-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Admin
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{pendingCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Awaiting approval</div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Active Stores</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{activeCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">30-day cycles running</div>
          </div>

          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Blocked / Expired</span>
              <Ban className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">{blockedCount + expiredRejectedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{blockedCount} blocked • {expiredRejectedCount} exp/rej</div>
          </div>

          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Active MRR</span>
              <CreditCard className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">PKR {monthlyRevenue.toLocaleString()}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Monthly recurring revenue</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'pending_approval', label: `Pending Approval (${pendingCount})` },
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'blocked', label: `Blocked (${blockedCount})` },
            { id: 'expired_rejected', label: `Expired / Rejected (${expiredRejectedCount})` },
            { id: 'all', label: `All Businesses (${shops.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as typeof filter)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                filter === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Business & Subscription Cards */}
        <div className="space-y-3">
          {filteredShops.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 text-xs">
              No businesses found under this filter.
            </div>
          ) : (
            filteredShops.map((shop) => {
              const status = getShopEffectiveStatus(shop);
              const badge = getStatusBadge(status);
              const latestReq = getLatestRequest(shop.id);
              const daysLeft = getRemainingSubscriptionDays(shop);
              const staffCount = users.filter((u) => u.shopId === shop.id && u.role !== 'owner').length;

              return (
                <div
                  key={shop.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-white">{shop.name}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {shop.ownerName}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {shop.ownerEmail || 'N/A'}</span>
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {shop.phone}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" /> {shop.city}</span>
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {shop.category} • Staff: {staffCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs font-bold text-white">
                        {latestReq?.planName || shop.subscriptionPlanName || 'Monthly Plan'}
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        PKR {(latestReq?.amount || shop.subscriptionFee || 2500).toLocaleString()} / month
                      </div>
                      {status === 'active' && (
                        <div className="text-[10px] text-blue-300 font-mono mt-0.5">
                          {daysLeft} day(s) left • Ends {shop.subscriptionExpiresAt?.slice(0, 10)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Proof Details */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Payment Verification Details</div>
                      <div className="text-slate-200 font-semibold">
                        Method: <span className="text-blue-400">{latestReq?.paymentMethod || shop.subscriptionPaymentMethod || 'JazzCash'}</span>
                        {' '}• Ref / TID:{' '}
                        <span className="font-mono text-amber-300">{latestReq?.paymentReference || shop.subscriptionPaymentRef || 'N/A'}</span>
                      </div>
                      {shop.subscriptionRejectionReason && status === 'rejected' && (
                        <div className="text-[11px] text-rose-400 flex items-center gap-1 pt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Reason: {shop.subscriptionRejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Admin Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {(status === 'pending_approval' || status === 'rejected' || status === 'expired') && (
                        <button
                          onClick={() => onApproveShop(shop.id, latestReq?.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approve & Activate (30 Days)
                        </button>
                      )}

                      {status === 'pending_approval' && (
                        <button
                          onClick={() => {
                            setRejectingShopId(rejectingShopId === shop.id ? null : shop.id);
                            setRejectReason('Payment transaction ID could not be verified.');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}

                      {status === 'active' && (
                        <>
                          <button
                            onClick={() => onBlockShop(shop.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            Block Business
                          </button>
                          <button
                            onClick={() => onExpireShop(shop.id)}
                            className="px-3 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            title="Complete current 1-month period immediately to verify auto-logout & renewal"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Complete Month
                          </button>
                        </>
                      )}

                      {status === 'blocked' && (
                        <button
                          onClick={() => onUnblockShop(shop.id)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          Unblock Business
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Reject Reason Input */}
                  {rejectingShopId === shop.id && (
                    <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejecting subscription payment..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectingShopId(null)}
                          className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onRejectShop(shop.id, rejectReason, latestReq?.id);
                            setRejectingShopId(null);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};
