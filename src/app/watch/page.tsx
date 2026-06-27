"use client";
import AppShell from "@/components/AppShell";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Play, X, Loader2, Search } from "lucide-react";

interface Video {
  id: string;
  title: string;
  youtube_id: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail_url: string;
  active: boolean;
}

// Hardcoded fallback — shown while DB is empty
const FALLBACK_VIDEOS: Pick<Video, "youtube_id" | "title">[] = [
  { youtube_id: "zrjKbXAoVXg", title: "Stań w obronie najbardziej niewinnych" },
  { youtube_id: "d0nxU7jQTCc", title: "Historia bł. Natalii Tułasiewicz" },
  { youtube_id: "37qL-p08ZOY", title: "Abby Johnson niszczy argumenty proaborcyjne podczas rozprawy sądowej" },
  { youtube_id: "kyZfRcT_gVE", title: "Dr Miriam Grossman obala ideologię gender w 5 minut" },
  { youtube_id: "_2NCk5xEVeg", title: "Módl się i działaj przeciwko grzechowi aborcji" },
  { youtube_id: "LbL-GHFC0jA", title: "Rewolucja największym zagrożeniem dla cywilizacji chrześcijańskiej" },
  { youtube_id: "jp6fos3_pUQ", title: "Co się stało z Polską, przedmurzem chrześcijaństwa..." },
  { youtube_id: "JhXlqGeiFIA", title: "Nie możemy dopuścić do bluźnierczych koncertów" },
  { youtube_id: "rZNry9e1blE", title: "Jak modlić się za nienarodzonych w lewicowym Amsterdamie?" },
  { youtube_id: "a-YbmhQC-to", title: "Wolontariusze Kampanii byli w Fatimie" },
  { youtube_id: "tKO2sIl-oa8", title: "Dlaczego wysłaliśmy milion medalików na Ukrainę?" },
  { youtube_id: "1_zCjni1zTg", title: "Krucjata Przeciw Aborcji — kampanie Pro-Life w Europie Zachodniej" },
  { youtube_id: "nzHkeLQbGaw", title: "Zwolenniczka aborcji oblała nas keczupem" },
  { youtube_id: "vIO9cdfAGUg", title: "Film Fatima — orędzie tragedii czy nadziei?" },
  { youtube_id: "gyXdRkwPv24", title: "Kolejny atak środowisk sodomskich na bazylikę św. Krzyża" },
  { youtube_id: "h5szIqteRKY", title: "Czy katolicy powinni publicznie protestować przeciw bluźnierczym filmom?" },
  { youtube_id: "gn_giAamVrE", title: "Czy bluźnierstwo to sztuka? Zapytaliśmy warszawiaków" },
  { youtube_id: "aw0Tp75v_V0", title: "Uliczny protest przeciwko bluźnierczemu filmowi Benedetta" },
  { youtube_id: "LG0nSckoKEQ", title: "Modliliśmy się na Różańcu pod kinami w Warszawie, Lublinie i Białymstoku" },
];

function thumb(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
}

export default function WatchPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<string | null>(null);
  const [playingTitle, setPlayingTitle] = useState("");
  const [activeCategory, setActiveCategory] = useState("Wszystkie");
  const [activeTag, setActiveTag] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/videos")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: Video[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setVideos(data);
        }
      })
      .catch(() => {/* use fallback */})
      .finally(() => setLoading(false));
  }, []);

  const useFallback = !loading && videos.length === 0;

  const categories = useFallback ? [] : ["Wszystkie", ...Array.from(new Set(videos.map(v => v.category).filter(Boolean)))];
  const allTags = useFallback ? [] : Array.from(new Set(videos.flatMap(v => v.tags ?? []).filter(Boolean)));

  const filtered: Video[] = useFallback
    ? FALLBACK_VIDEOS.map(v => ({ ...v, id: v.youtube_id, description: "", category: "Ogólne", tags: [], thumbnail_url: "", active: true }))
    : videos.filter(v => {
    const matchCat = activeCategory === "Wszystkie" || v.category === activeCategory;
    const matchTag = !activeTag || (v.tags ?? []).includes(activeTag);
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchTag && matchSearch;
  });

  function startPlay(youtubeId: string, title: string) {
    setPlaying(youtubeId);
    setPlayingTitle(title);
  }

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Zobacz</h1>
          <p className="text-slate-400 text-xs mt-0.5">Polecane filmy — Polska Katolicka</p>
        </div>

        {/* Search */}
        {!useFallback && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Szukaj filmów…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        )}

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setActiveTag(""); }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === cat ? "bg-red-700 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Tag filter */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${activeTag === tag ? "bg-red-900/40 border-red-700 text-red-300" : "border-slate-700 text-slate-500 hover:text-slate-300"}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Player modal */}
        {playing && createPortal(
          <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4" onClick={() => setPlaying(null)}>
            <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button onClick={() => setPlaying(null)} className="text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                  <X size={22} />
                </button>
              </div>
              <div className="relative w-full rounded-2xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${playing}?autoplay=1&rel=0`}
                  title="YouTube video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-white/70 text-sm mt-3 text-center leading-snug px-2">{playingTitle}</p>
            </div>
          </div>,
          document.body
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-red-400 animate-spin" />
          </div>
        )}

        {/* Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-10 col-span-2">Brak wyników</p>
            )}
            {filtered.map((v) => (
                <button
                  key={v.youtube_id}
                  onClick={() => startPlay(v.youtube_id, v.title)}
                  className="flex gap-3 bg-slate-800/70 rounded-2xl p-3 hover:bg-slate-700/70 transition-colors text-left group"
                >
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0 w-28 h-16 rounded-xl overflow-hidden bg-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumb(v.youtube_id)} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
                        <Play size={14} className="text-white ml-0.5" fill="white" />
                      </div>
                    </div>
                  </div>
                  {/* Title & tags */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                    <p className="text-white text-xs font-medium leading-snug line-clamp-3" style={{ fontFamily: "Georgia, serif" }}>
                      {v.title}
                    </p>
                    {v.category && v.category !== "Ogólne" && (
                      <span className="text-[10px] text-red-400/80">{v.category}</span>
                    )}
                  </div>
                </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
