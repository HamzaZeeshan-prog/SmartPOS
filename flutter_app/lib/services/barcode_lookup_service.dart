import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class BarcodeLookupResult {
  final String barcode;
  final bool found;
  final String source;
  final String name;
  final String brand;
  final String category;
  final ProductUnit unit;
  final String description;
  final double costPrice;
  final double sellingPrice;
  final String priceSource;
  final String? imageUrl;

  const BarcodeLookupResult({
    required this.barcode,
    required this.found,
    required this.source,
    required this.name,
    required this.brand,
    required this.category,
    required this.unit,
    required this.description,
    required this.costPrice,
    required this.sellingPrice,
    required this.priceSource,
    this.imageUrl,
  });
}

class BarcodeLookupService {
  static const Map<String, double> _usdRates = {
    'PKR': 278.0,
    'USD': 1.0,
    'AED': 3.67,
    'SAR': 3.75,
    'GBP': 0.79,
    'EUR': 0.92,
    'INR': 84.0,
  };

  static final Map<String, Map<String, dynamic>> _regionalRegistry = {
    '8964000100112': {
      'name': 'Nestle Pure Life Water 1.5L',
      'brand': 'Nestle',
      'category': 'Beverages',
      'unit': ProductUnit.piece,
      'pkrPrice': 110.0,
      'description': 'Purified bottled drinking water 1.5 Liter',
    },
    '8964000200334': {
      'name': 'Tapal Danedar Tea 450g',
      'brand': 'Tapal',
      'category': 'Tea & Coffee',
      'unit': ProductUnit.packet,
      'pkrPrice': 780.0,
      'description': 'Classic Pakistani rich blend black tea 450g pouch',
    },
    '8961001234561': {
      'name': 'Dalda Cooking Oil 1L Pouch',
      'brand': 'Dalda',
      'category': 'Cooking Essentials',
      'unit': ProductUnit.packet,
      'pkrPrice': 540.0,
      'description': 'Fortified Vitamin A & D vegetable cooking oil 1L',
    },
    '8964001456789': {
      'name': 'Olpers Full Cream Milk 1L',
      'brand': 'Olpers',
      'category': 'Dairy',
      'unit': ProductUnit.piece,
      'pkrPrice': 330.0,
      'description': 'UHT treated full cream dairy milk 1000ml carton',
    },
    '8964000311220': {
      'name': 'National Chicken Biryani Masala 90g',
      'brand': 'National Foods',
      'category': 'Spices & Masala',
      'unit': ProductUnit.box,
      'pkrPrice': 140.0,
      'description': 'Authentic aromatic biryani recipe mix 90g double pack',
    },
    '8964000511099': {
      'name': 'Pepsi Cola Regular 1.5L Bottle',
      'brand': 'PepsiCo',
      'category': 'Beverages',
      'unit': ProductUnit.piece,
      'pkrPrice': 200.0,
      'description': 'Carbonated soft drink 1.5 Liter PET bottle',
    },
    '8961102651011': {
      'name': 'Lipton Yellow Label Tea 475g',
      'brand': 'Lipton',
      'category': 'Tea & Coffee',
      'unit': ProductUnit.packet,
      'pkrPrice': 840.0,
      'description': 'Finest sun-ripened tea leaves 475g pack',
    },
    '8964000778899': {
      'name': 'Knorr Chattpatta Noodles 66g',
      'brand': 'Knorr',
      'category': 'Snacks & Instant',
      'unit': ProductUnit.packet,
      'pkrPrice': 65.0,
      'description': 'Instant masala noodles 66g single pack',
    },
    '8964002211445': {
      'name': 'Shan Bombay Biryani Mix 60g',
      'brand': 'Shan',
      'category': 'Spices & Masala',
      'unit': ProductUnit.box,
      'pkrPrice': 130.0,
      'description': 'Bombay Biryani spice mix 60g box',
    },
    '8964000881234': {
      'name': 'Lifebuoy Total 10 Soap 115g',
      'brand': 'Lifebuoy',
      'category': 'Personal Care',
      'unit': ProductUnit.piece,
      'pkrPrice': 135.0,
      'description': 'Germ protection bath soap 115g bar',
    },
    '8964000991122': {
      'name': 'Sufi Banaspati Ghee 1kg Pouch',
      'brand': 'Sufi',
      'category': 'Cooking Essentials',
      'unit': ProductUnit.packet,
      'pkrPrice': 550.0,
      'description': 'Enriched Banaspati ghee 1kg pack',
    },
    '8961014254789': {
      'name': 'Peek Freans Sooper Biscuits Half Roll',
      'brand': 'EBM',
      'category': 'Snacks & Bakery',
      'unit': ProductUnit.packet,
      'pkrPrice': 100.0,
      'description': 'Classic egg & milk butter biscuits half roll',
    },
    '5449000000996': {
      'name': 'Coca-Cola Classic 330ml Can',
      'brand': 'Coca-Cola',
      'category': 'Beverages',
      'unit': ProductUnit.piece,
      'pkrPrice': 120.0,
      'description': 'Original sparkling soft drink 330ml aluminum can',
    },
    '3017620422003': {
      'name': 'Nutella Hazelnut Spread 400g',
      'brand': 'Ferrero',
      'category': 'Spreads & Breakfast',
      'unit': ProductUnit.piece,
      'pkrPrice': 1450.0,
      'description': 'Hazelnut spread with cocoa 400g jar',
    },
  };

  static double _convertFromUsd(double usdAmount, String currency) {
    final rate = _usdRates[currency.toUpperCase()] ?? 278.0;
    final converted = usdAmount * rate;
    if (currency.toUpperCase() == 'PKR' || currency.toUpperCase() == 'INR') {
      return (converted / 5).round() * 5.0;
    }
    return double.parse(converted.toStringAsFixed(2));
  }

  static double _convertFromPkr(double pkrAmount, String currency) {
    final code = currency.toUpperCase();
    if (code == 'PKR') return pkrAmount;
    final usd = pkrAmount / 278.0;
    return _convertFromUsd(usd, code);
  }

  static String _mapCategory(String rawCategory, String name) {
    final text = '$rawCategory $name'.toLowerCase();
    if (text.contains('beverage') || text.contains('drink') || text.contains('soda') || text.contains('water') || text.contains('juice')) {
      return 'Beverages';
    }
    if (text.contains('tea') || text.contains('coffee')) return 'Tea & Coffee';
    if (text.contains('milk') || text.contains('dairy') || text.contains('cheese') || text.contains('yogurt') || text.contains('butter')) {
      return 'Dairy';
    }
    if (text.contains('snack') || text.contains('biscuit') || text.contains('chip') || text.contains('chocolate') || text.contains('cookie') || text.contains('candy')) {
      return 'Snacks & Bakery';
    }
    if (text.contains('oil') || text.contains('ghee') || text.contains('flour') || text.contains('rice') || text.contains('sugar')) {
      return 'Cooking Essentials';
    }
    if (text.contains('spice') || text.contains('masala') || text.contains('sauce')) {
      return 'Spices & Masala';
    }
    if (text.contains('soap') || text.contains('shampoo') || text.contains('cream') || text.contains('lotion') || text.contains('beauty') || text.contains('cosmetic') || text.contains('toothpaste')) {
      return 'Personal Care';
    }
    if (text.contains('clean') || text.contains('detergent') || text.contains('wash')) {
      return 'Household';
    }
    if (text.contains('tablet') || text.contains('capsule') || text.contains('syrup') || text.contains('pharma') || text.contains('vitamin')) {
      return 'Health & Pharmacy';
    }
    if (text.contains('electronic') || text.contains('cable') || text.contains('charger') || text.contains('battery')) {
      return 'Electronics';
    }
    return 'Grocery & General';
  }

  static ProductUnit _inferUnit(String quantityStr, String name) {
    final text = '$quantityStr $name'.toLowerCase();
    if (text.contains('kg') || text.contains('kilogram')) return ProductUnit.kg;
    if (text.contains('litre') || text.contains('liter') || RegExp(r'\b\d+(\.\d+)?\s?l\b').hasMatch(text)) {
      return ProductUnit.piece;
    }
    if (text.contains('box') || text.contains('carton')) return ProductUnit.box;
    if (text.contains('pack') || text.contains('pouch') || text.contains('sachet')) return ProductUnit.packet;
    return ProductUnit.piece;
  }

  static double _estimateSellingPricePkr(String category, String name, String quantityStr) {
    final lower = '$name $quantityStr'.toLowerCase();
    double base = 180;
    switch (category) {
      case 'Beverages':
        base = lower.contains('1.5') || lower.contains('2l') ? 210 : (lower.contains('500') || lower.contains('330') ? 110 : 150);
        break;
      case 'Tea & Coffee':
        base = lower.contains('coffee') ? 950 : 650;
        break;
      case 'Dairy':
        base = lower.contains('cheese') ? 550 : (lower.contains('1l') ? 320 : 160);
        break;
      case 'Snacks & Bakery':
        base = lower.contains('chocolate') || lower.contains('nutella') ? 450 : 120;
        break;
      case 'Cooking Essentials':
        base = lower.contains('5l') ? 2650 : 540;
        break;
      case 'Personal Care':
        base = lower.contains('shampoo') || lower.contains('cream') ? 590 : 160;
        break;
      case 'Health & Pharmacy':
        base = 350;
        break;
      case 'Electronics':
        base = 1250;
        break;
      default:
        base = 220;
    }
    return base;
  }

  static Future<BarcodeLookupResult?> lookupOnline(
    String rawBarcode, {
    String shopCurrency = 'PKR',
  }) async {
    final barcode = rawBarcode.trim();
    if (barcode.isEmpty) return null;

    // 1. Check Regional Verified Catalog first for instant accurate PKR pricing
    if (_regionalRegistry.containsKey(barcode)) {
      final item = _regionalRegistry[barcode]!;
      final selling = _convertFromPkr((item['pkrPrice'] as num).toDouble(), shopCurrency);
      final cost = double.parse((selling * 0.80).toStringAsFixed(shopCurrency == 'PKR' ? 0 : 2));
      return BarcodeLookupResult(
        barcode: barcode,
        found: true,
        source: 'Verified Regional Catalog',
        name: item['name'] as String,
        brand: item['brand'] as String,
        category: item['category'] as String,
        unit: item['unit'] as ProductUnit,
        description: item['description'] as String,
        costPrice: cost,
        sellingPrice: selling,
        priceSource: 'Regional Market Price',
      );
    }

    // 2. Query OpenFoodFacts, UPCitemdb, OpenProductsFacts, OpenBeautyFacts
    String? foundName;
    String? foundBrand;
    String? foundCategoryRaw;
    String? foundQuantity;
    String? foundDescription;
    String? foundImage;
    String foundSource = '';
    double? foundSellingPrice;
    String priceSource = 'Smart Category Estimate';

    // 2a. UPCitemdb (often provides merchant price offers!)
    try {
      final upcRes = await http
          .get(
            Uri.parse('https://api.upcitemdb.com/prod/trial/lookup?upc=${Uri.encodeComponent(barcode)}'),
            headers: {'Accept': 'application/json'},
          )
          .timeout(const Duration(seconds: 5));

      if (upcRes.statusCode == 200) {
        final data = jsonDecode(upcRes.body) as Map<String, dynamic>;
        final items = data['items'] as List<dynamic>?;
        if (items != null && items.isNotEmpty) {
          final first = items.first as Map<String, dynamic>;
          foundName = (first['title'] ?? '').toString().trim();
          foundBrand = (first['brand'] ?? '').toString().trim();
          foundCategoryRaw = (first['category'] ?? '').toString();
          foundQuantity = (first['size'] ?? first['weight'] ?? '').toString();
          foundDescription = (first['description'] ?? '').toString();
          final images = first['images'] as List<dynamic>?;
          if (images != null && images.isNotEmpty) {
            foundImage = images.first.toString();
          }
          foundSource = 'UPCitemdb Global';

          final lowest = (first['lowest_recorded_price'] as num?)?.toDouble();
          final highest = (first['highest_recorded_price'] as num?)?.toDouble();
          double? usdPrice;
          if (lowest != null && lowest > 0 && highest != null && highest > 0) {
            usdPrice = (lowest + highest) / 2.0;
          } else if (lowest != null && lowest > 0) {
            usdPrice = lowest;
          } else {
            final offers = first['offers'] as List<dynamic>?;
            if (offers != null && offers.isNotEmpty) {
              final offerPrice = (offers.first['price'] as num?)?.toDouble();
              if (offerPrice != null && offerPrice > 0) {
                usdPrice = offerPrice;
              }
            }
          }
          if (usdPrice != null && usdPrice > 0) {
            foundSellingPrice = _convertFromUsd(usdPrice, shopCurrency);
            priceSource = 'Online Merchant Price';
          }
        }
      }
    } catch (_) {}

    // 2b. OpenFoodFacts -> OpenProductsFacts -> OpenBeautyFacts
    if (foundName == null || foundName.isEmpty) {
      final endpoints = [
        {
          'label': 'OpenFoodFacts',
          'url': 'https://world.openfoodfacts.org/api/v2/product/${Uri.encodeComponent(barcode)}.json',
        },
        {
          'label': 'OpenProductsFacts',
          'url': 'https://world.openproductsfacts.org/api/v2/product/${Uri.encodeComponent(barcode)}.json',
        },
        {
          'label': 'OpenBeautyFacts',
          'url': 'https://world.openbeautyfacts.org/api/v2/product/${Uri.encodeComponent(barcode)}.json',
        },
      ];

      for (final ep in endpoints) {
        try {
          final res = await http
              .get(Uri.parse(ep['url']!), headers: {'Accept': 'application/json'})
              .timeout(const Duration(seconds: 5));
          if (res.statusCode == 200) {
            final json = jsonDecode(res.body) as Map<String, dynamic>;
            if (json['status'] == 1 && json['product'] is Map<String, dynamic>) {
              final prod = json['product'] as Map<String, dynamic>;
              final pName = (prod['product_name'] ??
                      prod['product_name_en'] ??
                      prod['generic_name'] ??
                      '')
                  .toString()
                  .trim();
              if (pName.isNotEmpty) {
                foundName = pName;
                foundBrand = (prod['brands'] ?? '').toString().split(',').first.trim();
                foundCategoryRaw = (prod['categories'] ?? '').toString();
                foundQuantity = (prod['quantity'] ?? '').toString().trim();
                foundDescription = (prod['ingredients_text'] ?? prod['generic_name'] ?? '').toString();
                foundImage = (prod['image_front_small_url'] ?? prod['image_url'])?.toString();
                foundSource = ep['label']!;
                break;
              }
            }
          }
        } catch (_) {}
      }
    }

    if (foundName != null && foundName.isNotEmpty) {
      final qtySuffix = (foundQuantity != null &&
              foundQuantity.isNotEmpty &&
              !foundName.toLowerCase().contains(foundQuantity.toLowerCase()))
          ? ' ($foundQuantity)'
          : '';
      final fullName = '$foundName$qtySuffix';
      final category = _mapCategory(foundCategoryRaw ?? '', fullName);
      final unit = _inferUnit(foundQuantity ?? '', fullName);
      final selling = foundSellingPrice ??
          _convertFromPkr(
            _estimateSellingPricePkr(category, fullName, foundQuantity ?? ''),
            shopCurrency,
          );
      final cost = double.parse((selling * 0.78).toStringAsFixed(shopCurrency == 'PKR' ? 0 : 2));

      return BarcodeLookupResult(
        barcode: barcode,
        found: true,
        source: foundSource,
        name: fullName,
        brand: (foundBrand != null && foundBrand.isNotEmpty) ? foundBrand : 'Branded',
        category: category,
        unit: unit,
        description: (foundDescription != null && foundDescription.isNotEmpty)
            ? foundDescription
            : 'Fetched via $foundSource for barcode $barcode',
        costPrice: cost,
        sellingPrice: selling,
        priceSource: priceSource,
        imageUrl: foundImage,
      );
    }

    return null;
  }
}
