"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { MessageCircle, Send, CheckCircle2, Loader2, ChevronDown, Inbox, ChevronUp, MessageSquareReply } from "lucide-react";

const DEFAULT_TOPICS = ["Pytanie ogólne","Wsparcie finansowe","Petycje","Modlitwa wstawiennicza","Inne"];

interface MyMessage {
  id: string;
  topic: string;
  message: string;
  created_at: string;
  admin_reply: string | null;
  replied_at: string | null;
  read: boolean;
}

export default function ContactPage() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [tab, setTab] = useState<"form" | "history">("form");

  // Formularz
  const [topics, setTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [thanksMsg, setThanksMsg] = useState("Dziękujemy za wiadomość!");
  const [error, setError] = useState("");

  // Historia
  const [myMessages, setMyMessages] = useState<MyMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (tab === "history" && user) loadHistory();
  }, [tab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadHistory() {
    setHistoryLoading(true);
    const r = await fetch("/api/contact/my-messages");
    if (r.ok) {
      const data: MyMessage[] = await r.json();
      setMyMessages(data);
      // Mark all replied messages as seen in localStorage
      const repliedIds = data.filter(m => m.admin_reply).map(m => m.id);
      if (repliedIds.length > 0) {
        try {
          const seen: string[] = JSON.parse(localStorage.getItem("salve_contact_seen_replies") ?? "[]");
          const merged = Array.from(new Set([...seen, ...repliedIds]));
          localStorage.setItem("salve_contact_seen_replies", JSON.stringify(merged));
        } catch {}
      }
    }
    setHistoryLoading(false);
  }

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

  const unreadReplies = myMessages.filter(m => m.admin_reply && !m.read).length;

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 animate-fade-in">
        <div className="mb-5 flex items-center gap-2">
          <MessageCircle size={20} className="text-red-400" />
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Kontakt</h1>
            <p className="text-slate-400 text-sm">Napisz do nas — odpiszemy najszybciej jak możemy</p>
          </div>
        </div>

        {/* Zakładki — tylko dla zalogowanych */}
        {user && (
          <div className="flex gap-1 mb-5 bg-slate-800/60 rounded-2xl p-1">
            <button
              onClick={() => setTab("form")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === "form" ? "bg-red-950 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Send size={14} /> Napisz
            </button>
            <button
              onClick={() => setTab("history")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${tab === "history" ? "bg-red-950 text-white" : "text-slate-400 hover:text-white"}`}
            >
              <Inbox size={14} /> Moje wiadomości
              {unreadReplies > 0 && (
                <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-slate-900 flex items-center justify-center">
                  {unreadReplies}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ── FORMULARZ ── */}
        {tab === "form" && (
          sent ? (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <CheckCircle2 size={48} className="text-green-400" />
              <p className="text-white font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Wiadomość wysłana!</p>
              <p className="text-slate-400 text-sm max-w-xs">{thanksMsg}</p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setSent(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}
                >
                  Wyślij kolejną
                </button>
                {user && (
                  <button
                    onClick={() => { setSent(false); setTab("history"); }}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-600 text-slate-300 hover:text-white transition-all"
                  >
                    Moje wiadomości
                  </button>
                )}
              </div>
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
          )
        )}

        {/* ── HISTORIA ── */}
        {tab === "history" && (
          <div className="space-y-3">
            {historyLoading && (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="text-red-400 animate-spin" />
              </div>
            )}
            {!historyLoading && myMessages.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">
                <Inbox size={32} className="mx-auto mb-3 opacity-40" />
                Nie wysłałeś jeszcze żadnej wiadomości.
              </div>
            )}
            {myMessages.map(m => (
              <div
                key={m.id}
                className={`bg-slate-800/60 rounded-2xl border overflow-hidden transition-all ${m.admin_reply && !m.read ? "border-amber-600/50" : "border-slate-700"}`}
              >
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm truncate">{m.topic}</p>
                      {m.admin_reply && (
                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                          <MessageSquareReply size={10} /> Odpowiedź
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {new Date(m.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  {expanded === m.id ? <ChevronUp size={15} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={15} className="text-slate-500 flex-shrink-0" />}
                </button>

                {expanded === m.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
                    <div>
                      <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-1.5">Twoja wiadomość</p>
                      <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                    </div>
                    {m.admin_reply && (
                      <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                        <p className="text-amber-400 text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <MessageSquareReply size={11} /> Odpowiedź fundacji
                          {m.replied_at && (
                            <span className="text-slate-500 font-normal normal-case tracking-normal ml-1">
                              · {new Date(m.replied_at).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}
                            </span>
                          )}
                        </p>
                        <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{m.admin_reply}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
