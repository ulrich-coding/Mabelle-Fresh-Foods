"use server";

import "server-only";

import { createGuestOrder } from "./order-transaction";
import type { CheckoutOrderResult, CheckoutValidationRequest } from "../types/checkout";

export async function createGuestOrderAction(
  request: CheckoutValidationRequest,
): Promise<CheckoutOrderResult> {
  return createGuestOrder(request);
}
