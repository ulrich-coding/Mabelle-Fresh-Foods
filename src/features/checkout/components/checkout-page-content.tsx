"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { useCart } from "@/features/cart/cart-provider";
import { formatCurrencyCents, formatQuantityMilli } from "@/features/cart/lib/calculations";
import type { CartItem } from "@/features/cart/types/cart";

import { CheckoutOrderConfirmation } from "./checkout-order-confirmation";
import { createGuestOrderAction } from "../server/create-order";
import { validateCheckoutAction } from "../server/validate-checkout";
import type {
  CheckoutFormInput,
  CheckoutOrderResult,
  CheckoutValidationResult,
  CheckoutValidationSuccess,
  FulfillmentMethod,
} from "../types/checkout";

type CheckoutFormState = Omit<CheckoutFormInput, "fulfillmentMethod"> & {
  fulfillmentMethod: FulfillmentMethod;
  address: NonNullable<CheckoutFormInput["address"]>;
};

type ValidationState = {
  result: CheckoutValidationSuccess;
  hasCatalogChanges: boolean;
};

const initialForm: CheckoutFormState = {
  fullName: "",
  phone: "",
  fulfillmentMethod: "delivery",
  address: { line1: "", line2: "", city: "", state: "", postalCode: "", countryCode: "US" },
};

function formatUnit(item: Pick<CartItem, "unit" | "unitLabel">) {
  if (item.unit === "kilogram") return "kg";
  if (item.unit === "piece") return "pièce";
  if (item.unit === "dozen") return "douzaine";
  return item.unitLabel ?? "unité";
}

function hasCatalogChanged(item: CartItem, validated: CheckoutValidationSuccess["items"][number]) {
  return item.name !== validated.name
    || item.unitPriceCents !== validated.unitPriceCents
    || item.currencyCode !== validated.currencyCode
    || item.unit !== validated.unit
    || item.unitLabel !== validated.unitLabel
    || item.minimumQuantityMilli !== validated.minimumQuantityMilli
    || item.quantityStepMilli !== validated.quantityStepMilli;
}

function ValidationSummary({ result }: { result: CheckoutValidationSuccess }) {
  return (
    <section aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-stone-900">
      <p className="text-sm font-semibold text-emerald-900">Résumé revalidé par le serveur</p>
      <div className="mt-4 space-y-3">
        {result.items.map((item) => (
          <div className="flex items-start justify-between gap-4 text-sm" key={item.productId}>
            <p>
              <span className="font-medium">{item.name}</span>
              <span className="block text-stone-700">
                {formatQuantityMilli(item.quantityMilli)} {formatUnit(item)} × {formatCurrencyCents(item.unitPriceCents, item.currencyCode)}
              </span>
            </p>
            <p className="shrink-0 font-semibold">{formatCurrencyCents(item.lineTotalCents, item.currencyCode)}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-emerald-200 pt-4 text-base font-semibold">
        <span>Total revalidé</span>
        <span>{formatCurrencyCents(result.totalCents, result.currencyCode)}</span>
      </div>
    </section>
  );
}

export function CheckoutPageContent() {
  const { isHydrated, items, replaceItems } = useCart();
  const [form, setForm] = useState<CheckoutFormState>(initialForm);
  const [result, setResult] = useState<CheckoutValidationResult>();
  const [validation, setValidation] = useState<ValidationState>();
  const [orderResult, setOrderResult] = useState<CheckoutOrderResult>();
  const [isValidationPending, startValidationTransition] = useTransition();
  const [isOrderPending, startOrderTransition] = useTransition();
  const orderSubmissionStarted = useRef(false);

  function clearValidation() {
    setResult(undefined);
    setValidation(undefined);
    setOrderResult(undefined);
    orderSubmissionStarted.current = false;
  }

  function updateForm(patch: Partial<CheckoutFormState>) {
    clearValidation();
    setForm((current) => ({ ...current, ...patch }));
  }

  function updateAddress(patch: Partial<CheckoutFormState["address"]>) {
    clearValidation();
    setForm((current) => ({ ...current, address: { ...current.address, ...patch } }));
  }

  function getCheckoutRequest() {
    return {
      cartItems: items.map(({ productId, quantityMilli }) => ({ productId, quantityMilli })),
      form: form.fulfillmentMethod === "delivery"
        ? form
        : { fullName: form.fullName, phone: form.phone, fulfillmentMethod: form.fulfillmentMethod },
    };
  }

  function submitCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearValidation();

    startValidationTransition(async () => {
      const response = await validateCheckoutAction(getCheckoutRequest());

      setResult(response);
      if (!response.success) return;

      const catalogChanged = response.items.some((validatedItem) => {
        const cartItem = items.find((item) => item.productId === validatedItem.productId);
        return !cartItem || hasCatalogChanged(cartItem, validatedItem);
      });
      setValidation({ result: response, hasCatalogChanges: catalogChanged });
    });
  }

  function submitOrder() {
    if (!validation || orderSubmissionStarted.current || isOrderPending) return;

    orderSubmissionStarted.current = true;
    setOrderResult(undefined);
    startOrderTransition(async () => {
      const response = await createGuestOrderAction(getCheckoutRequest());
      setOrderResult(response);

      if (response.success) {
        replaceItems([]);
        return;
      }

      orderSubmissionStarted.current = false;
    });
  }

  function applyValidatedCatalog() {
    if (!validation) return;

    const itemsByProductId = new Map(validation.result.items.map((item) => [item.productId, item]));
    replaceItems(items.map((item) => {
      const validated = itemsByProductId.get(item.productId);
      if (!validated) return item;

      return {
        ...item,
        name: validated.name,
        unitPriceCents: validated.unitPriceCents,
        currencyCode: validated.currencyCode,
        unit: validated.unit,
        unitLabel: validated.unitLabel,
        quantityMilli: validated.quantityMilli,
        minimumQuantityMilli: validated.minimumQuantityMilli,
        quantityStepMilli: validated.quantityStepMilli,
      };
    }));
    clearValidation();
  }

  if (!isHydrated) {
    return <main className="mx-auto w-full max-w-6xl px-6 py-12 text-stone-700">Chargement du panier…</main>;
  }

  if (orderResult?.success) {
    return <CheckoutOrderConfirmation order={orderResult} />;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Commande</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-950">Votre panier est vide</h1>
        <p className="mt-4 text-stone-700">Ajoutez des produits avant de poursuivre votre commande.</p>
        <Link className="mt-7 inline-flex rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900" href="/products">
          Voir le catalogue
        </Link>
      </main>
    );
  }

  const fieldErrors = result && !result.success ? result.fieldErrors : undefined;
  const cartErrors = result && !result.success ? result.cartErrors : undefined;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">Commande</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Vos informations</h1>
      <p className="mt-4 max-w-3xl leading-7 text-stone-700">
        Nous vérifierons le catalogue et les quantités avant l’enregistrement de votre demande. Aucun paiement n’est demandé en ligne.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <form className="space-y-6 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" onSubmit={submitCheckout}>
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-stone-950">Vos coordonnées</legend>
            <label className="block text-sm font-medium text-stone-800">
              Nom complet
              <input
                autoComplete="name"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
                onChange={(event) => updateForm({ fullName: event.target.value })}
                required
                value={form.fullName}
              />
              {fieldErrors?.fullName ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.fullName}</span> : null}
            </label>
            <label className="block text-sm font-medium text-stone-800">
              Numéro de téléphone
              <input
                autoComplete="tel"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
                inputMode="tel"
                onChange={(event) => updateForm({ phone: event.target.value })}
                placeholder="(212) 555-0123"
                required
                type="tel"
                value={form.phone}
              />
              <span className="mt-1 block font-normal text-stone-600">Numéro américain, avec ou sans l’indicatif +1.</span>
              {fieldErrors?.phone ? <span className="mt-1 block text-sm text-red-700">{fieldErrors.phone}</span> : null}
            </label>
          </fieldset>

          <fieldset className="space-y-3 border-t border-stone-200 pt-6">
            <legend className="text-lg font-semibold text-stone-950">Mode de récupération</legend>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-4">
              <input
                checked={form.fulfillmentMethod === "delivery"}
                name="fulfillment-method"
                onChange={() => updateForm({ fulfillmentMethod: "delivery" })}
                type="radio"
              />
              <span>
                <span className="block font-medium">Livraison</span>
                <span className="mt-1 block text-sm text-stone-600">La disponibilité et les frais de livraison seront confirmés après réception de votre demande.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stone-200 p-4">
              <input
                checked={form.fulfillmentMethod === "pickup"}
                name="fulfillment-method"
                onChange={() => updateForm({ fulfillmentMethod: "pickup" })}
                type="radio"
              />
              <span>
                <span className="block font-medium">Retrait sur place</span>
                <span className="mt-1 block text-sm text-stone-600">Les informations de retrait seront confirmées après votre commande.</span>
              </span>
            </label>
            {fieldErrors?.fulfillmentMethod ? <p className="text-sm text-red-700">{fieldErrors.fulfillmentMethod}</p> : null}
          </fieldset>

          {form.fulfillmentMethod === "delivery" ? (
            <fieldset className="space-y-4 border-t border-stone-200 pt-6">
              <legend className="text-lg font-semibold text-stone-950">Adresse de livraison</legend>
              <label className="block text-sm font-medium text-stone-800">
                Adresse
                <input
                  autoComplete="address-line1"
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
                  onChange={(event) => updateAddress({ line1: event.target.value })}
                  required
                  value={form.address.line1}
                />
              </label>
              <label className="block text-sm font-medium text-stone-800">
                Complément d’adresse <span className="font-normal text-stone-600">(facultatif)</span>
                <input
                  autoComplete="address-line2"
                  className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
                  onChange={(event) => updateAddress({ line2: event.target.value })}
                  value={form.address.line2}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-stone-800">
                  Ville
                  <input
                    autoComplete="address-level2"
                    className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
                    onChange={(event) => updateAddress({ city: event.target.value })}
                    required
                    value={form.address.city}
                  />
                </label>
                <label className="block text-sm font-medium text-stone-800">
                  État
                  <input
                    autoComplete="address-level1"
                    className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal uppercase"
                    maxLength={2}
                    onChange={(event) => updateAddress({ state: event.target.value.toUpperCase() })}
                    placeholder="NY"
                    required
                    value={form.address.state}
                  />
                </label>
                <label className="block text-sm font-medium text-stone-800">
                  Code postal
                  <input
                    autoComplete="postal-code"
                    className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
                    inputMode="numeric"
                    onChange={(event) => updateAddress({ postalCode: event.target.value })}
                    placeholder="10001"
                    required
                    value={form.address.postalCode}
                  />
                </label>
                <label className="block text-sm font-medium text-stone-800">
                  Pays
                  <input
                    className="mt-1 w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 font-normal text-stone-700"
                    readOnly
                    value="États-Unis"
                  />
                </label>
              </div>
              {fieldErrors?.address ? <p className="text-sm text-red-700">{fieldErrors.address}</p> : null}
            </fieldset>
          ) : null}

          {result && !result.success ? (
            <div aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">{result.message}</p>
              {cartErrors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {cartErrors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}

          {orderResult && !orderResult.success ? (
            <div aria-live="polite" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-medium">{orderResult.message}</p>
              {orderResult.cartErrors?.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {orderResult.cartErrors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}

          <button
            className="w-full rounded-md bg-emerald-800 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={isValidationPending || isOrderPending}
            type="submit"
          >
            {isValidationPending ? "Vérification du panier…" : "Continuer la commande"}
          </button>
        </form>

        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-950">Panier à vérifier</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">Les prix ci-dessous sont issus de votre panier local et ne seront pas utilisés pour la commande.</p>
            <div className="mt-4 space-y-3 text-sm">
              {items.map((item) => (
                <div className="flex items-start justify-between gap-4" key={item.productId}>
                  <p>
                    <span className="block font-medium text-stone-900">{item.name}</span>
                    <span className="text-stone-600">{formatQuantityMilli(item.quantityMilli)} {formatUnit(item)}</span>
                  </p>
                  <p className="font-medium text-stone-700">{formatCurrencyCents(item.unitPriceCents, item.currencyCode)}</p>
                </div>
              ))}
            </div>
            <Link className="mt-5 inline-flex text-sm font-medium text-emerald-800 underline" href="/cart">
              Modifier le panier
            </Link>
          </section>

          {validation ? <ValidationSummary result={validation.result} /> : null}

          {validation?.hasCatalogChanges ? (
            <section aria-live="polite" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-semibold">Le catalogue a changé depuis votre ajout au panier.</p>
              <p className="mt-2 leading-6">Vérifiez le résumé revalidé, puis mettez à jour votre panier avant de continuer.</p>
              <button className="mt-4 rounded-md border border-amber-700 px-4 py-2 font-semibold hover:bg-amber-100" onClick={applyValidatedCatalog} type="button">
                Mettre à jour mon panier
              </button>
            </section>
          ) : null}

          {validation && !validation.hasCatalogChanges ? (
            <section aria-live="polite" className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900">
              <p className="font-semibold">Votre demande est prête à être enregistrée.</p>
              <p className="mt-2">La commande sera enregistrée avant toute ouverture de WhatsApp.</p>
              <button
                className="mt-4 w-full rounded-md bg-emerald-800 px-4 py-3 font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:bg-stone-400"
                disabled={isOrderPending}
                onClick={submitOrder}
                type="button"
              >
                {isOrderPending ? "Enregistrement de la commande…" : "Enregistrer la commande"}
              </button>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
