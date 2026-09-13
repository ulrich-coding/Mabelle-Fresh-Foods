function getRequiredSupabaseEnvironment() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}

function getRequiredSupabaseDatabaseUrl() {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "Missing Supabase database configuration. Set SUPABASE_DATABASE_URL.",
    );
  }

  return databaseUrl;
}

export { getRequiredSupabaseDatabaseUrl, getRequiredSupabaseEnvironment };
