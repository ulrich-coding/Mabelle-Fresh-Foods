"use server";

import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import {
  calculateValidatedLineTotalCents,
  getValidatedProductAmounts,
  parseCheckoutCartItems,
  validateCheckoutForm,
  validateQuantityForProduct,
  type CheckoutProductForValidation,
} from "../lib/validation";
import type {
  CheckoutValidationFailure,
  CheckoutValidationRequest,
  CheckoutValidationResult,
  ValidatedCheckoutItem,
} from "../types/checkout";

type ProductRow = {
  id: string;
  category_id: string;
  name: string;
  price_amount: string;
  currency_code: string;
  unit: CheckoutProductForValidation["unit"];
  unit_label: string | null;
  minimum_order_quantity: string;
  quantity_step: string;
};

function failure(message: string, options?: Omit<CheckoutValidationFailure, "success" | "message">): CheckoutValidationFailure {
  return { success: false, message, ...options };
}

function asProduct(row: ProductRow): CheckoutProductForValidation {
  return {
    id: row.id,
    name: row.name,
    priceAmount: String(row.price_amount),
    currencyCode: String(row.currency_code),
    unit: row.unit,
    unitLabel: row.unit_label,
    minimumOrderQuantity: String(row.minimum_order_quantity),
    quantityStep: String(row.quantity_step),
  };
}

export async function validateCheckoutAction(
  request: CheckoutValidationRequest,
): Promise<CheckoutValidationResult> {
  try {
    const form = validateCheckoutForm(request?.form);
    if ("success" in form) return form;

    const cartItems = parseCheckoutCartItems(request?.cartItems);
    if ("success" in cartItems) return cartItems;

    const productIds = cartItems.map((item) => item.productId);
    const supabase = await createServerSupabaseClient();
    const { data: productRows, error: productsError } = await supabase
      .from("products")
      .select("id, category_id, name, price_amount, currency_code, unit, unit_label, minimum_order_quantity, quantity_step")
      .in("id", productIds)
      .eq("is_active", true)
      .eq("is_available", true);

    if (productsError) {
      return failure("La vérification du panier est momentanément indisponible. Réessayez.");
    }

    const categoryIds = [...new Set(((productRows ?? []) as ProductRow[]).map((product) => product.category_id))];
    const { data: categoryRows, error: categoriesError } = categoryIds.length === 0
      ? { data: [], error: null }
      : await supabase
        .from("categories")
        .select("id")
        .in("id", categoryIds)
        .eq("is_active", true);

    if (categoriesError) {
      return failure("La vérification du panier est momentanément indisponible. Réessayez.");
    }

    const activeCategoryIds = new Set((categoryRows ?? []).map((category) => String(category.id)));
    const productsById = new Map(
      ((productRows ?? []) as ProductRow[])
        .filter((product) => activeCategoryIds.has(product.category_id))
        .map((product) => [product.id, asProduct(product)]),
    );

    const cartErrors: string[] = [];
    const validatedItems: ValidatedCheckoutItem[] = [];

    for (const item of cartItems) {
      const product = productsById.get(item.productId);
      if (!product) {
        cartErrors.push("Un produit de votre panier n’est plus disponible. Retournez au panier pour le retirer.");
        continue;
      }

      const quantityError = validateQuantityForProduct(item.quantityMilli, product);
      if (quantityError) {
        cartErrors.push(`${product.name} : ${quantityError}`);
        continue;
      }

      const amounts = getValidatedProductAmounts(product);
      if (!amounts) {
        cartErrors.push(`${product.name} : son prix ou ses règles de vente ne peuvent pas être vérifiés.`);
        continue;
      }

      const lineTotalCents = calculateValidatedLineTotalCents(amounts.unitPriceCents, item.quantityMilli);
      if (lineTotalCents === null) {
        cartErrors.push(`${product.name} : le montant ne peut pas être calculé.`);
        continue;
      }

      validatedItems.push({
        productId: product.id,
        name: product.name,
        unit: product.unit,
        unitLabel: product.unitLabel,
        quantityMilli: item.quantityMilli,
        minimumQuantityMilli: amounts.minimumQuantityMilli,
        quantityStepMilli: amounts.quantityStepMilli,
        unitPriceCents: amounts.unitPriceCents,
        lineTotalCents,
        currencyCode: "USD",
      });
    }

    if (cartErrors.length > 0 || validatedItems.length !== cartItems.length) {
      return failure("Votre panier a changé ou contient une quantité invalide. Vérifiez-le avant de continuer.", { cartErrors });
    }

    const subtotalCents = validatedItems.reduce((total, item) => total + item.lineTotalCents, 0);
    if (!Number.isSafeInteger(subtotalCents)) {
      return failure("Le total de la commande ne peut pas être calculé.");
    }

    return {
      success: true,
      message: "Le panier a été vérifié avec les informations actuelles du catalogue.",
      fulfillmentMethod: form.fulfillmentMethod,
      items: validatedItems,
      subtotalCents,
      totalCents: subtotalCents,
      currencyCode: "USD",
    };
  } catch {
    return failure("La vérification du panier est momentanément indisponible. Réessayez.");
  }
}
