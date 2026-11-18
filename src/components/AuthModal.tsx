import React, { useState } from 'react';
import { User, Shop, SubscriptionRequest } from '../types/pos';
import {
  getRemainingSubscriptionDays,
  getShopEntitlements,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PAYMENT_METHODS,
} from '../data/saasConfig';
import {
  Store,
  User as UserIcon,
  X,
  ShieldCheck,
  Building2,
  Plus,
  LogOut,
  Mail,
  Phone,
  CheckCircle2,
  MapPin,
  Users,
  Trash2,
  Calendar,
  Lock,
  Crown,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  activeShop: Shop;
  userShops: Shop[];
  staffUsers: User[];
  onSelectShop: (shop: Shop) => void;
  onLoginUser: (user: User) => void;
  onAddStaff: (staff: Omit<User, 'id' | 'createdAt'>) => void;
  onRemoveStaff: (userId: string) => void;
  onTriggerOnboarding: () => void;
  onUpgradeToPro: (shopId: string, request: SubscriptionRequest) => void;
  onSignOutSaaS: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeShop,
  userShops,
  staffUsers,
  onSelectShop,
  onLoginUser,
  onAddStaff,
  onRemoveStaff,
  onTriggerOnboarding,
  onUpgradeToPro,
  onSignOutSaaS,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('+92 3');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'cashier' | 'manager'>('cashier');
  const [formError, setFormError] = useState<string | null>(null);

  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [upgradeMethod, setUpgradeMethod] = useState(SUBSCRIPTION_PAYMENT_METHODS[0].id);
  const [upgradeRef, setUpgradeRef] = useState('');

  if (!isOpen) return null;

  const isOwner = currentUser.role === 'owner';
  const daysLeft = getRemainingSubscriptionDays(activeShop);
  const entitlements = getShopEntitlements(activeShop);
  const proPlan = SUBSCRIPTION_PLANS[1];
  const teamForShop = staffUsers.filter((u) => u.shopId === activeShop.id && u.role !== 'owner');

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!entitlements.allowCustomStaff) {
      setFormError('Custom Cashiers & Managers require Business Pro Monthly.');
      return;
    }

    if (!staffName.trim() || !staffEmail.trim() || staffPassword.length < 4) {
      setFormError('Enter staff name, login email, and password (min 4 characters).');
      return;
    }

    onAddStaff({
      name: staffName.trim(),
      email: staffEmail.trim(),
      phone: staffPhone.trim(),
      password: staffPassword,
      role: staffRole,
      shopId: activeShop.id,
      businessIds: [activeShop.id],
      subscriptionPlan: activeShop.subscriptionPlanName,
    });

    setStaffName('');
    setStaffEmail('');
    setStaffPhone('+92 3');
    setStaffPassword('');
    setStaffRole('cashier');
    setShowAddForm(false);
  };

  const handleSubmitProUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeRef.trim()) return;

    const req: SubscriptionRequest = {
      id: `subreq_${Date.now()}`,
      shopId: activeShop.id,
      shopName: activeShop.name,
      ownerName: currentUser.name,
      ownerEmail: currentUser.email,
      ownerPhone: currentUser.phone || activeShop.phone,
      planId: proPlan.id,
      planName: proPlan.name,
      amount: proPlan.pricePkr,
      currency: 'PKR',
      paymentMethod: upgradeMethod,
      paymentReference: upgradeRef.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    onUpgradeToPro(activeShop.id, req);
    setUpgradeRef('');
    setShowUpgradeForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Business Profile & Staff Access</h2>
              <p className="text-xs text-slate-400">
                {entitlements.isPro
                  ? 'Business Pro Monthly • Multi-Branch & Custom Staff Unlocked'
                  : 'Starter Monthly • Single Storefront Plan'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Active Operator & Subscription Card */}
          <div className="p-4 bg-gradient-to-tr from-slate-950 to-blue-950/40 border border-blue-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/30 shrink-0">
                  {currentUser.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                    <span className="truncate">{currentUser.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border block ${
                  entitlements.isPro
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {entitlements.planName}
                </span>
                <span className="text-[10px] text-blue-300 font-mono flex items-center justify-end gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {daysLeft}d left
                </span>
              </div>
            </div>

            {/* Upgrade Banner for Starter Monthly Owners */}
            {!entitlements.isPro && (
              <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-indigo-200 font-semibold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Starter Monthly excludes Multi-Branch, Custom Cashiers/Managers, P&L, Expiry Alerts & Cloud Sync.</span>
                  </div>
                  {isOwner && !showUpgradeForm && (
                    <button
                      type="button"
                      onClick={() => setShowUpgradeForm(true)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      Upgrade Pro
                    </button>
                  )}
                </div>

                {isOwner && showUpgradeForm && (
                  <form onSubmit={handleSubmitProUpgrade} className="pt-2 border-t border-indigo-500/30 space-y-2">
                    <div className="text-[11px] text-emerald-300 font-bold">
                      {proPlan.name} — PKR {proPlan.pricePkr.toLocaleString()} / 30 days (Admin Approval)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={upgradeMethod}
                        onChange={(e) => setUpgradeMethod(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        {SUBSCRIPTION_PAYMENT_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} ({m.account})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={upgradeRef}
                        onChange={(e) => setUpgradeRef(e.target.value)}
                        placeholder="Payment Transaction ID *"
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowUpgradeForm(false)}
                        className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Submit Upgrade Payment
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1 text-[11px]">
                <Phone className="w-3 h-3 text-slate-500" />
                {currentUser.phone || activeShop.phone}
              </span>
              <button
                type="button"
                onClick={() => {
                  onSignOutSaaS();
                  onClose();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Stores / Branches owned */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>BUSINESS BRANCHES ({userShops.length})</span>
              </div>
              {isOwner && (
                entitlements.allowMultiBranch ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTriggerOnboarding();
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Branch</span>
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Multi-Branch (Pro)
                  </span>
                )
              )}
            </div>

            {!entitlements.allowMultiBranch && (
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Starter Monthly supports 1 storefront only. Adding extra branches requires Business Pro Monthly.</span>
              </div>
            )}

            <div className="space-y-2">
              {userShops.map((s) => {
                const isActive = s.id === activeShop.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectShop(s);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
                      }`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          <span className="truncate">{s.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500 text-white shrink-0">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                          <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{s.city} • {s.category} • {s.currency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {s.taxEnabled ? `GST ${s.defaultTaxRate}%` : 'Tax Free'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Business Owner Staff Management (Business Pro Only) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>{activeShop.name} STAFF ({teamForShop.length})</span>
              </div>
              {isOwner && (
                entitlements.allowCustomStaff ? (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cashier / Manager</span>
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Pro Required
                  </span>
                )
              )}
            </div>

            {!entitlements.allowCustomStaff ? (
              <div className="p-3.5 bg-slate-950 border border-amber-500/30 rounded-2xl text-xs text-slate-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-300">Custom Cashiers & Managers Disabled</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Adding custom Cashiers and optional Managers is disabled on <strong>Starter Monthly</strong>. Upgrade to <strong>Business Pro Monthly</strong> above to unlock staff creation and shift switching.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {isOwner && showAddForm && (
                  <form onSubmit={handleCreateStaff} className="p-3.5 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-2.5">
                    {formError && (
                      <div className="p-2 bg-rose-500/15 border border-rose-500/40 rounded-lg text-[11px] text-rose-300">
                        {formError}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStaffRole('cashier')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          staffRole === 'cashier'
                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Cashier (Required Staff)
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffRole('manager')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                          staffRole === 'manager'
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Manager (Optional)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="email"
                        placeholder="Login Email *"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Phone (+92 3...)"
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="password"
                        placeholder="Staff Password *"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        required
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Create {staffRole === 'manager' ? 'Manager' : 'Cashier'} Account
                      </button>
                    </div>
                  </form>
                )}

                {teamForShop.length === 0 ? (
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">
                    No cashier or manager has been created for <strong className="text-white">{activeShop.name}</strong> yet.
                    {isOwner && ' Click "Add Cashier / Manager" above to create store-specific staff.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teamForShop.map((member) => {
                      const isActiveOperator = member.id === currentUser.id;
                      return (
                        <div
                          key={member.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                            isActiveOperator
                              ? 'bg-indigo-600/15 border-indigo-500'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span className="truncate">{member.name}</span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-slate-800 text-blue-300">
                                {member.role}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {member.email} {member.phone ? `• ${member.phone}` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOwner && !isActiveOperator && (
                              <button
                                type="button"
                                onClick={() => {
                                  onLoginUser(member);
                                  onClose();
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Switch Shift
                              </button>
                            )}
                            {isActiveOperator && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            )}
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => onRemoveStaff(member.id)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600/20 text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="Remove staff member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{entitlements.planName} • {activeShop.name}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
