export const productUnits = ["kilogram", "piece", "dozen", "other"] as const;

export type ProductUnit = (typeof productUnits)[number];

export type CatalogActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; message: string };

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export type AdminProductPhoto = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
};

export type AdminProduct = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  price_amount: string;
  currency_code: string;
  unit: ProductUnit;
  unit_label: string | null;
  minimum_order_quantity: string;
  quantity_step: string;
  is_active: boolean;
  is_available: boolean;
  category: Pick<AdminCategory, "id" | "name"> | null;
  photos: AdminProductPhoto[];
};

export type CategoryInput = {
  id?: string;
  name: string;
  description: string;
  displayOrder: string;
  isActive: boolean;
};

export type ProductInput = {
  id?: string;
  name: string;
  description: string;
  priceAmount: string;
  unit: string;
  unitLabel: string;
  categoryId: string;
  isAvailable: boolean;
  isActive: boolean;
};
