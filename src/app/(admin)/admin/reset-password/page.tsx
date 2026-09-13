import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/features/admin/components/reset-password-form";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login?error=recovery");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <section className="w-full rounded-lg border border-border bg-background p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Mabelle Fresh Foods</p>
        <h1 className="mt-2 text-2xl font-semibold">Choisir un nouveau mot de passe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce lien de récupération est valide. Choisissez un nouveau mot de passe sécurisé.
        </p>
        <ResetPasswordForm />
      </section>
    </main>
  );
}
