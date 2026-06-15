import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOST = "polskakatolicka.org";

/** Przekierowuje na zewnętrzny URL polskakatolicka.org z danymi usera jako query params.
 *  Używany gdy artykuł/petycja zawiera link do formularza na stronie zewnętrznej. */
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const redirect = searchParams.get("redirect") ?? "";

  // Bezpieczeństwo — tylko polskakatolicka.org
  let target: URL;
  try {
    target = new URL(redirect);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (!target.hostname.endsWith(ALLOWED_HOST)) {
    return NextResponse.json({ error: "Forbidden host" }, { status: 403 });
  }

  // Dołącz dane usera do URL docelowego (pola formularza polskakatolicka.org)
  const fields: Record<string, string> = {
    name:     searchParams.get("name")     ?? "",
    surname:  searchParams.get("surname")  ?? "",
    email:    searchParams.get("email")    ?? "",
    phone:    searchParams.get("phone")    ?? "",
    address2: searchParams.get("address2") ?? "",
    address3: searchParams.get("address3") ?? "",
    postal:   searchParams.get("postal")   ?? "",
    city:     searchParams.get("city")     ?? "",
  };

  for (const [k, v] of Object.entries(fields)) {
    if (v) target.searchParams.set(k, v);
  }

  return NextResponse.redirect(target.toString(), 302);
}
