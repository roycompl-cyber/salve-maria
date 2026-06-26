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
  const [config, qaOverrides] = await Promise.all([
    getSetting("catechism_config"),
    getSetting("catechism_qa_overrides"),
  ]);
  return NextResponse.json({ config: config ?? {}, qaOverrides: qaOverrides ?? {} });
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as {
    type: "config" | "qa";
    config?: Record<string, string>;
    key?: string; // "chapterId_questionNum", e.g. "I_1"
    q?: string;
    a?: string;
  };

  if (body.type === "config") {
    await saveSetting("catechism_config", body.config ?? {});
    return NextResponse.json({ ok: true });
  }

  if (body.type === "qa" && body.key) {
    const overrides = (await getSetting("catechism_qa_overrides")) ?? {};
    overrides[body.key] = { q: body.q ?? "", a: body.a ?? "" };
    await saveSetting("catechism_qa_overrides", overrides);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nieznany typ" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  const { key } = await req.json() as { key: string };
  const overrides = (await getSetting("catechism_qa_overrides")) ?? {};
  delete overrides[key];
  await saveSetting("catechism_qa_overrides", overrides);
  return NextResponse.json({ ok: true });
}
