import { NextRequest, NextResponse } from "next/server";

const DEFAULT_DONATION_URL = "https://polskakatolicka.org/pl/wplata-na-kampanie?payment=4631d9866d1c0f17d328b28a50f102";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function hi(name: string, value: string) {
  return `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`;
}

/** Fetch id_campaign and form action from the donation page */
async function getDonationMeta(donationUrl: string) {
  try {
    const res = await fetch(donationUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const actionM = html.match(/<form[^>]+action="([^"]+)"/);
    const idM = html.match(/name="id_campaign"\s+value="([^"]+)"/);
    return {
      action: actionM?.[1] ? `https://polskakatolicka.org${actionM[1]}` : donationUrl,
      id_campaign: idM?.[1] ?? "",
    };
  } catch {
    return { action: donationUrl, id_campaign: "" };
  }
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const donationUrl = sp.get("donation_url") || DEFAULT_DONATION_URL;
  const amount = sp.get("amount") ?? "90";
  const name = sp.get("name") ?? "";
  const surname = sp.get("surname") ?? "";
  const email = sp.get("email") ?? "";
  const phone = sp.get("phone") ?? "";
  const address2 = sp.get("address2") ?? "";
  const address3 = sp.get("address3") ?? "";
  const postal = sp.get("postal") ?? "";
  const city = sp.get("city") ?? "";

  const meta = await getDonationMeta(donationUrl);

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Przekierowanie do płatności…</title>
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
  <p>Przekierowanie do płatności…</p>
  <form id="f" method="POST" action="${esc(meta.action)}">
    ${hi("from_url", "1")}
    ${meta.id_campaign ? hi("id_campaign", meta.id_campaign) : ""}
    ${hi("operation", "")}
    ${hi("payment_value", amount)}
    ${hi("payment_type", "single")}
    ${hi("name", name)}
    ${hi("surname", surname)}
    ${hi("email", email)}
    ${hi("phone_mobile", phone)}
    ${hi("address2", address2)}
    ${hi("address3", address3)}
    ${hi("postal", postal)}
    ${hi("city", city)}
    ${hi("_zgody[zgoda_check][]", "9")}
    ${hi("_zgody[zgoda_all][]", "9")}
    ${hi("_zgody[zgoda][9]", "1")}
    ${hi("_zgody[zgoda_all][]", "12")}
    ${hi("_zgody[zgoda][12]", "1")}
    ${hi("start", "Wspieram i wpłacam")}
  </form>
  <script>document.getElementById('f').submit();</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
