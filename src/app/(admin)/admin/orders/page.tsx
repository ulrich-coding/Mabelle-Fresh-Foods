import Link from "next/link";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { getAdminOrderPage } from "@/features/admin/server/orders";
import { requireAdmin } from "@/features/admin/server/require-admin";
import {
  fulfillmentMethodLabels,
  isOrderStatus,
  orderStatusLabels,
  orderStatuses,
} from "@/features/admin/types/orders";

type AdminOrdersPageProps = {
  searchParams: Promise<{ page?: string | string[]; status?: string | string[] }>;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatUsd(value: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  await requireAdmin();
  const query = await searchParams;
  const statusValue = getSingleValue(query.status);
  const status = isOrderStatus(statusValue) ? statusValue : undefined;
  const pageValue = Number(getSingleValue(query.page));
  const requestedPage = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  const ordersPage = await getAdminOrderPage({ page: requestedPage, status }).catch(
    () => null,
  );

  if (!ordersPage) {
    return (
      <div className="min-h-screen bg-stone-50">
        <AdminPageHeader description="Suivez les demandes reçues." title="Commandes" />
        <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
            Impossible de charger les commandes pour le moment. Réessayez dans quelques instants.
          </section>
        </main>
      </div>
    );
  }

  const hasPreviousPage = ordersPage.page > 1;
  const hasNextPage = ordersPage.page * ordersPage.pageSize < ordersPage.totalCount;
  const queryForPage = (nextPage: number) => {
    const params = new URLSearchParams({ page: String(nextPage) });
    if (status) params.set("status", status);
    return `/admin/orders?${params.toString()}`;
  };

  return (
      <div className="min-h-screen bg-stone-50">
        <AdminPageHeader
          description="Consultez les demandes reçues et suivez leur préparation."
          title="Commandes"
        />
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-stone-600">
                {ordersPage.totalCount} commande{ordersPage.totalCount > 1 ? "s" : ""}
              </p>
            </div>
            <form action="/admin/orders" className="flex items-end gap-2">
              <label className="text-sm font-medium text-stone-800">
                Statut
                <select
                  className="mt-1 rounded-md border border-stone-300 bg-white px-3 py-2 font-normal"
                  defaultValue={status ?? ""}
                  name="status"
                >
                  <option value="">Tous les statuts</option>
                  {orderStatuses.map((option) => (
                    <option key={option} value={option}>
                      {orderStatusLabels[option]}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white" type="submit">
                Filtrer
              </button>
              {status ? (
                <Link className="pb-2 text-sm font-medium text-stone-700 underline" href="/admin/orders">
                  Réinitialiser
                </Link>
              ) : null}
            </form>
          </div>

          {ordersPage.orders.length === 0 ? (
            <section className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
              <p className="text-stone-700">Aucune commande ne correspond à cette sélection.</p>
            </section>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-100 text-stone-700">
                    <tr>
                      <th className="p-4 font-medium">Référence</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Client</th>
                      <th className="p-4 font-medium">Réception</th>
                      <th className="p-4 font-medium">Statut</th>
                      <th className="p-4 font-medium">Total</th>
                      <th className="p-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {ordersPage.orders.map((order) => (
                      <tr className="border-b border-stone-100 last:border-0" key={order.id}>
                        <td className="p-4 font-semibold text-stone-900">#{order.orderNumber}</td>
                        <td className="p-4 text-stone-700">{dateFormatter.format(new Date(order.createdAt))}</td>
                        <td className="p-4 text-stone-700">
                          <span className="block font-medium text-stone-900">{order.customerName}</span>
                          <span>{order.customerPhoneE164}</span>
                        </td>
                        <td className="p-4 text-stone-700">{fulfillmentMethodLabels[order.fulfillmentMethod]}</td>
                        <td className="p-4 text-stone-700">{orderStatusLabels[order.status]}</td>
                        <td className="p-4 font-medium text-stone-900">{formatUsd(order.totalAmount)}</td>
                        <td className="p-4 text-right">
                          <Link className="font-medium text-stone-900 underline" href={`/admin/orders/${order.id}`}>
                            Voir le détail
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hasPreviousPage || hasNextPage ? (
                <nav aria-label="Pagination des commandes" className="mt-5 flex items-center justify-between gap-4 text-sm">
                  {hasPreviousPage ? (
                    <Link className="rounded-md border border-stone-300 px-3 py-2 font-medium text-stone-800" href={queryForPage(ordersPage.page - 1)}>
                      Précédent
                    </Link>
                  ) : <span />}
                  <p className="text-stone-600">Page {ordersPage.page}</p>
                  {hasNextPage ? (
                    <Link className="rounded-md border border-stone-300 px-3 py-2 font-medium text-stone-800" href={queryForPage(ordersPage.page + 1)}>
                      Suivant
                    </Link>
                  ) : <span />}
                </nav>
              ) : null}
            </>
          )}
        </main>
      </div>
  );
}
