import React, { useState } from 'react';
import { User, UserRole } from '../types/pos';
import { DEMO_USERS } from '../data/demoData';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  Store,
  Sparkles
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLoginUser: (user: User) => void;
  onLogout: () => void;
  onTriggerOnboarding: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginUser,
  onLogout,
  onTriggerOnboarding,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('owner');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Check if matches demo email
    const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      onLoginUser(matched);
    } else {
      // Create new authenticated session
      onLoginUser({
        id: `usr_${Date.now()}`,
        name: email.split('@')[0],
        email,
        phone: '+92 300 0000000',
        role: 'owner',
      });
    }
    onClose();
  };

  const handleCustomSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newUser: User = {
      id: `usr_${Date.now()}`,
      name,
      email,
      phone: phone || '+92 300 1234567',
      role: signupRole,
    };

    onLoginUser(newUser);
    onClose();
    // Prompt onboarding wizard after first signup!
    onTriggerOnboarding();
  };

  const handleDemoLogin = (user: User) => {
    onLoginUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mode === 'login' && 'Smart POS Sign In'}
                {mode === 'signup' && 'Create Store Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h3>
              <div className="text-[11px] text-slate-400">Secure Session & Role Management</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active User Status */}
        <div className="p-3 bg-blue-950/30 border-b border-blue-900/30 px-5 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Current Session: </span>
            <strong className="text-white">{currentUser.name}</strong>
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300">
              {currentUser.role}
            </span>
          </div>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            Sign Out
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1-Click Role Switchers */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              1-Click Demo Profiles (Switch Roles)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleDemoLogin(u)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    currentUser.id === u.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{u.name.split(' ')[0]}</div>
                  <div className="text-[10px] uppercase font-mono text-blue-400 font-semibold">
                    {u.role}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Or Custom Auth Form
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleCustomLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="tariq@citymart.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Sign In to Smart POS &rarr;
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">New store owner? </span>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleCustomSignup} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asad Umar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="asad@mart.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Role</label>
                <select
                  value={signupRole}
                  onChange={(e) => setSignupRole(e.target.value as UserRole)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="owner">Owner (Full Store Admin)</option>
                  <option value="manager">Manager (Inventory & Staff)</option>
                  <option value="cashier">Cashier (Point of Sale)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all cursor-pointer mt-2"
              >
                Register & Start Setup Wizard &rarr;
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-400">Already registered? </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-blue-400 font-bold hover:underline"
                >
                  Back to Sign in
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {forgotSubmitted ? (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <div className="text-xs font-bold text-emerald-300">
                    Password Reset Link Sent
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Check your email for reset instructions.
                  </div>
                  <button
                    onClick={() => {
                      setForgotSubmitted(false);
                      setMode('login');
                    }}
                    className="mt-2 text-xs text-blue-400 underline"
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setForgotSubmitted(true);
                  }}
                  className="space-y-3"
                >
                  <p className="text-xs text-slate-400">
                    Enter your store user email and we will send you a password recovery link.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="user@citymart.pk"
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                  >
                    Send Recovery Link
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel & Return
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
