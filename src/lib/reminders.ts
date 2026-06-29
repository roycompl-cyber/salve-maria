// Przypomnienia modlitewne — presety, zapis lokalny, dźwięk fanfary

export interface ReminderPreset {
  id: string;
  title: string;
  time: string; // HH:MM
  description: string;
  icon: string; // emoji
  /** frazy do odnalezienia modlitwy w modlitewniku (pierwsze trafienie wygrywa) */
  prayerTerms: string[];
  /** przypomnienie aktywne tylko w tym miesiącu (1–12) */
  month?: number;
  /** użytkownik może sam ustawić godzinę */
  editableTime?: boolean;
}

export interface ReminderSettings {
  enabled: boolean;
  offsetMin: number; // ile minut przed (0 = punktualnie)
  /** godzina ustawiona ręcznie (nadpisuje preset.time) */
  time?: string;
}

export type ReminderConfig = Record<string, ReminderSettings>;

export const REMINDER_PRESETS: ReminderPreset[] = [
  { id: "angelus-12",  title: "Anioł Pański",                    time: "12:00", description: "Anioł Pański zwiastował Pannie Maryi…", icon: "🕊", prayerTerms: ["anioł pański"] },
  { id: "koronka-15",  title: "Koronka do Miłosierdzia Bożego",  time: "15:00", description: "Godzina Miłosierdzia — dla Jego bolesnej męki…", icon: "✝", prayerTerms: ["koronka do bożego miłosierdzia", "koronka"] },
  { id: "angelus-18",  title: "Anioł Pański",                    time: "18:00", description: "Anioł Pański zwiastował Pannie Maryi…", icon: "🕊", prayerTerms: ["anioł pański"] },
  { id: "rozaniec-20", title: "Różaniec",                        time: "20:00", description: "Wieczorna modlitwa różańcowa", icon: "📿", prayerTerms: ["różaniec"] },
  { id: "apel-21",     title: "Apel Jasnogórski",                time: "21:00", description: "Maryjo, Królowo Polski — jestem przy Tobie, pamiętam, czuwam", icon: "👑", prayerTerms: ["apel jasnogórski", "zdrowaś maryjo"] },
  { id: "poranna-07",  title: "Modlitwa poranna",                time: "07:00", description: "Ofiarowanie dnia Panu Bogu", icon: "🌅", prayerTerms: ["modlitwa poranna"] },
  { id: "loretanska-maj", title: "Litania Loretańska",           time: "18:00", description: "Nabożeństwo majowe ku czci Najświętszej Maryi Panny", icon: "🌸", prayerTerms: ["litania loretańska"], month: 5, editableTime: true },
  { id: "serce-czerwiec", title: "Litania do Serca Pana Jezusa", time: "18:00", description: "Nabożeństwo czerwcowe ku czci Najświętszego Serca Pana Jezusa", icon: "❤", prayerTerms: ["litania do serca pana jezusa"], month: 6, editableTime: true },
];

/** Skuteczna godzina przypomnienia: ręczna (jeśli ustawiona) albo z presetu */
export function effectiveTime(preset: ReminderPreset, s?: ReminderSettings): string {
  return (preset.editableTime && s?.time) || preset.time;
}

/** Tajemnice różańca przypisane do dni tygodnia (0 = niedziela) */
const ROSARY_BY_DAY = [
  "tajemnice chwalebne", // nd
  "tajemnice radosne",   // pn
  "tajemnice bolesne",   // wt
  "tajemnice chwalebne", // śr
  "tajemnice światła",   // czw
  "tajemnice bolesne",   // pt
  "tajemnice radosne",   // sob
];

/** Znajduje w modlitewniku modlitwę powiązaną z przypomnieniem; zwraca id albo null */
export async function findPrayerForPreset(preset: ReminderPreset): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/prayers");
    const prayers: { id: string; title: string }[] = await res.json();
    if (!Array.isArray(prayers)) return null;

    const terms = preset.id === "rozaniec-20"
      ? [ROSARY_BY_DAY[new Date().getDay()], ...preset.prayerTerms]
      : preset.prayerTerms;

    for (const term of terms) {
      const hit = prayers.find(p => p.title.toLowerCase().includes(term));
      if (hit) return hit.id;
    }
    return null;
  } catch { return null; }
}

const STORAGE_KEY = "salve_prayer_reminders_v1";
const FIRED_KEY = "salve_reminders_fired_v1";
const GLOBAL_KEY = "salve_reminders_global_v1";

export interface GlobalReminderSettings {
  /** ile razy powtórzyć fanfarę przy alarmie (1–3) */
  fanfareRepeats: number;
}

export function loadGlobal(): GlobalReminderSettings {
  try {
    const g = JSON.parse(localStorage.getItem(GLOBAL_KEY) ?? "{}");
    return { fanfareRepeats: Math.min(3, Math.max(1, g.fanfareRepeats ?? 1)) };
  } catch { return { fanfareRepeats: 1 }; }
}

export function saveGlobal(g: GlobalReminderSettings) {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(g));
}

export function loadConfig(): ReminderConfig {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

export function saveConfig(cfg: ReminderConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  syncConfigToServer(cfg);
}

/** Wysyła aktualną konfigurację przypomnień do serwera (dla crona push).
 *  Wywołuje się tylko gdy przeglądarka ma aktywną subskrypcję push. */
export async function syncConfigToServer(cfg: ReminderConfig) {
  if (typeof window === "undefined") return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
    await fetch("/api/push/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, config: cfg }),
    });
  } catch { /* brak SW lub subskrypcji — ignoruj, cron nie zadziała ale app działa */ }
}

// Ochrona przed wielokrotnym odpaleniem tego samego alarmu jednego dnia
function loadFired(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}"); }
  catch { return {}; }
}

export function markFired(id: string) {
  const fired = loadFired();
  fired[id] = new Date().toDateString();
  localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
}

export function wasFiredToday(id: string): boolean {
  return loadFired()[id] === new Date().toDateString();
}

/** Zwraca preset, który właśnie powinien się odpalić (z uwzględnieniem offsetu), albo null */
export function dueReminder(cfg: ReminderConfig, now = new Date()): { preset: ReminderPreset; settings: ReminderSettings } | null {
  for (const preset of REMINDER_PRESETS) {
    const s = cfg[preset.id];
    if (!s?.enabled || wasFiredToday(preset.id)) continue;
    // przypomnienia sezonowe — tylko we wskazanym miesiącu
    if (preset.month && now.getMonth() + 1 !== preset.month) continue;

    const [h, m] = effectiveTime(preset, s).split(":").map(Number);
    const target = new Date(now);
    target.setHours(h, m - s.offsetMin, 0, 0);

    const diff = now.getTime() - target.getTime();
    // okno 5 minut — obsługuje throttlowane taby i późne otwarcie aplikacji
    if (diff >= 0 && diff < 5 * 60_000) return { preset, settings: s };
  }
  return null;
}

/* ── Melodia powiadomienia — Web Audio API (bez plików, bez pluginów) ─────── */

type AC = typeof AudioContext;
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
    return new Ctor();
  } catch { return null; }
}

let fanfareTimer: ReturnType<typeof setTimeout> | null = null;
let stopCurrent: (() => void) | null = null;

/** Czas trwania jednej melodii w sekundach */
export const FANFARE_SECONDS = 3.2;

/** Wycisza i zatrzymuje melodię */
export function stopFanfare() {
  if (fanfareTimer) { clearTimeout(fanfareTimer); fanfareTimer = null; }
  stopCurrent?.();
  stopCurrent = null;
}

/**
 * Gra spokojną melodię modlitewną przez Web Audio API.
 * Sekwencja nut: G4 – A4 – C5 – A4 – E4 (pentatonika, łagodna fala sinus).
 * Żadnych zewnętrznych plików ani uprawnień.
 */
function playChime(): (() => void) | null {
  const ctx = getAudioContext();
  if (!ctx) return null;

  // Nuty: [częstotliwość Hz, start s, czas trwania s]
  const notes: [number, number, number][] = [
    [392.0, 0.00, 0.55],  // G4
    [440.0, 0.45, 0.55],  // A4
    [523.3, 0.90, 0.70],  // C5
    [440.0, 1.50, 0.55],  // A4
    [329.6, 2.00, 1.10],  // E4  — końcowa
  ];

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.38, ctx.currentTime);
  master.connect(ctx.destination);

  const oscs: OscillatorNode[] = [];

  for (const [freq, start, dur] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const t0 = ctx.currentTime + start;
    // Łagodne wejście i wyjście (fade-in 40 ms, fade-out ostatnie 30%)
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(1, t0 + 0.04);
    gain.gain.setValueAtTime(1, t0 + dur * 0.7);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur);
    oscs.push(osc);
  }

  const ctxClose = () => { try { ctx.close(); } catch { /* ok */ } };
  const lastEnd = ctx.currentTime + 3.2;
  const tid = setTimeout(ctxClose, (lastEnd - ctx.currentTime + 0.5) * 1000);

  return () => {
    clearTimeout(tid);
    oscs.forEach(o => { try { o.stop(); } catch { /* ok */ } });
    ctxClose();
  };
}

/** Odtwarza melodię (z powtórzeniami ustawionymi globalnie) */
export function playFanfare() {
  if (typeof window === "undefined") return;
  stopFanfare();

  const { fanfareRepeats } = loadGlobal();
  let played = 0;

  function play() {
    stopCurrent?.();
    stopCurrent = playChime() ?? null;
    played++;
    if (played < fanfareRepeats) {
      fanfareTimer = setTimeout(play, (FANFARE_SECONDS + 0.8) * 1000);
    }
  }

  play();
}

/** Nie jest już potrzebna (brak pliku do preładowania), zachowana dla kompatybilności */
export function preloadFanfare() { /* no-op */ }

let audioUnlocked = false;

/** Odblokowuje AudioContext przy pierwszym geście użytkownika */
export function unlockAudio() {
  if (audioUnlocked || typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.001);
    osc.addEventListener("ended", () => { ctx.close(); });
    audioUnlocked = true;
  } catch { /* przeglądarka bez Web Audio */ }
}
