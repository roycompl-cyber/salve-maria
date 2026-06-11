"use client";
import { useEffect } from "react";
import { urlBase64ToUint8Array } from "@/lib/utils";

// Automatycznie subskrybuje push po zalogowaniu (raz na urządzenie)
export function usePushAutoSubscribe(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;

    async function autoSubscribe() {
      // Poproś o zgodę i subskrybuj
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;

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
