"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function AdminSignOutButton() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setErrorMessage(undefined);
    setIsSigningOut(true);

    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage("La déconnexion a échoué. Veuillez réessayer.");
      setIsSigningOut(false);
      return;
    }

    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button
        className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSigningOut}
        onClick={handleSignOut}
        type="button"
      >
        {isSigningOut ? "Déconnexion…" : "Se déconnecter"}
      </button>

      {errorMessage ? (
        <p aria-live="polite" className="text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
