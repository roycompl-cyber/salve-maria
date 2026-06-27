import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { isPermanentPushFailure, safeInternalUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  webpush.setVapidDetails(
    "mailto:kontakt@fundacja.pl",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body, type, url, cities } = await req.json();
  if (
    typeof title !== "string" || title.trim().length < 1 || title.length > 120 ||
    typeof body !== "string" || body.trim().length < 1 || body.length > 1000 ||
    !["news", "action", "prayer", "general", "article", "petition"].includes(type)
  ) {
    return NextResponse.json({ error: "Nieprawidłowe dane powiadomienia" }, { status: 400 });
  }
  const notificationUrl = safeInternalUrl(url, "/announcements");

  // Admin client omija RLS — widzi subskrypcje wszystkich użytkowników
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const filterCities = Array.isArray(cities) && cities.length > 0 ? cities as string[] : null;

  let subscriptions: { endpoint: string; p256dh: string; auth: string; user_id?: string }[] = [];

  if (filterCities) {
    // Geographic filter: get user_ids with matching city from profiles, then filter subscriptions
    const { data: profileMatches } = await adminClient
      .from("profiles")
      .select("id")
      .in("city", filterCities);
    const userIds = (profileMatches ?? []).map((p: { id: string }) => p.id);
    if (userIds.length === 0) {
      return NextResponse.json({ sent: 0 });
    }
    let geoQuery = adminClient.from("push_subscriptions").select("*").in("user_id", userIds);
    if (type === "news") geoQuery = geoQuery.eq("news_notifications", true);
    if (type === "action") geoQuery = geoQuery.eq("action_notifications", true);
    const { data } = await geoQuery;
    subscriptions = data ?? [];
  } else {
    let query = adminClient.from("push_subscriptions").select("*");
    if (type === "news") query = query.eq("news_notifications", true);
    if (type === "action") query = query.eq("action_notifications", true);
    const { data } = await query;
    subscriptions = data ?? [];
  }

  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }
  const allSubs = subscriptions;

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: notificationUrl,
    tag: type,
  });

  let sent = 0;
  const failed: string[] = [];

  await Promise.allSettled(
    allSubs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (error) {
        if (isPermanentPushFailure(error)) failed.push(sub.endpoint);
      }
    })
  );

  // Clean up dead subscriptions
  if (failed.length > 0) {
    await adminClient.from("push_subscriptions").delete().in("endpoint", failed);
  }

  // Zapisz do historii powiadomień
  if (sent > 0) {
    const logUrl = notificationUrl;
    await supabase.from("push_log").insert({ title, body, type, url: logUrl });
  }

  return NextResponse.json({ sent, failed: failed.length });
}
