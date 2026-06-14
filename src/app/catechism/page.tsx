"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import Icon from "@/components/Icon";
import ArticlePlayer from "@/components/ArticlePlayer";

interface QA { n: number; q: string; a: string }
interface Chapter { id: string; num: number; title: string; qa: QA[] }

const CHAPTER_ICONS: Record<string, string> = {
  I: "✝", II: "📖", III: "🕊", IV: "⚖", V: "⛪", VI: "💧",
  VII: "✨", VIII: "🙏", IX: "🕯", X: "❤", XI: "⚠", XII: "♾",
};

const INTRO_QUOTE = "Nauczanie katechizmu ma nie tylko ten cel, by oświecać rozum — lecz przede wszystkim by nakłonić wolę do życia zgodnego z przykazaniami nauki chrześcijańskiej.";
const INTRO_TEXT = [
  "Katechizm katolicki dla osób dorosłych to dzieło kardynała Pietra Gasparriego (1852–1934) — wybitnego kanonisty, Sekretarza Stanu Stolicy Apostolskiej za pontyfikatów Benedykta XV i Piusa XI. Pełny tytuł brzmi: Katechizm katolicki dla osób dorosłych, które pragną zdobyć pełniejszą znajomość nauki katolickiej.",
  "Katechizm wykłada najważniejsze zasady wiary, moralności i kultu, do których przestrzegania zobowiązani są wierni Kościoła katolickiego. Całość ujęta jest systematycznie, zwięźle i przejrzyście — bez zbędnych słów, bez zbędnych pytań.",
  "Forma pytań i odpowiedzi, od wieków stosowana w Kościele, chroni przed zamieszaniem myślowym, pozwala wyraźnie zobaczyć to, co najważniejsze, i ułatwia zapamiętanie. Każdy ustęp jest zamkniętą całością.",
];

export default function CatechismPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [introOpen, setIntroOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedQA, setExpandedQA] = useState<number | null>(null);
  const [isLight, setIsLight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("theme-light"));
    const obs = new MutationObserver(() =>
      setIsLight(document.documentElement.classList.contains("theme-light"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    fetch("/katechizm.json").then(r => r.json()).then(setChapters);
  }, []);

  // Search across all chapters
  const searchResults = search.trim().length > 1
    ? chapters.flatMap(ch =>
        ch.qa
          .filter(qa =>
            qa.q.toLowerCase().includes(search.toLowerCase()) ||
            qa.a.toLowerCase().includes(search.toLowerCase())
          )
          .map(qa => ({ ...qa, chapter: ch }))
      )
    : [];

  const activeChapter = chapters[activeTab];

  function scrollTabIntoView(idx: number) {
    const el = tabsRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function selectTab(idx: number) {
    setActiveTab(idx);
    setSearch("");
    setExpandedQA(null);
    scrollTabIntoView(idx);
  }

  const playerContent = useMemo(() => {
    if (!activeChapter) return "";
    return activeChapter.qa.map(qa => `${qa.q}\n\n${qa.a}`).join("\n\n");
  }, [activeChapter]);

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
                Katechizm
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">Kard. Gasparri • {chapters.reduce((s, c) => s + c.qa.length, 0)} pytań i odpowiedzi</p>
            </div>
            <Link href="/" className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <Icon name="chevron-left" size={20} />
            </Link>
          </div>

          {/* Wstęp */}
          <div className="mt-3 rounded-2xl overflow-hidden border border-amber-900/30" style={{ background: "linear-gradient(135deg,#1c0e00,#2a1500)" }}>
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              onClick={() => setIntroOpen(o => !o)}
            >
              <div className="min-w-0">
                <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest">Wstęp</p>
                {!introOpen && (
                  <p className="text-amber-100/50 text-xs mt-0.5 truncate italic">Z przedmowy kard. Gasparriego…</p>
                )}
              </div>
              <Icon name={introOpen ? "chevron-up" : "chevron-down"} size={16} className="text-amber-600 flex-shrink-0 ml-3" />
            </button>
            {introOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-amber-900/30">
                <blockquote className="mt-3 border-l-2 border-amber-600 pl-3 italic text-amber-200/80 text-sm leading-relaxed">
                  {INTRO_QUOTE}
                  <footer className="mt-1.5 text-amber-600/70 text-xs not-italic">— Z Przedmowy kard. Gasparriego</footer>
                </blockquote>
                {INTRO_TEXT.map((p, i) => (
                  <p key={i} className="text-amber-100/70 text-sm leading-relaxed">{p}</p>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Szukaj w katechizmie..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>
        </div>

        {/* Player — widoczny tylko gdy jest aktywny rozdział i brak wyszukiwania */}
        {activeChapter && !search && (
          <div className="px-4 pb-2">
            <ArticlePlayer
              key={activeChapter.id}
              title={`Rozdział ${activeChapter.id} — ${activeChapter.title}`}
              content={playerContent}
              lang="pl"
            />
          </div>
        )}

        {/* Tabs — horizontal scroll */}
        {!search && (
          <div
            ref={tabsRef}
            className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {chapters.map((ch, i) => (
              <button
                key={ch.id}
                onClick={() => selectTab(i)}
                className="flex-shrink-0 flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={
                  activeTab === i
                    ? { background: "linear-gradient(135deg,#7a3008,#b45309)", color: "#fef3d0", border: "1px solid rgba(196,130,40,0.4)" }
                    : isLight
                      ? { background: "#f0eeea", color: "#374151", border: "1px solid #d1cfc9" }
                      : { background: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }
                }
              >
                <span className="text-base leading-none">{CHAPTER_ICONS[ch.id] ?? "§"}</span>
                <span className="leading-tight text-center whitespace-nowrap max-w-[80px] truncate">{ch.id}</span>
              </button>
            ))}
          </div>
        )}

        {/* Search results */}
        {search && (
          <div className="px-4 pb-6 space-y-2">
            {searchResults.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">Brak wyników dla „{search}”</p>
            ) : (
              <>
                <p className="text-xs text-slate-500 mb-3">{searchResults.length} wyników</p>
                {searchResults.map((item, i) => (
                  <QACard
                    key={i}
                    qa={item}
                    search={search}
                    chapterLabel={`Rozdział ${item.chapter.id}`}
                    expanded={expandedQA === i}
                    onToggle={() => setExpandedQA(expandedQA === i ? null : i)}
                  />
                ))}
              </>
            )}
          </div>
        )}

        {/* Chapter content */}
        {!search && activeChapter && (
          <div className="px-4 pb-6">
            {/* Chapter title */}
            <div
              className="rounded-2xl px-4 md:px-8 py-4 md:py-6 mb-4"
              style={isLight
                ? { background: "#fef3c7", border: "1px solid #fcd34d" }
                : { background: "linear-gradient(135deg,#1e1a0e,#2d1f0a)", border: "1px solid rgba(196,130,40,0.25)" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{CHAPTER_ICONS[activeChapter.id] ?? "§"}</span>
                <div>
                  <p className="text-xs font-medium tracking-widest uppercase mb-0.5" style={{ color: isLight ? "#92400e" : "#f59e0b" }}>
                    Rozdział {activeChapter.id}
                  </p>
                  <h2 className="font-bold text-base leading-tight" style={{ fontFamily: "Georgia, serif", color: isLight ? "#1a1a1a" : "#ffffff" }}>
                    {activeChapter.title}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: isLight ? "#6b7280" : "#94a3b8" }}>{activeChapter.qa.length} pytań</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {activeChapter.qa.map((qa, i) => {
                const key = activeTab * 1000 + i;
                return (
                  <QACard
                    key={key}
                    qa={qa}
                    expanded={expandedQA === key}
                    onToggle={() => setExpandedQA(expandedQA === key ? null : key)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {!search && !activeChapter && chapters.length === 0 && (
          <div className="flex justify-center py-16">
            <Icon name="loader" size={24} className="animate-spin text-amber-500" />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function highlight(text: string, search: string): React.ReactNode {
  if (!search) return text;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-500/30 text-amber-200 rounded px-0.5">{text.slice(idx, idx + search.length)}</mark>
      {text.slice(idx + search.length)}
    </>
  );
}

function QACard({
  qa, search = "", chapterLabel, expanded, onToggle
}: {
  qa: QA & { chapter?: Chapter };
  search?: string;
  chapterLabel?: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left bg-slate-800 hover:bg-slate-750 rounded-2xl overflow-hidden transition-colors border border-slate-700/50"
    >
      <div className="px-4 py-3 flex items-start gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5"
          style={{ background: "rgba(180,83,9,0.2)", color: "#d97706" }}
        >
          {qa.n}
        </span>
        <div className="flex-1 min-w-0">
          {chapterLabel && (
            <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wide block mb-0.5">{chapterLabel}</span>
          )}
          <p className="text-white text-sm font-medium leading-snug">
            {highlight(qa.q.replace(/[?]?\s*$/, "?"), search)}
          </p>
          {expanded && (
            <p className="text-slate-300 text-sm mt-2 leading-relaxed border-t border-slate-700 pt-2">
              {highlight(qa.a, search)}
            </p>
          )}
        </div>
        <span
          className="flex-shrink-0 text-slate-600 mt-1 transition-transform"
          style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", display: "flex" }}
        >
          <Icon name="chevron-right" size={14} />
        </span>
      </div>
    </button>
  );
}
