"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { Camera, Loader2, ChevronLeft } from "lucide-react";

interface GalleryPhoto {
  id: string;
  category: string;
  caption: string | null;
  created_at: string;
  image_url: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  billboard: "Billboardy",
  wolontariat: "Wolontariusze",
  demonstracja: "Demonstracje",
  inne: "Inne",
};

function categoryLabel(c: string) {
  return CATEGORY_LABELS[c] ?? c.charAt(0).toUpperCase() + c.slice(1);
}

export default function CampaignPhotosPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    fetch("/api/campaign-photos/categories").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setCategories(d);
    });
    loadPhotos();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadPhotos(cat?: string) {
    setLoading(true);
    const url = cat && cat !== "all" ? `/api/campaign-photos/gallery?cat=${encodeURIComponent(cat)}` : "/api/campaign-photos/gallery";
    const r = await fetch(url);
    if (r.ok) setPhotos(await r.json());
    setLoading(false);
  }

  function pickCategory(cat: string) {
    setActiveCategory(cat);
    loadPhotos(cat === "all" ? undefined : cat);
  }

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link href="/contact" className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <div className="flex items-center gap-2.5 flex-1">
            <Camera size={20} className="text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Zdjęcia z kampanii</h1>
              <p className="text-slate-400 text-xs">Zdjęcia nadsyłane przez naszą wspólnotę</p>
            </div>
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-4">
          {["all", ...categories].map(cat => (
            <button key={cat} onClick={() => pickCategory(cat)}
              className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-colors"
              style={activeCategory === cat
                ? { background: "linear-gradient(135deg,#92400e,#c2410c)", color: "#fff" }
                : { background: "#1e293b", color: "#94a3b8" }}>
              {cat === "all" ? "Wszystkie" : categoryLabel(cat)}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="text-orange-400 animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-center">
            <Camera size={40} className="text-slate-700" />
            <p className="text-slate-400 text-sm">Brak zdjęć w tej kategorii.<br />Wyślij pierwsze przez zakładkę Kontakt!</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 gap-2.5 space-y-2.5">
            {photos.map(p => (
              <div key={p.id}
                className="break-inside-avoid rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50 cursor-pointer hover:border-orange-600/40 transition-all"
                onClick={() => setLightbox(p)}>
                {p.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_url} alt={p.caption ?? ""} className="w-full object-cover" />
                )}
                <div className="px-2.5 py-2">
                  <span className="text-[10px] font-medium text-orange-400/80">{categoryLabel(p.category)}</span>
                  {p.caption && <p className="text-slate-300 text-xs mt-0.5 line-clamp-2">{p.caption}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA for sending photos */}
        {!loading && (
          <div className="mt-8 rounded-2xl border border-orange-900/40 bg-orange-950/20 px-5 py-4 text-center">
            <p className="text-slate-300 text-sm mb-3">Widziałeś nasz billboard lub wolontariuszy w akcji?<br />Wyślij nam zdjęcie!</p>
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#7c2d12,#c2410c)" }}>
              <Camera size={15} /> Wyślij zdjęcie
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            {lightbox.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={lightbox.image_url} alt={lightbox.caption ?? ""} className="w-full rounded-2xl object-contain max-h-[80vh]" />
            )}
            {lightbox.caption && (
              <p className="text-slate-300 text-sm mt-3 text-center px-4">{lightbox.caption}</p>
            )}
            <p className="text-slate-500 text-xs text-center mt-1">
              {categoryLabel(lightbox.category)} · {new Date(lightbox.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <button onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-slate-600 text-slate-300 hover:text-white flex items-center justify-center text-lg font-bold transition-colors">
              ×
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
