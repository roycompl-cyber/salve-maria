import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { isPermanentPushFailure, warsawParts } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  webpush.setVapidDetails(
    "mailto:kontakt@fundacja.pl",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const localNow = warsawParts(now);
  // cron_days stores numbers 0-6 (0=Sunday), matching JS getDay()
  const todayDayNum = now.getDay();
  const currentTime = `${String(localNow.hour).padStart(2, "0")}:${String(localNow.minute).padStart(2, "0")}`;

  const { data: scheduled } = await adminClient
    .from("scheduled_notifications")
    .select("*")
    .eq("active", true);

  const toSend = (scheduled ?? []).filter((n) => {
    // Jednorazowe — w oknie 10 minut od zaplanowanego czasu
    if (n.send_at) {
      const sendAt = new Date(n.send_at);
      const diff = now.getTime() - sendAt.getTime();
      return diff >= 0 && diff < 10 * 60 * 1000;
    }
    // Cykliczne — sprawdź godzinę i dzień tygodnia
    if (n.cron_time) {
      const timeMatch = n.cron_time === currentTime;
      const days: number[] = n.cron_days ?? [];
      const dayMatch = days.length === 0 || days.includes(todayDayNum);
      // Nie wysyłaj ponownie jeśli już dziś wysłano
      if (n.last_sent_at) {
        const lastSent = new Date(n.last_sent_at);
        if (warsawParts(lastSent).date === localNow.date) return false;
      }
      return timeMatch && dayMatch;
    }
    return false;
  });

  let totalSent = 0;
  const failed: string[] = [];

  for (const notif of toSend) {
    // Pobierz subskrypcje przez adminClient (omija RLS)
    const { data: subs } = await adminClient
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, news_notifications, action_notifications");

    for (const sub of subs ?? []) {
      if (notif.type === "news" && !sub.news_notifications) continue;
      if (notif.type === "action" && !sub.action_notifications) continue;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: notif.title,
            body: notif.body,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-96.png",
            url: notif.url || "/announcements",
            tag: notif.type,
          })
        );
        totalSent++;
      } catch (error) {
        if (isPermanentPushFailure(error)) failed.push(sub.endpoint);
      }
    }

    // Usuń martwe subskrypcje
    if (failed.length > 0) {
      await adminClient.from("push_subscriptions").delete().in("endpoint", failed);
    }

    // Zapisz ostatnie wysłanie
    await adminClient
      .from("scheduled_notifications")
      .update({ last_sent_at: now.toISOString() })
      .eq("id", notif.id);

    // Zapisz do historii
    await adminClient.from("push_log").insert({
      title: notif.title,
      body: notif.body,
      type: notif.type,
      url: notif.url || "/announcements",
    });

    // Dezaktywuj jednorazowe po wysłaniu
    if (notif.send_at) {
      await adminClient
        .from("scheduled_notifications")
        .update({ active: false })
        .eq("id", notif.id);
    }
  }

  // Odśwież cache artykułów i petycji
  try {
    const { fetchArticleList, fetchPetitionList } = await import("@/lib/polskakatolicka");
    const [articles, petitions] = await Promise.all([fetchArticleList(), fetchPetitionList()]);
    await Promise.all([
      adminClient.from("content_cache").upsert({ key: "articles", data: articles, updated_at: new Date().toISOString() }),
      adminClient.from("content_cache").upsert({ key: "petitions", data: petitions, updated_at: new Date().toISOString() }),
    ]);
  } catch { /* nie przerywaj crona jeśli fetch się nie udał */ }

  return NextResponse.json({ ok: true, processed: toSend.length, sent: totalSent, failed: failed.length });
}
