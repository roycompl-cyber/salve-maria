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

  const BANNER_H = 52;

  return (
    <div className="min-h-screen bg-white">
      {/* Baner — fixed, ponad wszystkim */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: BANNER_H,
        zIndex: 2147483647,
        background: "linear-gradient(180deg,#1e3a5f 0%,#152d4a 100%)",
        borderBottom: "3px solid #0ea5e9",
        boxShadow: "0 3px 12px rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "linear-gradient(180deg,#facc15 0%,#d97706 100%)",
            border: "none",
            borderBottom: "3px solid #92400e",
            borderRadius: 8,
            padding: "8px 28px",
            fontSize: 15,
            fontWeight: 700,
            color: "#0f172a",
            fontFamily: "Georgia, serif",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 3px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)",
            letterSpacing: "0.02em",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onPointerDown={e => {
            const b = e.currentTarget;
            b.style.transform = "translateY(2px)";
            b.style.borderBottom = "1px solid #92400e";
            b.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
          }}
          onPointerUp={e => {
            const b = e.currentTarget;
            b.style.transform = "";
            b.style.borderBottom = "3px solid #92400e";
            b.style.boxShadow = "0 3px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)";
          }}
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          Powrót — Salve Maria
        </button>
      </div>

      {/* Spacer wypycha całą treść strony pod baner */}
      <div style={{ height: BANNER_H }} />

      {/* Neutralizuj fixed/sticky elementy zewnętrznej strony — zamień na relative */}
      <style>{`
        .external-page-content nav,
        .external-page-content header,
        .external-page-content [class*="navbar"],
        .external-page-content [class*="nav-bar"],
        .external-page-content [class*="header"],
        .external-page-content [id*="navbar"],
        .external-page-content [id*="header"],
        .external-page-content [id*="nav"] {
          position: relative !important;
          top: auto !important;
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
