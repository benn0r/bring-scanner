import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { APP_LANGUAGES, connectionError, I18nProvider, translate, useI18n } from '../../src/i18n';

let i18n: ReturnType<typeof useI18n>;

function Probe() {
  const value = useI18n();
  useEffect(() => {
    i18n = value;
  }, [value]);
  return <Text>{`${value.language}:${value.t('settings')}`}</Text>;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

afterEach(() => jest.restoreAllMocks());

describe('app translations', () => {
  it('provides every requested language and interpolates localized messages', () => {
    expect(APP_LANGUAGES.map(({ value }) => value)).toEqual([
      'en',
      'de',
      'fr',
      'it',
      'pt',
      'pt-BR',
    ]);
    for (const { value } of APP_LANGUAGES) {
      expect(translate(value, 'scan')).not.toBe('');
      expect(translate(value, 'customBarcodes')).not.toBe('');
      expect(translate(value, 'manage')).not.toBe('');
      expect(translate(value, 'done')).not.toBe('');
      expect(translate(value, 'signInToBring')).not.toBe('');
      expect(translate(value, 'signIn')).not.toBe('');
      expect(translate(value, 'loginRequired')).not.toBe('');
      expect(translate(value, 'logout')).not.toBe('');
    }
    expect(translate('de', 'selected', { name: 'Mondbasis' })).toBe('„Mondbasis“ ausgewählt.');
    expect(translate('pt-BR', 'languageSaved', { language: 'Português (Brasil)' })).toContain(
      'Português (Brasil)',
    );
    expect(connectionError('fr')).not.toMatch(/Could not connect/);
  });

  it('provides a localized connection error for every supported app language', () => {
    for (const { value } of APP_LANGUAGES) {
      expect(connectionError(value)).toBeTruthy();
      expect(connectionError(value)).not.toContain('{');
    }
  });

  it('interpolates every supplied status value', () => {
    expect(
      translate('en', 'addedTo', {
        quantity: '4× ',
        label: 'Moon Milk',
        list: 'Weekend Supplies',
      }),
    ).toBe('4× Moon Milk added to Weekend Supplies.');
  });

  it('hydrates a stored language and persists a language change', async () => {
    await AsyncStorage.setItem('app-language', 'it');
    const screen = await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByText('it:Impostazioni')).toBeTruthy());
    await act(() => i18n.setLanguage('pt-BR'));

    expect(screen.getByText('pt-BR:Ajustes')).toBeTruthy();
    await expect(AsyncStorage.getItem('app-language')).resolves.toBe('pt-BR');
  });

  it('keeps English active if loading the saved language fails', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('storage unavailable'));
    const screen = await render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByText('en:Settings')).toBeTruthy();
    await waitFor(() => expect(i18n.language).toBe('en'));
  });
});
