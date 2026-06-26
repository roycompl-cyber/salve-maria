import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getEffectiveRole } from "@/lib/security";

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = await getEffectiveRole(user.id, data?.role);
  return (role === "admin" || role === "superadmin") ? user : null;
}

async function getCodesMap(): Promise<Record<string, string>> {
  const db = adminDb();
  const { data } = await db.from("app_settings").select("value").eq("key", "admin_bypass_codes").single();
  if (!data?.value) return {};
  try {
    return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
  } catch { return {}; }
}

// GET — zwraca kod bieżącego admina (lub null)
export async function GET() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  const map = await getCodesMap();
  return NextResponse.json({ code: map[user.id] ?? null });
}

// POST — zapisuje kod bieżącego admina
export async function POST(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { code } = await req.json() as { code: string };
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Kod musi mieć dokładnie 6 cyfr" }, { status: 400 });
  }

  const map = await getCodesMap();

  // Sprawdź czy kod nie jest już używany przez innego admina
  const conflict = Object.entries(map).find(([uid, c]) => c === code && uid !== user.id);
  if (conflict) {
    return NextResponse.json({ error: "Ten kod jest już używany przez innego administratora" }, { status: 409 });
  }

  map[user.id] = code;
  const db = adminDb();
  await db.from("app_settings").upsert(
    { key: "admin_bypass_codes", value: JSON.stringify(map), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  return NextResponse.json({ ok: true });
}

// DELETE — usuwa kod bieżącego admina
export async function DELETE() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const map = await getCodesMap();
  delete map[user.id];
  const db = adminDb();
  await db.from("app_settings").upsert(
    { key: "admin_bypass_codes", value: JSON.stringify(map), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  return NextResponse.json({ ok: true });
}
