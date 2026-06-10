import { NextRequest, NextResponse } from "next/server";
import { fetchArticle } from "@/lib/polskakatolicka";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const article = await fetchArticle(slug);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(article);
}
