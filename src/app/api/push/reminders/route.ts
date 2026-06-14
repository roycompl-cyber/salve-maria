import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/push/reminders
 *  Body: { endpoint: string, config: ReminderConfig }
 *  Zapisuje konfigurację przypomnień do kolumny reminder_config w push_subscriptions.
 *  Wymaga zalogowania i aktualizuje wyłącznie subskrypcję bieżącego użytkownika. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, config } = await req.json();
  if (!endpoint || typeof endpoint !== "string" || endpoint.length > 2048 || !config || typeof config !== "object" || Array.isArray(config)) {
    return NextResponse.json({ error: "Brak endpoint lub config" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .update({ reminder_config: config })
    .eq("endpoint", endpoint)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
