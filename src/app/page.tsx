"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Icon, { type IconName } from "@/components/Icon";
import type { PKArticle, PKPetition } from "@/lib/polskakatolicka";

interface TileOverride {
  label?: string;
  sublabel?: string;
  hidden?: boolean;
  order?: number;
  colorPreset?: string;
}
type TilesConfig = Record<string, TileOverride>;

const COLOR_PRESETS: Record<string, string> = {
  red:    "#f4a943",
  blue:   "#60a5fa",
  violet: "#a78bfa",
  green:  "#4ade80",
  teal:   "#2dd4bf",
  orange: "#fb923c",
  indigo: "#818cf8",
  yellow: "#facc15",
  purple: "#c084fc",
  sage:   "#86efac",
  rose:   "#f87171",
  pink:   "#f472b6",
};

// Klucz mod → domyślne dane kafelka
const SHORTCUTS: { mod: string; href: string; icon: IconName; label: string; detail: string; accent: string; external?: boolean }[] = [
  { mod: "prayers",       href: "/prayers",       icon: "jerusalem-cross", label: "Modlitwy",        detail: "Modlitewnik",         accent: "#f4a943" },
  { mod: "gospel",        href: "/gospel",        icon: "gospel",          label: "Ewangelia",        detail: "Słowo na dziś",       accent: "#60a5fa" },
  { mod: "catechism",     href: "/catechism",     icon: "catechism",       label: "Katechizm",        detail: "Kard. Gasparri",      accent: "#a78bfa" },
  { mod: "reminders",     href: "/reminders",     icon: "bell",            label: "Przypomnienia",    detail: "Alarmy modlitewne",   accent: "#facc15" },
  { mod: "announcements", href: "/announcements", icon: "announcements",   label: "Ogłoszenia",       detail: "Aktualności",         accent: "#fb923c" },
  { mod: "chat",          href: "/contact",       icon: "chat",            label: "Kontakt",          detail: "Napisz do nas",       accent: "#818cf8" },
  { mod: "articles",      href: "/articles",      icon: "articles",        label: "Artykuły",         detail: "Publikacje",          accent: "#2dd4bf" },
  { mod: "petitions",     href: "/petitions",     icon: "petition",        label: "Petycje",          detail: "Podejmij działanie",  accent: "#4ade80" },
  { mod: "savoir",        href: "/savoir-vivre",  icon: "etiquette",       label: "De urbanitate",    detail: "Catholica",           accent: "#c084fc" },
  { mod: "watch",         href: "/watch",         icon: "video-play",      label: "Zobacz",           detail: "Polecane filmy",      accent: "#f87171" },
  { mod: "about",         href: "/about",         icon: "about",           label: "O fundacji",       detail: "Instytut ks. Skargi", accent: "#86efac" },
  { mod: "book", href: "/viewer?url=" + encodeURIComponent("https://polskakatolicka.org/pl/wplata-na-kampanie?payment=e5fbcc41223d97a406605e88faf65b"), icon: "book-open", label: "Zamów książkę", detail: "Z dostawą", accent: "#f472b6" },
  { mod: "plinio", href: "/plinio", icon: "quote", label: "Myśl na dziś", detail: "Plinio Corrêa de Oliveira", accent: "#d97706" },
  { mod: "share", href: "/share", icon: "share", label: "Udostępnij", detail: "Poleć znajomym", accent: "#38bdf8" },
];

const TILES_CONFIG_KEY = "salve_tiles_config";

function loadCachedConfig(): TilesConfig {
  try { return JSON.parse(localStorage.getItem(TILES_CONFIG_KEY) ?? "{}"); }
  catch { return {}; }
}

// ── Article slider ────────────────────────────────────────────────────────────
function ArticleSlider({ articles, href }: { articles: PKArticle[]; href: string }) {
  const [idx, setIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const deltaX = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = articles.length;

  const go = useCallback((n: number) => {
    setIdx((n + total) % total);
  }, [total]);

  // Auto-play — pause while dragging
  useEffect(() => {
    if (dragging) return;
    timerRef.current = setTimeout(() => go(idx + 1), 4500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [idx, dragging, go]);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    deltaX.current = 0;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    deltaX.current = e.clientX - startX.current;
  }
  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (deltaX.current < -40) go(idx + 1);
    else if (deltaX.current > 40) go(idx - 1);
    deltaX.current = 0;
  }

  if (!articles.length) return <div className="h-56 rounded-3xl bg-slate-800/60 animate-pulse" />;

  const art = articles[idx];

  return (
    <div className="relative select-none touch-pan-y">
      {/* Slide */}
      <div
        className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Link
          href={`/articles/${art.slug}`}
          draggable={false}
          onClick={e => { if (Math.abs(deltaX.current) > 8) e.preventDefault(); }}
        >
          <div className="relative h-56 md:h-72 bg-slate-800">
            {art.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={art.slug}
                src={art.image_url}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-opacity duration-300"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-1">{art.category ?? ""}</p>
              <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-3" style={{ fontFamily: "Georgia, serif" }}>
                {art.title}
              </h3>
              {art.excerpt && (
                <p className="text-slate-300/75 text-sm mt-1.5 line-clamp-2">{art.excerpt}</p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Dots */}
      <div className="flex justify-center items-center gap-1.5 mt-3">
        {articles.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === idx ? 20 : 6,
              height: 6,
              background: i === idx ? "#d97706" : "rgba(148,163,184,0.35)",
            }}
            aria-label={`Slajd ${i + 1}`}
          />
        ))}
      </div>

      {/* Prev / Next (desktop) */}
      <button
        onClick={() => go(idx - 1)}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-6 items-center justify-center w-9 h-9 rounded-full bg-slate-900/70 text-white hover:bg-slate-800 transition-colors border border-slate-700/50"
        aria-label="Poprzedni"
      >
        <Icon name="chevron-right" size={16} className="rotate-180" />
      </button>
      <button
        onClick={() => go(idx + 1)}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-6 items-center justify-center w-9 h-9 rounded-full bg-slate-900/70 text-white hover:bg-slate-800 transition-colors border border-slate-700/50"
        aria-label="Następny"
      >
        <Icon name="chevron-right" size={16} />
      </button>

      {/* Counter */}
      <span className="absolute top-3 right-3 text-[10px] font-bold text-white/70 bg-slate-900/60 px-2 py-0.5 rounded-full tabular-nums">
        {idx + 1} / {total}
      </span>
    </div>
  );
}

function SectionTitle({ title, href, linkLabel = "Zobacz wszystkie" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {href && (
        <Link href={href} className="text-xs text-amber-400 flex items-center gap-1 py-1">
          {linkLabel} <Icon name="chevron-right" size={12} />
        </Link>
      )}
    </div>
  );
}

interface PageSectionConfig { show?: boolean; title?: string; count?: number; }
interface PageConfig { articles?: PageSectionConfig; petitions?: PageSectionConfig; }

const SEEN_REPLIES_KEY = "salve_contact_seen_replies";

function getSeenReplyIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_REPLIES_KEY) ?? "[]")); }
  catch { return new Set(); }
}

export default function Home2Page() {
  const [articles, setArticles] = useState<PKArticle[]>([]);
  const [petitions, setPetitions] = useState<PKPetition[]>([]);
  const [tilesConfig, setTilesConfig] = useState<TilesConfig>(() => {
    if (typeof window === "undefined") return {};
    return loadCachedConfig();
  });
  const [unreadReplies, setUnreadReplies] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/articles").then((response) => response.json()),
      fetch("/api/petitions").then((response) => response.json()),
      fetch("/api/admin/tiles").then((r) => r.json()),
    ]).then(([articleData, petitionData, tilesData]) => {
      const pageCfg: PageConfig = (tilesData?._page as unknown as PageConfig) ?? {};
      const artCount = Math.max(pageCfg.articles?.count ?? 4, 5);
      const petCount = pageCfg.petitions?.count ?? 3;
      if (Array.isArray(articleData)) setArticles(articleData.slice(0, artCount));
      if (Array.isArray(petitionData)) setPetitions(petitionData.slice(0, petCount));
      if (tilesData && typeof tilesData === "object" && !tilesData.error) {
        setTilesConfig(tilesData as TilesConfig);
        localStorage.setItem(TILES_CONFIG_KEY, JSON.stringify(tilesData));
      }
    }).catch(() => {});

    // Check for unread replies (only for logged-in users)
    fetch("/api/contact/unread-replies").then(r => r.json()).then(d => {
      if (d.ids) {
        const seen = getSeenReplyIds();
        const unseen = (d.ids as string[]).filter(id => !seen.has(id));
        setUnreadReplies(unseen.length);
      }
    }).catch(() => {});
  }, []);

  const pageCfg: PageConfig = (tilesConfig._page as unknown as PageConfig) ?? {};
  const showArticles = pageCfg.articles?.show !== false;
  const showPetitions = pageCfg.petitions?.show !== false;
  const articlesTitle = pageCfg.articles?.title || "Publikacje";
  const petitionsTitle = pageCfg.petitions?.title || "Podejmij działanie";

  const sliderArticles = articles.slice(0, 5);
  const featuredPetition = petitions[0];

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-4xl mx-auto px-2 md:px-6 py-3 md:py-6 space-y-6 animate-fade-in">
        {showArticles && <section>
          <SectionTitle title={articlesTitle} href="/articles" linkLabel="Wszystkie artykuły" />
          <ArticleSlider articles={sliderArticles} href="/articles" />
        </section>}

        {showPetitions && <section>
          <SectionTitle title={petitionsTitle} href="/petitions" linkLabel="Wszystkie petycje" />
          {featuredPetition ? (
            <Link href={`/petitions/${featuredPetition.slug}`} className="block rounded-3xl overflow-hidden border border-amber-700/35 bg-gradient-to-br from-amber-950/70 to-red-950/80 p-4">
              <div className="flex gap-4 items-center">
                {featuredPetition.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featuredPetition.image_url} alt="" referrerPolicy="no-referrer" className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 border border-amber-500/20" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-amber-400 text-[10px] uppercase tracking-wider">Aktywna petycja</span>
                  <h3 className="text-white font-bold leading-tight mt-1 line-clamp-3">{featuredPetition.title}</h3>
                  <span className="inline-flex items-center gap-1.5 mt-3 rounded-xl bg-amber-500 text-slate-950 px-3 py-2 text-xs font-bold">
                    <Icon name="pen" size={14} /> Podpisz petycję
                  </span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-36 rounded-3xl bg-slate-800/60 animate-pulse" />
          )}
        </section>}

        {showArticles && articles.length > 1 && (
          <section>
            <SectionTitle title="Najnowsze artykuły" href="/articles" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {articles.slice(1).map((article) => (
                <Link key={article.slug} href={`/articles/${article.slug}`} className="flex md:block gap-3 rounded-2xl border border-slate-700/70 bg-slate-800/55 p-3 hover:bg-slate-800 transition-colors">
                  {article.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={article.image_url} alt="" referrerPolicy="no-referrer" className="w-20 h-20 md:w-full md:h-28 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0 md:mt-3">
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-3">{article.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{article.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {showPetitions && petitions.length > 1 && (
          <section>
            <SectionTitle title="Podpisz nasze petycje" href="/petitions" />
            <div className="space-y-2">
              {petitions.slice(1).map((petition) => (
                <Link key={petition.slug} href={`/petitions/${petition.slug}`} className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-800/55 p-3 hover:bg-slate-800 transition-colors">
                  {petition.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={petition.image_url} alt="" referrerPolicy="no-referrer" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <p className="flex-1 text-sm font-bold text-white leading-tight line-clamp-2">{petition.title}</p>
                  <Icon name="chevron-right" size={16} className="text-amber-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="pb-3">
          <SectionTitle title="Salve Maria" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {[...SHORTCUTS]
              .filter((s) => !tilesConfig[s.mod]?.hidden)
              .sort((a, b) => (tilesConfig[a.mod]?.order ?? 99) - (tilesConfig[b.mod]?.order ?? 99))
              .map((shortcut) => {
                const cfg = tilesConfig[shortcut.mod];
                const label = cfg?.label ?? shortcut.label;
                const detail = cfg?.sublabel ?? shortcut.detail;
                const accent = (cfg?.colorPreset && COLOR_PRESETS[cfg.colorPreset]) ?? shortcut.accent;
                return (
                  <Link key={shortcut.mod ?? shortcut.href} href={shortcut.href} target={shortcut.external ? "_blank" : undefined} rel={shortcut.external ? "noopener noreferrer" : undefined} className="flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-800/45 p-3 hover:bg-slate-800 transition-colors">
                    <span className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ color: accent, background: `${accent}12`, border: `1px solid ${accent}25` }}>
                      <Icon name={shortcut.icon} size={18} />
                      {shortcut.mod === "chat" && unreadReplies > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">{unreadReplies}</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-white truncate">{label}</span>
                      <span className="block text-[10px] text-slate-500 truncate">
                        {shortcut.mod === "chat" && unreadReplies > 0
                          ? <span className="text-amber-400">Masz {unreadReplies} {unreadReplies === 1 ? "nową odpowiedź" : "nowe odpowiedzi"}</span>
                          : detail}
                      </span>
                    </span>
                  </Link>
                );
              })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
