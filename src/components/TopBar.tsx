"use client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { LogOut, Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function TopBar() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-40 bg-red-950/95 backdrop-blur-md border-b border-red-900 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        {/* Logo + nazwa */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-red-900 border border-yellow-700/40">
            <Image
              src="/logo.png"
              alt="Salve Maria"
              width={36}
              height={36}
              className="object-cover w-full h-full"
              onError={() => {}}
            />
          </div>
          <div className="min-w-0">
            <p className="text-yellow-200 font-bold text-sm leading-tight tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Salve Maria
            </p>
            {profile?.first_name ? (
              <p className="text-red-300 text-[9px] leading-none truncate">
                {profile.first_name} {profile.last_name ?? ""}
              </p>
            ) : (
              <p className="text-red-300 text-[9px] leading-none truncate hidden sm:block">
                Instytut Ks. Piotra Skargi
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {user && (
            <>
              <Link
                href="/settings"
                className="text-red-300 hover:text-yellow-200 p-1.5 rounded-lg hover:bg-red-900 transition-colors"
                title="Mój profil"
              >
                <UserCircle size={18} />
              </Link>
              <Link
                href="/admin"
                className="text-red-300 hover:text-yellow-200 p-1.5 rounded-lg hover:bg-red-900 transition-colors"
                title="Admin"
              >
                <Settings size={18} />
              </Link>
              <button
                onClick={signOut}
                title="Wyloguj"
                className="text-red-300 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-900 transition-colors"
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
