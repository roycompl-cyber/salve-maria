"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PKPetition } from "@/lib/polskakatolicka";
import Link from "next/link";
import { ChevronRight, Loader2, PenLine, Users, ExternalLink } from "lucide-react";

function SignatureBar({ count }: { count: number }) {
  // Visual scale: 10000 = full bar
  const pct = Math.min(Math.round((count / 10000) * 100), 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="flex items-center gap-1 text-yellow-400 font-medium">
          <Users size={11} />
          {count.toLocaleString("pl-PL")} podpisów
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #b45309, #d97706)",
          }}
        />
      </div>
    </div>
  );
}

export default function PetitionsPage() {
  const [petitions, setPetitions] = useState<PKPetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/petitions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPetitions(data);
        else setError("Błąd ładowania petycji");
      })
      .catch(() => setError("Brak połączenia"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
              Petycje
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Podpisz i weź udział w akcjach</p>
          </div>
          <a
            href="http://polskakatolicka.org/pl/petycje"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-yellow-400 flex items-center gap-1 transition-colors"
          >
            polskakatolicka.org <ExternalLink size={11} />
          </a>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-yellow-500 animate-spin" />
            <p className="text-slate-400 text-sm">Ładowanie petycji...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {petitions.length === 0 && (
              <p className="text-center py-12 text-slate-500">Brak aktywnych petycji</p>
            )}
            {petitions.map((petition) => (
              <Link
                key={petition.slug}
                href={`/petitions/${petition.slug}`}
                className="block bg-slate-800 rounded-2xl overflow-hidden hover:bg-slate-700 transition-colors group"
              >
                <div className="flex gap-3 p-4">
                  {petition.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={petition.image_url}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PenLine size={10} /> Petycja
                      </span>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors mt-0.5" />
                    </div>
                    <h2 className="text-white font-semibold mt-1.5 text-sm leading-tight line-clamp-2" style={{ fontFamily: "Georgia, serif" }}>
                      {petition.title}
                    </h2>
                    {petition.excerpt && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{petition.excerpt}</p>
                    )}
                    {petition.signature_count > 0 && (
                      <SignatureBar count={petition.signature_count} />
                    )}
                  </div>
                </div>

                {/* Sign CTA strip */}
                <div className="bg-amber-700/20 border-t border-amber-800/30 px-4 py-2 flex items-center justify-between">
                  <span className="text-amber-300 text-xs font-medium">Podpisz petycję</span>
                  <PenLine size={14} className="text-amber-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
