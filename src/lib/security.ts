import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Na Vercel każda instancja (cold start) ma własną mapę — rate limit działa
// per-instancja, nie globalnie. Wystarczy jako podstawowa ochrona przed burstami.
// Dla twardego rate-limitingu potrzeba Redis (np. Upstash).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/** Returns the effective role for a user, promoting to 'superadmin' if they are in the superadmin_ids list. */
export async function getEffectiveRole(userId: string, dbRole: string | null | undefined): Promise<string> {
  const admin = adminClient();
  const { data } = await admin.from("app_settings").select("value").eq("key", "superadmin_ids").single();
  let ids: string[] = [];
  try { ids = JSON.parse(data?.value ?? "[]"); } catch { /* ignore */ }
  if (ids.includes(userId)) return "superadmin";
  return dbRole ?? "donor";
}

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const effectiveRole = await getEffectiveRole(user.id, data?.role);
  return (effectiveRole === "admin" || effectiveRole === "superadmin") ? { supabase, user, role: effectiveRole } : null;
}

export function rateLimit(
  req: NextRequest,
  options: { key: string; limit: number; windowMs: number }
) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || req.headers.get("x-real-ip") || "unknown";
  const key = `${options.key}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    // Usuń przeterminowane wpisy co 500 żądań, żeby mapa nie rosła bez końca
    if (buckets.size > 500) {
      for (const [k, v] of buckets) { if (v.resetAt <= now) buckets.delete(k); }
    }
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Zbyt wiele żądań. Spróbuj ponownie później." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  current.count += 1;
  return null;
}

export function safeInternalUrl(value: unknown, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value.slice(0, 500);
}

export function warsawParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    month: Number(value("month")),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

export function isPermanentPushFailure(error: unknown) {
  const statusCode = (error as { statusCode?: number })?.statusCode;
  return statusCode === 404 || statusCode === 410;
}

export async function isLastAdmin(userId: string) {
  const admin = adminClient();
  const [{ data: profile }, { count }, { data: saSettings }] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).single(),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("app_settings").select("value").eq("key", "superadmin_ids").single(),
  ]);
  let superadminIds: string[] = [];
  try { superadminIds = JSON.parse(saSettings?.value ?? "[]"); } catch { /* ignore */ }
  const isSuperadmin = superadminIds.includes(userId);
  const isAdmin = profile?.role === "admin" || isSuperadmin;
  // Count all admins (db admins + superadmins)
  const totalAdmins = (count ?? 0) + (isSuperadmin ? 0 : 0); // superadmins are not in role=admin
  return isAdmin && totalAdmins <= 1 && superadminIds.length === 0;
}
