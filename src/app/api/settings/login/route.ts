import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/security";

const KEYS = ["magic_link_enabled", "registration_enabled"] as const;

// Publiczny odczyt — login page nie wymaga sesji
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [...KEYS]);

  const map = Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
  return NextResponse.json({
    magic_link_enabled:   map.magic_link_enabled  === "true",
    // rejestracja domyślnie włączona jeśli nigdy nie ustawiono
    registration_enabled: map.registration_enabled !== "false",
  });
}

// Zapis — tylko admin
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as Record<string, boolean>;
  const rows = Object.entries(body)
    .filter(([k]) => (KEYS as readonly string[]).includes(k))
    .map(([key, val]) => ({ key, value: String(val) }));

  if (rows.length) {
    await adminClient().from("app_settings").upsert(rows, { onConflict: "key" });
  }

  return NextResponse.json({ ok: true });
}
