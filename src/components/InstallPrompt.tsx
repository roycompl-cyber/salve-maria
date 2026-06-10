"use client";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
    setIsIOS(ios && !standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show && !isIOS) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-blue-600 rounded-2xl p-4 shadow-2xl max-w-lg mx-auto">
      <button onClick={() => setShow(false)} className="absolute top-3 right-3 text-white/70 hover:text-white">
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Zainstaluj aplikację</p>
          {isIOS ? (
            <p className="text-blue-100 text-xs mt-0.5">
              Naciśnij <strong>Udostępnij</strong> → <strong>Dodaj do ekranu głównego</strong>
            </p>
          ) : (
            <p className="text-blue-100 text-xs mt-0.5">Dodaj do ekranu głównego dla szybkiego dostępu</p>
          )}
          {!isIOS && deferredPrompt && (
            <button
              onClick={async () => {
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === "accepted") setShow(false);
              }}
              className="mt-2 bg-white text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              Zainstaluj
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
