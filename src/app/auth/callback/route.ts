import { NextResponse } from "next/server";

import { createRouteHandlerSupabaseClient } from "@/lib/supabase/server";

function getLoginUrl(request: Request, error: string) {
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("error", error);

  return loginUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(getLoginUrl(request, "recovery"));
  }

  const resetPasswordUrl = new URL("/admin/reset-password", request.url);
  const response = NextResponse.redirect(resetPasswordUrl);
  const supabase = await createRouteHandlerSupabaseClient(response);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const hasRecoverySession = Boolean(data.session && data.user);

  console.info("[Auth recovery callback]", {
    errorCode: error?.code ?? null,
    hasRecoverySession,
    userPresent: Boolean(data.user),
  });

  if (error || !hasRecoverySession) {
    return NextResponse.redirect(getLoginUrl(request, "recovery"));
  }

  return response;
}
