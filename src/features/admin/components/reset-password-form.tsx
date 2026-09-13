"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function getPasswordValidationError(password: string) {
  if (password.length < 12) {
    return "Le mot de passe doit contenir au moins 12 caractères.";
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.";
  }
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);

    const passwordValidationError = getPasswordValidationError(newPassword);
    if (passwordValidationError) {
      setErrorMessage(passwordValidationError);
      return;
    }

    if (newPassword !== passwordConfirmation) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
      error: sessionReadError,
    } = await supabase.auth.getSession();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.info("[Password reset] recovery session check", {
      errorCode: userError?.code ?? sessionReadError?.code ?? null,
      sessionPresent: Boolean(session),
      userPresent: Boolean(user),
    });

    if (sessionReadError || userError || !session || !user) {
      setErrorMessage("Votre session de récupération est invalide ou expirée. Demandez un nouveau lien.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });

    console.info("[Password reset] update result", {
      errorCode: error?.code ?? null,
      updateSucceeded: Boolean(data.user) && !error,
      userPresent: Boolean(data.user),
    });

    if (error || !data.user) {
      setErrorMessage("Le mot de passe n’a pas pu être mis à jour. Le lien est peut-être expiré.");
      setIsSubmitting(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    console.info("[Password reset] sign out result", {
      errorCode: signOutError?.code ?? null,
      signOutSucceeded: !signOutError,
    });

    if (signOutError) {
      setErrorMessage("Le mot de passe est mis à jour, mais la déconnexion a échoué. Fermez cette page puis reconnectez-vous.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin/login?message=password-reset");
    router.refresh();
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium" htmlFor="new-password">
          Nouveau mot de passe
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          id="new-password"
          minLength={12}
          name="new-password"
          onChange={(event) => setNewPassword(event.target.value)}
          required
          type="password"
          value={newPassword}
        />
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="password-confirmation">
          Confirmer le nouveau mot de passe
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          id="password-confirmation"
          minLength={12}
          name="password-confirmation"
          onChange={(event) => setPasswordConfirmation(event.target.value)}
          required
          type="password"
          value={passwordConfirmation}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        Utilisez au moins 12 caractères, avec une majuscule, une minuscule et un chiffre.
      </p>

      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Mise à jour…" : "Mettre à jour le mot de passe"}
      </button>
    </form>
  );
}
