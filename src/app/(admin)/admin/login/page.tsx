import { AdminLoginForm } from "@/features/admin/components/admin-login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string | string[]; message?: string | string[] }>;
};

function getErrorMessage(error: string | string[] | undefined) {
  if (error === "forbidden") {
    return "Ce compte est authentifié, mais il n’est pas autorisé à accéder à l’administration.";
  }

  if (error === "verification") {
    return "La vérification des droits administrateur est indisponible. Veuillez réessayer.";
  }

  if (error === "recovery") {
    return "Le lien de récupération est invalide ou a expiré. Demandez-en un nouveau.";
  }
}

function getSuccessMessage(message: string | string[] | undefined) {
  if (message === "password-reset") {
    return "Votre mot de passe a été mis à jour. Vous pouvez vous connecter.";
  }
}

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
      <section className="w-full rounded-lg border border-border bg-background p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">Mabelle Fresh Foods</p>
        <h1 className="mt-2 text-2xl font-semibold">Connexion administrateur</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous avec le compte administrateur autorisé.
        </p>
        {getSuccessMessage(message) ? (
          <p aria-live="polite" className="mt-4 text-sm text-green-700" role="status">
            {getSuccessMessage(message)}
          </p>
        ) : null}
        <AdminLoginForm initialError={getErrorMessage(error)} />
      </section>
    </main>
  );
}
