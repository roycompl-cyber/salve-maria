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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prayers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { title, content, category, language, tags } = body;
  if (!title || !content) return NextResponse.json({ error: "Tytuł i treść są wymagane" }, { status: 400 });

  const { data, error } = await supabase
    .from("prayers")
    .insert({ title, content, category: category || "Ogólne", language: language || "pl", tags: tags || [] })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
