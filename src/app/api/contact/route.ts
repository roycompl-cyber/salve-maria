import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, topic, message } = body;
  if (!name || !email || !topic || !message) {
    return NextResponse.json({ error: "Wypełnij wszystkie pola" }, { status: 400 });
  }

  const supabase = await createClient();

  // Zapisz wiadomość
  const { error } = await supabase.from("contact_messages").insert({ name, email, topic, message });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pobierz ustawienia (email, treść podziękowania)
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["contact_email", "contact_thanks_msg"]);

  const settingsMap = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));
  const thanksMsg = settingsMap["contact_thanks_msg"] ?? "Dziękujemy za wiadomość!";

  // TODO: wysłanie e-mail przez Resend/SMTP gdy będzie skonfigurowane
  // const contactEmail = settingsMap["contact_email"];

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

  const { error } = await supabase.from("contact_messages").update({ read: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data ?? []);
}
