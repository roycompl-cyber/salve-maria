"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import {
  Send, CheckCircle2, Newspaper, Megaphone, BookMarked, Users,
  Bell, RefreshCw, Trash2, Pencil, Plus, X, Loader2, ShieldAlert,
  ChevronDown, ChevronUp, Clock, MessageSquare, Settings2, Calendar,
  Mail, ToggleLeft, ToggleRight,
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
interface ScheduledNotif {
  id: string; title: string; body: string; type: string; url: string;
  send_at: string | null; cron_time: string | null; cron_days: number[] | null;
  active: boolean; last_sent_at: string | null; created_at: string;
}
interface ContactMsg {
  id: string; name: string; email: string; topic: string; message: string;
  read: boolean; created_at: string;
}
interface AppSettings { [key: string]: string; }

type Tab = "notifications" | "scheduled" | "messages" | "users" | "prayers" | "system" | "appsettings";
type NotifType = "news" | "action" | "prayer";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors";
const labelCls = "text-slate-300 text-sm font-medium block mb-1.5";

const DAY_NAMES = ["Nd","Pn","Wt","Śr","Cz","Pt","Sb"];

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

// ─── Scheduled notification form ──────────────────────────────────────────────
function ScheduledForm({ onSave, onCancel, saving }: {
  onSave: (data: Partial<ScheduledNotif>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotifType>("prayer");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"once" | "recurring">("recurring");
  const [sendAt, setSendAt] = useState("");
  const [cronTime, setCronTime] = useState("15:00");
  const [cronDays, setCronDays] = useState<number[]>([0,1,2,3,4,5,6]);

  const toggleDay = (d: number) =>
    setCronDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  return (
    <div className="bg-slate-800 rounded-2xl p-4 space-y-4 border border-amber-700/40">
      <p className="text-amber-300 font-semibold text-sm flex items-center gap-2"><Clock size={14} /> Nowe zaplanowane powiadomienie</p>

      <div className="grid grid-cols-2 gap-2">
        {(["once","recurring"] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`py-2 rounded-xl text-xs font-semibold transition-colors border ${mode === m ? "border-amber-600 bg-amber-800/30 text-amber-300" : "border-slate-700 bg-slate-900 text-slate-400"}`}>
            {m === "once" ? "Jednorazowe" : "Cykliczne"}
          </button>
        ))}
      </div>

      <div>
        <label className={labelCls}>Tytuł *</label>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł powiadomienia" />
      </div>
      <div>
        <label className={labelCls}>Treść *</label>
        <textarea className={inputCls} rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder="Treść…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Typ</label>
          <select className={inputCls} value={type} onChange={e => setType(e.target.value as NotifType)}>
            <option value="news">Aktualność</option>
            <option value="action">Akcja</option>
            <option value="prayer">Modlitwa</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Link (opcjonalnie)</label>
          <input className={inputCls + " font-mono text-xs"} value={url} onChange={e => setUrl(e.target.value)} placeholder="/prayers" />
        </div>
      </div>

      {mode === "once" ? (
        <div>
          <label className={labelCls}>Data i godzina wysyłki *</label>
          <input className={inputCls} type="datetime-local" value={sendAt} onChange={e => setSendAt(e.target.value)} />
        </div>
      ) : (
        <>
          <div>
            <label className={labelCls}>Godzina wysyłki *</label>
            <input className={inputCls} type="time" value={cronTime} onChange={e => setCronTime(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Dni tygodnia</label>
            <div className="flex gap-1">
              {DAY_NAMES.map((name, i) => (
                <button key={i} type="button" onClick={() => toggleDay(i)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${cronDays.includes(i) ? "bg-amber-700 text-white" : "bg-slate-700 text-slate-400"}`}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({
            title, body, type, url,
            send_at: mode === "once" ? new Date(sendAt).toISOString() : null,
            cron_time: mode === "recurring" ? cronTime : null,
            cron_days: mode === "recurring" ? cronDays : null,
            active: true,
          })}
          disabled={saving || !title || !body || (mode === "once" ? !sendAt : !cronTime)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          Zapisz
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors">
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

  // Scheduled notifications
  const [scheduled, setScheduled] = useState<ScheduledNotif[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [addingScheduled, setAddingScheduled] = useState(false);
  const [scheduledSaving, setScheduledSaving] = useState(false);

  // Contact messages
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string | null>(null);

  // App settings
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

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
    if (tab === "scheduled" && scheduled.length === 0) {
      setScheduledLoading(true);
      fetch("/api/admin/scheduled-notifications").then(r => r.json()).then(d => { if (Array.isArray(d)) setScheduled(d); }).finally(() => setScheduledLoading(false));
    }
    if (tab === "messages" && messages.length === 0) {
      setMessagesLoading(true);
      fetch("/api/contact").then(r => r.json()).then(d => { if (Array.isArray(d)) setMessages(d); }).finally(() => setMessagesLoading(false));
    }
    if (tab === "appsettings" && Object.keys(appSettings).length === 0) {
      fetch("/api/admin/settings").then(r => r.json()).then(d => setAppSettings(d));
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

  // ── Scheduled notifications ──
  const reloadScheduled = useCallback(() => {
    setScheduledLoading(true);
    fetch("/api/admin/scheduled-notifications").then(r => r.json()).then(d => { if (Array.isArray(d)) setScheduled(d); }).finally(() => setScheduledLoading(false));
  }, []);

  async function handleSaveScheduled(data: Partial<ScheduledNotif>) {
    setScheduledSaving(true);
    await fetch("/api/admin/scheduled-notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setScheduledSaving(false);
    setAddingScheduled(false);
    reloadScheduled();
  }

  async function handleDeleteScheduled(id: string) {
    if (!confirm("Usunąć to powiadomienie?")) return;
    await fetch(`/api/admin/scheduled-notifications?id=${id}`, { method: "DELETE" });
    reloadScheduled();
  }

  // ── Contact messages ──
  async function handleMarkRead(id: string) {
    await fetch(`/api/contact?id=${id}`, { method: "PATCH" });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  }

  // ── App settings ──
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true); setSettingsSaved(false);
    await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(appSettings) });
    setSettingsSaving(false); setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
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
    { key: "notifications", label: "Wyślij push",    icon: <Bell size={14} /> },
    { key: "scheduled",     label: "Zaplanowane",    icon: <Clock size={14} /> },
    { key: "messages",      label: "Wiadomości",     icon: <MessageSquare size={14} /> },
    { key: "users",         label: "Użytkownicy",    icon: <Users size={14} /> },
    { key: "prayers",       label: "Modlitwy",       icon: <BookMarked size={14} /> },
    { key: "appsettings",   label: "Ustawienia",     icon: <Settings2 size={14} /> },
    { key: "system",        label: "System",         icon: <RefreshCw size={14} /> },
  ];

  const typeOptions = [
    { key: "news" as NotifType, icon: <Newspaper size={17} />, label: "Aktualność", color: "text-green-400 bg-green-400/10" },
    { key: "action" as NotifType, icon: <Megaphone size={17} />, label: "Akcja",      color: "text-red-400 bg-red-400/10" },
    { key: "prayer" as NotifType, icon: <BookMarked size={17} />, label: "Modlitwa",   color: "text-amber-400 bg-amber-400/10" },
  ];

  const unreadCount = messages.filter(m => !m.read).length;

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
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-colors relative ${
                tab === key
                  ? "text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              style={tab === key ? { background: "linear-gradient(135deg,#7f1d1d,#991b1b)" } : {}}
            >
              {icon}{label}
              {key === "messages" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 pb-8 space-y-4">

          {/* ── NOTIFICATIONS (instant) ── */}
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

          {/* ── SCHEDULED NOTIFICATIONS ── */}
          {tab === "scheduled" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">{scheduled.length} zaplanowanych powiadomień</p>
                {!addingScheduled && (
                  <button onClick={() => setAddingScheduled(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
                    <Plus size={15} /> Dodaj
                  </button>
                )}
              </div>

              {addingScheduled && (
                <ScheduledForm onSave={handleSaveScheduled} onCancel={() => setAddingScheduled(false)} saving={scheduledSaving} />
              )}

              {scheduledLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin" /></div>}

              <div className="space-y-3">
                {scheduled.map(n => (
                  <div key={n.id} className={`bg-slate-800 rounded-2xl p-4 border ${n.active ? "border-amber-700/30" : "border-slate-700"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm truncate">{n.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${n.active ? "bg-green-800/40 text-green-400" : "bg-slate-700 text-slate-500"}`}>
                            {n.active ? "aktywne" : "wyłączone"}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
                          {n.cron_time ? (
                            <>
                              <Clock size={11} />
                              <span>{n.cron_time}</span>
                              <span>·</span>
                              <span>{n.cron_days?.map(d => DAY_NAMES[d]).join(", ") ?? "codziennie"}</span>
                            </>
                          ) : n.send_at ? (
                            <>
                              <Calendar size={11} />
                              <span>{new Date(n.send_at).toLocaleString("pl-PL")}</span>
                            </>
                          ) : null}
                          {n.last_sent_at && <><span>·</span><span className="text-green-600">ostatnio: {new Date(n.last_sent_at).toLocaleString("pl-PL")}</span></>}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteScheduled(n.id)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {!scheduledLoading && scheduled.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">Brak zaplanowanych powiadomień.</p>
                )}
              </div>
            </>
          )}

          {/* ── CONTACT MESSAGES ── */}
          {tab === "messages" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">{messages.length} wiadomości{unreadCount > 0 && <span className="ml-2 bg-red-800/50 text-red-300 text-xs px-2 py-0.5 rounded-full">{unreadCount} nieprzeczytanych</span>}</p>
              </div>
              {messagesLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin" /></div>}
              <div className="space-y-2">
                {messages.map(m => (
                  <div key={m.id} className={`bg-slate-800 rounded-2xl overflow-hidden border ${m.read ? "border-slate-700" : "border-amber-700/50"}`}>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      onClick={() => {
                        setExpandedMsg(expandedMsg === m.id ? null : m.id);
                        if (!m.read) handleMarkRead(m.id);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!m.read && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
                          <p className="text-white font-semibold text-sm truncate">{m.name}</p>
                          <span className="text-slate-500 text-xs flex-shrink-0">{new Date(m.created_at).toLocaleDateString("pl-PL")}</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{m.topic} · {m.email}</p>
                      </div>
                      {expandedMsg === m.id ? <ChevronUp size={14} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />}
                    </button>
                    {expandedMsg === m.id && (
                      <div className="px-4 pb-4 text-slate-300 text-sm border-t border-slate-700 pt-3 leading-relaxed whitespace-pre-wrap">
                        {m.message}
                        <div className="mt-3">
                          <a href={`mailto:${m.email}?subject=Re: ${m.topic}`}
                            className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                            <Mail size={12} /> Odpowiedz na {m.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {!messagesLoading && messages.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-8">Brak wiadomości.</p>
                )}
              </div>
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

          {/* ── APP SETTINGS ── */}
          {tab === "appsettings" && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="bg-slate-800/50 rounded-2xl p-4 space-y-4">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} /> Kontakt
                </p>
                <div>
                  <label className={labelCls}>Adres e-mail dla wiadomości z komunikatora</label>
                  <input
                    className={inputCls}
                    type="email"
                    value={appSettings.contact_email ?? ""}
                    onChange={e => setAppSettings(p => ({ ...p, contact_email: e.target.value }))}
                    placeholder="kontakt@fundacja.pl"
                  />
                </div>
                <div>
                  <label className={labelCls}>Komunikat po wysłaniu wiadomości (podziękowanie)</label>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={appSettings.contact_thanks_msg ?? ""}
                    onChange={e => setAppSettings(p => ({ ...p, contact_thanks_msg: e.target.value }))}
                    placeholder="Dziękujemy za wiadomość! Odpiszemy najszybciej jak to możliwe."
                  />
                </div>
                <div>
                  <label className={labelCls}>Tematy kontaktu (oddzielone przecinkiem)</label>
                  <input
                    className={inputCls}
                    value={appSettings.contact_topics ?? ""}
                    onChange={e => setAppSettings(p => ({ ...p, contact_topics: e.target.value }))}
                    placeholder="Pytanie ogólne,Wsparcie finansowe,Petycje,Modlitwa wstawiennicza,Inne"
                  />
                  <p className="text-slate-500 text-xs mt-1">np. Pytanie ogólne,Wsparcie finansowe,Petycje</p>
                </div>
              </div>

              {settingsSaved && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={15} /> Ustawienia zapisane.
                </div>
              )}

              <button type="submit" disabled={settingsSaving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
                {settingsSaving ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                {settingsSaving ? "Zapisywanie…" : "Zapisz ustawienia"}
              </button>
            </form>
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
