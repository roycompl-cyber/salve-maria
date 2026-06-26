import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isLastAdmin, getEffectiveRole } from "@/lib/security";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = await getEffectiveRole(user.id, data?.role);
  return (role === "admin" || role === "superadmin") ? supabase : null;
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

  // Pobierz profile (adminClient omija RLS)
  const { data: profiles } = await adminClient
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
      role: p.role ?? "donor",
      profile_complete: p.profile_complete ?? false,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    };
  });

  return NextResponse.json(users);
}

export async function PATCH(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id, role } = await req.json();
  if (!id || !["admin", "donor"].includes(role))
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  if (role !== "admin" && await isLastAdmin(id))
    return NextResponse.json({ error: "Nie można zdegradować ostatniego administratora" }, { status: 409 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.from("profiles").update({ role }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { email, password, first_name, last_name, phone, city, role } = await req.json();
  if (!email || !password) return NextResponse.json({ error: "Email i hasło są wymagane" }, { status: 400 });
  if (!["admin", "donor"].includes(role ?? "donor")) return NextResponse.json({ error: "Nieprawidłowa rola" }, { status: 400 });

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const userId = authData.user.id;
  await admin.from("profiles").upsert({
    id: userId,
    first_name: first_name ?? null,
    last_name: last_name ?? null,
    phone: phone ?? null,
    city: city ?? null,
    role: role ?? "donor",
    profile_complete: !!(first_name && last_name),
  });

  return NextResponse.json({ id: userId, email, first_name, last_name, phone, city, role: role ?? "donor", profile_complete: false, created_at: new Date().toISOString() });
}

export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });
  if (await isLastAdmin(id))
    return NextResponse.json({ error: "Nie można usunąć ostatniego administratora" }, { status: 409 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Usuń profil i konto auth
  await adminClient.from("profiles").delete().eq("id", id);
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
