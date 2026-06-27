import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return (data?.role === "admin" || data?.role === "superadmin") ? supabase : null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("city")
    .not("city", "is", null)
    .neq("city", "")
    .order("city", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Extract distinct city values
  const cities = [...new Set((data ?? []).map((r: { city: string }) => r.city))].sort();
  return NextResponse.json(cities);
}
