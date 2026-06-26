import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await db.from("app_settings").select("value").eq("key", "civilitas_config").single();
    if (!data?.value) return NextResponse.json({});
    const config = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return NextResponse.json(config);
  } catch { return NextResponse.json({}); }
}
