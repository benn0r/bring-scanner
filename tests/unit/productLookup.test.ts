import { lookupProduct, normalizeBarcode } from '../../src/services/productLookup';

describe('product lookup', () => {
  afterEach(() => jest.restoreAllMocks());

  it('normalizes scanner values', () => expect(normalizeBarcode('76 123-45')).toBe('7612345'));

  it('uses a custom label without an online request', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    await expect(lookupProduct('7612345678901', [{ barcode: '7612345678901', label: 'Moon Milk' }])).resolves.toEqual({ barcode: '7612345678901', label: 'Moon Milk', source: 'custom' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns an Open Food Facts product', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ status: 1, product: { product_name: 'Starlight Pasta', brands: 'Nova Foods' } }) } as Response);
    await expect(lookupProduct('7612345678901', [])).resolves.toMatchObject({ label: 'Starlight Pasta', brand: 'Nova Foods', source: 'open-food-facts' });
  });

  it('rejects invalid codes', async () => await expect(lookupProduct('123', [])).rejects.toThrow('valid EAN'));
});
