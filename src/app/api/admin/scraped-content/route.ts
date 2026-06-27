/*
 * Manages display order and visibility of scraped articles/petitions.
 * Metadata stored in content_cache under keys:
 *   "articles_meta"  — { order: string[], hidden: string[] }
 *   "petitions_meta" — { order: string[], hidden: string[] }
 *
 * `order` = array of slugs/ids in desired display order
 * `hidden` = array of slugs/ids to exclude from user view
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
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" || data?.role === "superadmin";
}

type ContentType = "articles" | "petitions" | "videos";
type Meta = { order: string[]; hidden: string[] };

function metaKey(type: ContentType): string {
  return `${type}_meta`;
}

// GET /api/admin/scraped-content?type=articles
// Returns { items: ScrapedItem[], meta: Meta }
export async function GET(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") as ContentType | null;
  if (type !== "articles" && type !== "petitions" && type !== "videos")
    return NextResponse.json({ error: "Nieprawidłowy typ" }, { status: 400 });

  const db = adminClient();

  // For videos, fetch from DB instead of content_cache
  if (type === "videos") {
    const { data: vids } = await db.from("videos").select("*").order("created_at", { ascending: false });
    const { data: metaCached } = await db.from("content_cache").select("data").eq("key", "videos_meta").single();
    const meta: Meta = (metaCached?.data as Meta) ?? { order: [], hidden: [] };
    const items: Record<string, unknown>[] = Array.isArray(vids) ? vids as unknown as Record<string, unknown>[] : [];
    const keyOf = (item: Record<string, unknown>) => (item.id as string) || "";
    const ordered = [...items].sort((a, b) => {
      const ai = meta.order.indexOf(keyOf(a));
      const bi = meta.order.indexOf(keyOf(b));
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    return NextResponse.json({ items: ordered, meta });
  }

  // Fetch scraped items from cache
  const { data: cached } = await db
    .from("content_cache")
    .select("data")
    .eq("key", type)
    .single();

  // Fetch meta
  const { data: metaCached } = await db
    .from("content_cache")
    .select("data")
    .eq("key", metaKey(type))
    .single();

  const items: Record<string, unknown>[] = Array.isArray(cached?.data) ? cached.data : [];
  const meta: Meta = (metaCached?.data as Meta) ?? { order: [], hidden: [] };

  // Apply order: items present in meta.order come first (in that order), rest appended
  const keyOf = (item: Record<string, unknown>) =>
    (item.slug as string) || (item.id as string) || (item.url as string) || "";

  const ordered = [...items].sort((a, b) => {
    const ai = meta.order.indexOf(keyOf(a));
    const bi = meta.order.indexOf(keyOf(b));
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return NextResponse.json({ items: ordered, meta });
}

// PUT /api/admin/scraped-content
// Body: { type: "articles"|"petitions", order?: string[], hidden?: string[] }
export async function PUT(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json();
  const { type, order, hidden } = body as { type: ContentType; order?: string[]; hidden?: string[] };

  if (type !== "articles" && type !== "petitions" && type !== "videos")
    return NextResponse.json({ error: "Nieprawidłowy typ" }, { status: 400 });

  const db = adminClient();

  // Load existing meta to do a partial update
  const { data: existing } = await db
    .from("content_cache")
    .select("data")
    .eq("key", metaKey(type))
    .single();

  const current: Meta = (existing?.data as Meta) ?? { order: [], hidden: [] };
  const updated: Meta = {
    order: order ?? current.order,
    hidden: hidden ?? current.hidden,
  };

  const { error } = await db.from("content_cache").upsert({
    key: metaKey(type),
    data: updated,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, meta: updated });
}
