import "server-only";

import postgres from "postgres";

import { getRequiredSupabaseDatabaseUrl } from "@/lib/supabase/config";

import {
  calculateValidatedLineTotalCents,
  getValidatedProductAmounts,
  parseCheckoutCartItems,
  validateCheckoutForm,
  validateQuantityForProduct,
  type CheckoutProductForValidation,
  type NormalizedCheckoutForm,
} from "../lib/validation";
import { buildWhatsAppOrderUrl } from "../lib/whatsapp";
import type {
  CheckoutOrderResult,
  CheckoutValidationFailure,
  CheckoutValidationRequest,
  ValidatedCheckoutItem,
} from "../types/checkout";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  price_amount: string;
  currency_code: string;
  unit: CheckoutProductForValidation["unit"];
  unit_label: string | null;
  minimum_order_quantity: string;
  quantity_step: string;
};

type CustomerRow = { id: string };
type AddressRow = { id: string };
type OrderRow = { id: string; order_number: string | number };

function failure(message: string, options?: Omit<CheckoutValidationFailure, "success" | "message">): CheckoutValidationFailure {
  return { success: false, message, ...options };
}

function asProduct(row: ProductRow): CheckoutProductForValidation {
  return {
    id: row.id,
    name: row.name,
    priceAmount: String(row.price_amount),
    currencyCode: String(row.currency_code),
    unit: row.unit,
    unitLabel: row.unit_label,
    minimumOrderQuantity: String(row.minimum_order_quantity),
    quantityStep: String(row.quantity_step),
  };
}

function centsToNumeric(cents: number) {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function milliToNumeric(quantityMilli: number) {
  return `${Math.floor(quantityMilli / 1000)}.${String(quantityMilli % 1000).padStart(3, "0")}`;
}

function getDatabaseErrorDetails(error: unknown) {
  return {
    code: error && typeof error === "object" && "code" in error ? String(error.code) : null,
    type: error instanceof Error ? error.name : typeof error,
  };
}

function validateProducts(
  cartItems: { productId: string; quantityMilli: number }[],
  productRows: ProductRow[],
) {
  const productsById = new Map(productRows.map((product) => [product.id, product]));
  const cartErrors: string[] = [];
  const items: ValidatedCheckoutItem[] = [];

  for (const cartItem of cartItems) {
    const row = productsById.get(cartItem.productId);
    if (!row) {
      cartErrors.push("Un produit de votre panier n’est plus disponible. Retournez au panier pour le retirer.");
      continue;
    }

    const product = asProduct(row);
    const quantityError = validateQuantityForProduct(cartItem.quantityMilli, product);
    if (quantityError) {
      cartErrors.push(`${product.name} : ${quantityError}`);
      continue;
    }

    const amounts = getValidatedProductAmounts(product);
    if (!amounts) {
      cartErrors.push(`${product.name} : son prix ou ses règles de vente ne peuvent pas être vérifiés.`);
      continue;
    }

    const lineTotalCents = calculateValidatedLineTotalCents(amounts.unitPriceCents, cartItem.quantityMilli);
    if (lineTotalCents === null) {
      cartErrors.push(`${product.name} : le montant ne peut pas être calculé.`);
      continue;
    }

    items.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      unitLabel: product.unitLabel,
      quantityMilli: cartItem.quantityMilli,
      minimumQuantityMilli: amounts.minimumQuantityMilli,
      quantityStepMilli: amounts.quantityStepMilli,
      unitPriceCents: amounts.unitPriceCents,
      lineTotalCents,
      currencyCode: "USD",
    });
  }

  return { items, cartErrors };
}

async function createOrderInTransaction(
  transaction: postgres.Sql,
  form: NormalizedCheckoutForm,
  cartItems: { productId: string; quantityMilli: number }[],
): Promise<CheckoutOrderResult> {
  const productIds = cartItems.map((item) => item.productId);
  const productRows = await transaction<ProductRow[]>`
    select p.id, p.name, p.sku, p.price_amount, p.currency_code, p.unit, p.unit_label,
      p.minimum_order_quantity, p.quantity_step
    from public.products p
    inner join public.categories c on c.id = p.category_id and c.is_active
    where p.id = any(${transaction.array(productIds, 2950)})
      and p.is_active
      and p.is_available
  `;
  const { items, cartErrors } = validateProducts(cartItems, productRows);

  if (cartErrors.length > 0 || items.length !== cartItems.length) {
    return failure("Votre panier a changé ou contient une quantité invalide. Vérifiez-le avant de continuer.", { cartErrors });
  }

  const subtotalCents = items.reduce((total, item) => total + item.lineTotalCents, 0);
  if (!Number.isSafeInteger(subtotalCents)) {
    return failure("Le total de la commande ne peut pas être calculé.");
  }

  const [customer] = await transaction<CustomerRow[]>`
    insert into public.customers (full_name, phone_e164)
    values (${form.fullName}, ${form.phoneE164})
    returning id
  `;

  let address: AddressRow | undefined;
  if (form.fulfillmentMethod === "delivery" && form.address) {
    [address] = await transaction<AddressRow[]>`
      insert into public.customer_addresses (
        customer_id, recipient_name, phone_e164, address_line_1, address_line_2,
        postal_code, city, state_code, country_code
      )
      values (
        ${customer.id}, ${form.fullName}, ${form.phoneE164}, ${form.address.line1}, ${form.address.line2},
        ${form.address.postalCode}, ${form.address.city}, ${form.address.state}, ${form.address.countryCode}
      )
      returning id
    `;
  }

  const delivery = form.address;
  const [order] = await transaction<OrderRow[]>`
    insert into public.orders (
      customer_id, delivery_address_id, status, fulfillment_method,
      customer_name, customer_phone_e164,
      delivery_recipient_name, delivery_phone_e164, delivery_address_line_1, delivery_address_line_2,
      delivery_postal_code, delivery_city, delivery_country_code,
      subtotal_amount, delivery_fee_amount, total_amount, currency_code
    )
    values (
      ${customer.id}, ${address?.id ?? null}, 'submitted'::public.order_status, ${form.fulfillmentMethod}::public.fulfillment_method,
      ${form.fullName}, ${form.phoneE164},
      ${delivery ? form.fullName : null}, ${delivery ? form.phoneE164 : null}, ${delivery?.line1 ?? null}, ${delivery?.line2 ?? null},
      ${delivery?.postalCode ?? null}, ${delivery?.city ?? null}, ${delivery?.countryCode ?? null},
      ${centsToNumeric(subtotalCents)}, '0.00', ${centsToNumeric(subtotalCents)}, 'USD'
    )
    returning id, order_number
  `;

  const productsById = new Map(productRows.map((product) => [product.id, product]));
  for (const item of items) {
    const product = productsById.get(item.productId);
    if (!product) throw new Error("Produit revalidé introuvable.");

    await transaction`
      insert into public.order_items (
        order_id, product_id, product_name, product_sku, unit, unit_label,
        quantity, unit_price_amount, line_total_amount
      )
      values (
        ${order.id}, ${product.id}, ${item.name}, ${product.sku}, ${item.unit}::public.product_unit, ${item.unitLabel},
        ${milliToNumeric(item.quantityMilli)}, ${centsToNumeric(item.unitPriceCents)}, ${centsToNumeric(item.lineTotalCents)}
      )
    `;
  }

  await transaction`
    insert into public.order_status_history (order_id, previous_status, new_status, note)
    values (${order.id}, null, 'submitted'::public.order_status, 'Commande soumise depuis le checkout public.')
  `;

  const orderNumber = String(order.order_number);
  return {
    success: true,
    message: "Votre commande a été enregistrée.",
    orderNumber,
    fulfillmentMethod: form.fulfillmentMethod,
    items,
    subtotalCents,
    totalCents: subtotalCents,
    currencyCode: "USD",
    whatsappUrl: buildWhatsAppOrderUrl({
      orderNumber,
      customerName: form.fullName,
      customerPhoneE164: form.phoneE164,
      fulfillmentMethod: form.fulfillmentMethod,
      address: form.address,
      items,
      totalCents: subtotalCents,
      currencyCode: "USD",
    }),
  };
}

export async function createGuestOrder(request: CheckoutValidationRequest): Promise<CheckoutOrderResult> {
  const form = validateCheckoutForm(request?.form);
  if ("success" in form) return form;

  const cartItems = parseCheckoutCartItems(request?.cartItems);
  if ("success" in cartItems) return cartItems;

  let sql: ReturnType<typeof postgres> | undefined;
  try {
    sql = postgres(getRequiredSupabaseDatabaseUrl(), {
      connect_timeout: 10,
      idle_timeout: 5,
      max: 1,
      prepare: false,
    });

    // `TransactionSql` is callable at runtime, but its upstream type omits Sql's call signature.
    return await sql.begin((transaction) => createOrderInTransaction(transaction as unknown as postgres.Sql, form, cartItems));
  } catch (error) {
    const details = getDatabaseErrorDetails(error);
    console.error("[Guest order creation failed]", details);
    return failure("La commande n’a pas pu être enregistrée. Aucun paiement n’a été effectué. Réessayez.");
  } finally {
    if (sql) await sql.end({ timeout: 5 });
  }
}
