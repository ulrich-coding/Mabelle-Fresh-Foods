import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { CategoryManager } from "@/features/admin/components/category-manager";
import { getAdminCategories } from "@/features/admin/server/catalog";
import { requireAdmin } from "@/features/admin/server/require-admin";

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminPageHeader
        description="Créez, organisez et activez les catégories du catalogue."
        title="Catégories"
      />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <CategoryManager categories={categories} />
      </main>
    </div>
  );
}
