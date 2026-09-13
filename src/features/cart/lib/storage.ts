import { normalizeQuantityMilli } from "./calculations";
import type { CartItem, CartPhoto, CartUnit, StoredCart } from "../types/cart";

const storageKey = "mabelle-fresh-foods-cart-v1";
const productUnits = new Set<CartUnit>(["kilogram", "piece", "dozen", "other"]);

function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function asPhoto(value: unknown): CartPhoto | null {
  if (value === null) return null;
  if (!value || typeof value !== "object") return null;

  const photo = value as Record<string, unknown>;
  if (
    typeof photo.id !== "string" ||
    typeof photo.storageBucket !== "string" ||
    typeof photo.storagePath !== "string" ||
    typeof photo.position !== "number" ||
    typeof photo.isPrimary !== "boolean"
  ) {
    return null;
  }

  return {
    id: photo.id,
    storageBucket: photo.storageBucket,
    storagePath: photo.storagePath,
    altText: typeof photo.altText === "string" ? photo.altText : null,
    position: photo.position,
    isPrimary: photo.isPrimary,
  };
}

function asCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.productId !== "string" ||
    typeof item.name !== "string" ||
    !isNonNegativeSafeInteger(item.unitPriceCents) ||
    typeof item.currencyCode !== "string" ||
    typeof item.unit !== "string" ||
    !productUnits.has(item.unit as CartUnit) ||
    !isPositiveSafeInteger(item.quantityMilli) ||
    !isPositiveSafeInteger(item.minimumQuantityMilli) ||
    !isPositiveSafeInteger(item.quantityStepMilli)
  ) {
    return null;
  }

  const cartItem: CartItem = {
    productId: item.productId,
    name: item.name,
    unitPriceCents: item.unitPriceCents,
    currencyCode: item.currencyCode,
    unit: item.unit as CartUnit,
    unitLabel: typeof item.unitLabel === "string" ? item.unitLabel : null,
    quantityMilli: item.quantityMilli,
    minimumQuantityMilli: item.minimumQuantityMilli,
    quantityStepMilli: item.quantityStepMilli,
    photo: asPhoto(item.photo),
  };

  return { ...cartItem, quantityMilli: normalizeQuantityMilli(cartItem.quantityMilli, cartItem) };
}

export function loadCart(): CartItem[] {
  try {
    const rawCart = window.localStorage.getItem(storageKey);
    if (!rawCart) return [];

    const cart = JSON.parse(rawCart) as Partial<StoredCart>;
    if (cart.version !== 1 || !Array.isArray(cart.items)) return [];

    return cart.items.map(asCartItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  try {
    const cart: StoredCart = { version: 1, items };
    window.localStorage.setItem(storageKey, JSON.stringify(cart));
  } catch {
    // Local storage can be unavailable or full. The in-memory cart remains usable.
  }
}
