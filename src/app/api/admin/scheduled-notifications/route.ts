import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalUrl } from "@/lib/security";

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
  if (
    typeof title !== "string" || title.trim().length < 1 || title.length > 120 ||
    typeof msgBody !== "string" || msgBody.trim().length < 1 || msgBody.length > 1000 ||
    !["news", "action", "general"].includes(type || "news") ||
    (cron_time && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(cron_time)) ||
    (send_at && Number.isNaN(Date.parse(send_at))) ||
    (cron_days && (!Array.isArray(cron_days) || cron_days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)))
  ) {
    return NextResponse.json({ error: "Nieprawidłowe dane powiadomienia" }, { status: 400 });
  }

  const { data, error } = await supabase.from("scheduled_notifications").insert({
    title: title.trim(), body: msgBody.trim(), type: type || "news", url: safeInternalUrl(url, "/announcements"),
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

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });
  await supabase.from("scheduled_notifications").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
