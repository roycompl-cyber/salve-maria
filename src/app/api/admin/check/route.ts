import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/security";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ admin: false }, { status: 401 });

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = await getEffectiveRole(user.id, data?.role);
  const admin = role === "admin" || role === "superadmin";
  return NextResponse.json({ admin, role });
}
