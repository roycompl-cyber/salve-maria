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

export async function GET() {
  const db = adminClient();

  const { data: cached } = await db
    .from("content_cache")
    .select("data, updated_at")
    .eq("key", CACHE_KEY)
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.updated_at).getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }
  }

  try {
    const petitions = await fetchPetitionList();
    await db.from("content_cache").upsert({
      key: CACHE_KEY,
      data: petitions,
      updated_at: new Date().toISOString(),
    });
    return NextResponse.json(petitions);
  } catch (e) {
    if (cached) return NextResponse.json(cached.data);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
