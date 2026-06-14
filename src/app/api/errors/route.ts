import { NextRequest, NextResponse } from "next/server";
import { adminClient, rateLimit } from "@/lib/security";
import { sanitizeErrorReport, type ClientErrorReport } from "@/lib/error-monitoring";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "errors", limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const report = sanitizeErrorReport(await req.json().catch(() => null));
  if (!report) return NextResponse.json({ error: "Nieprawidłowy raport" }, { status: 400 });

  const supabase = adminClient();
  const { data: existing } = await supabase
    .from("content_cache")
    .select("data")
    .eq("key", "error_log")
    .single();

  const current = Array.isArray(existing?.data) ? existing.data as ClientErrorReport[] : [];
  const next = [report, ...current].slice(0, 100);
  const { error } = await supabase.from("content_cache").upsert(
    { key: "error_log", data: next, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  if (error) return NextResponse.json({ error: "Nie udało się zapisać raportu" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
