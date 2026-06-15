import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/security";

const ALLOWED_HOSTS = ["polskakatolicka.org", "deon.pl"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url") ?? "";

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  const hostname = parsed.hostname.replace(/^www\./, "");
  if (!ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  // Dla polskakatolicka.org dołącz dane profilu usera jeśli zalogowany
  if (hostname === "polskakatolicka.org" || hostname.endsWith(".polskakatolicka.org")) {
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
            if (v) parsed.searchParams.set(k, v);
          }
        }
      }
    } catch { /* brak sesji */ }
  }

  try {
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pl-PL,pl;q=0.9",
      },
    });

    const contentType = res.headers.get("content-type") ?? "text/html";

    // Dla binarnych zasobów (obrazki, CSS, JS) przepuść bez modyfikacji
    if (!contentType.includes("text/html")) {
      const body = await res.arrayBuffer();
      return new NextResponse(body, {
        status: res.status,
        headers: { "content-type": contentType },
      });
    }

    let html = await res.text();
    const base = `${parsed.protocol}//${parsed.host}`;

    // Przepisz relatywne URL-e zasobów na absolutne
    html = html
      .replace(/(<(?:link|script|img|source)[^>]+(?:href|src)=")(\/)([^"]*")/gi,
        (_, pre, _slash, rest) => `${pre}${base}/${rest}`)
      .replace(/(<(?:link|script|img|source)[^>]+(?:href|src)=")((?!https?:|\/\/|data:)([^"]*)")/gi,
        (_, pre, path) => `${pre}${base}/${path}`);

    // Wstrzyknij <base> żeby relatywne linki działały
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}/">`);

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        // Brak X-Frame-Options i CSP — pozwala na osadzenie w iframe
      },
    });
  } catch (e) {
    return new NextResponse("Fetch failed: " + String(e), { status: 502 });
  }
}
