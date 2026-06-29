import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0, ids: [] });

  const { data } = await supabase
    .from("contact_messages")
    .select("id")
    .eq("user_id", user.id)
    .not("admin_reply", "is", null);

  const ids = (data ?? []).map((r: { id: string }) => r.id);
  return NextResponse.json({ count: ids.length, ids });
}
