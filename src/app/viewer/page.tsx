"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

function ViewerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const title = searchParams.get("title") ?? url;

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <p>Brak adresu URL</p>
        <button onClick={() => router.back()} className="mt-4 text-amber-400 underline text-sm">Wróć</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-300 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Powróć
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 text-xs truncate">{title || url}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-amber-400 transition-colors flex-shrink-0"
          title="Otwórz w przeglądarce"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* iframe */}
      <div className="flex-1 relative">
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={title || "Zewnętrzna strona"}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
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
