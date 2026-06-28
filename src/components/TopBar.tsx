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
    <header className="sticky top-0 z-40 bg-red-950/95 backdrop-blur-md border-b border-red-900 safe-area-top mb-5">
      <div className="max-w-lg md:max-w-3xl mx-auto px-2 md:px-6 h-[72px] relative">
        <div className="flex items-center gap-2 h-full">
          {/* Logo wystaje poniżej paska */}
          <div className="absolute left-2 md:left-6 top-2 w-[80px] h-[80px] rounded-full overflow-hidden bg-red-900 border-2 border-yellow-700/50 shadow-xl z-10 flex-shrink-0">
            <Image src="/logo.png" alt="Salve Maria" width={80} height={80} className="object-cover w-full h-full" onError={() => {}} />
          </div>

          <div className="flex-1 min-w-0 ml-[88px] flex flex-col justify-center gap-1 h-full">
            <div className="flex items-center justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-yellow-200 font-bold leading-tight tracking-wide whitespace-nowrap" style={{ fontFamily: "Georgia, serif", fontSize: "13px" }}>Salve Maria</p>
                <p className="text-red-300 leading-tight truncate mt-0.5" style={{ fontSize: "10px" }}>
                  {profile?.first_name ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : dateStr}
                </p>
              </div>

              <div className="flex items-center gap-0 flex-shrink-0">
                {user && (
                  <>
                    <Link href="/settings" className="text-red-300 hover:text-yellow-200 p-1.5 rounded-lg hover:bg-red-900 transition-colors" title="Mój profil">
                      <Icon name="user" size={17} />
                    </Link>
                    {profile?.role === "admin" && (
                      <Link href="/admin" className="text-red-300 hover:text-yellow-200 p-1.5 rounded-lg hover:bg-red-900 transition-colors" title="Admin">
                        <Icon name="settings" size={17} />
                      </Link>
                    )}
                    <button onClick={signOut} title="Wyloguj" className="text-red-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-900 transition-colors">
                      <Icon name="logout" size={17} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <a
              href={`/viewer?url=${encodeURIComponent(wesprzyUrl)}`}
              className="flex w-full items-center justify-center rounded-lg border border-yellow-200/50 px-2 py-[5px] hover:brightness-110 transition-[filter]"
              style={{ background: "linear-gradient(135deg, #e3b34f, #f3cf72)" }}
            >
              <span className="whitespace-nowrap text-red-950 font-black uppercase leading-none tracking-[0.1em]" style={{ fontFamily: "Georgia, serif", fontSize: "9px" }}>Wesprzyj i zrób różnicę</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
