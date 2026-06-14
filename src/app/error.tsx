"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/error-monitoring";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError({
      message: error.message || "Nieznany błąd aplikacji",
      digest: error.digest,
      path: window.location.pathname,
      source: "boundary",
      userAgent: navigator.userAgent,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-red-900/60 bg-slate-900 p-6 text-center shadow-2xl">
        <p className="text-amber-300 text-xs uppercase tracking-widest">Salve Maria</p>
        <h1 className="mt-3 text-xl font-bold">Coś poszło nie tak</h1>
        <p className="mt-2 text-sm text-slate-400">Błąd został bezpiecznie zgłoszony administratorowi.</p>
        <button onClick={reset} className="mt-5 w-full rounded-xl bg-red-800 px-4 py-3 text-sm font-bold hover:bg-red-700">
          Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}
