"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { useFavorites } from "@/hooks/useFavorites";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronRight, Heart, Loader2 } from "lucide-react";

interface Prayer {
  id: string;
  title: string;
  category: string;
  language: string;
  tags: string[];
}

function PrayerRow({ prayer, isFav, onToggleFav }: {
  prayer: Prayer;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
}) {
  return (
    <div className="relative flex items-center gap-3 bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition-colors group">
      <Link href={`/prayers/${prayer.id}`} className="absolute inset-0 rounded-2xl" aria-label={prayer.title} />
      <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <span className="text-lg">
          {prayer.language === "la" ? "✝" : prayer.category?.includes("Różaniec") ? "📿" : "🙏"}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-white font-semibold text-sm">{prayer.title}</h2>
        <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full mt-1 inline-block">
          {prayer.category}
        </span>
      </div>
      {/* Serce — klikalne bez nawigacji (z-index nad linkiem) */}
      <button
        onClick={onToggleFav}
        className="relative z-10 p-2 rounded-xl transition-colors hover:bg-slate-600 flex-shrink-0"
        aria-label={isFav ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      >
        <Heart
          size={18}
          className={isFav ? "text-red-400" : "text-slate-500 group-hover:text-slate-400"}
          fill={isFav ? "currentColor" : "none"}
          strokeWidth={isFav ? 0 : 1.5}
        />
      </button>
      <ChevronRight size={16} className="relative z-10 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
    </div>
  );
}

export default function PrayersPage() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const activeCategory = searchParams.get("cat") ?? "Mój modlitewnik";
  const { toggle, isFav, mounted } = useFavorites();

  function setActiveCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cat", cat);
    router.replace(`/prayers?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    fetch("/api/admin/prayers")
      .then(r => r.json())
      .then(data => setPrayers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const allCategories = [
    "Mój modlitewnik",
    "Wszystkie",
    ...Array.from(new Set(prayers.map(p => p.category))),
  ];

  const filtered = prayers.filter(p => {
    if (activeCategory === "Mój modlitewnik") return isFav(p.id);
    const matchCat = activeCategory === "Wszystkie" || p.category === activeCategory;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  }).filter(p => {
    if (activeCategory === "Mój modlitewnik") return true;
    return !search || (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const favPrayers = prayers.filter(p => isFav(p.id));

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 animate-fade-in">
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
            onChange={e => { setSearch(e.target.value); if (activeCategory === "Mój modlitewnik") setActiveCategory("Wszystkie"); }}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {!loading && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allCategories.map(cat => {
              const isActive = activeCategory === cat;
              const isMy = cat === "Mój modlitewnik";
              return (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSearch(""); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-colors"
                  style={
                    isActive
                      ? { background: isMy ? "linear-gradient(135deg,#7f1d1d,#b91c1c)" : "#2563eb", color: "#fff" }
                      : { background: "#1e293b", color: "#94a3b8" }
                  }
                >
                  {isMy && <Heart size={11} fill={isActive ? "currentColor" : "none"} className={isActive ? "text-red-300" : "text-red-400"} />}
                  {cat}
                  {isMy && mounted && favPrayers.length > 0 && (
                    <span className="ml-0.5 bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] leading-none">
                      {favPrayers.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-blue-400 animate-spin" />
          </div>
        )}

        {/* Mój modlitewnik — pusty stan */}
        {!loading && activeCategory === "Mój modlitewnik" && mounted && favPrayers.length === 0 && (
          <div className="flex flex-col items-center py-14 gap-3">
            <Heart size={36} className="text-slate-700" />
            <p className="text-slate-400 text-sm text-center">
              Twój modlitewnik jest pusty.<br />
              Dotknij <Heart size={12} className="inline -mt-0.5 text-slate-400" /> przy modlitwie, aby ją tu dodać.
            </p>
            <button
              onClick={() => setActiveCategory("Wszystkie")}
              className="mt-2 px-4 py-2 rounded-xl text-sm text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
            >
              Przeglądaj modlitwy
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(prayer => (
            <PrayerRow
              key={prayer.id}
              prayer={prayer}
              isFav={isFav(prayer.id)}
              onToggleFav={e => { e.preventDefault(); toggle(prayer.id); }}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
