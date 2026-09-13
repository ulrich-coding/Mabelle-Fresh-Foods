export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
};

export type StorefrontProductPhoto = {
  id: string;
  storageBucket: string;
  storagePath: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
};

export type StorefrontProduct = {
  id: string;
  category: Pick<StorefrontCategory, "id" | "name" | "slug">;
  name: string;
  description: string | null;
  priceAmount: string;
  currencyCode: string;
  unit: "kilogram" | "piece" | "dozen" | "other";
  unitLabel: string | null;
  minimumOrderQuantity: string;
  quantityStep: string;
  isActive: boolean;
  isAvailable: boolean;
  photos: StorefrontProductPhoto[];
};

export type StorefrontCatalog = {
  categories: StorefrontCategory[];
  products: StorefrontProduct[];
  selectedCategory: StorefrontCategory | null;
};
