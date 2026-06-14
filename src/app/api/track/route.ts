import { NextRequest, NextResponse } from "next/server";
import { adminClient, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "track", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  try {
    const body = await req.json() as { path: string; title?: string };
    const { path, title } = body;

    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.length > 300 ||
      (title !== undefined && (typeof title !== "string" || title.length > 200))
    ) {
      return NextResponse.json({ ok: true });
    }

    const today = new Date().toISOString().slice(0, 10);
    const key = `stats_${today}`;
    const supabase = adminClient();

    const { data: existing } = await supabase
      .from("content_cache")
      .select("data")
      .eq("key", key)
      .single();

    const current = (existing?.data as Record<string, { count: number; title?: string }>) ?? {};
    const prev = current[path] ?? { count: 0 };
    current[path] = { count: prev.count + 1, title: title ?? prev.title ?? "" };

    await supabase.from("content_cache").upsert(
      { key, data: current, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  } catch {
    // never break the UX
  }

  return NextResponse.json({ ok: true });
}
