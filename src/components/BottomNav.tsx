"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, BookMarked, PenLine, BookText, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",         icon: Home,          label: "Strona" },
  { href: "/articles", icon: BookOpen,       label: "Artykuły" },
  { href: "/gospel",   icon: BookText,       label: "Ewangelia" },
  { href: "/petitions",icon: PenLine,        label: "Petycje" },
  { href: "/prayers",  icon: BookMarked,     label: "Modlitwy" },
  { href: "/contact",  icon: MessageCircle,  label: "Kontakt" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/97 backdrop-blur-md border-t border-red-900/40 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {navItems.map(({ href, icon: Icon, label }) => {
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
                size={19}
                className={cn("transition-all", active && "drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[9px] font-medium truncate" style={{ fontFamily: "Georgia, serif" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
