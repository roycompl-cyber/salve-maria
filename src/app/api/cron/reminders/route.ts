import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { isPermanentPushFailure, warsawParts } from "@/lib/security";

export const dynamic = "force-dynamic";

const PRESETS = [
  { id: "angelus-12",     title: "Anioł Pański",                   time: "12:00", icon: "🕊", description: "Anioł Pański zwiastował Pannie Maryi…" },
  { id: "koronka-15",     title: "Koronka do Miłosierdzia Bożego", time: "15:00", icon: "✝", description: "Godzina Miłosierdzia — dla Jego bolesnej męki…" },
  { id: "angelus-18",     title: "Anioł Pański",                   time: "18:00", icon: "🕊", description: "Anioł Pański zwiastował Pannie Maryi…" },
  { id: "rozaniec-20",    title: "Różaniec",                       time: "20:00", icon: "📿", description: "Wieczorna modlitwa różańcowa" },
  { id: "apel-21",        title: "Apel Jasnogórski",               time: "21:00", icon: "👑", description: "Maryjo, Królowo Polski — jestem przy Tobie, pamiętam, czuwam" },
  { id: "poranna-07",     title: "Modlitwa poranna",               time: "07:00", icon: "🌅", description: "Ofiarowanie dnia Panu Bogu" },
  { id: "loretanska-maj", title: "Litania Loretańska",             time: "18:00", icon: "🌸", description: "Nabożeństwo majowe ku czci Najświętszej Maryi Panny", month: 5 },
  { id: "serce-czerwiec", title: "Litania do Serca Pana Jezusa",   time: "18:00", icon: "❤",  description: "Nabożeństwo czerwcowe ku czci Najświętszego Serca Pana Jezusa", month: 6 },
] as const;

interface ReminderSettings { enabled: boolean; offsetMin: number; time?: string; }

function effectiveTime(presetTime: string, s: ReminderSettings) {
  return s.time || presetTime;
}

function isDue(preset: { time: string; month?: number }, s: ReminderSettings, nowMinutes: number, month: number, id: string, firedToday: Set<string>) {
  if (!s.enabled || firedToday.has(id)) return false;
  if (preset.month && month !== preset.month) return false;
  const [h, m] = effectiveTime(preset.time, s).split(":").map(Number);
  const targetMinutes = (h * 60 + m - (s.offsetMin ?? 0) + 1440) % 1440;
  const diff = (nowMinutes - targetMinutes + 1440) % 1440;
  // 10-minutowe okno: obsługuje opóźnienia crona i ponowne uruchomienia
  return diff < 10;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(
    "mailto:kontakt@fundacja.pl",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const db = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = warsawParts();
  const today = now.date;
  const nowMinutes = now.hour * 60 + now.minute;

  const { data: subs, error: fetchError } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, reminder_config, reminder_fired")
    .not("reminder_config", "is", null);

  if (fetchError) {
    return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
  }

  if (!subs?.length) return NextResponse.json({ ok: true, sent: 0 });

  let totalSent = 0;
  const expiredEndpoints: string[] = []; // tylko 410 Gone — subskrypcja definitywnie wygasła

  for (const sub of subs) {
    const config: Record<string, ReminderSettings> = sub.reminder_config ?? {};
    const fired: Record<string, string> = sub.reminder_fired ?? {};
    const firedToday = new Set(
      Object.entries(fired).filter(([, d]) => d === today).map(([id]) => id)
    );

    for (const preset of PRESETS) {
      const s = config[preset.id];
      if (!s || !isDue(preset, s, nowMinutes, now.month, preset.id, firedToday)) continue;

      const time = effectiveTime(preset.time, s);
      const offsetMin = s.offsetMin ?? 0;

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: `${preset.icon} ${preset.title}`,
            body: offsetMin > 0
              ? `Za ${offsetMin} min (${time}) — ${preset.description}`
              : `${time} — ${preset.description}`,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-96.png",
            url: `/?alarm=${preset.id}`,
            tag: `prayer-${preset.id}`,
          })
        );

        totalSent++;
        firedToday.add(preset.id); // zapobiega duplikatom w tej samej iteracji

        // Zapisz że alarm już dziś wysłany
        const updatedFired = { ...fired, [preset.id]: today };
        await db.from("push_subscriptions")
          .update({ reminder_fired: updatedFired })
          .eq("endpoint", sub.endpoint);

      } catch (err: unknown) {
        // Usuń subskrypcję tylko gdy endpoint definitywnie wygasł (HTTP 410 Gone)
        if (isPermanentPushFailure(err)) {
          expiredEndpoints.push(sub.endpoint);
          break; // nie ma sensu próbować kolejnych presetów dla tego endpointu
        }
        // Inne błędy (sieciowe, tymczasowe) — ignoruj, spróbujemy za minutę
      }
    }
  }

  if (expiredEndpoints.length > 0) {
    await db.from("push_subscriptions").delete().in("endpoint", expiredEndpoints);
  }

  return NextResponse.json({ ok: true, sent: totalSent, expired: expiredEndpoints.length, checked: subs.length });
}
