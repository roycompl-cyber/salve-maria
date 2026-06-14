"use client";
import { useEffect } from "react";
import { urlBase64ToUint8Array } from "@/lib/utils";

const ASKED_KEY = "salve_push_asked_v1";

// Subskrybuje push — tylko jeśli użytkownik już wcześniej wyraził zgodę
// (tj. Notification.permission === "granted"). Nigdy nie pyta samodzielnie.
// Żeby poprosić o zgodę, użytkownik musi wejść w Ustawienia → Alerty.
export function usePushAutoSubscribe(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function autoSubscribe() {
      // Nie pytaj o zgodę automatycznie — tylko jeśli już jest udzielona
      if (Notification.permission !== "granted") return;

      // Jeśli już subskrybowaliśmy w tej sesji — pomiń
      if (sessionStorage.getItem(ASKED_KEY)) return;
      sessionStorage.setItem(ASKED_KEY, "1");

      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      // Zapisz w bazie z domyślnymi ustawieniami (wszystko włączone)
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub,
          settings: {
            news_notifications: true,
            action_notifications: true,
            prayer_reminder_enabled: false,
            prayer_reminder_time: "07:00",
          },
        }),
      });
    }

    autoSubscribe().catch(() => {});
  }, [userId]);
}
