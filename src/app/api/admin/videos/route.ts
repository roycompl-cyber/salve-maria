/*
 * SQL for videos table (run in Supabase SQL editor):
 *
 * CREATE TABLE IF NOT EXISTS videos (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title text NOT NULL,
 *   youtube_id text NOT NULL,
 *   description text NOT NULL DEFAULT '',
 *   category text NOT NULL DEFAULT 'Ogólne',
 *   tags text[] NOT NULL DEFAULT '{}',
 *   thumbnail_url text NOT NULL DEFAULT '',
 *   created_at timestamptz NOT NULL DEFAULT now(),
 *   active boolean NOT NULL DEFAULT true
 * );
 * ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service_role_all" ON videos FOR ALL TO service_role USING (true);
 * CREATE POLICY "anon_select" ON videos FOR SELECT TO anon USING (active = true);
 */

import { NextRequest, NextResponse } from "next/server";
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

// Public endpoint — no auth required (used by the watch page)
export async function GET() {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { title, youtube_id, description, category, tags, thumbnail_url, active } = body;

  const { data, error } = await supabase
    .from("videos")
    .insert({
      title,
      youtube_id,
      description: description ?? "",
      category: category ?? "Ogólne",
      tags: tags ?? [],
      thumbnail_url: thumbnail_url ?? "",
      active: active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { id, title, youtube_id, description, category, tags, thumbnail_url, active } = body;
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const { data, error } = await supabase
    .from("videos")
    .update({ title, youtube_id, description, category, tags, thumbnail_url, active })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
