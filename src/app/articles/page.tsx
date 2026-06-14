"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Search, Calendar, ChevronRight, Loader2, ExternalLink, WifiOff, RefreshCw } from "lucide-react";
import { useOfflineArticles } from "@/hooks/useOfflineArticles";

const PAGE_SIZE = 30;

export default function ArticlesPage() {
  const { t } = useLocale();
  const { articles, loading, offline, cachedAt } = useOfflineArticles();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const q = search.toLowerCase();
  const filtered = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  );
  const visible = search ? filtered : filtered.slice(0, visibleCount);

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{t("articles.title")}</h1>
          <a
            href="http://polskakatolicka.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
          >
            polskakatolicka.org <ExternalLink size={11} />
          </a>
        </div>

        {/* Offline / cache info */}
        {offline && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-400 text-xs">
            <WifiOff size={13} className="flex-shrink-0" />
            <span>Tryb offline — artykuły z lokalnego cache
              {cachedAt ? ` (${new Date(cachedAt).toLocaleDateString("pl-PL")})` : ""}
            </span>
          </div>
        )}
        {!offline && !loading && cachedAt && articles.length > 0 && (
          <div className="flex items-center gap-2 text-slate-600 text-xs">
            <RefreshCw size={10} />
            <span>Zaktualizowano {new Date(cachedAt).toLocaleString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={t("articles.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Loading — tylko gdy nie ma żadnych danych */}
        {loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">Ładowanie artykułów…</p>
          </div>
        )}

        {/* Articles list */}
        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.length === 0 && (
              <p className="text-center py-12 text-slate-500">Brak wyników</p>
            )}
            {visible.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="flex gap-3 bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition-colors group"
              >
                {article.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.image_url}
                    alt=""
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">

                  <h2 className="text-white font-semibold mt-1.5 leading-tight text-sm line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
                    <Calendar size={11} />
                    <span>{formatDate(article.published_at)}</span>
                    {article.author && article.author !== "Redakcja" && (
                      <><span>·</span><span>{article.author}</span></>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 self-center flex-shrink-0 transition-colors" />
              </Link>
            ))}
            {!search && visibleCount < filtered.length && (
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="w-full py-3 rounded-2xl text-sm font-medium text-blue-400 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Pokaż więcej ({filtered.length - visibleCount} pozostałych)
              </button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
