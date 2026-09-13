import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/server/admin/is-admin";

export async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  try {
    if (!(await isAdminUser(user.id))) {
      redirect("/admin/login?error=forbidden");
    }
  } catch {
    redirect("/admin/login?error=verification");
  }

  return user;
}
