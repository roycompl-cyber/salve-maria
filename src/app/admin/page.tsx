"use client";
import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Icon, { type IconName } from "@/components/Icon";
import {
  Send, CheckCircle2, Newspaper, Megaphone, BookMarked, Users,
  Bell, RefreshCw, Trash2, Pencil, Plus, X, Loader2, ShieldAlert,
  ChevronDown, ChevronUp, Clock, MessageSquare, Settings2, Calendar,
  Mail, Play, Lock, BarChart2, LayoutGrid, Eye, EyeOff, ArrowLeft,
  UserPlus, Home, AlertTriangle, Save, Shield, Video, MapPin, TrendingUp,
} from "lucide-react";
import { ALL_TILE_KEYS } from "@/lib/admin-permissions";
import type { AdminGroup } from "@/lib/admin-permissions";
import { CIVILITAS_SECTIONS, blocksToText } from "@/lib/civilitas-sections";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserRow {
  id: string; email: string; first_name: string | null; last_name: string | null;
  phone: string | null; city: string | null; role: string;
  profile_complete: boolean; created_at: string; last_sign_in_at: string | null;
}
interface Prayer {
  id: string; title: string; content: string; category: string;
  language: string; tags: string[]; sort_order: number;
}
interface AdminStats {
  users: number; push: number; prayers: number; messages: number;
  recentUsers: { date: string; count: number }[];
  topPages: { path: string; title: string; total: number }[];
  weeklyViews: { date: string; total: number }[];
  errors24h: number;
  recentErrors: {
    message: string; path: string; source: "boundary" | "window" | "promise";
    digest?: string; userAgent?: string; occurredAt: string;
  }[];
}
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
interface TileOverride {
  label?: string; sublabel?: string; hidden?: boolean; order?: number; colorPreset?: string; icon?: string;
}
interface PageSectionConfig { show?: boolean; title?: string; count?: number; }
interface PageConfig { articles?: PageSectionConfig; petitions?: PageSectionConfig; }
type TilesConfig = Record<string, TileOverride>;

type Section = null | "notifications" | "messages" | "users" | "prayers" | "tiles" | "modules" | "plinio" | "catechism" | "civilitas" | "referral" | "bypass" | "settings" | "stats" | "errors" | "login" | "access" | "articles" | "petitions" | "videos" | "push-stats";
type NotifType = "news" | "action" | "prayer" | "article" | "petition";

interface ManualArticle {
  id: string; title: string; content: string; excerpt: string;
  category: string; image_url: string; author: string;
  published_at: string; manual: boolean;
}
interface ManualPetition {
  id: string; title: string; content: string; excerpt: string;
  image_url: string; source_url: string; signature_count: number;
  notification_threshold: number; active: boolean; manual: boolean;
}
interface VideoRow {
  id: string; title: string; youtube_id: string; description: string;
  category: string; tags: string[]; thumbnail_url: string; active: boolean; created_at: string;
}
interface PushStats {
  active_subscriptions: number; sent_last_7_days: number;
  history: { id: string; title: string; body: string; type: string; url: string; created_at: string }[];
}

// ─── Color palettes ───────────────────────────────────────────────────────────
const COLOR_PALETTES = [
  { id: "red",    label: "Czerwony",   darkColor: "linear-gradient(135deg,#3d0a0a,#6b1a1a)", accent: "#f4a943", textColor: "#fef3d0", lightBg: "#fde8e8,#fbbfbf", lightBorder: "#f87171" },
  { id: "blue",   label: "Niebieski",  darkColor: "linear-gradient(135deg,#071b3b,#0f3470)", accent: "#60a5fa", textColor: "#dbeafe", lightBg: "#dbeafe,#bfdbfe",  lightBorder: "#93c5fd" },
  { id: "violet", label: "Fioletowy",  darkColor: "linear-gradient(135deg,#1a053d,#38107a)", accent: "#a78bfa", textColor: "#ede9fe", lightBg: "#ede9fe,#ddd6fe",  lightBorder: "#a78bfa" },
  { id: "green",  label: "Zielony",    darkColor: "linear-gradient(135deg,#052a10,#0a4a1e)", accent: "#4ade80", textColor: "#dcfce7", lightBg: "#dcfce7,#bbf7d0",  lightBorder: "#86efac" },
  { id: "teal",   label: "Turkus",     darkColor: "linear-gradient(135deg,#042828,#074a4a)", accent: "#2dd4bf", textColor: "#ccfbf1", lightBg: "#ccfbf1,#99f6e4",  lightBorder: "#2dd4bf" },
  { id: "orange", label: "Pomarańcz",  darkColor: "linear-gradient(135deg,#2a0f00,#5a2500)", accent: "#fb923c", textColor: "#ffedd5", lightBg: "#ffedd5,#fed7aa",  lightBorder: "#fb923c" },
  { id: "indigo", label: "Indygo",     darkColor: "linear-gradient(135deg,#0f0a28,#1e1550)", accent: "#818cf8", textColor: "#e0e7ff", lightBg: "#e0e7ff,#c7d2fe",  lightBorder: "#818cf8" },
  { id: "yellow", label: "Złoty",      darkColor: "linear-gradient(135deg,#332500,#5c4500)", accent: "#facc15", textColor: "#fef9c3", lightBg: "#fef9c3,#fde68a",  lightBorder: "#facc15" },
  { id: "purple", label: "Purpura",    darkColor: "linear-gradient(135deg,#1a0a2e,#2e1060)", accent: "#c084fc", textColor: "#f3e8ff", lightBg: "#f5f3ff,#ede9fe",  lightBorder: "#a78bfa" },
  { id: "sage",   label: "Szałwia",    darkColor: "linear-gradient(135deg,#0c1a0c,#1a3a1a)", accent: "#86efac", textColor: "#dcfce7", lightBg: "#dcfce7,#bbf7d0",  lightBorder: "#86efac" },
  { id: "rose",   label: "Różany",     darkColor: "linear-gradient(135deg,#1a0505,#3a0a0a)", accent: "#f87171", textColor: "#fee2e2", lightBg: "#fee2e2,#fecaca",  lightBorder: "#f87171" },
  { id: "pink",   label: "Różowy",     darkColor: "linear-gradient(135deg,#280a1a,#50103a)", accent: "#f472b6", textColor: "#fce7f3", lightBg: "#fce7f3,#fbcfe8",  lightBorder: "#f472b6" },
];

const MODULE_ICONS: IconName[] = [
  "jerusalem-cross","cross","gospel","catechism","prayers","bell",
  "articles","petition","announcements","chat","etiquette","about",
  "video-play","book-open","quote","heart","star","calendar","pen",
  "donate","shield","home","play","map-pin","mail","phone","info",
  "user","search","palette",
];

const TILE_MODS: { mod: string; defaultLabel: string; defaultSublabel: string; defaultIcon: IconName }[] = [
  { mod: "prayers",       defaultLabel: "Modlitwy",       defaultSublabel: "Modlitewnik",            defaultIcon: "jerusalem-cross" },
  { mod: "gospel",        defaultLabel: "Ewangelia",       defaultSublabel: "Słowo na dziś",          defaultIcon: "gospel" },
  { mod: "catechism",     defaultLabel: "Katechizm",       defaultSublabel: "Kard. Gasparri",         defaultIcon: "catechism" },
  { mod: "petitions",     defaultLabel: "Petycje",         defaultSublabel: "Podejmij działanie",     defaultIcon: "petition" },
  { mod: "articles",      defaultLabel: "Artykuły",        defaultSublabel: "Publikacje",             defaultIcon: "articles" },
  { mod: "announcements", defaultLabel: "Ogłoszenia",      defaultSublabel: "Aktualności",            defaultIcon: "announcements" },
  { mod: "chat",          defaultLabel: "Kontakt",         defaultSublabel: "Napisz do nas",          defaultIcon: "chat" },
  { mod: "reminders",     defaultLabel: "Przypomnienia",   defaultSublabel: "Alarmy modlitewne",      defaultIcon: "bell" },
  { mod: "savoir",        defaultLabel: "De urbanitate",   defaultSublabel: "Catholica",              defaultIcon: "etiquette" },
  { mod: "book",          defaultLabel: "Zamów książkę",   defaultSublabel: "Z dostawą",              defaultIcon: "book-open" },
  { mod: "about",         defaultLabel: "O fundacji",      defaultSublabel: "Instytut ks. Skargi",    defaultIcon: "about" },
  { mod: "watch",         defaultLabel: "Zobacz",          defaultSublabel: "Polecane filmy",         defaultIcon: "video-play" },
  { mod: "plinio",        defaultLabel: "Myśl na dziś",    defaultSublabel: "Plinio Corrêa de Oliveira", defaultIcon: "quote" },
  { mod: "share",         defaultLabel: "Udostępnij",      defaultSublabel: "Poleć znajomym",            defaultIcon: "share" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors";
const labelCls = "text-slate-300 text-sm font-medium block mb-1.5";
const DAY_NAMES = ["Nd","Pn","Wt","Śr","Cz","Pt","Sb"];

const BTN_PRIMARY = "flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white disabled:opacity-50 transition-all";
const CARD = "bg-slate-800 rounded-2xl border border-slate-700/50";

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function BarChart({ data, color = "#991b1b", label = "wyświeć" }: {
  data: { date: string; count: number }[];
  color?: string;
  label?: string;
}) {
  if (!data.length) return <p className="text-slate-500 text-xs py-4 text-center">Brak danych</p>;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-1 h-24 w-full">
      {data.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className="w-full rounded-t-sm transition-all"
            style={{ height: `${Math.round((d.count / max) * 80)}px`, background: color, opacity: 0.85 }}
            title={`${d.date}: ${d.count} ${label}`} />
          <span className="text-[8px] text-slate-600 truncate w-full text-center">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
      <button onClick={onBack} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0">
        <ArrowLeft size={18} />
      </button>
      <div>
        <h2 className="text-white font-bold text-lg">{title}</h2>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Prayer form ──────────────────────────────────────────────────────────────
function PrayerForm({ initial, onSave, onCancel, saving }: {
  initial?: Partial<Prayer>; onSave: (d: Partial<Prayer>) => void; onCancel: () => void; saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Ogólne");
  const [language, setLanguage] = useState(initial?.language ?? "pl");
  const [tagsRaw, setTagsRaw] = useState((initial?.tags ?? []).join(", "));
  return (
    <div className={`${CARD} p-4 space-y-3`}>
      <div><label className={labelCls}>Tytuł *</label>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł modlitwy" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Kategoria</label>
          <input className={inputCls} value={category} onChange={e => setCategory(e.target.value)} placeholder="np. Maryjna" />
        </div>
        <div><label className={labelCls}>Język</label>
          <select className={inputCls} value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="pl">Polski</option><option value="la">Łaciński</option>
          </select>
        </div>
      </div>
      <div><label className={labelCls}>Treść *</label>
        <textarea className={inputCls} rows={7} value={content} onChange={e => setContent(e.target.value)} placeholder="Pełna treść modlitwy…" />
      </div>
      <div><label className={labelCls}>Tagi (oddzielone przecinkiem)</label>
        <input className={inputCls} value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="np. codzienna, maryjna" />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ title, content, category, language, tags: tagsRaw.split(",").map(t => t.trim()).filter(Boolean) })}
          disabled={saving || !title || !content}
          className={`flex-1 ${BTN_PRIMARY}`} style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Zapisz
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm transition-colors"><X size={15} /></button>
      </div>
    </div>
  );
}

// ─── Scheduled form ───────────────────────────────────────────────────────────
function ScheduledForm({ onSave, onCancel, saving }: {
  onSave: (d: Partial<ScheduledNotif>) => void; onCancel: () => void; saving: boolean;
}) {
  const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [type, setType] = useState<NotifType>("prayer"); const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"once"|"recurring">("recurring");
  const [sendAt, setSendAt] = useState(""); const [cronTime, setCronTime] = useState("15:00");
  const [cronDays, setCronDays] = useState<number[]>([0,1,2,3,4,5,6]);
  const toggleDay = (d: number) => setCronDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  return (
    <div className={`${CARD} p-4 space-y-4 border-amber-700/40`}>
      <p className="text-amber-300 font-semibold text-sm flex items-center gap-2"><Clock size={14} /> Nowe zaplanowane powiadomienie</p>
      <div className="grid grid-cols-2 gap-2">
        {(["once","recurring"] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={`py-2 rounded-xl text-xs font-semibold transition-colors border ${mode===m?"border-amber-600 bg-amber-800/30 text-amber-300":"border-slate-700 bg-slate-900 text-slate-400"}`}>
            {m==="once"?"Jednorazowe":"Cykliczne"}
          </button>
        ))}
      </div>
      <div><label className={labelCls}>Tytuł *</label>
        <input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tytuł" />
      </div>
      <div><label className={labelCls}>Treść *</label>
        <textarea className={inputCls} rows={2} value={body} onChange={e => setBody(e.target.value)} placeholder="Treść…" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Typ</label>
          <select className={inputCls} value={type} onChange={e => setType(e.target.value as NotifType)}>
            <option value="news">Aktualność</option><option value="action">Akcja</option><option value="prayer">Modlitwa</option>
          </select>
        </div>
        <div><label className={labelCls}>Link (opcjonalnie)</label>
          <input className={inputCls+" font-mono text-xs"} value={url} onChange={e => setUrl(e.target.value)} placeholder="/prayers" />
        </div>
      </div>
      {mode==="once" ? (
        <div><label className={labelCls}>Data i godzina *</label>
          <input className={inputCls} type="datetime-local" value={sendAt} onChange={e => setSendAt(e.target.value)} />
        </div>
      ) : (<>
        <div><label className={labelCls}>Godzina *</label>
          <input className={inputCls} type="time" value={cronTime} onChange={e => setCronTime(e.target.value)} />
        </div>
        <div><label className={labelCls}>Dni tygodnia</label>
          <div className="flex gap-1">
            {DAY_NAMES.map((name,i) => (
              <button key={i} type="button" onClick={() => toggleDay(i)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${cronDays.includes(i)?"bg-amber-700 text-white":"bg-slate-700 text-slate-400"}`}>
                {name}
              </button>
            ))}
          </div>
        </div>
      </>)}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ title, body, type, url,
            send_at: mode==="once"?new Date(sendAt).toISOString():null,
            cron_time: mode==="recurring"?cronTime:null,
            cron_days: mode==="recurring"?cronDays:null, active: true })}
          disabled={saving||!title||!body||(mode==="once"?!sendAt:!cronTime)}
          className={`flex-1 ${BTN_PRIMARY}`} style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b)" }}>
          {saving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 transition-colors"><X size={15}/></button>
      </div>
    </div>
  );
}

// ─── User edit form (inline) ──────────────────────────────────────────────────
function UserEditForm({ user, onSave, onCancel, saving, saveError }: {
  user: UserRow; onSave: (d: Partial<UserRow>) => void; onCancel: () => void; saving: boolean; saveError?: string;
}) {
  const [firstName, setFirstName] = useState(user.first_name ?? "");
  const [lastName, setLastName] = useState(user.last_name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [city, setCity] = useState(user.city ?? "");
  const [role, setRole] = useState(["admin","donor"].includes(user.role) ? user.role : "donor");
  return (
    <div className="rounded-2xl border border-red-800/40 p-4 space-y-4" style={{background:"linear-gradient(135deg,#1c0a0a,#1a1a1a)"}}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">Edytuj użytkownika</p>
          <p className="text-slate-500 text-xs font-mono mt-0.5">{user.email}</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"><X size={16}/></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Imię</label><input className={inputCls} value={firstName} onChange={e=>setFirstName(e.target.value)}/></div>
        <div><label className={labelCls}>Nazwisko</label><input className={inputCls} value={lastName} onChange={e=>setLastName(e.target.value)}/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Telefon</label><input className={inputCls} value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        <div><label className={labelCls}>Miasto</label><input className={inputCls} value={city} onChange={e=>setCity(e.target.value)}/></div>
      </div>
      <div><label className={labelCls}>Rola</label>
        <select className={inputCls} value={role} onChange={e=>setRole(e.target.value)}>
          <option value="donor">donor</option><option value="admin">admin</option>
        </select>
      </div>
      {saveError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{saveError}</p>}
      <div className="flex gap-2">
        <button onClick={()=>onSave({first_name:firstName||null,last_name:lastName||null,phone:phone||null,city:city||null,role})}
          disabled={saving} className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
          {saving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz zmiany
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-800 hover:bg-slate-700 text-sm transition-colors">Anuluj</button>
      </div>
    </div>
  );
}

// ─── Add user form (inline) ───────────────────────────────────────────────────
function AddUserForm({ onSave, onCancel, saving, saveError }: {
  onSave: (d: { email: string; password: string; first_name: string; last_name: string; phone: string; city: string; role: string }) => void;
  onCancel: () => void; saving: boolean; saveError?: string;
}) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState(""); const [city, setCity] = useState("");
  const [role, setRole] = useState("donor");
  return (
    <div className="rounded-2xl border border-green-800/40 p-4 space-y-4" style={{background:"linear-gradient(135deg,#0a1c0a,#1a1a1a)"}}>
      <div className="flex items-center justify-between">
        <p className="text-white font-semibold text-sm flex items-center gap-2"><UserPlus size={15} className="text-green-400"/>Nowy użytkownik</p>
        <button onClick={onCancel} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"><X size={16}/></button>
      </div>
      <div><label className={labelCls}>Email *</label>
        <input className={inputCls} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="adres@email.pl"/>
      </div>
      <div><label className={labelCls}>Hasło *</label>
        <input className={inputCls} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="min. 6 znaków"/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Imię</label><input className={inputCls} value={firstName} onChange={e=>setFirstName(e.target.value)}/></div>
        <div><label className={labelCls}>Nazwisko</label><input className={inputCls} value={lastName} onChange={e=>setLastName(e.target.value)}/></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>Telefon</label><input className={inputCls} value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        <div><label className={labelCls}>Miasto</label><input className={inputCls} value={city} onChange={e=>setCity(e.target.value)}/></div>
      </div>
      <div><label className={labelCls}>Rola</label>
        <select className={inputCls} value={role} onChange={e=>setRole(e.target.value)}>
          <option value="donor">donor</option><option value="admin">admin</option>
        </select>
      </div>
      {saveError && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{saveError}</p>}
      <div className="flex gap-2">
        <button onClick={()=>onSave({email,password,first_name:firstName,last_name:lastName,phone,city,role})}
          disabled={saving||!email||!password} className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#14532d,#166534)"}}>
          {saving?<Loader2 size={15} className="animate-spin"/>:<UserPlus size={15}/>} Utwórz konto
        </button>
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-800 hover:bg-slate-700 text-sm transition-colors">Anuluj</button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>(null);
  const [notifSubtab, setNotifSubtab] = useState<"instant"|"scheduled">("instant");

  // Notification state
  const [notif, setNotif] = useState({ title: "", body: "", type: "news" as NotifType, url: "" });
  const [articlesList, setArticlesList] = useState<{slug:string;title:string}[]>([]);
  const [petitionsList, setPetitionsList] = useState<{slug:string;title:string}[]>([]);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState("");
  const [selectedPetitionSlug, setSelectedPetitionSlug] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifResult, setNotifResult] = useState<{ sent: number; failed: number }|null>(null);
  const [notifError, setNotifError] = useState("");

  // Users state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow|null>(null);
  const [userSaving, setUserSaving] = useState(false);
  const [userSaveError, setUserSaveError] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState("");
  const [addUserSaving, setAddUserSaving] = useState(false);

  // Prayers state
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [prayersLoading, setPrayersLoading] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<Prayer|null>(null);
  const [addingPrayer, setAddingPrayer] = useState(false);
  const [prayerSaving, setPrayerSaving] = useState(false);
  const [expandedPrayer, setExpandedPrayer] = useState<string|null>(null);

  // Stats/system state
  const [stats, setStats] = useState<AdminStats|null>(null);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);
  const [cacheMsg, setCacheMsg] = useState("");
  const [errorsClearing, setErrorsClearing] = useState(false);

  // Scheduled notifications
  const [scheduled, setScheduled] = useState<ScheduledNotif[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [addingScheduled, setAddingScheduled] = useState(false);
  const [scheduledSaving, setScheduledSaving] = useState(false);
  const [sendingScheduledId, setSendingScheduledId] = useState<string|null>(null);
  const [scheduledSendResult, setScheduledSendResult] = useState<Record<string,{sent:number}>>({});

  // Contact messages
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [expandedMsg, setExpandedMsg] = useState<string|null>(null);

  // App settings
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [magicLinkEnabled, setMagicLinkEnabled] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [loginSettingsLoading, setLoginSettingsLoading] = useState(false);

  // Tiles config
  const [tilesConfig, setTilesConfig] = useState<TilesConfig>({});
  const [tilesLoading, setTilesLoading] = useState(false);
  const [tilesSaving, setTilesSaving] = useState(false);
  const [tilesSaved, setTilesSaved] = useState(false);
  const [expandedTile, setExpandedTile] = useState<string|null>(null);
  const [tileEdits, setTileEdits] = useState<TileOverride>({});
  const [tilesTab, setTilesTab] = useState<"tiles"|"sections">("tiles");
  const [pageConfig, setPageConfig] = useState<PageConfig>({});
  const [pageConfigSaving, setPageConfigSaving] = useState(false);

  // Modules state
  const [modulesTab, setModulesTab] = useState<"list"|"nav">("list");
  const [expandedMod, setExpandedMod] = useState<string|null>(null);
  const [modEdits, setModEdits] = useState<{label?:string;sublabel?:string;icon?:string}>({});

  // ── Bypass code ──
  const [bypassCode, setBypassCode] = useState("");
  const [bypassInput, setBypassInput] = useState("");
  const [bypassSaving, setBypassSaving] = useState(false);
  const [bypassSaved, setBypassSaved] = useState(false);
  const [bypassError, setBypassError] = useState("");
  const [bypassLoading, setBypassLoading] = useState(false);

  // ── Referral / share email config ──
  const [shareSubject, setShareSubject] = useState("");
  const [shareBody, setShareBody] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSaving, setShareSaving] = useState(false);
  const [shareSaved, setShareSaved] = useState(false);

  // ── Permissions / role ──
  const [myRole, setMyRole] = useState<string>("");
  const [myTiles, setMyTiles] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(true);

  // ── Groups state ──
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<Record<string, string[]>>({});
  const [groupPermissions, setGroupPermissions] = useState<Record<string, string[]>>({});
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsTab, setGroupsTab] = useState<"groups"|"users">("groups");
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [groupSaving, setGroupSaving] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string|null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDesc, setEditGroupDesc] = useState("");
  const [selectedPermGroupId, setSelectedPermGroupId] = useState<string>("");
  const [permSaving, setPermSaving] = useState(false);
  const [permSaved, setPermSaved] = useState(false);
  const [addMemberGroupId, setAddMemberGroupId] = useState<string>("");
  const [addMemberUserId, setAddMemberUserId] = useState<string>("");

  // ── Plinio state ──
  interface PlinioQuoteRow { day: number; quote: string; source: string; }
  const [plinioQuotes, setPlinioQuotes] = useState<PlinioQuoteRow[]>([]);
  const [plinioOverrides, setPlinioOverrides] = useState<Record<number, {quote: string; source: string}>>({});
  const [plinioConfig, setPlinioConfig] = useState<Record<string, string>>({});
  const [plinioLoading, setPlinioLoading] = useState(false);
  const [plinioTab, setPlinioTab] = useState<"quotes"|"config">("quotes");
  const [plinioSearch, setPlinioSearch] = useState("");
  const [plinioEditDay, setPlinioEditDay] = useState<number|null>(null);
  const [plinioEditQuote, setPlinioEditQuote] = useState("");
  const [plinioEditSource, setPlinioEditSource] = useState("");
  const [plinioSaving, setPlinioSaving] = useState(false);
  const [plinioSaved, setPlinioSaved] = useState(false);
  const [plinioConfigSaving, setPlinioConfigSaving] = useState(false);
  const [plinioConfigSaved, setPlinioConfigSaved] = useState(false);

  // ── Catechism state ──
  interface CatChapter { id: string; num: number; title: string; qa: {n: number; q: string; a: string}[] }
  const [catChapters, setCatChapters] = useState<CatChapter[]>([]);
  const [catConfig, setCatConfig] = useState<Record<string, string>>({});
  const [catQaOverrides, setCatQaOverrides] = useState<Record<string, {q: string; a: string}>>({});
  const [catLoading, setCatLoading] = useState(false);
  const [catTab, setCatTab] = useState<"qa"|"config">("qa");
  const [catSearch, setCatSearch] = useState("");
  const [catActiveChapter, setCatActiveChapter] = useState<string>("");
  const [catEditKey, setCatEditKey] = useState<string|null>(null);
  const [catEditQ, setCatEditQ] = useState("");
  const [catEditA, setCatEditA] = useState("");
  const [catSaving, setCatSaving] = useState(false);
  const [catSaved, setCatSaved] = useState(false);
  const [catConfigSaving, setCatConfigSaving] = useState(false);
  const [catConfigSaved, setCatConfigSaved] = useState(false);

  // ── Civilitas state ──
  const [civConfig, setCivConfig] = useState<Record<string, string>>({});
  const [civLoading, setCivLoading] = useState(false);
  const [civSaving, setCivSaving] = useState(false);
  const [civSaved, setCivSaved] = useState(false);
  const [civTab, setCivTab] = useState<"config"|"sections">("config");
  const [civSectionOverrides, setCivSectionOverrides] = useState<Record<string, string>>({});
  const [civActiveSectionNum, setCivActiveSectionNum] = useState<string>(CIVILITAS_SECTIONS[0].num);
  const [civEditText, setCivEditText] = useState<string>("");
  const [civSectionSaving, setCivSectionSaving] = useState(false);
  const [civSectionSaved, setCivSectionSaved] = useState(false);

  // ── Articles (manual) state ──
  const [manualArticles, setManualArticles] = useState<ManualArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ManualArticle|null>(null);
  const [addingArticle, setAddingArticle] = useState(false);
  const [articleSaving, setArticleSaving] = useState(false);
  const [articleForm, setArticleForm] = useState<Partial<ManualArticle>>({});

  // ── Petitions (manual) state ──
  const [manualPetitions, setManualPetitions] = useState<ManualPetition[]>([]);
  const [petitionsAdminLoading, setPetitionsAdminLoading] = useState(false);
  const [editingPetition, setEditingPetition] = useState<ManualPetition|null>(null);
  const [addingPetition, setAddingPetition] = useState(false);
  const [petitionSaving, setPetitionSaving] = useState(false);
  const [petitionForm, setPetitionForm] = useState<Partial<ManualPetition>>({});

  // ── Videos state ──
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoRow|null>(null);
  const [addingVideo, setAddingVideo] = useState(false);
  const [videoSaving, setVideoSaving] = useState(false);
  const [videoForm, setVideoForm] = useState<Partial<VideoRow>>({});
  const [videoFilter, setVideoFilter] = useState("Wszystkie");

  // ── Push stats state ──
  const [pushStats, setPushStats] = useState<PushStats|null>(null);
  const [pushStatsLoading, setPushStatsLoading] = useState(false);

  // ── Push geographic segmentation state ──
  const [pushCities, setPushCities] = useState<string[]>([]);
  const [pushSelectedCities, setPushSelectedCities] = useState<string[]>([]);
  const [pushCityFilter, setPushCityFilter] = useState(false);

  // ── Auth check ──
  useEffect(() => {
    fetch("/api/admin/check").then(r => r.json()).then(d => {
      setIsAdmin(d.admin===true);
    }).catch(() => setIsAdmin(false));
  }, []);

  // ── Load my permissions ──
  useEffect(() => {
    fetch("/api/admin/my-permissions").then(r => r.json()).then(d => {
      if (d.role) { setMyRole(d.role); setMyTiles(d.tiles ?? []); }
    }).catch(() => {}).finally(() => setPermLoading(false));
  }, []);

  // ── Load data on section switch ──
  useEffect(() => {
    if (!isAdmin) return;
    if (section==="users" && users.length===0) {
      setUsersLoading(true);
      fetch("/api/admin/users").then(r=>r.json()).then(d=>{if(Array.isArray(d))setUsers(d);}).finally(()=>setUsersLoading(false));
    }
    if (section==="prayers" && prayers.length===0) {
      setPrayersLoading(true);
      fetch("/api/admin/prayers").then(r=>r.json()).then(d=>{if(Array.isArray(d))setPrayers(d);}).finally(()=>setPrayersLoading(false));
    }
    if ((section==="stats" || section==="errors") && !stats) {
      fetch("/api/admin/stats").then(r=>r.json()).then(d=>setStats(d));
    }
    if (section==="notifications") {
      if (scheduled.length===0) {
        setScheduledLoading(true);
        fetch("/api/admin/scheduled-notifications").then(r=>r.json()).then(d=>{if(Array.isArray(d))setScheduled(d);}).finally(()=>setScheduledLoading(false));
      }
      if (articlesList.length===0) {
        fetch("/api/articles").then(r=>r.json()).then(d=>{
          if(Array.isArray(d)) setArticlesList(d.map((a:{slug:string;title:string})=>({slug:a.slug,title:a.title})));
        }).catch(()=>{});
      }
      if (petitionsList.length===0) {
        fetch("/api/petitions").then(r=>r.json()).then(d=>{
          if(Array.isArray(d)) setPetitionsList(d.map((p:{slug:string;title:string})=>({slug:p.slug,title:p.title})));
        }).catch(()=>{});
      }
    }
    if (section==="messages" && messages.length===0) {
      setMessagesLoading(true);
      fetch("/api/contact").then(r=>r.json()).then(d=>{if(Array.isArray(d))setMessages(d);}).finally(()=>setMessagesLoading(false));
    }
    if (section==="settings" && Object.keys(appSettings).length===0) {
      fetch("/api/admin/settings").then(r=>r.json()).then(d=>setAppSettings(d));
    }
    if (section==="login") {
      fetch("/api/settings/login").then(r=>r.json()).then(d=>{
        setMagicLinkEnabled(d.magic_link_enabled===true);
        setRegistrationEnabled(d.registration_enabled===true);
      });
    }
    if (section==="referral" && !shareSubject) { loadShareConfig(); }
    if (section==="bypass") { loadBypassCode(); }
    if (section==="catechism" && catChapters.length===0) {
      setCatLoading(true);
      Promise.all([
        fetch("/katechizm.json").then(r => r.json()),
        fetch("/api/admin/catechism").then(r => r.json()),
      ]).then(([chapters, adminData]) => {
        setCatChapters(chapters ?? []);
        setCatConfig(adminData.config ?? {});
        setCatQaOverrides(adminData.qaOverrides ?? {});
        if (chapters?.[0]) setCatActiveChapter(chapters[0].id);
      }).finally(() => setCatLoading(false));
    }
    if (section==="civilitas" && !civConfig.pageTitle && !civLoading) {
      setCivLoading(true);
      fetch("/api/admin/civilitas").then(r => r.json()).then(d => {
        setCivConfig(d.config ?? {});
        setCivSectionOverrides(d.sectionOverrides ?? {});
      }).finally(() => setCivLoading(false));
    }
    if (section==="plinio" && plinioQuotes.length===0) {
      setPlinioLoading(true);
      fetch("/api/admin/plinio").then(r=>r.json()).then(d=>{
        setPlinioQuotes(d.quotes ?? []);
        setPlinioOverrides(d.overrides ?? {});
        setPlinioConfig(d.config ?? {});
      }).finally(()=>setPlinioLoading(false));
    }
    if ((section==="tiles" || section==="modules") && Object.keys(tilesConfig).length===0) {
      setTilesLoading(true);
      fetch("/api/admin/tiles").then(r=>r.json()).then(d=>{
        setTilesConfig(d??{});
        setPageConfig((d?._page as unknown as PageConfig) ?? {});
      }).finally(()=>setTilesLoading(false));
    }
    // Also load stats for dashboard badges
    if (section===null && !stats) {
      fetch("/api/admin/stats").then(r=>r.json()).then(d=>setStats(d));
    }
    if (section===null && messages.length===0) {
      fetch("/api/contact").then(r=>r.json()).then(d=>{if(Array.isArray(d))setMessages(d);});
    }
    if (section==="access") {
      loadGroups();
      if (users.length === 0) {
        setUsersLoading(true);
        fetch("/api/admin/users").then(r=>r.json()).then(d=>{if(Array.isArray(d))setUsers(d);}).finally(()=>setUsersLoading(false));
      }
    }
    if (section==="articles") {
      setArticlesLoading(true);
      fetch("/api/admin/articles").then(r=>r.json()).then(d=>{if(Array.isArray(d))setManualArticles(d);}).finally(()=>setArticlesLoading(false));
    }
    if (section==="petitions") {
      setPetitionsAdminLoading(true);
      fetch("/api/admin/petitions").then(r=>r.json()).then(d=>{if(Array.isArray(d))setManualPetitions(d);}).finally(()=>setPetitionsAdminLoading(false));
    }
    if (section==="videos") {
      setVideosLoading(true);
      fetch("/api/admin/videos").then(r=>r.json()).then(d=>{if(Array.isArray(d))setVideos(d);}).finally(()=>setVideosLoading(false));
    }
    if (section==="push-stats") {
      setPushStatsLoading(true);
      fetch("/api/admin/push-stats").then(r=>r.json()).then(d=>setPushStats(d)).finally(()=>setPushStatsLoading(false));
    }
    if (section==="notifications") {
      // Load cities for geo-segmentation
      fetch("/api/admin/push-cities").then(r=>r.json()).then(d=>{if(Array.isArray(d))setPushCities(d);}).catch(()=>{});
    }
  }, [section, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Notification send ──
  async function handleSendNotif(e: React.FormEvent) {
    e.preventDefault();
    setNotifSending(true); setNotifError(""); setNotifResult(null);
    const payload = pushCityFilter && pushSelectedCities.length > 0 ? {...notif, cities: pushSelectedCities} : notif;
    const res = await fetch("/api/push/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    setNotifSending(false);
    if (!res.ok){const d=await res.json();setNotifError(d.error??"Błąd wysyłania");return;}
    const d=await res.json();setNotifResult(d);
    setNotif(p=>({...p,title:"",body:"",url:""}));
  }

  // ── Prayer CRUD ──
  const reloadPrayers = useCallback(()=>{
    setPrayersLoading(true);
    fetch("/api/admin/prayers").then(r=>r.json()).then(d=>{if(Array.isArray(d))setPrayers(d);}).finally(()=>setPrayersLoading(false));
  },[]);

  async function handleSavePrayer(data: Partial<Prayer>) {
    setPrayerSaving(true);
    if (editingPrayer) {
      await fetch(`/api/admin/prayers/${editingPrayer.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      setEditingPrayer(null);
    } else {
      await fetch("/api/admin/prayers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      setAddingPrayer(false);
    }
    setPrayerSaving(false); reloadPrayers();
  }

  async function handleDeletePrayer(id: string) {
    if (!confirm("Usunąć tę modlitwę?")) return;
    await fetch(`/api/admin/prayers/${id}`,{method:"DELETE"}); reloadPrayers();
  }

  // ── Articles CRUD ──
  const reloadArticles = useCallback(()=>{
    setArticlesLoading(true);
    fetch("/api/admin/articles").then(r=>r.json()).then(d=>{if(Array.isArray(d))setManualArticles(d);}).finally(()=>setArticlesLoading(false));
  },[]);
  async function handleSaveArticle() {
    setArticleSaving(true);
    if (editingArticle) {
      await fetch("/api/admin/articles",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...articleForm,id:editingArticle.id})});
      setEditingArticle(null);
    } else {
      await fetch("/api/admin/articles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(articleForm)});
      setAddingArticle(false);
    }
    setArticleForm({}); setArticleSaving(false); reloadArticles();
  }
  async function handleDeleteArticle(id: string) {
    if (!confirm("Usunąć ten artykuł?")) return;
    await fetch(`/api/admin/articles?id=${id}`,{method:"DELETE"}); reloadArticles();
  }

  // ── Petitions CRUD ──
  const reloadPetitionsAdmin = useCallback(()=>{
    setPetitionsAdminLoading(true);
    fetch("/api/admin/petitions").then(r=>r.json()).then(d=>{if(Array.isArray(d))setManualPetitions(d);}).finally(()=>setPetitionsAdminLoading(false));
  },[]);
  async function handleSavePetition() {
    setPetitionSaving(true);
    if (editingPetition) {
      await fetch("/api/admin/petitions",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...petitionForm,id:editingPetition.id})});
      setEditingPetition(null);
    } else {
      await fetch("/api/admin/petitions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(petitionForm)});
      setAddingPetition(false);
    }
    setPetitionForm({}); setPetitionSaving(false); reloadPetitionsAdmin();
  }
  async function handleDeletePetition(id: string) {
    if (!confirm("Usunąć tę petycję?")) return;
    await fetch(`/api/admin/petitions?id=${id}`,{method:"DELETE"}); reloadPetitionsAdmin();
  }

  // ── Videos CRUD ──
  const reloadVideos = useCallback(()=>{
    setVideosLoading(true);
    fetch("/api/admin/videos").then(r=>r.json()).then(d=>{if(Array.isArray(d))setVideos(d);}).finally(()=>setVideosLoading(false));
  },[]);
  async function handleSaveVideo() {
    setVideoSaving(true);
    const payload = {...videoForm, tags: typeof videoForm.tags === "string" ? (videoForm.tags as string).split(",").map((t:string)=>t.trim()).filter(Boolean) : (videoForm.tags ?? [])};
    if (editingVideo) {
      await fetch("/api/admin/videos",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,id:editingVideo.id})});
      setEditingVideo(null);
    } else {
      await fetch("/api/admin/videos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      setAddingVideo(false);
    }
    setVideoForm({}); setVideoSaving(false); reloadVideos();
  }
  async function handleDeleteVideo(id: string) {
    if (!confirm("Usunąć ten film?")) return;
    await fetch(`/api/admin/videos?id=${id}`,{method:"DELETE"}); reloadVideos();
  }

  // ── Cache refresh ──
  async function handleCacheRefresh() {
    setCacheRefreshing(true); setCacheMsg("");
    const res = await fetch("/api/admin/cache-refresh",{method:"POST"});
    setCacheRefreshing(false);
    setCacheMsg(res.ok?"Cache odświeżony pomyślnie.":"Błąd odświeżania cache.");
  }

  async function handleClearErrors() {
    if (!confirm("Wyczyścić rejestr błędów?")) return;
    setErrorsClearing(true);
    const res = await fetch("/api/admin/errors", { method: "DELETE" });
    setErrorsClearing(false);
    if (res.ok) setStats(prev => prev ? { ...prev, errors24h: 0, recentErrors: [] } : prev);
  }

  // ── Scheduled notifications ──
  const reloadScheduled = useCallback(()=>{
    setScheduledLoading(true);
    fetch("/api/admin/scheduled-notifications").then(r=>r.json()).then(d=>{if(Array.isArray(d))setScheduled(d);}).finally(()=>setScheduledLoading(false));
  },[]);

  async function handleSaveScheduled(data: Partial<ScheduledNotif>) {
    setScheduledSaving(true);
    await fetch("/api/admin/scheduled-notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    setScheduledSaving(false); setAddingScheduled(false); reloadScheduled();
  }

  async function handleDeleteScheduled(id: string) {
    if (!confirm("Usunąć to powiadomienie?")) return;
    await fetch(`/api/admin/scheduled-notifications?id=${id}`,{method:"DELETE"}); reloadScheduled();
  }

  async function handleSendScheduledNow(id: string) {
    setSendingScheduledId(id);
    const res = await fetch("/api/admin/scheduled-notifications/send",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    const d = await res.json();
    setSendingScheduledId(null);
    setScheduledSendResult(prev=>({...prev,[id]:{sent:d.sent??0}}));
    reloadScheduled();
    setTimeout(()=>setScheduledSendResult(prev=>{const n={...prev};delete n[id];return n;}),4000);
  }

  // ── Contact messages ──
  async function handleMarkRead(id: string) {
    await fetch(`/api/contact?id=${id}`,{method:"PATCH"});
    setMessages(prev=>prev.map(m=>m.id===id?{...m,read:true}:m));
  }

  async function handleDeleteMessage(id: string) {
    if (!confirm("Usunąć tę wiadomość?")) return;
    await fetch(`/api/contact?id=${id}`,{method:"DELETE"});
    setMessages(prev=>prev.filter(m=>m.id!==id));
  }

  // ── App settings ──
  async function handleLoginSetting(key: "magic_link_enabled" | "registration_enabled", val: boolean) {
    setLoginSettingsLoading(true);
    await fetch("/api/settings/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: val }),
    });
    if (key === "magic_link_enabled") setMagicLinkEnabled(val);
    if (key === "registration_enabled") setRegistrationEnabled(val);
    setLoginSettingsLoading(false);
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true); setSettingsSaved(false);
    await fetch("/api/admin/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(appSettings)});
    setSettingsSaving(false); setSettingsSaved(true);
    setTimeout(()=>setSettingsSaved(false),3000);
  }

  // ── User edit ──
  async function handleSaveUser(data: Partial<UserRow>) {
    if (!editingUser) return;
    setUserSaving(true); setUserSaveError("");
    const res = await fetch(`/api/admin/users/${editingUser.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    setUserSaving(false);
    if (!res.ok){const d=await res.json().catch(()=>({}));setUserSaveError(d.error??"Błąd zapisu");return;}
    const saved=await res.json().catch(()=>null);
    setUsers(prev=>prev.map(u=>u.id===editingUser.id?{...u,...(saved??data)}:u));
    setEditingUser(null);
  }

  // ── Add user ──
  async function handleAddUser(data: { email: string; password: string; first_name: string; last_name: string; phone: string; city: string; role: string }) {
    setAddUserSaving(true); setAddUserError("");
    const res = await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    setAddUserSaving(false);
    if (!res.ok){const d=await res.json().catch(()=>({}));setAddUserError(d.error??"Błąd tworzenia konta");return;}
    const newUser=await res.json();
    setUsers(prev=>[newUser,...prev]);
    setAddingUser(false);
  }

  // ── Tiles ──
  function toggleExpandTile(mod: string) {
    if (expandedTile === mod) { setExpandedTile(null); setTileEdits({}); }
    else { setExpandedTile(mod); setTileEdits(tilesConfig[mod] ?? {}); }
  }

  async function saveTilesConfig(next: TilesConfig) {
    await fetch("/api/admin/tiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});
  }

  async function handleSaveTileInline(mod: string) {
    const next={...tilesConfig,[mod]:{...tilesConfig[mod],...tileEdits}};
    setTilesSaving(true);
    await saveTilesConfig(next);
    setTilesConfig(next); setTilesSaving(false); setTilesSaved(true);
    setExpandedTile(null); setTileEdits({});
    setTimeout(()=>setTilesSaved(false),3000);
  }

  async function handleResetTile(mod: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {label:_l, sublabel:_s, colorPreset:_c, ...rest} = tilesConfig[mod] ?? {};
    const next={...tilesConfig,[mod]:rest};
    setTilesSaving(true);
    await saveTilesConfig(next);
    setTilesConfig(next); setTilesSaving(false);
    setExpandedTile(null); setTileEdits({});
  }

  async function handleToggleTileVisibility(mod: string) {
    const current=tilesConfig[mod]?.hidden??false;
    const next={...tilesConfig,[mod]:{...tilesConfig[mod],hidden:!current}};
    setTilesConfig(next);
    await saveTilesConfig(next);
  }

  async function handleMoveTile(mod: string, direction: "up"|"down") {
    const sorted=[...TILE_MODS].sort((a,b)=>(tilesConfig[a.mod]?.order??99)-(tilesConfig[b.mod]?.order??99));
    const idx=sorted.findIndex(t=>t.mod===mod);
    const swapIdx=direction==="up"?idx-1:idx+1;
    if (swapIdx<0||swapIdx>=sorted.length) return;
    // Assign sequential orders first, then swap
    const orders=sorted.map((t,i)=>({mod:t.mod,order:i+1}));
    const tmp=orders[idx].order; orders[idx].order=orders[swapIdx].order; orders[swapIdx].order=tmp;
    const next={...tilesConfig};
    orders.forEach(({mod:m,order})=>{next[m]={...next[m],order};});
    setTilesConfig(next);
    await saveTilesConfig(next);
  }

  async function handleSavePageConfig() {
    const next={...tilesConfig,_page:pageConfig as unknown as TileOverride};
    setPageConfigSaving(true);
    await saveTilesConfig(next);
    setTilesConfig(next); setPageConfigSaving(false);
    setTilesSaved(true); setTimeout(()=>setTilesSaved(false),3000);
  }

  // ── Module handlers ──
  function handleToggleModuleEnabled(mod: string) {
    const current = tilesConfig[mod]?.hidden ?? false;
    const next = { ...tilesConfig, [mod]: { ...tilesConfig[mod], hidden: !current } };
    setTilesConfig(next);
    fetch("/api/admin/tiles", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(next) })
      .then(() => { setTilesSaved(true); setTimeout(()=>setTilesSaved(false), 2000); });
  }

  async function handleSaveModInline(mod: string) {
    setTilesSaving(true);
    const next = { ...tilesConfig, [mod]: { ...tilesConfig[mod], ...modEdits } };
    if (!modEdits.label) delete (next[mod] as TileOverride).label;
    if (!modEdits.sublabel) delete (next[mod] as TileOverride).sublabel;
    if (!modEdits.icon) delete (next[mod] as TileOverride).icon;
    setTilesConfig(next);
    await fetch("/api/admin/tiles", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(next) });
    try { localStorage.setItem("salve_tiles_config", JSON.stringify(next)); } catch {}
    setTilesSaving(false); setTilesSaved(true); setTimeout(()=>setTilesSaved(false), 2000);
    setExpandedMod(null); setModEdits({});
  }

  function getNavItems(): string[] {
    return (tilesConfig._nav as {items?:string[]} | undefined)?.items ?? [];
  }

  function handleAddToNav(mod: string) {
    const current = getNavItems();
    if (current.includes(mod) || current.length >= 5) return;
    const next = { ...tilesConfig, _nav: { items: [...current, mod] } };
    setTilesConfig(next as TilesConfig);
    fetch("/api/admin/tiles", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(next) });
    try { localStorage.setItem("salve_tiles_config", JSON.stringify(next)); } catch {}
  }

  function handleRemoveFromNav(mod: string) {
    const next = { ...tilesConfig, _nav: { items: getNavItems().filter(m => m !== mod) } };
    setTilesConfig(next as TilesConfig);
    fetch("/api/admin/tiles", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(next) });
    try { localStorage.setItem("salve_tiles_config", JSON.stringify(next)); } catch {}
  }

  function handleMoveNavItem(mod: string, dir: "up"|"down") {
    const items = [...getNavItems()];
    const idx = items.indexOf(mod);
    if (dir==="up" && idx > 0) [items[idx-1],items[idx]] = [items[idx],items[idx-1]];
    if (dir==="down" && idx < items.length-1) [items[idx],items[idx+1]] = [items[idx+1],items[idx]];
    const next = { ...tilesConfig, _nav: { items } };
    setTilesConfig(next as TilesConfig);
    fetch("/api/admin/tiles", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(next) });
    try { localStorage.setItem("salve_tiles_config", JSON.stringify(next)); } catch {}
  }

  // ── Bypass code handlers ──
  async function loadBypassCode() {
    setBypassLoading(true);
    try {
      const r = await fetch("/api/admin/bypass-code");
      const { code } = await r.json() as { code: string | null };
      setBypassCode(code ?? "");
      setBypassInput(code ?? "");
    } finally { setBypassLoading(false); }
  }

  async function handleSaveBypass() {
    if (!/^\d{6}$/.test(bypassInput)) { setBypassError("Kod musi mieć dokładnie 6 cyfr"); return; }
    setBypassSaving(true); setBypassError("");
    const r = await fetch("/api/admin/bypass-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: bypassInput }),
    });
    const res = await r.json() as { ok?: boolean; error?: string };
    setBypassSaving(false);
    if (res.ok) { setBypassCode(bypassInput); setBypassSaved(true); setTimeout(() => setBypassSaved(false), 2500); }
    else setBypassError(res.error ?? "Błąd zapisu");
  }

  async function handleDeleteBypass() {
    await fetch("/api/admin/bypass-code", { method: "DELETE" });
    setBypassCode(""); setBypassInput("");
  }

  // ── Referral handlers ──
  async function loadShareConfig() {
    setShareLoading(true);
    try {
      const r = await fetch("/api/admin/share");
      const c = await r.json();
      setShareSubject(c.subject ?? "");
      setShareBody(c.body ?? "");
    } finally {
      setShareLoading(false);
    }
  }

  async function handleSaveShare() {
    setShareSaving(true);
    await fetch("/api/admin/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: shareSubject, body: shareBody }),
    });
    setShareSaving(false);
    setShareSaved(true);
    setTimeout(() => setShareSaved(false), 2500);
  }

  function handleResetShare() {
    fetch("/api/admin/share").then(r => r.json()).then(() => {
      // Re-fetch defaults by posting empty (API fills defaults)
      fetch("/api/admin/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "", body: "" }),
      }).then(() => loadShareConfig());
    });
  }

  // ── Groups ──
  function loadGroups() {
    setGroupsLoading(true);
    fetch("/api/admin/groups").then(r=>r.json()).then(d=>{
      if (d.groups) setGroups(d.groups);
      if (d.members) setGroupMembers(d.members);
      if (d.permissions) setGroupPermissions(d.permissions);
    }).catch(()=>{}).finally(()=>setGroupsLoading(false));
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    setGroupSaving(true);
    await fetch("/api/admin/groups",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:newGroupName,description:newGroupDesc})});
    setGroupSaving(false); setAddingGroup(false); setNewGroupName(""); setNewGroupDesc(""); loadGroups();
  }

  async function handleUpdateGroup(id: string) {
    setGroupSaving(true);
    await fetch("/api/admin/groups",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,name:editGroupName,description:editGroupDesc})});
    setGroupSaving(false); setEditingGroupId(null); loadGroups();
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Usunąć tę grupę?")) return;
    await fetch("/api/admin/groups",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    loadGroups();
  }

  async function handleAddMember(groupId?: string, userId?: string) {
    const gid = groupId ?? addMemberGroupId;
    const uid = userId ?? addMemberUserId;
    if (!gid || !uid) return;
    await fetch("/api/admin/groups/members",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({groupId:gid,userId:uid})});
    setAddMemberUserId(""); setAddMemberGroupId(""); loadGroups();
  }

  async function handleRemoveMember(groupId: string, userId: string) {
    await fetch("/api/admin/groups/members",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({groupId,userId})});
    loadGroups();
  }

  async function handleSavePermissions(groupId: string, tiles: string[]) {
    setPermSaving(true);
    await fetch("/api/admin/groups/permissions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({groupId,tiles})});
    setPermSaving(false); setPermSaved(true); setTimeout(()=>setPermSaved(false),2000);
    setGroupPermissions(prev=>({...prev,[groupId]:tiles}));
  }

  // ── Permission check ──
  const TILE_LABELS: Record<string, string> = {
    notifications: "Powiadomienia", messages: "Wiadomości", users: "Użytkownicy",
    prayers: "Modlitwy", tiles: "Strona główna", modules: "Moduły",
    plinio: "Myśl na dziś", catechism: "Katechizm", civilitas: "Civilitas",
    referral: "Polecanie", bypass: "Kod dostępu", settings: "Kontakt",
    stats: "Statystyki", errors: "Błędy", login: "Ekran logowania",
  };

  function canAccess(key: string): boolean {
    if (myRole === "superadmin") return true;
    return myTiles.includes(key);
  }

  // ── Auth guard ──
  if (isAdmin===null) return <AppShell><div className="flex justify-center py-24"><Loader2 size={28} className="text-red-400 animate-spin"/></div></AppShell>;
  if (!isAdmin) return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <ShieldAlert size={48} className="text-red-500"/>
        <h1 className="text-white text-xl font-bold">Brak dostępu</h1>
        <p className="text-slate-400 text-sm">Ta sekcja jest dostępna tylko dla administratorów.</p>
      </div>
    </AppShell>
  );

  const unreadCount = messages.filter(m=>!m.read).length;
  const typeOptions = [
    {key:"news" as NotifType,     icon:<Newspaper size={17}/>,   label:"Aktualności",  color:"text-green-400 bg-green-400/10"},
    {key:"action" as NotifType,   icon:<Megaphone size={17}/>,   label:"Akcja",        color:"text-red-400 bg-red-400/10"},
    {key:"prayer" as NotifType,   icon:<BookMarked size={17}/>,  label:"Modlitwa",     color:"text-amber-400 bg-amber-400/10"},
    {key:"article" as NotifType,  icon:<Newspaper size={17}/>,   label:"Polecamy",     color:"text-teal-400 bg-teal-400/10"},
    {key:"petition" as NotifType, icon:<Megaphone size={17}/>,   label:"Podpisz petycję", color:"text-pink-400 bg-pink-400/10"},
  ];

  // ── Dashboard section tiles ──
  const allDashTiles: { key: Section; icon: React.ReactNode; label: string; desc: string; badge?: number|string; color: string; accent: string; superadminOnly?: boolean }[] = [
    { key:"notifications", icon:<Bell size={22}/>,       label:"Powiadomienia",  desc:"Push, zaplanowane",           color:"linear-gradient(135deg,#3d1a00,#7a3200)", accent:"#fb923c", badge:scheduled.length||undefined },
    { key:"messages",      icon:<MessageSquare size={22}/>,label:"Wiadomości",   desc:"Formularz kontaktowy",        color:"linear-gradient(135deg,#07203b,#0f3470)", accent:"#60a5fa", badge:unreadCount||undefined },
    { key:"users",         icon:<Users size={22}/>,      label:"Użytkownicy",    desc:"Konta, role, hasła",          color:"linear-gradient(135deg,#052a10,#0a4a1e)", accent:"#4ade80", badge:stats?.users },
    { key:"prayers",       icon:<BookMarked size={22}/>, label:"Modlitwy",       desc:"Katalog modlitw",             color:"linear-gradient(135deg,#332500,#5c4500)", accent:"#facc15", badge:stats?.prayers },
    { key:"tiles",         icon:<LayoutGrid size={22}/>, label:"Strona główna",  desc:"Kafelki, kolejność, kolory",  color:"linear-gradient(135deg,#1a0a2e,#2e1060)", accent:"#c084fc" },
    { key:"modules",       icon:<LayoutGrid size={22}/>, label:"Moduły",          desc:"Ikony, nazwy, nawigacja",     color:"linear-gradient(135deg,#0a1a2e,#0f2e50)", accent:"#38bdf8" },
    { key:"plinio",        icon:<BookMarked size={22}/>,label:"Myśl na dziś",    desc:"Cytaty i treści modułu",      color:"linear-gradient(135deg,#2a1800,#4a2e00)", accent:"#fbbf24" },
    { key:"catechism",     icon:<BookMarked size={22}/>,label:"Katechizm",       desc:"Q&A i treści modułu",         color:"linear-gradient(135deg,#1a1000,#3a2800)", accent:"#f59e0b" },
    { key:"civilitas",     icon:<BookMarked size={22}/>,label:"Civilitas",       desc:"Wstęp, zakończenie, tytuły",  color:"linear-gradient(135deg,#1a0a2e,#2e1060)", accent:"#c084fc" },
    { key:"referral",      icon:<Mail size={22}/>,      label:"Polecanie",        desc:"Treść maila polecającego",    color:"linear-gradient(135deg,#0f2800,#1e4a00)", accent:"#86efac" },
    { key:"bypass",        icon:<Lock size={22}/>,      label:"Kod dostępu",      desc:"Mój kod do panelu na desktop", color:"linear-gradient(135deg,#1a1a0a,#3a3a10)", accent:"#facc15" },
    { key:"stats",         icon:<BarChart2 size={22}/>,  label:"Statystyki",     desc:"Wyświetlenia, aktywność",     color:"linear-gradient(135deg,#042828,#074a4a)", accent:"#2dd4bf" },
    { key:"errors",        icon:<AlertTriangle size={22}/>,label:"Błędy",         desc:"Monitoring produkcji",        color:"linear-gradient(135deg,#3b0909,#6b1111)", accent:"#f87171", badge:stats?.errors24h||undefined },
    { key:"settings",      icon:<Settings2 size={22}/>,  label:"Kontakt",        desc:"Ustawienia kontaktu",         color:"linear-gradient(135deg,#0f0a28,#1e1550)", accent:"#818cf8" },
    { key:"login",         icon:<Lock size={22}/>,       label:"Ekran logowania", desc:"Magic Link i inne opcje",     color:"linear-gradient(135deg,#1a0a0a,#3b1010)", accent:"#f87171" },
    { key:"access",        icon:<Shield size={22}/>,     label:"Dostęp adminów",  desc:"Grupy, uprawnienia, członkowie", color:"linear-gradient(135deg,#0a1a30,#102040)", accent:"#38bdf8", superadminOnly:true },
    { key:"articles",      icon:<Newspaper size={22}/>,  label:"Artykuły",        desc:"Zarządzaj artykułami",          color:"linear-gradient(135deg,#071b3b,#0d2d5e)", accent:"#60a5fa" },
    { key:"petitions",     icon:<Megaphone size={22}/>,  label:"Petycje",         desc:"Zarządzaj petycjami",           color:"linear-gradient(135deg,#2a1200,#4a2000)", accent:"#f59e0b", badge: manualPetitions.filter(p=>p.signature_count>=p.notification_threshold).length||undefined },
    { key:"videos",        icon:<Video size={22}/>,      label:"Wideo",           desc:"Filmy YouTube",                 color:"linear-gradient(135deg,#1a0505,#3b0a0a)", accent:"#f87171" },
    { key:"push-stats",    icon:<TrendingUp size={22}/>, label:"Statystyki push",  desc:"Historia i aktywne subskrypcje", color:"linear-gradient(135deg,#042828,#085050)", accent:"#34d399" },
  ];
  const dashTiles = allDashTiles.filter(t => {
    if (t.superadminOnly) return myRole === "superadmin";
    if (permLoading) return true; // optimistic: show all while loading
    return canAccess(t.key as string);
  });

  return (
    <AppShell>

      <div className="max-w-lg md:max-w-3xl mx-auto animate-fade-in">

        {/* ── DASHBOARD ── */}
        {section===null && (<>
          <div className="px-4 pt-4 pb-4">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-0.5">Salve Maria</p>
            <div className="flex items-center gap-2">
              <h1 className="text-white text-2xl font-bold" style={{fontFamily:"Georgia,serif"}}>Panel admina</h1>
              {myRole==="superadmin" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 font-semibold">superadmin</span>}
            </div>
          </div>
          <div className="px-4 pb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            {dashTiles.map(t=>(
              <button key={t.key} onClick={()=>setSection(t.key)}
                className="relative rounded-2xl p-4 flex flex-col gap-3 text-left transition-all hover:brightness-110 active:scale-[0.97]"
                style={{background:t.color, border:`1px solid ${t.accent}22`}}>
                {t.badge!==undefined && (
                  <span className="absolute top-2.5 right-2.5 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{background:t.accent,color:"#000"}}>
                    {t.badge}
                  </span>
                )}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{background:`${t.accent}18`,border:`1px solid ${t.accent}33`,color:t.accent}}>
                  {t.icon}
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight" style={{fontFamily:"Georgia,serif"}}>{t.label}</p>
                  <p className="text-[11px] mt-0.5 opacity-55" style={{color:"#fff"}}>{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>)}

        {/* ── NOTIFICATIONS ── */}
        {section==="notifications" && (<>
          <SectionHeader title="Powiadomienia" subtitle="Push i zaplanowane" onBack={()=>setSection(null)}/>
          <div className="flex gap-2 px-4 pb-4">
            {(["instant","scheduled"] as const).map(t=>(
              <button key={t} onClick={()=>setNotifSubtab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${notifSubtab===t?"text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}
                style={notifSubtab===t?{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}:{}}>
                {t==="instant"?<><Send size={12}/>Wyślij teraz</>:<><Clock size={12}/>Zaplanowane ({scheduled.length})</>}
              </button>
            ))}
          </div>
          <div className="px-4 pb-8 space-y-4">
            {notifSubtab==="instant" && (<>
              {notifResult && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 size={20} className="text-green-400 flex-shrink-0"/>
                  <div><p className="text-green-400 font-semibold">Wysłano!</p>
                    <p className="text-green-300 text-xs mt-0.5">Dostarczono do {notifResult.sent} urządzeń{notifResult.failed>0&&` · ${notifResult.failed} błędów`}</p>
                  </div>
                </div>
              )}
              {notifError && <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">{notifError}</div>}
              <form onSubmit={handleSendNotif} className="space-y-4">
                <div>
                  <p className={labelCls}>Typ powiadomienia</p>
                  <div className="grid grid-cols-3 gap-2">
                    {typeOptions.map(({key,icon,label,color})=>(
                      <button key={key} type="button" onClick={()=>{
                        setNotif(p=>({...p,type:key,url:""}));
                        setSelectedArticleSlug("");
                        setSelectedPetitionSlug("");
                      }}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all border ${notif.type===key?"border-red-700 bg-red-800/30 text-white":"border-slate-700 bg-slate-800 text-slate-400"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wybór artykułu */}
                {notif.type==="article" && (
                  <div>
                    <label className={labelCls}>Wybierz artykuł *</label>
                    {articlesList.length===0
                      ? <p className="text-slate-500 text-sm py-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/>Ładowanie artykułów…</p>
                      : <select className={inputCls} value={selectedArticleSlug}
                          onChange={e=>{
                            const slug=e.target.value;
                            const art=articlesList.find(a=>a.slug===slug);
                            setSelectedArticleSlug(slug);
                            setNotif(p=>({
                              ...p,
                              url: slug ? `/articles/${slug}` : "",
                              title: p.title||art?.title||"",
                              body: p.body||"Przeczytaj nasz najnowszy artykuł."
                            }));
                          }}
                          required>
                          <option value="">— wybierz artykuł —</option>
                          {articlesList.map(a=>(
                            <option key={a.slug} value={a.slug}>{a.title}</option>
                          ))}
                        </select>
                    }
                    {selectedArticleSlug && (
                      <p className="text-teal-500 text-xs mt-1 font-mono">/articles/{selectedArticleSlug}</p>
                    )}
                  </div>
                )}

                {/* Wybór petycji */}
                {notif.type==="petition" && (
                  <div>
                    <label className={labelCls}>Wybierz petycję *</label>
                    {petitionsList.length===0
                      ? <p className="text-slate-500 text-sm py-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin"/>Ładowanie petycji…</p>
                      : <select className={inputCls} value={selectedPetitionSlug}
                          onChange={e=>{
                            const slug=e.target.value;
                            const pet=petitionsList.find(p=>p.slug===slug);
                            setSelectedPetitionSlug(slug);
                            setNotif(p=>({
                              ...p,
                              url: slug ? `/petitions/${slug}` : "",
                              title: p.title||pet?.title||"",
                              body: p.body||"Podpisz petycję i weź udział w akcji."
                            }));
                          }}
                          required>
                          <option value="">— wybierz petycję —</option>
                          {petitionsList.map(p=>(
                            <option key={p.slug} value={p.slug}>{p.title}</option>
                          ))}
                        </select>
                    }
                    {selectedPetitionSlug && (
                      <p className="text-pink-500 text-xs mt-1 font-mono">/petitions/{selectedPetitionSlug}</p>
                    )}
                  </div>
                )}

                <div className={`${CARD} p-4 space-y-3`}>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Users size={15}/>
                    <span>Odbiorcy:</span>
                    <span className="text-white font-medium">{pushCityFilter && pushSelectedCities.length > 0 ? `Wybrane miejscowości (${pushSelectedCities.length})` : "Wszyscy użytkownicy"}</span>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={pushCityFilter} onChange={e=>{ setPushCityFilter(e.target.checked); if(!e.target.checked) setPushSelectedCities([]); }}
                      className="rounded border-slate-600 bg-slate-700 text-red-600"/>
                    <MapPin size={13}/> Wyślij do wybranych miejscowości
                  </label>
                  {pushCityFilter && (
                    <div>
                      {pushCities.length === 0
                        ? <p className="text-slate-500 text-xs">Ładowanie miejscowości…</p>
                        : <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                            {pushCities.map(city=>(
                              <button key={city} type="button"
                                onClick={()=>setPushSelectedCities(prev=>prev.includes(city)?prev.filter(c=>c!==city):[...prev,city])}
                                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${pushSelectedCities.includes(city)?"bg-red-700 border-red-600 text-white":"bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500"}`}>
                                {city}
                              </button>
                            ))}
                          </div>
                      }
                    </div>
                  )}
                </div>
                <div><label className={labelCls}>Tytuł *</label>
                  <input className={inputCls} value={notif.title} onChange={e=>setNotif(p=>({...p,title:e.target.value}))} required maxLength={80} placeholder="Tytuł powiadomienia…"/>
                </div>
                <div><label className={labelCls}>Treść *</label>
                  <textarea className={inputCls} value={notif.body} onChange={e=>setNotif(p=>({...p,body:e.target.value}))} required maxLength={200} rows={3} placeholder="Treść wiadomości…"/>
                  <p className="text-slate-500 text-xs mt-1 text-right">{notif.body.length}/200</p>
                </div>

                {/* Pole URL — tylko dla typów bez listy rozwijalnej */}
                {notif.type!=="article" && notif.type!=="petition" && (
                  <div><label className={labelCls}>Link (opcjonalnie)</label>
                    <input className={inputCls+" font-mono"} value={notif.url} onChange={e=>setNotif(p=>({...p,url:e.target.value}))} placeholder="/articles/123"/>
                  </div>
                )}

                <button type="submit"
                  disabled={notifSending||!notif.title||!notif.body||(notif.type==="article"&&!selectedArticleSlug)||(notif.type==="petition"&&!selectedPetitionSlug)}
                  className={`w-full ${BTN_PRIMARY} py-3 rounded-2xl`} style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
                  {notifSending?<Loader2 size={18} className="animate-spin"/>:<Send size={18}/>}
                  {notifSending?"Wysyłanie…":"Wyślij powiadomienie"}
                </button>
              </form>
            </>)}

            {notifSubtab==="scheduled" && (<>
              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-sm">{scheduled.length} zaplanowanych</p>
                {!addingScheduled && (
                  <button onClick={()=>setAddingScheduled(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white`}
                    style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
                    <Plus size={15}/> Dodaj
                  </button>
                )}
              </div>
              {addingScheduled && <ScheduledForm onSave={handleSaveScheduled} onCancel={()=>setAddingScheduled(false)} saving={scheduledSaving}/>}
              {scheduledLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
              <div className="space-y-3">
                {scheduled.map(n=>(
                  <div key={n.id} className={`${CARD} p-4 ${n.active?"border-amber-700/30":""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold text-sm truncate">{n.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${n.active?"bg-green-800/40 text-green-400":"bg-slate-700 text-slate-500"}`}>
                            {n.active?"aktywne":"wyłączone"}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2">{n.body}</p>
                        <div className="flex items-center gap-2 mt-2 text-slate-500 text-xs">
                          {n.cron_time?(<><Clock size={11}/><span>{n.cron_time}</span><span>·</span><span>{n.cron_days?.map(d=>DAY_NAMES[d]).join(", ")??"codziennie"}</span></>)
                            :n.send_at?(<><Calendar size={11}/><span>{new Date(n.send_at).toLocaleString("pl-PL")}</span></>):null}
                          {n.last_sent_at&&<><span>·</span><span className="text-green-600">ostatnio: {new Date(n.last_sent_at).toLocaleString("pl-PL")}</span></>}
                          {scheduledSendResult[n.id]&&<><span>·</span><span className="text-green-400 font-medium">✓ {scheduledSendResult[n.id].sent} urządzeń</span></>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={()=>handleSendScheduledNow(n.id)} disabled={sendingScheduledId===n.id} title="Wyślij teraz"
                          className="text-slate-500 hover:text-green-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
                          {sendingScheduledId===n.id?<Loader2 size={14} className="animate-spin"/>:<Play size={14}/>}
                        </button>
                        <button onClick={()=>handleDeleteScheduled(n.id)} className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-700 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {!scheduledLoading&&scheduled.length===0&&<p className="text-slate-500 text-sm text-center py-8">Brak zaplanowanych powiadomień.</p>}
              </div>
            </>)}
          </div>
        </>)}

        {/* ── MESSAGES ── */}
        {section==="messages" && (<>
          <SectionHeader title="Wiadomości" subtitle={`${messages.length} wiadomości${unreadCount>0?` · ${unreadCount} nieprzeczytanych`:""}`} onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-2">
            {messagesLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
            {messages.map(m=>(
              <div key={m.id} className={`${CARD} overflow-hidden ${!m.read?"border-amber-700/50":""}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0 cursor-pointer"
                    onClick={()=>{setExpandedMsg(expandedMsg===m.id?null:m.id);if(!m.read)handleMarkRead(m.id);}}>
                    <div className="flex items-center gap-2">
                      {!m.read&&<span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"/>}
                      <p className="text-white font-semibold text-sm truncate">{m.name}</p>
                      <span className="text-slate-500 text-xs flex-shrink-0">{new Date(m.created_at).toLocaleDateString("pl-PL")}</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">{m.topic} · {m.email}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={()=>handleDeleteMessage(m.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors" title="Usuń wiadomość">
                      <Trash2 size={13}/>
                    </button>
                    <button onClick={()=>{setExpandedMsg(expandedMsg===m.id?null:m.id);if(!m.read)handleMarkRead(m.id);}}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                      {expandedMsg===m.id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                    </button>
                  </div>
                </div>
                {expandedMsg===m.id&&(
                  <div className="px-4 pb-4 text-slate-300 text-sm border-t border-slate-700 pt-3 leading-relaxed whitespace-pre-wrap">
                    {m.message}
                    <div className="mt-3">
                      <a href={`mailto:${m.email}?subject=Re: ${m.topic}`}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                        <Mail size={12}/> Odpowiedz na {m.email}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!messagesLoading&&messages.length===0&&<p className="text-slate-500 text-sm text-center py-8">Brak wiadomości.</p>}
          </div>
        </>)}

        {/* ── USERS ── */}
        {section==="users" && (<>
          <SectionHeader title="Użytkownicy" subtitle={`${users.length} zarejestrowanych kont`} onBack={()=>setSection(null)}/>
          <div className="px-4 pb-2 flex justify-end">
            {!addingUser && !editingUser && (
              <button onClick={()=>setAddingUser(true)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white`}
                style={{background:"linear-gradient(135deg,#14532d,#166534)"}}>
                <UserPlus size={15}/> Dodaj użytkownika
              </button>
            )}
          </div>
          <div className="px-4 pb-8 space-y-2 mt-2">
            {usersLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
            {addingUser && (
              <AddUserForm onSave={handleAddUser} onCancel={()=>{setAddingUser(false);setAddUserError("");}} saving={addUserSaving} saveError={addUserError}/>
            )}
            {users.map(u=>(
              <div key={u.id}>
                {editingUser?.id===u.id ? (
                  <UserEditForm user={u} onSave={handleSaveUser} onCancel={()=>{setEditingUser(null);setUserSaveError("");}} saving={userSaving} saveError={userSaveError}/>
                ) : (
                  <div className={`${CARD} p-4`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold text-sm">
                            {u.first_name||u.last_name?`${u.first_name??""} ${u.last_name??""}`.trim():"—"}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${u.role==="admin"?"bg-red-900/40 text-red-400":"bg-slate-700/80 text-slate-400"}`}>
                            {u.role}
                          </span>
                          {u.profile_complete&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-900/30 text-green-400">✓ profil</span>}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5 truncate">{u.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-slate-500 text-xs flex-wrap">
                          {u.phone&&<span>{u.phone}</span>}
                          {u.city&&<span>{u.city}</span>}
                          <span>rejestracja: {new Date(u.created_at).toLocaleDateString("pl-PL")}</span>
                        </div>
                        <div className="mt-0.5 text-xs">
                          {u.last_sign_in_at ? (
                            <span className="text-slate-500">
                              ostatnie logowanie:{" "}
                              <span className="text-slate-400">
                                {new Date(u.last_sign_in_at).toLocaleDateString("pl-PL")}{" "}
                                {new Date(u.last_sign_in_at).toLocaleTimeString("pl-PL", {hour:"2-digit",minute:"2-digit"})}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-600">nie logował się</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={()=>setEditingUser(u)} title="Edytuj" className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors"><Pencil size={13}/></button>
                        <button onClick={async()=>{if(!confirm(`Wysłać link resetowania hasła do ${u.email}?`))return;await fetch("/api/admin/users/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:u.email})});}}
                          title="Resetuj hasło" className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-700 transition-colors"><Lock size={13}/></button>
                        <button onClick={async()=>{
                          if(!confirm(`Trwale usunąć konto ${u.email}? Tej operacji nie można cofnąć.`))return;
                          const res=await fetch(`/api/admin/users/${u.id}`,{method:"DELETE"});
                          if(res.ok)setUsers(prev=>prev.filter(x=>x.id!==u.id));
                        }} title="Usuń konto" className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!usersLoading&&users.length===0&&<p className="text-slate-500 text-sm text-center py-8">Brak użytkowników.</p>}
          </div>
        </>)}

        {/* ── PRAYERS ── */}
        {section==="prayers" && (<>
          <SectionHeader title="Modlitwy" subtitle={`${prayers.length} modlitw w katalogu`} onBack={()=>setSection(null)}/>
          <div className="px-4 pb-2 flex justify-end">
            {!addingPrayer&&!editingPrayer&&(
              <button onClick={()=>setAddingPrayer(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
                <Plus size={15}/> Dodaj modlitwę
              </button>
            )}
          </div>
          <div className="px-4 pb-8 space-y-2 mt-2">
            {addingPrayer && <PrayerForm onSave={handleSavePrayer} onCancel={()=>setAddingPrayer(false)} saving={prayerSaving}/>}
            {prayersLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
            {prayers.map(p=>(
              <div key={p.id}>
                {editingPrayer?.id===p.id?(
                  <PrayerForm initial={p} onSave={handleSavePrayer} onCancel={()=>setEditingPrayer(null)} saving={prayerSaving}/>
                ):(
                  <div className={CARD+" overflow-hidden"}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button className="flex-1 text-left min-w-0" onClick={()=>setExpandedPrayer(expandedPrayer===p.id?null:p.id)}>
                        <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{p.category} · {p.language==="la"?"łaciński":"polski"}</p>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={()=>setExpandedPrayer(expandedPrayer===p.id?null:p.id)} className="text-slate-500 p-1.5 rounded-lg hover:bg-slate-700 transition-colors">
                          {expandedPrayer===p.id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                        </button>
                        <button onClick={()=>{setEditingPrayer(p);setAddingPrayer(false);}} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-amber-400 transition-colors"><Pencil size={14}/></button>
                        <button onClick={()=>handleDeletePrayer(p.id)} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    {expandedPrayer===p.id&&(
                      <div className="px-4 pb-4 text-slate-300 text-sm whitespace-pre-line border-t border-slate-700 pt-3 leading-relaxed">{p.content}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>)}

        {/* ── TILES ── */}
        {section==="tiles" && (<>
          <SectionHeader title="Strona główna — START" subtitle="Kafelki, kolejność, kolory, sekcje" onBack={()=>{setSection(null);setExpandedTile(null);setTilesTab("tiles");}}/>
          <div className="px-4 pb-8 space-y-3">
            {tilesSaved && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 size={15}/> Zapisano.
              </div>
            )}

            {/* Sub-tabs */}
            <div className="flex bg-slate-800/80 rounded-xl p-1 gap-1">
              {(["tiles","sections"] as const).map(tab=>(
                <button key={tab} onClick={()=>{setTilesTab(tab);setExpandedTile(null);setTileEdits({});}}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tilesTab===tab?"bg-purple-900/70 text-purple-200":"text-slate-400 hover:text-slate-200"}`}>
                  {tab==="tiles"?"Kafelki":"Sekcje artykułów"}
                </button>
              ))}
            </div>

            {tilesLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}

            {/* ── TAB: Kafelki ── */}
            {tilesTab==="tiles" && !tilesLoading && (
              <div className="space-y-2">
                {[...TILE_MODS].sort((a,b)=>(tilesConfig[a.mod]?.order??99)-(tilesConfig[b.mod]?.order??99)).map(({mod,defaultLabel,defaultSublabel},idx,arr)=>{
                  const ov=tilesConfig[mod]??{};
                  const hidden=ov.hidden??false;
                  const pal=ov.colorPreset?COLOR_PALETTES.find(p=>p.id===ov.colorPreset):null;
                  const isExpanded=expandedTile===mod;
                  const editPal=tileEdits.colorPreset?COLOR_PALETTES.find(p=>p.id===tileEdits.colorPreset):null;
                  const hasCustom=!!(ov.label||ov.sublabel||ov.colorPreset);
                  return (
                    <div key={mod} className={`${CARD} overflow-hidden transition-opacity ${hidden?"opacity-40":""}`}>
                      {/* Row */}
                      <div className="p-3 flex items-center gap-3">
                        {/* Color swatch */}
                        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{background:pal?.darkColor??"#1e293b",border:`1px solid ${pal?.accent??"#334155"}55`}}>
                          {pal
                            ? <span className="block w-3.5 h-3.5 rounded-full" style={{background:pal.accent}}/>
                            : <Home size={14} className="text-slate-600"/>}
                        </div>
                        {/* Labels — click to expand */}
                        <div className="flex-1 min-w-0 cursor-pointer select-none" onClick={()=>toggleExpandTile(mod)}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-white text-sm font-semibold">{ov.label||defaultLabel}</p>
                            {ov.order!==undefined&&<span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded-full">#{ov.order}</span>}
                            {pal&&<span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{background:`${pal.accent}20`,color:pal.accent}}>{pal.label}</span>}
                            {hidden&&<span className="text-[10px] bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">ukryty</span>}
                          </div>
                          <p className="text-slate-500 text-xs truncate">{ov.sublabel||defaultSublabel} <span className="text-slate-700 font-mono text-[10px]">[{mod}]</span></p>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button disabled={idx===0} onClick={()=>handleMoveTile(mod,"up")} title="Wyżej"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-colors"><ChevronUp size={14}/></button>
                          <button disabled={idx===arr.length-1} onClick={()=>handleMoveTile(mod,"down")} title="Niżej"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-colors"><ChevronDown size={14}/></button>
                          <button onClick={()=>handleToggleTileVisibility(mod)} title={hidden?"Pokaż":"Ukryj"}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors">
                            {hidden?<EyeOff size={14} className="text-slate-600"/>:<Eye size={14}/>}
                          </button>
                          <button onClick={()=>toggleExpandTile(mod)} title="Edytuj"
                            className={`p-1.5 rounded-lg transition-colors ${isExpanded?"text-amber-400 bg-amber-400/10":"text-slate-400 hover:text-amber-400 hover:bg-slate-700"}`}>
                            <Pencil size={14}/>
                          </button>
                        </div>
                      </div>

                      {/* Inline edit panel */}
                      {isExpanded && (
                        <div className="border-t border-slate-700/60 p-4 space-y-4 bg-slate-900/50">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Etykieta</label>
                              <input className={inputCls} value={tileEdits.label??""} onChange={e=>setTileEdits(p=>({...p,label:e.target.value}))} placeholder={defaultLabel}/>
                            </div>
                            <div>
                              <label className={labelCls}>Pod-etykieta</label>
                              <input className={inputCls} value={tileEdits.sublabel??""} onChange={e=>setTileEdits(p=>({...p,sublabel:e.target.value}))} placeholder={defaultSublabel}/>
                            </div>
                          </div>

                          <div>
                            <label className={labelCls}>Kolor ikony</label>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              <button onClick={()=>setTileEdits(p=>({...p,colorPreset:undefined}))}
                                className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${!tileEdits.colorPreset?"border-amber-400 scale-110":"border-slate-600 hover:border-slate-400"}`}
                                style={{background:"#1e293b"}} title="Domyślny">
                                <span className="text-slate-500 text-[9px]">def</span>
                              </button>
                              {COLOR_PALETTES.map(p=>(
                                <button key={p.id} onClick={()=>setTileEdits(prev=>({...prev,colorPreset:p.id}))} title={p.label}
                                  className={`w-8 h-8 rounded-lg border-2 transition-all ${tileEdits.colorPreset===p.id?"border-white scale-110":"border-transparent hover:border-slate-400"}`}
                                  style={{background:p.darkColor}}>
                                  <span className="block w-3 h-3 rounded-full mx-auto" style={{background:p.accent}}/>
                                </button>
                              ))}
                            </div>
                            {tileEdits.colorPreset&&<p className="text-xs text-slate-500 mt-1.5">{COLOR_PALETTES.find(p=>p.id===tileEdits.colorPreset)?.label}</p>}
                          </div>

                          {/* Podgląd */}
                          <div className="rounded-xl p-3 flex items-center gap-3" style={{background:"rgba(15,23,42,0.8)",border:"1px solid #1e293b"}}>
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider flex-shrink-0">Podgląd</span>
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={editPal?{background:`${editPal.accent}12`,border:`1px solid ${editPal.accent}25`}:{background:"#1e293b",border:"1px solid #334155"}}>
                              {editPal?<span className="block w-3 h-3 rounded-full" style={{background:editPal.accent}}/>:<Home size={14} className="text-slate-600"/>}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-white truncate">{tileEdits.label||defaultLabel}</span>
                              <span className="block text-[10px] text-slate-500 truncate">{tileEdits.sublabel||defaultSublabel}</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={()=>handleSaveTileInline(mod)} disabled={tilesSaving}
                              className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#4a1942,#7e1d6e)"}}>
                              {tilesSaving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz
                            </button>
                            <button onClick={()=>{setExpandedTile(null);setTileEdits({});}}
                              className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm transition-colors">
                              Anuluj
                            </button>
                            {hasCustom&&(
                              <button onClick={()=>handleResetTile(mod)} title="Przywróć domyślne"
                                className="px-3 py-2.5 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                                <Trash2 size={14}/>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TAB: Sekcje ── */}
            {tilesTab==="sections" && !tilesLoading && (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed">
                  Kontroluj widoczność i treść sekcji wyświetlanych nad kafelkami na stronie START.
                </p>
                {([
                  {key:"articles" as const, label:"Sekcja Artykułów / Publikacji", defaultTitle:"Publikacje", defaultCount:4, icon:<Newspaper size={16}/>},
                  {key:"petitions" as const, label:"Sekcja Petycji", defaultTitle:"Podejmij działanie", defaultCount:3, icon:<Megaphone size={16}/>},
                ] as const).map(({key,label,defaultTitle,defaultCount,icon})=>{
                  const cfg=pageConfig[key]??{};
                  const isVisible=cfg.show!==false;
                  return (
                    <div key={key} className={`${CARD} p-4 space-y-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-slate-400">{icon}</span>
                          <p className="text-white font-semibold text-sm">{label}</p>
                        </div>
                        <button
                          onClick={()=>setPageConfig(p=>({...p,[key]:{...cfg,show:!isVisible}}))}
                          className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isVisible?"bg-purple-700":"bg-slate-700"}`}>
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isVisible?"left-6":"left-0.5"}`}/>
                        </button>
                      </div>
                      <div className={`space-y-3 transition-opacity ${!isVisible?"opacity-30 pointer-events-none":""}`}>
                        <div>
                          <label className={labelCls}>Tytuł sekcji</label>
                          <input className={inputCls} value={cfg.title??""} onChange={e=>setPageConfig(p=>({...p,[key]:{...cfg,title:e.target.value}}))} placeholder={defaultTitle}/>
                        </div>
                        <div>
                          <label className={labelCls}>Liczba wyświetlanych elementów</label>
                          <input className={inputCls} type="number" min={1} max={10} value={cfg.count??""} onChange={e=>setPageConfig(p=>({...p,[key]:{...cfg,count:e.target.value?Number(e.target.value):undefined}}))} placeholder={String(defaultCount)}/>
                          <p className="text-slate-600 text-xs mt-1">Domyślnie: {defaultCount}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button onClick={handleSavePageConfig} disabled={pageConfigSaving}
                  className={`w-full ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#4a1942,#7e1d6e)"}}>
                  {pageConfigSaving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz konfigurację sekcji
                </button>
              </div>
            )}
          </div>
        </>)}

        {/* ── MODULES ── */}
        {section==="modules" && (<>
          <SectionHeader title="Moduły" subtitle="Ikony, nazwy, widoczność, nawigacja" onBack={()=>{setSection(null);setExpandedMod(null);setModEdits({});setModulesTab("list");}}/>
          <div className="px-4 pb-8 space-y-3">
            {tilesSaved && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 size={15}/> Zapisano.
              </div>
            )}

            {/* Sub-tabs */}
            <div className="flex bg-slate-800/80 rounded-xl p-1 gap-1">
              {(["list","nav"] as const).map(tab=>(
                <button key={tab} onClick={()=>{setModulesTab(tab);setExpandedMod(null);setModEdits({});}}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${modulesTab===tab?"bg-sky-900/70 text-sky-200":"text-slate-400 hover:text-slate-200"}`}>
                  {tab==="list"?"Moduły":"Dolna nawigacja"}
                </button>
              ))}
            </div>

            {tilesLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}

            {/* TAB: Lista modułów */}
            {modulesTab==="list" && !tilesLoading && (
              <div className="space-y-2">
                {TILE_MODS.map(({mod, defaultLabel, defaultSublabel, defaultIcon})=>{
                  const ov = tilesConfig[mod] ?? {};
                  const enabled = !ov.hidden;
                  const currentIcon = (ov.icon || defaultIcon) as IconName;
                  const isExpanded = expandedMod === mod;
                  return (
                    <div key={mod} className={`${CARD} overflow-hidden transition-opacity ${!enabled?"opacity-50":""}`}>
                      <div className="p-3 flex items-center gap-3">
                        {/* Icon preview */}
                        <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/40 flex items-center justify-center flex-shrink-0 text-sky-400">
                          <Icon name={currentIcon} size={18}/>
                        </div>
                        {/* Labels */}
                        <div className="flex-1 min-w-0 cursor-pointer select-none" onClick={()=>{
                          if(isExpanded){setExpandedMod(null);setModEdits({});}
                          else{setExpandedMod(mod);setModEdits({label:ov.label,sublabel:ov.sublabel,icon:ov.icon});}
                        }}>
                          <p className="text-white text-sm font-semibold">{ov.label||defaultLabel}</p>
                          <p className="text-slate-500 text-xs truncate">{ov.sublabel||defaultSublabel} <span className="text-slate-700 font-mono text-[10px]">[{mod}]</span></p>
                        </div>
                        {/* Toggle enabled + edit */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={()=>handleToggleModuleEnabled(mod)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${enabled?"bg-sky-600":"bg-slate-700"}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled?"left-5":"left-0.5"}`}/>
                          </button>
                          <button onClick={()=>{
                            if(isExpanded){setExpandedMod(null);setModEdits({});}
                            else{setExpandedMod(mod);setModEdits({label:ov.label,sublabel:ov.sublabel,icon:ov.icon});}
                          }} className={`p-1.5 rounded-lg transition-colors ${isExpanded?"text-amber-400 bg-amber-400/10":"text-slate-400 hover:text-amber-400 hover:bg-slate-700"}`}>
                            <Pencil size={14}/>
                          </button>
                        </div>
                      </div>

                      {/* Expanded edit */}
                      {isExpanded && (
                        <div className="border-t border-slate-700/60 p-4 space-y-4 bg-slate-900/50">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Nazwa</label>
                              <input className={inputCls} value={modEdits.label??""} onChange={e=>setModEdits(p=>({...p,label:e.target.value}))} placeholder={defaultLabel}/>
                            </div>
                            <div>
                              <label className={labelCls}>Opis</label>
                              <input className={inputCls} value={modEdits.sublabel??""} onChange={e=>setModEdits(p=>({...p,sublabel:e.target.value}))} placeholder={defaultSublabel}/>
                            </div>
                          </div>

                          {/* Icon picker */}
                          <div>
                            <label className={labelCls}>Ikona</label>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {MODULE_ICONS.map(iconName=>(
                                <button key={iconName} onClick={()=>setModEdits(p=>({...p,icon:iconName}))} title={iconName}
                                  className={`w-9 h-9 rounded-lg border transition-all flex items-center justify-center ${(modEdits.icon||ov.icon||defaultIcon)===iconName?"border-sky-400 bg-sky-400/15 text-sky-300":"border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white"}`}>
                                  <Icon name={iconName} size={16}/>
                                </button>
                              ))}
                            </div>
                            {modEdits.icon && <p className="text-xs text-slate-500 mt-1.5 font-mono">{modEdits.icon}</p>}
                          </div>

                          {/* Preview */}
                          <div className="rounded-xl p-3 flex items-center gap-3 bg-slate-950/60 border border-slate-800">
                            <span className="text-[10px] text-slate-600 uppercase tracking-wider flex-shrink-0">Podgląd</span>
                            <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-400/10 border border-sky-400/20 text-sky-300">
                              <Icon name={(modEdits.icon||ov.icon||defaultIcon) as IconName} size={18}/>
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold text-white truncate">{modEdits.label||ov.label||defaultLabel}</span>
                              <span className="block text-[10px] text-slate-500 truncate">{modEdits.sublabel||ov.sublabel||defaultSublabel}</span>
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={()=>handleSaveModInline(mod)} disabled={tilesSaving}
                              className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#0a2e4a,#0f4a7e)"}}>
                              {tilesSaving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz
                            </button>
                            <button onClick={()=>{setExpandedMod(null);setModEdits({});}}
                              className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm transition-colors">
                              Anuluj
                            </button>
                            {(ov.label||ov.sublabel||ov.icon) && (
                              <button onClick={()=>{
                                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                const {label:_l,sublabel:_s,icon:_i,...rest}=tilesConfig[mod]??{};
                                const next={...tilesConfig,[mod]:rest};
                                setTilesConfig(next);
                                fetch("/api/admin/tiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});
                                try{localStorage.setItem("salve_tiles_config",JSON.stringify(next));}catch{}
                                setExpandedMod(null);setModEdits({});
                              }} title="Przywróć domyślne" className="px-3 py-2.5 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                                <Trash2 size={14}/>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB: Dolna nawigacja */}
            {modulesTab==="nav" && !tilesLoading && (
              <div className="space-y-4">
                <p className="text-slate-400 text-xs leading-relaxed">
                  Wybierz max. 5 modułów wyświetlanych w dolnym menu. Pozycja <span className="text-white">START</span> (strona główna) jest zawsze widoczna i stała.
                </p>

                {/* Active nav items */}
                <div className={`${CARD} divide-y divide-slate-700/50`}>
                  {/* Fixed home */}
                  <div className="p-3 flex items-center gap-3 opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <Icon name="home" size={16}/>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">START</p>
                      <p className="text-slate-500 text-[11px]">Zawsze pierwsza pozycja</p>
                    </div>
                    <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">stała</span>
                  </div>

                  {/* Configured nav items */}
                  {getNavItems().length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-sm">Brak skonfigurowanych pozycji — używane są wartości domyślne</div>
                  )}
                  {getNavItems().map((mod, idx, arr)=>{
                    const defMod = TILE_MODS.find(t=>t.mod===mod);
                    if (!defMod) return null;
                    const ov = tilesConfig[mod] ?? {};
                    const icon = ((ov as TileOverride).icon || defMod.defaultIcon) as IconName;
                    const label = (ov as TileOverride).label || defMod.defaultLabel;
                    return (
                      <div key={mod} className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-sky-400 flex-shrink-0">
                          <Icon name={icon} size={16}/>
                        </div>
                        <p className="flex-1 text-white text-sm font-semibold">{label}</p>
                        <div className="flex items-center gap-0.5">
                          <button disabled={idx===0} onClick={()=>handleMoveNavItem(mod,"up")}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-colors"><ChevronUp size={14}/></button>
                          <button disabled={idx===arr.length-1} onClick={()=>handleMoveNavItem(mod,"down")}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 transition-colors"><ChevronDown size={14}/></button>
                          <button onClick={()=>handleRemoveFromNav(mod)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors ml-1"><X size={14}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Available modules to add */}
                {getNavItems().length < 5 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Dodaj do nawigacji ({5 - getNavItems().length} wolnych miejsc)</p>
                    <div className="flex flex-wrap gap-2">
                      {TILE_MODS.filter(({mod})=>
                        !getNavItems().includes(mod) && !tilesConfig[mod]?.hidden
                      ).map(({mod, defaultLabel, defaultIcon})=>{
                        const ov = tilesConfig[mod] ?? {};
                        const icon = ((ov as TileOverride).icon || defaultIcon) as IconName;
                        const label = (ov as TileOverride).label || defaultLabel;
                        return (
                          <button key={mod} onClick={()=>handleAddToNav(mod)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 transition-all text-sm text-slate-300 hover:text-white">
                            <Icon name={icon as IconName} size={14} className="text-sky-400"/>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {getNavItems().length >= 5 && (
                  <p className="text-center text-slate-500 text-xs py-2">Osiągnięto limit 5 pozycji nawigacji</p>
                )}

                {/* Reset to defaults */}
                {getNavItems().length > 0 && (
                  <button onClick={()=>{
                    const next={...tilesConfig,_nav:{items:[]}};
                    setTilesConfig(next as TilesConfig);
                    fetch("/api/admin/tiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(next)});
                    try{localStorage.setItem("salve_tiles_config",JSON.stringify(next));}catch{}
                  }} className="w-full py-2.5 rounded-xl text-slate-500 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-sm transition-colors">
                    Przywróć domyślną nawigację
                  </button>
                )}
              </div>
            )}
          </div>
        </>)}

        {/* ── REFERRAL ── */}
        {section==="referral" && (<>
          <SectionHeader title="Polecanie" subtitle="Treść maila polecającego aplikację" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-4">
            {shareSaved && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 size={15}/> Zapisano.
              </div>
            )}
            {shareLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="text-green-400 animate-spin"/></div>
            ) : (<>
              <div>
                <label className={labelCls}>Temat wiadomości</label>
                <input
                  className={inputCls}
                  value={shareSubject}
                  onChange={e => setShareSubject(e.target.value)}
                  placeholder="Polecam aplikację Salve Maria"
                />
              </div>
              <div>
                <label className={labelCls}>Treść wiadomości</label>
                <textarea
                  className={`${inputCls} resize-none leading-relaxed`}
                  rows={14}
                  value={shareBody}
                  onChange={e => setShareBody(e.target.value)}
                  placeholder="Treść maila polecającego…"
                />
                <p className="text-slate-600 text-[11px] mt-1.5">
                  Link do aplikacji wstaw bezpośrednio w treści. Odbiorca wpisze tylko swój adres e-mail.
                </p>
              </div>

              {/* Preview */}
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/50 p-4 space-y-2">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider">Podgląd</p>
                <p className="text-slate-400 text-xs"><span className="text-slate-600">Temat:</span> {shareSubject || "—"}</p>
                <pre className="text-slate-400 text-xs whitespace-pre-wrap leading-relaxed font-sans mt-1 max-h-40 overflow-y-auto">
                  {shareBody || "—"}
                </pre>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveShare}
                  disabled={shareSaving || !shareSubject || !shareBody}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#052a10,#0a4a1e)", color: "#86efac" }}
                >
                  {shareSaving ? <Loader2 size={15} className="animate-spin"/> : <CheckCircle2 size={15}/>}
                  Zapisz
                </button>
                <button
                  onClick={loadShareConfig}
                  disabled={shareLoading}
                  className="px-4 py-3 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                  title="Odśwież"
                >
                  <RefreshCw size={15}/>
                </button>
              </div>
            </>)}
          </div>
        </>)}

        {/* ── BYPASS CODE ── */}
        {section==="bypass" && (<>
          <SectionHeader title="Kod dostępu" subtitle="Twój osobisty kod do panelu na komputerze" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-4">
            {bypassSaved && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 size={15}/> Kod zapisany.
              </div>
            )}
            {bypassLoading ? (
              <div className="flex justify-center py-16"><Loader2 size={24} className="text-yellow-400 animate-spin"/></div>
            ) : (<>
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 space-y-3">
                <p className="text-slate-400 text-sm leading-relaxed">
                  Na ekranie informacyjnym dla komputerów (desktop) wpisanie tego kodu daje dostęp do logowania.
                  Każdy administrator ma swój własny, unikalny kod.
                </p>
                {bypassCode ? (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 border border-yellow-800/40 px-4 py-3">
                    <span className="text-yellow-400 font-mono text-2xl tracking-[0.3em] font-bold">{bypassCode}</span>
                    <span className="text-slate-600 text-xs ml-auto">aktywny</span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-500 text-sm text-center">
                    Brak ustawionego kodu
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>{bypassCode ? "Zmień kod" : "Ustaw nowy kod"} (6 cyfr)</label>
                <div className="flex gap-2">
                  <input
                    className={`${inputCls} font-mono tracking-[0.3em] text-center text-lg`}
                    value={bypassInput}
                    onChange={e => { setBypassInput(e.target.value.replace(/\D/g,"").slice(0,6)); setBypassError(""); }}
                    maxLength={6}
                    inputMode="numeric"
                    placeholder="000000"
                  />
                  <button
                    onClick={handleSaveBypass}
                    disabled={bypassSaving || bypassInput.length !== 6}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#332500,#5c4500)", color: "#fef9c3" }}
                  >
                    {bypassSaving ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle2 size={14}/>}
                    Zapisz
                  </button>
                </div>
                {bypassError && <p className="text-red-400 text-xs mt-1.5">{bypassError}</p>}
              </div>

              {bypassCode && (
                <button
                  onClick={handleDeleteBypass}
                  className="w-full py-2.5 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14}/> Usuń kod
                </button>
              )}
            </>)}
          </div>
        </>)}

        {/* ── SETTINGS ── */}
        {section==="settings" && (<>
          <SectionHeader title="Ustawienia kontaktu" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className={`${CARD} p-4 space-y-4`}>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5"><Mail size={12}/> Kontakt</p>
                <div><label className={labelCls}>Email dla wiadomości z komunikatora</label>
                  <input className={inputCls} type="email" value={appSettings.contact_email??""} onChange={e=>setAppSettings(p=>({...p,contact_email:e.target.value}))} placeholder="kontakt@fundacja.pl"/>
                </div>
                <div><label className={labelCls}>Komunikat po wysłaniu wiadomości</label>
                  <textarea className={inputCls} rows={3} value={appSettings.contact_thanks_msg??""} onChange={e=>setAppSettings(p=>({...p,contact_thanks_msg:e.target.value}))} placeholder="Dziękujemy za wiadomość!"/>
                </div>
                <div><label className={labelCls}>Tematy kontaktu (oddzielone przecinkiem)</label>
                  <input className={inputCls} value={appSettings.contact_topics??""} onChange={e=>setAppSettings(p=>({...p,contact_topics:e.target.value}))} placeholder="Pytanie ogólne,Wsparcie finansowe,Petycje"/>
                  <p className="text-slate-500 text-xs mt-1">np. Pytanie ogólne,Wsparcie finansowe,Petycje</p>
                </div>
              </div>
              {settingsSaved && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={15}/> Ustawienia zapisane.
                </div>
              )}
              <button type="submit" disabled={settingsSaving}
                className={`w-full ${BTN_PRIMARY} py-3 rounded-2xl`} style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
                {settingsSaving?<Loader2 size={17} className="animate-spin"/>:<CheckCircle2 size={17}/>}
                {settingsSaving?"Zapisywanie…":"Zapisz ustawienia"}
              </button>
            </form>
          </div>
        </>)}

        {/* ── STATS ── */}
        {section==="stats" && (<>
          <SectionHeader title="Statystyki" subtitle="Ruch i aktywność w serwisie" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-4">
            {!stats && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
            {stats && (<>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {label:"Użytkownicy",value:stats.users,color:"#60a5fa",bg:"#071b3b"},
                  {label:"Sub. push",  value:stats.push, color:"#4ade80",bg:"#052a10"},
                  {label:"Modlitwy",   value:stats.prayers,color:"#facc15",bg:"#332500"},
                  {label:"Wiadomości", value:stats.messages,color:"#c084fc",bg:"#1a0a2e"},
                ].map(({label,value,color,bg})=>(
                  <div key={label} className="rounded-2xl p-4 text-center" style={{background:bg,border:`1px solid ${color}22`}}>
                    <p className="text-3xl font-bold" style={{color}}>{value}</p>
                    <p className="text-slate-400 text-xs mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {stats.weeklyViews.length>0&&(
                <div className={`${CARD} p-4 space-y-3`}>
                  <p className="text-white font-semibold text-sm">Wyświetlenia (7 dni)</p>
                  <BarChart data={stats.weeklyViews.map(d=>({date:d.date,count:d.total}))} color="#991b1b" label="wyświeć"/>
                </div>
              )}

              {stats.recentUsers.length>0&&(
                <div className={`${CARD} p-4 space-y-3`}>
                  <p className="text-white font-semibold text-sm">Nowi użytkownicy (30 dni)</p>
                  <BarChart data={stats.recentUsers.map(d=>({date:d.date,count:d.count}))} color="#1d4ed8" label="rejestracji"/>
                  <p className="text-slate-500 text-xs text-right">Łącznie: {stats.recentUsers.reduce((a,d)=>a+d.count,0)} nowych</p>
                </div>
              )}

              {stats.topPages.length>0&&(
                <div className={`${CARD} p-4 space-y-3`}>
                  <p className="text-white font-semibold text-sm">Najpopularniejsze strony (30 dni)</p>
                  <div className="space-y-2">
                    {stats.topPages.slice(0,10).map((p,i)=>{
                      const maxTotal=stats.topPages[0].total;
                      const pct=Math.round((p.total/maxTotal)*100);
                      return (
                        <div key={p.path} className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-600 text-xs w-4 flex-shrink-0">{i+1}.</span>
                              <span className="text-slate-300 text-xs font-mono truncate">{p.path}</span>
                            </div>
                            <span className="text-slate-400 text-xs flex-shrink-0">{p.total}</span>
                          </div>
                          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-red-800 rounded-full" style={{width:`${pct}%`}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={`${CARD} p-4 space-y-3`}>
                <h2 className="text-white font-semibold text-sm flex items-center gap-2"><RefreshCw size={14}/> Cache artykułów i petycji</h2>
                <p className="text-slate-400 text-xs">Artykuły i petycje są buforowane przez 1–2 godziny. Kliknij, aby wymusić odświeżenie.</p>
                {cacheMsg&&<p className="text-green-400 text-xs">{cacheMsg}</p>}
                <button onClick={handleCacheRefresh} disabled={cacheRefreshing}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all`}
                  style={{background:"linear-gradient(135deg,#7f1d1d,#991b1b)"}}>
                  {cacheRefreshing?<Loader2 size={15} className="animate-spin"/>:<RefreshCw size={15}/>} Odśwież cache
                </button>
              </div>
            </>)}
          </div>
        </>)}

        {/* ── ERRORS ── */}
        {section==="errors" && (<>
          <SectionHeader title="Błędy produkcyjne" subtitle="Automatyczny monitoring aplikacji" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-4">
            {!stats && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
            {stats && (<>
              <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-red-300 text-xs uppercase tracking-wider">Ostatnie 24 godziny</p>
                  <p className="text-white text-3xl font-bold mt-1">{stats.errors24h}</p>
                </div>
                <AlertTriangle size={32} className={stats.errors24h ? "text-red-400" : "text-green-400"}/>
              </div>

              <div className={`${CARD} p-4 space-y-3`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white font-semibold text-sm">Ostatnie zgłoszenia</p>
                    <p className="text-slate-500 text-xs mt-0.5">Raporty są anonimizowane i przechowywane maksymalnie do 100 zdarzeń.</p>
                  </div>
                  {stats.recentErrors.length>0 && (
                    <button onClick={handleClearErrors} disabled={errorsClearing}
                      className="flex-shrink-0 p-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50" title="Wyczyść rejestr">
                      {errorsClearing?<Loader2 size={15} className="animate-spin"/>:<Trash2 size={15}/>}
                    </button>
                  )}
                </div>
                {stats.recentErrors.length===0 ? (
                  <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-5 text-center">
                    <CheckCircle2 size={22} className="text-green-400 mx-auto"/>
                    <p className="text-green-300 text-sm font-semibold mt-2">Brak zarejestrowanych błędów</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.recentErrors.map((error,index)=>(
                      <div key={`${error.occurredAt}-${index}`} className="rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-red-300 text-xs font-semibold break-words">{error.message}</p>
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 flex-shrink-0">{error.source}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-500">
                          <span className="font-mono">{error.path}</span>
                          <span>{new Date(error.occurredAt).toLocaleString("pl-PL")}</span>
                          {error.digest&&<span className="font-mono">ID: {error.digest}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>)}
          </div>
        </>)}

        {section==="login" && (<>
          <SectionHeader title="Ekran logowania" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-3">
            {[
              {
                key: "magic_link_enabled" as const,
                label: "Magic Link",
                desc: "Logowanie bez hasła — jednorazowy link wysyłany na e-mail",
                enabled: magicLinkEnabled,
                onLabel: "Widoczny na ekranie logowania.",
                offLabel: "Ukryty — użytkownicy logują się tylko hasłem.",
              },
              {
                key: "registration_enabled" as const,
                label: "Rejestracja konta",
                desc: "Pozwól nowym użytkownikom samodzielnie zakładać konta",
                enabled: registrationEnabled,
                onLabel: "Przycisk rejestracji jest widoczny na ekranie logowania.",
                offLabel: "Rejestracja wyłączona — tylko admin może tworzyć konta.",
              },
            ].map(item => (
              <div key={item.key} className={`${CARD} p-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white font-semibold text-sm">{item.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleLoginSetting(item.key, !item.enabled)}
                    disabled={loginSettingsLoading}
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${item.enabled ? "bg-red-700" : "bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${item.enabled ? "left-6" : "left-0.5"}`}/>
                  </button>
                </div>
                <p className="text-slate-500 text-xs mt-3">
                  {item.enabled ? item.onLabel : item.offLabel}
                </p>
              </div>
            ))}
          </div>
        </>)}

        {/* ── CATECHISM ── */}
        {section==="catechism" && (<>
          <SectionHeader title="Katechizm" subtitle="Edycja pytań, odpowiedzi i treści modułu" onBack={()=>setSection(null)}/>
          <div className="flex gap-2 px-4 pb-4">
            {(["qa","config"] as const).map(t=>(
              <button key={t} onClick={()=>setCatTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${catTab===t?"text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}
                style={catTab===t?{background:"linear-gradient(135deg,#1a1000,#3a2800)"}:{}}>
                {t==="qa"?<><BookMarked size={12}/>Pytania i odpowiedzi</>:<><Settings2 size={12}/>Treści strony</>}
              </button>
            ))}
          </div>
          <div className="px-4 pb-8 space-y-3">
            {catLoading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-amber-400"/></div>}

            {/* TAB: Q&A */}
            {catTab==="qa" && !catLoading && (<>
              {/* Wybór rozdziału */}
              <div className={`${CARD} p-4`}>
                <label className={labelCls}>Rozdział</label>
                <select value={catActiveChapter} onChange={e=>setCatActiveChapter(e.target.value)} className={inputCls}>
                  {catChapters.map(ch=>(
                    <option key={ch.id} value={ch.id}>{ch.num}. {ch.title}</option>
                  ))}
                </select>
              </div>
              {/* Szukaj */}
              <div className={`${CARD} p-4`}>
                <label className={labelCls}>Szukaj w pytaniach i odpowiedziach</label>
                <input value={catSearch} onChange={e=>setCatSearch(e.target.value)} className={inputCls} placeholder="Wpisz fragment pytania lub odpowiedzi..."/>
              </div>
              {/* Lista Q&A */}
              {(() => {
                const chapter = catChapters.find(ch=>ch.id===catActiveChapter);
                if (!chapter) return null;
                const searchLow = catSearch.toLowerCase().trim();
                const items = searchLow.length > 1
                  ? chapter.qa.filter(qa => qa.q.toLowerCase().includes(searchLow) || qa.a.toLowerCase().includes(searchLow))
                  : chapter.qa;
                const overrideKeys = Object.keys(catQaOverrides).filter(k=>k.startsWith(chapter.id+"_"));
                return (<>
                  {overrideKeys.length > 0 && !catSearch && (
                    <p className="text-amber-500 text-xs px-1 flex items-center gap-1.5"><Pencil size={11}/> Edytowane w tym rozdziale: {overrideKeys.length}</p>
                  )}
                  {items.map(qa=>{
                    const key = `${chapter.id}_${qa.n}`;
                    const override = catQaOverrides[key];
                    const isEditing = catEditKey===key;
                    const isModified = !!override;
                    return (
                      <div key={key} className={`${CARD} p-4 ${isModified?"border-amber-700/40":""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold text-xs">#{qa.n}</span>
                            {isModified && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800/40">edytowany</span>}
                          </div>
                          <div className="flex gap-1.5">
                            {isModified && !isEditing && (
                              <button onClick={async()=>{
                                await fetch("/api/admin/catechism",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({key})});
                                setCatQaOverrides(prev=>{const n={...prev};delete n[key];return n;});
                              }} className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors" title="Przywróć oryginał">
                                <Trash2 size={12}/>
                              </button>
                            )}
                            {!isEditing && (
                              <button onClick={()=>{setCatEditKey(key);setCatEditQ(override?.q??qa.q);setCatEditA(override?.a??qa.a);}}
                                className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"><Pencil size={12}/></button>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <div>
                              <label className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 block">Pytanie</label>
                              <input value={catEditQ} onChange={e=>setCatEditQ(e.target.value)} className={inputCls} placeholder="Pytanie"/>
                            </div>
                            <div>
                              <label className="text-slate-400 text-[10px] uppercase tracking-wider mb-1 block">Odpowiedź</label>
                              <textarea value={catEditA} onChange={e=>setCatEditA(e.target.value)} className={inputCls} rows={4} placeholder="Odpowiedź"/>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button onClick={async()=>{
                                setCatSaving(true);
                                await fetch("/api/admin/catechism",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"qa",key,q:catEditQ,a:catEditA})});
                                setCatQaOverrides(prev=>({...prev,[key]:{q:catEditQ,a:catEditA}}));
                                setCatSaving(false); setCatSaved(true); setTimeout(()=>setCatSaved(false),2000);
                                setCatEditKey(null);
                              }} disabled={catSaving} className={`${BTN_PRIMARY} flex-1`} style={{background:"linear-gradient(135deg,#1a1000,#3a2800)"}}>
                                {catSaving?<Loader2 size={13} className="animate-spin"/>:catSaved?<CheckCircle2 size={13} className="text-green-400"/>:<Save size={13}/>} Zapisz
                              </button>
                              <button onClick={()=>setCatEditKey(null)} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 text-sm">Anuluj</button>
                            </div>
                          </div>
                        ) : (<>
                          <p className="text-white text-xs font-medium mb-1">{override?.q ?? qa.q}</p>
                          <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{override?.a ?? qa.a}</p>
                        </>)}
                      </div>
                    );
                  })}
                </>);
              })()}
            </>)}

            {/* TAB: Treści strony */}
            {catTab==="config" && !catLoading && (
              <div className={`${CARD} p-4 space-y-4`}>
                <div>
                  <label className={labelCls}>Tytuł strony</label>
                  <input value={catConfig.pageTitle??""} onChange={e=>setCatConfig(p=>({...p,pageTitle:e.target.value}))} className={inputCls} placeholder="Katechizm"/>
                </div>
                <div>
                  <label className={labelCls}>Podtytuł</label>
                  <input value={catConfig.pageSubtitle??""} onChange={e=>setCatConfig(p=>({...p,pageSubtitle:e.target.value}))} className={inputCls} placeholder="Kard. Gasparri • ... pytań i odpowiedzi"/>
                </div>
                <div>
                  <label className={labelCls}>Cytat we wstępie</label>
                  <textarea value={catConfig.introQuote??""} onChange={e=>setCatConfig(p=>({...p,introQuote:e.target.value}))} className={inputCls} rows={3} placeholder="Nauczanie katechizmu ma nie tylko ten cel..."/>
                </div>
                <div>
                  <label className={labelCls}>Podpis pod cytatem</label>
                  <input value={catConfig.introFooter??""} onChange={e=>setCatConfig(p=>({...p,introFooter:e.target.value}))} className={inputCls} placeholder="Z Przedmowy kard. Gasparriego"/>
                </div>
                <div>
                  <label className={labelCls}>Tekst wstępu (akapity oddzielone pustą linią)</label>
                  <textarea value={catConfig.introText??""} onChange={e=>setCatConfig(p=>({...p,introText:e.target.value}))} className={inputCls} rows={6} placeholder={"Katechizm katolicki dla osób dorosłych to dzieło...\n\nKatechizm wykłada najważniejsze zasady..."}/>
                </div>
                <button onClick={async()=>{
                  setCatConfigSaving(true);
                  await fetch("/api/admin/catechism",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"config",config:catConfig})});
                  setCatConfigSaving(false); setCatConfigSaved(true); setTimeout(()=>setCatConfigSaved(false),2000);
                }} disabled={catConfigSaving} className={`${BTN_PRIMARY} w-full`} style={{background:"linear-gradient(135deg,#1a1000,#3a2800)"}}>
                  {catConfigSaving?<Loader2 size={14} className="animate-spin"/>:catConfigSaved?<CheckCircle2 size={14} className="text-green-400"/>:<Save size={14}/>}
                  {catConfigSaved?"Zapisano!":"Zapisz treści"}
                </button>
              </div>
            )}
          </div>
        </>)}

        {/* ── CIVILITAS ── */}
        {section==="civilitas" && (<>
          <SectionHeader title="Civilitas" subtitle="Edycja treści modułu savoir-vivre" onBack={()=>setSection(null)}/>
          <div className="flex gap-2 px-4 pb-4">
            {(["config","sections"] as const).map(t=>(
              <button key={t} onClick={()=>setCivTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${civTab===t?"text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}
                style={civTab===t?{background:"linear-gradient(135deg,#1a0a2e,#2e1060)"}:{}}>
                {t==="config"?<><Settings2 size={12}/>Treści strony</>:<><BookMarked size={12}/>Sekcje</>}
              </button>
            ))}
          </div>
          <div className="px-4 pb-8 space-y-3">
            {civLoading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-purple-400"/></div>}

            {/* TAB: Treści strony */}
            {!civLoading && civTab==="config" && (
              <div className={`${CARD} p-4 space-y-4`}>
                <div>
                  <label className={labelCls}>Tytuł strony</label>
                  <input value={civConfig.pageTitle??""} onChange={e=>setCivConfig(p=>({...p,pageTitle:e.target.value}))} className={inputCls} placeholder="Katolicki savoir-vivre"/>
                </div>
                <div>
                  <label className={labelCls}>Podtytuł</label>
                  <input value={civConfig.pageSubtitle??""} onChange={e=>setCivConfig(p=>({...p,pageSubtitle:e.target.value}))} className={inputCls} placeholder="Poradnik etykiety katolickiej"/>
                </div>
                <div>
                  <label className={labelCls}>Tekst wstępu (akapity oddzielone pustą linią)</label>
                  <textarea value={civConfig.intro??""} onChange={e=>setCivConfig(p=>({...p,intro:e.target.value}))} className={inputCls} rows={6}
                    placeholder={"Katolicki savoir-vivre nie jest jedynie zbiorem sztywnych reguł...\n\nDobre maniery w duchu katolickim..."}/>
                  <p className="text-slate-600 text-[10px] mt-1">Wyświetlany na górze strony przed listą sekcji</p>
                </div>
                <div>
                  <label className={labelCls}>Tekst zakończenia (akapity oddzielone pustą linią)</label>
                  <textarea value={civConfig.conclusion??""} onChange={e=>setCivConfig(p=>({...p,conclusion:e.target.value}))} className={inputCls} rows={6}
                    placeholder={"Katolicki savoir-vivre jest sztuką życia...\n\nCzłowiek dobrze wychowany..."}/>
                  <p className="text-slate-600 text-[10px] mt-1">Wyświetlane pod ostatnią sekcją</p>
                </div>
                <button onClick={async()=>{
                  setCivSaving(true);
                  await fetch("/api/admin/civilitas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({config:civConfig})});
                  setCivSaving(false); setCivSaved(true); setTimeout(()=>setCivSaved(false),2000);
                }} disabled={civSaving} className={`${BTN_PRIMARY} w-full`} style={{background:"linear-gradient(135deg,#1a0a2e,#2e1060)"}}>
                  {civSaving?<Loader2 size={14} className="animate-spin"/>:civSaved?<CheckCircle2 size={14} className="text-green-400"/>:<Save size={14}/>}
                  {civSaved?"Zapisano!":"Zapisz treści"}
                </button>
              </div>
            )}

            {/* TAB: Sekcje */}
            {!civLoading && civTab==="sections" && (()=>{
              const activeSec = CIVILITAS_SECTIONS.find(s=>s.num===civActiveSectionNum) ?? CIVILITAS_SECTIONS[0];
              const hasOverride = !!civSectionOverrides[activeSec.num];
              const defaultText = blocksToText(activeSec.content);
              return (<>
                <div className={`${CARD} p-3`}>
                  <label className={labelCls}>Sekcja</label>
                  <select value={civActiveSectionNum} onChange={e=>{
                    setCivActiveSectionNum(e.target.value);
                    const sec = CIVILITAS_SECTIONS.find(s=>s.num===e.target.value);
                    if (sec) setCivEditText(civSectionOverrides[e.target.value] ?? blocksToText(sec.content));
                  }} className={inputCls}>
                    {CIVILITAS_SECTIONS.map(s=>(
                      <option key={s.num} value={s.num}>{s.num}. {s.title}{civSectionOverrides[s.num]?" ✎":""}</option>
                    ))}
                  </select>
                  {hasOverride && (
                    <p className="text-purple-400 text-[10px] mt-1">Ta sekcja ma aktywną nadpisaną treść.</p>
                  )}
                </div>
                <div className={`${CARD} p-4 space-y-3`}>
                  <p className="text-slate-400 text-xs font-semibold">{activeSec.num}. {activeSec.title}</p>
                  <div>
                    <label className={labelCls}>Treść sekcji</label>
                    <p className="text-slate-600 text-[10px] mb-1">Format: <code className="text-purple-400">## nagłówek</code> · <code className="text-purple-400">- punkt listy</code> · <code className="text-purple-400">1. lista num.</code> · <code className="text-purple-400">&gt; cytat</code> · zwykły tekst = akapit</p>
                    <textarea
                      value={civEditText || (civSectionOverrides[activeSec.num] ?? defaultText)}
                      onChange={e=>setCivEditText(e.target.value)}
                      onFocus={e=>{ if (!civEditText) setCivEditText(e.target.value); }}
                      className={`${inputCls} font-mono text-xs`} rows={18}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async()=>{
                      setCivSectionSaving(true);
                      const text = civEditText || (civSectionOverrides[activeSec.num] ?? defaultText);
                      await fetch("/api/admin/civilitas",{method:"POST",headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({type:"section",sectionNum:activeSec.num,text})});
                      setCivSectionOverrides(p=>({...p,[activeSec.num]:text}));
                      setCivSectionSaving(false); setCivSectionSaved(true); setTimeout(()=>setCivSectionSaved(false),2000);
                    }} disabled={civSectionSaving} className={`${BTN_PRIMARY} flex-1`} style={{background:"linear-gradient(135deg,#1a0a2e,#2e1060)"}}>
                      {civSectionSaving?<Loader2 size={14} className="animate-spin"/>:civSectionSaved?<CheckCircle2 size={14} className="text-green-400"/>:<Save size={14}/>}
                      {civSectionSaved?"Zapisano!":"Zapisz sekcję"}
                    </button>
                    {hasOverride && (
                      <button onClick={async()=>{
                        await fetch("/api/admin/civilitas",{method:"DELETE",headers:{"Content-Type":"application/json"},
                          body:JSON.stringify({sectionNum:activeSec.num})});
                        setCivSectionOverrides(p=>{ const n={...p}; delete n[activeSec.num]; return n; });
                        setCivEditText(defaultText);
                      }} className="px-3 py-2 rounded-xl text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors">
                        <RefreshCw size={13}/>
                      </button>
                    )}
                  </div>
                  {hasOverride && (
                    <p className="text-slate-600 text-[10px]">Kliknij <RefreshCw size={10} className="inline"/> aby przywrócić domyślną treść tej sekcji.</p>
                  )}
                </div>
              </>);
            })()}
          </div>
        </>)}

        {/* ── PLINIO ── */}
        {section==="plinio" && (<>
          <SectionHeader title="Myśl na dziś" subtitle="Edycja cytatów i treści modułu" onBack={()=>setSection(null)}/>
          <div className="flex gap-2 px-4 pb-4">
            {(["quotes","config"] as const).map(t=>(
              <button key={t} onClick={()=>setPlinioTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${plinioTab===t?"text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}
                style={plinioTab===t?{background:"linear-gradient(135deg,#2a1800,#4a2e00)"}:{}}>
                {t==="quotes"?<><BookMarked size={12}/>Cytaty</>:<><Settings2 size={12}/>Treści strony</>}
              </button>
            ))}
          </div>
          <div className="px-4 pb-8 space-y-3">
            {plinioLoading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-amber-400"/></div>}

            {/* TAB: Cytaty */}
            {plinioTab==="quotes" && !plinioLoading && (<>
              <div className={`${CARD} p-4`}>
                <p className="text-slate-300 text-sm font-medium mb-2">Szukaj cytatu po numerze dnia (1–364)</p>
                <input
                  type="number" min={1} max={364}
                  value={plinioSearch}
                  onChange={e=>setPlinioSearch(e.target.value)}
                  className={inputCls}
                  placeholder="Wpisz numer dnia, np. 42"
                />
              </div>

              {/* Lista — pokaż nadpisane lub wyniki wyszukiwania */}
              {(() => {
                const searchDay = parseInt(plinioSearch);
                const showAll = !plinioSearch || isNaN(searchDay);
                const overrideDays = Object.keys(plinioOverrides).map(Number);
                const toShow = showAll
                  ? (overrideDays.length > 0
                      ? plinioQuotes.filter(q=>overrideDays.includes(q.day))
                      : plinioQuotes.slice(0, 10))
                  : plinioQuotes.filter(q=>q.day===searchDay);

                if (!showAll && toShow.length===0) return (
                  <div className={`${CARD} p-6 text-center`}>
                    <p className="text-slate-500 text-sm">Brak cytatu na dzień {searchDay}</p>
                  </div>
                );

                return (<>
                  {showAll && overrideDays.length===0 && (
                    <p className="text-slate-500 text-xs px-1 pb-1">Pokazuję pierwsze 10 cytatów. Wpisz numer dnia żeby wyszukać konkretny.</p>
                  )}
                  {showAll && overrideDays.length>0 && (
                    <p className="text-amber-500 text-xs px-1 pb-1 flex items-center gap-1.5">
                      <Pencil size={11}/> Edytowane cytaty ({overrideDays.length})
                    </p>
                  )}
                  {toShow.map(q=>{
                    const override = plinioOverrides[q.day];
                    const isEditing = plinioEditDay===q.day;
                    const isModified = !!override;
                    return (
                      <div key={q.day} className={`${CARD} p-4 ${isModified?"border-amber-700/40":""}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-500 font-bold text-sm">Dzień {q.day}</span>
                            {isModified && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800/40">edytowany</span>}
                          </div>
                          <div className="flex gap-1.5">
                            {isModified && !isEditing && (
                              <button onClick={async()=>{
                                await fetch("/api/admin/plinio",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({day:q.day})});
                                setPlinioOverrides(prev=>{const n={...prev};delete n[q.day];return n;});
                              }} className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors" title="Przywróć oryginał">
                                <Trash2 size={12}/>
                              </button>
                            )}
                            {!isEditing && (
                              <button onClick={()=>{
                                setPlinioEditDay(q.day);
                                setPlinioEditQuote(override?.quote ?? q.quote);
                                setPlinioEditSource(override?.source ?? q.source);
                              }} className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                                <Pencil size={12}/>
                              </button>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea value={plinioEditQuote} onChange={e=>setPlinioEditQuote(e.target.value)}
                              className={inputCls} rows={5} placeholder="Treść cytatu"/>
                            <input value={plinioEditSource} onChange={e=>setPlinioEditSource(e.target.value)}
                              className={inputCls} placeholder="Źródło"/>
                            <div className="flex gap-2 mt-1">
                              <button onClick={async()=>{
                                setPlinioSaving(true);
                                await fetch("/api/admin/plinio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"quote",day:q.day,quote:plinioEditQuote,source:plinioEditSource})});
                                setPlinioOverrides(prev=>({...prev,[q.day]:{quote:plinioEditQuote,source:plinioEditSource}}));
                                setPlinioSaving(false); setPlinioSaved(true);
                                setTimeout(()=>setPlinioSaved(false),2000);
                                setPlinioEditDay(null);
                              }} disabled={plinioSaving} className={`${BTN_PRIMARY} flex-1`} style={{background:"linear-gradient(135deg,#2a1800,#4a2e00)"}}>
                                {plinioSaving?<Loader2 size={13} className="animate-spin"/>:plinioSaved?<CheckCircle2 size={13} className="text-green-400"/>:<Save size={13}/>} Zapisz
                              </button>
                              <button onClick={()=>setPlinioEditDay(null)} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 text-sm">Anuluj</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                            {override?.quote ?? q.quote}
                          </p>
                        )}
                        {!isEditing && (
                          <p className="text-slate-600 text-[10px] mt-1.5 italic truncate">{override?.source ?? q.source}</p>
                        )}
                      </div>
                    );
                  })}
                </>);
              })()}
            </>)}

            {/* TAB: Treści strony */}
            {plinioTab==="config" && !plinioLoading && (
              <div className={`${CARD} p-4 space-y-4`}>
                <div>
                  <label className={labelCls}>Tytuł strony</label>
                  <input value={plinioConfig.pageTitle??""} onChange={e=>setPlinioConfig(p=>({...p,pageTitle:e.target.value}))}
                    className={inputCls} placeholder="Myśl na dziś"/>
                  <p className="text-slate-600 text-[10px] mt-1">Domyślnie: „Myśl na dziś"</p>
                </div>
                <div>
                  <label className={labelCls}>Podtytuł (autor)</label>
                  <input value={plinioConfig.pageSubtitle??""} onChange={e=>setPlinioConfig(p=>({...p,pageSubtitle:e.target.value}))}
                    className={inputCls} placeholder="Plinio Corrêa de Oliveira"/>
                  <p className="text-slate-600 text-[10px] mt-1">Domyślnie: „Plinio Corrêa de Oliveira"</p>
                </div>
                <div>
                  <label className={labelCls}>Imię i nazwisko autora (synteza mowy)</label>
                  <input value={plinioConfig.authorName??""} onChange={e=>setPlinioConfig(p=>({...p,authorName:e.target.value}))}
                    className={inputCls} placeholder="Plinio Corrêa de Oliveira"/>
                </div>
                <div>
                  <label className={labelCls}>Nota biograficzna autora</label>
                  <textarea value={plinioConfig.authorBio??""} onChange={e=>setPlinioConfig(p=>({...p,authorBio:e.target.value}))}
                    className={inputCls} rows={4}
                    placeholder="Plinio Corrêa de Oliveira (1908–1995) — brazylijski myśliciel katolicki..."/>
                  <p className="text-slate-600 text-[10px] mt-1">Wyświetlana w sekcji „Info o autorze" na stronie</p>
                </div>
                <button onClick={async()=>{
                  setPlinioConfigSaving(true);
                  await fetch("/api/admin/plinio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"config",config:plinioConfig})});
                  setPlinioConfigSaving(false); setPlinioConfigSaved(true);
                  setTimeout(()=>setPlinioConfigSaved(false),2000);
                }} disabled={plinioConfigSaving} className={`${BTN_PRIMARY} w-full`} style={{background:"linear-gradient(135deg,#2a1800,#4a2e00)"}}>
                  {plinioConfigSaving?<Loader2 size={14} className="animate-spin"/>:plinioConfigSaved?<CheckCircle2 size={14} className="text-green-400"/>:<Save size={14}/>}
                  {plinioConfigSaved?"Zapisano!":"Zapisz treści"}
                </button>
              </div>
            )}
          </div>
        </>)}

        {/* ── ARTICLES (MANUAL) ── */}
        {section==="articles" && (<>
          <SectionHeader title="Artykuły" subtitle={`${manualArticles.length} artykułów ręcznych`} onBack={()=>{setSection(null);setAddingArticle(false);setEditingArticle(null);}}/>
          <div className="px-4 pb-2 flex justify-end">
            {!addingArticle&&!editingArticle&&(
              <button onClick={()=>{setAddingArticle(true);setArticleForm({category:"Ogólne",author:"Redakcja",published_at:new Date().toISOString().slice(0,10)});}}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{background:"linear-gradient(135deg,#071b3b,#0f3470)"}}>
                <Plus size={15}/> Dodaj artykuł
              </button>
            )}
          </div>
          <div className="px-4 pb-8 space-y-3 mt-2">
            {(addingArticle||editingArticle) && (
              <div className={`${CARD} p-4 space-y-3`}>
                <p className="text-blue-400 font-semibold text-sm">{editingArticle?"Edytuj artykuł":"Nowy artykuł"}</p>
                <div><label className={labelCls}>Tytuł *</label>
                  <input className={inputCls} value={articleForm.title??""} onChange={e=>setArticleForm(p=>({...p,title:e.target.value}))} placeholder="Tytuł artykułu"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Kategoria</label>
                    <input className={inputCls} value={articleForm.category??""} onChange={e=>setArticleForm(p=>({...p,category:e.target.value}))} placeholder="np. Wiara"/>
                  </div>
                  <div><label className={labelCls}>Autor</label>
                    <input className={inputCls} value={articleForm.author??""} onChange={e=>setArticleForm(p=>({...p,author:e.target.value}))} placeholder="Redakcja"/>
                  </div>
                </div>
                <div><label className={labelCls}>Data publikacji</label>
                  <input type="date" className={inputCls} value={articleForm.published_at?.slice(0,10)??""} onChange={e=>setArticleForm(p=>({...p,published_at:e.target.value}))}/>
                </div>
                <div><label className={labelCls}>URL zdjęcia</label>
                  <input className={inputCls} value={articleForm.image_url??""} onChange={e=>setArticleForm(p=>({...p,image_url:e.target.value}))} placeholder="https://…/obraz.jpg"/>
                </div>
                <div><label className={labelCls}>Zajawka (excerpt)</label>
                  <textarea className={inputCls} rows={2} value={articleForm.excerpt??""} onChange={e=>setArticleForm(p=>({...p,excerpt:e.target.value}))} placeholder="Krótki opis…"/>
                </div>
                <div><label className={labelCls}>Treść *</label>
                  <textarea className={inputCls} rows={8} value={articleForm.content??""} onChange={e=>setArticleForm(p=>({...p,content:e.target.value}))} placeholder="Pełna treść artykułu…"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveArticle} disabled={articleSaving||!articleForm.title||!articleForm.content}
                    className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#071b3b,#0f3470)"}}>
                    {articleSaving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz
                  </button>
                  <button onClick={()=>{setAddingArticle(false);setEditingArticle(null);setArticleForm({});}}
                    className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm"><X size={15}/></button>
                </div>
              </div>
            )}
            {articlesLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-blue-400 animate-spin"/></div>}
            {manualArticles.length===0&&!articlesLoading&&<p className="text-slate-500 text-sm text-center py-8">Brak artykułów ręcznych.</p>}
            {manualArticles.map(a=>(
              <div key={a.id} className={`${CARD} p-4`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm">{a.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{a.category} · {a.author} · {new Date(a.published_at).toLocaleDateString("pl-PL")}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>{setEditingArticle(a);setArticleForm({...a});setAddingArticle(false);}} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-amber-400"><Pencil size={14}/></button>
                    <button onClick={()=>handleDeleteArticle(a.id)} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── PETITIONS (MANUAL) ── */}
        {section==="petitions" && (<>
          <SectionHeader title="Petycje" subtitle={`${manualPetitions.length} petycji ręcznych`} onBack={()=>{setSection(null);setAddingPetition(false);setEditingPetition(null);}}/>
          {manualPetitions.some(p=>p.signature_count>=p.notification_threshold) && (
            <div className="mx-4 mb-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-amber-400 text-xs">
              <ShieldAlert size={14}/> Uwaga: {manualPetitions.filter(p=>p.signature_count>=p.notification_threshold).length} petycja/e osiągnęła próg powiadomień
            </div>
          )}
          <div className="px-4 pb-2 flex justify-end">
            {!addingPetition&&!editingPetition&&(
              <button onClick={()=>{setAddingPetition(true);setPetitionForm({signature_count:0,notification_threshold:10000,active:true});}}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{background:"linear-gradient(135deg,#2a1200,#4a2000)"}}>
                <Plus size={15}/> Dodaj petycję
              </button>
            )}
          </div>
          <div className="px-4 pb-8 space-y-3 mt-2">
            {(addingPetition||editingPetition) && (
              <div className={`${CARD} p-4 space-y-3`}>
                <p className="text-amber-400 font-semibold text-sm">{editingPetition?"Edytuj petycję":"Nowa petycja"}</p>
                <div><label className={labelCls}>Tytuł *</label>
                  <input className={inputCls} value={petitionForm.title??""} onChange={e=>setPetitionForm(p=>({...p,title:e.target.value}))} placeholder="Tytuł petycji"/>
                </div>
                <div><label className={labelCls}>URL podpisu (link do podpisania)</label>
                  <input className={inputCls} value={petitionForm.source_url??""} onChange={e=>setPetitionForm(p=>({...p,source_url:e.target.value}))} placeholder="https://…"/>
                </div>
                <div><label className={labelCls}>URL zdjęcia</label>
                  <input className={inputCls} value={petitionForm.image_url??""} onChange={e=>setPetitionForm(p=>({...p,image_url:e.target.value}))} placeholder="https://…/obraz.jpg"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Licznik podpisów</label>
                    <input type="number" className={inputCls} value={petitionForm.signature_count??0} onChange={e=>setPetitionForm(p=>({...p,signature_count:Number(e.target.value)}))}/>
                  </div>
                  <div><label className={labelCls}>Próg powiadomień</label>
                    <input type="number" className={inputCls} value={petitionForm.notification_threshold??10000} onChange={e=>setPetitionForm(p=>({...p,notification_threshold:Number(e.target.value)}))}/>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={petitionForm.active??true} onChange={e=>setPetitionForm(p=>({...p,active:e.target.checked}))} className="rounded border-slate-600 bg-slate-700"/>
                  Aktywna
                </label>
                <div><label className={labelCls}>Zajawka</label>
                  <textarea className={inputCls} rows={2} value={petitionForm.excerpt??""} onChange={e=>setPetitionForm(p=>({...p,excerpt:e.target.value}))} placeholder="Krótki opis…"/>
                </div>
                <div><label className={labelCls}>Treść</label>
                  <textarea className={inputCls} rows={6} value={petitionForm.content??""} onChange={e=>setPetitionForm(p=>({...p,content:e.target.value}))} placeholder="Pełna treść petycji…"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSavePetition} disabled={petitionSaving||!petitionForm.title}
                    className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#2a1200,#4a2000)"}}>
                    {petitionSaving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz
                  </button>
                  <button onClick={()=>{setAddingPetition(false);setEditingPetition(null);setPetitionForm({});}}
                    className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm"><X size={15}/></button>
                </div>
              </div>
            )}
            {petitionsAdminLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-amber-400 animate-spin"/></div>}
            {manualPetitions.length===0&&!petitionsAdminLoading&&<p className="text-slate-500 text-sm text-center py-8">Brak petycji ręcznych.</p>}
            {manualPetitions.map(p=>(
              <div key={p.id} className={`${CARD} p-4 ${p.signature_count>=p.notification_threshold?"border-amber-600/40":""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{p.title}</p>
                      {p.signature_count>=p.notification_threshold && <ShieldAlert size={13} className="text-amber-400 flex-shrink-0"/>}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{p.signature_count.toLocaleString("pl-PL")} / {p.notification_threshold.toLocaleString("pl-PL")} · {p.active?"aktywna":"nieaktywna"}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>{setEditingPetition(p);setPetitionForm({...p});setAddingPetition(false);}} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-amber-400"><Pencil size={14}/></button>
                    <button onClick={()=>handleDeletePetition(p.id)} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── VIDEOS ── */}
        {section==="videos" && (<>
          <SectionHeader title="Wideo" subtitle={`${videos.length} filmów`} onBack={()=>{setSection(null);setAddingVideo(false);setEditingVideo(null);}}/>
          <div className="px-4 pb-2 flex justify-end">
            {!addingVideo&&!editingVideo&&(
              <button onClick={()=>{setAddingVideo(true);setVideoForm({active:true,category:"Ogólne",tags:[]});}}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{background:"linear-gradient(135deg,#1a0505,#3b0a0a)"}}>
                <Plus size={15}/> Dodaj film
              </button>
            )}
          </div>
          <div className="px-4 pb-8 space-y-3 mt-2">
            {(addingVideo||editingVideo) && (
              <div className={`${CARD} p-4 space-y-3`}>
                <p className="text-red-400 font-semibold text-sm">{editingVideo?"Edytuj film":"Nowy film"}</p>
                <div><label className={labelCls}>Tytuł *</label>
                  <input className={inputCls} value={videoForm.title??""} onChange={e=>setVideoForm(p=>({...p,title:e.target.value}))} placeholder="Tytuł filmu"/>
                </div>
                <div><label className={labelCls}>YouTube ID *</label>
                  <input className={inputCls+" font-mono"} value={videoForm.youtube_id??""} onChange={e=>setVideoForm(p=>({...p,youtube_id:e.target.value}))} placeholder="np. dQw4w9WgXcQ"/>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className={labelCls}>Kategoria</label>
                    <input className={inputCls} value={videoForm.category??""} onChange={e=>setVideoForm(p=>({...p,category:e.target.value}))} placeholder="np. Pro-Life"/>
                  </div>
                  <div><label className={labelCls}>Tagi (csv)</label>
                    <input className={inputCls} value={Array.isArray(videoForm.tags)?videoForm.tags.join(", "):""} onChange={e=>setVideoForm(p=>({...p,tags:e.target.value.split(",").map(t=>t.trim()).filter(Boolean)}))} placeholder="np. modlitwa, rosja"/>
                  </div>
                </div>
                <div><label className={labelCls}>Opis</label>
                  <textarea className={inputCls} rows={2} value={videoForm.description??""} onChange={e=>setVideoForm(p=>({...p,description:e.target.value}))} placeholder="Krótki opis…"/>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={videoForm.active??true} onChange={e=>setVideoForm(p=>({...p,active:e.target.checked}))} className="rounded border-slate-600 bg-slate-700"/>
                  Aktywny (widoczny dla użytkowników)
                </label>
                <div className="flex gap-2">
                  <button onClick={handleSaveVideo} disabled={videoSaving||!videoForm.title||!videoForm.youtube_id}
                    className={`flex-1 ${BTN_PRIMARY}`} style={{background:"linear-gradient(135deg,#1a0505,#3b0a0a)"}}>
                    {videoSaving?<Loader2 size={15} className="animate-spin"/>:<CheckCircle2 size={15}/>} Zapisz
                  </button>
                  <button onClick={()=>{setAddingVideo(false);setEditingVideo(null);setVideoForm({});}}
                    className="px-4 py-2.5 rounded-xl text-slate-400 bg-slate-700 hover:bg-slate-600 text-sm"><X size={15}/></button>
                </div>
              </div>
            )}
            {/* Filter by category */}
            {!addingVideo&&!editingVideo&&videos.length>0&&(
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {["Wszystkie",...Array.from(new Set(videos.map(v=>v.category).filter(Boolean)))].map(cat=>(
                  <button key={cat} onClick={()=>setVideoFilter(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${videoFilter===cat?"bg-red-700 text-white":"bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {videosLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-red-400 animate-spin"/></div>}
            {videos.length===0&&!videosLoading&&<p className="text-slate-500 text-sm text-center py-8">Brak filmów w bazie.</p>}
            {videos.filter(v=>videoFilter==="Wszystkie"||v.category===videoFilter).map(v=>(
              <div key={v.id} className={`${CARD} p-4 ${!v.active?"opacity-50":""}`}>
                <div className="flex items-start gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${v.youtube_id}/default.jpg`} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-slate-700"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight">{v.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{v.category}{v.tags?.length>0&&` · ${v.tags.join(", ")}`}</p>
                    <p className="text-slate-600 text-[10px] font-mono mt-0.5">{v.youtube_id}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>{setEditingVideo(v);setVideoForm({...v});setAddingVideo(false);}} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-amber-400"><Pencil size={14}/></button>
                    <button onClick={()=>handleDeleteVideo(v.id)} className="text-slate-400 p-1.5 rounded-lg hover:bg-slate-700 hover:text-red-400"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── PUSH STATS ── */}
        {section==="push-stats" && (<>
          <SectionHeader title="Statystyki push" subtitle="Historia i aktywne subskrypcje" onBack={()=>setSection(null)}/>
          <div className="px-4 pb-8 space-y-4">
            {pushStatsLoading && <div className="flex justify-center py-12"><Loader2 size={24} className="text-teal-400 animate-spin"/></div>}
            {pushStats && (<>
              <div className="grid grid-cols-2 gap-3">
                <div className={`${CARD} p-4 text-center`}>
                  <p className="text-3xl font-bold text-teal-400">{pushStats.active_subscriptions}</p>
                  <p className="text-slate-400 text-xs mt-1">Aktywne subskrypcje</p>
                </div>
                <div className={`${CARD} p-4 text-center`}>
                  <p className="text-3xl font-bold text-green-400">{pushStats.sent_last_7_days}</p>
                  <p className="text-slate-400 text-xs mt-1">Wysłane (ostatnie 7 dni)</p>
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Historia powiadomień</p>
                {pushStats.history.length===0&&<p className="text-slate-500 text-sm text-center py-6">Brak historii powiadomień</p>}
                <div className="space-y-2">
                  {pushStats.history.map(h=>(
                    <div key={h.id} className={`${CARD} px-4 py-3`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium">{h.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5 truncate">{h.body}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">{h.type}</span>
                          <p className="text-slate-600 text-[10px] mt-1">{new Date(h.created_at).toLocaleString("pl-PL",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>)}
          </div>
        </>)}

        {/* ── ACCESS MANAGEMENT ── */}
        {section==="access" && (<>
          <SectionHeader title="Dostęp adminów" subtitle="Role, uprawnienia i przypisani administratorzy" onBack={()=>setSection(null)}/>
          <div className="flex gap-2 px-4 pb-4">
            {(["groups","users"] as const).map(t=>(
              <button key={t} onClick={()=>setGroupsTab(t)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${groupsTab===t?"text-white":"bg-slate-800 text-slate-400 hover:text-white"}`}
                style={groupsTab===t?{background:"linear-gradient(135deg,#0a1a30,#102040)"}:{}}>
                {t==="groups"?<><Shield size={12}/>Role ({groups.length})</>:<><Users size={12}/>Administratorzy</>}
              </button>
            ))}
          </div>

          <div className="px-4 pb-8 space-y-4">
            {groupsLoading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-sky-400"/></div>}

            {/* TAB: Role */}
            {groupsTab==="groups" && !groupsLoading && (<>
              {groups.map(g=>{
                const currentTiles = groupPermissions[g.id] ?? [];
                const members = groupMembers[g.id] ?? [];
                const togglePerm = (key: string) => {
                  const next = currentTiles.includes(key) ? currentTiles.filter(t=>t!==key) : [...currentTiles, key];
                  setGroupPermissions(prev=>({...prev,[g.id]:next}));
                };
                return (
                  <div key={g.id} className={`${CARD} overflow-hidden`}>
                    {/* Nazwa roli */}
                    <div className="p-4 border-b border-slate-700/50">
                      {editingGroupId===g.id ? (
                        <div className="space-y-2">
                          <input value={editGroupName} onChange={e=>setEditGroupName(e.target.value)} className={inputCls} placeholder="Nazwa roli"/>
                          <input value={editGroupDesc} onChange={e=>setEditGroupDesc(e.target.value)} className={inputCls} placeholder="Opis (opcjonalny)"/>
                          <div className="flex gap-2 mt-1">
                            <button onClick={()=>handleUpdateGroup(g.id)} disabled={groupSaving} className={`${BTN_PRIMARY} flex-1`} style={{background:"linear-gradient(135deg,#0a1a30,#102040)"}}>
                              {groupSaving?<Loader2 size={14} className="animate-spin"/>:<Save size={14}/>} Zapisz
                            </button>
                            <button onClick={()=>setEditingGroupId(null)} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 text-sm">Anuluj</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-bold text-sm">{g.name}</p>
                            {g.description && <p className="text-slate-400 text-xs mt-0.5">{g.description}</p>}
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={()=>{setEditingGroupId(g.id);setEditGroupName(g.name);setEditGroupDesc(g.description??"");}}
                              className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"><Pencil size={13}/></button>
                            <button onClick={()=>handleDeleteGroup(g.id)}
                              className="p-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"><Trash2 size={13}/></button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dostęp do modułów zaplecza */}
                    <div className="p-4 border-b border-slate-700/50">
                      <p className="text-sky-400 text-[10px] font-semibold uppercase tracking-wider mb-3">Dostęp do modułów zaplecza</p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {ALL_TILE_KEYS.map(key=>{
                          const active = currentTiles.includes(key);
                          return (
                            <button key={key} onClick={()=>togglePerm(key)}
                              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${active?"text-white":"bg-slate-900/60 text-slate-400 border-slate-700/60 hover:border-slate-500"}`}
                              style={active?{background:"linear-gradient(135deg,#0a1a30,#102040)",borderColor:"#38bdf8aa"}:{}}>
                              <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${active?"bg-sky-500 border-sky-500":"border-slate-600"}`}>
                                {active && <CheckCircle2 size={10} className="text-black"/>}
                              </span>
                              {TILE_LABELS[key] ?? key}
                            </button>
                          );
                        })}
                      </div>
                      <button onClick={()=>handleSavePermissions(g.id, currentTiles)} disabled={permSaving}
                        className={`${BTN_PRIMARY} w-full`} style={{background:"linear-gradient(135deg,#0a1a30,#102040)"}}>
                        {permSaving?<Loader2 size={13} className="animate-spin"/>:permSaved?<CheckCircle2 size={13} className="text-green-400"/>:<Save size={13}/>}
                        {permSaved?"Zapisano!":"Zapisz uprawnienia"}
                      </button>
                    </div>

                    {/* Przypisani administratorzy */}
                    <div className="p-4">
                      <p className="text-sky-400 text-[10px] font-semibold uppercase tracking-wider mb-3">
                        Administratorzy w tej roli ({members.length})
                      </p>
                      {members.length===0 && <p className="text-slate-500 text-xs mb-3">Brak przypisanych osób</p>}
                      <div className="space-y-1.5 mb-3">
                        {members.map(uid=>{
                          const u = users.find(x=>x.id===uid);
                          return (
                            <div key={uid} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                              <div className="min-w-0">
                                <p className="text-slate-200 text-xs font-medium">{u ? (`${u.first_name??""} ${u.last_name??""}`.trim() || u.email) : uid}</p>
                                {u && u.email !== (`${u.first_name??""} ${u.last_name??""}`.trim()) && <p className="text-slate-500 text-[10px]">{u.email}</p>}
                              </div>
                              <button onClick={()=>handleRemoveMember(g.id,uid)} className="ml-3 p-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/50 text-red-400 transition-colors flex-shrink-0">
                                <X size={11}/>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={addMemberUserId}
                          onChange={e=>setAddMemberUserId(e.target.value)}
                          className={`${inputCls} flex-1 text-xs`}>
                          <option value="">Dodaj administratora do roli...</option>
                          {users.filter(u=>u.role==="admin"||u.role==="superadmin").filter(u=>!members.includes(u.id)).map(u=>(
                            <option key={u.id} value={u.id}>{u.first_name??""} {u.last_name??""} — {u.email}</option>
                          ))}
                        </select>
                        <button onClick={()=>handleAddMember(g.id, addMemberUserId)} disabled={!addMemberUserId}
                          className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition-all flex-shrink-0 flex items-center gap-1.5"
                          style={{background:"linear-gradient(135deg,#0a1a30,#102040)"}}>
                          <UserPlus size={14}/> Dodaj
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {addingGroup ? (
                <div className={`${CARD} p-4 space-y-2`}>
                  <p className="text-white text-sm font-semibold mb-1">Nowa rola</p>
                  <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} className={inputCls} placeholder="Nazwa roli *"/>
                  <input value={newGroupDesc} onChange={e=>setNewGroupDesc(e.target.value)} className={inputCls} placeholder="Opis (opcjonalny)"/>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleCreateGroup} disabled={groupSaving||!newGroupName.trim()} className={`${BTN_PRIMARY} flex-1`} style={{background:"linear-gradient(135deg,#0a1a30,#102040)"}}>
                      {groupSaving?<Loader2 size={14} className="animate-spin"/>:<Plus size={14}/>} Utwórz rolę
                    </button>
                    <button onClick={()=>{setAddingGroup(false);setNewGroupName("");setNewGroupDesc("");}} className="px-4 py-2 rounded-xl text-slate-400 bg-slate-800 text-sm">Anuluj</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>setAddingGroup(true)} className={`${BTN_PRIMARY} w-full`} style={{background:"linear-gradient(135deg,#0a1a30,#102040)"}}>
                  <Plus size={16}/> Dodaj rolę
                </button>
              )}
            </>)}

            {/* TAB: Administratorzy — per user z rolami */}
            {groupsTab==="users" && !groupsLoading && (<>
              {users.filter(u=>u.role==="admin"||u.role==="superadmin").length===0 && (
                <div className={`${CARD} p-6 text-center`}>
                  <p className="text-slate-500 text-sm">Brak użytkowników z rolą admina</p>
                </div>
              )}
              {users.filter(u=>u.role==="admin"||u.role==="superadmin").map(u=>{
                const userGroups = groups.filter(g=>(groupMembers[g.id]??[]).includes(u.id));
                const availableGroups = groups.filter(g=>!(groupMembers[g.id]??[]).includes(u.id));
                return (
                  <div key={u.id} className={`${CARD} p-4`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm">{u.first_name??""} {u.last_name??""}</p>
                        <p className="text-slate-400 text-xs truncate">{u.email}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 ml-2 ${u.role==="superadmin"?"bg-emerald-900/40 text-emerald-400 border-emerald-800/40":"bg-sky-900/40 text-sky-400 border-sky-800/40"}`}>
                        {u.role==="superadmin"?"superadmin":"admin"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-2">Przypisane role</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {userGroups.map(g=>(
                        <span key={g.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-xl bg-sky-900/40 text-sky-300 border border-sky-800/40 font-medium">
                          {g.name}
                          <button onClick={()=>handleRemoveMember(g.id,u.id)} className="hover:text-red-400 transition-colors">
                            <X size={10}/>
                          </button>
                        </span>
                      ))}
                      {userGroups.length===0 && <span className="text-xs text-slate-600 italic">Brak przypisanych ról</span>}
                    </div>
                    {availableGroups.length>0 && (
                      <div className="flex gap-2">
                        <select value={addMemberGroupId} onChange={e=>setAddMemberGroupId(e.target.value)} className={`${inputCls} flex-1 text-xs`}>
                          <option value="">Przypisz do roli...</option>
                          {availableGroups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                        <button onClick={()=>handleAddMember(addMemberGroupId, u.id)} disabled={!addMemberGroupId}
                          className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40 transition-all flex-shrink-0 flex items-center gap-1.5"
                          style={{background:"linear-gradient(135deg,#0a1a30,#102040)"}}>
                          <UserPlus size={14}/> Dodaj
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>)}
          </div>
        </>)}

      </div>
    </AppShell>
  );
}
