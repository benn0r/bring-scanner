import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/components/ui';
import { I18nProvider, useI18n } from './src/i18n';

const Tab = createBottomTabNavigator();

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ color, fontSize: 24, fontWeight: '500', lineHeight: 27 }}>{symbol}</Text>;
}

function AppTabs({ dark }: { dark: boolean }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: dark ? '#72D5CA' : '#237F78', tabBarInactiveTintColor: dark ? '#A7B1AF' : '#74817E', tabBarStyle: { height: 50 + insets.bottom, paddingTop: 5, paddingBottom: Math.max(insets.bottom, 5), backgroundColor: colors.bar, borderTopColor: colors.separator }, tabBarLabelStyle: { fontSize: 10, fontWeight: '500' } }}>
      <Tab.Screen name="Scan" component={ScannerScreen} options={{ tabBarLabel: t('scan'), tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: t('settings'), tabBarIcon: ({ color }) => <TabIcon symbol="⚙︎" color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: scheme === 'dark' ? '#72D5CA' : '#237F78', background: scheme === 'dark' ? '#101615' : '#F2F8F6', card: scheme === 'dark' ? '#1B2422' : '#F8FDFB', text: scheme === 'dark' ? '#FFFFFF' : '#171717', border: scheme === 'dark' ? '#394946' : '#D5E0DD', notification: scheme === 'dark' ? '#72D5CA' : '#237F78' } };
  return <SafeAreaProvider><I18nProvider><NavigationContainer theme={theme}><StatusBar style="auto" /><AppTabs dark={scheme === 'dark'} /></NavigationContainer></I18nProvider></SafeAreaProvider>;
}
