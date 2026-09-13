"use client";

import { useState } from "react";

import type { StorefrontProduct } from "@/features/storefront/types/catalog";

import { useCart } from "../cart-provider";

type AddToCartButtonProps = {
  product: StorefrontProduct;
};

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addProduct } = useCart();
  const [hasAdded, setHasAdded] = useState(false);
  const canAdd = product.isActive && product.isAvailable;

  function handleAddToCart() {
    if (!canAdd) return;
    addProduct(product);
    setHasAdded(true);
  }

  return (
    <div>
      <button
        className="w-full rounded-md bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={!canAdd}
        onClick={handleAddToCart}
        type="button"
      >
        {canAdd ? "Ajouter au panier" : "Indisponible"}
      </button>
      {hasAdded ? <p aria-live="polite" className="mt-2 text-center text-sm text-emerald-800">Ajouté au panier.</p> : null}
    </div>
  );
}
