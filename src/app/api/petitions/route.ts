import { NextResponse } from "next/server";
import { fetchPetitionList } from "@/lib/polskakatolicka";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const CACHE_KEY = "petitions";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type Meta = { order: string[]; hidden: string[] };

function applyMeta(items: Record<string, unknown>[], meta: Meta): Record<string, unknown>[] {
  const keyOf = (item: Record<string, unknown>) =>
    (item.slug as string) || (item.id as string) || (item.url as string) || "";

  const visible = items.filter(i => !meta.hidden.includes(keyOf(i)));

  if (meta.order.length === 0) return visible;

  return [...visible].sort((a, b) => {
    const ai = meta.order.indexOf(keyOf(a));
    const bi = meta.order.indexOf(keyOf(b));
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

async function getSourceUrl(): Promise<string | undefined> {
  try {
    const db = adminClient();
    const { data } = await db.from("content_cache").select("data").eq("key", "source_config").single();
    return (data?.data as { petitions_url?: string })?.petitions_url;
  } catch { return undefined; }
}

export async function GET() {
  const db = adminClient();

  const [{ data: cached }, { data: metaCached }] = await Promise.all([
    db.from("content_cache").select("data, updated_at").eq("key", CACHE_KEY).single(),
    db.from("content_cache").select("data").eq("key", "petitions_meta").single(),
  ]);

  const meta: Meta = (metaCached?.data as Meta) ?? { order: [], hidden: [] };

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(applyMeta(cached.data as Record<string, unknown>[], meta));
    }
  }

  try {
    const sourceUrl = await getSourceUrl();
    const petitions = await fetchPetitionList(sourceUrl);
    await db.from("content_cache").upsert({
      key: CACHE_KEY,
      data: petitions,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(applyMeta(petitions as unknown as Record<string, unknown>[], meta));
  } catch (e) {
    if (cached) return NextResponse.json(applyMeta(cached.data as Record<string, unknown>[], meta));
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
