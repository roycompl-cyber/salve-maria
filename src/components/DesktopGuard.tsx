"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";

type DeviceMode = "loading" | "desktop" | "mobile-browser" | "pwa";

function detectMode(): DeviceMode {
  const ua = navigator.userAgent;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Tablet|tablet/i.test(ua);
  const hasTouch = navigator.maxTouchPoints > 1;
  const isDesktop = !isMobileUA && !hasTouch;

  if (isDesktop) return "desktop";

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;

  return isStandalone ? "pwa" : "mobile-browser";
}

function ScreenDesktop({ onBypass }: { onBypass: () => void }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const refs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];

  async function checkCode(code: string) {
    setChecking(true);
    try {
      const res = await fetch("/api/bypass-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const { ok } = await res.json() as { ok: boolean };
      if (ok) { onBypass(); return; }
    } catch {}
    setChecking(false);
    setError(true);
    setDigits(["", "", "", "", "", ""]);
    setTimeout(() => { setError(false); refs[0].current?.focus(); }, 1200);
  }

  function handleDigit(idx: number, val: string) {
    if (checking) return;
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError(false);
    if (d && idx < 5) refs[idx + 1].current?.focus();
    if (next.join("").length === 6) checkCode(next.join(""));
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    if (checking) return;
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setDigits(text.split(""));
      checkCode(text);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(ellipse at top, #3b0a0a 0%, #0f172a 70%)" }}>
      <div className="max-w-sm w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-yellow-700/60 shadow-2xl">
            <Image src="/logo.png" alt="Salve Maria" width={112} height={112} className="object-cover w-full h-full" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-yellow-200 mb-1" style={{ fontFamily: "Georgia, serif" }}>Salve Maria</h1>
          <p className="text-red-400/70 text-sm">Instytut im. Ks. Piotra Skargi</p>
        </div>

        <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-6 py-6 space-y-4">
          <div className="text-4xl">📱</div>
          <h2 className="text-white font-bold text-lg leading-snug">
            Ta aplikacja jest przeznaczona<br />na urządzenia mobilne
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Salve Maria działa jako aplikacja PWA na smartfonach i tabletach.
            Zeskanuj kod QR telefonem lub przepisz adres.
          </p>
          <div className="flex justify-center py-2">
            <div className="rounded-2xl bg-white p-4 shadow-lg">
              <QRCodeSVG value="https://salve-maria.vercel.app" size={160} bgColor="#ffffff" fgColor="#1e0a0a" level="M" />
            </div>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
            <p className="text-yellow-300 font-mono text-sm tracking-wide select-all">salve-maria.vercel.app</p>
          </div>
        </div>

        {/* Admin bypass */}
        <div className="space-y-3">
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-10 h-12 rounded-xl text-center text-lg font-bold bg-slate-900 border transition-all outline-none
                  ${error ? "border-red-500 text-red-400 animate-pulse" : checking ? "border-yellow-700/50 text-slate-500" : "border-slate-700 text-white focus:border-yellow-600"}`}
              />
            ))}
          </div>
          {error && <p className="text-red-400 text-xs">Nieprawidłowy kod</p>}
        </div>

        <p className="text-slate-700 text-xs">
          Po otwarciu na telefonie — dodaj do ekranu głównego,<br />aby korzystać jak z natywnej aplikacji.
        </p>
      </div>
    </div>
  );
}

function ScreenMobileBrowser() {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: "radial-gradient(ellipse at top, #3b0a0a 0%, #0f172a 70%)" }}>
      <div className="max-w-xs w-full text-center space-y-7">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-700/60 shadow-2xl">
            <Image src="/logo.png" alt="Salve Maria" width={96} height={96} className="object-cover w-full h-full" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-yellow-200 mb-1" style={{ fontFamily: "Georgia, serif" }}>Salve Maria</h1>
          <p className="text-red-400/70 text-xs">Instytut im. Ks. Piotra Skargi</p>
        </div>

        <div className="rounded-2xl border border-amber-800/40 bg-amber-950/30 px-5 py-5 space-y-4 text-left">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⬇️</span>
            <h2 className="text-white font-bold text-base leading-snug">
              Dodaj aplikację<br />do ekranu głównego
            </h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Salve Maria działa wyłącznie jako aplikacja zainstalowana na telefonie (PWA), nie w oknie przeglądarki.
          </p>
          {isIOS ? (
            <ol className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700/60 text-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Naciśnij ikonę <strong className="text-white">Udostępnij</strong> (kwadrat ze strzałką) na dole Safari</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700/60 text-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Wybierz <strong className="text-white">„Dodaj do ekranu głównego"</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700/60 text-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Potwierdź przyciskiem <strong className="text-white">„Dodaj"</strong></span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-2.5 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700/60 text-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>Naciśnij menu <strong className="text-white">⋮</strong> w prawym górnym rogu Chrome</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700/60 text-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>Wybierz <strong className="text-white">„Dodaj do ekranu głównego"</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-700/60 text-amber-200 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Potwierdź przyciskiem <strong className="text-white">„Dodaj"</strong></span>
              </li>
            </ol>
          )}
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">
          Po instalacji ikona Salve Maria pojawi się<br />na ekranie głównym Twojego telefonu.
        </p>
      </div>
    </div>
  );
}

export default function DesktopGuard({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DeviceMode>("loading");
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => { setMode(detectMode()); }, []);

  if (mode === "loading") return <>{children}</>;
  if (bypassed || mode === "pwa") return <>{children}</>;
  if (mode === "desktop") return <ScreenDesktop onBypass={() => setBypassed(true)} />;
  if (mode === "mobile-browser") return <ScreenMobileBrowser />;
  return <>{children}</>;
}
