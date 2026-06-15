"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { BookOpen, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import ArticlePlayer from "@/components/ArticlePlayer";

interface Reading { type: string; ref: string; text: string; }

const DAYS_PL = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];
const MONTHS_PL = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

const TYPE_META: Record<string, { label: string; light: string; dark: string }> = {
  "Pierwsze czytanie": { label: "Pierwsze czytanie", light: "bg-blue-100 text-blue-800",   dark: "bg-blue-400/15 text-blue-300" },
  "Psalm":             { label: "Psalm",             light: "bg-purple-100 text-purple-800",dark: "bg-purple-400/15 text-purple-300" },
  "Drugie czytanie":   { label: "Drugie czytanie",   light: "bg-cyan-100 text-cyan-800",    dark: "bg-cyan-400/15 text-cyan-300" },
  "Aklamacja":         { label: "Aklamacja",         light: "bg-amber-100 text-amber-800",  dark: "bg-amber-400/15 text-amber-300" },
  "Ewangelia":         { label: "Ewangelia",         light: "bg-yellow-100 text-yellow-800",dark: "bg-yellow-400/15 text-yellow-300" },
};

export default function GospelPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>("Ewangelia");
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("theme-light"));
    const obs = new MutationObserver(() =>
      setIsLight(document.documentElement.classList.contains("theme-light"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/gospel")
      .then(r => r.json())
      .then(d => { if (d.readings) setReadings(d.readings); else setError("Nie udało się pobrać czytań."); })
      .catch(() => setError("Błąd połączenia."))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateStr = `${DAYS_PL[now.getDay()]}, ${now.getDate()} ${MONTHS_PL[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 animate-fade-in">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-amber-400" />
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
              Słowo Boże na dziś
            </h1>
          </div>
          <p className="text-slate-400 text-sm">{dateStr}</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 size={28} className="text-amber-400 animate-spin" />
            <p className="text-slate-400 text-sm">Pobieranie czytań…</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">{error}</div>
        )}

        <div className="space-y-2">
          {readings.map((r) => {
            const isOpen = expanded === r.type;
            const isGospel = r.type === "Ewangelia";
            const meta = TYPE_META[r.type];
            const badgeCls = meta ? (isLight ? meta.light : meta.dark) : (isLight ? "bg-slate-200 text-slate-700" : "bg-slate-700/40 text-slate-400");

            const headerBg = isLight
              ? isGospel ? "#fef9c3" : "#f5f4f0"
              : isGospel ? "rgba(120,80,0,0.25)" : "#1e293b";
            const headerBorder = isLight
              ? isGospel ? "#ca8a04" : "#d1cfc9"
              : isGospel ? "rgba(161,120,0,0.5)" : "#334155";
            const bodyBg = isLight ? "#ffffff" : "#0f172a";
            const bodyText = isLight ? "#1a1a1a" : "#cbd5e1";

            return (
              <div
                key={r.type}
                className="rounded-2xl overflow-hidden transition-all"
                style={{ border: `1px solid ${headerBorder}` }}
              >
                <button
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  style={{ background: headerBg }}
                  onClick={() => setExpanded(isOpen ? null : r.type)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${badgeCls}`}>
                      {r.type}
                    </span>
                    {r.ref && (
                      <span className="text-xs truncate" style={{ color: isLight ? "#4b5563" : "#94a3b8" }}>
                        {r.ref}
                      </span>
                    )}
                  </div>
                  {isOpen
                    ? <ChevronUp size={15} style={{ color: isLight ? "#6b7280" : "#94a3b8", flexShrink: 0 }} />
                    : <ChevronDown size={15} style={{ color: isLight ? "#6b7280" : "#94a3b8", flexShrink: 0 }} />}
                </button>

                {isOpen && (
                  <div style={{ background: bodyBg }}>
                    <div className="px-4 pt-3">
                      <ArticlePlayer title="" content={r.text} />
                    </div>
                    <div
                      className="px-4 pb-5 pt-2 text-sm leading-relaxed whitespace-pre-line"
                      style={{ fontFamily: "Georgia, serif", color: bodyText }}
                    >
                      {r.text}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && readings.length > 0 && (
          <a
            href={`/viewer?url=${encodeURIComponent("https://deon.pl/czytania")}`}
            className="flex items-center justify-center gap-2 mt-6 text-slate-500 hover:text-amber-400 text-xs transition-colors"
          >
            Źródło: deon.pl <ExternalLink size={11} />
          </a>
        )}
      </div>
    </AppShell>
  );
}
