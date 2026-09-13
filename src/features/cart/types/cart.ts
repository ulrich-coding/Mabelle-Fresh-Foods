export type CartUnit = "kilogram" | "piece" | "dozen" | "other";

export type CartPhoto = {
  id: string;
  storageBucket: string;
  storagePath: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
};

export type CartItem = {
  productId: string;
  name: string;
  unitPriceCents: number;
  currencyCode: string;
  unit: CartUnit;
  unitLabel: string | null;
  quantityMilli: number;
  minimumQuantityMilli: number;
  quantityStepMilli: number;
  photo: CartPhoto | null;
};

export type StoredCart = {
  version: 1;
  items: CartItem[];
};
