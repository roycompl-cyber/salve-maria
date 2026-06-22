import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { ShareConfig, DEFAULT_SHARE_CONFIG } from "@/lib/share-config";
export type { ShareConfig };
export { DEFAULT_SHARE_CONFIG };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "share_config")
    .single();

  if (!data?.value) return NextResponse.json(DEFAULT_SHARE_CONFIG);

  try {
    const cfg = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return NextResponse.json({ ...DEFAULT_SHARE_CONFIG, ...cfg });
  } catch {
    return NextResponse.json(DEFAULT_SHARE_CONFIG);
  }
}

export async function POST(req: NextRequest) {
  const authed = await requireAdmin();
  if (!authed) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as Partial<ShareConfig>;
  const cfg: ShareConfig = {
    subject: body.subject ?? DEFAULT_SHARE_CONFIG.subject,
    body: body.body ?? DEFAULT_SHARE_CONFIG.body,
  };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await admin.from("app_settings").upsert(
    { key: "share_config", value: JSON.stringify(cfg), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  return NextResponse.json({ ok: true });
}
