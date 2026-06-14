"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Icon from "@/components/Icon";

const DAYS_PL = ["Niedziela","Poniedziałek","Wtorek","Środa","Czwartek","Piątek","Sobota"];
const MONTHS_PL = ["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia"];

function buildDonationUrl(
  donationUrl: string,
  profile: { first_name?: string|null; last_name?: string|null; email?: string|null; phone?: string|null; street?: string|null; house_no?: string|null; postal?: string|null; city?: string|null } | null,
  fallbackEmail: string
) {
  const p = new URLSearchParams({
    donation_url: donationUrl,
    name:     profile?.first_name ?? "",
    surname:  profile?.last_name  ?? "",
    email:    profile?.email      ?? fallbackEmail,
    phone:    profile?.phone      ?? "",
    address2: profile?.street     ?? "",
    address3: profile?.house_no   ?? "",
    postal:   profile?.postal     ?? "",
    city:     profile?.city       ?? "",
  });
  return `/api/petitions/donation-prefill?${p.toString()}`;
}

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const now = new Date();
  const dateStr = `${DAYS_PL[now.getDay()]}, ${now.getDate()} ${MONTHS_PL[now.getMonth()]} ${now.getFullYear()}`;

  const wesprzyUrl = buildDonationUrl(
    "https://polskakatolicka.org/pl/wplata-na-kampanie?payment=4631d9866d1c0f17d328b28a50f102",
    profile, user?.email ?? ""
  );

  return (
    <header className="sticky top-0 z-40 bg-red-950/95 backdrop-blur-md border-b border-red-900 safe-area-top mb-7">
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 h-[76px] relative">
        <div className="flex items-center gap-3 h-full">
          {/* Logo zachowuje rozmiar i wystaje poniżej niskiego paska */}
          <div className="absolute left-4 md:left-8 top-2 w-[88px] h-[88px] rounded-full overflow-hidden bg-red-900 border-2 border-yellow-700/50 shadow-xl z-10">
            <Image src="/logo.png" alt="Salve Maria" width={88} height={88} className="object-cover w-full h-full" onError={() => {}} />
          </div>

          <div className="flex-1 min-w-0 ml-[100px] flex flex-col justify-center gap-1.5 h-full">
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2 max-h-8">
              <div className="min-w-0">
                <p className="text-yellow-200 font-bold text-sm leading-tight tracking-wide" style={{ fontFamily: "Georgia, serif" }}>Salve Maria</p>
                <p className="text-red-300 text-[10px] leading-tight truncate mt-0.5">
                  {profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : dateStr}
                </p>
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                {user && (
                  <>
                    <Link href="/settings" className="text-red-300 hover:text-yellow-200 p-2 rounded-lg hover:bg-red-900 transition-colors" title="Mój profil">
                      <Icon name="user" size={18} />
                    </Link>
                    {profile?.role === "admin" && (
                      <Link href="/admin" className="text-red-300 hover:text-yellow-200 p-2 rounded-lg hover:bg-red-900 transition-colors" title="Admin">
                        <Icon name="settings" size={18} />
                      </Link>
                    )}
                    <button onClick={signOut} title="Wyloguj" className="text-red-300 hover:text-red-400 p-2 rounded-lg hover:bg-red-900 transition-colors">
                      <Icon name="logout" size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <a
              href={wesprzyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-6 w-full items-center justify-center rounded-lg border border-yellow-200/50 px-2 py-1 text-center hover:brightness-110 transition-[filter]"
              style={{ background: "linear-gradient(135deg, #e3b34f, #f3cf72)" }}
            >
              <span className="block w-full text-center text-red-950 font-black text-[10px] tracking-[0.14em] uppercase leading-tight" style={{ fontFamily: "Georgia, serif" }}>Wesprzyj i zrób różnicę</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
