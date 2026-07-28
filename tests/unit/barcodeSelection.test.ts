import { barcodeCenter, keepBestGeometry, selectInScanRegion, selectMostCentered } from '../../src/services/barcodeSelection';

const target = { x: 175, y: 215 };
const candidate = (data: string, x: number, y: number) => ({ data, bounds: { origin: { x: x - 20, y: y - 10 }, size: { width: 40, height: 20 } } });

describe('barcode selection', () => {
  it('calculates the center of non-empty bounds', () => {
    expect(barcodeCenter(candidate('center', 175, 215))).toEqual(target);
  });

  it('falls back to corner points when bounds are empty', () => {
    expect(barcodeCenter({ data: 'corners', bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } }, cornerPoints: [{ x: 100, y: 100 }, { x: 200, y: 100 }, { x: 200, y: 200 }, { x: 100, y: 200 }] })).toEqual({ x: 150, y: 150 });
  });

  it('selects the barcode nearest the scan-frame center', () => {
    const result = selectMostCentered([candidate('left', 70, 215), candidate('centered', 170, 220), candidate('right', 290, 215)], target);
    expect(result?.data).toBe('centered');
  });

  it('keeps the best observed geometry for a repeatedly detected barcode', () => {
    const candidates = new Map();
    keepBestGeometry(candidates, candidate('same', 30, 30), target);
    keepBestGeometry(candidates, candidate('same', 170, 210), target);
    expect(selectMostCentered([...candidates.values()], target)?.bounds.origin).toEqual({ x: 150, y: 200 });
  });

  it('rejects the top barcode and selects the barcode inside the visible frame', () => {
    const region = { left: 28, top: 154, right: 322, bottom: 276 };
    const topBarcode = candidate('salad-topping', 175, 80);
    const framedBarcode = candidate('ground-almonds', 175, 215);
    expect(selectInScanRegion([topBarcode, framedBarcode], region)?.data).toBe('ground-almonds');
  });

  it('does not select a positioned barcode outside the visible frame', () => {
    expect(selectInScanRegion([candidate('top', 175, 80)], { left: 28, top: 154, right: 322, bottom: 276 })).toBeNull();
  });

  it('falls back only when the camera provides no geometry at all', () => {
    expect(selectInScanRegion([{ data: 'geometry-free' }], { left: 28, top: 154, right: 322, bottom: 276 })?.data).toBe('geometry-free');
  });
});
