"use client";

import Link from "next/link";
import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createProductAction,
  updateProductAction,
} from "../server/catalog-actions";
import {
  productUnits,
  type AdminCategory,
  type AdminProduct,
  type ProductInput,
} from "../types/catalog";

type ProductFormProps = {
  categories: AdminCategory[];
  product?: AdminProduct;
};

function getInitialValue(product?: AdminProduct): ProductInput {
  return {
    id: product?.id,
    name: product?.name ?? "",
    description: product?.description ?? "",
    priceAmount: product?.price_amount ?? "",
    unit: product?.unit ?? "piece",
    unitLabel: product?.unit_label ?? "",
    categoryId: product?.category_id ?? "",
    isAvailable: product?.is_available ?? true,
    isActive: product?.is_active ?? true,
  };
}

const unitLabels: Record<(typeof productUnits)[number], string> = {
  kilogram: "Kilogramme",
  piece: "Pièce",
  dozen: "Douzaine",
  other: "Autre",
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const [value, setValue] = useState<ProductInput>(() => getInitialValue(product));

  function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);

    startTransition(async () => {
      const result = product
        ? await updateProductAction(value)
        : await createProductAction(value);

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      if (!product && result.data) {
        router.push(`/admin/products/${result.data.id}`);
        return;
      }

      setMessage(result.message ?? "Produit enregistré.");
      router.refresh();
    });
  }

  if (categories.length === 0) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Créez d’abord une catégorie avant d’ajouter un produit.
        <Link className="ml-2 font-medium underline" href="/admin/categories">
          Gérer les catégories
        </Link>
      </section>
    );
  }

  return (
    <form className="space-y-5 rounded-lg border border-stone-200 bg-white p-5 shadow-sm" onSubmit={saveProduct}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-800">
          Nom du produit
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
            onChange={(event) => setValue({ ...value, name: event.target.value })}
            required
            value={value.name}
          />
        </label>
        <label className="text-sm font-medium text-stone-800">
          Catégorie
          <select
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
            onChange={(event) => setValue({ ...value, categoryId: event.target.value })}
            required
            value={value.categoryId}
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-stone-800">
          Prix (USD)
          <input
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
            inputMode="decimal"
            min="0"
            onChange={(event) => setValue({ ...value, priceAmount: event.target.value })}
            placeholder="0.00"
            required
            value={value.priceAmount}
          />
        </label>
        <label className="text-sm font-medium text-stone-800">
          Unité de vente
          <select
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
            onChange={(event) => setValue({ ...value, unit: event.target.value })}
            value={value.unit}
          >
            {productUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unitLabels[unit]}
              </option>
            ))}
          </select>
        </label>
        {value.unit === "other" ? (
          <label className="text-sm font-medium text-stone-800 sm:col-span-2">
            Libellé de l’unité
            <input
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
              onChange={(event) => setValue({ ...value, unitLabel: event.target.value })}
              required
              value={value.unitLabel}
            />
          </label>
        ) : null}
        <label className="text-sm font-medium text-stone-800 sm:col-span-2">
          Description
          <textarea
            className="mt-1 min-h-28 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
            onChange={(event) => setValue({ ...value, description: event.target.value })}
            value={value.description}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
          <input
            checked={value.isAvailable}
            onChange={(event) => setValue({ ...value, isAvailable: event.target.checked })}
            type="checkbox"
          />
          Disponible à la vente
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
          <input
            checked={value.isActive}
            onChange={(event) => setValue({ ...value, isActive: event.target.checked })}
            type="checkbox"
          />
          Produit actif
        </label>
      </div>

      {message ? <p className="text-sm text-stone-700">{message}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Enregistrement…" : product ? "Enregistrer le produit" : "Créer le produit"}
        </button>
        <Link className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800" href="/admin/products">
          Annuler
        </Link>
      </div>
    </form>
  );
}
