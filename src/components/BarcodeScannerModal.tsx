import React, { useState } from 'react';
import { Product } from '../types/pos';
import { 
  Camera, 
  Flashlight, 
  FlashlightOff, 
  RotateCw, 
  Search, 
  Barcode, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  X,
  Sparkles,
  Globe,
  Volume2
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductFound: (product: Product) => void;
  onAddNewProduct: (product: Partial<Product>) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductFound,
  onAddNewProduct,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [manualCode, setManualCode] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'searching' | 'found_online' | 'not_found'>('idle');
  const [onlineResult, setOnlineResult] = useState<Partial<Product> | null>(null);
  const [lookupSource, setLookupSource] = useState<string>('Local');

  // New product form inputs if looked up online
  const [costPrice, setCostPrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(150);
  const [stockQuantity, setStockQuantity] = useState<number>(20);

  if (!isOpen) return null;

  // Audio feedback helper (plays a POS beep)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime); // High pitch POS scan beep (A6)
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (_) {
      // AudioContext may be restricted by browser policy
    }
  };

  const handleScanCode = async (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    playBeep();

    // 1. Search local inventory first
    const existing = products.find(
      (p) => p.barcode === clean || p.qrCode === clean
    );

    if (existing) {
      onProductFound(existing);
      onClose();
      return;
    }

    // 2. Not in local inventory -> Invoke ProductLookupService
    setLookupState('searching');

    // A. Try real OpenFoodFacts API with 3s timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const resp = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          const foundName = p.product_name || p.product_name_en || 'Imported Food Product';
          const foundBrand = p.brands || 'International Brand';
          const foundCat = p.categories_tags && p.categories_tags.length > 0 
            ? p.categories_tags[0].replace('en:', '').replace(/-/g, ' ') 
            : 'Grocery';

          setOnlineResult({
            barcode: clean,
            name: foundName,
            brand: foundBrand,
            category: foundCat.charAt(0).toUpperCase() + foundCat.slice(1),
            description: p.generic_name || p.ingredients_text || '',
            unit: 'piece',
            taxPercentage: 5,
          });
          setCostPrice(280);
          setSellingPrice(350);
          setStockQuantity(24);
          setLookupSource('OpenFoodFacts Global API');
          setLookupState('found_online');
          return;
        }
      }
    } catch (_) {
      // Network or abort, proceed to regional mock registry
    }

    // B. Regional Pakistani Mock Registry
    if (clean === '896400099999' || clean.startsWith('89640009')) {
      setOnlineResult({
        barcode: clean,
        name: 'Shan Special Bombay Biryani Masala 60g',
        category: 'Grocery',
        brand: 'Shan Foods',
        description: 'Authentic Bombay biryani recipe mix with whole aromatic spices and dried plums.',
        unit: 'packet',
        taxPercentage: 5,
      });
      setCostPrice(120);
      setSellingPrice(150);
      setStockQuantity(35);
      setLookupSource('Mock Regional FMCG Registry');
      setLookupState('found_online');
      return;
    }

    if (clean === '896400088888') {
      setOnlineResult({
        barcode: clean,
        name: 'Mitchells Mango Jam 450g Glass Jar',
        category: 'Grocery',
        brand: 'Mitchells',
        description: 'Pure fruit jam prepared from fresh Chaunsa and Sindhri mangoes.',
        unit: 'piece',
        taxPercentage: 5,
      });
      setCostPrice(340);
      setSellingPrice(420);
      setStockQuantity(18);
      setLookupSource('Mock Regional FMCG Registry');
      setLookupState('found_online');
      return;
    }

    // C. Not found online -> Fall back to manual Add Product form
    setOnlineResult({ barcode: clean });
    setCostPrice(100);
    setSellingPrice(140);
    setStockQuantity(10);
    setLookupSource('Unregistered Barcode');
    setLookupState('not_found');
  };

  const handleSaveOnlineProduct = () => {
    if (!onlineResult) return;
    const newProduct: Partial<Product> = {
      ...onlineResult,
      costPrice,
      sellingPrice,
      stockQuantity,
      minimumStockLimit: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddNewProduct(newProduct);
    setLookupState('idle');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Camera className="w-5 h-5 text-blue-400" />
            Barcode & QR Scanner (mobile_scanner)
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {lookupState === 'idle' && (
            <>
              {/* Simulated Camera Viewfinder */}
              <div className="relative aspect-video rounded-xl bg-slate-950 border-2 border-dashed border-blue-500/40 overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-blue-500/5 pointer-events-none" />

                {/* Laser scan line animation */}
                <div className="absolute left-8 right-8 h-0.5 bg-red-500/80 shadow-[0_0_12px_#ef4444] animate-pulse" />

                {/* Reticle corner markers */}
                <div className="w-48 h-32 border-2 border-blue-400/80 rounded-lg relative flex items-center justify-center">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                    mobile_scanner active
                  </div>
                  <Barcode className="w-16 h-16 text-slate-600/60" />
                </div>

                {/* Overlay Controls */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <button
                    onClick={() => setFlashlightOn(!flashlightOn)}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      flashlightOn
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {flashlightOn ? <Flashlight className="w-4 h-4" /> : <FlashlightOff className="w-4 h-4" />}
                    Flash {flashlightOn ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => setCameraFacing(cameraFacing === 'back' ? 'front' : 'back')}
                    className="p-2 rounded-lg text-xs font-semibold bg-slate-800/80 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCw className="w-4 h-4" />
                    Flip Camera
                  </button>
                </div>
              </div>

              {/* Manual Input or USB Scanner */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Manual Input or USB Barcode Gun</span>
                  <span className="text-[11px] text-slate-500">Press Enter to scan</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. 896400012001 or scan with USB gun"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualCode) {
                          handleScanCode(manualCode);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => manualCode && handleScanCode(manualCode)}
                    disabled={!manualCode}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Scan
                  </button>
                </div>
              </div>

              {/* Barcode Test Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Barcode Presets (Click to Simulate Scan)
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Preset 1: Existing local item */}
                  <button
                    onClick={() => handleScanCode('896400012001')}
                    className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
                  >
                    <div className="font-semibold text-white truncate">Rooh Afza 800ml</div>
                    <div className="text-[10px] text-emerald-400 font-mono">Local Item &rarr; Add to Cart</div>
                  </button>

                  {/* Preset 2: Existing local item */}
                  <button
                    onClick={() => handleScanCode('896400014001')}
                    className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 transition-colors"
                  >
                    <div className="font-semibold text-white truncate">Guard Basmati Rice 5kg</div>
                    <div className="text-[10px] text-emerald-400 font-mono">Local Item &rarr; Add to Cart</div>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  {/* Preset 3: Regional Pakistani Unregistered -> Mock ProductLookupService */}
                  <button
                    onClick={() => handleScanCode('896400099999')}
                    className="p-2 text-left rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-700/50 transition-colors text-indigo-200"
                  >
                    <div className="font-semibold truncate flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      Shan Bombay Biryani
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono">Regional Lookup Test</div>
                  </button>

                  {/* Preset 4: Real Global OpenFoodFacts Barcode: Nutella 350g */}
                  <button
                    onClick={() => handleScanCode('3017620422003')}
                    className="p-2 text-left rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/50 transition-colors text-emerald-200"
                  >
                    <div className="font-semibold truncate flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400" />
                      Nutella Spread 350g
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">Real OpenFoodFacts API</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Searching Online State */}
          {lookupState === 'searching' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
              <div className="text-white font-bold text-sm">Querying ProductLookupService...</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Barcode not found in local store. Checking OpenFoodFacts REST API & Global FMCG Registry...
              </p>
            </div>
          )}

          {/* Found Online -> Review & Save to Inventory */}
          {lookupState === 'found_online' && onlineResult && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Product Found via {lookupSource}!
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Metadata retrieved. Review details and enter store cost & selling prices.
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Barcode:</span>
                  <span className="text-white font-mono font-bold">{onlineResult.barcode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Product Name:</span>
                  <input
                    type="text"
                    value={onlineResult.name || ''}
                    onChange={(e) => setOnlineResult({ ...onlineResult, name: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block font-medium">Category:</span>
                    <input
                      type="text"
                      value={onlineResult.category || ''}
                      onChange={(e) => setOnlineResult({ ...onlineResult, category: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Brand:</span>
                    <input
                      type="text"
                      value={onlineResult.brand || ''}
                      onChange={(e) => setOnlineResult({ ...onlineResult, brand: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-500 block font-medium">Cost (PKR):</span>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Selling (PKR):</span>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Initial Stock:</span>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLookupState('idle')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveOnlineProduct}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  <Plus className="w-4 h-4" />
                  Save & Add to Inventory
                </button>
              </div>
            </div>
          )}

          {/* Not Found Anywhere -> Manual Quick Add */}
          {lookupState === 'not_found' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    Product Not Found in Global Databases
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    This barcode is not yet registered. Enter details manually to save to City Mart inventory.
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Barcode:</span>
                  <span className="text-white font-mono font-bold">{onlineResult?.barcode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Product Name:</span>
                  <input
                    type="text"
                    placeholder="e.g. Local Fresh Milk Bread"
                    value={onlineResult?.name || ''}
                    onChange={(e) => setOnlineResult({ ...onlineResult, name: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 block font-medium">Category:</span>
                    <input
                      type="text"
                      placeholder="e.g. Bakery"
                      value={onlineResult?.category || ''}
                      onChange={(e) => setOnlineResult({ ...onlineResult, category: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Brand:</span>
                    <input
                      type="text"
                      placeholder="e.g. Dawn"
                      value={onlineResult?.brand || ''}
                      onChange={(e) => setOnlineResult({ ...onlineResult, brand: e.target.value })}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-500 block font-medium">Cost (PKR):</span>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Selling (PKR):</span>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Stock:</span>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLookupState('idle')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveOnlineProduct}
                  disabled={!onlineResult?.name}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Save to Inventory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
