import { NextRequest, NextResponse } from "next/server";

const DEFAULT_DONATION_URL = "https://polskakatolicka.org/pl/wplata-na-kampanie?payment=4631d9866d1c0f17d328b28a50f102";
const ALLOWED_ORIGINS = new Set(["https://polskakatolicka.org", "https://www.polskakatolicka.org"]);

function safeDonationUrl(value: string) {
  try {
    const url = new URL(value);
    return ALLOWED_ORIGINS.has(url.origin) ? url.toString() : DEFAULT_DONATION_URL;
  } catch {
    return DEFAULT_DONATION_URL;
  }
}

async function getDonationMeta(donationUrl: string) {
  try {
    const res = await fetch(donationUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const actionM = html.match(/<form[^>]+action="([^"]+)"/);
    const idM = html.match(/name="id_campaign"\s+value="([^"]+)"/);
    return {
      action: actionM?.[1] ? new URL(actionM[1], donationUrl).toString() : donationUrl,
      id_campaign: idM?.[1] ?? "",
    };
  } catch {
    return { action: donationUrl, id_campaign: "" };
  }
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function hi(name: string, value: string) {
  return `<input type="hidden" name="${esc(name)}" value="${esc(value)}">`;
}
function fi(name: string, value: string, label: string, type = "text") {
  return `
    <div class="field">
      <label>${esc(label)}</label>
      <input type="${type}" name="${esc(name)}" value="${esc(value)}" placeholder="${esc(label)}" />
    </div>`;
}

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const donationUrl = safeDonationUrl(sp.get("donation_url") || DEFAULT_DONATION_URL);
  const name     = sp.get("name")     ?? "";
  const surname  = sp.get("surname")  ?? "";
  const email    = sp.get("email")    ?? "";
  const phone    = sp.get("phone")    ?? "";
  const address2 = sp.get("address2") ?? "";
  const address3 = sp.get("address3") ?? "";
  const postal   = sp.get("postal")   ?? "";
  const city     = sp.get("city")     ?? "";

  const meta = await getDonationMeta(donationUrl);

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Formularz wsparcia</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #0f172a; color: #e2d5b0; min-height: 100vh; }

  /* ── BANER POWROTU ── */
  #back-banner {
    position: fixed; top: 0; left: 0; right: 0; height: 52px; z-index: 2147483647;
    background: linear-gradient(180deg,#1e3a5f 0%,#152d4a 100%);
    border-bottom: 3px solid #0ea5e9;
    box-shadow: 0 3px 12px rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
  }
  #back-btn {
    background: linear-gradient(180deg,#facc15 0%,#d97706 100%);
    border: none; border-bottom: 3px solid #92400e; border-radius: 8px;
    padding: 8px 28px; font-size: 15px; font-weight: 700; color: #0f172a;
    font-family: Georgia, serif; cursor: pointer;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4);
    letter-spacing: 0.02em; user-select: none; -webkit-user-select: none;
    transition: transform 0.1s;
    text-decoration: none;
  }
  #back-btn:active { transform: translateY(2px); border-bottom-width: 1px; }

  /* ── FORM VIEW ── */
  #form-view {
    display: flex; flex-direction: column; align-items: center;
    padding: 76px 16px 48px; min-height: 100vh;
  }
  .card { width: 100%; max-width: 480px; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155; }
  .header { background: linear-gradient(135deg,#6b1a1a,#3d0a0a); border-bottom: 2px solid #c8922a; padding: 20px 24px 16px; }
  .header h1 { color: #fef3d0; font-size: 18px; font-weight: bold; letter-spacing: 0.03em; }
  .header p { color: #c8922a; font-size: 11px; margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
  form { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  label { font-size: 11px; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; }
  input { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 10px 13px; color: #fef5e4; font-family: Georgia, serif; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
  input:focus { border-color: #c8922a; }
  input::placeholder { color: #475569; }
  .divider { height: 1px; background: linear-gradient(90deg,transparent,#334155,transparent); margin: 4px 0; }
  .note { font-size: 11px; color: #475569; text-align: center; line-height: 1.6; }
  button[type=submit] { margin-top: 4px; background: linear-gradient(135deg,#92400e,#c8922a); color: #fff8e8; border: none; border-radius: 13px; padding: 14px; font-family: Georgia, serif; font-size: 15px; font-weight: bold; letter-spacing: 0.05em; cursor: pointer; transition: opacity 0.2s; }
  button[type=submit]:hover { opacity: 0.9; }

  /* ── IFRAME VIEW ── */
  #iframe-view {
    display: none; position: fixed; inset: 0; flex-direction: column; background: #0f172a; z-index: 100;
  }
  #iframe-view.active { display: flex; }
  .iframe-bar {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 16px;
    background: linear-gradient(135deg,#6b1a1a,#3d0a0a);
    border-bottom: 1px solid #c8922a44;
    flex-shrink: 0;
  }
  .back-btn {
    display: flex; align-items: center; gap-6px; padding: 8px 14px;
    background: rgba(200,146,42,0.15); border: 1px solid rgba(200,146,42,0.35);
    border-radius: 10px; color: #fef3d0; font-family: Georgia, serif;
    font-size: 13px; font-weight: bold; cursor: pointer; text-decoration: none;
    transition: background 0.2s;
  }
  .back-btn:hover { background: rgba(200,146,42,0.28); }
  .iframe-title { color: #c8922a; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; flex: 1; text-align: center; }
  #ext-frame { flex: 1; border: none; width: 100%; }
  .loading-overlay {
    position: absolute; inset: 56px 0 0 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: #0f172a; gap: 12px; pointer-events: none;
    transition: opacity 0.4s;
  }
  .loading-overlay.hidden { opacity: 0; }
  .spinner { width: 32px; height: 32px; border: 3px solid #334155; border-top-color: #c8922a; border-radius: 50%; animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-overlay p { color: #94a3b8; font-size: 13px; }
</style>
</head>
<body>

  <!-- Baner powrotu -->
  <div id="back-banner">
    <a id="back-btn" href="javascript:history.back()">&#8592; Powrót — Salve Maria</a>
  </div>

  <!-- Formularz -->
  <div id="form-view">
    <div class="card">
      <div class="header">
        <h1>Formularz wsparcia</h1>
        <p>Fundacja Instytut Edukacji Społecznej i Religijnej im. Ks. Piotra Skargi</p>
      </div>
      <form id="payment-form" method="POST" action="${esc(safeDonationUrl(meta.action))}">
        ${hi("from_url", "1")}
        ${meta.id_campaign ? hi("id_campaign", meta.id_campaign) : ""}
        ${hi("operation", "")}
        ${hi("payment_type", "single")}
        ${hi("_zgody[zgoda_check][]", "9")}
        ${hi("_zgody[zgoda_all][]", "9")}
        ${hi("_zgody[zgoda][9]", "1")}
        ${hi("_zgody[zgoda_all][]", "12")}
        ${hi("_zgody[zgoda][12]", "1")}
        ${hi("start", "Wspieram i wpłacam")}

        <div class="row">
          ${fi("name",    name,    "Imię")}
          ${fi("surname", surname, "Nazwisko")}
        </div>
        ${fi("email",        email,    "Adres e-mail",  "email")}
        ${fi("phone_mobile", phone,    "Telefon",       "tel")}
        <div class="row">
          ${fi("address2", address2, "Ulica / Wieś")}
          ${fi("address3", address3, "Nr domu")}
        </div>
        <div class="row">
          ${fi("postal", postal, "Kod pocztowy")}
          ${fi("city",   city,   "Miejscowość")}
        </div>

        <div class="divider"></div>
        <p class="note">Sprawdź dane i kliknij przycisk, aby przejść do wyboru kwoty i płatności na polskakatolicka.org</p>
        <button type="submit" id="submit-btn">Potwierdź i przejdź do płatności →</button>
      </form>
    </div>
  </div>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action https://polskakatolicka.org https://www.polskakatolicka.org; base-uri 'none'; frame-ancestors 'self'",
    },
  });
}
