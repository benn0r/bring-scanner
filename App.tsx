import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: '#ff4f5e', background: '#f7f4ef', card: '#ffffff', text: '#20201f', border: '#e7e1d8' } };

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme}>
        <StatusBar style="dark" />
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#ff4f5e', tabBarStyle: { height: 84, paddingTop: 8 }, tabBarLabelStyle: { paddingBottom: 12, fontWeight: '700' } }}>
          <Tab.Screen name="Scan" component={ScannerScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>▣</Text> }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚙</Text> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
