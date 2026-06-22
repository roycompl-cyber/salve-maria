import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

interface TileOverride {
  label?: string;
  sublabel?: string;
  color?: string;
  accent?: string;
  textColor?: string;
  hidden?: boolean;
  order?: number;
}
type TilesConfig = Record<string, TileOverride>;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Znane identyfikatory modułów — odrzucamy wszystko inne (np. numeryczne klucze z corrupt danych)
const VALID_MODS = new Set(["prayers","gospel","catechism","petitions","articles","announcements","chat","reminders","savoir","about","watch","book","plinio","_page"]);

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "tiles_config")
    .single();

  if (!data?.value) return NextResponse.json({});

  try {
    const raw = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    // Odfiltruj klucze które nie są nazwami modułów
    const clean: TilesConfig = Object.fromEntries(
      Object.entries(raw as TilesConfig).filter(([k]) => VALID_MODS.has(k))
    );
    return NextResponse.json(clean);
  } catch {
    return NextResponse.json({});
  }
}

export async function POST(req: NextRequest) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const body = await req.json() as TilesConfig;
  const admin = adminClient();

  await admin.from("app_settings").upsert(
    { key: "tiles_config", value: JSON.stringify(body), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  return NextResponse.json({ ok: true });
}
