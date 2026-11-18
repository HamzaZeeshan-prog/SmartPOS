import { Product } from '../types/pos';

/**
 * Generates normalized candidate representations of a scanned barcode/QR code
 * so EAN-13, UPC-A (12 digits vs leading-zero 13 digits), trimmed whitespace,
 * and control characters from hardware/camera scanners always match reliably.
 */
export function normalizeBarcodeCandidates(rawCode: string): string[] {
  const cleaned = rawCode.replace(/[\r\n\t\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) return [];

  const candidates = new Set<string>();
  const lower = cleaned.toLowerCase();
  candidates.add(lower);

  const noSpaces = lower.replace(/\s+/g, '');
  candidates.add(noSpaces);

  // Strip leading zeros if purely numeric (handles UPC-A <-> EAN-13 zero-padding differences)
  if (/^\d+$/.test(noSpaces)) {
    const strippedZeros = noSpaces.replace(/^0+/, '');
    if (strippedZeros) candidates.add(strippedZeros);
    if (noSpaces.length === 12) {
      candidates.add(`0${noSpaces}`);
    }
    if (noSpaces.length === 13 && noSpaces.startsWith('0')) {
      candidates.add(noSpaces.slice(1));
    }
  }

  return Array.from(candidates);
}

/**
 * Finds a matching product in the store catalog by barcode or QR code.
 */
export function findProductByBarcode(products: Product[], rawCode: string): Product | undefined {
  const scannedCandidates = normalizeBarcodeCandidates(rawCode);
  if (scannedCandidates.length === 0) return undefined;

  return products.find((product) => {
    const productCodes = [
      ...normalizeBarcodeCandidates(product.barcode || ''),
      ...normalizeBarcodeCandidates(product.qrCode || ''),
    ];
    return productCodes.some((pc) => scannedCandidates.includes(pc));
  });
}
