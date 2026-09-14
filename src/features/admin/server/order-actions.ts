"use server";

import "server-only";

import { revalidatePath } from "next/cache";

import type { OrderStatusActionResult } from "../types/orders";
import { requireAdmin } from "./require-admin";
import { updateOrderStatus } from "./order-status-transaction";

export async function changeOrderStatusAction(
  orderId: string,
  nextStatus: string,
): Promise<OrderStatusActionResult> {
  const user = await requireAdmin();
  const result = await updateOrderStatus(orderId, nextStatus, user.id);

  if (result.success) {
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
  }

  return result;
}
