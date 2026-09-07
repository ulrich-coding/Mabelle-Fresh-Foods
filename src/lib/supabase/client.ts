import { createBrowserClient } from "@supabase/ssr";

import { getRequiredSupabaseEnvironment } from "./config";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = getRequiredSupabaseEnvironment();

  return createBrowserClient(url, publishableKey);
}
