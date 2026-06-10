import { NextResponse } from "next/server";
import { fetchArticleList } from "@/lib/polskakatolicka";

export const revalidate = 3600;

export async function GET() {
  try {
    const articles = await fetchArticleList();
    return NextResponse.json(articles);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
