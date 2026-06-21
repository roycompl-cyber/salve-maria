"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/hooks/useLocale";
import { Mail, Lock, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic" | "reset">("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [magicLinkEnabled, setMagicLinkEnabled] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch("/api/settings/magic-link")
      .then(r => r.json())
      .then(d => setMagicLinkEnabled(d.enabled === true))
      .catch(() => {});
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "magic") {
      const { error } = await supabase.auth.signInWithOtp({ email });
      setLoading(false);
      if (error) setError(error.message);
      else setMessage(t("auth.magic_sent"));
      return;
    }

    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/settings`,
      });
      setLoading(false);
      if (error) setError(error.message);
      else setMessage("Wysłaliśmy link do resetowania hasła na Twój adres e-mail.");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6" style={{ background: "radial-gradient(ellipse at top, #3b0a0a 0%, #0f172a 60%)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-700/50 shadow-2xl mb-4 bg-red-950">
            <Image
              src="/logo.png"
              alt="Salve Maria"
              width={96}
              height={96}
              className="object-cover w-full h-full"
              onError={() => {}}
            />
          </div>
          <h1 className="text-2xl font-bold text-yellow-200 tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
            Salve Maria
          </h1>
          <p className="text-slate-400 text-xs mt-1 text-center leading-relaxed">
            Fundacja Instytut Edukacji Społecznej<br />i Religijnej im. Ks. Piotra Skargi
          </p>
        </div>

        {/* Tab toggle — Magic Link tylko gdy włączony */}
        <div className="flex bg-slate-800 rounded-xl p-1 mb-6">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === "password" ? "bg-red-800 text-yellow-100" : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setMode("password")}
          >
            {t("auth.password")}
          </button>
          {magicLinkEnabled && (
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "magic" ? "bg-red-800 text-yellow-100" : "text-slate-400 hover:text-slate-200"
              }`}
              onClick={() => setMode("magic")}
            >
              Magic Link
            </button>
          )}
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              placeholder={t("auth.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          {mode === "password" && (
            <>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder={t("auth.password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { setMode("reset"); setError(""); setMessage(""); }}
                  className="text-xs text-slate-500 hover:text-yellow-400 transition-colors">
                  Zapomniałem hasła
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-800 hover:bg-red-700 disabled:bg-slate-700 text-yellow-100 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            {mode === "magic" ? t("auth.magic_link") : mode === "reset" ? "Wyślij link do resetu" : t("auth.sign_in")}
          </button>

          {mode === "reset" && (
            <button type="button" onClick={() => { setMode("password"); setError(""); setMessage(""); }}
              className="w-full text-slate-500 hover:text-slate-300 text-sm transition-colors py-1">
              ← Wróć do logowania
            </button>
          )}
        </form>

        <p className="text-center text-slate-500 text-xs mt-8 leading-relaxed">
          Aplikacja przeznaczona dla zarejestrowanych darczyńców.<br />
          ul. Rotmistrzowska 18, 02-951 Warszawa<br />
          <a href="mailto:kontakt@piotrskarga.pl" className="text-yellow-600 hover:text-yellow-400">kontakt@piotrskarga.pl</a>
        </p>
      </div>
    </div>
  );
}
