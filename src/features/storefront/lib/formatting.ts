import type { StorefrontProduct } from "../types/catalog";

const unitLabels: Record<Exclude<StorefrontProduct["unit"], "other">, string> = {
  kilogram: "kg",
  piece: "pièce",
  dozen: "douzaine",
};

export function formatProductUnit(product: Pick<StorefrontProduct, "unit" | "unitLabel">) {
  return product.unit === "other" ? product.unitLabel ?? "unité" : unitLabels[product.unit];
}

export function formatProductPrice(product: Pick<StorefrontProduct, "priceAmount" | "currencyCode" | "unit" | "unitLabel">) {
  const amount = Number(product.priceAmount);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

  return `${formattedAmount} / ${formatProductUnit(product)}`;
}
