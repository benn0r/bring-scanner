import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { BringList, Credentials, CustomBarcode, LookupPreferences } from '../types';

const CREDENTIALS_KEY = 'bring-credentials';
const LIST_KEY = 'selected-list';
const BARCODES_KEY = 'custom-barcodes';
const LOOKUP_PREFERENCES_KEY = 'lookup-preferences';
export const DEFAULT_LOOKUP_PREFERENCES: LookupPreferences = { language: 'auto', labelStyle: 'generic' };

export async function saveCredentials(value: Credentials) { await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(value)); }
export async function loadCredentials(): Promise<Credentials | null> {
  const value = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  return value ? JSON.parse(value) : null;
}
export async function clearCredentials() { await SecureStore.deleteItemAsync(CREDENTIALS_KEY); }
export async function saveSelectedList(value: BringList) { await AsyncStorage.setItem(LIST_KEY, JSON.stringify(value)); }
export async function loadSelectedList(): Promise<BringList | null> {
  const value = await AsyncStorage.getItem(LIST_KEY);
  return value ? JSON.parse(value) : null;
}
export async function loadCustomBarcodes(): Promise<CustomBarcode[]> {
  const value = await AsyncStorage.getItem(BARCODES_KEY);
  return value ? JSON.parse(value) : [];
}
export async function saveCustomBarcodes(value: CustomBarcode[]) { await AsyncStorage.setItem(BARCODES_KEY, JSON.stringify(value)); }
export async function loadLookupPreferences(): Promise<LookupPreferences> {
  const value = await AsyncStorage.getItem(LOOKUP_PREFERENCES_KEY);
  return value ? { ...DEFAULT_LOOKUP_PREFERENCES, ...JSON.parse(value) } : DEFAULT_LOOKUP_PREFERENCES;
}
export async function saveLookupPreferences(value: LookupPreferences) { await AsyncStorage.setItem(LOOKUP_PREFERENCES_KEY, JSON.stringify(value)); }
