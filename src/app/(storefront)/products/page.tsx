import Link from "next/link";

import { ProductCard } from "@/features/storefront/components/product-card";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";
import { getStorefrontCatalog } from "@/features/storefront/server/catalog";

type ProductsPageProps = {
  searchParams: Promise<{ category?: string | string[] }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category } = await searchParams;
  const categorySlug = typeof category === "string" ? category : undefined;
  const { categories, products, selectedCategory } = await getStorefrontCatalog(categorySlug);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <StorefrontHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Catalogue</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Nos produits</h1>
        <p className="mt-4 max-w-2xl leading-7 text-stone-700">
          Découvrez notre sélection disponible sur commande. Les modalités de livraison ou de retrait sont confirmées avec vous après la commande.
        </p>

        <nav aria-label="Filtrer par catégorie" className="mt-8 flex flex-wrap gap-2">
          <Link
            aria-current={!categorySlug ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-medium ${!categorySlug ? "bg-emerald-800 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-emerald-700"}`}
            href="/products"
          >
            Tous les produits
          </Link>
          {categories.map((item) => {
            const selected = selectedCategory?.id === item.id;
            return (
              <Link
                aria-current={selected ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium ${selected ? "bg-emerald-800 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-emerald-700"}`}
                href={`/products?category=${encodeURIComponent(item.slug)}`}
                key={item.id}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <section aria-live="polite" className="mt-10">
          {products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-700">
              Aucun produit disponible dans cette sélection pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
