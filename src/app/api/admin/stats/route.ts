import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? supabase : null;
}

export async function GET() {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const [{ count: users }, { count: push }, { count: prayers }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("push_subscriptions").select("*", { count: "exact", head: true }),
    supabase.from("prayers").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({ users: users ?? 0, push: push ?? 0, prayers: prayers ?? 0 });
}
