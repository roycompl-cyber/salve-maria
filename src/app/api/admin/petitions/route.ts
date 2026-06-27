/*
 * SQL for manual petitions table (run in Supabase SQL editor):
 *
 * CREATE TABLE IF NOT EXISTS manual_petitions (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   title text NOT NULL,
 *   content text NOT NULL DEFAULT '',
 *   excerpt text NOT NULL DEFAULT '',
 *   image_url text NOT NULL DEFAULT '',
 *   source_url text NOT NULL DEFAULT '',
 *   signature_count integer NOT NULL DEFAULT 0,
 *   notification_threshold integer NOT NULL DEFAULT 10000,
 *   active boolean NOT NULL DEFAULT true,
 *   manual boolean NOT NULL DEFAULT true,
 *   slug text UNIQUE,
 *   created_at timestamptz NOT NULL DEFAULT now()
 * );
 * ALTER TABLE manual_petitions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "service_role_all" ON manual_petitions FOR ALL TO service_role USING (true);
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
    .from("manual_petitions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { title, content, excerpt, image_url, source_url, signature_count, notification_threshold, active } = body;
  if (!title) return NextResponse.json({ error: "Tytuł jest wymagany" }, { status: 400 });

  const slug = slugify(title);

  const { data, error } = await supabase
    .from("manual_petitions")
    .insert({
      title,
      content: content ?? "",
      excerpt: excerpt ?? "",
      image_url: image_url ?? "",
      source_url: source_url ?? "",
      signature_count: signature_count ?? 0,
      notification_threshold: notification_threshold ?? 10000,
      active: active ?? true,
      manual: true,
      slug,
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
  const { id, title, content, excerpt, image_url, source_url, signature_count, notification_threshold, active } = body;
  if (!id) return NextResponse.json({ error: "ID jest wymagane" }, { status: 400 });

  const { data, error } = await supabase
    .from("manual_petitions")
    .update({ title, content, excerpt, image_url, source_url, signature_count, notification_threshold, active })
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

  const { error } = await supabase.from("manual_petitions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
