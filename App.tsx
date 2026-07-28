import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/components/ui';

const Tab = createBottomTabNavigator();

function TabIcon({ symbol, color }: { symbol: string; color: string }) {
  return <Text style={{ color, fontSize: 24, fontWeight: '500', lineHeight: 27 }}>{symbol}</Text>;
}

function AppTabs({ dark }: { dark: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#007AFF', tabBarInactiveTintColor: dark ? '#98989D' : '#8E8E93', tabBarStyle: { height: 50 + insets.bottom, paddingTop: 5, paddingBottom: Math.max(insets.bottom, 5), backgroundColor: colors.bar, borderTopColor: colors.separator }, tabBarLabelStyle: { fontSize: 10, fontWeight: '500' } }}>
      <Tab.Screen name="Scan" component={ScannerScreen} options={{ tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color }) => <TabIcon symbol="⚙︎" color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: '#007AFF', background: scheme === 'dark' ? '#000000' : '#F2F2F7', card: scheme === 'dark' ? '#1C1C1E' : '#F9F9F9', text: scheme === 'dark' ? '#FFFFFF' : '#000000', border: scheme === 'dark' ? '#38383A' : '#C6C6C8' } };
  return <SafeAreaProvider><NavigationContainer theme={theme}><StatusBar style="auto" /><AppTabs dark={scheme === 'dark'} /></NavigationContainer></SafeAreaProvider>;
}
