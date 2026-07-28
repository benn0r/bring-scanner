import { addItem, loadLists } from '../../src/services/bringApi';

describe('Bring adapter', () => {
  afterEach(() => jest.restoreAllMocks());
  it('logs in and maps shopping lists', async () => {
    jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ lists: [{ listUuid: 'list-id', name: 'Moon Base' }] }) } as Response);
    await expect(loadLists({ email: 'pilot@example.com', password: 'secret' })).resolves.toEqual([{ listUuid: 'list-id', name: 'Moon Base' }]);
  });
  it('adds the resolved label without a specification by default', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);
    await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', 'Moon Milk');
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({ method: 'PUT' });
    const body = new URLSearchParams(String((fetchSpy.mock.calls[1][1] as RequestInit).body));
    expect(body.get('purchase')).toBe('Moon Milk');
    expect(body.get('specification')).toBe('');
  });
  it('adds a selected quantity to the specification', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uuid: 'user-id', access_token: 'token' }) } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);
    await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', 'Moon Milk', 3);
    const body = new URLSearchParams(String((fetchSpy.mock.calls[1][1] as RequestInit).body));
    expect(body.get('specification')).toBe('3×');
  });
});
