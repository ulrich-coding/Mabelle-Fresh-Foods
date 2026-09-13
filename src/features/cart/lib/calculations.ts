import type { CartItem, CartUnit } from "../types/cart";

export const quantityScale = 1000;

const decimalPattern = /^\d+(?:[.,]\d{1,3})?$/;
const moneyPattern = /^\d+(?:\.\d{1,2})?$/;

export function decimalToMilli(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!decimalPattern.test(normalized)) return null;

  const [whole, decimal = ""] = normalized.split(".");
  const milli = Number(whole) * quantityScale + Number(decimal.padEnd(3, "0"));
  return Number.isSafeInteger(milli) && milli > 0 ? milli : null;
}

export function moneyToCents(value: string): number | null {
  if (!moneyPattern.test(value)) return null;

  const [whole, decimal = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : null;
}

export function formatQuantityMilli(quantityMilli: number): string {
  const whole = Math.floor(quantityMilli / quantityScale);
  const fraction = String(quantityMilli % quantityScale).padStart(3, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export function isWholeUnit(unit: CartUnit) {
  return unit === "piece" || unit === "dozen";
}

export function normalizeQuantityMilli(quantityMilli: number, item: Pick<CartItem, "unit" | "minimumQuantityMilli" | "quantityStepMilli">): number {
  const minimum = isWholeUnit(item.unit)
    ? Math.max(quantityScale, Math.ceil(item.minimumQuantityMilli / quantityScale) * quantityScale)
    : Math.max(1, item.minimumQuantityMilli);
  const step = isWholeUnit(item.unit) ? quantityScale : Math.max(1, item.quantityStepMilli);
  const candidate = Math.max(quantityMilli, minimum);
  return minimum + Math.round((candidate - minimum) / step) * step;
}

export function parseQuantityMilli(value: string, item: Pick<CartItem, "unit" | "minimumQuantityMilli" | "quantityStepMilli">): number | null {
  const quantityMilli = decimalToMilli(value);
  if (!quantityMilli) return null;
  if (isWholeUnit(item.unit) && quantityMilli % quantityScale !== 0) return null;
  return normalizeQuantityMilli(quantityMilli, item);
}

export function calculateLineSubtotalCents(item: Pick<CartItem, "unitPriceCents" | "quantityMilli">) {
  return Math.round((item.unitPriceCents * item.quantityMilli) / quantityScale);
}

export function calculateCartTotalCents(items: CartItem[]) {
  return items.reduce((total, item) => total + calculateLineSubtotalCents(item), 0);
}

export function formatCurrencyCents(cents: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
