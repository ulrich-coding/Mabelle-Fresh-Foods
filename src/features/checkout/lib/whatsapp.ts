import { formatCurrencyCents, formatQuantityMilli } from "@/features/cart/lib/calculations";
import type { CartUnit } from "@/features/cart/types/cart";

import type { FulfillmentMethod, ValidatedCheckoutItem } from "../types/checkout";

const whatsappBusinessNumber = "17034739777";

type WhatsAppOrderDetails = {
  orderNumber: string;
  customerName: string;
  customerPhoneE164: string;
  fulfillmentMethod: FulfillmentMethod;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    countryCode: "US";
  } | null;
  items: ValidatedCheckoutItem[];
  totalCents: number;
  currencyCode: "USD";
};

function formatUnit(item: Pick<ValidatedCheckoutItem, "unit" | "unitLabel">) {
  const labels: Record<Exclude<CartUnit, "other">, string> = {
    kilogram: "kg",
    piece: "pièce",
    dozen: "douzaine",
  };

  return item.unit === "other" ? item.unitLabel ?? "unité" : labels[item.unit];
}

function formatFulfillmentMethod(method: FulfillmentMethod) {
  return method === "delivery" ? "Livraison" : "Retrait sur place";
}

export function buildWhatsAppOrderUrl(order: WhatsAppOrderDetails) {
  const lines = [
    "Nouvelle commande Mabelle Fresh Foods",
    `Référence : #${order.orderNumber}`,
    "",
    `Client : ${order.customerName}`,
    `Téléphone : ${order.customerPhoneE164}`,
    `Mode : ${formatFulfillmentMethod(order.fulfillmentMethod)}`,
  ];

  if (order.address) {
    lines.push(
      "",
      "Adresse de livraison :",
      order.address.line1,
      ...(order.address.line2 ? [order.address.line2] : []),
      `${order.address.city}, ${order.address.state} ${order.address.postalCode}`,
      "États-Unis",
    );
  }

  lines.push("", "Produits :");
  order.items.forEach((item) => {
    lines.push(
      `- ${item.name} — ${formatQuantityMilli(item.quantityMilli)} ${formatUnit(item)} × ${formatCurrencyCents(item.unitPriceCents, item.currencyCode)} = ${formatCurrencyCents(item.lineTotalCents, item.currencyCode)}`,
    );
  });

  lines.push(
    "",
    `Total : ${formatCurrencyCents(order.totalCents, order.currencyCode)}`,
    "",
    "La disponibilité finale et, pour une livraison, les frais et la date seront confirmés par Mabelle.",
  );

  return `https://wa.me/${whatsappBusinessNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}
