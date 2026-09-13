import Link from "next/link";

import { StorefrontHeader } from "@/features/storefront/components/storefront-header";

export default function StorefrontPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <StorefrontHeader />
      <main>
        <section className="border-b border-amber-100 bg-gradient-to-br from-amber-50 via-stone-50 to-emerald-50">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-28">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">Mabelle Fresh Foods</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
                Viandes • Abats • Œufs frais — Sur commande
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
                Des produits bio sélectionnés avec soin, préparés sur commande pour votre table.
              </p>
              <Link
                className="mt-8 inline-flex rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
                href="/products"
              >
                Voir les produits
              </Link>
            </div>
            <aside className="rounded-2xl border border-amber-100 bg-white/80 p-7 shadow-sm backdrop-blur">
              <p className="text-sm font-semibold text-emerald-800">Notre sélection</p>
              <ul className="mt-5 space-y-4 text-stone-700">
                <li>Produits bio sur commande</li>
                <li>Viandes bio et abats</li>
                <li>Œufs frais</li>
                <li>Livraison ou retrait selon votre commande</li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Simple et attentif</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">Commandez en toute simplicité.</h2>
            <p className="mt-4 leading-7 text-stone-700">
              Les disponibilités et les modalités de livraison sont confirmées avec vous après votre commande.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
