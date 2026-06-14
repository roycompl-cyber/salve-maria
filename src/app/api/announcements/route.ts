import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("push_log")
    .select("id, title, body, type, url, sent_at")
    .order("sent_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // prywatny cache przeglądarki na 5 min — nie trafia na CDN, ale redukuje zbędne zapytania
  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
