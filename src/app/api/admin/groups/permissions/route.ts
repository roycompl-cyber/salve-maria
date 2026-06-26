import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, getEffectiveRole } from "@/lib/security";
import { ALL_TILE_KEYS } from "@/lib/admin-permissions";

async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = await getEffectiveRole(user.id, data?.role);
  return role === "superadmin" ? user : null;
}

export async function POST(req: NextRequest) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { groupId, tiles } = await req.json() as { groupId: string; tiles: string[] };
  if (!groupId || !Array.isArray(tiles)) return NextResponse.json({ error: "Brak parametrów" }, { status: 400 });

  // Validate tile keys
  const validTiles = tiles.filter(t => (ALL_TILE_KEYS as readonly string[]).includes(t));

  const admin = adminClient();
  const { data } = await admin.from("app_settings").select("value").eq("key", "admin_tile_permissions").single();
  let permissions: Record<string, string[]> = {};
  try { permissions = JSON.parse(data?.value ?? "{}"); } catch { /* ignore */ }

  permissions[groupId] = validTiles;

  await admin.from("app_settings").upsert(
    { key: "admin_tile_permissions", value: JSON.stringify(permissions), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  return NextResponse.json({ ok: true });
}
