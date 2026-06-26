import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getSetting(key: string) {
  try {
    const db = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await db.from("app_settings").select("value").eq("key", key).single();
    if (!data?.value) return null;
    return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
  } catch { return null; }
}

export async function GET() {
  const [config, qaOverrides] = await Promise.all([
    getSetting("catechism_config"),
    getSetting("catechism_qa_overrides"),
  ]);
  return NextResponse.json({ config: config ?? {}, qaOverrides: qaOverrides ?? {} });
}
