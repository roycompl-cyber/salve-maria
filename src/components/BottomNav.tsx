"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

const navItems: { href: string; icon: IconName; label: string }[] = [
  { href: "/",              icon: "home",          label: "START" },
  { href: "/articles",      icon: "articles",      label: "Artykuły" },
  { href: "/gospel",        icon: "gospel",        label: "Ewangelia" },
  { href: "/petitions",     icon: "petition",      label: "Petycje" },
  { href: "/prayers",       icon: "jerusalem-cross", label: "Modlitwy" },
  { href: "/announcements", icon: "bell",          label: "Ogłoszenia" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/97 backdrop-blur-md border-t border-red-900/40 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg md:max-w-3xl mx-auto px-1 md:px-8">
        {navItems.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl transition-all min-w-0 flex-1",
                active ? "text-yellow-400" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <Icon
                name={icon}
                size={20}
                strokeWidth={active ? 2 : 1.4}
                className={cn("transition-all", active && "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]")}
              />
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
