import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, getEffectiveRole } from "@/lib/security";
import { ALL_TILE_KEYS } from "@/lib/admin-permissions";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = await getEffectiveRole(user.id, profile?.role);

  if (role !== "admin" && role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "superadmin") {
    return NextResponse.json({ role, tiles: [...ALL_TILE_KEYS] });
  }

  // For regular admins: look up their groups and union tile permissions
  const admin = adminClient();
  const [membersRes, permissionsRes] = await Promise.all([
    admin.from("app_settings").select("value").eq("key", "admin_group_members").single(),
    admin.from("app_settings").select("value").eq("key", "admin_tile_permissions").single(),
  ]);

  let members: Record<string, string[]> = {};
  let permissions: Record<string, string[]> = {};
  try { members = JSON.parse(membersRes.data?.value ?? "{}"); } catch { /* ignore */ }
  try { permissions = JSON.parse(permissionsRes.data?.value ?? "{}"); } catch { /* ignore */ }

  // Find which groups this user belongs to
  const userGroups = Object.entries(members)
    .filter(([, userIds]) => userIds.includes(user.id))
    .map(([groupId]) => groupId);

  // Union of all tile permissions across those groups
  const tileSet = new Set<string>();
  for (const groupId of userGroups) {
    for (const tile of (permissions[groupId] ?? [])) {
      tileSet.add(tile);
    }
  }

  return NextResponse.json({ role, tiles: [...tileSet] });
}
