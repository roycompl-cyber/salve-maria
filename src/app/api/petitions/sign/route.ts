import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE = "http://polskakatolicka.org";

/** Fetch hidden field values from petition page */
async function getPetitionMeta(slug: string) {
  const res = await fetch(`${BASE}/pl/petycje/${slug}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  function hidden(name: string) {
    const m = html.match(new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "i")) ||
              html.match(new RegExp(`name='${name}'[^>]*value='([^']*)'`, "i"));
    return m?.[1] ?? "";
  }

  return {
    id: hidden("id"),
    url: hidden("url"),
    operation: hidden("operation"),
    check_spam: hidden("check_spam") || "1",
    field_set_name: hidden("field_set[name]") || "1",
    field_set_surname: hidden("field_set[surname]") || "1",
    field_set_email: hidden("field_set[email]") || "1",
    field_set_phone: hidden("field_set[phone_mobile]") || "0",
    field_set_address2: hidden("field_set[address2]") || "0",
    field_set_address3: hidden("field_set[address3]") || "0",
    field_set_postal: hidden("field_set[postal]") || "0",
    field_set_city: hidden("field_set[city]") || "0",
  };
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, name, surname, email, phone, address2, address3, postal, city } = body;

  if (!slug || !name || !surname || !email) {
    return NextResponse.json({ error: "Brak wymaganych pól" }, { status: 400 });
  }

  // Get hidden fields from petition page
  const meta = await getPetitionMeta(slug);
  if (!meta.id) {
    return NextResponse.json({ error: "Nie znaleziono petycji" }, { status: 404 });
  }

  // Build POST body
  const params = new URLSearchParams({
    id: meta.id,
    url: meta.url,
    operation: meta.operation,
    check_spam: meta.check_spam,
    "field_set[name]": meta.field_set_name,
    "field[name]": name,
    "field_set[surname]": meta.field_set_surname,
    "field[surname]": surname,
    "field_set[email]": meta.field_set_email,
    "field[email]": email,
    "field_set[phone_mobile]": meta.field_set_phone,
    "field[phone_mobile]": phone ?? "",
    "field_set[address2]": meta.field_set_address2,
    "field[address2]": address2 ?? "",
    "field_set[address3]": meta.field_set_address3,
    "field[address3]": address3 ?? "",
    "field_set[postal]": meta.field_set_postal,
    "field[postal]": postal ?? "",
    "field_set[city]": meta.field_set_city,
    "field[city]": city ?? "",
    start: "Wyślij petycję",
  });

  const response = await fetch(`${BASE}/pl/petycje/${slug}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0",
      "Referer": `${BASE}/pl/petycje/${slug}`,
    },
    body: params.toString(),
    redirect: "follow",
  });

  const html = await response.text();

  // Check for success indicators in response
  const success =
    html.includes("Dziękujemy") ||
    html.includes("dziękujemy") ||
    html.includes("podpisana") ||
    html.includes("success") ||
    response.url.includes("podziekowanie") ||
    response.url.includes("dziekujemy") ||
    response.status === 200;

  const alreadySigned =
    html.includes("już podpisał") ||
    html.includes("już podpisana") ||
    html.includes("podpisałeś");

  if (alreadySigned) {
    return NextResponse.json({ ok: false, error: "Petycja została już przez Ciebie podpisana." });
  }

  return NextResponse.json({ ok: success });
}
