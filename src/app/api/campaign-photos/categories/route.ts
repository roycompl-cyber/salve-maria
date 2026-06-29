import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminClient } from "@/lib/security";

const DEFAULT_CATEGORIES = ["billboard", "wolontariat", "demonstracja", "inne"];
const SETTINGS_KEY = "campaign_photo_categories";

function parseCategories(raw: string | null | undefined): string[] {
  try { const parsed = JSON.parse(raw ?? ""); return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_CATEGORIES; }
  catch { return DEFAULT_CATEGORIES; }
}

export async function GET() {
  const { data } = await adminClient().from("app_settings").select("value").eq("key", SETTINGS_KEY).single();
  return NextResponse.json(parseCategories(data?.value));
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body) || body.length === 0 || body.some(c => typeof c !== "string" || !c.trim())) {
    return NextResponse.json({ error: "Nieprawidłowa lista kategorii" }, { status: 400 });
  }
  const categories = body.map((c: string) => c.trim());
  await adminClient().from("app_settings").upsert({ key: SETTINGS_KEY, value: JSON.stringify(categories), updated_at: new Date().toISOString() }, { onConflict: "key" });
  return NextResponse.json({ ok: true, categories });
}
