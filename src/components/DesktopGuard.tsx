"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type DeviceMode = "loading" | "desktop" | "mobile-browser" | "pwa";

function detectMode(): DeviceMode {
  const ua = navigator.userAgent;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Tablet|tablet/i.test(ua);
  const hasTouch = navigator.maxTouchPoints > 1;
  const isDesktop = !isMobileUA && !hasTouch;

  if (isDesktop) return "desktop";

  // Tryb standalone = zainstalowana PWA
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true;

  return isStandalone ? "pwa" : "mobile-browser";
}

function ScreenDesktop() {
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
            Otwórz poniższy adres na swoim telefonie.
          </p>
          <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
            <p className="text-yellow-300 font-mono text-sm tracking-wide select-all">salve-maria.vercel.app</p>
          </div>
        </div>
        <p className="text-slate-600 text-xs">
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

  useEffect(() => {
    setMode(detectMode());
  }, []);

  if (mode === "loading") return <>{children}</>;
  if (mode === "desktop") return <ScreenDesktop />;
  if (mode === "mobile-browser") return <ScreenMobileBrowser />;
  return <>{children}</>;
}
