import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
  StorefrontCatalog,
  StorefrontCategory,
  StorefrontProduct,
  StorefrontProductPhoto,
} from "../types/catalog";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asCategory(category: Record<string, unknown>): StorefrontCategory {
  return {
    id: String(category.id),
    name: String(category.name),
    slug: String(category.slug),
    description: typeof category.description === "string" ? category.description : null,
    displayOrder: Number(category.display_order),
  };
}

function asPhoto(photo: Record<string, unknown>): StorefrontProductPhoto {
  return {
    id: String(photo.id),
    storageBucket: String(photo.storage_bucket),
    storagePath: String(photo.storage_path),
    altText: typeof photo.alt_text === "string" ? photo.alt_text : null,
    position: Number(photo.position),
    isPrimary: Boolean(photo.is_primary),
  };
}

function asProduct(product: Record<string, unknown>, categoriesById: Map<string, StorefrontCategory>): StorefrontProduct | null {
  const category = categoriesById.get(String(product.category_id));
  if (!category) return null;

  const photos = (Array.isArray(product.photos) ? product.photos : [])
    .map((photo) => asPhoto(photo as Record<string, unknown>))
    .sort((first, second) => Number(second.isPrimary) - Number(first.isPrimary) || first.position - second.position);

  return {
    id: String(product.id),
    category: { id: category.id, name: category.name, slug: category.slug },
    name: String(product.name),
    description: typeof product.description === "string" ? product.description : null,
    priceAmount: String(product.price_amount),
    currencyCode: String(product.currency_code),
    unit: product.unit as StorefrontProduct["unit"],
    unitLabel: typeof product.unit_label === "string" ? product.unit_label : null,
    minimumOrderQuantity: String(product.minimum_order_quantity),
    quantityStep: String(product.quantity_step),
    isActive: Boolean(product.is_active),
    isAvailable: Boolean(product.is_available),
    photos,
  };
}

async function getVisibleCategories(): Promise<StorefrontCategory[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, display_order")
    .eq("is_active", true)
    .order("display_order")
    .order("name");

  if (error) throw new Error("Impossible de charger les catégories publiques.");

  return ((data as Record<string, unknown>[] | null) ?? []).map(asCategory);
}

async function getVisibleProducts(categories: StorefrontCategory[]): Promise<StorefrontProduct[]> {
  if (categories.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, category_id, name, description, price_amount, currency_code, unit, unit_label,
      minimum_order_quantity, quantity_step, is_active, is_available,
      photos:product_photos(id, storage_bucket, storage_path, alt_text, position, is_primary)
    `)
    .eq("is_active", true)
    .eq("is_available", true)
    .in(
      "category_id",
      categories.map((category) => category.id),
    )
    .order("name");

  if (error) throw new Error("Impossible de charger les produits publics.");

  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  return ((data as Record<string, unknown>[] | null) ?? [])
    .map((product) => asProduct(product, categoriesById))
    .filter((product): product is StorefrontProduct => product !== null);
}

export async function getStorefrontCatalog(categorySlug?: string): Promise<StorefrontCatalog> {
  const categories = await getVisibleCategories();
  const selectedCategory = categorySlug ? categories.find((category) => category.slug === categorySlug) ?? null : null;
  const categoriesForProducts = selectedCategory ? [selectedCategory] : categorySlug ? [] : categories;

  return {
    categories,
    products: await getVisibleProducts(categoriesForProducts),
    selectedCategory,
  };
}

export async function getVisibleProduct(productId: string): Promise<StorefrontProduct | null> {
  if (!uuidPattern.test(productId)) return null;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, category_id, name, description, price_amount, currency_code, unit, unit_label,
      minimum_order_quantity, quantity_step, is_active, is_available,
      photos:product_photos(id, storage_bucket, storage_path, alt_text, position, is_primary)
    `)
    .eq("id", productId)
    .eq("is_active", true)
    .eq("is_available", true)
    .maybeSingle();

  if (error) throw new Error("Impossible de charger ce produit.");
  if (!data) return null;

  const { data: categoryData, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug, description, display_order")
    .eq("id", data.category_id)
    .eq("is_active", true)
    .maybeSingle();

  if (categoryError) throw new Error("Impossible de charger la catégorie de ce produit.");
  if (!categoryData) return null;

  return asProduct(data as Record<string, unknown>, new Map([[String(categoryData.id), asCategory(categoryData as Record<string, unknown>)]]));
}
