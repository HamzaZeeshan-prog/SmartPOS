import { Product } from '../types/pos';

export interface BarcodeLookupResult {
  barcode: string;
  found: boolean;
  source: string;
  name: string;
  brand: string;
  category: string;
  unit: Product['unit'];
  description: string;
  costPrice: number;
  sellingPrice: number;
  priceSource: string;
  imageUrl?: string;
}

const USD_RATES: Record<string, number> = {
  PKR: 278,
  USD: 1,
  AED: 3.67,
  SAR: 3.75,
  GBP: 0.79,
  EUR: 0.92,
  INR: 84,
};

interface RegistryEntry {
  name: string;
  brand: string;
  category: string;
  unit: Product['unit'];
  pkrPrice: number;
  description: string;
}

const REGIONAL_REGISTRY: Record<string, RegistryEntry> = {
  '8964000100112': {
    name: 'Nestle Pure Life Water 1.5L',
    brand: 'Nestle',
    category: 'Beverages',
    unit: 'piece',
    pkrPrice: 110,
    description: 'Purified bottled drinking water 1.5 Liter',
  },
  '8964000200334': {
    name: 'Tapal Danedar Tea 450g',
    brand: 'Tapal',
    category: 'Tea & Coffee',
    unit: 'packet',
    pkrPrice: 780,
    description: 'Classic Pakistani rich blend black tea 450g pouch',
  },
  '8961001234561': {
    name: 'Dalda Cooking Oil 1L Pouch',
    brand: 'Dalda',
    category: 'Cooking Essentials',
    unit: 'packet',
    pkrPrice: 540,
    description: 'Fortified Vitamin A & D vegetable cooking oil 1L',
  },
  '8964001456789': {
    name: 'Olpers Full Cream Milk 1L',
    brand: 'Olpers',
    category: 'Dairy',
    unit: 'piece',
    pkrPrice: 330,
    description: 'UHT treated full cream dairy milk 1000ml carton',
  },
  '8964000311220': {
    name: 'National Chicken Biryani Masala 90g',
    brand: 'National Foods',
    category: 'Spices & Masala',
    unit: 'box',
    pkrPrice: 140,
    description: 'Authentic aromatic biryani recipe mix 90g double pack',
  },
  '8964000511099': {
    name: 'Pepsi Cola Regular 1.5L Bottle',
    brand: 'PepsiCo',
    category: 'Beverages',
    unit: 'piece',
    pkrPrice: 200,
    description: 'Carbonated soft drink 1.5 Liter PET bottle',
  },
  '8961102651011': {
    name: 'Lipton Yellow Label Tea 475g',
    brand: 'Lipton',
    category: 'Tea & Coffee',
    unit: 'packet',
    pkrPrice: 840,
    description: 'Finest sun-ripened tea leaves 475g pack',
  },
  '8964000778899': {
    name: 'Knorr Chattpatta Noodles 66g',
    brand: 'Knorr',
    category: 'Snacks & Instant',
    unit: 'packet',
    pkrPrice: 65,
    description: 'Instant masala noodles 66g single pack',
  },
  '8964002211445': {
    name: 'Shan Bombay Biryani Mix 60g',
    brand: 'Shan',
    category: 'Spices & Masala',
    unit: 'box',
    pkrPrice: 130,
    description: 'Bombay Biryani spice mix 60g box',
  },
  '8964000881234': {
    name: 'Lifebuoy Total 10 Soap 115g',
    brand: 'Lifebuoy',
    category: 'Personal Care',
    unit: 'piece',
    pkrPrice: 135,
    description: 'Germ protection bath soap 115g bar',
  },
  '8964000991122': {
    name: 'Sufi Banaspati Ghee 1kg Pouch',
    brand: 'Sufi',
    category: 'Cooking Essentials',
    unit: 'packet',
    pkrPrice: 550,
    description: 'Enriched Banaspati ghee 1kg pack',
  },
  '8961014254789': {
    name: 'Peek Freans Sooper Biscuits Half Roll',
    brand: 'EBM',
    category: 'Snacks & Bakery',
    unit: 'packet',
    pkrPrice: 100,
    description: 'Classic egg & milk butter biscuits half roll',
  },
  '5449000000996': {
    name: 'Coca-Cola Classic 330ml Can',
    brand: 'Coca-Cola',
    category: 'Beverages',
    unit: 'piece',
    pkrPrice: 120,
    description: 'Original sparkling soft drink 330ml aluminum can',
  },
  '3017620422003': {
    name: 'Nutella Hazelnut Spread 400g',
    brand: 'Ferrero',
    category: 'Spreads & Breakfast',
    unit: 'piece',
    pkrPrice: 1450,
    description: 'Hazelnut spread with cocoa 400g jar',
  },
};

function convertFromUsd(usdAmount: number, currency: string): number {
  const code = currency.toUpperCase();
  const rate = USD_RATES[code] ?? 278;
  const converted = usdAmount * rate;
  if (code === 'PKR' || code === 'INR') {
    return Math.round(converted / 5) * 5;
  }
  return Number(converted.toFixed(2));
}

function convertFromPkr(pkrAmount: number, currency: string): number {
  const code = currency.toUpperCase();
  if (code === 'PKR') return pkrAmount;
  return convertFromUsd(pkrAmount / 278, code);
}

function mapCategory(rawCategory: string, name: string): string {
  const text = `${rawCategory} ${name}`.toLowerCase();
  if (/beverage|drink|soda|water|juice|cola/.test(text)) return 'Beverages';
  if (/tea|coffee/.test(text)) return 'Tea & Coffee';
  if (/milk|dairy|cheese|yogurt|butter/.test(text)) return 'Dairy';
  if (/snack|biscuit|chip|chocolate|cookie|candy/.test(text)) return 'Snacks & Bakery';
  if (/oil|ghee|flour|rice|sugar/.test(text)) return 'Cooking Essentials';
  if (/spice|masala|sauce/.test(text)) return 'Spices & Masala';
  if (/soap|shampoo|cream|lotion|beauty|cosmetic|toothpaste/.test(text)) return 'Personal Care';
  if (/clean|detergent|wash/.test(text)) return 'Household';
  if (/tablet|capsule|syrup|pharma|vitamin/.test(text)) return 'Health & Pharmacy';
  if (/electronic|cable|charger|battery/.test(text)) return 'Electronics';
  return 'Grocery & General';
}

function inferUnit(quantityStr: string, name: string): Product['unit'] {
  const text = `${quantityStr} ${name}`.toLowerCase();
  if (/\bkg\b|kilogram/.test(text)) return 'kg';
  if (/box|carton/.test(text)) return 'box';
  if (/pack|pouch|sachet/.test(text)) return 'packet';
  return 'piece';
}

function estimateSellingPricePkr(category: string, name: string, quantityStr: string): number {
  const lower = `${name} ${quantityStr}`.toLowerCase();
  switch (category) {
    case 'Beverages':
      if (lower.includes('1.5') || lower.includes('2l')) return 210;
      if (lower.includes('500') || lower.includes('330')) return 110;
      return 150;
    case 'Tea & Coffee':
      return lower.includes('coffee') ? 950 : 650;
    case 'Dairy':
      if (lower.includes('cheese')) return 550;
      return lower.includes('1l') ? 320 : 160;
    case 'Snacks & Bakery':
      return lower.includes('chocolate') || lower.includes('nutella') ? 450 : 120;
    case 'Cooking Essentials':
      return lower.includes('5l') ? 2650 : 540;
    case 'Personal Care':
      return lower.includes('shampoo') || lower.includes('cream') ? 590 : 160;
    case 'Health & Pharmacy':
      return 350;
    case 'Electronics':
      return 1250;
    default:
      return 220;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupBarcodeOnline(
  rawBarcode: string,
  shopCurrency = 'PKR'
): Promise<BarcodeLookupResult | null> {
  const barcode = rawBarcode.trim();
  if (!barcode) return null;

  // 1. Check Regional Registry first
  const localHit = REGIONAL_REGISTRY[barcode];
  if (localHit) {
    const selling = convertFromPkr(localHit.pkrPrice, shopCurrency);
    const cost = Number((selling * 0.8).toFixed(shopCurrency === 'PKR' ? 0 : 2));
    return {
      barcode,
      found: true,
      source: 'Verified Regional Catalog',
      name: localHit.name,
      brand: localHit.brand,
      category: localHit.category,
      unit: localHit.unit,
      description: localHit.description,
      costPrice: cost,
      sellingPrice: selling,
      priceSource: 'Regional Market Price',
    };
  }

  let foundName = '';
  let foundBrand = '';
  let foundCategoryRaw = '';
  let foundQuantity = '';
  let foundDescription = '';
  let foundImage: string | undefined;
  let foundSource = '';
  let foundSellingPrice: number | undefined;
  let priceSource = 'Smart Category Estimate';

  // 2. OpenFoodFacts -> OpenProductsFacts -> OpenBeautyFacts (all CORS friendly!)
  const offEndpoints = [
    { label: 'OpenFoodFacts', url: `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` },
    { label: 'OpenProductsFacts', url: `https://world.openproductsfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` },
    { label: 'OpenBeautyFacts', url: `https://world.openbeautyfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json` },
  ];

  for (const ep of offEndpoints) {
    try {
      const res = await fetchWithTimeout(ep.url, 4500);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 1 && data.product) {
          const prod = data.product;
          const pName = String(prod.product_name || prod.product_name_en || prod.generic_name || '').trim();
          if (pName) {
            foundName = pName;
            foundBrand = String(prod.brands || '').split(',')[0].trim();
            foundCategoryRaw = String(prod.categories || '');
            foundQuantity = String(prod.quantity || '').trim();
            foundDescription = String(prod.ingredients_text || prod.generic_name || '');
            foundImage = prod.image_front_small_url || prod.image_url;
            foundSource = ep.label;
            break;
          }
        }
      }
    } catch {
      // ignore timeout/network
    }
  }

  // 3. UPCitemdb (also provides merchant prices when CORS permits)
  try {
    const res = await fetchWithTimeout(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(barcode)}`, 4000);
    if (res.ok) {
      const data = await res.json();
      const first = data?.items?.[0];
      if (first) {
        if (!foundName && first.title) {
          foundName = String(first.title).trim();
          foundBrand = String(first.brand || '').trim();
          foundCategoryRaw = String(first.category || '');
          foundQuantity = String(first.size || first.weight || '');
          foundDescription = String(first.description || '');
          foundImage = first.images?.[0];
          foundSource = 'UPCitemdb Global';
        }
        const lowest = Number(first.lowest_recorded_price);
        const highest = Number(first.highest_recorded_price);
        let usdPrice: number | undefined;
        if (lowest > 0 && highest > 0) usdPrice = (lowest + highest) / 2;
        else if (lowest > 0) usdPrice = lowest;
        else if (first.offers?.[0]?.price > 0) usdPrice = Number(first.offers[0].price);

        if (usdPrice && usdPrice > 0) {
          foundSellingPrice = convertFromUsd(usdPrice, shopCurrency);
          priceSource = 'Online Merchant Price';
        }
      }
    }
  } catch {
    // UPCitemdb trial endpoint may block CORS in some browsers; fallback handled seamlessly
  }

  if (foundName) {
    const qtySuffix =
      foundQuantity && !foundName.toLowerCase().includes(foundQuantity.toLowerCase())
        ? ` (${foundQuantity})`
        : '';
    const fullName = `${foundName}${qtySuffix}`;
    const category = mapCategory(foundCategoryRaw, fullName);
    const unit = inferUnit(foundQuantity, fullName);
    const selling =
      foundSellingPrice ??
      convertFromPkr(estimateSellingPricePkr(category, fullName, foundQuantity), shopCurrency);
    const cost = Number((selling * 0.78).toFixed(shopCurrency === 'PKR' ? 0 : 2));

    return {
      barcode,
      found: true,
      source: foundSource,
      name: fullName,
      brand: foundBrand || 'Branded',
      category,
      unit,
      description: foundDescription || `Fetched via ${foundSource} for barcode ${barcode}`,
      costPrice: cost,
      sellingPrice: selling,
      priceSource,
      imageUrl: foundImage,
    };
  }

  return null;
}
