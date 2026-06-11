import { NextResponse } from "next/server";

export interface DailyReadings {
  date: string;
  readings: { type: string; ref: string; text: string }[];
  gospel: { ref: string; text: string } | null;
}

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/«/g, "«").replace(/»/g, "»")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`https://deon.pl/czytania/date,${today}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 },
    });
    const html = await res.text();

    // Parsuj bloki czytań
    const readings: { type: string; ref: string; text: string }[] = [];
    const blockRe = /<h4 class="element-title">\s*([\w\s]+?)\s*(?:\(([^)]+)\))?\s*<\/h4>\s*<p>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = blockRe.exec(html)) !== null) {
      const type = m[1].trim();
      const ref = m[2]?.trim() ?? "";
      const text = stripHtml(m[3]);
      if (text.length > 20) readings.push({ type, ref, text });
    }

    const gospel = readings.find((r) => r.type.toLowerCase().includes("ewangelia")) ?? null;

    return NextResponse.json({ date: today, readings, gospel }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
