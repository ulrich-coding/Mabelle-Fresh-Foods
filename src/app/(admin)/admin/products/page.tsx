import Link from "next/link";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { ProductStorageImage } from "@/features/admin/components/product-storage-image";
import { getAdminProducts } from "@/features/admin/server/catalog";
import { requireAdmin } from "@/features/admin/server/require-admin";

const unitLabels = {
  kilogram: "kg",
  piece: "pièce",
  dozen: "douzaine",
  other: "autre",
} as const;

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getAdminProducts();

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminPageHeader
        description="Gérez les produits, leurs disponibilités et leurs photos."
        title="Produits"
      />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-600">{products.length} produit{products.length > 1 ? "s" : ""}</p>
          <Link className="rounded-md bg-stone-900 px-4 py-2 text-center text-sm font-medium text-white" href="/admin/products/new">
            Ajouter un produit
          </Link>
        </div>

        {products.length === 0 ? (
          <section className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-stone-700">Aucun produit pour le moment.</p>
            <Link className="mt-3 inline-block text-sm font-medium underline" href="/admin/products/new">
              Créer le premier produit
            </Link>
          </section>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white shadow-sm">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-100 text-stone-700">
                <tr>
                  <th className="p-4 font-medium">Photo</th>
                  <th className="p-4 font-medium">Produit</th>
                  <th className="p-4 font-medium">Catégorie</th>
                  <th className="p-4 font-medium">Prix</th>
                  <th className="p-4 font-medium">Disponibilité</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4" />
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const primaryPhoto = product.photos.find((photo) => photo.is_primary) ?? product.photos[0];

                  return (
                    <tr className="border-b border-stone-100 last:border-0" key={product.id}>
                      <td className="p-4">
                        {primaryPhoto ? (
                          <ProductStorageImage
                            alt={primaryPhoto.alt_text ?? `Photo de ${product.name}`}
                            bucket={primaryPhoto.storage_bucket}
                            className="size-12 rounded-md bg-stone-100 object-cover"
                            path={primaryPhoto.storage_path}
                          />
                        ) : (
                          <div className="size-12 rounded-md bg-stone-100" />
                        )}
                      </td>
                      <td className="p-4 font-medium text-stone-900">{product.name}</td>
                      <td className="p-4 text-stone-700">{product.category?.name ?? "—"}</td>
                      <td className="p-4 text-stone-700">
                        {Number(product.price_amount).toFixed(2)} USD / {product.unit === "other" ? product.unit_label : unitLabels[product.unit]}
                      </td>
                      <td className="p-4 text-stone-700">{product.is_available ? "Disponible" : "Indisponible"}</td>
                      <td className="p-4 text-stone-700">{product.is_active ? "Actif" : "Inactif"}</td>
                      <td className="p-4 text-right">
                        <Link className="font-medium text-stone-900 underline" href={`/admin/products/${product.id}`}>
                          Modifier
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
