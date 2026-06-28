import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "contact", limit: 5, windowMs: 15 * 60_000 });
  if (limited) return limited;

  const body = await req.json();
  const { name, email, topic, message } = body;
  if (
    typeof name !== "string" || name.trim().length < 2 || name.length > 120 ||
    typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    typeof topic !== "string" || topic.length > 120 ||
    typeof message !== "string" || message.trim().length < 5 || message.length > 5000
  ) {
    return NextResponse.json({ error: "Wypełnij wszystkie pola" }, { status: 400 });
  }

  // Pobierz user_id jeśli zalogowany
  let user_id: string | null = null;
  try {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    user_id = user?.id ?? null;
  } catch { /* niezalogowany */ }

  const supabase = adminClient();

  const { error } = await supabase.from("contact_messages").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    topic: topic.trim(),
    message: message.trim(),
    ...(user_id ? { user_id } : {}),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["contact_email", "contact_thanks_msg"]);

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const thanksMsg = settingsMap["contact_thanks_msg"] ?? "Dziękujemy za wiadomość!";

  return NextResponse.json({ ok: true, thanks: thanksMsg });
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const update: Record<string, unknown> = { read: true };
  if (typeof body.reply === "string" && body.reply.trim()) {
    update.admin_reply = body.reply.trim();
    update.replied_at = new Date().toISOString();
  }

  const { error } = await adminClient().from("contact_messages").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await adminClient().from("contact_messages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Admin: wszystkie wiadomości
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await adminClient()
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}
