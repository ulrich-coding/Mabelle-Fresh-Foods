import type { CartUnit } from "@/features/cart/types/cart";

export const fulfillmentMethods = ["delivery", "pickup"] as const;

export type FulfillmentMethod = (typeof fulfillmentMethods)[number];

export type CheckoutCartItemInput = {
  productId: string;
  quantityMilli: number;
};

export type CheckoutFormInput = {
  fullName: string;
  phone: string;
  fulfillmentMethod: FulfillmentMethod;
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: "US";
  };
};

export type CheckoutValidationRequest = {
  cartItems: CheckoutCartItemInput[];
  form: CheckoutFormInput;
};

export type ValidatedCheckoutItem = {
  productId: string;
  name: string;
  unit: CartUnit;
  unitLabel: string | null;
  quantityMilli: number;
  minimumQuantityMilli: number;
  quantityStepMilli: number;
  unitPriceCents: number;
  lineTotalCents: number;
  currencyCode: "USD";
};

export type CheckoutValidationFailure = {
  success: false;
  message: string;
  fieldErrors?: Partial<Record<"fullName" | "phone" | "fulfillmentMethod" | "address", string>>;
  cartErrors?: string[];
};

export type CheckoutValidationSuccess = {
  success: true;
  message: string;
  fulfillmentMethod: FulfillmentMethod;
  items: ValidatedCheckoutItem[];
  subtotalCents: number;
  totalCents: number;
  currencyCode: "USD";
};

export type CheckoutValidationResult = CheckoutValidationFailure | CheckoutValidationSuccess;
