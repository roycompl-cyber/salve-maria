import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

export const dynamic = "force-dynamic";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export async function GET(req: NextRequest) {
  webpush.setVapidDetails(
    "mailto:kontakt@skargi.pl",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  // Vercel Cron wywołuje GET z nagłówkiem Authorization
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const todayDay = DAYS[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Pobierz aktywne zaplanowane powiadomienia
  const { data: scheduled } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .eq("active", true);

  const toSend = (scheduled ?? []).filter((n) => {
    if (!n.active) return false;
    // Jednorazowe
    if (n.send_at) {
      const sendAt = new Date(n.send_at);
      const diff = Math.abs(now.getTime() - sendAt.getTime());
      return diff < 60 * 1000 * 5; // w oknie 5 minut
    }
    // Cykliczne
    if (n.cron_time) {
      const timeMatch = n.cron_time === currentTime;
      const dayMatch = !n.cron_days?.length || n.cron_days.includes("*") || n.cron_days.includes(todayDay);
      // Sprawdź czy nie wysłane dziś
      if (n.last_sent_at) {
        const lastSent = new Date(n.last_sent_at);
        const sameDay = lastSent.toDateString() === now.toDateString();
        if (sameDay) return false;
      }
      return timeMatch && dayMatch;
    }
    return false;
  });

  let sent = 0;
  for (const notif of toSend) {
    const { data: subs } = await supabase.from("push_subscriptions").select("subscription");
    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(sub.subscription, JSON.stringify({
          title: notif.title,
          body: notif.body,
          type: notif.type,
          url: notif.url || "/",
        }));
        sent++;
      } catch { /* ignoruj błędy pojedynczego sub */ }
    }
    await supabase.from("scheduled_notifications")
      .update({ last_sent_at: now.toISOString() })
      .eq("id", notif.id);
    // Dezaktywuj jednorazowe
    if (notif.send_at) {
      await supabase.from("scheduled_notifications").update({ active: false }).eq("id", notif.id);
    }
  }

  return NextResponse.json({ ok: true, processed: toSend.length, sent });
}
