"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "salve_install_dismissed_v2";

/** Ikona przycisku Share w Safari — SVG odwzorowujący oryginalny wygląd */
function ShareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#007AFF" />
      <path d="M14 4v13M9 8l5-5 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13v8a1 1 0 001 1h12a1 1 0 001-1v-8" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#34C759" />
      <path d="M14 7v14M7 14h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Przewodnik instalacji dla iOS Safari */
function IOSGuide({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <ShareIcon />,
      title: "Krok 1 z 3",
      heading: "Naciśnij przycisk Udostępnij",
      desc: "Na dole ekranu w Safari znajdź i naciśnij ikonę z kwadratem i strzałką w górę.",
      visual: (
        <div className="relative w-full h-24 flex items-end justify-center">
          {/* Pasek dolny Safari */}
          <div className="w-full max-w-xs bg-slate-700 rounded-2xl px-6 py-3 flex items-center justify-around">
            <div className="w-6 h-6 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </div>
            <div className="w-6 h-6 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
            <div className="relative animate-bounce">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2v13M7 7l5-5 5 5"/><path d="M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6"/>
                </svg>
              </div>
              {/* Strzałka wskazująca */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-amber-400 text-xs font-bold whitespace-nowrap">Tu naciśnij!</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#f59e0b">
                  <path d="M8 12L2 4h12z"/>
                </svg>
              </div>
            </div>
            <div className="w-6 h-6 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div className="w-6 h-6 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <PlusIcon />,
      title: "Krok 2 z 3",
      heading: 'Wybierz "Dodaj do ekranu głównego"',
      desc: 'W menu które się pojawi, przewiń w dół i naciśnij "Dodaj do ekranu głównego".',
      visual: (
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-2xl overflow-hidden">
          {["Kopiuj", "Dodaj zakładkę", "Dodaj do ulubionych"].map(item => (
            <div key={item} className="px-4 py-3 border-b border-slate-600 text-slate-400 text-sm">{item}</div>
          ))}
          <div className="px-4 py-3 border-b border-amber-500/50 bg-amber-500/10 flex items-center gap-3">
            <PlusIcon />
            <span className="text-white font-bold text-sm">Dodaj do ekranu głównego</span>
            <div className="ml-auto animate-pulse">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#f59e0b">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 6v8M6 10h8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          {["Drukuj", "Edytuj akcje…"].map(item => (
            <div key={item} className="px-4 py-3 border-b border-slate-600 text-slate-400 text-sm">{item}</div>
          ))}
        </div>
      ),
    },
    {
      icon: (
        <div className="w-7 h-7 rounded-lg overflow-hidden">
          <img src="/icons/icon-192.png" alt="Salve Maria" className="w-full h-full object-cover" />
        </div>
      ),
      title: "Krok 3 z 3",
      heading: 'Naciśnij "Dodaj"',
      desc: 'W prawym górnym rogu naciśnij niebieski przycisk "Dodaj". Gotowe! Ikona Salve Maria pojawi się na Twoim ekranie.',
      visual: (
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-600">
            <span className="text-blue-400 text-sm">Anuluj</span>
            <span className="text-white font-semibold text-sm">Dodaj do ekranu</span>
            <span className="text-blue-400 font-bold text-sm animate-pulse">Dodaj</span>
          </div>
          <div className="px-4 py-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
              <img src="/icons/icon-192.png" alt="Salve Maria" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white font-semibold">Salve Maria</p>
              <p className="text-slate-400 text-xs">salve-maria.vercel.app</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(170deg,#1a0f05,#0d0805)", border: "1px solid rgba(200,146,42,0.3)", borderBottom: "none" }}>

        {/* Nagłówek */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            {current.icon}
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">{current.title}</span>
          </div>
          <button onClick={onDismiss} className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2">
          <h2 className="text-white text-xl font-bold leading-snug" style={{ fontFamily: "Georgia, serif" }}>
            {current.heading}
          </h2>
          <p className="text-slate-300 text-sm mt-1 leading-relaxed">{current.desc}</p>
        </div>

        {/* Wizualizacja */}
        <div className="px-6 py-4">{current.visual}</div>

        {/* Nawigacja */}
        <div className="px-6 pb-8 pt-2 flex items-center gap-3">
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-4 rounded-2xl font-bold text-base"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)", color: "#fff", fontFamily: "Georgia, serif" }}>
              Dalej →
            </button>
          ) : (
            <button onClick={onDismiss}
              className="flex-1 py-4 rounded-2xl font-bold text-base"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)", color: "#fff", fontFamily: "Georgia, serif" }}>
              Rozumiem, dziękuję!
            </button>
          )}
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="px-5 py-4 rounded-2xl text-slate-400 bg-slate-800 font-medium text-sm">
              ← Wróć
            </button>
          )}
        </div>

        {/* Kropki postępu */}
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === step ? "#c8922a" : "#4b5563" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Przewodnik instalacji dla Androida — Chrome z natywnym promptem */
function AndroidChromeGuide({ onInstall, onDismiss }: { onInstall: () => void; onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Krok 1 z 2",
      heading: "Zainstaluj aplikację na telefonie",
      desc: "Salve Maria działa jak prawdziwa aplikacja — możesz dodać ją do ekranu głównego telefonu, żeby zawsze mieć ją pod ręką.",
      visual: (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-2xl" style={{ border: "2px solid rgba(200,146,42,0.5)" }}>
            <img src="/icons/icon-192.png" alt="Salve Maria" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Salve Maria</p>
            <p className="text-slate-400 text-sm">salve-maria.vercel.app</p>
          </div>
          <div className="flex gap-3 text-xs text-slate-400">
            {["Działa offline", "Powiadomienia", "Szybki dostęp"].map(f => (
              <span key={f} className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">{f}</span>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Krok 2 z 2",
      heading: "Naciśnij przycisk poniżej",
      desc: 'Naciśnij zielony przycisk "Zainstaluj aplikację" — pojawi się okienko instalacji. Naciśnij "Dodaj" i gotowe!',
      visual: (
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-600 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/icons/icon-192.png" alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Salve Maria</p>
              <p className="text-slate-400 text-xs">salve-maria.vercel.app</p>
            </div>
          </div>
          <div className="px-4 py-4 flex gap-3">
            <div className="flex-1 py-2 rounded-xl bg-slate-600 text-slate-300 text-sm text-center">Anuluj</div>
            <div className="flex-1 py-2 rounded-xl text-white text-sm text-center font-bold animate-pulse"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)" }}>Dodaj</div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(170deg,#1a0f05,#0d0805)", border: "1px solid rgba(200,146,42,0.3)", borderBottom: "none" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">{current.title}</span>
          <button onClick={onDismiss} className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-2">
          <h2 className="text-white text-xl font-bold leading-snug" style={{ fontFamily: "Georgia, serif" }}>{current.heading}</h2>
          <p className="text-slate-300 text-sm mt-1 leading-relaxed">{current.desc}</p>
        </div>
        <div className="px-6 py-4">{current.visual}</div>
        <div className="px-6 pb-8 pt-2 flex items-center gap-3">
          {step === 0 ? (
            <button onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-2xl font-bold text-base"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)", color: "#fff", fontFamily: "Georgia, serif" }}>
              Dalej →
            </button>
          ) : (
            <button onClick={onInstall}
              className="flex-1 py-4 rounded-2xl font-bold text-base"
              style={{ background: "linear-gradient(135deg,#34a853,#2d9249)", color: "#fff", fontFamily: "Georgia, serif" }}>
              Zainstaluj aplikację
            </button>
          )}
          {step > 0 && (
            <button onClick={() => setStep(0)} className="px-5 py-4 rounded-2xl text-slate-400 bg-slate-800 font-medium text-sm">
              ← Wróć
            </button>
          )}
        </div>
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === step ? "#c8922a" : "#4b5563" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Przewodnik dla Androida bez natywnego promptu (Samsung Internet, Firefox itp.) */
function AndroidManualGuide({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Krok 1 z 3",
      heading: "Naciśnij menu przeglądarki",
      desc: "W prawym górnym rogu przeglądarki znajdź i naciśnij trzy kropki (⋮) lub ikonę menu.",
      visual: (
        <div className="relative w-full h-20 flex items-start justify-end pr-2">
          <div className="bg-slate-700 rounded-xl px-3 py-2 flex items-center gap-4">
            <div className="w-5 h-5 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </div>
            <div className="w-5 h-5 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
            <div className="w-5 h-5 text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>
            </div>
            <div className="relative animate-bounce ml-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,146,42,0.3)", border: "2px solid #c8922a" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#c8922a" strokeWidth="2.5"><circle cx="12" cy="5" r="1.5" fill="#c8922a"/><circle cx="12" cy="12" r="1.5" fill="#c8922a"/><circle cx="12" cy="19" r="1.5" fill="#c8922a"/></svg>
              </div>
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="#f59e0b"><path d="M8 12L2 4h12z" transform="rotate(180 8 8)"/></svg>
                <span className="text-amber-400 text-xs font-bold whitespace-nowrap">Tu naciśnij!</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Krok 2 z 3",
      heading: 'Wybierz "Dodaj do ekranu głównego"',
      desc: 'W menu które się otworzy, poszukaj opcji "Dodaj do ekranu głównego" lub "Zainstaluj aplikację" i naciśnij.',
      visual: (
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-2xl overflow-hidden">
          {["Nowa karta", "Nowa karta incognito", "Zakładki", "Historia"].map(item => (
            <div key={item} className="px-4 py-3 border-b border-slate-600 text-slate-400 text-sm">{item}</div>
          ))}
          <div className="px-4 py-3 border-b border-amber-500/50 bg-amber-500/10 flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            <span className="text-white font-bold text-sm">Dodaj do ekranu głównego</span>
            <div className="ml-auto w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="px-4 py-3 text-slate-400 text-sm">Ustawienia</div>
        </div>
      ),
    },
    {
      title: "Krok 3 z 3",
      heading: "Potwierdź i gotowe!",
      desc: 'Pojawi się okienko z nazwą aplikacji. Naciśnij "Dodaj" — ikona Salve Marii pojawi się na ekranie głównym.',
      visual: (
        <div className="w-full max-w-xs mx-auto bg-slate-700 rounded-2xl p-5 text-center">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3 shadow-lg">
            <img src="/icons/icon-192.png" alt="Salve Maria" className="w-full h-full object-cover" />
          </div>
          <p className="text-white font-bold mb-1">Salve Maria</p>
          <p className="text-slate-400 text-xs mb-4">salve-maria.vercel.app</p>
          <div className="flex gap-3">
            <div className="flex-1 py-2 rounded-xl bg-slate-600 text-slate-300 text-sm text-center">Anuluj</div>
            <div className="flex-1 py-2 rounded-xl text-white text-sm text-center font-bold animate-pulse"
              style={{ background: "linear-gradient(135deg,#34a853,#2d9249)" }}>Dodaj</div>
          </div>
        </div>
      ),
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: "linear-gradient(170deg,#1a0f05,#0d0805)", border: "1px solid rgba(200,146,42,0.3)", borderBottom: "none" }}>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">{current.title}</span>
          <button onClick={onDismiss} className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 pb-2">
          <h2 className="text-white text-xl font-bold leading-snug" style={{ fontFamily: "Georgia, serif" }}>{current.heading}</h2>
          <p className="text-slate-300 text-sm mt-1 leading-relaxed">{current.desc}</p>
        </div>
        <div className="px-6 py-4">{current.visual}</div>
        <div className="px-6 pb-8 pt-2 flex items-center gap-3">
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 py-4 rounded-2xl font-bold text-base"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)", color: "#fff", fontFamily: "Georgia, serif" }}>
              Dalej →
            </button>
          ) : (
            <button onClick={onDismiss}
              className="flex-1 py-4 rounded-2xl font-bold text-base"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)", color: "#fff", fontFamily: "Georgia, serif" }}>
              Rozumiem, dziękuję!
            </button>
          )}
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="px-5 py-4 rounded-2xl text-slate-400 bg-slate-800 font-medium text-sm">
              ← Wróć
            </button>
          )}
        </div>
        <div className="flex justify-center gap-2 pb-4">
          {steps.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === step ? "#c8922a" : "#4b5563" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"hidden" | "ios" | "android-chrome" | "android-manual">("hidden");

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const android = /android/i.test(ua);
    const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
    const inStandalone = standalone || window.matchMedia("(display-mode: standalone)").matches;

    if (inStandalone) return; // już zainstalowana

    if (ios) {
      const t = setTimeout(() => setMode("ios"), 4000);
      return () => clearTimeout(t);
    }

    if (android) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setMode("android-chrome"), 4000);
      };
      window.addEventListener("beforeinstallprompt", handler);

      // Jeśli po 6s nie było eventu — pokaż przewodnik manualny
      const fallback = setTimeout(() => {
        setMode(prev => prev === "hidden" ? "android-manual" : prev);
      }, 6000);

      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(fallback);
      };
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setMode("hidden");
  }

  async function installChrome() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") dismiss();
    else setMode("hidden");
  }

  if (mode === "ios") return <IOSGuide onDismiss={dismiss} />;
  if (mode === "android-chrome") return <AndroidChromeGuide onInstall={installChrome} onDismiss={dismiss} />;
  if (mode === "android-manual") return <AndroidManualGuide onDismiss={dismiss} />;
  return null;
}
