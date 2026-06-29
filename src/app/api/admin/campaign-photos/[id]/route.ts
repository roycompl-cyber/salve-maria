import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminClient } from "@/lib/security";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  if (!["approved", "rejected"].includes(body.status)) {
    return NextResponse.json({ error: "Nieprawidłowy status" }, { status: 400 });
  }

  const { error } = await adminClient()
    .from("campaign_photos")
    .update({ status: body.status, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  const { id } = await params;

  const admin = adminClient();
  const { data: row } = await admin.from("campaign_photos").select("image_path").eq("id", id).single();
  if (row?.image_path) await admin.storage.from("campaign-photos").remove([row.image_path]);

  const { error } = await admin.from("campaign_photos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
