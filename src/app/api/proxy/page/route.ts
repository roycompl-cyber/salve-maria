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
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const hostname = parsed.hostname.replace(/^www\./, "");
  if (!ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: "Forbidden host" }, { status: 403 });
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
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") ?? "text/html";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "Not HTML" }, { status: 415 });
    }

    const html = await res.text();
    const base = `${parsed.protocol}//${parsed.host}`;

    function toAbsolute(href: string): string {
      if (!href) return href;
      if (/^https?:\/\//.test(href)) return href;
      if (href.startsWith("//")) return `${parsed.protocol}${href}`;
      if (href.startsWith("/")) return `${base}${href}`;
      return `${base}/${href}`;
    }

    // Zewnętrzne arkusze CSS z <head>
    const cssLinks: string[] = [];
    const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
    for (const m of html.matchAll(linkRe)) {
      const hrefM = m[0].match(/href=["']([^"']+)["']/);
      if (hrefM) cssLinks.push(toAbsolute(hrefM[1]));
    }

    // Inline <style> bloki
    const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    const styles = styleMatches.map(m => m[1]).join("\n");

    // Treść <body>
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let body = bodyMatch ? bodyMatch[1] : html;

    // Przepisz relatywne src/href na absolutne
    body = body
      .replace(/(src|href)="(\/(?!\/))/g, `$1="${base}/`)
      .replace(/(src|href)="(?!https?:|\/\/|#|mailto:|tel:|data:|javascript:)([^"]+)"/g,
        (_, attr, path) => `${attr}="${base}/${path}"`);

    // Usuń skrypty
    body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
    // Usuń inline event handlery
    body = body.replace(/\s+on\w+="[^"]*"/gi, "");

    return NextResponse.json({ body, styles, cssLinks, base });
  } catch (e) {
    return NextResponse.json({ error: "Fetch failed: " + String(e) }, { status: 502 });
  }
}
