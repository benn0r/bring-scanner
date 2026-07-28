import { addToScanHistory } from '../../src/services/storage';
import { Product, ScanHistoryItem } from '../../src/types';

const product = (barcode: string, exactLabel: string): Product => ({
  barcode,
  exactLabel,
  label: exactLabel,
  source: 'open-products-family',
});

describe('scan history', () => {
  it('puts the latest scan first and replaces an older scan of the same barcode', () => {
    const history: ScanHistoryItem[] = [
      { barcode: '11111111', label: 'Old label', scannedAt: 1 },
      { barcode: '22222222', label: 'Milk', scannedAt: 2 },
    ];
    expect(addToScanHistory(history, product('11111111', 'New label'), 3)).toEqual([
      { barcode: '11111111', label: 'New label', brand: undefined, scannedAt: 3 },
      { barcode: '22222222', label: 'Milk', scannedAt: 2 },
    ]);
  });

  it('keeps only the eight most recent distinct products', () => {
    const history = Array.from({ length: 8 }, (_, index) => ({
      barcode: String(index),
      label: String(index),
      scannedAt: index,
    }));
    const next = addToScanHistory(history, product('new', 'New'), 9);
    expect(next).toHaveLength(8);
    expect(next[0].barcode).toBe('new');
    expect(next.some((item) => item.barcode === '7')).toBe(false);
  });
});
