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
  }
  #back-btn:active { transform: translateY(2px); border-bottom-width: 1px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

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
  button[type=submit] { margin-top: 4px; background: linear-gradient(135deg,#92400e,#c8922a); color: #fff8e8; border: none; border-radius: 13px; padding: 14px; font-family: Georgia, serif; font-size: 15px; font-weight: bold; letter-spacing: 0.05em; cursor: pointer; transition: opacity 0.2s; width: 100%; }
  button[type=submit]:hover { opacity: 0.9; }

  /* ── POTWIERDZENIE ── */
  #done-view {
    display: none; flex-direction: column; align-items: center; justify-content: center;
    padding: 76px 24px 48px; min-height: 100vh; text-align: center; gap: 16px;
  }
  #done-view.active { display: flex; }
  .done-icon { font-size: 56px; }
  .done-title { color: #fef3d0; font-size: 20px; font-weight: bold; }
  .done-sub { color: #94a3b8; font-size: 14px; line-height: 1.6; max-width: 320px; }
  .open-btn {
    margin-top: 8px; background: linear-gradient(135deg,#92400e,#c8922a); color: #fff8e8;
    border: none; border-radius: 13px; padding: 14px 28px; font-family: Georgia, serif;
    font-size: 15px; font-weight: bold; cursor: pointer; text-decoration: none;
    display: inline-block;
  }
</style>
</head>
<body>

  <!-- Baner powrotu -->
  <div id="back-banner">
    <button id="back-btn" onclick="history.back()">&#8592; Powrót — Salve Maria</button>
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
        <p class="note">Sprawdź dane i kliknij przycisk — przejdziesz do wyboru kwoty i płatności.</p>
        <button type="submit" id="submit-btn">Potwierdź i przejdź do płatności →</button>
      </form>
    </div>
  </div>

  <!-- Widok po wysłaniu -->
  <div id="done-view">
    <div class="done-icon">🙏</div>
    <p class="done-title">Dziękujemy!</p>
    <p class="done-sub">Strona płatności otworzyła się w przeglądarce. Po dokonaniu wpłaty wróć do aplikacji przyciskiem powyżej.</p>
    <a id="open-link" class="open-btn" href="${esc(safeDonationUrl(meta.action))}" target="_blank" rel="noopener noreferrer">Otwórz płatność ponownie</a>
  </div>

  <script>
    document.getElementById('payment-form').addEventListener('submit', function(e) {
      e.preventDefault();

      // Zbierz dane z formularza
      var fd = new FormData(this);
      var action = this.action;

      // Utwórz tymczasowy formularz i wyślij go w nowej karcie
      var f = document.createElement('form');
      f.method = 'POST';
      f.action = action;
      f.target = '_blank';
      f.rel = 'noopener noreferrer';
      fd.forEach(function(v, k) {
        var inp = document.createElement('input');
        inp.type = 'hidden';
        inp.name = k;
        inp.value = String(v);
        f.appendChild(inp);
      });
      document.body.appendChild(f);
      f.submit();
      document.body.removeChild(f);

      // Pokaż widok potwierdzenia (baner zostaje)
      document.getElementById('form-view').style.display = 'none';
      document.getElementById('done-view').classList.add('active');
    });
  </script>

</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action https://polskakatolicka.org https://www.polskakatolicka.org; base-uri 'none'; frame-ancestors 'self'",
    },
  });
}
