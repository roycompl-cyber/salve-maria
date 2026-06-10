"use client";
import { use, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { PKArticle } from "@/lib/polskakatolicka";
import { formatDate } from "@/lib/utils";
import ArticlePlayer from "@/components/ArticlePlayer";
import Link from "next/link";
import { ArrowLeft, Share2, Calendar, User, ExternalLink, Loader2 } from "lucide-react";

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const [article, setArticle] = useState<PKArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPara, setCurrentPara] = useState(-1);

  useEffect(() => {
    fetch(`/api/articles/slug?slug=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject("not found")))
      .then((data) => setArticle(data))
      .catch(() => setError("Nie udało się załadować artykułu"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleShare() {
    if (!article) return;
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.excerpt, url: article.source_url });
    }
  }

  const paragraphs = article
    ? [article.title, ...article.content.split("\n\n").filter((p) => p.trim().length > 10)]
    : [];

  return (
    <AppShell>
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Back bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/articles"
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            {t("articles.back")}
          </Link>
          <div className="flex items-center gap-1">
            {article && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Otwórz na polskakatolicka.org"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <button
              onClick={handleShare}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">Ładowanie artykułu...</p>
          </div>
        )}

        {error && (
          <div className="px-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">
              {error}
            </div>
          </div>
        )}

        {article && (
          <div className="px-4 pb-8">
            {/* Category */}
            <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full">
              {article.category}
            </span>

            {/* Title */}
            <h1 className="text-white text-xl font-bold mt-3 leading-tight">{article.title}</h1>

            {/* Meta */}
            <div className="flex items-center gap-4 mt-3 text-slate-400 text-sm flex-wrap">
              {article.author && (
                <span className="flex items-center gap-1.5">
                  <User size={13} />{article.author}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />{formatDate(article.published_at)}
              </span>
            </div>

            {/* Hero image */}
            {article.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full rounded-2xl mt-4 object-cover max-h-56 bg-slate-800"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            )}

            {/* Excerpt */}
            <p className="text-slate-300 text-base mt-4 font-medium leading-relaxed border-l-2 border-blue-500 pl-3">
              {article.excerpt}
            </p>

            {/* TTS Player */}
            <div className="mt-4">
              <ArticlePlayer
                title={article.title}
                content={article.content}
                onParagraphChange={setCurrentPara}
              />
            </div>

            {/* Content with highlighted paragraphs */}
            <div className="mt-2 space-y-3">
              {paragraphs.slice(1).map((para, i) => {
                const absIdx = i + 1;
                return (
                  <p
                    key={absIdx}
                    id={`para-${absIdx}`}
                    className="text-slate-300 text-sm leading-relaxed rounded-xl transition-all duration-300"
                    style={
                      currentPara === absIdx
                        ? {
                            backgroundColor: "rgba(59,130,246,0.12)",
                            padding: "8px 10px",
                            color: "#e2e8f0",
                          }
                        : {}
                    }
                  >
                    {para}
                  </p>
                );
              })}
            </div>

            {/* Source link */}
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex items-center justify-center gap-2 text-slate-500 hover:text-blue-400 text-xs transition-colors"
            >
              Źródło: polskakatolicka.org <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </AppShell>
  );
}
