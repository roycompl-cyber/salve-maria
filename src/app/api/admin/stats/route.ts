import { NextResponse } from "next/server";
import { adminClient, requireAdmin } from "@/lib/security";
import type { ClientErrorReport } from "@/lib/error-monitoring";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth) return NextResponse.json({ error: "Brak dostępu" }, { status: 403 });

  const admin = adminClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: users },
    { count: push },
    { count: prayers },
    { count: messages },
    { data: recentProfilesData },
    { data: statsCacheData },
    { data: errorLogData },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("push_subscriptions").select("*", { count: "exact", head: true }),
    admin.from("prayers").select("*", { count: "exact", head: true }),
    admin.from("contact_messages").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo),
    admin
      .from("content_cache")
      .select("key, data")
      .like("key", "stats_%"),
    admin
      .from("content_cache")
      .select("data")
      .eq("key", "error_log")
      .single(),
  ]);

  // Group recentUsers by date
  const usersByDate: Record<string, number> = {};
  for (const p of recentProfilesData ?? []) {
    const date = (p.created_at as string).slice(0, 10);
    usersByDate[date] = (usersByDate[date] ?? 0) + 1;
  }
  const recentUsers = Object.entries(usersByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Aggregate stats from content_cache
  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const cutoff7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const pageAgg: Record<string, { title: string; total: number }> = {};
  const dayTotals: Record<string, number> = {};

  for (const row of statsCacheData ?? []) {
    const dateStr = (row.key as string).replace("stats_", "");
    if (dateStr < cutoff30) continue;

    const data = row.data as Record<string, { count: number; title?: string }>;
    for (const [path, info] of Object.entries(data)) {
      if (!pageAgg[path]) pageAgg[path] = { title: info.title ?? "", total: 0 };
      pageAgg[path].total += info.count;
      if (info.title) pageAgg[path].title = info.title;

      if (dateStr >= cutoff7) {
        dayTotals[dateStr] = (dayTotals[dateStr] ?? 0) + info.count;
      }
    }
  }

  const topPages = Object.entries(pageAgg)
    .map(([path, { title, total }]) => ({ path, title, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  const weeklyViews = Object.entries(dayTotals)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const recentErrors = (Array.isArray(errorLogData?.data) ? errorLogData.data : [])
    .slice(0, 50) as ClientErrorReport[];
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
  const errors24h = recentErrors.filter((error) => Date.parse(error.occurredAt) >= cutoff24h).length;

  return NextResponse.json({
    users: users ?? 0,
    push: push ?? 0,
    prayers: prayers ?? 0,
    messages: messages ?? 0,
    recentUsers,
    topPages,
    weeklyViews,
    recentErrors,
    errors24h,
  });
}
