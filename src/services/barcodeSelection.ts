export type BarcodeGeometry = {
  data: string;
  bounds?: { origin: { x: number; y: number }; size: { width: number; height: number } };
  cornerPoints?: { x: number; y: number }[];
};

export type Point = { x: number; y: number };
export type ScanRegion = { left: number; top: number; right: number; bottom: number };

export function barcodeCenter(candidate: BarcodeGeometry): Point | null {
  const { bounds, cornerPoints } = candidate;
  if (bounds && bounds.size.width > 0 && bounds.size.height > 0) {
    return {
      x: bounds.origin.x + bounds.size.width / 2,
      y: bounds.origin.y + bounds.size.height / 2,
    };
  }
  if (cornerPoints?.length) {
    return {
      x: cornerPoints.reduce((sum, point) => sum + point.x, 0) / cornerPoints.length,
      y: cornerPoints.reduce((sum, point) => sum + point.y, 0) / cornerPoints.length,
    };
  }
  return null;
}

export function distanceFrom(candidate: BarcodeGeometry, target: Point) {
  const center = barcodeCenter(candidate);
  return center ? Math.hypot(center.x - target.x, center.y - target.y) : Number.POSITIVE_INFINITY;
}

export function selectMostCentered<T extends BarcodeGeometry>(
  candidates: T[],
  target: Point,
): T | null {
  return candidates.reduce<T | null>((best, candidate) => {
    if (!best) return candidate;
    return distanceFrom(candidate, target) < distanceFrom(best, target) ? candidate : best;
  }, null);
}

export function isInsideRegion(candidate: BarcodeGeometry, region: ScanRegion) {
  const center = barcodeCenter(candidate);
  return center
    ? center.x >= region.left &&
        center.x <= region.right &&
        center.y >= region.top &&
        center.y <= region.bottom
    : false;
}

export function selectInScanRegion<T extends BarcodeGeometry>(
  candidates: T[],
  region: ScanRegion,
): T | null {
  const positioned = candidates.filter((candidate) => barcodeCenter(candidate));
  const inside = positioned.filter((candidate) => isInsideRegion(candidate, region));
  if (inside.length)
    return selectMostCentered(inside, {
      x: (region.left + region.right) / 2,
      y: (region.top + region.bottom) / 2,
    });
  // Geometry-free fallback supports devices that never provide bounds, but it must
  // never let an explicitly out-of-frame barcode override the visible target.
  return positioned.length ? null : candidates[0] || null;
}

export function keepBestGeometry<T extends BarcodeGeometry>(
  candidates: Map<string, T>,
  candidate: T,
  target: Point,
) {
  const previous = candidates.get(candidate.data);
  if (!previous || distanceFrom(candidate, target) < distanceFrom(previous, target))
    candidates.set(candidate.data, candidate);
}
