"use client";

import { useState } from "react";

import { formatQuantityMilli, parseQuantityMilli } from "../lib/calculations";
import type { CartItem } from "../types/cart";
import { useCart } from "../cart-provider";

type QuantityControlProps = {
  item: CartItem;
};

export function QuantityControl({ item }: QuantityControlProps) {
  const { adjustQuantity, setQuantity } = useCart();
  const [rawQuantity, setRawQuantity] = useState(formatQuantityMilli(item.quantityMilli));

  function commitQuantity() {
    const quantityMilli = parseQuantityMilli(rawQuantity, item);
    if (quantityMilli === null) {
      setRawQuantity(formatQuantityMilli(item.quantityMilli));
      return;
    }

    setQuantity(item.productId, quantityMilli);
  }

  return (
    <div className="flex items-center rounded-md border border-stone-300 bg-white">
      <button
        aria-label={`Diminuer la quantité de ${item.name}`}
        className="px-3 py-2 text-lg text-stone-700 hover:bg-stone-100"
        onClick={() => adjustQuantity(item.productId, "decrease")}
        type="button"
      >
        −
      </button>
      <input
        aria-label={`Quantité de ${item.name}`}
        className="w-20 border-x border-stone-200 bg-white px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-emerald-700"
        inputMode="decimal"
        onBlur={commitQuantity}
        onChange={(event) => setRawQuantity(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        pattern="[0-9]*[.,]?[0-9]{0,3}"
        value={rawQuantity}
      />
      <button
        aria-label={`Augmenter la quantité de ${item.name}`}
        className="px-3 py-2 text-lg text-stone-700 hover:bg-stone-100"
        onClick={() => adjustQuantity(item.productId, "increase")}
        type="button"
      >
        +
      </button>
    </div>
  );
}
