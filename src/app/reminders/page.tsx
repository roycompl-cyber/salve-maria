"use client";
import { useEffect, useRef, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  REMINDER_PRESETS, loadConfig, saveConfig, loadGlobal, saveGlobal,
  playFanfare, stopFanfare, effectiveTime, FANFARE_SECONDS, ReminderConfig,
  syncConfigToServer,
} from "@/lib/reminders";
import { urlBase64ToUint8Array } from "@/lib/utils";

const MONTHS_PL = ["", "styczniu", "lutym", "marcu", "kwietniu", "maju", "czerwcu", "lipcu", "sierpniu", "wrześniu", "październiku", "listopadzie", "grudniu"];
const OFFSETS = [0, 5, 10, 15];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} aria-pressed={value}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${value ? "bg-amber-600" : "bg-slate-600"}`}>
      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

/** Żąda subskrypcji push i rejestruje ją w bazie. Zwraca endpoint lub null. */
async function ensurePushSubscription(): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    });
    // Upewnij się że subskrypcja jest zapisana w bazie
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub,
        settings: { news_notifications: true, action_notifications: true, prayer_reminder_enabled: true, prayer_reminder_time: "07:00" },
      }),
    });
    return sub.endpoint;
  } catch { return null; }
}

export default function RemindersPage() {
  const [cfg, setCfg] = useState<ReminderConfig>({});
  const [loaded, setLoaded] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | "unsupported">("default");
  const [repeats, setRepeats] = useState(1);
  const [melody, setMelody] = useState<0 | 1>(0);
  const [pushReady, setPushReady] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setCfg(loadConfig());
    const g = loadGlobal();
    setRepeats(g.fanfareRepeats);
    setMelody(g.melody);
    setLoaded(true);
    if ("Notification" in window) {
      setNotifPerm(Notification.permission);
      setPushReady(Notification.permission === "granted" && "PushManager" in window);
    } else {
      setNotifPerm("unsupported");
    }
  }, []);

  function updateRepeats(n: number) {
    setRepeats(n);
    saveGlobal({ fanfareRepeats: n, melody });
  }

  function updateMelody(m: 0 | 1) {
    setMelody(m);
    saveGlobal({ fanfareRepeats: repeats, melody: m });
  }

  function testAlarm() {
    const firstEnabled = REMINDER_PRESETS.find(p => cfg[p.id]?.enabled);
    window.dispatchEvent(new CustomEvent("salve-test-alarm", { detail: { presetId: firstEnabled?.id } }));
  }

  const [testing, setTesting] = useState(false);
  const testTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggleFanfareTest() {
    if (testing) {
      stopFanfare();
      if (testTimer.current) clearTimeout(testTimer.current);
      setTesting(false);
    } else {
      playFanfare();
      setTesting(true);
      testTimer.current = setTimeout(() => setTesting(false), FANFARE_SECONDS * 1000);
    }
  }

  useEffect(() => () => { stopFanfare(); if (testTimer.current) clearTimeout(testTimer.current); }, []);

  async function update(id: string, patch: Partial<{ enabled: boolean; offsetMin: number; time: string }>) {
    const next: ReminderConfig = {
      ...cfg,
      [id]: { enabled: cfg[id]?.enabled ?? false, offsetMin: cfg[id]?.offsetMin ?? 0, ...patch },
    };
    setCfg(next);
    saveConfig(next);

    // Przy pierwszym włączeniu: zażądaj subskrypcji push i wyślij config
    const enablingNow = patch.enabled === true;
    if (enablingNow && !pushReady) {
      setSyncing(true);
      const endpoint = await ensurePushSubscription();
      if (endpoint) {
        setNotifPerm("granted");
        setPushReady(true);
        await syncConfigToServer(next);
      }
      setSyncing(false);
    } else {
      // Zawsze synchronizuj z serwerem (działa w tle)
      syncConfigToServer(next);
    }
  }

  const enabledCount = Object.values(cfg).filter(s => s.enabled).length;
  const anyEnabled = enabledCount > 0;

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
              Przypomnienia modlitewne
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {enabledCount > 0 ? `Aktywne: ${enabledCount}` : "Wybierz modlitwy, o których mamy przypominać"}
            </p>
          </div>
          <Link href="/" className="text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            <Icon name="chevron-left" size={20} />
          </Link>
        </div>

        {/* Banner o działaniu push */}
        <div className="rounded-2xl px-4 py-3 mt-4 mb-4 border"
          style={{ background: anyEnabled && pushReady ? "rgba(21,128,61,0.12)" : "rgba(30,20,5,0.5)", borderColor: anyEnabled && pushReady ? "rgba(21,128,61,0.35)" : "rgba(100,90,60,0.3)" }}>
          {anyEnabled && pushReady ? (
            <p className="text-green-400 text-xs leading-relaxed">
              ✓ Przypomnienia działają przez powiadomienia push — będą działać nawet gdy telefon ma wyłączony ekran lub przeglądarka jest zamknięta.
            </p>
          ) : anyEnabled && notifPerm === "denied" ? (
            <p className="text-amber-400 text-xs leading-relaxed">
              Notyfikacje push są zablokowane w ustawieniach przeglądarki. Otwórz ustawienia strony i zezwól na powiadomienia, aby alarmy działały z wyłączonym ekranem.
            </p>
          ) : (
            <p className="text-slate-400 text-xs leading-relaxed">
              Włącz dowolne przypomnienie — aplikacja poprosi o zgodę na powiadomienia push, dzięki którym alarm zadziała nawet przy wyłączonym ekranie telefonu.
            </p>
          )}
          {syncing && <p className="text-amber-400 text-xs mt-1">Konfigurowanie powiadomień push…</p>}
        </div>

        {notifPerm === "unsupported" && (
          <div className="rounded-2xl px-4 py-3 mb-4 bg-slate-800/60 border border-slate-700/50">
            <p className="text-slate-400 text-xs">Ta przeglądarka nie obsługuje powiadomień push. Alarmy zadziałają tylko gdy aplikacja jest otwarta.</p>
          </div>
        )}

        {/* Wybór melodii + powtórzenia */}
        <div className="rounded-2xl bg-slate-800 border border-slate-700/50 px-4 py-3.5 mb-4 space-y-4">
          <div>
            <p className="text-white text-sm font-semibold mb-2.5" style={{ fontFamily: "Georgia, serif" }}>
              Melodia powiadomienia
            </p>
            <div className="flex gap-2">
              <button onClick={() => updateMelody(0)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${melody === 0 ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                Melodia 1
              </button>
              <button onClick={() => updateMelody(1)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${melody === 1 ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                Melodia 2
              </button>
            </div>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-2.5" style={{ fontFamily: "Georgia, serif" }}>
              Powtórzenia melodii
            </p>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => updateRepeats(n)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${repeats === n ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                  {n}×
                </button>
              ))}
            </div>
          </div>
          <p className="text-slate-500 text-xs">Dotyczy dźwięku w aplikacji. Push wyśle powiadomienie jednorazowo.</p>
        </div>

        {/* Testy */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <button onClick={toggleFanfareTest}
            className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border transition-colors ${
              testing ? "bg-red-900/40 border-red-700/60 text-red-300" : "bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700"
            }`}>
            <Icon name="bell" size={16} /> {testing ? "Wyłącz test" : "Test melodii"}
          </button>
          <button onClick={testAlarm}
            className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 bg-slate-800 border border-slate-700 text-amber-400 hover:bg-slate-700 transition-colors">
            <Icon name="petition" size={16} /> Test komunikatu
          </button>
        </div>

        {/* Lista presetów */}
        <div className="space-y-2.5 pb-6">
          {loaded && REMINDER_PRESETS.map(preset => {
            const s = cfg[preset.id];
            const enabled = s?.enabled ?? false;
            const offset = s?.offsetMin ?? 0;
            return (
              <div key={preset.id}
                className="rounded-2xl bg-slate-800 border border-slate-700/50 px-4 py-3.5 transition-colors"
                style={enabled ? { borderColor: "rgba(217,119,6,0.4)" } : undefined}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                      {preset.title}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {preset.month ? `Codziennie w ${MONTHS_PL[preset.month]}` : "Codziennie"} o{" "}
                      <span className="font-semibold text-amber-400">{effectiveTime(preset, s)}</span>
                    </p>
                  </div>
                  <Toggle value={enabled} onChange={v => update(preset.id, { enabled: v })} />
                </div>

                {enabled && preset.editableTime && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-2.5">
                    <span className="text-slate-400 text-xs">Godzina:</span>
                    <input type="time" value={effectiveTime(preset, s)}
                      onChange={e => e.target.value && update(preset.id, { time: e.target.value })}
                      className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-600" />
                  </div>
                )}

                {enabled && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center gap-2 flex-wrap">
                    <span className="text-slate-400 text-xs">Przypomnij:</span>
                    {OFFSETS.map(min => (
                      <button key={min} onClick={() => update(preset.id, { offsetMin: min })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          offset === min ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}>
                        {min === 0 ? "punktualnie" : `${min} min przed`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
