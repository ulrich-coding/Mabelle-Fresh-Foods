"use client";

import Link from "next/link";

import { StorefrontProductImage } from "@/features/storefront/components/storefront-product-image";
import { formatProductUnit } from "@/features/storefront/lib/formatting";

import { useCart } from "../cart-provider";
import { calculateLineSubtotalCents, formatCurrencyCents, formatQuantityMilli } from "../lib/calculations";
import { QuantityControl } from "./quantity-control";

export function CartPageContent() {
  const { isHydrated, items, removeItem, totalCents } = useCart();

  if (!isHydrated) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-stone-600">Chargement du panier…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Panier</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Votre panier est vide</h1>
        <p className="mt-4 text-stone-700">Ajoutez des produits du catalogue pour préparer votre commande.</p>
        <Link className="mt-7 inline-flex rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900" href="/products">
          Retourner au catalogue
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Panier</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Votre commande</h1>
      <p className="mt-4 max-w-2xl leading-7 text-stone-700">
        Les prix et disponibilités seront confirmés et recalculés lors de la prochaine étape de commande.
      </p>

      <div className="mt-9 space-y-4">
        {items.map((item) => {
          const lineTotal = calculateLineSubtotalCents(item);
          return (
            <article className="grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-[7rem_1fr_auto] sm:items-center" key={item.productId}>
              <StorefrontProductImage
                alt={item.photo?.altText ?? `Photo de ${item.name}`}
                className="aspect-square w-full rounded-lg object-cover"
                photo={item.photo ?? undefined}
              />
              <div>
                <h2 className="text-lg font-semibold text-stone-950">{item.name}</h2>
                <p className="mt-1 text-sm text-stone-600">
                  {formatCurrencyCents(item.unitPriceCents, item.currencyCode)} / {formatProductUnit(item)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <QuantityControl item={item} key={`${item.productId}-${item.quantityMilli}`} />
                  <span className="text-sm text-stone-600">{formatQuantityMilli(item.quantityMilli)} {formatProductUnit(item)}</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                <p className="font-semibold text-stone-950">{formatCurrencyCents(lineTotal, item.currencyCode)}</p>
                <button
                  className="text-sm font-medium text-red-700 underline hover:text-red-800"
                  onClick={() => removeItem(item.productId)}
                  type="button"
                >
                  Supprimer
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 text-lg font-semibold text-stone-950">
          <span>Total</span>
          <span>{formatCurrencyCents(totalCents, "USD")}</span>
        </div>
        <Link
          className="mt-6 block w-full rounded-md bg-emerald-800 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-900"
          href="/checkout"
        >
          Continuer la commande
        </Link>
      </section>
    </main>
  );
}
