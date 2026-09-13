import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextResponse } from "next/server";

import { getRequiredSupabaseEnvironment } from "./config";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getRequiredSupabaseEnvironment();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. A future auth proxy will handle refreshes.
        }
      },
    },
  });
}

export async function createRouteHandlerSupabaseClient(response: NextResponse) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getRequiredSupabaseEnvironment();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });
}
