"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { changeOrderStatusAction } from "../server/order-actions";
import {
  orderStatusLabels,
  orderStatuses,
  type OrderStatus,
} from "../types/orders";

export function OrderStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [message, setMessage] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    startTransition(async () => {
      const result = await changeOrderStatusAction(orderId, status);
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <form className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={submit}>
      <h2 className="text-lg font-semibold text-stone-950">Mettre à jour le statut</h2>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-medium text-stone-800">
          Nouveau statut
          <select
            className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-normal"
            disabled={isPending}
            onChange={(event) => setStatus(event.target.value as OrderStatus)}
            value={status}
          >
            {orderStatuses.map((option) => (
              <option key={option} value={option}>
                {orderStatusLabels[option]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Mise à jour…" : "Enregistrer le statut"}
        </button>
      </div>
      {message ? (
        <p aria-live="polite" className="mt-3 text-sm text-stone-700">
          {message}
        </p>
      ) : null}
    </form>
  );
}
