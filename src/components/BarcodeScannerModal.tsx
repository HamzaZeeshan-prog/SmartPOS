import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Product } from '../types/pos';
import { BarcodeLookupResult, lookupBarcodeOnline } from '../services/barcodeLookupService';
import { findProductByBarcode } from '../utils/barcodeUtils';
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
  Globe,
  Calendar,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  shopCurrency?: string;
  pickMode?: boolean;
  onBarcodePicked?: (barcode: string, lookup: BarcodeLookupResult | null) => void;
  onProductFound: (product: Product) => void;
  onAddNewProduct: (product: Partial<Product>) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  shopCurrency = 'PKR',
  pickMode = false,
  onBarcodePicked,
  onProductFound,
  onAddNewProduct,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'searching' | 'found_online' | 'not_found'>('idle');
  const [onlineResult, setOnlineResult] = useState<Partial<Product> | null>(null);
  const [lookupSource, setLookupSource] = useState<string>('Local');
  const [priceSource, setPriceSource] = useState<string>('Smart Category Estimate');

  const [costPrice, setCostPrice] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(150);
  const [stockQuantity, setStockQuantity] = useState<number>(20);
  const [expiryDate, setExpiryDate] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const isProcessingRef = useRef(false);
  const handleScanCodeRef = useRef<(code: string) => void>(() => {});

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Ignore audio policy restrictions
    }
  };

  const stopCamera = () => {
    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const resetModalState = () => {
    stopCamera();
    isProcessingRef.current = false;
    setLookupState('idle');
    setManualCode('');
    setOnlineResult(null);
    setExpiryDate('');
    setFlashlightOn(false);
    setCameraError(null);
  };

  const handleScanCode = async (code: string) => {
    const clean = code.trim();
    if (!clean || isProcessingRef.current) return;
    isProcessingRef.current = true;
    stopCamera();
    playBeep();

    const existing = findProductByBarcode(products, clean);

    if (pickMode) {
      if (existing) {
        const mapped: BarcodeLookupResult = {
          barcode: existing.barcode || clean,
          found: true,
          source: 'Existing Store Catalog',
          name: existing.name,
          brand: existing.brand,
          category: existing.category,
          unit: existing.unit,
          description: existing.description || '',
          costPrice: existing.costPrice,
          sellingPrice: existing.sellingPrice,
          priceSource: 'Catalog Price',
        };
        onBarcodePicked?.(existing.barcode || clean, mapped);
        resetModalState();
        onClose();
        return;
      }

      setLookupState('searching');
      const online = await lookupBarcodeOnline(clean, shopCurrency);
      onBarcodePicked?.(clean, online);
      resetModalState();
      onClose();
      return;
    }

    // POS Mode: catalog match immediately triggers quantity prompt dialog
    if (existing) {
      onProductFound(existing);
      resetModalState();
      onClose();
      return;
    }

    setLookupState('searching');
    const result = await lookupBarcodeOnline(clean, shopCurrency);

    if (result) {
      setOnlineResult({
        barcode: clean,
        name: result.name,
        brand: result.brand,
        category: result.category,
        description: result.description,
        unit: result.unit,
        taxPercentage: 5,
      });
      setCostPrice(result.costPrice);
      setSellingPrice(result.sellingPrice);
      setStockQuantity(24);
      setLookupSource(result.source);
      setPriceSource(result.priceSource);
      setLookupState('found_online');
      isProcessingRef.current = false;
      return;
    }

    setOnlineResult({ barcode: clean });
    setCostPrice(100);
    setSellingPrice(140);
    setStockQuantity(10);
    setLookupSource('Unregistered Barcode');
    setPriceSource('Manual Price');
    setLookupState('not_found');
    isProcessingRef.current = false;
  };

  handleScanCodeRef.current = handleScanCode;

  useEffect(() => {
    if (!isOpen || lookupState !== 'idle') {
      stopCamera();
      return;
    }

    let cancelled = false;
    isProcessingRef.current = false;
    setCameraError(null);

    const startLiveScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        setCameraError('Live camera unavailable on this browser. Use USB gun or manual barcode input below.');
        return;
      }

      try {
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: cameraFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current,
          (result) => {
            if (cancelled || !result || isProcessingRef.current) return;
            const rawText = result.getText()?.trim();
            if (rawText) {
              handleScanCodeRef.current(rawText);
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setCameraActive(true);
      } catch {
        if (!cancelled) {
          setCameraActive(false);
          setCameraError('Camera permission denied or no camera attached. You can still type or USB-scan barcodes below.');
        }
      }
    };

    startLiveScanner();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, lookupState, cameraFacing]);

  const toggleFlashlight = async () => {
    const next = !flashlightOn;
    setFlashlightOn(next);
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()[0];
      if (track) {
        await track.applyConstraints({
          advanced: [{ torch: next } as MediaTrackConstraintSet],
        });
      }
    } catch {
      // Torch constraint not supported on all devices
    }
  };

  if (!isOpen) return null;

  const handleSaveOnlineProduct = () => {
    if (!onlineResult) return;
    const newProduct: Partial<Product> = {
      ...onlineResult,
      costPrice,
      sellingPrice,
      stockQuantity,
      expiryDate: expiryDate || undefined,
      minimumStockLimit: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddNewProduct(newProduct);
    resetModalState();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base min-w-0">
            <Camera className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="truncate">
              {pickMode ? 'Scan Barcode & Auto-Fill Product' : 'Smart Barcode & QR Scanner'}
            </span>
          </div>
          <button
            onClick={() => {
              resetModalState();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {lookupState === 'idle' && (
            <>
              {/* Live Camera Viewfinder */}
              <div className="relative aspect-video rounded-xl bg-slate-950 border-2 border-dashed border-blue-500/40 overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  autoPlay
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
                    cameraActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-blue-500/5 pointer-events-none" />
                <div className="absolute left-6 right-6 h-0.5 bg-red-500/80 shadow-[0_0_12px_#ef4444] animate-pulse pointer-events-none" />

                <div className="w-48 h-28 border-2 border-blue-400/80 rounded-lg relative flex items-center justify-center pointer-events-none">
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded font-mono uppercase tracking-wider whitespace-nowrap">
                    {pickMode ? 'Form Barcode Pick' : cameraActive ? 'Live Camera Active' : 'Intelligent Scanner'}
                  </div>
                  {!cameraActive && <Barcode className="w-14 h-14 text-slate-600/60" />}
                </div>

                {cameraError && (
                  <div className="absolute top-2 left-2 right-2 bg-slate-900/90 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-[10px] text-amber-300 text-center">
                    {cameraError}
                  </div>
                )}

                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={toggleFlashlight}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      flashlightOn
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {flashlightOn ? <Flashlight className="w-3.5 h-3.5" /> : <FlashlightOff className="w-3.5 h-3.5" />}
                    Flash {flashlightOn ? 'ON' : 'OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCameraFacing(cameraFacing === 'environment' ? 'user' : 'environment')}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-800/90 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Flip Camera
                  </button>
                </div>
              </div>

              {/* Manual Input / USB Gun */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between gap-2">
                  <span>Manual / USB Barcode Scanner</span>
                  <span className="text-[11px] text-slate-500">Matches Catalog &rarr; Asks Quantity</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="e.g. 896400012001 or 3017620422003"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualCode.trim()) {
                          handleScanCode(manualCode);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => manualCode.trim() && handleScanCode(manualCode)}
                    disabled={!manualCode.trim()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                    Scan
                  </button>
                </div>
              </div>

              {/* Quick Simulation Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Instant Barcode Presets (Catalog & Internet Lookup)
                </div>

                {!pickMode && products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {products.slice(0, 2).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleScanCode(p.barcode)}
                        className="p-2 text-left rounded-lg bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 transition-colors cursor-pointer"
                      >
                        <div className="font-semibold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-emerald-400 font-mono truncate">
                          Catalog ({p.barcode}) &rarr; Qty Prompt
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleScanCode('3017620422003')}
                    className="p-2 text-left rounded-lg bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-700/50 transition-colors text-emerald-200 cursor-pointer"
                  >
                    <div className="font-semibold truncate flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-400 shrink-0" />
                      Nutella Spread (3017620422003)
                    </div>
                    <div className="text-[10px] text-emerald-400 font-mono">Internet Lookup + Price Estimate</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScanCode('5449000000996')}
                    className="p-2 text-left rounded-lg bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-700/50 transition-colors text-indigo-200 cursor-pointer"
                  >
                    <div className="font-semibold truncate flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                      Coca-Cola 330ml (5449000000996)
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono">Global Product + Price Fetch</div>
                  </button>
                </div>
              </div>
            </>
          )}

          {lookupState === 'searching' && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
              <div className="text-white font-bold text-sm">Querying Internet Product Databases...</div>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Fetching product title, brand, category & estimated market price from OpenFoodFacts & UPCitemdb.
              </p>
            </div>
          )}

          {(lookupState === 'found_online' || lookupState === 'not_found') && onlineResult && (
            <div className="space-y-3.5">
              <div
                className={`p-3 rounded-xl flex items-start gap-2.5 border ${
                  lookupState === 'found_online'
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : 'bg-amber-950/30 border-amber-500/40'
                }`}
              >
                {lookupState === 'found_online' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div
                    className={`text-xs font-bold ${
                      lookupState === 'found_online' ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {lookupState === 'found_online'
                      ? `Auto-Fetched via ${lookupSource}`
                      : 'Not Found in Store Catalog or Global Databases'}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {lookupState === 'found_online'
                      ? `Price basis: ${priceSource}. Review details below and save to catalog.`
                      : 'Enter details manually to register this barcode in your catalog.'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Barcode:</span>
                  <span className="text-white font-mono font-bold">{onlineResult.barcode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Product Name *:</span>
                  <input
                    type="text"
                    value={onlineResult.name || ''}
                    onChange={(e) => setOnlineResult({ ...onlineResult, name: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
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
                    <span className="text-slate-500 block font-medium">Cost ({shopCurrency}):</span>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(Number(e.target.value))}
                      className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Sell ({shopCurrency}):</span>
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
                <div>
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    Expiry Date (Optional):
                  </span>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-900 border border-slate-700 rounded text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    isProcessingRef.current = false;
                    setLookupState('idle');
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSaveOnlineProduct}
                  disabled={!onlineResult.name?.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Save to Catalog
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
