"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { requireAdmin } from "./require-admin";
import {
  productUnits,
  type CatalogActionResult,
  type CategoryInput,
  type ProductInput,
  type ProductUnit,
} from "../types/catalog";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const imagePathPattern =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|jpeg|png|webp)$/;

function failure(message: string): CatalogActionResult {
  return { success: false, message };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function getAvailableSlug(
  table: "categories" | "products",
  name: string,
  currentId?: string,
) {
  const base = slugify(name);

  if (!base) {
    throw new Error("Le nom doit contenir au moins une lettre ou un chiffre.");
  }

  const supabase = await createServerSupabaseClient();

  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error("Impossible de vérifier le nom public.");
    }

    if (!data || data.id === currentId) {
      return candidate;
    }
  }

  throw new Error("Impossible de générer un nom public disponible.");
}

function parseCategoryInput(input: CategoryInput) {
  const name = input.name.trim();
  const description = input.description.trim();
  const displayOrder = Number(input.displayOrder);

  if (!name) {
    throw new Error("Le nom de la catégorie est obligatoire.");
  }

  if (!Number.isInteger(displayOrder) || displayOrder < 0) {
    throw new Error("L’ordre d’affichage doit être un nombre entier positif ou nul.");
  }

  return {
    name,
    description: description || null,
    display_order: displayOrder,
    is_active: input.isActive,
  };
}

function parseProductInput(input: ProductInput) {
  const name = input.name.trim();
  const description = input.description.trim();
  const normalizedPrice = input.priceAmount.trim().replace(",", ".");
  const unitLabel = input.unitLabel.trim();

  if (!name) {
    throw new Error("Le nom du produit est obligatoire.");
  }

  if (!uuidPattern.test(input.categoryId)) {
    throw new Error("Sélectionnez une catégorie valide.");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalizedPrice) || Number(normalizedPrice) < 0) {
    throw new Error("Le prix doit être un montant positif ou nul avec deux décimales maximum.");
  }

  if (!productUnits.includes(input.unit as ProductUnit)) {
    throw new Error("Sélectionnez une unité valide.");
  }

  if (input.unit === "other" && !unitLabel) {
    throw new Error("Indiquez le libellé de l’unité personnalisée.");
  }

  return {
    name,
    description: description || null,
    price_amount: normalizedPrice,
    category_id: input.categoryId,
    unit: input.unit as ProductUnit,
    unit_label: input.unit === "other" ? unitLabel : null,
    is_available: input.isAvailable,
    is_active: input.isActive,
  };
}

function getDatabaseErrorMessage(error: { code?: string } | null, fallback: string) {
  if (error?.code === "23503") {
    return "Cette catégorie ne peut pas être supprimée car elle est utilisée par un produit.";
  }

  if (error?.code === "23505") {
    return "Une donnée avec cette valeur existe déjà.";
  }

  return fallback;
}

export async function createCategoryAction(
  input: CategoryInput,
): Promise<CatalogActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const category = parseCategoryInput(input);
    const supabase = await createServerSupabaseClient();
    const slug = await getAvailableSlug("categories", category.name);
    const { data, error } = await supabase
      .from("categories")
      .insert({ ...category, slug })
      .select("id")
      .single();

    if (error) {
      return failure(getDatabaseErrorMessage(error, "Impossible de créer la catégorie."));
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible de créer la catégorie.");
  }
}

export async function updateCategoryAction(
  input: CategoryInput,
): Promise<CatalogActionResult> {
  try {
    await requireAdmin();

    if (!input.id || !uuidPattern.test(input.id)) {
      return failure("Catégorie introuvable.");
    }

    const category = parseCategoryInput(input);
    const supabase = await createServerSupabaseClient();
    const slug = await getAvailableSlug("categories", category.name, input.id);
    const { error } = await supabase
      .from("categories")
      .update({ ...category, slug })
      .eq("id", input.id);

    if (error) {
      return failure(getDatabaseErrorMessage(error, "Impossible de modifier la catégorie."));
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true, message: "Catégorie enregistrée." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible de modifier la catégorie.");
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<CatalogActionResult> {
  try {
    await requireAdmin();

    if (!uuidPattern.test(categoryId)) {
      return failure("Catégorie introuvable.");
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);

    if (error) {
      return failure(getDatabaseErrorMessage(error, "Impossible de supprimer la catégorie."));
    }

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    return { success: true, message: "Catégorie supprimée." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible de supprimer la catégorie.");
  }
}

export async function createProductAction(
  input: ProductInput,
): Promise<CatalogActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const product = parseProductInput(input);
    const supabase = await createServerSupabaseClient();
    const slug = await getAvailableSlug("products", product.name);
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...product,
        slug,
        currency_code: "USD",
        minimum_order_quantity: 1,
        quantity_step: 1,
      })
      .select("id")
      .single();

    if (error) {
      return failure(getDatabaseErrorMessage(error, "Impossible de créer le produit."));
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible de créer le produit.");
  }
}

export async function updateProductAction(input: ProductInput): Promise<CatalogActionResult> {
  try {
    await requireAdmin();

    if (!input.id || !uuidPattern.test(input.id)) {
      return failure("Produit introuvable.");
    }

    const product = parseProductInput(input);
    const supabase = await createServerSupabaseClient();
    const slug = await getAvailableSlug("products", product.name, input.id);
    const { error } = await supabase
      .from("products")
      .update({ ...product, slug })
      .eq("id", input.id);

    if (error) {
      return failure(getDatabaseErrorMessage(error, "Impossible de modifier le produit."));
    }

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${input.id}`);
    revalidatePath("/admin");
    return { success: true, message: "Produit enregistré." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible de modifier le produit.");
  }
}

export async function createProductPhotoAction(input: {
  productId: string;
  storagePath: string;
  altText: string;
}): Promise<CatalogActionResult> {
  try {
    await requireAdmin();
    const match = imagePathPattern.exec(input.storagePath);

    if (!uuidPattern.test(input.productId) || !match || match[1] !== input.productId) {
      return failure("Le chemin de l’image est invalide.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", input.productId)
      .maybeSingle();

    if (productError || !product) {
      return failure("Produit introuvable.");
    }

    const { data: existingPhotos, error: photosError } = await supabase
      .from("product_photos")
      .select("position, is_primary")
      .eq("product_id", input.productId)
      .order("position", { ascending: false });

    if (photosError) {
      return failure("Impossible de préparer l’enregistrement de la photo.");
    }

    const position = existingPhotos.length > 0 ? existingPhotos[0].position + 1 : 0;
    const { error } = await supabase.from("product_photos").insert({
      product_id: input.productId,
      storage_bucket: "product-images",
      storage_path: input.storagePath,
      alt_text: input.altText.trim() || null,
      position,
      is_primary: existingPhotos.length === 0,
    });

    if (error) {
      return failure("L’image est envoyée, mais sa référence n’a pas pu être enregistrée.");
    }

    revalidatePath(`/admin/products/${input.productId}`);
    revalidatePath("/admin/products");
    return { success: true, message: "Photo ajoutée." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible d’enregistrer la photo.");
  }
}

export async function deleteProductPhotoAction(
  productPhotoId: string,
): Promise<CatalogActionResult> {
  try {
    await requireAdmin();

    if (!uuidPattern.test(productPhotoId)) {
      return failure("Photo introuvable.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: photo, error: photoError } = await supabase
      .from("product_photos")
      .select("id, product_id, storage_bucket, storage_path")
      .eq("id", productPhotoId)
      .maybeSingle();

    if (photoError || !photo) {
      return failure("Photo introuvable.");
    }

    const { error: storageError } = await supabase.storage
      .from(photo.storage_bucket)
      .remove([photo.storage_path]);

    if (storageError) {
      return failure("Impossible de supprimer le fichier image. La référence a été conservée.");
    }

    const { error: databaseError } = await supabase
      .from("product_photos")
      .delete()
      .eq("id", productPhotoId);

    if (databaseError) {
      return failure(
        "Le fichier a été supprimé, mais la référence n’a pas pu être supprimée. Actualisez la page et contactez le support si le problème persiste.",
      );
    }

    revalidatePath(`/admin/products/${photo.product_id}`);
    revalidatePath("/admin/products");
    return { success: true, message: "Photo supprimée." };
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Impossible de supprimer la photo.");
  }
}
