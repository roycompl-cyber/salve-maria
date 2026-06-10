"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import Link from "next/link";
import { Search, ChevronRight, Tag, Loader2 } from "lucide-react";

interface Prayer {
  id: string;
  title: string;
  category: string;
  language: string;
  tags: string[];
}

export default function PrayersPage() {
  const { t } = useLocale();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Wszystkie");

  useEffect(() => {
    fetch("/api/admin/prayers")
      .then((r) => r.json())
      .then((data) => setPrayers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const allCategories = ["Wszystkie", ...Array.from(new Set(prayers.map((p) => p.category)))];

  const filtered = prayers.filter((p) => {
    const matchCat = activeCategory === "Wszystkie" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white">{t("prayers.title")}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Katalog modlitw i nabożeństw</p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={t("prayers.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeCategory === cat ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-blue-400 animate-spin" />
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((prayer) => (
            <Link
              key={prayer.id}
              href={`/prayers/${prayer.id}`}
              className="flex items-center gap-3 bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">
                  {prayer.language === "la" ? "✝" : prayer.category?.includes("Różaniec") ? "📿" : "🙏"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-sm">{prayer.title}</h2>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{prayer.category}</span>
                  {prayer.tags?.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs text-slate-500 flex items-center gap-0.5">
                      <Tag size={9} />{tag}
                    </span>
                  ))}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
