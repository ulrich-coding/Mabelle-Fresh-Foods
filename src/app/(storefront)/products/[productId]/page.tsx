import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";
import { ProductGallery } from "@/features/storefront/components/product-gallery";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";
import { formatProductPrice, formatProductUnit } from "@/features/storefront/lib/formatting";
import { getVisibleProduct } from "@/features/storefront/server/catalog";

type ProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { productId } = await params;
  const product = await getVisibleProduct(productId);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <StorefrontHeader />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <Link className="text-sm font-medium text-emerald-800 underline" href="/products">
          Retour aux produits
        </Link>
        <div className="mt-7 grid gap-10 lg:grid-cols-2 lg:items-start">
          <ProductGallery product={product} />
          <section>
            <p className="text-sm font-semibold text-emerald-800">{product.category.name}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-stone-950">{product.name}</h1>
            <p className="mt-5 text-xl font-semibold text-stone-900">{formatProductPrice(product)}</p>
            <div className="mt-6">
              <AddToCartButton product={product} />
            </div>
            <dl className="mt-8 grid gap-4 border-y border-stone-200 py-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-stone-600">Unité de vente</dt>
                <dd className="font-medium text-stone-900">{formatProductUnit(product)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-stone-600">Disponibilité</dt>
                <dd className="font-medium text-emerald-800">Disponible sur commande</dd>
              </div>
            </dl>
            {product.description ? <p className="mt-8 whitespace-pre-line leading-7 text-stone-700">{product.description}</p> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
