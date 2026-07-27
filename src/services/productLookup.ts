import { CustomBarcode, Product } from '../types';

export function normalizeBarcode(value: string) { return value.replace(/\D/g, ''); }

export async function lookupProduct(barcodeValue: string, customBarcodes: CustomBarcode[]): Promise<Product | null> {
  const barcode = normalizeBarcode(barcodeValue);
  if (!/^\d{8,14}$/.test(barcode)) throw new Error('This does not look like a valid EAN or UPC barcode.');
  const custom = customBarcodes.find((item) => normalizeBarcode(item.barcode) === barcode);
  if (custom) return { barcode, label: custom.label, source: 'custom' };

  const fields = 'code,product_name,product_name_en,brands,image_front_small_url';
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${fields}`, {
    headers: { 'User-Agent': 'BringScanner/1.0 (mobile companion app)' },
  });
  if (!response.ok) throw new Error('The product lookup service is unavailable. Please try again.');
  const data = await response.json();
  if (data.status !== 1 || !data.product) return null;
  const label = data.product.product_name || data.product.product_name_en;
  if (!label) return null;
  return { barcode, label, brand: data.product.brands || undefined, imageUrl: data.product.image_front_small_url || undefined, source: 'open-food-facts' };
}
