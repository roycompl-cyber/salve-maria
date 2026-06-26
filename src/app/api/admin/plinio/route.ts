import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getEffectiveRole } from "@/lib/security";
import { PLINIO_QUOTES } from "@/lib/plinio-quotes";

function adminDb() {
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
  const role = await getEffectiveRole(user.id, data?.role);
  return (role === "admin" || role === "superadmin") ? user : null;
}

async function getSetting(key: string) {
  const db = adminDb();
  const { data } = await db.from("app_settings").select("value").eq("key", key).single();
  if (!data?.value) return null;
  try { return typeof data.value === "string" ? JSON.parse(data.value) : data.value; }
  catch { return null; }
}

async function saveSetting(key: string, value: unknown) {
  const db = adminDb();
  await db.from("app_settings").upsert(
    { key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

export async function GET() {
  const [overrides, config] = await Promise.all([
    getSetting("plinio_quote_overrides"),
    getSetting("plinio_config"),
  ]);
  return NextResponse.json({
    quotes: PLINIO_QUOTES,
    overrides: overrides ?? {},
    config: config ?? {},
  });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as {
    type: "quote" | "config";
    day?: number;
    quote?: string;
    source?: string;
    config?: Record<string, string>;
  };

  if (body.type === "quote") {
    if (!body.day) return NextResponse.json({ error: "Brak dnia" }, { status: 400 });
    const overrides = (await getSetting("plinio_quote_overrides")) ?? {};
    overrides[body.day] = { quote: body.quote ?? "", source: body.source ?? "" };
    await saveSetting("plinio_quote_overrides", overrides);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "config") {
    await saveSetting("plinio_config", body.config ?? {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nieznany typ" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { day } = await req.json() as { day: number };
  if (!day) return NextResponse.json({ error: "Brak dnia" }, { status: 400 });

  const overrides = (await getSetting("plinio_quote_overrides")) ?? {};
  delete overrides[day];
  await saveSetting("plinio_quote_overrides", overrides);
  return NextResponse.json({ ok: true });
}
