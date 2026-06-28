"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface ProxyResult {
  body?: string;
  styles?: string;
  error?: string;
}

// Domeny których nie proxy-ujemy — otwieramy bezpośrednio w przeglądarce
const EXTERNAL_PASSTHROUGH = ["youtube.com", "youtu.be", "vimeo.com", "facebook.com", "instagram.com", "twitter.com", "x.com"];

function isPassthrough(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "");
    return EXTERNAL_PASSTHROUGH.some(d => h === d || h.endsWith(`.${d}`));
  } catch { return false; }
}

function ViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const [result, setResult] = useState<ProxyResult | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    if (!url) return;
    setLoading(true);
    setResult(null);
    fetch(`/api/proxy/page?url=${encodeURIComponent(url)}`)
      .then(r => r.json())
      .then(setResult)
      .catch(() => setResult({ error: "Nie udało się załadować strony" }))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (isPassthrough(url)) {
      // Otwórz od razu w systemowej przeglądarce i wróć
      window.open(url, "_blank", "noopener,noreferrer");
      router.back();
      return;
    }
    load();
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <p>Brak adresu URL</p>
        <button onClick={() => router.back()} className="mt-4 text-amber-400 underline text-sm">Wróć</button>
      </div>
    );
  }

  const BANNER_H = 48; // px — wysokość bannera

  return (
    <div className="min-h-screen bg-white">
      {/* Baner — fixed z najwyższym możliwym z-index, nigdy nie zasłonięty przez treść docelową */}
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, height: BANNER_H, zIndex: 2147483647 }}
        className="flex items-center gap-3 px-4 bg-slate-900 border-b border-slate-700 shadow-lg"
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors whitespace-nowrap"
        >
          <ArrowLeft size={16} />
          Powróć do Salve Maria
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 text-xs truncate">{url}</p>
        </div>
        {!loading && (
          <button onClick={load} className="text-slate-500 hover:text-slate-300 transition-colors p-1 flex-shrink-0" title="Odśwież">
            <RefreshCw size={14} />
          </button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-amber-400 transition-colors flex-shrink-0 p-1"
          title="Otwórz w przeglądarce"
        >
          <ExternalLink size={15} />
        </a>
      </div>

      {/* Spacer żeby treść nie chowała się pod banerem */}
      <div style={{ height: BANNER_H }} />

      {/* CSS który obniża fixed/sticky elementy strony docelowej o wysokość bannera */}
      <style>{`
        .external-page-content *[style*="position: fixed"],
        .external-page-content *[style*="position:fixed"] {
          top: ${BANNER_H}px !important;
        }
        .external-page-content nav,
        .external-page-content header,
        .external-page-content .navbar,
        .external-page-content .nav-bar,
        .external-page-content #navbar,
        .external-page-content #header,
        .external-page-content [class*="navbar"],
        .external-page-content [class*="nav-bar"],
        .external-page-content [class*="header"] {
          z-index: 1 !important;
        }
      `}</style>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="text-amber-500 animate-spin" />
        </div>
      )}

      {!loading && result?.error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-6 text-center bg-slate-950">
          <p className="text-slate-400">{result.error}</p>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-semibold">
            <RefreshCw size={14} /> Spróbuj ponownie
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-amber-400 underline flex items-center gap-1">
            Otwórz w przeglądarce <ExternalLink size={12} />
          </a>
        </div>
      )}

      {!loading && result?.body && (
        <div className="external-page-content">
          {result.styles && (
            <style dangerouslySetInnerHTML={{ __html: result.styles }} />
          )}
          <div dangerouslySetInnerHTML={{ __html: result.body }} />
        </div>
      )}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 size={24} className="text-amber-400 animate-spin" />
      </div>
    }>
      <ViewerContent />
    </Suspense>
  );
}
