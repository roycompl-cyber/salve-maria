import { NextResponse } from "next/server";
import { fetchCampaignList } from "@/lib/polskakatolicka";

export const revalidate = 1800;

export async function GET() {
  try {
    const campaigns = await fetchCampaignList();
    return NextResponse.json(campaigns);
  } catch {
    return NextResponse.json([]);
  }
}
