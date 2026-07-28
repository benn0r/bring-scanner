import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { I18nProvider } from '../../src/i18n';
import { SettingsScreen } from '../../src/screens/SettingsScreen';
import {
  loadAppLanguage,
  loadCustomBarcodes,
  loadLookupPreferences,
  loadSelectedList,
} from '../../src/services/storage';

function jsonResponse(body: unknown, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => body,
  } as Response;
}

async function renderSettings() {
  return render(
    <I18nProvider>
      <SettingsScreen />
    </I18nProvider>,
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('settings flows', () => {
  it('logs in to Bring and selects a shopping list', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ uuid: 'moon-user', access_token: 'moon-token' }))
      .mockResolvedValueOnce(
        jsonResponse({
          lists: [
            { listUuid: 'weekend-list', name: 'Weekend Supplies' },
            { listUuid: 'station-list', name: 'Space Station Pantry' },
          ],
        }),
      );
    const screen = await renderSettings();

    await fireEvent.changeText(
      screen.getByPlaceholderText('you@example.com'),
      'pilot@moon.example',
    );
    await fireEvent.changeText(screen.getByPlaceholderText('Required'), 'lunar-secret');
    await fireEvent.press(screen.getByText('Connect & Load Lists'));

    await waitFor(() => expect(screen.getByText('Weekend Supplies')).toBeTruthy());
    expect(String((fetchSpy.mock.calls[0][1] as RequestInit).body)).toContain(
      'email=pilot%40moon.example',
    );
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'bring-credentials',
      JSON.stringify({ email: 'pilot@moon.example', password: 'lunar-secret' }),
    );

    await fireEvent.press(screen.getByText('Weekend Supplies'));

    await waitFor(async () =>
      expect(await loadSelectedList()).toEqual({
        listUuid: 'weekend-list',
        name: 'Weekend Supplies',
      }),
    );
  });

  it('changes the app language', async () => {
    const screen = await renderSettings();

    await fireEvent.press(screen.getByText('Deutsch'));

    await waitFor(() => expect(screen.getByText('Einstellungen')).toBeTruthy());
    await expect(loadAppLanguage()).resolves.toBe('de');
  });

  it('changes the product language', async () => {
    const screen = await renderSettings();

    await fireEvent.press(screen.getByText('German'));

    await waitFor(async () =>
      expect(await loadLookupPreferences()).toEqual({ language: 'de', labelStyle: 'generic' }),
    );
  });

  it('selects the Bring item label style', async () => {
    const screen = await renderSettings();

    await fireEvent.press(screen.getByText('Exact Product'));

    await waitFor(async () =>
      expect(await loadLookupPreferences()).toEqual({ language: 'auto', labelStyle: 'exact' }),
    );
  });

  it('adds and removes a custom barcode', async () => {
    const screen = await renderSettings();
    await fireEvent.press(screen.getByText('Custom Barcodes'));
    await fireEvent.changeText(screen.getByPlaceholderText('7612345678901'), '7611111111111');
    await fireEvent.changeText(screen.getByPlaceholderText('Product name'), 'Moon Crackers');
    await fireEvent.press(screen.getByText('Save Custom Barcode'));

    await waitFor(() => expect(screen.getByText('Moon Crackers')).toBeTruthy());
    await expect(loadCustomBarcodes()).resolves.toEqual([
      { barcode: '7611111111111', label: 'Moon Crackers' },
    ]);

    let confirmRemoval: (() => void) | undefined;
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      confirmRemoval = buttons?.find((button) => button.style === 'destructive')?.onPress;
    });
    await fireEvent.press(screen.getByText('Delete'));
    expect(confirmRemoval).toBeDefined();
    await act(async () => confirmRemoval?.());

    await waitFor(() => expect(screen.queryByText('Moon Crackers')).toBeNull());
    await expect(loadCustomBarcodes()).resolves.toEqual([]);
  });
});
