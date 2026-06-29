import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/security";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("cat");

  const admin = adminClient();
  let query = admin.from("campaign_photos").select("id, category, caption, created_at, image_path").eq("status", "approved").order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withUrls = await Promise.all((data ?? []).map(async (row) => {
    const { data: signed } = await admin.storage.from("campaign-photos").createSignedUrl(row.image_path, 7200);
    return { ...row, image_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json(withUrls, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
  });
}
