import "server-only";

import postgres from "postgres";

import { getRequiredSupabaseDatabaseUrl } from "@/lib/supabase/config";

type AdminCheckRow = {
  is_admin: boolean;
};

type AdminCheckDiagnostics = {
  databaseUrlPresent: boolean;
  databaseUrlIsPostgresUri: boolean;
  transactionPoolerDetected: boolean;
  preparedStatementsDisabled: boolean;
  connectionEstablished: boolean;
  transactionStarted: boolean;
  authenticatedRoleApplied: boolean;
  claimsApplied: boolean;
  isAdminCalled: boolean;
  adminResult: boolean | null;
  errorType: string | null;
  errorCode: string | null;
};

function getTransactionPoolerDetected(databaseUrl: string) {
  try {
    const parsedUrl = new URL(databaseUrl);

    return (
      parsedUrl.hostname.endsWith(".pooler.supabase.com") &&
      parsedUrl.port === "6543"
    );
  } catch {
    return false;
  }
}

function getErrorDetails(error: unknown) {
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : null;

  return {
    errorCode,
    errorType: error instanceof Error ? error.name : typeof error,
  };
}

export async function isAdminUser(userId: string) {
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;
  const diagnostics: AdminCheckDiagnostics = {
    databaseUrlPresent: Boolean(databaseUrl),
    databaseUrlIsPostgresUri: /^postgres(?:ql)?:\/\//i.test(databaseUrl ?? ""),
    transactionPoolerDetected: databaseUrl
      ? getTransactionPoolerDetected(databaseUrl)
      : false,
    preparedStatementsDisabled: true,
    connectionEstablished: false,
    transactionStarted: false,
    authenticatedRoleApplied: false,
    claimsApplied: false,
    isAdminCalled: false,
    adminResult: null,
    errorType: null,
    errorCode: null,
  };
  let sql: ReturnType<typeof postgres> | undefined;

  try {
    sql = postgres(getRequiredSupabaseDatabaseUrl(), {
      connect_timeout: 10,
      idle_timeout: 5,
      max: 1,
      prepare: false,
    });

    await sql.unsafe("select 1");
    diagnostics.connectionEstablished = true;

    return await sql.begin(async (transaction) => {
      const claims = JSON.stringify({ role: "authenticated", sub: userId });

      await transaction.unsafe("select 1");
      diagnostics.transactionStarted = true;

      await transaction.unsafe("set local role authenticated");
      const [roleResult] = await transaction.unsafe<
        { role_applied: boolean }[]
      >("select current_user = 'authenticated' as role_applied");
      diagnostics.authenticatedRoleApplied = roleResult?.role_applied === true;

      await transaction.unsafe(
        "select set_config('request.jwt.claims', $1, true)",
        [claims],
      );
      const [claimsResult] = await transaction.unsafe<
        { claims_applied: boolean }[]
      >("select auth.uid() is not null as claims_applied");
      diagnostics.claimsApplied = claimsResult?.claims_applied === true;

      diagnostics.isAdminCalled = true;
      const [result] = await transaction.unsafe<AdminCheckRow[]>(
        "select private.is_admin() as is_admin",
      );

      diagnostics.adminResult = result?.is_admin === true;

      return diagnostics.adminResult;
    });
  } catch (error) {
    Object.assign(diagnostics, getErrorDetails(error));
    throw error;
  } finally {
    if (sql) {
      await sql.end({ timeout: 5 });
    }

    console.info("[Admin authorization check]", diagnostics);
  }
}
