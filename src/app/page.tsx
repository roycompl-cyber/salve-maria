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
type SliderEffect = "slide" | "fade" | "zoom";

function SlideCard({ art, deltaXRef }: { art: PKArticle; deltaXRef: React.RefObject<number> }) {
  return (
    <Link href={`/articles/${art.slug}`} draggable={false}
      onClick={e => { if (Math.abs(deltaXRef.current ?? 0) > 8) e.preventDefault(); }}
      className="block w-full h-full">
      <div className="relative w-full h-full bg-slate-800">
        {art.image_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={art.image_url} alt="" referrerPolicy="no-referrer" draggable={false} className="w-full h-full object-cover" />
          : null}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          {art.category && <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-1">{art.category}</p>}
          <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-3" style={{ fontFamily: "Georgia, serif" }}>{art.title}</h3>
          {art.excerpt && <p className="text-slate-300/75 text-sm mt-1.5 line-clamp-2">{art.excerpt}</p>}
        </div>
      </div>
    </Link>
  );
}

function ArticleSlider({ articles, effect = "slide", intervalSec = 4 }: {
  articles: PKArticle[];
  effect?: SliderEffect;
  intervalSec?: number;
}) {
  const total = articles.length;
  const [idx, setIdx] = useState(0);

  // Refs that hold "live" values readable inside async callbacks without stale closures
  const idxRef      = useRef(0);
  const effectRef   = useRef(effect);
  const totalRef    = useRef(total);
  const busyRef     = useRef(false);
  const dragging    = useRef(false);
  const startX      = useRef(0);
  const deltaX      = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stripRef    = useRef<HTMLDivElement>(null);
  const curRef      = useRef<HTMLDivElement>(null);
  const nxtRef      = useRef<HTMLDivElement>(null);

  // Keep refs in sync with props/state
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { effectRef.current = effect; }, [effect]);
  useEffect(() => { totalRef.current = total; }, [total]);

  // advance is stable (useCallback with empty deps) — reads live values through refs
  const advance = useCallback((dir: 1 | -1, to?: number) => {
    const cur_idx   = idxRef.current;
    const cur_eff   = effectRef.current;
    const cur_total = totalRef.current;
    if (busyRef.current || cur_total < 2) return;
    const next = to !== undefined ? to : ((cur_idx + dir + cur_total) % cur_total);
    if (next === cur_idx) return;

    busyRef.current = true;

    // Reset auto-advance timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => advance(1), intervalSec * 1000);

    if (cur_eff === "slide") {
      const strip = stripRef.current;
      if (!strip) { setIdx(next); busyRef.current = false; return; }
      const toPct = -(next * 100) / cur_total;
      strip.style.transition = "none";
      strip.style.transform  = `translateX(${-(cur_idx * 100) / cur_total}%)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        strip.style.transition = "transform 0.45s cubic-bezier(.4,0,.2,1)";
        strip.style.transform  = `translateX(${toPct}%)`;
        setTimeout(() => { setIdx(next); busyRef.current = false; }, 460);
      }));
    } else {
      const curEl = curRef.current;
      const nxtEl = nxtRef.current;
      if (!curEl || !nxtEl) { setIdx(next); busyRef.current = false; return; }

      nxtEl.style.transition = "none";
      nxtEl.style.opacity    = "0";
      nxtEl.style.transform  = cur_eff === "zoom" ? "scale(1.06)" : "scale(1)";
      nxtEl.style.zIndex     = "2";
      curEl.style.zIndex     = "1";

      requestAnimationFrame(() => requestAnimationFrame(() => {
        const T = "opacity 0.42s ease, transform 0.42s ease";
        nxtEl.style.transition = T;
        nxtEl.style.opacity    = "1";
        nxtEl.style.transform  = "scale(1)";
        curEl.style.transition = T;
        curEl.style.opacity    = "0";
        curEl.style.transform  = cur_eff === "zoom" ? "scale(0.95)" : "scale(1)";
        setTimeout(() => {
          setIdx(next);
          requestAnimationFrame(() => {
            curEl.style.opacity = "1"; curEl.style.transform = "scale(1)";
            curEl.style.transition = "none"; curEl.style.zIndex = "";
            nxtEl.style.opacity = "0"; nxtEl.style.transform = cur_eff === "zoom" ? "scale(1.06)" : "scale(1)";
            nxtEl.style.transition = "none"; nxtEl.style.zIndex = "";
          });
          busyRef.current = false;
        }, 450);
      }));
    }
  }, [intervalSec]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance on mount (advance is stable so this effect runs once)
  useEffect(() => {
    timerRef.current = setTimeout(() => advance(1), intervalSec * 1000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [advance, intervalSec]);

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX; deltaX.current = 0; dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    deltaX.current = e.clientX - startX.current;
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    const d = deltaX.current;
    deltaX.current = 0;
    if (d < -40) advance(1);
    else if (d > 40) advance(-1);
  }

  if (!articles.length) return <div className="h-56 rounded-3xl bg-slate-800/60 animate-pulse" />;

  const nextIdx = (idx + 1) % total;

  return (
    <div className="relative select-none touch-pan-y">
      <div className="rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 cursor-grab active:cursor-grabbing"
        style={{ height: 224 }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>

        {effect === "slide" ? (
          <div ref={stripRef} className="flex h-full"
            style={{ width: `${total * 100}%`, transform: `translateX(-${idx * 100 / total}%)`, willChange: "transform" }}>
            {articles.map(art => (
              <div key={art.slug} style={{ width: `${100 / total}%`, flexShrink: 0 }} className="h-full">
                <SlideCard art={art} deltaXRef={deltaX} />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <div ref={curRef} className="absolute inset-0" style={{ willChange: "opacity, transform" }}>
              <SlideCard art={articles[idx]} deltaXRef={deltaX} />
            </div>
            <div ref={nxtRef} className="absolute inset-0" style={{ opacity: 0, willChange: "opacity, transform" }}>
              <SlideCard art={articles[nextIdx]} deltaXRef={deltaX} />
            </div>
          </div>
        )}
      </div>

      <span className="absolute top-3 right-3 text-[10px] font-bold text-white/70 bg-slate-900/60 px-2 py-0.5 rounded-full tabular-nums z-20 pointer-events-none">
        {idx + 1} / {total}
      </span>

      <button onClick={() => advance(-1)}
        className="hidden md:flex absolute left-3 top-[104px] -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-slate-900/75 text-white hover:bg-slate-800 transition-colors border border-slate-700/50 z-20"
        aria-label="Poprzedni">
        <Icon name="chevron-right" size={16} className="rotate-180" />
      </button>
      <button onClick={() => advance(1)}
        className="hidden md:flex absolute right-3 top-[104px] -translate-y-1/2 items-center justify-center w-9 h-9 rounded-full bg-slate-900/75 text-white hover:bg-slate-800 transition-colors border border-slate-700/50 z-20"
        aria-label="Następny">
        <Icon name="chevron-right" size={16} />
      </button>

      <div className="flex justify-center items-center gap-1.5 mt-3">
        {articles.map((_, i) => (
          <button key={i} onClick={() => advance(i > idx ? 1 : -1, i)}
            className="transition-all duration-300 rounded-full"
            style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? "#d97706" : "rgba(148,163,184,0.35)" }}
            aria-label={`Slajd ${i + 1}`} />
        ))}
      </div>
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
interface SliderConfig { effect?: "slide" | "fade" | "zoom"; interval?: number; count?: number; show?: boolean; }
interface PageConfig { articles?: PageSectionConfig; petitions?: PageSectionConfig; slider?: SliderConfig; }

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
  const sliderCfg = pageCfg.slider ?? {};
  const sliderVisible = sliderCfg.show !== false;
  const sliderCount = Math.min(Math.max(sliderCfg.count ?? 5, 2), 5);
  const sliderEffect = (sliderCfg.effect ?? "slide") as "slide" | "fade" | "zoom";
  const sliderInterval = sliderCfg.interval ?? 4;

  const sliderArticles = articles.slice(0, sliderCount);
  const featuredPetition = petitions[0];

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-4xl mx-auto px-2 md:px-6 py-3 md:py-6 space-y-6 animate-fade-in">
        {showArticles && sliderVisible && sliderArticles.length > 0 && (
          <section>
            <SectionTitle title={articlesTitle} href="/articles" linkLabel="Wszystkie artykuły" />
            <ArticleSlider articles={sliderArticles} effect={sliderEffect} intervalSec={sliderInterval} />
          </section>
        )}

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
