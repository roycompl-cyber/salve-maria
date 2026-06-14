import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { error: "Migracje przez API są wyłączone. Użyj kontrolowanej migracji SQL." },
    { status: 410 }
  );
}
