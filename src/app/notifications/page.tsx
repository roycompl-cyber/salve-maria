"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { Bell, BellOff, Newspaper, Megaphone, BookMarked, Loader2, CheckCircle2 } from "lucide-react";
import { urlBase64ToUint8Array } from "@/lib/utils";

interface Settings {
  news_notifications: boolean;
  action_notifications: boolean;
  prayer_reminder_enabled: boolean;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-red-700" : "bg-slate-600"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function NotificationsPage() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [supported, setSupported] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    news_notifications: true,
    action_notifications: true,
    prayer_reminder_enabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscription(sub))
    );
  }, []);

  async function handleEnable() {
    setEnabling(true);
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") { setEnabling(false); return; }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    setSubscription(sub);
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub, settings }),
    });
    setEnabling(false);
  }

  async function handleDisable() {
    if (!subscription) return;
    await subscription.unsubscribe();
    await fetch("/api/push/subscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    setSubscription(null);
  }

  async function saveSettings(newSettings: Settings) {
    setSettings(newSettings);
    if (!subscription) return;
    setSaving(true);
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, settings: newSettings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const set = (key: keyof Settings) => (val: boolean) =>
    saveSettings({ ...settings, [key]: val });

  const isActive = !!subscription && permission === "granted";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Powiadomienia</h1>
          <p className="text-slate-400 text-sm mt-0.5">Zarządzaj powiadomieniami push</p>
        </div>

        {!supported ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-400 text-sm">
            Twoja przeglądarka nie obsługuje powiadomień push. Zainstaluj aplikację na ekranie głównym telefonu i spróbuj ponownie.
          </div>
        ) : (
          <>
            {/* Status */}
            <div className={`rounded-2xl p-4 flex items-center justify-between border ${isActive ? "bg-green-900/20 border-green-700/40" : "bg-slate-800 border-slate-700"}`}>
              <div className="flex items-center gap-3">
                {isActive
                  ? <Bell size={22} className="text-green-400" />
                  : <BellOff size={22} className="text-slate-500" />}
                <div>
                  <p className="text-white font-semibold text-sm">
                    {isActive ? "Powiadomienia włączone" : "Powiadomienia wyłączone"}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {isActive
                      ? "Otrzymujesz powiadomienia od Fundacji"
                      : "Nie otrzymujesz żadnych powiadomień"}
                  </p>
                </div>
              </div>
              {isActive ? (
                <button onClick={handleDisable}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-slate-700">
                  Wyłącz
                </button>
              ) : (
                <button onClick={handleEnable} disabled={enabling}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
                  {enabling ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
                  Włącz
                </button>
              )}
            </div>

            {/* Typy powiadomień — tylko gdy aktywne */}
            {isActive && (
              <div className="bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider px-4 pt-4 pb-2">
                  Jakie powiadomienia chcesz otrzymywać?
                </p>

                {[
                  {
                    key: "news_notifications" as keyof Settings,
                    icon: <Newspaper size={18} className="text-green-400" />,
                    label: "Aktualności",
                    desc: "Nowe artykuły i wiadomości z Fundacji",
                  },
                  {
                    key: "action_notifications" as keyof Settings,
                    icon: <Megaphone size={18} className="text-red-400" />,
                    label: "Akcje i petycje",
                    desc: "Pilne apele i nowe petycje do podpisania",
                  },
                  {
                    key: "prayer_reminder_enabled" as keyof Settings,
                    icon: <BookMarked size={18} className="text-amber-400" />,
                    label: "Przypomnienia o modlitwie",
                    desc: "Codzienne zaproszenie do wspólnej modlitwy",
                  },
                ].map(({ key, icon, label, desc }) => (
                  <div key={key} className="flex items-center gap-3 px-4 py-3.5 border-t border-slate-700">
                    <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
                    </div>
                    <Toggle value={settings[key] as boolean} onChange={set(key)} />
                  </div>
                ))}

                {(saving || saved) && (
                  <div className={`flex items-center gap-2 px-4 py-3 border-t border-slate-700 text-xs ${saved ? "text-green-400" : "text-slate-400"}`}>
                    {saved
                      ? <><CheckCircle2 size={13} /> Zapisano</>
                      : <><Loader2 size={13} className="animate-spin" /> Zapisywanie…</>}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
