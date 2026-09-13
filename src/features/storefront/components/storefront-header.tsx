"use client";

import Link from "next/link";

import { useCart } from "@/features/cart/cart-provider";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/products", label: "Produits" },
];

export function StorefrontHeader() {
  const { itemCount, isHydrated } = useCart();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:gap-6 sm:px-6">
        <Link className="shrink-0 text-sm font-semibold tracking-tight text-stone-950 sm:text-base" href="/">
          Mabelle Fresh Foods
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-3 text-sm font-medium text-stone-700 sm:gap-5">
          {links.map((link) => (
            <Link className="transition hover:text-emerald-800" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
          <Link className="transition hover:text-emerald-800" href="/cart">
            Panier{isHydrated && itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
