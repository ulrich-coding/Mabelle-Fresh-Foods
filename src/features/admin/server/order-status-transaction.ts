import "server-only";

import postgres from "postgres";

import { getRequiredSupabaseDatabaseUrl } from "@/lib/supabase/config";

import {
  isOrderStatus,
  type OrderStatus,
  type OrderStatusActionResult,
} from "../types/orders";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderStatusRow = {
  status: OrderStatus;
};

function failure(message: string): OrderStatusActionResult {
  return { success: false, message };
}

function getDatabaseErrorDetails(error: unknown) {
  return {
    code: error && typeof error === "object" && "code" in error ? String(error.code) : null,
    type: error instanceof Error ? error.name : typeof error,
  };
}

async function updateStatusInTransaction(
  transaction: postgres.Sql,
  orderId: string,
  nextStatus: OrderStatus,
  adminUserId: string,
): Promise<OrderStatusActionResult> {
  const claims = JSON.stringify({ role: "authenticated", sub: adminUserId });

  await transaction.unsafe("set local role authenticated");
  await transaction.unsafe(
    "select set_config('request.jwt.claims', $1, true)",
    [claims],
  );

  const [authorization] = await transaction.unsafe<{ is_admin: boolean }[]>(
    "select private.is_admin() as is_admin",
  );

  if (!authorization?.is_admin) {
    return failure("Votre session administrateur n’est plus autorisée.");
  }

  const [order] = await transaction.unsafe<OrderStatusRow[]>(
    "select status from public.orders where id = $1 for update",
    [orderId],
  );

  if (!order) {
    return failure("Commande introuvable.");
  }

  if (order.status === nextStatus) {
    return { success: true, message: "Le statut de cette commande est déjà à jour." };
  }

  await transaction.unsafe(
    "update public.orders set status = $1 where id = $2",
    [nextStatus, orderId],
  );
  await transaction.unsafe(
    `insert into public.order_status_history (
      order_id, previous_status, new_status, changed_by_user_id, note
    ) values ($1, $2, $3, $4, $5)`,
    [
      orderId,
      order.status,
      nextStatus,
      adminUserId,
      "Statut modifié depuis l’administration.",
    ],
  );

  return { success: true, message: "Statut de la commande mis à jour." };
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string,
  adminUserId: string,
): Promise<OrderStatusActionResult> {
  if (!uuidPattern.test(orderId)) return failure("Commande introuvable.");
  if (!isOrderStatus(nextStatus)) return failure("Le statut demandé est invalide.");

  let sql: ReturnType<typeof postgres> | undefined;

  try {
    sql = postgres(getRequiredSupabaseDatabaseUrl(), {
      connect_timeout: 10,
      idle_timeout: 5,
      max: 1,
      prepare: false,
    });

    // Transaction poolers require `prepare: false`; RLS remains active as authenticated.
    return await sql.begin((transaction) =>
      updateStatusInTransaction(
        transaction as unknown as postgres.Sql,
        orderId,
        nextStatus,
        adminUserId,
      ),
    );
  } catch (error) {
    console.error("[Order status update failed]", getDatabaseErrorDetails(error));
    return failure("Le statut n’a pas pu être modifié. Réessayez.");
  } finally {
    if (sql) await sql.end({ timeout: 5 });
  }
}
