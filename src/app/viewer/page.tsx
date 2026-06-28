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

  const BANNER_H = 56;

  return (
    <div className="min-h-screen bg-white">
      {/* Baner — fixed, ponad wszystkim */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: BANNER_H, zIndex: 2147483647, background: "#f1f5f9", borderBottom: "1px solid #cbd5e1", boxShadow: "0 2px 8px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "linear-gradient(180deg,#ffffff 0%,#e2e8f0 100%)",
            border: "1px solid #94a3b8",
            borderBottom: "3px solid #64748b",
            borderRadius: 10,
            padding: "7px 22px",
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            fontFamily: "Georgia, serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
            letterSpacing: "0.01em",
            transition: "transform 0.08s, box-shadow 0.08s",
          }}
          onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 2px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)"; }}
          onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9)"; }}
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          Powrót — Salve Maria
        </button>
      </div>

      {/* Spacer */}
      <div style={{ height: BANNER_H }} />

      {/* Zablokuj fixed/sticky elementom strony docelowej możliwość wyjścia ponad baner */}
      <style>{`
        .external-page-content [style*="position:fixed"],
        .external-page-content [style*="position: fixed"] { top: ${BANNER_H}px !important; z-index: 1 !important; }
        .external-page-content nav, .external-page-content header,
        .external-page-content [class*="navbar"], .external-page-content [class*="nav-bar"],
        .external-page-content [id*="navbar"], .external-page-content [id*="header"] { z-index: 1 !important; }
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
