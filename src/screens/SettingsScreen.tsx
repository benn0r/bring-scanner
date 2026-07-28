import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, colors, Field, LargeTitle, ListRow, Notice, Section, Separator, ui } from '../components/ui';
import { loadLists } from '../services/bringApi';
import { loadCredentials, loadCustomBarcodes, loadSelectedList, saveCredentials, saveCustomBarcodes, saveSelectedList } from '../services/storage';
import { BringList, CustomBarcode } from '../types';

export function SettingsScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [lists, setLists] = useState<BringList[]>([]); const [selected, setSelected] = useState<BringList | null>(null);
  const [barcode, setBarcode] = useState(''); const [label, setLabel] = useState(''); const [custom, setCustom] = useState<CustomBarcode[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { Promise.all([loadCredentials(), loadSelectedList(), loadCustomBarcodes()]).then(([c, l, b]) => { if (c) { setEmail(c.email); setPassword(c.password); } setSelected(l); setCustom(b); }); }, []);

  async function connect() { if (!email.trim() || !password) return setError('Enter your Bring email and password.'); setBusy(true); setError(''); setSuccess(''); try { const result = await loadLists({ email, password }); await saveCredentials({ email: email.trim(), password }); setLists(result); setSuccess('Connected. Choose a shopping list below.'); } catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); } finally { setBusy(false); } }
  async function choose(list: BringList) { await saveSelectedList(list); setSelected(list); setSuccess(`${list.name} selected.`); }
  async function addCustom() { const clean = barcode.replace(/\D/g, ''); if (!/^\d{8,14}$/.test(clean) || !label.trim()) return setError('Enter an 8–14 digit barcode and a label.'); const next = [...custom.filter((item) => item.barcode !== clean), { barcode: clean, label: label.trim() }]; await saveCustomBarcodes(next); setCustom(next); setBarcode(''); setLabel(''); setError(''); setSuccess('Custom barcode saved.'); }
  function removeCustom(value: string) { Alert.alert('Remove Custom Barcode?', 'The online lookup will be used the next time this barcode is scanned.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { const next = custom.filter((item) => item.barcode !== value); await saveCustomBarcodes(next); setCustom(next); } }]); }

  return <SafeAreaView edges={['top']} style={ui.safe}>
    <View style={ui.header}><LargeTitle>Settings</LargeTitle></View>
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {!!error && <Notice>{error}</Notice>}{!!success && <Notice kind="success">{success}</Notice>}
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
      <Section title="Add Custom Barcode" footer="Custom labels take priority over Open Food Facts results.">
        <Field label="Barcode" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" placeholder="7612345678901" />
        <Separator />
        <Field label="Label" value={label} onChangeText={setLabel} placeholder="Product name" />
        <Separator />
        <ActionButton title="Save Custom Barcode" onPress={addCustom} />
      </Section>
      {custom.length > 0 && <Section title="Saved Barcodes">{custom.map((item, index) => <View key={item.barcode}>{index > 0 ? <Separator /> : null}<ListRow title={item.label} detail={item.barcode} trailing={<Pressable accessibilityRole="button" hitSlop={10} onPress={() => removeCustom(item.barcode)}><Text style={styles.delete}>Delete</Text></Pressable>} /></View>)}</Section>}
      <Section title="About"><ListRow title="Product Database" detail="Open Food Facts" /><Separator /><ListRow title="Bring Integration" detail="Unofficial API" /></Section>
      <Text style={styles.disclaimer}>This companion is not affiliated with Bring! Labs AG. Product data © Open Food Facts contributors (ODbL).</Text>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ delete: { color: colors.destructive, fontSize: 15 }, disclaimer: { color: colors.secondaryLabel, fontSize: 12, lineHeight: 17, textAlign: 'center', marginHorizontal: 18, marginBottom: 12 } });
