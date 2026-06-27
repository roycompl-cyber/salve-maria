/*
 * SQL for manual articles table (run in Supabase SQL editor):
 *
 * CREATE TABLE IF NOT EXISTS manual_articles (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title text NOT NULL,
 *   content text NOT NULL DEFAULT '',
 *   excerpt text NOT NULL DEFAULT '',
 *   category text NOT NULL DEFAULT 'Ogólne',
 *   image_url text NOT NULL DEFAULT '',
 *   author text NOT NULL DEFAULT 'Redakcja',
 *   published_at timestamptz NOT NULL DEFAULT now(),
 *   slug text UNIQUE,
 *   manual boolean NOT NULL DEFAULT true,
 *   created_at timestamptz NOT NULL DEFAULT now()
 * );
 * ALTER TABLE manual_articles ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service_role_all" ON manual_articles FOR ALL TO service_role USING (true);
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
  return data?.role === "admin" ? supabase : null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("manual_articles")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { title, content, excerpt, category, image_url, author, published_at } = body;
  if (!title) return NextResponse.json({ error: "Tytuł jest wymagany" }, { status: 400 });

  const slug = slugify(title);

  const { data, error } = await supabase
    .from("manual_articles")
    .insert({
      title,
      content: content ?? "",
      excerpt: excerpt ?? "",
      category: category ?? "Ogólne",
      image_url: image_url ?? "",
      author: author ?? "Redakcja",
      published_at: published_at ?? new Date().toISOString(),
      slug,
      manual: true,
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
  const { id, title, content, excerpt, category, image_url, author, published_at } = body;
  if (!id) return NextResponse.json({ error: "ID jest wymagane" }, { status: 400 });

  const { data, error } = await supabase
    .from("manual_articles")
    .update({ title, content, excerpt, category, image_url, author, published_at })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID jest wymagane" }, { status: 400 });

  const { error } = await supabase.from("manual_articles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
