"use client";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { urlBase64ToUint8Array } from "@/lib/utils";

// localStorage: trwałe (denied / granted)
// sessionStorage: tymczasowe (later) — reset przy każdej nowej sesji przeglądarki
const LS_KEY = "salve_push_perm_v1";   // "granted" | "denied"
const SS_KEY = "salve_push_later_v1";  // "later"

export default function PushOnboardingBanner({ userId }: { userId: string | undefined }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Jeśli OS odmówił wcześniej — nie pytaj
    if (localStorage.getItem(LS_KEY) === "denied") return;
    if (Notification.permission === "denied") {
      localStorage.setItem(LS_KEY, "denied");
      return;
    }

    // Jeśli OS już ma zgodę — sprawdź czy mamy aktywną subskrypcję w przeglądarce
    if (Notification.permission === "granted") {
      checkAndSubscribe();
      return;
    }

    // Użytkownik kliknął "Może później" w tej sesji — nie pokazuj ponownie
    if (sessionStorage.getItem(SS_KEY)) return;

    // Pokaż baner z opóźnieniem
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function checkAndSubscribe() {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const reg = regs[0];
      if (!reg) return;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Już subskrybowany — upewnij się że jest w bazie
        await saveSubscription(existing);
        localStorage.setItem(LS_KEY, "granted");
      } else {
        // Zgoda OS jest ale brak subskrypcji — odsubskrybowano ręcznie lub wygasła
        // Pokaż baner żeby ponownie włączyć
        sessionStorage.removeItem(SS_KEY);
        setTimeout(() => setVisible(true), 2500);
      }
    } catch { /* push opcjonalny */ }
  }

  async function saveSubscription(sub: PushSubscription) {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub,
        settings: { news_notifications: true, action_notifications: true, prayer_reminder_enabled: false, prayer_reminder_time: "07:00" },
      }),
    });
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        const regs = await navigator.serviceWorker.getRegistrations();
        const reg = regs[0];
        if (reg) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
          });
          await saveSubscription(sub);
        }
        localStorage.setItem(LS_KEY, "granted");
        setDone(true);
        setTimeout(() => setVisible(false), 1800);
      } else {
        localStorage.setItem(LS_KEY, "denied");
        setVisible(false);
      }
    } catch {
      setVisible(false);
    }
    setLoading(false);
  }

  function handleDismiss() {
    // Zapamiętaj tylko w ramach sesji — przy kolejnym logowaniu banner wróci
    sessionStorage.setItem(SS_KEY, "later");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl border border-amber-700/40 p-4 shadow-2xl animate-fade-in"
      style={{ background: "linear-gradient(135deg, #1c0a02, #2d1a04)", maxWidth: 440, margin: "0 auto" }}
      role="dialog"
      aria-label="Włącz powiadomienia"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors"
        aria-label="Zamknij"
      >
        <X size={16} />
      </button>

      <div className="flex gap-3 items-start pr-5">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(200,146,42,0.15)", border: "1px solid rgba(200,146,42,0.35)", color: "#e2b86a" }}>
          <Bell size={20} />
        </span>
        <div className="min-w-0">
          {done ? (
            <p className="text-green-400 font-semibold text-sm" style={{ fontFamily: "Georgia, serif" }}>
              ✓ Powiadomienia włączone!
            </p>
          ) : (
            <>
              <p className="text-yellow-100 font-bold text-sm leading-snug" style={{ fontFamily: "Georgia, serif" }}>
                Zostań na bieżąco z modlitwą
              </p>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Powiadomienia przypomną Ci o Koronce, Różańcu i Apelu Jasnogórskim — nawet przy wyłączonym ekranie.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleEnable}
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-950 transition-all"
                  style={{ background: loading ? "#92400e" : "linear-gradient(135deg,#d97706,#f59e0b)" }}
                >
                  {loading ? "Włączanie…" : "Włącz powiadomienia"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Może później
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
