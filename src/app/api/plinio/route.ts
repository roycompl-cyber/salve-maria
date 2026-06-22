import { NextResponse } from "next/server";
import { getQuoteForDay } from "@/lib/plinio-quotes";
import { warsawParts } from "@/lib/security";

export const dynamic = "force-dynamic";

function dayOfYear(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const start = new Date(year, 0, 0);
  const date = new Date(year, month - 1, day);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function GET() {
  const { date } = warsawParts();
  const day = dayOfYear(date);
  const quote = getQuoteForDay(day);
  return NextResponse.json({ ...quote, date });
}
