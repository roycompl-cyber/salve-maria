import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient, rateLimit } from "@/lib/security";

const CATEGORIES = ["billboard", "wolontariat", "demonstracja", "inne"];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Użytkownik: lista własnych zgłoszeń (z podpisanymi URL-ami)
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = adminClient();
  const { data, error } = await admin
    .from("campaign_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withUrls = await Promise.all((data ?? []).map(async (row) => {
    const { data: signed } = await admin.storage.from("campaign-photos").createSignedUrl(row.image_path, 3600);
    return { ...row, image_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json(withUrls);
}

// Użytkownik: wysyła nowe zdjęcie
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "campaign-photo-upload", limit: 10, windowMs: 60 * 60_000 });
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Musisz być zalogowany" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });

  const file = form.get("file");
  const category = String(form.get("category") ?? "inne");
  const caption = String(form.get("caption") ?? "").slice(0, 500);

  if (!(file instanceof File)) return NextResponse.json({ error: "Brak zdjęcia" }, { status: 400 });
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: "Nieprawidłowa kategoria" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Plik jest za duży (max 8MB)" }, { status: 400 });
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "Dozwolone formaty: JPG, PNG, WEBP" }, { status: 400 });

  const admin = adminClient();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from("campaign-photos").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data, error } = await admin
    .from("campaign_photos")
    .insert({ user_id: user.id, image_path: path, category, caption: caption || null, status: "pending" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
