import { addItem, loadLists } from '../../src/services/bringApi';

describe('Bring adapter', () => {
  afterEach(() => jest.restoreAllMocks());
  it('logs in and maps shopping lists', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ lists: [{ listUuid: 'list-id', name: 'Moon Base' }] }) } as Response);
    await expect(loadLists({ email: 'pilot@example.com', password: 'secret' })).resolves.toEqual([{ listUuid: 'list-id', name: 'Moon Base' }]);
  });
  it('adds the resolved label and barcode specification', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);
    await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', 'Moon Milk', '7612345678901');
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: 'PUT' });
    expect(String((fetchSpy.mock.calls[1][1] as RequestInit).body)).toContain('purchase=Moon+Milk');
  });
});
