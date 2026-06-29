"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

// ── Module defaults ──────────────────────────────────────────────────────────
const MOD_DEFAULTS: Record<string, { href: string; icon: IconName; label: string }> = {
  prayers:       { href: "/prayers",       icon: "jerusalem-cross", label: "Modlitwy" },
  gospel:        { href: "/gospel",        icon: "gospel",          label: "Ewangelia" },
  catechism:     { href: "/catechism",     icon: "catechism",       label: "Katechizm" },
  petitions:     { href: "/petitions",     icon: "petition",        label: "Petycje" },
  articles:      { href: "/articles",      icon: "articles",        label: "Artykuły" },
  announcements: { href: "/announcements", icon: "announcements",   label: "Ogłoszenia" },
  chat:          { href: "/contact",       icon: "chat",            label: "Kontakt" },
  reminders:     { href: "/reminders",     icon: "bell",            label: "Przypomnienia" },
  savoir:        { href: "/savoir-vivre",  icon: "etiquette",       label: "De urbanitate" },
  about:         { href: "/about",         icon: "about",           label: "O fundacji" },
  watch:         { href: "/watch",         icon: "video-play",      label: "Zobacz" },
  plinio:        { href: "/plinio",        icon: "quote",           label: "Myśl na dziś" },
};

const DEFAULT_NAV_KEYS = ["articles", "gospel", "petitions", "prayers", "announcements"];
const STORAGE_KEY = "salve_tiles_config";
const SEEN_REPLIES_KEY = "salve_contact_seen_replies";
const CACHE_TTL_MS = 120_000;

// ── Module-level fetch cache ─────────────────────────────────────────────────
let _fetchPromise: Promise<Record<string, unknown>> | null = null;
let _fetchTimestamp = 0;

function getTilesConfig(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (_fetchPromise && now - _fetchTimestamp < CACHE_TTL_MS) return _fetchPromise;
  _fetchTimestamp = now;
  _fetchPromise = fetch("/api/admin/tiles").then(r => r.json()).catch(() => ({}));
  setTimeout(() => { _fetchPromise = null; }, CACHE_TTL_MS);
  return _fetchPromise;
}

function getSeenReplyIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_REPLIES_KEY) ?? "[]")); }
  catch { return new Set(); }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function BottomNav() {
  const pathname = usePathname();
  const [unreadReplies, setUnreadReplies] = useState(0);

  const [navKeys, setNavKeys] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_NAV_KEYS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_NAV_KEYS;
      const cfg = JSON.parse(raw) as Record<string, unknown>;
      const items = (cfg._nav as { items?: string[] } | undefined)?.items;
      return Array.isArray(items) && items.length > 0 ? items.slice(0, 5) : DEFAULT_NAV_KEYS;
    } catch { return DEFAULT_NAV_KEYS; }
  });

  const [tilesConfig, setTilesConfig] = useState<Record<string, unknown>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    getTilesConfig().then(cfg => {
      setTilesConfig(cfg);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)); } catch {}
      const items = (cfg._nav as { items?: string[] } | undefined)?.items;
      if (Array.isArray(items) && items.length > 0) {
        setNavKeys(items.slice(0, 5));
      } else {
        setNavKeys(DEFAULT_NAV_KEYS);
      }
    });

    fetch("/api/contact/unread-replies").then(r => r.json()).then(d => {
      if (d.ids) {
        const seen = getSeenReplyIds();
        setUnreadReplies((d.ids as string[]).filter((id: string) => !seen.has(id)).length);
      }
    }).catch(() => {});
  }, []);

  // Build nav items: home + up to 5 mod slots
  const navItems: { href: string; icon: IconName; label: string; mod?: string }[] = [
    { href: "/", icon: "home", label: "START" },
  ];

  for (const key of navKeys) {
    const def = MOD_DEFAULTS[key];
    if (!def) continue;
    const ov = tilesConfig[key] as { hidden?: boolean; label?: string; icon?: string } | undefined;
    if (ov?.hidden) continue;
    navItems.push({
      href: def.href,
      icon: (ov?.icon as IconName | undefined) ?? def.icon,
      label: ov?.label ?? def.label,
      mod: key,
    });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/97 backdrop-blur-md border-t border-red-900/40 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg md:max-w-3xl mx-auto px-1 md:px-8">
        {navItems.map(({ href, icon, label, mod }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const badge = mod === "chat" && unreadReplies > 0 ? unreadReplies : 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all min-w-0 flex-1",
                active ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <span className="relative">
                <Icon
                  name={icon}
                  size={20}
                  strokeWidth={active ? 2 : 1.4}
                  className={cn("transition-all", active && "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]")}
                />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                    {badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium truncate" style={{ fontFamily: "Georgia, serif" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
