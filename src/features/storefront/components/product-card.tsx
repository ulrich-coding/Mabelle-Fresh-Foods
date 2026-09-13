import Link from "next/link";

import { AddToCartButton } from "@/features/cart/components/add-to-cart-button";

import { formatProductPrice } from "../lib/formatting";
import type { StorefrontProduct } from "../types/catalog";
import { StorefrontProductImage } from "./storefront-product-image";

type ProductCardProps = {
  product: StorefrontProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  const primaryPhoto = product.photos.find((photo) => photo.isPrimary) ?? product.photos[0];

  return (
    <article className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link aria-label={`Voir ${product.name}`} className="block" href={`/products/${product.id}`}>
        <StorefrontProductImage
          alt={primaryPhoto?.altText ?? `Photo de ${product.name}`}
          className="aspect-[4/3] w-full object-cover"
          photo={primaryPhoto}
        />
        <div className="p-5">
          <p className="text-sm font-medium text-emerald-800">{product.category.name}</p>
          <h2 className="mt-1 text-lg font-semibold text-stone-950">{product.name}</h2>
          <p className="mt-3 text-base font-semibold text-stone-900">{formatProductPrice(product)}</p>
        </div>
      </Link>
      <div className="border-t border-stone-100 px-5 py-4">
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
