import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  const { data } = await supabase.from("scheduled_notifications").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { title, body: msgBody, type, url, send_at, cron_time, cron_days } = body;
  if (!title || !msgBody) return NextResponse.json({ error: "Tytuł i treść są wymagane" }, { status: 400 });

  const { data, error } = await supabase.from("scheduled_notifications").insert({
    title, body: msgBody, type: type || "news", url: url || "",
    send_at: send_at || null,
    cron_time: cron_time || null,
    cron_days: cron_days || [],
    active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await req.json();
  await supabase.from("scheduled_notifications").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
