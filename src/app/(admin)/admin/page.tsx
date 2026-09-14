import Link from "next/link";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { getAdminOrderDashboardStats } from "@/features/admin/server/orders";
import { requireAdmin } from "@/features/admin/server/require-admin";

export default async function AdminPage() {
  await requireAdmin();
  let orderStats: Awaited<ReturnType<typeof getAdminOrderDashboardStats>> | null = null;

  try {
    orderStats = await getAdminOrderDashboardStats();
  } catch {
    orderStats = null;
  }

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
          <Link className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-400" href="/admin/orders">
            <h2 className="text-lg font-semibold text-stone-900">Commandes</h2>
            <p className="mt-2 text-sm text-stone-600">Consulter les demandes et suivre leur préparation.</p>
          </Link>
        </div>

        {orderStats ? (
          <section className="mt-8" aria-label="Indicateurs des commandes">
            <h2 className="text-lg font-semibold text-stone-900">Aperçu des commandes</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-600">Reçues</p><p className="mt-2 text-2xl font-semibold text-stone-950">{orderStats.submitted}</p></article>
              <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-600">En préparation</p><p className="mt-2 text-2xl font-semibold text-stone-950">{orderStats.preparing}</p></article>
              <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm"><p className="text-sm text-stone-600">Terminées</p><p className="mt-2 text-2xl font-semibold text-stone-950">{orderStats.completed}</p></article>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
