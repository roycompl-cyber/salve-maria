import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isLastAdmin } from "@/lib/security";

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

const VALID_ROLES = ["admin", "donor"] as const;
type Role = (typeof VALID_ROLES)[number];

interface UpdateBody {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  street?: string;
  house_no?: string;
  postal?: string;
  role?: Role;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  const body = await req.json() as UpdateBody;

  const updateData: Partial<UpdateBody> = { ...body };
  if (updateData.role !== undefined && !VALID_ROLES.includes(updateData.role)) {
    delete updateData.role;
  }
  if (updateData.role === "donor" && await isLastAdmin(id)) {
    return NextResponse.json({ error: "Nie można zdegradować ostatniego administratora" }, { status: 409 });
  }

  const admin = adminClient();
  const { data, error } = await admin
    .from("profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await requireAdmin();
  if (!supabase) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const { id } = await params;
  if (await isLastAdmin(id)) {
    return NextResponse.json({ error: "Nie można usunąć ostatniego administratora" }, { status: 409 });
  }
  const admin = adminClient();

  await admin.from("profiles").delete().eq("id", id);
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
