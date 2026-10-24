import React, { useState } from 'react';
import { Shop } from '../types/pos';
import { 
  Store, 
  MapPin, 
  Phone, 
  User, 
  DollarSign, 
  Percent, 
  FileText, 
  CheckCircle2, 
  X, 
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveShop: (shop: Shop) => void;
  existingShop?: Shop;
}

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onSaveShop,
  existingShop,
}) => {
  const [shopName, setShopName] = useState(existingShop?.name || 'City Mart - F-7 Branch');
  const [ownerName, setOwnerName] = useState(existingShop?.ownerName || 'Tariq Mehmood');
  const [phone, setPhone] = useState(existingShop?.phone || '+92 51 2891234');
  const [category, setCategory] = useState(existingShop?.category || 'Grocery & Supermarket');
  const [address, setAddress] = useState(existingShop?.address || 'Shop 14-16, F-7 Markaz, Jinnah Super');
  const [city, setCity] = useState(existingShop?.city || 'Islamabad');
  const [currency, setCurrency] = useState(existingShop?.currency || 'PKR');
  const [taxEnabled, setTaxEnabled] = useState(existingShop?.taxEnabled ?? true);
  const [defaultTaxRate, setDefaultTaxRate] = useState(existingShop?.defaultTaxRate ?? 5);
  const [receiptMessage, setReceiptMessage] = useState(
    existingShop?.receiptMessage || 'Thank you for shopping at City Mart! Exchange within 3 days with receipt.'
  );
  const [thermalPrinterWidth, setThermalPrinterWidth] = useState<'58mm' | '80mm'>(
    existingShop?.thermalPrinterWidth || '80mm'
  );
  const [allowNegativeStock, setAllowNegativeStock] = useState(existingShop?.allowNegativeStock ?? false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() || !phone.trim() || !address.trim()) {
      alert('Please fill in all required fields (Shop Name, Phone, and Address).');
      return;
    }

    const savedShop: Shop = {
      id: existingShop?.id || `shop_${Date.now()}`,
      name: shopName,
      ownerName,
      phone,
      category,
      address,
      city,
      currency,
      taxEnabled,
      defaultTaxRate: taxEnabled ? defaultTaxRate : 0,
      receiptMessage,
      thermalPrinterWidth,
      allowNegativeStock,
    };

    onSaveShop(savedShop);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Store Setup & Onboarding Wizard</h2>
              <p className="text-xs text-slate-400">Configure your store identity, currency, and tax rates</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Section 1: Business Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              1. Business Information
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Shop / Trading Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. City Mart"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Owner / Proprietor Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Official Phone / Mobile *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Business Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Grocery & Supermarket">Grocery & Supermarket</option>
                <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                <option value="Mobile & Electronics Shop">Mobile & Electronics Shop</option>
                <option value="Clothing & Garments">Clothing & Garments</option>
                <option value="General Store">General Store</option>
                <option value="Bakery & Sweets">Bakery & Sweets</option>
              </select>
            </div>
          </div>

          {/* Section 2: Location */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              2. Location Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Shop number, Street, Commercial Market"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Islamabad"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Tax */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              3. Currency & Taxation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold focus:border-blue-500 focus:outline-none"
                >
                  <option value="PKR">PKR — Pakistani Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="SAR">SAR — Saudi Riyal</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">GST / Sales Tax</div>
                  <div className="text-[10px] text-slate-400">Calculate tax at checkout</div>
                </div>
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>

            {taxEnabled && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Default Tax Rate (%)
                </label>
                <div className="relative">
                  <Percent className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Receipt & Peripherals */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              4. Receipt Customization & Hardware
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Thermal Printer Paper Width
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setThermalPrinterWidth('80mm')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    thermalPrinterWidth === '80mm'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  80mm Standard POS (Recommended)
                </button>

                <button
                  type="button"
                  onClick={() => setThermalPrinterWidth('58mm')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    thermalPrinterWidth === '58mm'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  58mm Compact Mobile
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Receipt Footer Message
              </label>
              <textarea
                rows={2}
                value={receiptMessage}
                onChange={(e) => setReceiptMessage(e.target.value)}
                placeholder="Thank you for shopping! Exchange allowed within 3 days."
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Save & Apply Store Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
