import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/security";

const PUBLIC_KEYS = ["contact_email", "contact_thanks_msg", "contact_topics"];

export async function GET() {
  const supabase = await createClient();
  const admin = await requireAdmin();
  let query = supabase.from("app_settings").select("key, value");
  if (!admin) query = query.in("key", PUBLIC_KEYS);
  const { data } = await query;
  return NextResponse.json(Object.fromEntries((data ?? []).map((s) => [s.key, s.value])));
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as Record<string, string>;
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string" || key.length > 100 || value.length > 5000) {
      return NextResponse.json({ error: "Nieprawidłowe ustawienia" }, { status: 400 });
    }
    await admin.supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }
  return NextResponse.json({ ok: true });
}
