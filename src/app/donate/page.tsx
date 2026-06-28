"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DONATE_URL = "https://polskakatolicka.org/pl/wplata-na-kampanie?payment=4631d9866d1c0f17d328b28a50f102";

export default function DonatePage() {
  const router = useRouter();

  useEffect(() => {
    window.location.href = `/viewer?url=${encodeURIComponent(DONATE_URL)}`;
  }, []);

  return null;
}
