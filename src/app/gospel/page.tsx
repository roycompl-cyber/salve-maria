"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { BookOpen, Loader2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface Reading { type: string; ref: string; text: string; }

const DAYS_PL = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];
const MONTHS_PL = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

export default function GospelPage() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>("Ewangelia");

  useEffect(() => {
    fetch("/api/gospel")
      .then(r => r.json())
      .then(d => { if (d.readings) setReadings(d.readings); else setError("Nie udało się pobrać czytań."); })
      .catch(() => setError("Błąd połączenia."))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateStr = `${DAYS_PL[now.getDay()]}, ${now.getDate()} ${MONTHS_PL[now.getMonth()]} ${now.getFullYear()}`;

  const typeColor: Record<string, string> = {
    "Pierwsze czytanie": "text-blue-400 bg-blue-400/10",
    "Psalm": "text-purple-400 bg-purple-400/10",
    "Drugie czytanie": "text-cyan-400 bg-cyan-400/10",
    "Aklamacja": "text-amber-400 bg-amber-400/10",
    "Ewangelia": "text-yellow-300 bg-yellow-400/10",
  };

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 animate-fade-in">
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

        <div className="space-y-3">
          {readings.map((r) => {
            const isOpen = expanded === r.type;
            const color = typeColor[r.type] ?? "text-slate-400 bg-slate-700/40";
            const isGospel = r.type === "Ewangelia";
            return (
              <div
                key={r.type}
                className={`rounded-2xl overflow-hidden border transition-all ${isGospel ? "border-yellow-700/50" : "border-slate-700"}`}
              >
                <button
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${isGospel ? "bg-gradient-to-r from-yellow-900/30 to-amber-900/20" : "bg-slate-800"}`}
                  onClick={() => setExpanded(isOpen ? null : r.type)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${color}`}>{r.type}</span>
                    {r.ref && <span className="text-slate-400 text-xs truncate">{r.ref}</span>}
                  </div>
                  {isOpen
                    ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" />
                    : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                </button>

                {isOpen && (
                  <div className={`px-4 pb-5 pt-3 text-sm leading-relaxed whitespace-pre-line ${isGospel ? "bg-gradient-to-b from-yellow-900/10 to-slate-900 text-slate-100" : "bg-slate-900 text-slate-300"}`}
                    style={{ fontFamily: "Georgia, serif" }}>
                    {r.text}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && readings.length > 0 && (
          <a
            href="https://deon.pl/czytania"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 mt-6 text-slate-500 hover:text-amber-400 text-xs transition-colors"
          >
            Źródło: deon.pl <ExternalLink size={11} />
          </a>
        )}
      </div>
    </AppShell>
  );
}
