import { addItem, loadLists, login } from '../../src/services/bringApi';

function response(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

describe('Bring adapter', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_BRING_API_KEY = 'test-only-key';
  });

  afterEach(() => jest.restoreAllMocks());

  it('trims the email and returns the authenticated session', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(response({ uuid: 'user-id', access_token: 'token' }));

    await expect(login({ email: '  pilot@example.com ', password: 'secret' })).resolves.toEqual({
      userUuid: 'user-id',
      token: 'token',
    });
    expect(String((fetchSpy.mock.calls[0][1] as RequestInit).body)).toBe(
      'email=pilot%40example.com&password=secret',
    );
  });

  it.each([
    ['HTTP failure', response({ message: 'Invalid credentials' }, false), 'Invalid credentials'],
    ['body error', response({ error: true, message: 'Account blocked' }), 'Account blocked'],
    ['body error without a message', response({ error: true }), 'Bring sign-in failed'],
    ['missing user ID', response({ access_token: 'token' }), 'incomplete sign-in'],
    ['missing token', response({ uuid: 'user-id' }), 'incomplete sign-in'],
    [
      'invalid JSON',
      {
        ok: true,
        json: async () => Promise.reject(new SyntaxError('invalid JSON')),
      } as unknown as Response,
      'incomplete sign-in',
    ],
  ])('rejects a %s during sign-in', async (_case, result, message) => {
    jest.spyOn(global, 'fetch').mockResolvedValue(result);

    await expect(login({ email: 'pilot@example.com', password: 'secret' })).rejects.toThrow(
      message,
    );
  });

  it('propagates a network error during sign-in', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(login({ email: 'pilot@example.com', password: 'secret' })).rejects.toThrow(
      'offline',
    );
  });

  it('logs in, sends the required headers, and maps shopping lists', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }))
      .mockResolvedValueOnce(
        response({
          lists: [{ listUuid: 'list-id', name: 'Moon Base' }, { listUuid: 'unnamed-list' }],
        }),
      );

    await expect(loadLists({ email: 'pilot@example.com', password: 'secret' })).resolves.toEqual([
      { listUuid: 'list-id', name: 'Moon Base' },
      { listUuid: 'unnamed-list', name: 'Shopping list' },
    ]);
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({
        'X-BRING-API-KEY': 'test-only-key',
        'X-BRING-USER-UUID': 'user-id',
        Authorization: 'Bearer token',
      }),
    });
  });

  it('returns an empty list when Bring omits its lists collection', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }))
      .mockResolvedValueOnce(response({}));

    await expect(loadLists({ email: 'pilot@example.com', password: 'secret' })).resolves.toEqual(
      [],
    );
  });

  it('rejects a list-loading API error', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }))
      .mockResolvedValueOnce(response({}, false));

    await expect(loadLists({ email: 'pilot@example.com', password: 'secret' })).rejects.toThrow(
      'Could not load Bring lists',
    );
  });

  it('reports a missing API key before requesting lists', async () => {
    delete process.env.EXPO_PUBLIC_BRING_API_KEY;
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }));

    await expect(loadLists({ email: 'pilot@example.com', password: 'secret' })).rejects.toThrow(
      'missing EXPO_PUBLIC_BRING_API_KEY',
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('adds the resolved label without a specification by default', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }))
      .mockResolvedValueOnce(response({}));

    await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list/id', 'Moon Milk');

    expect(fetchSpy.mock.calls[1][0]).toContain('bringlists/list%2Fid');
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({
      method: 'PUT',
      headers: expect.objectContaining({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      }),
    });
    const body = new URLSearchParams(String((fetchSpy.mock.calls[1][1] as RequestInit).body));
    expect(body.get('purchase')).toBe('Moon Milk');
    expect(body.get('specification')).toBe('');
    expect(body.has('ean')).toBe(false);
  });

  it('adds a selected quantity to the specification', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }))
      .mockResolvedValueOnce(response({}));

    await addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', 'Moon Milk', 3);

    const body = new URLSearchParams(String((fetchSpy.mock.calls[1][1] as RequestInit).body));
    expect(body.get('specification')).toBe('3×');
  });

  it('rejects an item that Bring does not accept', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(response({ uuid: 'user-id', access_token: 'token' }))
      .mockResolvedValueOnce(response({}, false));

    await expect(
      addItem({ email: 'pilot@example.com', password: 'secret' }, 'list-id', 'Moon Milk'),
    ).rejects.toThrow('Bring did not accept the item');
  });
});
