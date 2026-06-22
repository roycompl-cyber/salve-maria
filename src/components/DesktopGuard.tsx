"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

function detectDesktop(): boolean {
  const ua = navigator.userAgent;
  const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|Tablet|tablet/i.test(ua);
  if (mobileUA) return false;
  // MaxTouchPoints > 1 = prawdopodobnie dotykowe (tablet / hybryd)
  const hasTouch = navigator.maxTouchPoints > 1;
  if (hasTouch) return false;
  return true;
}

export default function DesktopGuard({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDesktop(detectDesktop());
  }, []);

  // Podczas SSR i pierwszego hydration — renderuj normalnie (brak flasha)
  if (isDesktop === null) return <>{children}</>;

  if (isDesktop) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "radial-gradient(ellipse at top, #3b0a0a 0%, #0f172a 70%)" }}
      >
        <div className="max-w-sm w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-yellow-700/60 shadow-2xl">
              <Image src="/logo.png" alt="Salve Maria" width={112} height={112} className="object-cover w-full h-full" />
            </div>
          </div>

          {/* Tytuł */}
          <div>
            <h1
              className="text-3xl font-bold text-yellow-200 mb-1"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Salve Maria
            </h1>
            <p className="text-red-400/70 text-sm">Instytut im. Ks. Piotra Skargi</p>
          </div>

          {/* Komunikat */}
          <div className="rounded-2xl border border-red-900/50 bg-red-950/40 px-6 py-6 space-y-4">
            <div className="text-4xl">📱</div>
            <h2 className="text-white font-bold text-lg leading-snug">
              Ta aplikacja jest przeznaczona<br />na urządzenia mobilne
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Salve Maria działa jako aplikacja PWA na smartfonach i tabletach.
              Zeskanuj kod QR lub otwórz poniższy adres na swoim telefonie.
            </p>

            {/* URL */}
            <div className="rounded-xl bg-slate-900/80 border border-slate-700 px-4 py-3">
              <p className="text-yellow-300 font-mono text-sm tracking-wide select-all">
                salve-maria.vercel.app
              </p>
            </div>
          </div>

          {/* QR hint */}
          <p className="text-slate-600 text-xs">
            Po otwarciu na telefonie — dodaj do ekranu głównego,<br />
            aby korzystać jak z natywnej aplikacji.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
