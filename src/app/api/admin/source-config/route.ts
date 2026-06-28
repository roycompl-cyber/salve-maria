import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { DEFAULT_SOURCE_CONFIG, type SourceConfig } from "@/lib/source-config";

const CACHE_KEY = "source_config";

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

export async function GET() {
  const db = adminClient();
  const { data } = await db.from("content_cache").select("data").eq("key", CACHE_KEY).single();
  const config: SourceConfig = { ...DEFAULT_SOURCE_CONFIG, ...(data?.data as Partial<SourceConfig> ?? {}) };
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const ok = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as Partial<SourceConfig>;
  const db = adminClient();

  const { data: existing } = await db.from("content_cache").select("data").eq("key", CACHE_KEY).single();
  const current: SourceConfig = { ...DEFAULT_SOURCE_CONFIG, ...(existing?.data as Partial<SourceConfig> ?? {}) };

  const updated: SourceConfig = {
    articles_url: body.articles_url?.trim() || current.articles_url,
    petitions_url: body.petitions_url?.trim() || current.petitions_url,
    videos_url: body.videos_url?.trim() || current.videos_url,
  };

  const { error } = await db.from("content_cache").upsert({
    key: CACHE_KEY,
    data: updated,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("content_cache").delete().in("key", ["articles", "petitions", "scraped_videos"]);

  return NextResponse.json({ success: true, config: updated });
}
