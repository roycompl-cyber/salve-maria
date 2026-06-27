"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import ArticlePlayer from "@/components/ArticlePlayer";
import { Heart, Share2, Trash2 } from "lucide-react";

interface PlinioQuote {
  day: number;
  quote: string;
  source: string;
  date: string;
  config?: {
    pageTitle?: string;
    pageSubtitle?: string;
    authorName?: string;
    authorBio?: string;
  };
}

interface Favorite {
  id: string;
  text: string;
  author: string;
  date: string;
}

const STORAGE_KEY = "plinio_favorites";

function loadFavorites(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(favs: Favorite[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

function getDayLabel(day: number): string {
  return `Dzień ${day} roku`;
}

export default function PlinioPage() {
  const [data, setData] = useState<PlinioQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "favorites">("today");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    fetch("/api/plinio")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function isFavorited(): boolean {
    if (!data) return false;
    return favorites.some((f) => f.id === String(data.day));
  }

  function toggleFavorite() {
    if (!data) return;
    const id = String(data.day);
    let updated: Favorite[];
    if (isFavorited()) {
      updated = favorites.filter((f) => f.id !== id);
    } else {
      updated = [
        ...favorites,
        {
          id,
          text: data.quote,
          author: data.config?.authorName || "Plinio Corrêa de Oliveira",
          date: data.date,
        },
      ];
    }
    setFavorites(updated);
    saveFavorites(updated);
  }

  function removeFavorite(id: string) {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
  }

  async function handleShare() {
    if (!data) return;
    const text = `${data.quote}\n— ${data.source}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Myśl na dziś", text });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">

        {/* Nagłówek */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <Icon name="arrow-left" size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{data?.config?.pageTitle || "Myśl na dziś"}</h1>
            <p className="text-xs text-slate-500">{data?.config?.pageSubtitle || "Plinio Corrêa de Oliveira"}</p>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="h-6 w-32 rounded-lg bg-slate-800/60 animate-pulse" />
            <div className="h-48 rounded-3xl bg-slate-800/60 animate-pulse" />
            <div className="h-12 w-3/4 rounded-lg bg-slate-800/60 animate-pulse" />
          </div>
        )}

        {!loading && !data && (
          <div className="text-center py-16 text-slate-500">
            Nie udało się załadować myśli na dziś.
          </div>
        )}

        {!loading && data && (
          <div className="space-y-4">
            {/* Etykieta dnia */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                {getDayLabel(data.day)}
              </span>
              <span className="text-xs text-slate-600">
                {data.date}
              </span>
            </div>

            {/* Karta z cytatem + przyciski */}
            <div className="relative rounded-3xl border border-amber-900/30 bg-gradient-to-br from-amber-950/40 to-slate-900/80 p-6 shadow-lg">
              {/* Cudzysłów dekoracyjny */}
              <span
                className="absolute top-4 left-5 text-6xl leading-none font-serif text-amber-700/25 select-none"
                aria-hidden
              >
                „
              </span>

              <blockquote className="relative z-10 mt-6 text-base leading-relaxed font-serif text-slate-200">
                {data.quote}
              </blockquote>

              <span
                className="absolute bottom-4 right-6 text-6xl leading-none font-serif text-amber-700/25 select-none rotate-180"
                aria-hidden
              >
                „
              </span>

              {/* Lektor */}
              <div className="relative z-10 mt-4">
                <ArticlePlayer
                  title={`${data.config?.pageTitle || "Myśl na dziś"} — ${data.config?.authorName || "Plinio Corrêa de Oliveira"}`}
                  content={data.quote + "\n\n" + data.source}
                />
              </div>

              {/* Przyciski akcji */}
              <div className="relative z-10 flex items-center gap-2 mt-3">
                <button
                  onClick={toggleFavorite}
                  aria-label={isFavorited() ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700/80 transition-colors"
                >
                  <Heart
                    size={18}
                    className={isFavorited() ? "fill-red-500 text-red-500" : "text-slate-400"}
                  />
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Udostępnij"
                  className="flex items-center justify-center gap-1.5 px-3 h-9 rounded-full bg-slate-800/60 hover:bg-slate-700/80 transition-colors text-xs text-slate-300"
                >
                  <Share2 size={16} className="text-slate-400" />
                  {copied ? "Skopiowano!" : "Udostępnij"}
                </button>
              </div>
            </div>

            {/* Zakładki */}
            <div className="flex rounded-2xl bg-slate-800/50 p-1 gap-1">
              <button
                onClick={() => setActiveTab("today")}
                className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === "today"
                    ? "bg-amber-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Myśl na dziś
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${
                  activeTab === "favorites"
                    ? "bg-amber-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Moje ulubione
              </button>
            </div>

            {/* Zawartość zakładek */}
            {activeTab === "today" && (
              <>
                {/* Źródło */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-3">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Źródło</p>
                  <p className="text-sm text-slate-400 leading-snug">{data.source}</p>
                </div>

                {/* Info o autorze */}
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 px-4 py-3 flex gap-3 items-start">
                  <Icon name="info" size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {data.config?.authorBio ||
                      "Plinio Corrêa de Oliveira (1908–1995) — brazylijski myśliciel katolicki, założyciel Towarzystwa Obrony Tradycji, Rodziny i Własności (TFP), autor dzieła Rewolucja i Kontrrewolucja."}
                  </p>
                </div>
              </>
            )}

            {activeTab === "favorites" && (
              <div className="space-y-3">
                {favorites.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Brak ulubionych myśli
                  </div>
                ) : (
                  favorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 py-3 space-y-2"
                    >
                      <p className="text-sm text-slate-200 leading-relaxed font-serif">{fav.text}</p>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs text-amber-600">{fav.author}</p>
                          <p className="text-[11px] text-slate-600">{fav.date}</p>
                        </div>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          aria-label="Usuń z ulubionych"
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700/60 hover:bg-red-900/40 transition-colors"
                        >
                          <Trash2 size={14} className="text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </AppShell>
  );
}
