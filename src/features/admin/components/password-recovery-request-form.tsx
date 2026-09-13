"use client";

import { FormEvent, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function PasswordRecoveryRequestForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    if (error) {
      setErrorMessage("Nous ne pouvons pas envoyer l’e-mail de récupération pour le moment. Veuillez réessayer.");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(
      "Si cette adresse correspond à un compte, un e-mail de récupération vient d’être envoyé.",
    );
    setIsSubmitting(false);
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="text-sm font-medium" htmlFor="email">
          Adresse e-mail
        </label>
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          id="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p aria-live="polite" className="text-sm text-green-700" role="status">
          {successMessage}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Envoi en cours…" : "Envoyer l’e-mail de récupération"}
      </button>
    </form>
  );
}
