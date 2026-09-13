"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "../server/catalog-actions";
import type { AdminCategory, CategoryInput } from "../types/catalog";

const emptyCategory: CategoryInput = {
  name: "",
  description: "",
  displayOrder: "0",
  isActive: true,
};

type CategoryFieldsProps = {
  onChange: (nextValue: CategoryInput) => void;
  value: CategoryInput;
};

function CategoryFields({ onChange, value }: CategoryFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-stone-800">
        Nom
        <input
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          required
          value={value.name}
        />
      </label>
      <label className="text-sm font-medium text-stone-800">
        Ordre d’affichage
        <input
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
          min="0"
          onChange={(event) => onChange({ ...value, displayOrder: event.target.value })}
          required
          type="number"
          value={value.displayOrder}
        />
      </label>
      <label className="text-sm font-medium text-stone-800 sm:col-span-2">
        Description
        <textarea
          className="mt-1 min-h-20 w-full rounded-md border border-stone-300 px-3 py-2 font-normal"
          onChange={(event) => onChange({ ...value, description: event.target.value })}
          value={value.description}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-stone-800">
        <input
          checked={value.isActive}
          onChange={(event) => onChange({ ...value, isActive: event.target.checked })}
          type="checkbox"
        />
        Catégorie active
      </label>
    </div>
  );
}

function CategoryEditor({ category }: { category: AdminCategory }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const [value, setValue] = useState<CategoryInput>({
    id: category.id,
    name: category.name,
    description: category.description ?? "",
    displayOrder: String(category.display_order),
    isActive: category.is_active,
  });

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    startTransition(async () => {
      const result = await updateCategoryAction(value);
      setMessage(result.success ? result.message : result.message);
      if (result.success) router.refresh();
    });
  }

  function deleteCategory() {
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » ?`)) return;

    setMessage(undefined);
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      setMessage(result.message);
      if (result.success) router.refresh();
    });
  }

  return (
    <form className="rounded-lg border border-stone-200 p-5" onSubmit={saveCategory}>
      <CategoryFields onChange={setValue} value={value} />
      {message ? <p className="mt-3 text-sm text-stone-700">{message}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
          disabled={isPending}
          onClick={deleteCategory}
          type="button"
        >
          Supprimer
        </button>
      </div>
    </form>
  );
}

export function CategoryManager({ categories }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();
  const [newCategory, setNewCategory] = useState<CategoryInput>(emptyCategory);

  function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(undefined);
    startTransition(async () => {
      const result = await createCategoryAction(newCategory);
      setMessage(result.success ? "Catégorie créée." : result.message);
      if (result.success) {
        setNewCategory(emptyCategory);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Nouvelle catégorie</h2>
        <form className="mt-4" onSubmit={createCategory}>
          <CategoryFields onChange={setNewCategory} value={newCategory} />
          {message ? <p className="mt-3 text-sm text-stone-700">{message}</p> : null}
          <button
            className="mt-4 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Création…" : "Créer la catégorie"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Catégories existantes</h2>
        {categories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 p-5 text-sm text-stone-600">
            Aucune catégorie pour le moment.
          </p>
        ) : (
          categories.map((category) => <CategoryEditor category={category} key={category.id} />)
        )}
      </section>
    </div>
  );
}
