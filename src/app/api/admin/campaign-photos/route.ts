import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security";
import { adminClient } from "@/lib/security";

// Admin: lista wszystkich zgłoszeń (z podpisanymi URL-ami i danymi zgłaszającego)
export async function GET() {
  const ctx = await requireAdmin();
  if (!ctx) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const admin = adminClient();
  const { data, error } = await admin
    .from("campaign_photos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = Array.from(new Set((data ?? []).map(r => r.user_id).filter(Boolean)));
  const { data: profiles } = userIds.length
    ? await admin.from("profiles").select("id, first_name, last_name").in("id", userIds)
    : { data: [] as { id: string; first_name: string | null; last_name: string | null }[] };
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));

  const withUrls = await Promise.all((data ?? []).map(async (row) => {
    const { data: signed } = await admin.storage.from("campaign-photos").createSignedUrl(row.image_path, 3600);
    const p = profileMap[row.user_id];
    return {
      ...row,
      image_url: signed?.signedUrl ?? null,
      submitter_name: p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || null : null,
    };
  }));

  return NextResponse.json(withUrls);
}
