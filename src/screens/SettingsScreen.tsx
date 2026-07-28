import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, colors, Field, LargeTitle, ListRow, Notice, Section, Separator, ui } from '../components/ui';
import { loadLists } from '../services/bringApi';
import { DEFAULT_LOOKUP_PREFERENCES, loadCredentials, loadCustomBarcodes, loadLookupPreferences, loadSelectedList, saveCredentials, saveCustomBarcodes, saveLookupPreferences, saveSelectedList } from '../services/storage';
import { BringList, CustomBarcode, LabelStyle, LookupPreferences, ProductLanguage } from '../types';

const LANGUAGES: Array<{ value: ProductLanguage; title: string }> = [{ value: 'auto', title: 'Automatic' }, { value: 'de', title: 'German' }, { value: 'en', title: 'English' }, { value: 'fr', title: 'French' }, { value: 'it', title: 'Italian' }];
const LABEL_STYLES: Array<{ value: LabelStyle; title: string; detail: string }> = [{ value: 'generic', title: 'Generic', detail: 'Toilet paper' }, { value: 'exact', title: 'Exact Product', detail: 'Brand, variant and quantity' }, { value: 'ask', title: 'Ask Every Time', detail: 'Start with the exact name and edit it' }];

export function SettingsScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [lists, setLists] = useState<BringList[]>([]); const [selected, setSelected] = useState<BringList | null>(null);
  const [barcode, setBarcode] = useState(''); const [label, setLabel] = useState(''); const [custom, setCustom] = useState<CustomBarcode[]>([]);
  const [preferences, setPreferences] = useState<LookupPreferences>(DEFAULT_LOOKUP_PREFERENCES);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { Promise.all([loadCredentials(), loadSelectedList(), loadCustomBarcodes(), loadLookupPreferences()]).then(([c, l, b, p]) => { if (c) { setEmail(c.email); setPassword(c.password); } setSelected(l); setCustom(b); setPreferences(p); }); }, []);
  useEffect(() => { if (!success) return; const timer = setTimeout(() => setSuccess(''), 3000); return () => clearTimeout(timer); }, [success]);

  async function connect() { if (!email.trim() || !password) return setError('Enter your Bring email and password.'); setBusy(true); setError(''); setSuccess(''); try { const result = await loadLists({ email, password }); await saveCredentials({ email: email.trim(), password }); setLists(result); setSuccess('Connected. Choose a shopping list below.'); } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); } finally { setBusy(false); } }
  async function choose(list: BringList) { await saveSelectedList(list); setSelected(list); setSuccess(`${list.name} selected.`); }
  async function addCustom() { const clean = barcode.replace(/\D/g, ''); if (!/^\d{8,14}$/.test(clean) || !label.trim()) return setError('Enter an 8–14 digit barcode and a label.'); const next = [...custom.filter((item) => item.barcode !== clean), { barcode: clean, label: label.trim() }]; await saveCustomBarcodes(next); setCustom(next); setBarcode(''); setLabel(''); setError(''); setSuccess('Custom barcode saved.'); }
  function removeCustom(value: string) { Alert.alert('Remove Custom Barcode?', 'The online lookup will be used the next time this barcode is scanned.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { const next = custom.filter((item) => item.barcode !== value); await saveCustomBarcodes(next); setCustom(next); setError(''); setSuccess('Custom barcode removed.'); } }]); }
  async function updatePreferences(update: Partial<LookupPreferences>, confirmation: string) { const next = { ...preferences, ...update }; setPreferences(next); await saveLookupPreferences(next); setError(''); setSuccess(confirmation); }

  return <SafeAreaView edges={['top']} style={ui.safe}>
    <View style={ui.header}><LargeTitle>Settings</LargeTitle></View>
    {(error || success) && <View pointerEvents="none" style={styles.statusSlot}>{error ? <Notice>{error}</Notice> : <Notice kind="success">{success}</Notice>}</View>}
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Section title="Bring Account" footer="Your password is kept in the iOS Keychain and is never stored in regular app data.">
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" placeholder="you@example.com" />
        <Separator />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" placeholder="Required" />
        <Separator />
        <ActionButton title="Connect & Load Lists" onPress={connect} loading={busy} />
      </Section>
      {(lists.length > 0 || selected) && <Section title="Shopping List" footer="Scanned products are added to the selected list.">
        {selected && !lists.some((l) => l.listUuid === selected.listUuid) && <ListRow title={selected.name} selected />}
        {lists.map((list, index) => <View key={list.listUuid}>{index > 0 || (selected && !lists.some((l) => l.listUuid === selected.listUuid)) ? <Separator /> : null}<ListRow title={list.name} selected={selected?.listUuid === list.listUuid} onPress={() => choose(list)} /></View>)}
      </Section>}
      <Section title="Product Language" footer="Automatic follows the iPhone language. English is used before falling back to the contributor's original name.">
        {LANGUAGES.map((language, index) => <View key={language.value}>{index > 0 ? <Separator /> : null}<ListRow title={language.title} selected={preferences.language === language.value} onPress={() => updatePreferences({ language: language.value }, `Product language set to ${language.title}.`)} /></View>)}
      </Section>
      <Section title="Bring Item Label" footer="The label is always editable before the item is added.">
        {LABEL_STYLES.map((style, index) => <View key={style.value}>{index > 0 ? <Separator /> : null}<ListRow title={style.title} detail={style.detail} selected={preferences.labelStyle === style.value} onPress={() => updatePreferences({ labelStyle: style.value }, `Bring item label set to ${style.title}.`)} /></View>)}
      </Section>
      <Section title="Add Custom Barcode" footer="Custom labels take priority over Open Food Facts results.">
        <Field label="Barcode" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" placeholder="7612345678901" />
        <Separator />
        <Field label="Label" value={label} onChangeText={setLabel} placeholder="Product name" />
        <Separator />
        <ActionButton title="Save Custom Barcode" onPress={addCustom} />
      </Section>
      {custom.length > 0 && <Section title="Saved Barcodes">{custom.map((item, index) => <View key={item.barcode}>{index > 0 ? <Separator /> : null}<ListRow title={item.label} detail={item.barcode} trailing={<Pressable accessibilityRole="button" hitSlop={10} onPress={() => removeCustom(item.barcode)}><Text style={styles.delete}>Delete</Text></Pressable>} /></View>)}</Section>}
      <Section title="About"><ListRow title="Product Databases" detail="Open Food, Products, Beauty & Pet Food Facts" /><Separator /><ListRow title="Bring Integration" detail="Unofficial API" /></Section>
      <Text style={styles.disclaimer}>This companion is not affiliated with Bring! Labs AG. Product data © Open Food Facts contributors (ODbL).</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ statusSlot: { position: 'absolute', zIndex: 10, bottom: 12, left: 16, right: 16 }, delete: { color: colors.destructive, fontSize: 15 }, disclaimer: { color: colors.secondaryLabel, fontSize: 12, lineHeight: 17, textAlign: 'center', marginHorizontal: 18, marginBottom: 12 } });
