import Link from "next/link";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { requireAdmin } from "@/features/admin/server/require-admin";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminPageHeader
        description="Gérez simplement le catalogue Mabelle Fresh Foods."
        title="Administration"
      />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-5 md:grid-cols-3">
          <Link className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400" href="/admin/products">
            <h2 className="text-lg font-semibold text-stone-900">Produits</h2>
            <p className="mt-2 text-sm text-stone-600">Créer, modifier et rendre les produits disponibles.</p>
          </Link>
          <Link className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400" href="/admin/categories">
            <h2 className="text-lg font-semibold text-stone-900">Catégories</h2>
            <p className="mt-2 text-sm text-stone-600">Organiser le catalogue et gérer leur visibilité.</p>
          </Link>
          <article className="rounded-lg border border-dashed border-stone-300 bg-stone-100 p-5">
            <h2 className="text-lg font-semibold text-stone-700">Commandes</h2>
            <p className="mt-2 text-sm text-stone-600">Bientôt disponible.</p>
          </article>
        </div>
      </main>
    </div>
  );
}
