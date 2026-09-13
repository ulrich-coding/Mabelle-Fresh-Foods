import Link from "next/link";

import { PasswordRecoveryRequestForm } from "@/features/admin/components/password-recovery-request-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <section className="w-full rounded-lg border border-border bg-background p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Mabelle Fresh Foods</p>
        <h1 className="mt-2 text-2xl font-semibold">Réinitialiser le mot de passe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Saisissez l’adresse e-mail du compte administrateur. Nous vous enverrons un lien sécurisé.
        </p>
        <PasswordRecoveryRequestForm />
        <Link className="mt-6 inline-block text-sm underline" href="/admin/login">
          Retour à la connexion
        </Link>
      </section>
    </main>
  );
}
