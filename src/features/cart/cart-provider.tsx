"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { StorefrontProduct } from "@/features/storefront/types/catalog";

import {
  calculateCartTotalCents,
  decimalToMilli,
  moneyToCents,
  normalizeQuantityMilli,
} from "./lib/calculations";
import { loadCart, saveCart } from "./lib/storage";
import type { CartItem } from "./types/cart";

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  totalCents: number;
  isHydrated: boolean;
  addProduct: (product: StorefrontProduct) => void;
  setQuantity: (productId: string, quantityMilli: number) => void;
  adjustQuantity: (productId: string, direction: "increase" | "decrease") => void;
  removeItem: (productId: string) => void;
  replaceItems: (items: CartItem[]) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function toCartItem(product: StorefrontProduct): CartItem | null {
  const unitPriceCents = moneyToCents(product.priceAmount);
  const minimumQuantityMilli = decimalToMilli(product.minimumOrderQuantity);
  const quantityStepMilli = decimalToMilli(product.quantityStep);
  if (unitPriceCents === null || minimumQuantityMilli === null || quantityStepMilli === null) return null;

  const primaryPhoto = product.photos.find((photo) => photo.isPrimary) ?? product.photos[0] ?? null;
  const item: CartItem = {
    productId: product.id,
    name: product.name,
    unitPriceCents,
    currencyCode: product.currencyCode,
    unit: product.unit,
    unitLabel: product.unitLabel,
    quantityMilli: minimumQuantityMilli,
    minimumQuantityMilli,
    quantityStepMilli,
    photo: primaryPhoto,
  };

  return { ...item, quantityMilli: normalizeQuantityMilli(item.quantityMilli, item) };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(loadCart());
      setIsHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (isHydrated) saveCart(items);
  }, [isHydrated, items]);

  const addProduct = useCallback((product: StorefrontProduct) => {
    if (!product.isActive || !product.isAvailable) return;
    const item = toCartItem(product);
    if (!item) return;

    setItems((currentItems) => {
      const existingItem = currentItems.find((currentItem) => currentItem.productId === item.productId);
      if (!existingItem) return [...currentItems, item];

      const updatedItem = {
        ...item,
        quantityMilli: normalizeQuantityMilli(existingItem.quantityMilli + item.quantityMilli, item),
      };
      return currentItems.map((currentItem) => currentItem.productId === item.productId ? updatedItem : currentItem);
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantityMilli: number) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.productId === productId
        ? { ...item, quantityMilli: normalizeQuantityMilli(quantityMilli, item) }
        : item
    )));
  }, []);

  const adjustQuantity = useCallback((productId: string, direction: "increase" | "decrease") => {
    setItems((currentItems) => currentItems.map((item) => {
      if (item.productId !== productId) return item;

      const offset = direction === "increase" ? item.quantityStepMilli : -item.quantityStepMilli;
      return { ...item, quantityMilli: normalizeQuantityMilli(item.quantityMilli + offset, item) };
    }));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.productId !== productId));
  }, []);

  const replaceItems = useCallback((nextItems: CartItem[]) => {
    setItems(nextItems);
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.length,
    totalCents: calculateCartTotalCents(items),
    isHydrated,
    addProduct,
    setQuantity,
    adjustQuantity,
    removeItem,
    replaceItems,
  }), [addProduct, adjustQuantity, isHydrated, items, removeItem, replaceItems, setQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart doit être utilisé dans CartProvider.");
  return context;
}
