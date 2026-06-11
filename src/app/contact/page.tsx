"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { MessageCircle, Send, CheckCircle2, Loader2, ChevronDown } from "lucide-react";

const DEFAULT_TOPICS = ["Pytanie ogólne","Wsparcie finansowe","Petycje","Modlitwa wstawiennicza","Inne"];

export default function ContactPage() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [thanksMsg, setThanksMsg] = useState("Dziękujemy za wiadomość!");
  const [error, setError] = useState("");

  useEffect(() => {
    // Pobierz ustawienia (tematy kontaktu)
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(s => {
        if (s.contact_topics) setTopics(s.contact_topics.split(",").map((t: string) => t.trim()));
        if (s.contact_thanks_msg) setThanksMsg(s.contact_thanks_msg);
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setName(`${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim());
      setEmail(profile.email ?? user?.email ?? "");
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic) { setError("Wybierz temat wiadomości."); return; }
    setSending(true); setError("");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, topic, message }),
    });
    setSending(false);
    if (res.ok) { setSent(true); setMessage(""); }
    else { const d = await res.json(); setError(d.error ?? "Błąd wysyłania."); }
  }

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-600 transition-colors";
  const labelCls = "block text-slate-300 text-xs font-medium mb-1.5";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 animate-fade-in">
        <div className="mb-5 flex items-center gap-2">
          <MessageCircle size={20} className="text-red-400" />
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Kontakt</h1>
            <p className="text-slate-400 text-sm">Napisz do nas — odpiszemy najszybciej jak możemy</p>
          </div>
        </div>

        {sent ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <CheckCircle2 size={48} className="text-green-400" />
            <p className="text-white font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Wiadomość wysłana!</p>
            <p className="text-slate-400 text-sm max-w-xs">{thanksMsg}</p>
            <button
              onClick={() => setSent(false)}
              className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}
            >
              Wyślij kolejną
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Imię i nazwisko *</label>
                <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Jan Kowalski" required />
              </div>
              <div>
                <label className={labelCls}>E-mail *</label>
                <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@email.pl" required />
              </div>
            </div>

            <div>
              <label className={labelCls}>Temat *</label>
              <div className="relative">
                <select
                  className={inputCls + " appearance-none pr-8"}
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  required
                >
                  <option value="">— Wybierz temat —</option>
                  {topics.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className={labelCls}>Wiadomość *</label>
              <textarea
                className={inputCls}
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Treść wiadomości…"
                required
                maxLength={2000}
              />
              <p className="text-slate-600 text-xs text-right mt-1">{message.length}/2000</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              {sending ? "Wysyłanie…" : "Wyślij wiadomość"}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
