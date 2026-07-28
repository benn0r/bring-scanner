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
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: dark ? '#FF6570' : '#D92D3A', tabBarInactiveTintColor: dark ? '#AEA7A5' : '#807775', tabBarStyle: { height: 50 + insets.bottom, paddingTop: 5, paddingBottom: Math.max(insets.bottom, 5), backgroundColor: colors.bar, borderTopColor: colors.separator }, tabBarLabelStyle: { fontSize: 10, fontWeight: '500' } }}>
      <Tab.Screen name="Scan" component={ScannerScreen} options={{ tabBarIcon: ({ color }) => <TabIcon symbol="▦" color={color} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color }) => <TabIcon symbol="⚙︎" color={color} /> }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = { ...base, colors: { ...base.colors, primary: scheme === 'dark' ? '#FF6570' : '#D92D3A', background: scheme === 'dark' ? '#141110' : '#F7F3F1', card: scheme === 'dark' ? '#211C1B' : '#FFFBF9', text: scheme === 'dark' ? '#FFFFFF' : '#171717', border: scheme === 'dark' ? '#443D3B' : '#DED7D5', notification: scheme === 'dark' ? '#FF6570' : '#D92D3A' } };
  return <SafeAreaProvider><NavigationContainer theme={theme}><StatusBar style="auto" /><AppTabs dark={scheme === 'dark'} /></NavigationContainer></SafeAreaProvider>;
}
