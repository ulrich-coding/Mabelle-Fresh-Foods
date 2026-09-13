"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type AdminLoginFormProps = {
  initialError?: string;
};

export function AdminLoginForm({ initialError }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(undefined);
    setIsSubmitting(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    console.info("[Admin login] sign-in result", {
      errorCode: error?.code ?? null,
      signInSucceeded: !error,
    });

    if (error) {
      setErrorMessage("L’adresse e-mail ou le mot de passe est incorrect.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
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

      <div>
        <label className="text-sm font-medium" htmlFor="password">
          Mot de passe
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Link className="block text-sm underline" href="/admin/forgot-password">
        Mot de passe oublié ?
      </Link>

      <button
        className="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Connexion en cours…" : "Se connecter"}
      </button>
    </form>
  );
}
