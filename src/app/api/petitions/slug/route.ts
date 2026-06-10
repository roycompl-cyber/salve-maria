import { NextRequest, NextResponse } from "next/server";
import { fetchPetition } from "@/lib/polskakatolicka";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  const petition = await fetchPetition(slug);
  if (!petition) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(petition);
}
