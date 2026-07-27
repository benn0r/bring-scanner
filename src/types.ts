export type BringList = { listUuid: string; name: string };
export type Credentials = { email: string; password: string };
export type CustomBarcode = { barcode: string; label: string };
export type Product = { barcode: string; label: string; brand?: string; imageUrl?: string; source: 'custom' | 'open-food-facts' };
