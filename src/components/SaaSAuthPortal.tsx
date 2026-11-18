import React, { useState } from 'react';
import { User, Shop, Product, SubscriptionRequest } from '../types/pos';
import { generateStarterProducts } from '../utils/starterCatalog';
import { CITY_OPTIONS, CUSTOM_CITY_OPTION } from '../data/cities';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PAYMENT_METHODS,
  SUPER_ADMIN_CREDENTIALS,
  getEffectiveSubscriptionStatus,
} from '../data/saasConfig';
import {
  Building2,
  Store,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  CreditCard,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export interface SaaSAuthPortalProps {
  onLogin: (user: User, preferredShop?: Shop) => void;
  onSuperAdminLogin: () => void;
  onRegister: (
    newUser: User,
    newShop: Shop,
    starterProducts: Product[],
    request: SubscriptionRequest
  ) => void;
  onRenewSubscription: (shopId: string, request: SubscriptionRequest) => void;
  onRefreshCloud?: () => Promise<{ users: User[]; shops: Shop[]; requests: SubscriptionRequest[] }>;
  existingShops: Shop[];
  existingUsers: User[];
  authNotice?: string | null;
}

export const SaaSAuthPortal: React.FC<SaaSAuthPortalProps> = ({
  onLogin,
  onSuperAdminLogin,
  onRegister,
  onRenewSubscription,
  onRefreshCloud,
  existingShops,
  existingUsers,
  authNotice,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'admin'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifyingCloud, setIsVerifyingCloud] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Blocked / Expired / Pending Renewal context
  const [blockedShopContext, setBlockedShopContext] = useState<{
    shop: Shop;
    status: 'pending_approval' | 'expired' | 'rejected' | 'blocked';
  } | null>(null);

  // Renewal payment state
  const [renewPlanId, setRenewPlanId] = useState(SUBSCRIPTION_PLANS[1].id);
  const [renewMethod, setRenewMethod] = useState(SUBSCRIPTION_PAYMENT_METHODS[0].id);
  const [renewRef, setRenewRef] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Super Admin Login form state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Registration Step 1: User Credentials
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('+92 3');

  // Registration Step 2: Business Setup (Mianwali included prominently)
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('Grocery & Supermarket');
  const [selectedCityOption, setSelectedCityOption] = useState('Mianwali');
  const [customCity, setCustomCity] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizCurrency, setBizCurrency] = useState('PKR');
  const [bizTaxRate, setBizTaxRate] = useState(5);
  const [populateStarter, setPopulateStarter] = useState(true);

  // Registration Step 3: Monthly Subscription Checkout
  const [selectedPlanId, setSelectedPlanId] = useState(SUBSCRIPTION_PLANS[1].id);
  const [paymentMethod, setPaymentMethod] = useState(SUBSCRIPTION_PAYMENT_METHODS[0].id);
  const [paymentRef, setPaymentRef] = useState('');

  const findShopForUserFromList = (user: User, shopList: Shop[]): Shop | undefined => {
    if (user.shopId) {
      const exact = shopList.find((s) => s.id === user.shopId);
      if (exact) return exact;
    }
    return shopList.find(
      (s) =>
        user.businessIds?.includes(s.id) ||
        s.ownerId === user.id ||
        s.ownerEmail?.toLowerCase() === user.email.toLowerCase()
    );
  };

  // Handle Business Owner / Staff Login (checks local + live Cloud Firestore for cross-device access)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setBlockedShopContext(null);

    const emailClean = loginEmail.trim().toLowerCase();
    if (!emailClean || !loginPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    // Also allow admin credentials on login form seamlessly if entered here
    if (
      emailClean === SUPER_ADMIN_CREDENTIALS.email.toLowerCase() &&
      loginPassword === SUPER_ADMIN_CREDENTIALS.password
    ) {
      if (onRefreshCloud) {
        await onRefreshCloud().catch(() => {});
      }
      onSuperAdminLogin();
      return;
    }

    let candidateUsers = existingUsers;
    let candidateShops = existingShops;

    if (onRefreshCloud) {
      setIsVerifyingCloud(true);
      try {
        const cloud = await onRefreshCloud();
        const userMap = new Map<string, User>();
        for (const u of existingUsers) userMap.set(u.id, u);
        for (const u of cloud.users) userMap.set(u.id, u);
        candidateUsers = Array.from(userMap.values());

        const shopMap = new Map<string, Shop>();
        for (const s of existingShops) shopMap.set(s.id, s);
        for (const s of cloud.shops) shopMap.set(s.id, s);
        candidateShops = Array.from(shopMap.values());
      } finally {
        setIsVerifyingCloud(false);
      }
    }

    const foundUser = candidateUsers.find(
      (u) => u.email.trim().toLowerCase() === emailClean
    );

    if (!foundUser) {
      setErrorMessage('No business account found with this email. Please register your business first.');
      return;
    }

    if ((foundUser.password || '') !== loginPassword) {
      setErrorMessage('Incorrect password. Please check your credentials.');
      return;
    }

    const userShop = findShopForUserFromList(foundUser, candidateShops);
    if (!userShop) {
      setErrorMessage('No business profile is assigned to this user account.');
      return;
    }

    const effectiveStatus = getEffectiveSubscriptionStatus(userShop);
    if (effectiveStatus !== 'active') {
      setBlockedShopContext({ shop: userShop, status: effectiveStatus });
      return;
    }

    onLogin(foundUser, userShop);
  };

  // Handle Super Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      adminEmail.trim().toLowerCase() === SUPER_ADMIN_CREDENTIALS.email.toLowerCase() &&
      adminPassword === SUPER_ADMIN_CREDENTIALS.password
    ) {
      if (onRefreshCloud) {
        setIsVerifyingCloud(true);
        await onRefreshCloud().catch(() => {});
        setIsVerifyingCloud(false);
      }
      onSuperAdminLogin();
    } else {
      setErrorMessage('Invalid Super Admin email or password.');
    }
  };

  // Handle Business Registration + Monthly Subscription Purchase
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalCity =
      selectedCityOption === CUSTOM_CITY_OPTION ? customCity.trim() : selectedCityOption;

    if (!regName.trim() || !regEmail.trim() || regPassword.length < 6) {
      setErrorMessage('Please enter full name, email, and a password of at least 6 characters.');
      return;
    }
    if (!bizName.trim() || !bizAddress.trim() || !finalCity) {
      setErrorMessage('Please enter business name, city, and full shop address.');
      return;
    }
    if (!paymentRef.trim()) {
      setErrorMessage('Please complete the monthly subscription payment and enter your Transaction ID / Reference.');
      return;
    }

    const emailExists = existingUsers.some(
      (u) => u.email.trim().toLowerCase() === regEmail.trim().toLowerCase()
    );
    if (emailExists) {
      setErrorMessage('An account with this email already exists. Please sign in.');
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];
    const nowIso = new Date().toISOString();
    const shopId = `shop_${Date.now()}`;
    const userId = `usr_owner_${Date.now()}`;
    const reqId = `subreq_${Date.now()}`;

    const request: SubscriptionRequest = {
      id: reqId,
      shopId,
      shopName: bizName.trim(),
      ownerName: regName.trim(),
      ownerEmail: regEmail.trim(),
      ownerPhone: regPhone.trim(),
      planId: plan.id,
      planName: plan.name,
      amount: plan.pricePkr,
      currency: 'PKR',
      paymentMethod,
      paymentReference: paymentRef.trim(),
      status: 'pending',
      requestedAt: nowIso,
    };

    const newShop: Shop = {
      id: shopId,
      name: bizName.trim(),
      ownerName: regName.trim(),
      ownerId: userId,
      ownerEmail: regEmail.trim(),
      phone: regPhone.trim(),
      category: bizCategory,
      address: bizAddress.trim(),
      city: finalCity,
      currency: bizCurrency,
      taxEnabled: bizTaxRate > 0,
      defaultTaxRate: bizTaxRate,
      receiptMessage: `Thank you for shopping at ${bizName.trim()}! Exchange within 3 days with receipt.`,
      allowNegativeStock: false,
      thermalPrinterWidth: '80mm',
      subscriptionStatus: 'pending_approval',
      subscriptionPlanId: plan.id,
      subscriptionPlanName: plan.name,
      subscriptionFee: plan.pricePkr,
      subscriptionPaymentMethod: paymentMethod,
      subscriptionPaymentRef: paymentRef.trim(),
      subscriptionRequests: [request],
      createdAt: nowIso,
    };

    const newUser: User = {
      id: userId,
      name: regName.trim(),
      email: regEmail.trim(),
      role: 'owner',
      phone: regPhone.trim(),
      password: regPassword,
      shopId,
      businessIds: [shopId],
      subscriptionPlan: plan.name,
      createdAt: nowIso,
    };

    const starterItems = populateStarter
      ? generateStarterProducts(shopId, bizCategory, bizCurrency)
      : [];

    onRegister(newUser, newShop, starterItems, request);

    // Pre-fill login email and show pending confirmation (do NOT auto-login until Admin approves!)
    setLoginEmail(regEmail.trim());
    setLoginPassword('');
    setPaymentRef('');
    setRegPassword('');
    setTab('login');
    setBlockedShopContext({ shop: newShop, status: 'pending_approval' });
    setSuccessMessage(
      `Business "${newShop.name}" registered & monthly payment (${plan.name} • Ref: ${request.paymentReference}) sent to Admin for approval!`
    );
  };

  // Handle Renewal Payment for Expired / Rejected Business
  const handleRenewalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedShopContext || !renewRef.trim()) {
      setErrorMessage('Please enter your monthly payment Transaction ID / Reference.');
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === renewPlanId) || SUBSCRIPTION_PLANS[0];
    const req: SubscriptionRequest = {
      id: `subreq_${Date.now()}`,
      shopId: blockedShopContext.shop.id,
      shopName: blockedShopContext.shop.name,
      ownerName: blockedShopContext.shop.ownerName,
      ownerEmail: blockedShopContext.shop.ownerEmail || '',
      ownerPhone: blockedShopContext.shop.phone,
      planId: plan.id,
      planName: plan.name,
      amount: plan.pricePkr,
      currency: 'PKR',
      paymentMethod: renewMethod,
      paymentReference: renewRef.trim(),
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    onRenewSubscription(blockedShopContext.shop.id, req);
    setBlockedShopContext({
      shop: {
        ...blockedShopContext.shop,
        subscriptionStatus: 'pending_approval',
        subscriptionPlanName: plan.name,
        subscriptionFee: plan.pricePkr,
        subscriptionPaymentMethod: renewMethod,
        subscriptionPaymentRef: renewRef.trim(),
      },
      status: 'pending_approval',
    });
    setRenewRef('');
    setErrorMessage(null);
    setSuccessMessage(
      'Renewal payment submitted to Super Admin! Your business data remains safely saved and login will unlock once approved.'
    );
  };

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[0];

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 relative overflow-x-hidden font-sans">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-2.5">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            OmniPOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Cloud SaaS</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Register your shop, subscribe monthly, get verified by Admin, and manage your POS, inventory, staff & Khata.
          </p>
        </div>

        {/* Auto-logout / Session Expiry Alert */}
        {authNotice && (
          <div className="mb-4 p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl text-amber-200 text-xs font-semibold flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{authNotice}</span>
          </div>
        )}

        {/* 3-Mode Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Business Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage(null);
              setBlockedShopContext(null);
            }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register & Plan
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('admin');
              setErrorMessage(null);
              setBlockedShopContext(null);
            }}
            className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              tab === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Login
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: BUSINESS OWNER / STAFF LOGIN */}
        {tab === 'login' && (
          <div className="space-y-4">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Owner / Cashier / Manager Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifyingCloud}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isVerifyingCloud ? 'Checking Cloud Account...' : 'Sign In to Business'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Subscription Status Guard Card (Pending / Blocked / Expired / Rejected) */}
            {blockedShopContext && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3">
                <div className="flex items-start gap-2.5">
                  {blockedShopContext.status === 'pending_approval' ? (
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">
                      {blockedShopContext.shop.name} —{' '}
                      {blockedShopContext.status === 'pending_approval' && 'Pending Super Admin Approval'}
                      {blockedShopContext.status === 'blocked' && 'Business Blocked by Admin'}
                      {blockedShopContext.status === 'expired' && 'Monthly Subscription Expired'}
                      {blockedShopContext.status === 'rejected' && 'Subscription Payment Rejected'}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {blockedShopContext.status === 'pending_approval' &&
                        `Payment Ref (${blockedShopContext.shop.subscriptionPaymentRef || 'Pending'}) is in Admin queue. Once Super Admin approves, you can log in with your email and password.`}
                      {blockedShopContext.status === 'blocked' &&
                        'Access to this business has been suspended by the Platform Admin. Please contact your administrator.'}
                      {blockedShopContext.status === 'expired' &&
                        'Your 1-month subscription has completed and login is temporarily locked. All your products, sales, Khata & staff data remain intact. Renew below to restore access.'}
                      {blockedShopContext.status === 'rejected' &&
                        `Reason: ${blockedShopContext.shop.subscriptionRejectionReason || 'Payment not verified'}. Submit a new monthly payment below.`}
                    </p>
                  </div>
                </div>

                {(blockedShopContext.status === 'expired' || blockedShopContext.status === 'rejected') && (
                  <form onSubmit={handleRenewalSubmit} className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>BUY MONTHLY SUBSCRIPTION TO UNLOCK BUSINESS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={renewPlanId}
                        onChange={(e) => setRenewPlanId(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {SUBSCRIPTION_PLANS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — PKR {p.pricePkr.toLocaleString()}/mo
                          </option>
                        ))}
                      </select>

                      <select
                        value={renewMethod}
                        onChange={(e) => setRenewMethod(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {SUBSCRIPTION_PAYMENT_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={renewRef}
                      onChange={(e) => setRenewRef(e.target.value)}
                      placeholder="Enter Payment Transaction ID / Ref (e.g. TID-984512)"
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    />

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Submit Monthly Renewal Payment
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
              New shop owner? Switch to <button type="button" onClick={() => setTab('register')} className="text-emerald-400 font-bold hover:underline cursor-pointer">Register & Plan</button> to create your business & buy a monthly subscription.
            </div>
          </div>
        )}

        {/* TAB 2: REGISTER BUSINESS + BUY MONTHLY SUBSCRIPTION */}
        {tab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[64vh] overflow-y-auto pr-1">
            {/* Step 1: Owner Details */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                <UserIcon className="w-4 h-4" />
                <span>STEP 1: OWNER ACCOUNT CREDENTIALS</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Owner Full Name *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Muhammad Awais Niazi"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Login Email *</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. awais@mianwalimart.pk"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Create Password *</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Business Setup */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <Building2 className="w-4 h-4" />
                <span>STEP 2: BUSINESS & CITY (MIANWALI INCLUDED)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Business / Shop Name *</label>
                  <input
                    type="text"
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    placeholder="e.g. Niazi Super Store"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Business Category *</label>
                  <select
                    value={bizCategory}
                    onChange={(e) => setBizCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Grocery & Supermarket">Grocery & Supermarket</option>
                    <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                    <option value="Electronics & Tech">Electronics & Mobile Accessories</option>
                    <option value="Fashion & Apparel">Fashion, Garments & Shoes</option>
                    <option value="Restaurant & Cafe">Restaurant, Fast Food & Bakery</option>
                    <option value="General Retail">General Retail & Departmental Store</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">City *</label>
                  <select
                    value={selectedCityOption}
                    onChange={(e) => setSelectedCityOption(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CITY_OPTIONS.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Store Currency *</label>
                  <select
                    value={bizCurrency}
                    onChange={(e) => setBizCurrency(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="GBP">GBP (British Pound)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>
              </div>

              {selectedCityOption === CUSTOM_CITY_OPTION && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Enter Custom City Name *</label>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Type your city or town name..."
                    required
                    className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Shop Address / Area *</label>
                <input
                  type="text"
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  placeholder="e.g. Main Bazar, PAF Road, Mianwali"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preload Category Starter Inventory</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Loads sample products with barcodes for {bizCategory}
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={populateStarter}
                  onChange={(e) => setPopulateStarter(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded bg-slate-950 border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Step 3: Monthly Subscription Purchase */}
            <div className="p-3.5 bg-slate-950/70 border border-indigo-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <CreditCard className="w-4 h-4" />
                  <span>STEP 3: BUY 1-MONTH SUBSCRIPTION</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  30 Days Access
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUBSCRIPTION_PLANS.map((plan) => {
                  const selected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selected
                          ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white">{plan.name}</span>
                        <span className="text-[10px] font-bold text-indigo-300">{plan.badge}</span>
                      </div>
                      <div className="text-sm font-black font-mono text-emerald-400 mt-1">
                        PKR {plan.pricePkr.toLocaleString()} / month
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-snug">{plan.description}</div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {SUBSCRIPTION_PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.account})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Transaction ID / Payment Ref *
                  </label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. JC-84729104"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Monthly Plan Payable:</span>
                <span className="font-mono font-bold text-emerald-400">
                  PKR {selectedPlan.pricePkr.toLocaleString()} (Sent for Admin Approval)
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Pay & Submit Business for Admin Approval</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 3: SUPER ADMIN LOGIN */}
        {tab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white">Super Admin Control Console</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign in with your administrator credentials to review monthly subscription requests, approve or reject businesses, or block ongoing subscriptions.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Super Admin Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter admin email"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Admin Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sign In as Super Admin</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Multi-Tenant SaaS • Admin Subscription Control • Cloud Firestore Sync</span>
          </p>
        </div>
      </div>
    </div>
  );
};
