import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, getEffectiveRole } from "@/lib/security";

async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = await getEffectiveRole(user.id, data?.role);
  return role === "superadmin" ? user : null;
}

async function getMembers(): Promise<Record<string, string[]>> {
  const { data } = await adminClient().from("app_settings").select("value").eq("key", "admin_group_members").single();
  try { return JSON.parse(data?.value ?? "{}"); } catch { return {}; }
}

async function saveMembers(members: Record<string, string[]>) {
  await adminClient().from("app_settings").upsert(
    { key: "admin_group_members", value: JSON.stringify(members), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

export async function POST(req: NextRequest) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { groupId, userId } = await req.json() as { groupId: string; userId: string };
  if (!groupId || !userId) return NextResponse.json({ error: "Brak parametrów" }, { status: 400 });

  const members = await getMembers();
  if (!members[groupId]) members[groupId] = [];
  if (!members[groupId].includes(userId)) members[groupId].push(userId);
  await saveMembers(members);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await requireSuperadmin();
  if (!user) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { groupId, userId } = await req.json() as { groupId: string; userId: string };
  if (!groupId || !userId) return NextResponse.json({ error: "Brak parametrów" }, { status: 400 });

  const members = await getMembers();
  if (members[groupId]) members[groupId] = members[groupId].filter(id => id !== userId);
  await saveMembers(members);
  return NextResponse.json({ ok: true });
}
