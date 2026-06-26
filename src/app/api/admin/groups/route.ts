import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, getEffectiveRole } from "@/lib/security";
import type { AdminGroup } from "@/lib/admin-permissions";

async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = await getEffectiveRole(user.id, data?.role);
  return role === "superadmin" ? user : null;
}

async function getGroupsData() {
  const admin = adminClient();
  const [g, m, p] = await Promise.all([
    admin.from("app_settings").select("value").eq("key", "admin_groups").single(),
    admin.from("app_settings").select("value").eq("key", "admin_group_members").single(),
    admin.from("app_settings").select("value").eq("key", "admin_tile_permissions").single(),
  ]);
  const groups: AdminGroup[] = (() => { try { return JSON.parse(g.data?.value ?? "[]"); } catch { return []; } })();
  const members: Record<string, string[]> = (() => { try { return JSON.parse(m.data?.value ?? "{}"); } catch { return {}; } })();
  const permissions: Record<string, string[]> = (() => { try { return JSON.parse(p.data?.value ?? "{}"); } catch { return {}; } })();
  return { groups, members, permissions };
}

async function saveGroups(groups: AdminGroup[]) {
  await adminClient().from("app_settings").upsert(
    { key: "admin_groups", value: JSON.stringify(groups), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

export async function GET() {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  const data = await getGroupsData();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { name, description } = await req.json() as { name: string; description?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Nazwa jest wymagana" }, { status: 400 });

  const { groups } = await getGroupsData();
  const newGroup: AdminGroup = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description?.trim(),
  };
  groups.push(newGroup);
  await saveGroups(groups);
  return NextResponse.json({ ok: true, group: newGroup });
}

export async function PATCH(req: NextRequest) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id, name, description } = await req.json() as { id: string; name?: string; description?: string };
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const { groups } = await getGroupsData();
  const idx = groups.findIndex(g => g.id === id);
  if (idx === -1) return NextResponse.json({ error: "Nie znaleziono grupy" }, { status: 404 });

  if (name !== undefined) groups[idx].name = name.trim();
  if (description !== undefined) groups[idx].description = description.trim();
  await saveGroups(groups);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await req.json() as { id: string };
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const { groups, members, permissions } = await getGroupsData();
  const filtered = groups.filter(g => g.id !== id);
  delete members[id];
  delete permissions[id];

  const admin = adminClient();
  await Promise.all([
    admin.from("app_settings").upsert({ key: "admin_groups", value: JSON.stringify(filtered), updated_at: new Date().toISOString() }, { onConflict: "key" }),
    admin.from("app_settings").upsert({ key: "admin_group_members", value: JSON.stringify(members), updated_at: new Date().toISOString() }, { onConflict: "key" }),
    admin.from("app_settings").upsert({ key: "admin_tile_permissions", value: JSON.stringify(permissions), updated_at: new Date().toISOString() }, { onConflict: "key" }),
  ]);
  return NextResponse.json({ ok: true });
}
