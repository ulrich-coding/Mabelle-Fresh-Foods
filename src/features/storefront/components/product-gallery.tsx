import { StorefrontProductImage } from "./storefront-product-image";

import type { StorefrontProduct } from "../types/catalog";

type ProductGalleryProps = {
  product: StorefrontProduct;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  if (product.photos.length === 0) {
    return <StorefrontProductImage alt={`Photo de ${product.name}`} className="aspect-square w-full rounded-xl" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {product.photos.map((photo) => (
        <StorefrontProductImage
          alt={photo.altText ?? `Photo de ${product.name}`}
          className="aspect-square w-full rounded-xl object-cover"
          key={photo.id}
          photo={photo}
        />
      ))}
    </div>
  );
}
