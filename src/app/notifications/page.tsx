"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { Bell, Clock, Newspaper, Megaphone, CheckCircle2, AlertCircle, BellOff } from "lucide-react";

interface Settings {
  prayer_reminder_enabled: boolean;
  prayer_reminder_time: string;
  news_notifications: boolean;
  action_notifications: boolean;
}

export default function NotificationsPage() {
  const { t } = useLocale();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [settings, setSettings] = useState<Settings>({
    prayer_reminder_enabled: false,
    prayer_reminder_time: "07:00",
    news_notifications: true,
    action_notifications: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    setPermission(Notification.permission);

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
      });
    });
  }, []);

  const requestAndSubscribe = useCallback(async () => {
    const perm = await Notification.requestPermission();
    setPermission(perm);
    if (perm !== "granted") return;

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
  }, [settings]);

  async function saveSettings() {
    setSaving(true);
    if (subscription) {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, settings }),
      });
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function disableNotifications() {
    if (subscription) {
      await subscription.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      setSubscription(null);
    }
  }

  const toggle = (key: keyof Settings) => (value: boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white">{t("notifications.title")}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Zarządzaj swoimi powiadomieniami</p>
        </div>

        {!supported && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-400" />
            <p className="text-amber-300 text-sm">{t("notifications.not_supported")}</p>
          </div>
        )}

        {supported && permission === "denied" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
            <BellOff size={20} className="text-red-400" />
            <p className="text-red-300 text-sm">{t("notifications.permission_denied")}</p>
          </div>
        )}

        {/* Enable push */}
        {supported && permission !== "denied" && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell size={20} className="text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{t("notifications.enable_push")}</p>
                <p className="text-slate-400 text-xs mt-0.5">{t("notifications.push_desc")}</p>
              </div>
              <div className="flex-shrink-0 ml-2">
                {!subscription ? (
                  <button
                    onClick={requestAndSubscribe}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Włącz
                  </button>
                ) : (
                  <button
                    onClick={disableNotifications}
                    className="bg-slate-700 hover:bg-red-600/30 text-slate-400 hover:text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Wyłącz
                  </button>
                )}
              </div>
            </div>
            {subscription && (
              <div className="flex items-center gap-1.5 mt-3 text-green-400 text-xs">
                <CheckCircle2 size={12} />
                Powiadomienia aktywne
              </div>
            )}
          </div>
        )}

        {/* Settings — only when subscribed */}
        {subscription && (
          <>
            {/* Prayer reminder */}
            <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{t("notifications.prayer_reminder")}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t("notifications.prayer_reminder_desc")}</p>
                </div>
                <Toggle
                  value={settings.prayer_reminder_enabled}
                  onChange={toggle("prayer_reminder_enabled")}
                />
              </div>

              {settings.prayer_reminder_enabled && (
                <div className="ml-13 pl-0 pt-1">
                  <label className="text-slate-300 text-xs font-medium block mb-2">{t("notifications.reminder_time")}</label>
                  <input
                    type="time"
                    value={settings.prayer_reminder_time}
                    onChange={(e) => setSettings((prev) => ({ ...prev, prayer_reminder_time: e.target.value }))}
                    className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* News notifications */}
            <div className="bg-slate-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Newspaper size={20} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{t("notifications.news")}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t("notifications.news_desc")}</p>
                </div>
                <Toggle value={settings.news_notifications} onChange={toggle("news_notifications")} />
              </div>
            </div>

            {/* Action notifications */}
            <div className="bg-slate-800 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Megaphone size={20} className="text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{t("notifications.actions")}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{t("notifications.actions_desc")}</p>
                </div>
                <Toggle value={settings.action_notifications} onChange={toggle("action_notifications")} />
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              {saved ? (
                <><CheckCircle2 size={18} />{t("notifications.saved")}</>
              ) : saving ? (
                "Zapisywanie..."
              ) : (
                t("notifications.save")
              )}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-slate-600"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
