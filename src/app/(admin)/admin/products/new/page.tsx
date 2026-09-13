import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { ProductForm } from "@/features/admin/components/product-form";
import { getAdminCategories } from "@/features/admin/server/catalog";
import { requireAdmin } from "@/features/admin/server/require-admin";

export default async function NewAdminProductPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminPageHeader description="Ajoutez un produit au catalogue." title="Nouveau produit" />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <ProductForm categories={categories} />
      </main>
    </div>
  );
}
