import { NextResponse } from "next/server";
import { adminClient, requireAdmin } from "@/lib/security";

export async function DELETE() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });
  }

  const { error } = await adminClient()
    .from("content_cache")
    .upsert(
      { key: "error_log", data: [], updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) return NextResponse.json({ error: "Nie udało się wyczyścić rejestru" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
