import { addItem } from '../../src/services/bringApi';
import { lookupProduct } from '../../src/services/productLookup';

it('resolves a scan and sends its custom label to the configured list', async () => {
  const fetchSpy = jest.spyOn(global, 'fetch')
    .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
    .mockResolvedValueOnce({ ok: true } as Response);
  const product = await lookupProduct('7612345678901', [{ barcode: '7612345678901', label: 'Comet Coffee' }]);
  expect(product).not.toBeNull();
  await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', product!.label, product!.barcode);
  expect(String((fetchSpy.mock.calls[1][1] as RequestInit).body)).toContain('purchase=Comet+Coffee');
});
