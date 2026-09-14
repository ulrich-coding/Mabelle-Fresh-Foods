import { decimalToMilli, isWholeUnit, moneyToCents, quantityScale } from "@/features/cart/lib/calculations";
import type { CartUnit } from "@/features/cart/types/cart";

import {
  fulfillmentMethods,
  type CheckoutCartItemInput,
  type CheckoutFormInput,
  type CheckoutValidationFailure,
  type FulfillmentMethod,
} from "../types/checkout";

const usPostalCodePattern = /^\d{5}(?:-\d{4})?$/;
const usStatePattern = /^[A-Za-z]{2}$/;
const e164UsPattern = /^\+1\d{10}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type NormalizedCheckoutForm = {
  fullName: string;
  phoneE164: string;
  fulfillmentMethod: FulfillmentMethod;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    countryCode: "US";
  } | null;
};

export type CheckoutProductForValidation = {
  id: string;
  name: string;
  priceAmount: string;
  currencyCode: string;
  unit: CartUnit;
  unitLabel: string | null;
  minimumOrderQuantity: string;
  quantityStep: string;
};

function trimAndCollapse(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function fieldFailure(
  message: string,
  fieldErrors: CheckoutValidationFailure["fieldErrors"],
): CheckoutValidationFailure {
  return { success: false, message, fieldErrors };
}

export function normalizeUsPhone(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const candidate = compact.startsWith("+") ? compact : compact.length === 10 ? `+1${compact}` : `+${compact}`;

  return e164UsPattern.test(candidate) ? candidate : null;
}

export function validateCheckoutForm(value: unknown): NormalizedCheckoutForm | CheckoutValidationFailure {
  if (!value || typeof value !== "object") {
    return { success: false, message: "Les informations client sont invalides." };
  }

  const input = value as Partial<CheckoutFormInput>;
  const fullName = typeof input.fullName === "string" ? trimAndCollapse(input.fullName) : "";
  if (fullName.length < 2 || fullName.length > 150) {
    return fieldFailure("Indiquez votre nom complet.", { fullName: "Saisissez un nom entre 2 et 150 caractères." });
  }

  const phoneE164 = typeof input.phone === "string" ? normalizeUsPhone(input.phone) : null;
  if (!phoneE164) {
    return fieldFailure("Le numéro de téléphone est invalide.", { phone: "Utilisez un numéro américain valide, par exemple (212) 555-0123." });
  }

  if (!fulfillmentMethods.includes(input.fulfillmentMethod as FulfillmentMethod)) {
    return fieldFailure("Choisissez la livraison ou le retrait.", { fulfillmentMethod: "Sélectionnez un mode de récupération." });
  }

  const fulfillmentMethod = input.fulfillmentMethod as FulfillmentMethod;
  if (fulfillmentMethod === "pickup") {
    return { fullName, phoneE164, fulfillmentMethod, address: null };
  }

  const address = input.address;
  if (!address || typeof address !== "object") {
    return fieldFailure("L’adresse de livraison est obligatoire.", { address: "Renseignez votre adresse de livraison." });
  }

  const line1 = typeof address.line1 === "string" ? trimAndCollapse(address.line1) : "";
  const line2 = typeof address.line2 === "string" ? trimAndCollapse(address.line2) : "";
  const city = typeof address.city === "string" ? trimAndCollapse(address.city) : "";
  const state = typeof address.state === "string" ? address.state.trim().toUpperCase() : "";
  const postalCode = typeof address.postalCode === "string" ? address.postalCode.trim() : "";

  if (!line1 || line1.length > 160 || !city || city.length > 100 || !usStatePattern.test(state) || !usPostalCodePattern.test(postalCode)) {
    return fieldFailure("L’adresse de livraison est incomplète ou invalide.", {
      address: "Indiquez une adresse, une ville, un État à deux lettres et un code postal américain valide.",
    });
  }

  if (line2.length > 160) {
    return fieldFailure("Le complément d’adresse est trop long.", { address: "Le complément d’adresse ne peut pas dépasser 160 caractères." });
  }

  return {
    fullName,
    phoneE164,
    fulfillmentMethod,
    address: { line1, line2: line2 || null, city, state, postalCode, countryCode: "US" },
  };
}

export function parseCheckoutCartItems(value: unknown): CheckoutCartItemInput[] | CheckoutValidationFailure {
  if (!Array.isArray(value) || value.length === 0) {
    return { success: false, message: "Votre panier est vide.", cartErrors: ["Ajoutez un produit avant de continuer."] };
  }

  if (value.length > 50) {
    return { success: false, message: "Votre panier contient trop d’articles pour être vérifié." };
  }

  const productIds = new Set<string>();
  const items: CheckoutCartItemInput[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { success: false, message: "Le contenu du panier est invalide." };
    }

    const candidate = item as Partial<CheckoutCartItemInput>;
    if (typeof candidate.productId !== "string" || !uuidPattern.test(candidate.productId) || productIds.has(candidate.productId)) {
      return { success: false, message: "Le contenu du panier est invalide." };
    }

    productIds.add(candidate.productId);
    items.push({ productId: candidate.productId, quantityMilli: candidate.quantityMilli as number });
  }

  return items;
}

export function validateQuantityForProduct(
  quantityMilli: unknown,
  product: CheckoutProductForValidation,
): string | null {
  if (typeof quantityMilli !== "number" || !Number.isSafeInteger(quantityMilli) || quantityMilli <= 0 || quantityMilli > 999_999_999_999) {
    return "La quantité demandée est invalide.";
  }

  const minimumQuantityMilli = decimalToMilli(product.minimumOrderQuantity);
  const quantityStepMilli = decimalToMilli(product.quantityStep);
  if (!minimumQuantityMilli || !quantityStepMilli) {
    return "Les règles de quantité de ce produit sont indisponibles.";
  }

  if (isWholeUnit(product.unit) && (quantityMilli % quantityScale !== 0 || minimumQuantityMilli % quantityScale !== 0 || quantityStepMilli % quantityScale !== 0)) {
    return "Ce produit doit être commandé en nombre entier.";
  }

  if (quantityMilli < minimumQuantityMilli) {
    return "La quantité est inférieure au minimum autorisé pour ce produit.";
  }

  if ((quantityMilli - minimumQuantityMilli) % quantityStepMilli !== 0) {
    return "La quantité ne respecte pas le pas de commande actuel de ce produit.";
  }

  return null;
}

export function getValidatedProductAmounts(product: CheckoutProductForValidation) {
  const unitPriceCents = moneyToCents(product.priceAmount);
  const minimumQuantityMilli = decimalToMilli(product.minimumOrderQuantity);
  const quantityStepMilli = decimalToMilli(product.quantityStep);

  if (unitPriceCents === null || !minimumQuantityMilli || !quantityStepMilli || product.currencyCode !== "USD") {
    return null;
  }

  return { unitPriceCents, minimumQuantityMilli, quantityStepMilli };
}

export function calculateValidatedLineTotalCents(unitPriceCents: number, quantityMilli: number): number | null {
  const total = (BigInt(unitPriceCents) * BigInt(quantityMilli) + BigInt(500)) / BigInt(quantityScale);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) return null;
  return Number(total);
}
