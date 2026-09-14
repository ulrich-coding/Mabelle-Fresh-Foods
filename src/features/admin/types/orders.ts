export const orderStatuses = [
  "draft",
  "submitted",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "Brouillon",
  submitted: "Reçue",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready_for_pickup: "Prête pour retrait",
  out_for_delivery: "En livraison",
  completed: "Terminée",
  cancelled: "Annulée",
};

export type FulfillmentMethod = "delivery" | "pickup";

export const fulfillmentMethodLabels: Record<FulfillmentMethod, string> = {
  delivery: "Livraison",
  pickup: "Retrait",
};

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerPhoneE164: string;
  totalAmount: string;
  currencyCode: string;
  createdAt: string;
};

export type AdminDeliveryAddress = {
  recipientName: string | null;
  phoneE164: string | null;
  line1: string | null;
  line2: string | null;
  postalCode: string | null;
  city: string | null;
  stateCode: string | null;
  countryCode: string | null;
};

export type AdminOrderItem = {
  id: string;
  productName: string;
  productSku: string | null;
  unit: string;
  unitLabel: string | null;
  quantity: string;
  unitPriceAmount: string;
  lineTotalAmount: string;
};

export type AdminOrderStatusHistoryEntry = {
  id: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  note: string | null;
  createdAt: string;
};

export type AdminOrderDetail = AdminOrderSummary & {
  subtotalAmount: string;
  deliveryFeeAmount: string;
  deliveryAddress: AdminDeliveryAddress | null;
  items: AdminOrderItem[];
  statusHistory: AdminOrderStatusHistoryEntry[];
};

export type AdminOrderPage = {
  orders: AdminOrderSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
};

export type AdminOrderDashboardStats = {
  submitted: number;
  preparing: number;
  completed: number;
};

export type OrderStatusActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

export function isOrderStatus(value: string | undefined): value is OrderStatus {
  return Boolean(value && orderStatuses.includes(value as OrderStatus));
}
