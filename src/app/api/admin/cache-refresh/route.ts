import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin";
}

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  revalidatePath("/articles");
  revalidatePath("/petitions");
  revalidatePath("/api/articles");
  revalidatePath("/api/petitions");

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
