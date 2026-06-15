import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/security";

const ALLOWED_HOST = "polskakatolicka.org";

/** Przekierowuje na zewnętrzny URL polskakatolicka.org z danymi profilu usera.
 *  Sesja czytana server-side — nie potrzeba przekazywać danych przez klienta. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirect = searchParams.get("redirect") ?? "";

  let target: URL;
  try {
    target = new URL(redirect);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!target.hostname.endsWith(ALLOWED_HOST)) {
    return NextResponse.json({ error: "Forbidden host" }, { status: 403 });
  }

  // Pobierz dane profilu z sesji (server-side)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await adminClient()
        .from("profiles")
        .select("first_name, last_name, phone, street, house_no, postal, city")
        .eq("id", user.id)
        .single();

      if (profile) {
        const fields: Record<string, string> = {
          name:     profile.first_name ?? "",
          surname:  profile.last_name  ?? "",
          email:    user.email         ?? "",
          phone:    profile.phone      ?? "",
          address2: profile.street     ?? "",
          address3: profile.house_no   ?? "",
          postal:   profile.postal     ?? "",
          city:     profile.city       ?? "",
        };
        for (const [k, v] of Object.entries(fields)) {
          if (v) target.searchParams.set(k, v);
        }
      }
    }
  } catch { /* brak sesji — przekieruj bez danych */ }

  return NextResponse.redirect(target.toString(), 302);
}
