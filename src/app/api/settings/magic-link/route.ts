import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/security";

// Publiczny odczyt — login page nie wymaga sesji
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "magic_link_enabled")
    .single();
  const enabled = data?.value !== "false";
  return NextResponse.json({ enabled });
}

// Zapis — tylko admin
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { enabled } = await req.json();
  await adminClient()
    .from("app_settings")
    .upsert({ key: "magic_link_enabled", value: String(enabled) }, { onConflict: "key" });

  return NextResponse.json({ ok: true, enabled });
}
