import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Field, Title, ui } from '../components/ui';
import { loadLists } from '../services/bringApi';
import { loadCredentials, loadCustomBarcodes, loadSelectedList, saveCredentials, saveCustomBarcodes, saveSelectedList } from '../services/storage';
import { BringList, CustomBarcode } from '../types';

export function SettingsScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [lists, setLists] = useState<BringList[]>([]); const [selected, setSelected] = useState<BringList | null>(null);
  const [barcode, setBarcode] = useState(''); const [label, setLabel] = useState(''); const [custom, setCustom] = useState<CustomBarcode[]>([]);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { Promise.all([loadCredentials(), loadSelectedList(), loadCustomBarcodes()]).then(([c, l, b]) => { if (c) { setEmail(c.email); setPassword(c.password); } setSelected(l); setCustom(b); }); }, []);

  async function connect() {
    if (!email.trim() || !password) return setError('Enter your Bring email and password.');
    setBusy(true); setError(''); setSuccess('');
    try { const result = await loadLists({ email, password }); await saveCredentials({ email: email.trim(), password }); setLists(result); setSuccess('Connected. Choose a shopping list below.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { setBusy(false); }
  }
  async function choose(list: BringList) { await saveSelectedList(list); setSelected(list); setSuccess(`${list.name} selected.`); }
  async function addCustom() {
    const clean = barcode.replace(/\D/g, '');
    if (!/^\d{8,14}$/.test(clean) || !label.trim()) return setError('Enter an 8–14 digit barcode and a label.');
    const next = [...custom.filter((item) => item.barcode !== clean), { barcode: clean, label: label.trim() }]; await saveCustomBarcodes(next); setCustom(next); setBarcode(''); setLabel(''); setError(''); setSuccess('Custom barcode saved.');
  }
  function removeCustom(value: string) { Alert.alert('Remove custom barcode?', 'The online lookup will be used next time.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { const next = custom.filter((item) => item.barcode !== value); await saveCustomBarcodes(next); setCustom(next); } }]); }

  return <ScrollView style={ui.screen} contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
    <View><Text style={ui.eyebrow}>Configuration</Text><Title>Settings</Title><Text style={ui.muted}>Credentials stay in secure storage on this device.</Text></View>
    {!!error && <Text style={ui.error}>{error}</Text>}{!!success && <Text style={ui.success}>{success}</Text>}
    <Card><Text style={styles.heading}>Bring account</Text><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Bring password" /><Button title="Connect & load lists" onPress={connect} loading={busy} /></Card>
    {(lists.length > 0 || selected) && <Card><Text style={styles.heading}>Shopping list</Text>{selected && !lists.some((l) => l.listUuid === selected.listUuid) && <ListRow list={selected} selected onPress={() => {}} />}{lists.map((list) => <ListRow key={list.listUuid} list={list} selected={selected?.listUuid === list.listUuid} onPress={() => choose(list)} />)}</Card>}
    <Card><Text style={styles.heading}>Custom barcodes</Text><Text style={ui.muted}>Custom labels override online results.</Text><Field label="Barcode" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" placeholder="7612345678901" /><Field label="Label" value={label} onChangeText={setLabel} placeholder="Dragonfruit soda" /><Button title="Save custom barcode" onPress={addCustom} secondary />{custom.map((item) => <View key={item.barcode} style={styles.customRow}><View style={{ flex: 1 }}><Text style={styles.itemLabel}>{item.label}</Text><Text style={styles.code}>{item.barcode}</Text></View><Pressable accessibilityRole="button" onPress={() => removeCustom(item.barcode)}><Text style={styles.remove}>Remove</Text></Pressable></View>)}</Card>
    <Text style={styles.disclaimer}>Bring is a third-party service. This companion is unofficial and may require updates if its private API changes. Product data © Open Food Facts contributors (ODbL).</Text>
  </ScrollView>;
}
function ListRow({ list, selected, onPress }: { list: BringList; selected: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.listRow, selected && styles.listSelected]}><Text style={styles.itemLabel}>{list.name}</Text><Text style={selected ? styles.check : ui.muted}>{selected ? '✓ Selected' : 'Select'}</Text></Pressable>; }
const styles = StyleSheet.create({ heading: { fontSize: 20, fontWeight: '800' }, listRow: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e7e1d8', flexDirection: 'row', justifyContent: 'space-between' }, listSelected: { borderColor: '#ff4f5e', backgroundColor: '#fff5f5' }, check: { color: '#d53243', fontWeight: '700' }, itemLabel: { fontWeight: '700', fontSize: 16 }, customRow: { borderTopWidth: 1, borderTopColor: '#eee8df', paddingTop: 13, flexDirection: 'row', alignItems: 'center' }, code: { color: '#817b73', marginTop: 3 }, remove: { color: '#b02a37', fontWeight: '700', padding: 8 }, disclaimer: { color: '#817b73', fontSize: 12, lineHeight: 17, marginBottom: 20 } });
