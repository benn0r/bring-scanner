import appConfig from '../../app.json';
import { createNavigationTheme } from '../../src/theme';

describe('system appearance', () => {
  it('allows Expo to follow the device appearance', () => {
    expect(appConfig.expo.userInterfaceStyle).toBe('automatic');
  });

  it('uses the light navigation palette in light mode', () => {
    const theme = createNavigationTheme('light');

    expect(theme.dark).toBe(false);
    expect(theme.colors.background).toBe('#F2F8F6');
    expect(theme.colors.text).toBe('#171717');
  });

  it('uses the dark navigation palette in dark mode', () => {
    const theme = createNavigationTheme('dark');

    expect(theme.dark).toBe(true);
    expect(theme.colors.background).toBe('#101615');
    expect(theme.colors.text).toBe('#FFFFFF');
  });
});
