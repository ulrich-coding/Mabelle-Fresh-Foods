import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type {
  AdminDeliveryAddress,
  AdminOrderDashboardStats,
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderPage,
  AdminOrderStatusHistoryEntry,
  AdminOrderSummary,
  FulfillmentMethod,
  OrderStatus,
} from "../types/orders";

const orderPageSize = 30;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function asOrderSummary(order: Record<string, unknown>): AdminOrderSummary {
  return {
    id: String(order.id),
    orderNumber: String(order.order_number),
    status: order.status as OrderStatus,
    fulfillmentMethod: order.fulfillment_method as FulfillmentMethod,
    customerName: String(order.customer_name),
    customerPhoneE164: String(order.customer_phone_e164),
    totalAmount: String(order.total_amount),
    currencyCode: String(order.currency_code),
    createdAt: String(order.created_at),
  };
}

function asOrderItem(item: Record<string, unknown>): AdminOrderItem {
  return {
    id: String(item.id),
    productName: String(item.product_name),
    productSku: typeof item.product_sku === "string" ? item.product_sku : null,
    unit: String(item.unit),
    unitLabel: typeof item.unit_label === "string" ? item.unit_label : null,
    quantity: String(item.quantity),
    unitPriceAmount: String(item.unit_price_amount),
    lineTotalAmount: String(item.line_total_amount),
  };
}

function asStatusHistoryEntry(entry: Record<string, unknown>): AdminOrderStatusHistoryEntry {
  return {
    id: String(entry.id),
    previousStatus: entry.previous_status as OrderStatus | null,
    newStatus: entry.new_status as OrderStatus,
    note: typeof entry.note === "string" ? entry.note : null,
    createdAt: String(entry.created_at),
  };
}

function asDeliveryAddress(
  order: Record<string, unknown>,
  address: Record<string, unknown> | null,
): AdminDeliveryAddress | null {
  if (order.fulfillment_method !== "delivery") return null;

  return {
    recipientName:
      typeof order.delivery_recipient_name === "string"
        ? order.delivery_recipient_name
        : null,
    phoneE164:
      typeof order.delivery_phone_e164 === "string"
        ? order.delivery_phone_e164
        : null,
    line1:
      typeof order.delivery_address_line_1 === "string"
        ? order.delivery_address_line_1
        : null,
    line2:
      typeof order.delivery_address_line_2 === "string"
        ? order.delivery_address_line_2
        : null,
    postalCode:
      typeof order.delivery_postal_code === "string"
        ? order.delivery_postal_code
        : null,
    city: typeof order.delivery_city === "string" ? order.delivery_city : null,
    stateCode: address && typeof address.state_code === "string" ? address.state_code : null,
    countryCode:
      typeof order.delivery_country_code === "string"
        ? order.delivery_country_code
        : null,
  };
}

export async function getAdminOrderPage(options: {
  page?: number;
  status?: OrderStatus;
}): Promise<AdminOrderPage> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const from = (page - 1) * orderPageSize;
  const to = from + orderPageSize - 1;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, fulfillment_method, customer_name, customer_phone_e164, total_amount, currency_code, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options.status) {
    query = query.eq("status", options.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error("Impossible de charger les commandes.");
  }

  return {
    orders: ((data as Record<string, unknown>[] | null) ?? []).map(asOrderSummary),
    page,
    pageSize: orderPageSize,
    totalCount: count ?? 0,
  };
}

export async function getAdminOrder(orderId: string): Promise<AdminOrderDetail | null> {
  if (!uuidPattern.test(orderId)) return null;

  const supabase = await createServerSupabaseClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, fulfillment_method, customer_name, customer_phone_e164,
       delivery_address_id, delivery_recipient_name, delivery_phone_e164,
       delivery_address_line_1, delivery_address_line_2, delivery_postal_code,
       delivery_city, delivery_country_code, subtotal_amount, delivery_fee_amount,
       total_amount, currency_code, created_at`,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error("Impossible de charger cette commande.");
  }

  if (!order) return null;

  const orderRecord = order as Record<string, unknown>;
  const addressId =
    typeof orderRecord.delivery_address_id === "string"
      ? orderRecord.delivery_address_id
      : null;

  const [itemsResult, historyResult, addressResult] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        "id, product_name, product_sku, unit, unit_label, quantity, unit_price_amount, line_total_amount",
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("order_status_history")
      .select("id, previous_status, new_status, note, created_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false }),
    addressId
      ? supabase
          .from("customer_addresses")
          .select("state_code")
          .eq("id", addressId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (itemsResult.error || historyResult.error || addressResult.error) {
    throw new Error("Impossible de charger le détail de cette commande.");
  }

  return {
    ...asOrderSummary(orderRecord),
    subtotalAmount: String(orderRecord.subtotal_amount),
    deliveryFeeAmount: String(orderRecord.delivery_fee_amount),
    deliveryAddress: asDeliveryAddress(
      orderRecord,
      addressResult.data as Record<string, unknown> | null,
    ),
    items: ((itemsResult.data as Record<string, unknown>[] | null) ?? []).map(
      asOrderItem,
    ),
    statusHistory: (
      (historyResult.data as Record<string, unknown>[] | null) ?? []
    ).map(asStatusHistoryEntry),
  };
}

export async function getAdminOrderDashboardStats(): Promise<AdminOrderDashboardStats> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("orders").select("status");

  if (error) {
    throw new Error("Impossible de charger les indicateurs des commandes.");
  }

  const statuses = (data as { status: OrderStatus }[] | null) ?? [];

  return {
    submitted: statuses.filter((order) => order.status === "submitted").length,
    preparing: statuses.filter((order) => order.status === "preparing").length,
    completed: statuses.filter((order) => order.status === "completed").length,
  };
}
