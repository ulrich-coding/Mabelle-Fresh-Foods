import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
  AdminCategory,
  AdminProduct,
  AdminProductPhoto,
  ProductUnit,
} from "../types/catalog";

function asProductPhoto(photo: Record<string, unknown>): AdminProductPhoto {
  return {
    id: String(photo.id),
    storage_bucket: String(photo.storage_bucket),
    storage_path: String(photo.storage_path),
    alt_text: typeof photo.alt_text === "string" ? photo.alt_text : null,
    position: Number(photo.position),
    is_primary: Boolean(photo.is_primary),
  };
}

function asProduct(product: Record<string, unknown>): AdminProduct {
  const category = Array.isArray(product.category)
    ? product.category[0]
    : product.category;
  const photos = Array.isArray(product.photos) ? product.photos : [];

  return {
    id: String(product.id),
    category_id: String(product.category_id),
    name: String(product.name),
    slug: String(product.slug),
    description: typeof product.description === "string" ? product.description : null,
    price_amount: String(product.price_amount),
    currency_code: String(product.currency_code),
    unit: product.unit as ProductUnit,
    unit_label: typeof product.unit_label === "string" ? product.unit_label : null,
    minimum_order_quantity: String(product.minimum_order_quantity),
    quantity_step: String(product.quantity_step),
    is_active: Boolean(product.is_active),
    is_available: Boolean(product.is_available),
    category:
      category && typeof category === "object"
        ? { id: String((category as Record<string, unknown>).id), name: String((category as Record<string, unknown>).name) }
        : null,
    photos: photos.map((photo) => asProductPhoto(photo as Record<string, unknown>)),
  };
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, display_order, is_active")
    .order("display_order")
    .order("name");

  if (error) {
    throw new Error("Impossible de charger les catégories.");
  }

  return (data as AdminCategory[] | null) ?? [];
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, category_id, name, slug, description, price_amount, currency_code,
      unit, unit_label, minimum_order_quantity, quantity_step, is_active, is_available,
      category:categories!products_category_id_fkey(id, name),
      photos:product_photos(id, storage_bucket, storage_path, alt_text, position, is_primary)
    `)
    .order("name");

  if (error) {
    throw new Error("Impossible de charger les produits.");
  }

  return ((data as Record<string, unknown>[] | null) ?? []).map(asProduct);
}

export async function getAdminProduct(productId: string): Promise<AdminProduct | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select(`
      id, category_id, name, slug, description, price_amount, currency_code,
      unit, unit_label, minimum_order_quantity, quantity_step, is_active, is_available,
      category:categories!products_category_id_fkey(id, name),
      photos:product_photos(id, storage_bucket, storage_path, alt_text, position, is_primary)
    `)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    throw new Error("Impossible de charger ce produit.");
  }

  return data ? asProduct(data as Record<string, unknown>) : null;
}
