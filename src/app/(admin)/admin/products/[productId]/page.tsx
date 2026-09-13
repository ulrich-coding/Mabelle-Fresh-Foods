import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import { ProductForm } from "@/features/admin/components/product-form";
import { ProductPhotoManager } from "@/features/admin/components/product-photo-manager";
import { getAdminCategories, getAdminProduct } from "@/features/admin/server/catalog";
import { requireAdmin } from "@/features/admin/server/require-admin";

type AdminProductPageProps = {
  params: Promise<{ productId: string }>;
};

export default async function AdminProductPage({ params }: AdminProductPageProps) {
  await requireAdmin();
  const { productId } = await params;
  const [categories, product] = await Promise.all([
    getAdminCategories(),
    getAdminProduct(productId),
  ]);

  if (!product) notFound();

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminPageHeader description="Modifiez les informations et les photos du produit." title={product.name} />
      <main className="mx-auto w-full max-w-3xl space-y-8 px-6 py-10">
        <ProductForm categories={categories} product={product} />
        <ProductPhotoManager photos={product.photos} productId={product.id} />
      </main>
    </div>
  );
}
