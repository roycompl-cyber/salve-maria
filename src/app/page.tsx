"use client";

import { useEffect, useState } from "react";
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
  { mod: "book", href: "https://polskakatolicka.org/pl/wplata-na-kampanie?payment=e5fbcc41223d97a406605e88faf65b", icon: "book-open", label: "Zamów książkę", detail: "Z dostawą", accent: "#f472b6", external: true },
];

const TILES_CONFIG_KEY = "salve_tiles_config";

function loadCachedConfig(): TilesConfig {
  try { return JSON.parse(localStorage.getItem(TILES_CONFIG_KEY) ?? "{}"); }
  catch { return {}; }
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

export default function Home2Page() {
  const [articles, setArticles] = useState<PKArticle[]>([]);
  const [petitions, setPetitions] = useState<PKPetition[]>([]);
  const [tilesConfig, setTilesConfig] = useState<TilesConfig>(() => {
    if (typeof window === "undefined") return {};
    return loadCachedConfig();
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/articles").then((response) => response.json()),
      fetch("/api/petitions").then((response) => response.json()),
      fetch("/api/admin/tiles").then((r) => r.json()),
    ]).then(([articleData, petitionData, tilesData]) => {
      const pageCfg: PageConfig = (tilesData?._page as unknown as PageConfig) ?? {};
      const artCount = pageCfg.articles?.count ?? 4;
      const petCount = pageCfg.petitions?.count ?? 3;
      if (Array.isArray(articleData)) setArticles(articleData.slice(0, artCount));
      if (Array.isArray(petitionData)) setPetitions(petitionData.slice(0, petCount));
      if (tilesData && typeof tilesData === "object" && !tilesData.error) {
        setTilesConfig(tilesData as TilesConfig);
        localStorage.setItem(TILES_CONFIG_KEY, JSON.stringify(tilesData));
      }
    }).catch(() => {});
  }, []);

  const pageCfg: PageConfig = (tilesConfig._page as unknown as PageConfig) ?? {};
  const showArticles = pageCfg.articles?.show !== false;
  const showPetitions = pageCfg.petitions?.show !== false;
  const articlesTitle = pageCfg.articles?.title || "Publikacje";
  const petitionsTitle = pageCfg.petitions?.title || "Podejmij działanie";

  const featuredArticle = articles[0];
  const featuredPetition = petitions[0];

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-7 space-y-7 animate-fade-in">
        {showArticles && <section>
          <SectionTitle title={articlesTitle} href="/articles" linkLabel="Wszystkie artykuły" />
          {featuredArticle ? (
            <Link href={`/articles/${featuredArticle.slug}`} className="group block rounded-3xl overflow-hidden border border-slate-700 bg-slate-800/60">
              <div className="relative h-52 md:h-72 bg-slate-800">
                {featuredArticle.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featuredArticle.image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight line-clamp-3">{featuredArticle.title}</h3>
                  <p className="text-slate-300/75 text-sm mt-2 line-clamp-2">{featuredArticle.excerpt}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="h-52 rounded-3xl bg-slate-800/60 animate-pulse" />
          )}
        </section>}

        {showPetitions && <section>
          <SectionTitle title={petitionsTitle} href="/petitions" linkLabel="Wszystkie petycje" />
          {featuredPetition ? (
            <Link href={`/petitions/${featuredPetition.slug}`} className="block rounded-3xl overflow-hidden border border-amber-700/35 bg-gradient-to-br from-amber-950/70 to-red-950/80 p-4">
              <div className="flex gap-4 items-center">
                {featuredPetition.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={featuredPetition.image_url} alt="" className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 border border-amber-500/20" />
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
                    <img src={article.image_url} alt="" className="w-20 h-20 md:w-full md:h-28 rounded-xl object-cover flex-shrink-0" />
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
                    <img src={petition.image_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
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
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ color: accent, background: `${accent}12`, border: `1px solid ${accent}25` }}>
                      <Icon name={shortcut.icon} size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-white truncate">{label}</span>
                      <span className="block text-[10px] text-slate-500 truncate">{detail}</span>
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
