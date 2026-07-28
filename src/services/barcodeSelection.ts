export type BarcodeGeometry = {
  data: string;
  bounds?: { origin: { x: number; y: number }; size: { width: number; height: number } };
  cornerPoints?: Array<{ x: number; y: number }>;
};

export type Point = { x: number; y: number };

export function barcodeCenter(candidate: BarcodeGeometry): Point | null {
  const { bounds, cornerPoints } = candidate;
  if (bounds && bounds.size.width > 0 && bounds.size.height > 0) {
    return { x: bounds.origin.x + bounds.size.width / 2, y: bounds.origin.y + bounds.size.height / 2 };
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

export function selectMostCentered<T extends BarcodeGeometry>(candidates: T[], target: Point): T | null {
  return candidates.reduce<T | null>((best, candidate) => {
    if (!best) return candidate;
    return distanceFrom(candidate, target) < distanceFrom(best, target) ? candidate : best;
  }, null);
}

export function keepBestGeometry<T extends BarcodeGeometry>(candidates: Map<string, T>, candidate: T, target: Point) {
  const previous = candidates.get(candidate.data);
  if (!previous || distanceFrom(candidate, target) < distanceFrom(previous, target)) candidates.set(candidate.data, candidate);
}
