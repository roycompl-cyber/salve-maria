"use client";
import { use, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { ArrowLeft, Share2, Heart, Type, Loader2 } from "lucide-react";

interface Prayer {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  tags: string[];
}

export default function PrayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetch("/api/admin/prayers")
      .then((r) => r.json())
      .then((data: Prayer[]) => {
        const found = Array.isArray(data) ? data.find((p) => p.id === id) : null;
        setPrayer(found ?? null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleShare() {
    if (!prayer) return;
    if (navigator.share) {
      await navigator.share({ title: prayer.title, text: prayer.content.slice(0, 200) });
    }
  }

  const fontSizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg" }[fontSize];

  return (
    <AppShell>
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/prayers" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Modlitwy
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFontSize(fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : "sm")}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Zmień rozmiar tekstu"
            >
              <Type size={16} />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors ${liked ? "text-red-400" : "text-slate-400 hover:text-white"}`}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
            </button>
            <button onClick={handleShare} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 size={24} className="text-blue-400 animate-spin" />
          </div>
        )}

        {!loading && !prayer && (
          <div className="px-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">
              Nie znaleziono modlitwy.
            </div>
          </div>
        )}

        {prayer && (
          <div className="px-4 pb-8">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
                {prayer.category}
              </span>
              {prayer.language === "la" && (
                <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full">
                  Łaciński
                </span>
              )}
            </div>

            <h1 className="text-white text-2xl font-bold mb-6 leading-tight">{prayer.title}</h1>

            <div className={`${fontSizeClass} text-slate-200 leading-relaxed whitespace-pre-line font-serif space-y-1`}>
              {prayer.content.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-3" />;
                if (line.match(/^[IVX]+\./)) return <p key={i} className="text-blue-300 font-bold mt-4 mb-1">{line}</p>;
                return <p key={i}>{line}</p>;
              })}
            </div>

            {prayer.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-slate-800">
                {prayer.tags.map((tag) => (
                  <span key={tag} className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
