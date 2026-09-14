import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { OrderStatusForm } from "@/features/admin/components/order-status-form";
import { getAdminOrder } from "@/features/admin/server/orders";
import { requireAdmin } from "@/features/admin/server/require-admin";
import {
  fulfillmentMethodLabels,
  orderStatusLabels,
} from "@/features/admin/types/orders";

type AdminOrderPageProps = {
  params: Promise<{ orderId: string }>;
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

function formatUnit(unit: string, unitLabel: string | null) {
  if (unit === "kilogram") return "kg";
  if (unit === "piece") return "pièce";
  if (unit === "dozen") return "douzaine";
  return unitLabel ?? "unité";
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  await requireAdmin();
  const { orderId } = await params;
  const order = await getAdminOrder(orderId).catch(() => undefined);

  if (order === undefined) {
    return (
      <div className="min-h-screen bg-stone-50">
        <AdminPageHeader description="Consultez les détails d’une demande." title="Commande" />
        <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
          <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
            Impossible de charger cette commande pour le moment. Réessayez dans quelques instants.
          </section>
        </main>
      </div>
    );
  }

  if (!order) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminPageHeader
        description={`Commande #${order.orderNumber} reçue le ${dateFormatter.format(new Date(order.createdAt))}.`}
        title={`Commande #${order.orderNumber}`}
      />
      <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <Link className="inline-flex text-sm font-medium text-stone-700 underline" href="/admin/orders">
          ← Toutes les commandes
        </Link>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-stone-950">Informations client</h2>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium text-stone-800">
                {orderStatusLabels[order.status]}
              </span>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-stone-500">Client</dt>
                <dd className="mt-1 font-medium text-stone-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Téléphone</dt>
                <dd className="mt-1 font-medium text-stone-900">{order.customerPhoneE164}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Mode de réception</dt>
                <dd className="mt-1 font-medium text-stone-900">{fulfillmentMethodLabels[order.fulfillmentMethod]}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Date</dt>
                <dd className="mt-1 font-medium text-stone-900">{dateFormatter.format(new Date(order.createdAt))}</dd>
              </div>
            </dl>
          </section>
          <OrderStatusForm currentStatus={order.status} orderId={order.id} />
        </div>

        {order.deliveryAddress ? (
          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">Adresse de livraison</h2>
            <div className="mt-4 text-sm leading-6 text-stone-800">
              {order.deliveryAddress.recipientName ? <p className="font-medium">{order.deliveryAddress.recipientName}</p> : null}
              {order.deliveryAddress.phoneE164 ? <p>{order.deliveryAddress.phoneE164}</p> : null}
              {order.deliveryAddress.line1 ? <p className="mt-3">{order.deliveryAddress.line1}</p> : null}
              {order.deliveryAddress.line2 ? <p>{order.deliveryAddress.line2}</p> : null}
              <p>
                {[order.deliveryAddress.city, order.deliveryAddress.stateCode, order.deliveryAddress.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.deliveryAddress.countryCode ? <p>{order.deliveryAddress.countryCode}</p> : null}
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 p-5">
            <h2 className="text-lg font-semibold text-stone-950">Produits commandés</h2>
            <p className="mt-1 text-sm text-stone-600">Les prix et libellés correspondent à l’instantané de la commande.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-100 text-stone-700">
                <tr>
                  <th className="p-4 font-medium">Produit</th>
                  <th className="p-4 font-medium">Quantité</th>
                  <th className="p-4 font-medium">Prix unitaire</th>
                  <th className="p-4 font-medium">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr className="border-b border-stone-100 last:border-0" key={item.id}>
                    <td className="p-4 font-medium text-stone-900">{item.productName}</td>
                    <td className="p-4 text-stone-700">{item.quantity} {formatUnit(item.unit, item.unitLabel)}</td>
                    <td className="p-4 text-stone-700">{formatUsd(item.unitPriceAmount)}</td>
                    <td className="p-4 font-medium text-stone-900">{formatUsd(item.lineTotalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="grid gap-3 border-t border-stone-200 p-5 text-sm sm:ml-auto sm:max-w-sm">
            <div className="flex justify-between gap-6 text-stone-700"><dt>Sous-total</dt><dd>{formatUsd(order.subtotalAmount)}</dd></div>
            <div className="flex justify-between gap-6 text-stone-700"><dt>Livraison</dt><dd>{formatUsd(order.deliveryFeeAmount)}</dd></div>
            <div className="flex justify-between gap-6 border-t border-stone-200 pt-3 text-base font-semibold text-stone-950"><dt>Total</dt><dd>{formatUsd(order.totalAmount)}</dd></div>
          </dl>
        </section>

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-950">Historique des statuts</h2>
          {order.statusHistory.length === 0 ? (
            <p className="mt-4 text-sm text-stone-700">Aucun historique disponible.</p>
          ) : (
            <ol className="mt-5 space-y-4">
              {order.statusHistory.map((entry) => (
                <li className="border-l-2 border-stone-300 pl-4 text-sm" key={entry.id}>
                  <p className="font-medium text-stone-900">
                    {entry.previousStatus ? `${orderStatusLabels[entry.previousStatus]} → ` : ""}
                    {orderStatusLabels[entry.newStatus]}
                  </p>
                  <p className="mt-1 text-stone-600">{dateFormatter.format(new Date(entry.createdAt))}</p>
                  {entry.note ? <p className="mt-1 text-stone-700">{entry.note}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
