import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function adminClient() {
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
  return (data?.role === "admin" || data?.role === "superadmin") ? supabase : null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const supabase = adminClient();

  // Count active push subscriptions
  const { count: active_subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true });

  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

  // Count notifications sent in the last 7 days.
  // Note: push_log only stores {title, body, type, url} per the insert in /api/push/send/route.ts —
  // there is no sent_count column. We count rows instead (each row = one send event).
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: sent_last_7_days, error: logCountError } = await supabase
    .from("push_log")
    .select("*", { count: "exact", head: true })
    .gt("created_at", sevenDaysAgo);

  if (logCountError) return NextResponse.json({ error: logCountError.message }, { status: 500 });

  // Recent history
  const { data: history, error: historyError } = await supabase
    .from("push_log")
    .select("id, title, body, type, url, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (historyError) return NextResponse.json({ error: historyError.message }, { status: 500 });

  return NextResponse.json({
    active_subscriptions: active_subscriptions ?? 0,
    sent_last_7_days: sent_last_7_days ?? 0,
    history: history ?? [],
  });
}
