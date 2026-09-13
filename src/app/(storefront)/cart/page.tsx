import { CartPageContent } from "@/features/cart/components/cart-page-content";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <StorefrontHeader />
      <CartPageContent />
    </div>
  );
}
