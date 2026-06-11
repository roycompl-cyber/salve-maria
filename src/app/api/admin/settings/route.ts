import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");
  return NextResponse.json(Object.fromEntries((data ?? []).map((s) => [s.key, s.value])));
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as Record<string, string>;
  for (const [key, value] of Object.entries(body)) {
    await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }
  return NextResponse.json({ ok: true });
}
