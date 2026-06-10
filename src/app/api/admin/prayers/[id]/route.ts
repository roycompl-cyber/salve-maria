import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, content, category, language, tags, sort_order } = body;

  const { data, error } = await supabase
    .from("prayers")
    .update({ title, content, category, language, tags, sort_order, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  const { error } = await supabase.from("prayers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
