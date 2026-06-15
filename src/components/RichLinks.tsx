"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const PK_BASE = "polskakatolicka.org";

interface Props {
  html: string;
  className?: string;
}

export default function RichLinks({ html, className }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;

    const raw = anchor.getAttribute("href") ?? "";
    if (!raw || raw === "#" || raw.startsWith("javascript:")) return;

    e.preventDefault();

    // 1. Już przepisane linki wewnętrzne (/articles/…, /petitions/…)
    if (raw.startsWith("/articles/") || raw.startsWith("/petitions/")) {
      router.push(raw);
      return;
    }

    // 2. Absolutne linki do artykułów polskakatolicka.org → wewnętrznie
    const artM = raw.match(/polskakatolicka\.org\/pl\/artykuly\/([^/?#]+)/);
    if (artM) {
      router.push(`/articles/${artM[1]}`);
      return;
    }

    // 3. Absolutne linki do petycji polskakatolicka.org → wewnętrznie
    const petM = raw.match(/polskakatolicka\.org\/pl\/petycje\/([^/?#]+)/);
    if (petM) {
      router.push(`/petitions/${petM[1]}`);
      return;
    }

    // 4. Linki do innych stron polskakatolicka.org (formularze, wpłaty) → przez prefill z danymi usera
    if (raw.includes(PK_BASE) && (profile || user)) {
      const p = new URLSearchParams({
        redirect: raw,
        name:     profile?.first_name ?? "",
        surname:  profile?.last_name  ?? "",
        email:    profile?.email ?? user?.email ?? "",
        phone:    profile?.phone  ?? "",
        address2: profile?.street   ?? "",
        address3: profile?.house_no ?? "",
        postal:   profile?.postal   ?? "",
        city:     profile?.city     ?? "",
      });
      window.open(`/api/proxy/external?${p.toString()}`, "_blank", "noopener noreferrer");
      return;
    }

    // 5. Wszystkie inne zewnętrzne
    window.open(raw, "_blank", "noopener noreferrer");
  }

  return (
    <div onClick={handleClick} className={className}>
      <div className="article-html-content" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
