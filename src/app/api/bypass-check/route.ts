import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code?: string };
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "admin_bypass_codes")
    .single();

  if (!data?.value) return NextResponse.json({ ok: false });

  try {
    const map: Record<string, string> =
      typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    const valid = Object.values(map).includes(code);
    return NextResponse.json({ ok: valid });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
