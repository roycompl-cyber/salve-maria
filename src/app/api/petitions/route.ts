import { NextResponse } from "next/server";
import { fetchPetitionList } from "@/lib/polskakatolicka";

export const revalidate = 1800;

export async function GET() {
  try {
    const petitions = await fetchPetitionList();
    return NextResponse.json(petitions);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
