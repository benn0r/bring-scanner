import { APP_LANGUAGES, connectionError, translate } from '../../src/i18n';

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
    for (const { value } of APP_LANGUAGES) expect(translate(value, 'scan')).not.toBe('');
    expect(translate('de', 'selected', { name: 'Mondbasis' })).toBe('„Mondbasis“ ausgewählt.');
    expect(translate('pt-BR', 'languageSaved', { language: 'Português (Brasil)' })).toContain(
      'Português (Brasil)',
    );
    expect(connectionError('fr')).not.toMatch(/Could not connect/);
  });
});
