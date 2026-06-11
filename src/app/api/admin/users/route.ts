import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  // Pobierz wszystkich userów przez admin API (service role)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await adminClient.auth.admin.listUsers();
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  // Pobierz profile
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, city, role, profile_complete, created_at");

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  const users = authData.users.map(u => {
    const p = profileMap[u.id] ?? {};
    return {
      id: u.id,
      email: u.email,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      phone: p.phone ?? null,
      city: p.city ?? null,
      role: p.role ?? "user",
      profile_complete: p.profile_complete ?? false,
      created_at: u.created_at,
    };
  });

  return NextResponse.json(users);
}
