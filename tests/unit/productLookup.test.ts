import {
  localizedField,
  lookupProduct,
  normalizeBarcode,
  productLabel,
  resolveCountry,
  resolveLanguage,
} from '../../src/services/productLookup';

describe('product lookup', () => {
  afterEach(() => jest.restoreAllMocks());

  it('normalizes scanner values', () => expect(normalizeBarcode('76 123-45')).toBe('7612345'));

  it('resolves automatic language and country from the device locale', () => {
    expect(resolveLanguage('auto', 'de-CH')).toBe('de');
    expect(resolveLanguage('auto', 'nl-NL')).toBe('en');
    expect(resolveCountry('de-CH')).toBe('ch');
  });

  it('prefers the selected language, then English, then the original value', () => {
    const product = {
      product_name: 'Nom français',
      product_name_de: 'Deutscher Name',
      product_name_en: 'English name',
    };
    expect(localizedField(product, 'product_name', 'de')).toBe('Deutscher Name');
    expect(localizedField(product, 'product_name', 'it')).toBe('English name');
  });

  it('uses generic labels only when they are available', () => {
    expect(productLabel('Hakle Natural Soft', 'Toilet paper', 'generic')).toBe('Toilet paper');
    expect(productLabel('Hakle Natural Soft', undefined, 'generic')).toBe('Hakle Natural Soft');
    expect(productLabel('Hakle Natural Soft', 'Toilet paper', 'exact')).toBe('Hakle Natural Soft');
  });

  it('uses a custom label without an online request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    await expect(
      lookupProduct('7612345678901', [{ barcode: '7612345678901', label: 'Moon Milk' }]),
    ).resolves.toMatchObject({
      barcode: '7612345678901',
      label: 'Moon Milk',
      exactLabel: 'Moon Milk',
      source: 'custom',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('uses the product family API and returns a localized generic household label', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        product: {
          product_name: 'Papier toilette douceur',
          product_name_de: 'Hakle Natürlich Sanft',
          generic_name_de: 'Toilettenpapier',
          quantity: '10 Rollen',
          brands: 'Hakle',
          product_type: 'product',
        },
      }),
    } as Response);
    await expect(
      lookupProduct('7612345678901', [], { language: 'de', labelStyle: 'generic' }),
    ).resolves.toMatchObject({
      label: 'Toilettenpapier',
      exactLabel: 'Hakle Natürlich Sanft, 10 Rollen',
      genericLabel: 'Toilettenpapier',
      productType: 'product',
      source: 'open-products-family',
    });
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/api/v3/product/7612345678901?');
    expect(String(fetchSpy.mock.calls[0][0])).toContain('product_type=all');
    expect(String(fetchSpy.mock.calls[0][0])).toContain('lc=de');
  });

  it('returns null for products missing across all product databases', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 404 } as Response);
    await expect(lookupProduct('7612345678901', [])).resolves.toBeNull();
  });

  it('rejects invalid codes', async () =>
    await expect(lookupProduct('123', [])).rejects.toThrow('valid EAN'));
});
