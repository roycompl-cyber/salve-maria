"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { PKArticle } from "@/lib/polskakatolicka";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Search, Calendar, ChevronRight, Loader2, ExternalLink } from "lucide-react";

export default function ArticlesPage() {
  const { t } = useLocale();
  const [articles, setArticles] = useState<PKArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setArticles(data);
        else setError("Błąd ładowania artykułów");
      })
      .catch(() => setError("Brak połączenia z serwerem"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter(
    (a) =>
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 animate-fade-in">
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

        {/* States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">Ładowanie artykułów z polskakatolicka.org...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Articles list */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-center py-12 text-slate-500">Brak wyników</p>
            )}
            {filtered.map((article) => (
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
                  <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                    Artykuł
                  </span>
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
                <ChevronRight
                  size={16}
                  className="text-slate-600 group-hover:text-slate-400 self-center flex-shrink-0 transition-colors"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
