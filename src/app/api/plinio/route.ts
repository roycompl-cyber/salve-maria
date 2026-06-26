import { NextResponse } from "next/server";
import { getQuoteForDay } from "@/lib/plinio-quotes";
import { warsawParts } from "@/lib/security";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function dayOfYear(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(year, 0, 0);
  const date = new Date(year, month - 1, day);
  return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

async function getSetting(key: string) {
  try {
    const db = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await db.from("app_settings").select("value").eq("key", key).single();
    if (!data?.value) return null;
    return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
  } catch { return null; }
}

export async function GET() {
  const { date } = warsawParts();
  const day = dayOfYear(date);
  const base = getQuoteForDay(day);
  const [overrides, config] = await Promise.all([
    getSetting("plinio_quote_overrides"),
    getSetting("plinio_config"),
  ]);
  const override = (overrides ?? {})[day];
  return NextResponse.json({
    ...base,
    ...(override ? { quote: override.quote, source: override.source } : {}),
    date,
    config: config ?? {},
  });
}
