"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Bell, Newspaper, Megaphone, BookMarked, Loader2, Trash2 } from "lucide-react";

interface PushEntry {
  id: string;
  title: string;
  body: string;
  type: string;
  url: string;
  sent_at: string;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  news:   { icon: <Newspaper size={15} />,  color: "text-green-400 bg-green-400/10",  label: "Aktualność" },
  action: { icon: <Megaphone size={15} />,  color: "text-red-400 bg-red-400/10",     label: "Akcja" },
  prayer: { icon: <BookMarked size={15} />, color: "text-amber-400 bg-amber-400/10", label: "Modlitwa" },
};

const STORAGE_KEY = "dismissed_announcements";

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveDismissed(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export default function AnnouncementsPage() {
  const [items, setItems] = useState<PushEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissed(getDismissed());
    fetch("/api/announcements")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setItems(d); })
      .finally(() => setLoading(false));
  }, []);

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }

  const visible = items.filter(i => !dismissed.has(i.id));

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={20} className="text-amber-400" />
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Ogłoszenia</h1>
            <p className="text-slate-400 text-sm">Historia powiadomień od Fundacji</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="text-amber-400 animate-spin" />
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-20 text-slate-500 text-sm">Brak ogłoszeń.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map(item => {
            const meta = TYPE_META[item.type] ?? TYPE_META.news;
            return (
              <div key={item.id} className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-slate-500 text-xs ml-auto">
                    {new Date(item.sent_at).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => dismiss(item.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-slate-700 flex-shrink-0"
                    title="Usuń ogłoszenie"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h2 className="text-white font-bold text-base mb-1" style={{ fontFamily: "Georgia, serif" }}>
                  {item.title}
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
