"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import {
  Send, CheckCircle2, Newspaper, Megaphone, BookMarked, Users,
  Bell, RefreshCw, Trash2, Pencil, Plus, X, Loader2, ShieldAlert,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserRow {
  id: string; email: string; first_name: string | null; last_name: string | null;
  phone: string | null; city: string | null; role: string;
  profile_complete: boolean; created_at: string;
}
interface Prayer {
  id: string; title: string; content: string; category: string;
  language: string; tags: string[]; sort_order: number;
}
interface Stats { users: number; push: number; prayers: number; }
type Tab = "notifications" | "users" | "prayers" | "system";
type NotifType = "news" | "action" | "prayer";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors";
const labelCls = "text-slate-300 text-sm font-medium block mb-1.5";

// ─── Prayer form component ─────────────────────────────────────────────────
function PrayerForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<Prayer>;
  onSave: (data: Partial<Prayer>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Ogólne");
  const [language, setLanguage] = useState(initial?.language ?? "pl");
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-3 border border-slate-700">
      <div>
        <label className={labelCls}>Tytuł *</label>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł modlitwy" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Kategoria</label>
          <input className={inputCls} value={category} onChange={e => setCategory(e.target.value)} placeholder="np. Maryjna" />
        </div>
        <div>
          <label className={labelCls}>Język</label>
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="pl">Polski</option>
            <option value="la">Łaciński</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelCls}>Treść *</label>
        <textarea className={inputCls} rows={8} value={content} onChange={e => setContent(e.target.value)} placeholder="Pełna treść modlitwy…" />
      </div>
      <div>
        <label className={labelCls}>Tagi (oddzielone przecinkiem)</label>
        <input className={inputCls} value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="np. codzienna, maryjna" />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({ title, content, category, language, tags: tagsRaw.split(",").map(t => t.trim()).filter(Boolean) })}
          disabled={saving || !title || !content}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Zapisz
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm transition-colors">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("notifications");

  // Notification state
  const [notif, setNotif] = useState({ title: "", body: "", type: "news" as NotifType, url: "" });
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState<{ sent: number; failed: number } | null>(null);
  const [notifError, setNotifError] = useState("");

  // Users state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Prayers state
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer | null>(null);
  const [addingPrayer, setAddingPrayer] = useState(false);
  const [prayerSaving, setPrayerSaving] = useState(false);
  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);

  // System state
  const [stats, setStats] = useState<Stats | null>(null);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [cacheMsg, setCacheMsg] = useState("");

  // ── Auth check ──
  useEffect(() => {
    fetch("/api/admin/check")
      .then(r => r.json())
      .then(d => setIsAdmin(d.admin === true))
      .catch(() => setIsAdmin(false));
  }, []);

  // ── Load data on tab switch ──
  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "users" && users.length === 0) {
      setUsersLoading(true);
      fetch("/api/admin/users").then(r => r.json()).then(d => { if (Array.isArray(d)) setUsers(d); }).finally(() => setUsersLoading(false));
    }
    if (tab === "prayers" && prayers.length === 0) {
      setPrayersLoading(true);
      fetch("/api/admin/prayers").then(r => r.json()).then(d => { if (Array.isArray(d)) setPrayers(d); }).finally(() => setPrayersLoading(false));
    }
    if (tab === "system" && !stats) {
      fetch("/api/admin/stats").then(r => r.json()).then(d => setStats(d));
    }
  }, [tab, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notification send ──
  async function handleSendNotif(e: React.FormEvent) {
    e.preventDefault();
    setNotifSending(true); setNotifError(""); setNotifResult(null);
    const res = await fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(notif) });
    setNotifSending(false);
    if (!res.ok) { const d = await res.json(); setNotifError(d.error ?? "Błąd wysyłania"); return; }
    const d = await res.json(); setNotifResult(d);
    setNotif(p => ({ ...p, title: "", body: "", url: "" }));
  }

  // ── Prayer CRUD ──
  const reloadPrayers = useCallback(() => {
    setPrayersLoading(true);
    fetch("/api/admin/prayers").then(r => r.json()).then(d => { if (Array.isArray(d)) setPrayers(d); }).finally(() => setPrayersLoading(false));
  }, []);

  async function handleSavePrayer(data: Partial<Prayer>) {
    setPrayerSaving(true);
    if (editingPrayer) {
      await fetch(`/api/admin/prayers/${editingPrayer.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setEditingPrayer(null);
    } else {
      await fetch("/api/admin/prayers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      setAddingPrayer(false);
    }
    setPrayerSaving(false);
    reloadPrayers();
  }

  async function handleDeletePrayer(id: string) {
    if (!confirm("Usunąć tę modlitwę?")) return;
    await fetch(`/api/admin/prayers/${id}`, { method: "DELETE" });
    reloadPrayers();
  }

  // ── Cache refresh ──
  async function handleCacheRefresh() {
    setCacheRefreshing(true); setCacheMsg("");
    const res = await fetch("/api/admin/cache-refresh", { method: "POST" });
    setCacheRefreshing(false);
    if (res.ok) setCacheMsg("Cache odświeżony pomyślnie.");
    else setCacheMsg("Błąd odświeżania cache.");
  }

  // ── Auth guard ──
  if (isAdmin === null) return (
    <AppShell><div className="flex justify-center py-24"><Loader2 size={28} className="text-red-400 animate-spin" /></div></AppShell>
  );
  if (!isAdmin) return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <ShieldAlert size={48} className="text-red-500" />
        <h1 className="text-white text-xl font-bold">Brak dostępu</h1>
        <p className="text-slate-400 text-sm">Ta sekcja jest dostępna tylko dla administratorów.</p>
      </div>
    </AppShell>
  );

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "notifications", label: "Powiadomienia", icon: <Bell size={15} /> },
    { key: "users",         label: "Użytkownicy",   icon: <Users size={15} /> },
    { key: "prayers",       label: "Modlitwy",       icon: <BookMarked size={15} /> },
    { key: "system",        label: "System",         icon: <RefreshCw size={15} /> },
  ];

  const typeOptions = [
    { key: "news" as NotifType, icon: <Newspaper size={17} />, label: "Aktualność", color: "text-green-400 bg-green-400/10" },
    { key: "action" as NotifType, icon: <Megaphone size={17} />, label: "Akcja",      color: "text-red-400 bg-red-400/10" },
    { key: "prayer" as NotifType, icon: <BookMarked size={17} />, label: "Modlitwa",   color: "text-amber-400 bg-amber-400/10" },
  ];

  return (
    <AppShell>
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-bold text-white">Panel administratora</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-4 pb-4 overflow-x-auto">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-colors ${
                tab === key
                  ? "text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              style={tab === key ? { background: "linear-gradient(135deg,#7f1d1d,#991b1b)" } : {}}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-8 space-y-4">

          {/* ── NOTIFICATIONS ── */}
          {tab === "notifications" && (
            <>
              {notifResult && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-400 font-semibold">Wysłano!</p>
                    <p className="text-green-300 text-xs mt-0.5">Dostarczono do {notifResult.sent} urządzeń{notifResult.failed > 0 && ` · ${notifResult.failed} błędów`}</p>
                  </div>
                </div>
              )}
              {notifError && <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">{notifError}</div>}

              <form onSubmit={handleSendNotif} className="space-y-4">
                <div>
                  <p className={labelCls}>Typ powiadomienia</p>
                  <div className="grid grid-cols-3 gap-2">
                    {typeOptions.map(({ key, icon, label, color }) => (
                      <button key={key} type="button" onClick={() => setNotif(p => ({ ...p, type: key }))}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all border ${notif.type === key ? "border-red-700 bg-red-800/30 text-white" : "border-slate-700 bg-slate-800 text-slate-400"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-2 text-slate-400 text-sm">
                  <Users size={15} /> Odbiorcy: <span className="text-white font-medium ml-1">Wszyscy użytkownicy</span>
                </div>

                <div>
                  <label className={labelCls}>Tytuł *</label>
                  <input className={inputCls} value={notif.title} onChange={e => setNotif(p => ({ ...p, title: e.target.value }))} required maxLength={80} placeholder="Tytuł powiadomienia…" />
                </div>
                <div>
                  <label className={labelCls}>Treść *</label>
                  <textarea className={inputCls} value={notif.body} onChange={e => setNotif(p => ({ ...p, body: e.target.value }))} required maxLength={200} rows={3} placeholder="Treść wiadomości…" />
                  <p className="text-slate-500 text-xs mt-1 text-right">{notif.body.length}/200</p>
                </div>
                <div>
                  <label className={labelCls}>Link (opcjonalnie)</label>
                  <input className={inputCls + " font-mono"} value={notif.url} onChange={e => setNotif(p => ({ ...p, url: e.target.value }))} placeholder="/articles/123" />
                </div>

                <button type="submit" disabled={notifSending || !notif.title || !notif.body}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
                  {notifSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {notifSending ? "Wysyłanie…" : "Wyślij powiadomienie"}
                </button>
              </form>
            </>
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <>
              <p className="text-slate-400 text-sm">{users.length} zarejestrowanych użytkowników</p>
              {usersLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin" /></div>}
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="bg-slate-800 rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">
                          {u.first_name || u.last_name ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : "—"}
                        </p>
                        <p className="text-slate-400 text-xs truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {u.role === "admin" && <span className="text-xs bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full">admin</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.profile_complete ? "bg-green-900/40 text-green-400" : "bg-slate-700 text-slate-500"}`}>
                          {u.profile_complete ? "profil ok" : "niekompletny"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs flex-wrap">
                      {u.phone && <span>{u.phone}</span>}
                      {u.city && <span>{u.city}</span>}
                      <span>od {new Date(u.created_at).toLocaleDateString("pl-PL")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── PRAYERS ── */}
          {tab === "prayers" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">{prayers.length} modlitw w katalogu</p>
                {!addingPrayer && !editingPrayer && (
                  <button onClick={() => setAddingPrayer(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
                    <Plus size={15} /> Dodaj modlitwę
                  </button>
                )}
              </div>

              {addingPrayer && (
                <PrayerForm onSave={handleSavePrayer} onCancel={() => setAddingPrayer(false)} saving={prayerSaving} />
              )}

              {prayersLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin" /></div>}

              <div className="space-y-2">
                {prayers.map((p) => (
                  <div key={p.id}>
                    {editingPrayer?.id === p.id ? (
                      <PrayerForm initial={p} onSave={handleSavePrayer} onCancel={() => setEditingPrayer(null)} saving={prayerSaving} />
                    ) : (
                      <div className="bg-slate-800 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3">
                          <button
                            className="flex-1 text-left min-w-0"
                            onClick={() => setExpandedPrayer(expandedPrayer === p.id ? null : p.id)}
                          >
                            <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{p.category} · {p.language === "la" ? "łaciński" : "polski"}</p>
                          </button>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => setExpandedPrayer(expandedPrayer === p.id ? null : p.id)} className="text-slate-500 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                              {expandedPrayer === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button onClick={() => { setEditingPrayer(p); setAddingPrayer(false); }} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-amber-400 transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => handleDeletePrayer(p.id)} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-red-400 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {expandedPrayer === p.id && (
                          <div className="px-4 pb-4 text-slate-300 text-sm whitespace-pre-line border-t border-slate-700 pt-3 leading-relaxed">
                            {p.content}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── SYSTEM ── */}
          {tab === "system" && (
            <>
              {stats && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Użytkownicy", value: stats.users },
                    { label: "Sub. push", value: stats.push },
                    { label: "Modlitwy", value: stats.prayers },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-800 rounded-2xl p-4 text-center">
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-slate-400 text-xs mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-slate-800 rounded-2xl p-4 space-y-3">
                <h2 className="text-white font-semibold text-sm">Cache artykułów i petycji</h2>
                <p className="text-slate-400 text-xs">Artykuły i petycje są buforowane przez 1–2 godziny. Kliknij poniżej, aby wymusić natychmiastowe odświeżenie z polskakatolicka.org.</p>
                {cacheMsg && <p className="text-green-400 text-xs">{cacheMsg}</p>}
                <button onClick={handleCacheRefresh} disabled={cacheRefreshing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                  style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
                  {cacheRefreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Odśwież cache
                </button>
              </div>

              <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
                <h2 className="text-white font-semibold text-sm">Nadanie uprawnień admina</h2>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Aby nadać innemu użytkownikowi rolę admina, uruchom w Supabase SQL Editor:
                </p>
                <code className="block bg-slate-900 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono break-all">
                  {"update public.profiles set role = 'admin' where email = 'adres@email.pl';"}
                </code>
              </div>
            </>
          )}

        </div>
      </div>
    </AppShell>
  );
}
