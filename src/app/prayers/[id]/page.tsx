"use client";
import { use, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Heart, Type, Loader2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import ArticlePlayer from "@/components/ArticlePlayer";

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
  const router = useRouter();
  const [prayer, setPrayer] = useState<Prayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const { isFav, toggle } = useFavorites();

  useEffect(() => {
    fetch("/api/admin/prayers")
      .then(r => r.json())
      .then((data: Prayer[]) => {
        const found = Array.isArray(data) ? data.find(p => p.id === id) : null;
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

  const fav = isFav(id);
  const fontSizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg" }[fontSize];

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Powróć
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFontSize(fontSize === "sm" ? "base" : fontSize === "base" ? "lg" : "sm")}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              title="Zmień rozmiar tekstu"
            >
              <Type size={16} />
            </button>
            {/* Serce — dodaj/usuń z Mojego modlitewnika */}
            <button
              onClick={() => toggle(id)}
              className={`p-2 rounded-xl hover:bg-slate-800 transition-all ${fav ? "text-red-400" : "text-slate-400 hover:text-white"}`}
              title={fav ? "Usuń z Mojego modlitewnika" : "Dodaj do Mojego modlitewnika"}
            >
              <Heart
                size={18}
                fill={fav ? "currentColor" : "none"}
                strokeWidth={fav ? 0 : 1.5}
                className="transition-transform active:scale-125"
              />
            </button>
            <button onClick={handleShare} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
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
              {fav && (
                <span className="text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Heart size={10} fill="currentColor" /> Mój modlitewnik
                </span>
              )}
            </div>

            <h1 className="text-white text-2xl font-bold mb-4 leading-tight">{prayer.title}</h1>

            <ArticlePlayer title={prayer.title} content={prayer.content} lang={prayer.language === "la" ? "la" : "pl"} />

            <div className={`${fontSizeClass} text-slate-200 leading-relaxed whitespace-pre-line font-serif space-y-1`}>
              {prayer.content.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-3" />;
                if (line.match(/^[IVX]+\./)) return <p key={i} className="text-blue-300 font-bold mt-4 mb-1">{line}</p>;
                return <p key={i}>{line}</p>;
              })}
            </div>

            {prayer.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-4 border-t border-slate-800">
                {prayer.tags.map(tag => (
                  <span key={tag} className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">#{tag}</span>
                ))}
              </div>
            )}

            {/* Akcja na dole */}
            <button
              onClick={() => toggle(id)}
              className={`mt-6 w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border ${
                fav
                  ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                  : "border-slate-700 bg-slate-800 text-slate-400 hover:border-red-500/40 hover:text-red-400"
              }`}
            >
              <Heart size={16} fill={fav ? "currentColor" : "none"} strokeWidth={fav ? 0 : 1.5} />
              {fav ? "Usuń z Mojego modlitewnika" : "Dodaj do Mojego modlitewnika"}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
