"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw } from "lucide-react";

interface ProxyResult {
  body?: string;
  styles?: string;
  error?: string;
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

  useEffect(() => { load(); }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <p>Brak adresu URL</p>
        <button onClick={() => router.back()} className="mt-4 text-amber-400 underline text-sm">Wróć</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0 sticky top-0 z-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Powróć do Salve Maria
        </button>
        <div className="flex-1" />
        {!loading && (
          <button onClick={load} className="text-slate-500 hover:text-slate-300 transition-colors p-1" title="Odśwież">
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

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="text-amber-500 animate-spin" />
        </div>
      )}

      {!loading && result?.error && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-6 text-center">
          <p className="text-slate-600">{result.error}</p>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-semibold">
            <RefreshCw size={14} /> Spróbuj ponownie
          </button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-600 underline flex items-center gap-1">
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
