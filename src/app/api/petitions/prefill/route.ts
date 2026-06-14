import { NextRequest, NextResponse } from "next/server";

const BASE = "https://polskakatolicka.org";

async function getPetitionMeta(slug: string) {
  const res = await fetch(`${BASE}/pl/petycje/${slug}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const html = await res.text();

  function hidden(name: string) {
    const escaped = name.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
    const m =
      html.match(new RegExp(`name="${escaped}"[^>]*value="([^"]*)"`, "i")) ||
      html.match(new RegExp(`name='${escaped}'[^>]*value='([^']*)'`, "i")) ||
      html.match(new RegExp(`value="([^"]*)"[^>]*name="${escaped}"`, "i"));
    return m?.[1] ?? "";
  }

  return {
    id: hidden("id"),
    url: hidden("url"),
    operation: hidden("operation"),
    check_spam: hidden("check_spam") || "1",
    fs_name: hidden("field_set[name]") || "1",
    fs_surname: hidden("field_set[surname]") || "1",
    fs_email: hidden("field_set[email]") || "1",
    fs_phone: hidden("field_set[phone_mobile]") || "0",
    fs_address2: hidden("field_set[address2]") || "0",
    fs_address3: hidden("field_set[address3]") || "0",
    fs_postal: hidden("field_set[postal]") || "0",
    fs_city: hidden("field_set[city]") || "0",
  };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function hiddenInput(name: string, value: string) {
  return `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug") ?? "";
  const name = searchParams.get("name") ?? "";
  const surname = searchParams.get("surname") ?? "";
  const email = searchParams.get("email") ?? "";
  const phone = searchParams.get("phone") ?? "";
  const address2 = searchParams.get("address2") ?? "";
  const address3 = searchParams.get("address3") ?? "";
  const postal = searchParams.get("postal") ?? "";
  const city = searchParams.get("city") ?? "";

  if (!slug) {
    return new NextResponse("Brak slug", { status: 400 });
  }

  const meta = await getPetitionMeta(slug);

  const action = `${BASE}/pl/petycje/${encodeURIComponent(slug)}`;

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Podpisywanie petycji…</title>
<style>
  body { font-family: Georgia, serif; background: #0f172a; color: #94a3b8;
         display: flex; flex-direction: column; align-items: center;
         justify-content: center; min-height: 100vh; margin: 0; gap: 16px; }
  p { font-size: 15px; }
  .spinner { width: 36px; height: 36px; border: 3px solid #334155;
             border-top-color: #d97706; border-radius: 50%;
             animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="spinner"></div>
  <p>Przekazywanie podpisu…</p>
  <form id="f" method="POST" action="${esc(action)}">
    ${hiddenInput("id", meta.id)}
    ${hiddenInput("url", meta.url)}
    ${hiddenInput("operation", meta.operation)}
    ${hiddenInput("check_spam", meta.check_spam)}
    ${hiddenInput("field_set[name]", meta.fs_name)}
    ${hiddenInput("field[name]", name)}
    ${hiddenInput("field_set[surname]", meta.fs_surname)}
    ${hiddenInput("field[surname]", surname)}
    ${hiddenInput("field_set[email]", meta.fs_email)}
    ${hiddenInput("field[email]", email)}
    ${hiddenInput("field_set[phone_mobile]", meta.fs_phone)}
    ${hiddenInput("field[phone_mobile]", phone)}
    ${hiddenInput("field_set[address2]", meta.fs_address2)}
    ${hiddenInput("field[address2]", address2)}
    ${hiddenInput("field_set[address3]", meta.fs_address3)}
    ${hiddenInput("field[address3]", address3)}
    ${hiddenInput("field_set[postal]", meta.fs_postal)}
    ${hiddenInput("field[postal]", postal)}
    ${hiddenInput("field_set[city]", meta.fs_city)}
    ${hiddenInput("field[city]", city)}
    ${hiddenInput("start", "Wyślij petycję")}
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
