import { addItem } from '../../src/services/bringApi';
import { lookupProduct } from '../../src/services/productLookup';

afterEach(() => jest.restoreAllMocks());

it('resolves a scan and sends its custom label to the configured list', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
    .mockResolvedValueOnce({ ok: true } as Response);
  const product = await lookupProduct('7612345678901', [{ barcode: '7612345678901', label: 'Comet Coffee' }]);
  expect(product).not.toBeNull();
  await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', product!.label, product!.barcode);
  expect(String((fetchSpy.mock.calls[1][1] as RequestInit).body)).toContain('purchase=Comet+Coffee');
});

it('resolves a household barcode to a localized generic label and sends it to Bring', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ product: { product_name_de: 'Hakle Natürlich Sanft', generic_name_de: 'Toilettenpapier', brands: 'Hakle', product_type: 'product' } }) } as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
    .mockResolvedValueOnce({ ok: true } as Response);
  const product = await lookupProduct('7612345678901', [], { language: 'de', labelStyle: 'generic' });
  expect(product?.label).toBe('Toilettenpapier');
  await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', product!.label, product!.barcode);
  expect(String((fetchSpy.mock.calls[2][1] as RequestInit).body)).toContain('purchase=Toilettenpapier');
});
