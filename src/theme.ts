import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { ColorSchemeName } from 'react-native';

export function createNavigationTheme(scheme: ColorSchemeName): Theme {
  const dark = scheme === 'dark';
  const base = dark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: dark ? '#72D5CA' : '#237F78',
      background: dark ? '#101615' : '#F2F8F6',
      card: dark ? '#1B2422' : '#F8FDFB',
      text: dark ? '#FFFFFF' : '#171717',
      border: dark ? '#394946' : '#D5E0DD',
      notification: dark ? '#72D5CA' : '#237F78',
    },
  };
}
