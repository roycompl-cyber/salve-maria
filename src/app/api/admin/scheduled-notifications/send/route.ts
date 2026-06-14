import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Brak id" }, { status: 400 });

  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: notif } = await adminClient
    .from("scheduled_notifications")
    .select("*")
    .eq("id", id)
    .single();

  if (!notif) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });

  const { data: subs } = await adminClient
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");

  let sent = 0;
  const failed: string[] = [];

  for (const sub of subs ?? []) {
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
      sent++;
    } catch {
      failed.push(sub.endpoint);
    }
  }

  if (failed.length > 0) {
    await adminClient.from("push_subscriptions").delete().in("endpoint", failed);
  }

  await adminClient
    .from("scheduled_notifications")
    .update({ last_sent_at: new Date().toISOString() })
    .eq("id", id);

  await adminClient.from("push_log").insert({
    title: notif.title,
    body: notif.body,
    type: notif.type,
    url: notif.url || "/announcements",
  });

  return NextResponse.json({ sent, failed: failed.length });
}
