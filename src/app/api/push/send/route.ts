import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

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

  const { title, body, type, url } = await req.json();

  // Fetch subscriptions based on type
  let query = supabase.from("push_subscriptions").select("*");
  if (type === "news") query = query.eq("news_notifications", true);
  if (type === "action") query = query.eq("action_notifications", true);

  const { data: subscriptions } = await query;
  if (!subscriptions?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    url: url || "/",
    tag: type,
  });

  let sent = 0;
  const failed: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch {
        failed.push(sub.endpoint);
      }
    })
  );

  // Clean up dead subscriptions
  if (failed.length > 0) {
    await supabase.from("push_subscriptions").delete().in("endpoint", failed);
  }

  return NextResponse.json({ sent, failed: failed.length });
}
