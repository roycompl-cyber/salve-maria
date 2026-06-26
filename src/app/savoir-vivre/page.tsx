"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import ArticlePlayer from "@/components/ArticlePlayer";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, ChevronDown, ChevronUp } from "lucide-react";
import { CIVILITAS_SECTIONS, textToBlocks, type CivilitasBlock, type CivilitasSection } from "@/lib/civilitas-sections";

type Block = CivilitasBlock;
type Section = CivilitasSection;

const DEFAULT_INTRO = `Katolicki savoir-vivre nie jest jedynie zbiorem sztywnych reguł. Jego istotą jest szacunek: wobec Boga, wobec miejsca świętego, wobec liturgii, wobec osób duchownych, wobec kobiet, osób starszych, chorych, dzieci i wszystkich bliźnich.

Dobre maniery w duchu katolickim wynikają z przekonania, że człowiek nie żyje wyłącznie dla siebie. W kościele, przy stole, w rozmowie, podczas uroczystości rodzinnych i parafialnych, katolik powinien łączyć kulturę osobistą z pokorą, taktem i delikatnością.`;

const DEFAULT_CONCLUSION = `Katolicki savoir-vivre jest sztuką życia w obecności Boga i ludzi. Wymaga szacunku, dyskrecji, cierpliwości i umiaru. Nie jest zbiorem pustych ceremonii, ale praktyczną szkołą miłości bliźniego.

Człowiek dobrze wychowany nie musi stale przypominać innym o zasadach. Sam staje się znakiem ładu, pokoju i kultury. W kościele, przy stole, w rodzinie, wobec duchownych, kobiet, starszych i dzieci — wszędzie tam katolik powinien łączyć godność z prostotą, uprzejmość z prawdą, a dobre maniery z sercem.`;

const SECTIONS = CIVILITAS_SECTIONS;


function renderBlock(block: Block, i: number) {
  switch (block.type) {
    case "h3":
      return <h3 key={i} className="text-purple-300 font-bold text-sm mt-5 mb-2">{block.text}</h3>;
    case "p":
      return <p key={i} className="text-slate-200 text-sm leading-relaxed mb-2">{block.text}</p>;
    case "ul":
      return (
        <ul key={i} className="mb-3 space-y-1 ml-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
              <span className="text-purple-400 mt-0.5 flex-shrink-0">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={i} className="mb-3 space-y-1.5 ml-1">
          {block.items.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm text-slate-300 leading-relaxed">
              <span className="text-purple-400 font-semibold flex-shrink-0 w-5 text-right">{j + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      );
    case "quote":
      return (
        <div key={i} className="border-l-2 border-purple-500/50 pl-3 my-3 space-y-1">
          {block.lines.map((line, j) => (
            <p key={j} className="text-purple-200 text-sm italic">{line}</p>
          ))}
        </div>
      );
    default:
      return null;
  }
}

interface CivilitasConfig { pageTitle?: string; pageSubtitle?: string; intro?: string; conclusion?: string; }

export default function SavoirVivrePage() {
  const router = useRouter();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isLight, setIsLight] = useState(false);
  const [civConfig, setCivConfig] = useState<CivilitasConfig>({});
  const [sectionOverrides, setSectionOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("theme-light"));
    const obs = new MutationObserver(() =>
      setIsLight(document.documentElement.classList.contains("theme-light"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/civilitas").then(r => r.json()).then(d => {
      const { sectionOverrides: so, ...cfg } = d ?? {};
      setCivConfig(cfg);
      setSectionOverrides(so ?? {});
    }).catch(() => {});
  }, []);

  const searchLow = search.toLowerCase().trim();
  const searchResults: Section[] | null = searchLow.length > 1
    ? SECTIONS.filter(s =>
        s.title.toLowerCase().includes(searchLow) ||
        s.content.some(b => {
          if (b.type === "p" || b.type === "h3") return b.text.toLowerCase().includes(searchLow);
          if (b.type === "ul" || b.type === "ol") return b.items.some(x => x.toLowerCase().includes(searchLow));
          if (b.type === "quote") return b.lines.some(x => x.toLowerCase().includes(searchLow));
          return false;
        })
      )
    : null;

  // Merge section overrides: if a section has an override text, parse it back to blocks
  const sectionsEffective = useMemo(() => SECTIONS.map(s => {
    const ov = sectionOverrides[s.num];
    return ov ? { ...s, content: textToBlocks(ov) } : s;
  }), [sectionOverrides]);

  const activeSection = activeIdx !== null ? sectionsEffective[activeIdx] : null;

  const playerContent = useMemo(() => {
    if (!activeSection) return "";
    return activeSection.content.map(b => {
      if (b.type === "p" || b.type === "h3") return b.text;
      if (b.type === "ul" || b.type === "ol") return b.items.join("\n");
      if (b.type === "quote") return b.lines.join("\n");
      return "";
    }).filter(Boolean).join("\n\n");
  }, [activeSection]);

  const accent = "#c084fc";

  function selectSection(idx: number) {
    setActiveIdx(prev => prev === idx ? null : idx);
    tabsRef.current?.children[idx] && (tabsRef.current.children[idx] as HTMLElement)
      .scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto animate-fade-in">

        <div className="px-4 pt-3 pb-4" style={{ background: "linear-gradient(180deg,#1a0a2e 0%,transparent 100%)" }}>
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={16} />
            Powróć
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#c084fc22", border: "1px solid #c084fc44" }}>
              <span className="text-xl">🎩</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                {civConfig.pageTitle || "Katolicki savoir-vivre"}
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">{civConfig.pageSubtitle || "Poradnik etykiety katolickiej"}</p>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 rounded-2xl p-4" style={{ background: "#1a0a2e", border: "1px solid #c084fc22" }}>
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: accent }}>Wstęp</p>
          {(civConfig.intro || DEFAULT_INTRO).split("\n\n").map((para, i) => (
            <p key={i} className="text-slate-300 text-sm leading-relaxed mb-2 last:mb-0">{para}</p>
          ))}
        </div>

        <div className="px-4 mb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Szukaj w poradniku…"
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveIdx(null); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {searchResults && (
          <div className="px-4 mb-4 space-y-2">
            {searchResults.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">Brak wyników dla „{search}"</p>
            )}
            {searchResults.map((s, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-4">
                <p className="text-purple-400 text-xs font-semibold mb-2">{s.num}. {s.title}</p>
                {s.content.map((b: Block, j: number) => renderBlock(b, j))}
              </div>
            ))}
          </div>
        )}

        {!searchResults && activeSection && (
          <div className="px-4 pb-2">
            <ArticlePlayer
              key={activeSection.num}
              title={`${activeSection.num}. ${activeSection.title}`}
              content={playerContent}
              lang="pl"
            />
          </div>
        )}

        {!searchResults && (
          <div ref={tabsRef} className="px-4 space-y-2 pb-8">
            {sectionsEffective.map((sec, idx) => {
              const isOpen = activeIdx === idx;
              const isLast = sec.num === "XXIII";
              return (
                <div key={sec.num} className="rounded-2xl overflow-hidden transition-all"
                  style={{
                    background: isOpen ? "#1a0a2e" : (isLight ? "#edecea" : "#1e293b"),
                    border: `1px solid ${isOpen ? "#c084fc33" : "transparent"}`,
                  }}>
                  <button onClick={() => selectSection(idx)} className="w-full flex items-center gap-3 p-4 text-left">
                    <span className="text-xs font-mono font-bold flex-shrink-0 w-10 text-right"
                      style={{ color: accent, opacity: 0.8 }}>{sec.num}</span>
                    <span className="flex-1 text-sm font-semibold"
                      style={{ color: isOpen ? "#f3e8ff" : (isLight ? "#1a1a1a" : "#e2e8f0") }}>
                      {sec.title}
                    </span>
                    {isOpen
                      ? <ChevronUp size={16} style={{ color: accent, flexShrink: 0 }} />
                      : <ChevronDown size={16} className="text-slate-500 flex-shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="border-t border-purple-500/20 pt-3">
                        {sec.content.map((b: Block, i: number) => renderBlock(b, i))}
                      </div>
                      {isLast && (
                        <div className="mt-4 pt-3 border-t border-purple-500/20">
                          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: accent }}>Zakończenie</p>
                          {(civConfig.conclusion || DEFAULT_CONCLUSION).split("\n\n").map((para, i) => (
                            <p key={i} className="text-slate-300 text-sm leading-relaxed mb-2 last:mb-0">{para}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
