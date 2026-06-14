"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  loadConfig, loadGlobal, dueReminder, markFired, playFanfare, stopFanfare, unlockAudio,
  findPrayerForPreset, effectiveTime, FANFARE_SECONDS, ReminderPreset, REMINDER_PRESETS,
} from "@/lib/reminders";

const PENDING_KEY = "salve_alarm_pending";

/** Globalny strażnik przypomnień modlitewnych.
 *  Co 10 s sprawdza, czy nadszedł czas któregoś z włączonych alarmów.
 *  Nasłuchuje też zdarzenia "salve-test-alarm" i URL param ?alarm=<presetId>
 *  (klik w powiadomienie push → otwarcie komunikatu w aplikacji). */
export default function PrayerReminderProvider() {
  const [alarm, setAlarm] = useState<{ preset: ReminderPreset; offsetMin: number; time: string; test?: boolean } | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmRef = useRef<typeof alarm>(null); // mirror stanu dla closure w useEffect
  // synchronizuj ref ze stanem
  const setAlarmSynced = (v: typeof alarm) => { alarmRef.current = v; setAlarm(v); };
  const router = useRouter();
  const searchParams = useSearchParams();

  function startFanfare() {
    playFanfare();
    const { fanfareRepeats } = loadGlobal();
    if (fanfareRepeats > 1) {
      let plays = 1;
      repeatRef.current = setInterval(() => {
        plays++;
        playFanfare();
        if (plays >= fanfareRepeats && repeatRef.current) clearInterval(repeatRef.current);
      }, (FANFARE_SECONDS + 0.8) * 1000);
    }
  }

  useEffect(() => {
    function trigger(preset: ReminderPreset, offsetMin: number, time: string, test = false) {
      setAlarmSynced({ preset, offsetMin, time, test });
      startFanfare();
      try { navigator.vibrate?.([300, 150, 300, 150, 600]); } catch { /* brak wsparcia */ }
      if (!test && "Notification" in window && Notification.permission === "granted") {
        try {
          navigator.serviceWorker?.ready.then(reg =>
            reg.showNotification(`${preset.icon} ${preset.title}`, {
              body: offsetMin > 0
                ? `Za ${offsetMin} min (${time}) — ${preset.description}`
                : `${time} — ${preset.description}`,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-96.png",
              tag: `prayer-${preset.id}`,
              data: { url: `/?alarm=${preset.id}`, presetId: preset.id, time },
            })
          );
          // Zapis do localStorage — gdy użytkownik kliknie push i wróci do apki
          localStorage.setItem(PENDING_KEY, JSON.stringify({
            presetId: preset.id,
            time,
            offsetMin,
            expires: Date.now() + 10 * 60 * 1000,
          }));
        } catch { /* notyfikacja opcjonalna */ }
      }
    }

    function check() {
      if (alarmRef.current) return; // alarm już widoczny — nie odpalaj ponownie
      const due = dueReminder(loadConfig());
      if (!due) return;
      markFired(due.preset.id);
      trigger(due.preset, due.settings.offsetMin, effectiveTime(due.preset, due.settings));
    }

    function onTest(e: Event) {
      const id = (e as CustomEvent).detail?.presetId as string | undefined;
      const preset = REMINDER_PRESETS.find(p => p.id === id) ?? REMINDER_PRESETS[0];
      trigger(preset, 0, effectiveTime(preset, loadConfig()[preset.id]), true);
    }

    // Klik w push → URL param ?alarm=<presetId>
    const alarmParam = searchParams.get("alarm");
    if (alarmParam) {
      try {
        const pending = JSON.parse(localStorage.getItem(PENDING_KEY) ?? "{}");
        const presetId = pending.presetId ?? alarmParam;
        const preset = REMINDER_PRESETS.find(p => p.id === presetId);
        if (preset && pending.expires > Date.now()) {
          localStorage.removeItem(PENDING_KEY);
          trigger(preset, pending.offsetMin ?? 0, pending.time ?? preset.time);
        }
      } catch { /* ignoruj */ }
      // Usuń param z URL bez przeładowania
      router.replace("/", { scroll: false });
    }

    // Nasłuchuj postMessage ze Service Workera (gdy app jest otwarta i user kliknie push)
    function onSwMessage(event: MessageEvent) {
      if (event.data?.type !== "PRAYER_ALARM") return;
      const presetId = event.data.presetId as string;
      const preset = REMINDER_PRESETS.find(p => p.id === presetId);
      if (!preset) return;
      markFired(presetId); // zapobiega ponownemu odpaleniu przez setInterval
      trigger(preset, 0, effectiveTime(preset, loadConfig()[preset.id]));
    }
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    check();
    const iv = setInterval(check, 10_000);
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    window.addEventListener("salve-test-alarm", onTest);
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.removeEventListener("salve-test-alarm", onTest);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
      if (repeatRef.current) clearInterval(repeatRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    if (repeatRef.current) clearInterval(repeatRef.current);
    stopFanfare();
    if (alarmRef.current && !alarmRef.current.test) markFired(alarmRef.current.preset.id);
    setAlarmSynced(null);
  }

  async function goToPrayer() {
    const preset = alarm?.preset;
    dismiss();
    if (!preset) return;
    const prayerId = await findPrayerForPreset(preset);
    router.push(prayerId ? `/prayers/${prayerId}` : "/prayers");
  }

  if (!alarm) return null;
  const { preset, offsetMin, test } = alarm;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
      style={{ background: "rgba(10,5,2,0.88)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden text-center"
        style={{ background: "linear-gradient(170deg,#3d0a0a,#1c0505)", border: "1px solid rgba(200,146,42,0.45)", boxShadow: "0 0 60px rgba(200,146,42,0.25)" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#c8922a 30%,#e2b86a 50%,#c8922a 70%,transparent)" }} />
        <div className="px-6 pt-8 pb-7">
          {test && (
            <p className="text-[10px] uppercase tracking-[0.3em] mb-3 px-3 py-1 rounded-full inline-block"
              style={{ background: "rgba(200,146,42,0.15)", color: "#e2b86a", border: "1px solid rgba(200,146,42,0.3)" }}>
              Podgląd testowy
            </p>
          )}
          <div className="text-5xl mb-4 animate-pulse">{preset.icon}</div>
          <p className="text-[11px] uppercase tracking-[0.25em] mb-2" style={{ color: "#c8922a" }}>
            {offsetMin > 0 ? `Za ${offsetMin} min — ${alarm.time}` : `Godzina ${alarm.time}`}
          </p>
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Georgia, serif", color: "#fef3d0" }}>
            {preset.title}
          </h2>
          <p className="text-sm leading-relaxed mb-7" style={{ color: "#d9b88a" }}>
            {preset.description}
          </p>
          <div className="flex flex-col gap-2.5">
            <button onClick={goToPrayer}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wide"
              style={{ background: "linear-gradient(135deg,#c8922a,#e2a83e)", color: "#ffffff", fontFamily: "Georgia, serif" }}>
              Przejdź do modlitwy
            </button>
            <button onClick={dismiss}
              className="w-full py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.07)", color: "#d9b88a", border: "1px solid rgba(200,146,42,0.25)" }}>
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
