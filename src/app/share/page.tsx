"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import Icon from "@/components/Icon";
import { QRCodeSVG } from "qrcode.react";
import { DEFAULT_SHARE_CONFIG, type ShareConfig } from "@/lib/share-config";

const APP_URL = "https://salve-maria.vercel.app";

export default function SharePage() {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<ShareConfig>(DEFAULT_SHARE_CONFIG);

  useEffect(() => {
    fetch("/api/admin/share")
      .then(r => r.json())
      .then((c: ShareConfig) => setConfig(c))
      .catch(() => {});
  }, []);

  function handleSendEmail() {
    const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(config.subject)}&body=${encodeURIComponent(config.body)}`;
    window.location.href = mailto;
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-3 py-5 animate-fade-in space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors">
            <Icon name="arrow-left" size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Udostępnij</h1>
            <p className="text-xs text-slate-500">Poleć Salve Maria znajomym</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5 flex flex-col items-center gap-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider">Zeskanuj aparatem telefonu</p>
          <div className="rounded-2xl bg-white p-4 shadow-xl">
            <QRCodeSVG value={APP_URL} size={180} bgColor="#ffffff" fgColor="#1e0a0a" level="M" />
          </div>
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 rounded-xl bg-slate-900/80 border border-slate-700 px-3 py-2.5">
              <p className="text-yellow-300 font-mono text-sm tracking-wide text-center select-all">{APP_URL.replace("https://", "")}</p>
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${copied ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            >
              <Icon name={copied ? "check" : "copy"} size={14} />
              {copied ? "Skopiowano" : "Kopiuj"}
            </button>
          </div>
        </div>

        {/* Email form */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Icon name="mail" size={16} className="text-amber-500" />
            <h2 className="text-white font-semibold text-sm">Wyślij znajomemu e-mailem</h2>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Adres e-mail odbiorcy</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="jan.kowalski@przykład.pl"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-600 px-4 py-3 text-sm focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 space-y-1">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Temat wiadomości</p>
            <p className="text-slate-400 text-xs">{config.subject}</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mt-2">Treść</p>
            <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{config.body.split("\n")[0]}{" "}…</p>
          </div>

          <button
            onClick={handleSendEmail}
            disabled={!emailValid}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={emailValid ? { background: "linear-gradient(135deg, #92400e, #b45309)", color: "#fef3c7" } : { background: "#1e293b", color: "#64748b" }}
          >
            <Icon name="mail" size={15} />
            Otwórz klienta poczty
          </button>
          <p className="text-slate-600 text-[10px] text-center leading-relaxed">
            Kliknięcie otworzy Twoją aplikację pocztową z gotową wiadomością do wysłania.
          </p>
        </div>

        {/* Native share */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={() => navigator.share({ title: "Salve Maria", text: config.body, url: APP_URL })}
            className="w-full py-3 rounded-2xl border border-slate-700 bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors"
          >
            <Icon name="share" size={16} />
            Udostępnij przez system
          </button>
        )}

      </div>
    </AppShell>
  );
}
