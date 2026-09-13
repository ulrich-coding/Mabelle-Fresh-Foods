import { CheckoutPageContent } from "@/features/checkout/components/checkout-page-content";
import { StorefrontHeader } from "@/features/storefront/components/storefront-header";

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <StorefrontHeader />
      <CheckoutPageContent />
    </div>
  );
}
