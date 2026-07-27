import { useCallback, useEffect, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Title, ui } from '../components/ui';
import { addItem } from '../services/bringApi';
import { lookupProduct } from '../services/productLookup';
import { loadCredentials, loadCustomBarcodes, loadSelectedList } from '../services/storage';
import { Product } from '../types';

export function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [configured, setConfigured] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => { let live = true; Promise.all([loadCredentials(), loadSelectedList()]).then(([c, l]) => live && setConfigured(Boolean(c && l))); return () => { live = false; }; }, []));
  useEffect(() => { if (!product) setScanning(true); }, [product]);

  async function handleBarcode(value: string) {
    if (!scanning || busy) return;
    setScanning(false); setBusy(true); setError(''); setMessage('');
    try {
      const found = await lookupProduct(value, await loadCustomBarcodes());
      if (!found) throw new Error('Product not found. Add a custom label in Settings and scan again.');
      setProduct(found);
    } catch (e) { setError(e instanceof Error ? e.message : 'Product lookup failed.'); setScanning(true); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!product) return;
    setBusy(true); setError('');
    try {
      const [credentials, list] = await Promise.all([loadCredentials(), loadSelectedList()]);
      if (!credentials || !list) throw new Error('Configure your Bring account and shopping list first.');
      await addItem(credentials, list.listUuid, product.label, product.barcode);
      setMessage(`${product.label} was added to ${list.name}.`); setProduct(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add the item.'); }
    finally { setBusy(false); }
  }

  if (!permission) return <View style={ui.screen} />;
  return <ScrollView style={ui.screen} contentContainerStyle={ui.content}>
    <View><Text style={ui.eyebrow}>Bring companion</Text><Title>Scan & add</Title><Text style={ui.muted}>Point the camera at an EAN or UPC barcode.</Text></View>
    {!configured && <Text style={ui.error}>Open Settings to connect Bring and choose a shopping list.</Text>}
    {!permission.granted ? <Card><Text style={styles.center}>Camera access is needed to scan barcodes.</Text><Button title="Allow camera access" onPress={requestPermission} /></Card> :
      <View style={styles.cameraWrap}><CameraView style={styles.camera} facing="back" active={!product} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={scanning ? ({ data }) => handleBarcode(data) : undefined} /><View pointerEvents="none" style={styles.frame} /></View>}
    {busy && !product && <Text style={ui.muted}>Looking up product…</Text>}
    {!!error && <Text style={ui.error}>{error}</Text>}{!!message && <Text style={ui.success}>{message}</Text>}
    {product && <Card>{product.imageUrl && <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />}<Text style={styles.product}>{product.label}</Text>{product.brand && <Text style={ui.muted}>{product.brand}</Text>}<Text style={styles.code}>{product.barcode} · {product.source === 'custom' ? 'Custom label' : 'Open Food Facts'}</Text><Button title="Add to Bring" onPress={submit} loading={busy} disabled={!configured} /><Button title="Scan another" onPress={() => setProduct(null)} secondary /></Card>}
  </ScrollView>;
}
const styles = StyleSheet.create({ cameraWrap: { height: 390, borderRadius: 24, overflow: 'hidden', backgroundColor: '#222' }, camera: { flex: 1 }, frame: { position: 'absolute', left: 30, right: 30, top: 125, height: 130, borderWidth: 3, borderRadius: 18, borderColor: '#fff' }, center: { textAlign: 'center', fontSize: 16 }, product: { fontSize: 23, fontWeight: '800' }, code: { color: '#8b857d', fontSize: 13 }, image: { height: 120, width: '100%' } });
