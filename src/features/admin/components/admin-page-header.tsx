import Link from "next/link";

import { AdminSignOutButton } from "./admin-sign-out-button";

type AdminPageHeaderProps = {
  title: string;
  description: string;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link className="text-sm font-medium text-stone-600" href="/admin">
            Mabelle Fresh Foods
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-stone-900">{title}</h1>
          <p className="mt-1 text-sm text-stone-600">{description}</p>
        </div>
        <AdminSignOutButton />
      </div>
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap gap-4 px-6 pb-4 text-sm font-medium text-stone-700">
        <Link className="hover:text-stone-950" href="/admin">
          Tableau de bord
        </Link>
        <Link className="hover:text-stone-950" href="/admin/products">
          Produits
        </Link>
        <Link className="hover:text-stone-950" href="/admin/categories">
          Catégories
        </Link>
        <Link className="hover:text-stone-950" href="/admin/orders">
          Commandes
        </Link>
      </nav>
    </header>
  );
}
