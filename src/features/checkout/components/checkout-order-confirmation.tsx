"use client";

import Link from "next/link";

import { formatCurrencyCents, formatQuantityMilli } from "@/features/cart/lib/calculations";

import type { CheckoutOrderSuccess, ValidatedCheckoutItem } from "../types/checkout";

function formatUnit(item: Pick<ValidatedCheckoutItem, "unit" | "unitLabel">) {
  if (item.unit === "kilogram") return "kg";
  if (item.unit === "piece") return "pièce";
  if (item.unit === "dozen") return "douzaine";
  return item.unitLabel ?? "unité";
}

export function CheckoutOrderConfirmation({ order }: { order: CheckoutOrderSuccess }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-stone-900 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Commande enregistrée</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Merci, votre commande est enregistrée.</h1>
        <p className="mt-4 text-stone-700">Référence de commande : <strong>#{order.orderNumber}</strong></p>

        <div className="mt-6 space-y-3 border-y border-emerald-200 py-5 text-sm">
          {order.items.map((item) => (
            <div className="flex items-start justify-between gap-4" key={item.productId}>
              <p>
                <span className="block font-medium">{item.name}</span>
                <span className="text-stone-700">{formatQuantityMilli(item.quantityMilli)} {formatUnit(item)} × {formatCurrencyCents(item.unitPriceCents, item.currencyCode)}</span>
              </p>
              <p className="shrink-0 font-semibold">{formatCurrencyCents(item.lineTotalCents, item.currencyCode)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3 text-base font-semibold">
            <span>Total</span>
            <span>{formatCurrencyCents(order.totalCents, order.currencyCode)}</span>
          </div>
        </div>

        <p className="mt-5 text-sm leading-6 text-stone-700">
          La disponibilité finale et, pour une livraison, les frais et la date seront confirmés par Mabelle.
        </p>

        <a
          className="mt-6 inline-flex w-full justify-center rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900"
          href={order.whatsappUrl}
          rel="noreferrer"
          target="_blank"
        >
          Ouvrir WhatsApp pour envoyer le récapitulatif
        </a>
        <Link className="mt-4 inline-flex text-sm font-medium text-emerald-800 underline" href="/products">
          Retourner au catalogue
        </Link>
      </section>
    </main>
  );
}
