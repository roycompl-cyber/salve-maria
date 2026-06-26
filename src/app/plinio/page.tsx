"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import ArticlePlayer from "@/components/ArticlePlayer";

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

function getDayLabel(day: number): string {
  return `Dzień ${day} roku`;
}

export default function PlinioPage() {
  const [data, setData] = useState<PlinioQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plinio")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
            <ArticlePlayer
              title={`${data.config?.pageTitle || "Myśl na dziś"} — ${data.config?.authorName || "Plinio Corrêa de Oliveira"}`}
              content={data.quote + "\n\n" + data.source}
            />

            {/* Etykieta dnia */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-500">
                {getDayLabel(data.day)}
              </span>
              <span className="text-xs text-slate-600">
                {data.date}
              </span>
            </div>

            {/* Karta z cytatem */}
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
            </div>

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

          </div>
        )}
      </div>
    </AppShell>
  );
}
