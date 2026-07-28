import { useCallback, useEffect, useRef, useState } from 'react';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, colors, LargeTitle, Notice, Section, Separator, ui } from '../components/ui';
import { addItem } from '../services/bringApi';
import { lookupProduct } from '../services/productLookup';
import { loadCredentials, loadCustomBarcodes, loadLookupPreferences, loadSelectedList } from '../services/storage';
import { Product } from '../types';
import { keepBestGeometry, selectMostCentered } from '../services/barcodeSelection';

const CANDIDATE_WINDOW_MS = 180;

export function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [configured, setConfigured] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const candidates = useRef(new Map<string, BarcodeScanningResult>());
  const candidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanTarget = useRef({ x: 175, y: 215 });
  const scanLocked = useRef(false);

  useFocusEffect(useCallback(() => { let live = true; Promise.all([loadCredentials(), loadSelectedList()]).then(([c, l]) => live && setConfigured(Boolean(c && l))); return () => { live = false; }; }, []));
  useEffect(() => { if (!product) { scanLocked.current = false; setScanning(true); } }, [product]);
  useEffect(() => () => { if (candidateTimer.current) clearTimeout(candidateTimer.current); }, []);

  function collectCandidate(result: BarcodeScanningResult) {
    if (!scanning || busy || scanLocked.current) return;
    keepBestGeometry(candidates.current, result, scanTarget.current);
    if (candidateTimer.current) return;
    candidateTimer.current = setTimeout(() => {
      const selected = selectMostCentered([...candidates.current.values()], scanTarget.current);
      candidates.current.clear();
      candidateTimer.current = null;
      if (selected) { scanLocked.current = true; handleBarcode(selected.data); }
    }, CANDIDATE_WINDOW_MS);
  }

  async function handleBarcode(value: string) {
    if (!scanning || busy) return;
    setScanning(false); setBusy(true); setError(''); setMessage('');
    try { const [customBarcodes, preferences] = await Promise.all([loadCustomBarcodes(), loadLookupPreferences()]); const found = await lookupProduct(value, customBarcodes, preferences); if (!found) throw new Error('Product not found. Add a custom label in Settings and scan again.'); setProduct(found); }
    catch (e) { scanLocked.current = false; setError(e instanceof Error ? e.message : 'Product lookup failed.'); setScanning(true); }
    finally { setBusy(false); }
  }

  async function submit(label: string) {
    if (!product) return;
    setBusy(true); setError('');
    try { const [credentials, list] = await Promise.all([loadCredentials(), loadSelectedList()]); if (!credentials || !list) throw new Error('Configure your Bring account and shopping list first.'); await addItem(credentials, list.listUuid, label, product.barcode); setMessage(`${label} was added to ${list.name}.`); setProduct(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not add the item.'); }
    finally { setBusy(false); }
  }

  if (!permission) return <SafeAreaView edges={['top']} style={ui.safe} />;
  return <SafeAreaView edges={['top']} style={ui.safe}>
    <View style={ui.header}><LargeTitle>Scan</LargeTitle></View>
    <ScrollView style={ui.screen} contentContainerStyle={ui.content} showsVerticalScrollIndicator={false}>
      {!configured && <Notice>Connect Bring and choose a shopping list in Settings.</Notice>}
      {!!error && <Notice>{error}</Notice>}{!!message && <Notice kind="success">{message}</Notice>}
      {!permission.granted ? <Section footer="Camera access is used only to read product barcodes."><ActionButton title="Allow Camera Access" onPress={requestPermission} /></Section> :
        <View style={styles.cameraWrap} onLayout={({ nativeEvent }) => { scanTarget.current = { x: nativeEvent.layout.width / 2, y: nativeEvent.layout.height / 2 }; }}>
          <CameraView style={styles.camera} facing="back" active={!product} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={scanning ? collectCandidate : undefined} />
          <View pointerEvents="none" style={styles.scrimTop}><Text style={styles.guidance}>Align the barcode inside the frame</Text></View>
          <View pointerEvents="none" style={styles.frame} />
          {busy && <View style={styles.loading}><ActivityIndicator size="large" color="#FFFFFF" /><Text style={styles.loadingText}>Looking Up…</Text></View>}
        </View>}
      <Text style={styles.help}>EAN-8, EAN-13, UPC-A and UPC-E are supported.</Text>
    </ScrollView>
    <ProductSheet product={product} busy={busy} configured={configured} onAdd={submit} onClose={() => setProduct(null)} />
  </SafeAreaView>;
}

function ProductSheet({ product, busy, configured, onAdd, onClose }: { product: Product | null; busy: boolean; configured: boolean; onAdd: (label: string) => void; onClose: () => void }) {
  const [label, setLabel] = useState('');
  useEffect(() => { setLabel(product?.label || ''); }, [product]);
  return <Modal visible={Boolean(product)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <SafeAreaView edges={['top', 'bottom']} style={styles.sheetSafe}>
      <View style={styles.sheetBar}><Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}><Text style={styles.cancel}>Cancel</Text></Pressable><Text style={styles.sheetTitle}>Add Item</Text><View style={styles.placeholder} /></View>
      {product && <ScrollView contentContainerStyle={styles.sheetContent}>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" /> : <View style={styles.productIcon}><Text style={styles.productIconText}>▦</Text></View>}
        <Text style={styles.product}>{product.exactLabel}</Text>{product.brand ? <Text style={ui.muted}>{product.brand}</Text> : null}
        <Section title="Bring Label"><TextInput value={label} onChangeText={setLabel} style={styles.labelInput} placeholder="Shopping list label" placeholderTextColor={colors.tertiaryLabel} selectionColor={colors.tint} /></Section>
        <Section><View style={styles.detailRow}><Text style={styles.detailLabel}>Barcode</Text><Text style={styles.detailValue}>{product.barcode}</Text></View><Separator /><View style={styles.detailRow}><Text style={styles.detailLabel}>Source</Text><Text style={styles.detailValue}>{sourceName(product)}</Text></View></Section>
        <View style={styles.primaryWrap}><Pressable accessibilityRole="button" disabled={busy || !configured || !label.trim()} onPress={() => onAdd(label.trim())} style={({ pressed }) => [styles.primary, (pressed || busy || !configured || !label.trim()) && styles.primaryDisabled]}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Add to Bring</Text>}</Pressable></View>
        {!configured && <Text style={styles.sheetHelp}>Configure a shopping list in Settings before adding this item.</Text>}
      </ScrollView>}
    </SafeAreaView>
  </Modal>;
}

function sourceName(product: Product) {
  if (product.source === 'custom') return 'Custom label';
  return ({ food: 'Open Food Facts', product: 'Open Products Facts', beauty: 'Open Beauty Facts', petfood: 'Open Pet Food Facts' } as const)[product.productType || 'product'];
}

const styles = StyleSheet.create({ cameraWrap: { height: 430, borderRadius: 14, overflow: 'hidden', backgroundColor: '#000000' }, camera: { flex: 1 }, scrimTop: { position: 'absolute', left: 0, right: 0, top: 0, height: 92, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.42)' }, guidance: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }, frame: { position: 'absolute', left: 28, right: 28, top: 154, height: 122, borderWidth: 3, borderRadius: 12, borderColor: '#FFFFFF' }, loading: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.48)' }, loadingText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' }, help: { color: colors.secondaryLabel, fontSize: 13, lineHeight: 18, textAlign: 'center' }, sheetSafe: { flex: 1, backgroundColor: colors.systemGroupedBackground }, sheetBar: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator, backgroundColor: colors.bar }, cancel: { color: colors.tint, fontSize: 17 }, sheetTitle: { color: colors.label, fontSize: 17, fontWeight: '600' }, placeholder: { width: 48 }, sheetContent: { padding: 20, gap: 18, alignItems: 'stretch' }, image: { height: 150, width: '100%' }, productIcon: { alignSelf: 'center', width: 110, height: 110, borderRadius: 24, backgroundColor: colors.secondarySystemBackground, alignItems: 'center', justifyContent: 'center' }, productIconText: { color: colors.tint, fontSize: 54 }, product: { color: colors.label, fontSize: 28, lineHeight: 34, fontWeight: '700', textAlign: 'center' }, labelInput: { minHeight: 50, paddingHorizontal: 16, color: colors.label, fontSize: 17 }, detailRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }, detailLabel: { color: colors.label, fontSize: 17, flex: 1 }, detailValue: { color: colors.secondaryLabel, fontSize: 17 }, primaryWrap: { paddingTop: 2 }, primary: { minHeight: 50, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }, primaryDisabled: { opacity: 0.42 }, primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' }, sheetHelp: { color: colors.secondaryLabel, fontSize: 13, lineHeight: 18, textAlign: 'center' } });
