"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import InstallPrompt from "./InstallPrompt";

interface Props {
  children: React.ReactNode;
  /** Pass true on the /settings page itself to avoid redirect loop */
  skipProfileGuard?: boolean;
}

export default function AppShell({ children, skipProfileGuard = false }: Props) {
  const { user, loading: authLoading, init } = useAuth();
  const { profile, loading: profileLoading, fetch } = useProfile();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => { init(); }, [init]);

  // Rejestruj service worker ręcznie jeśli jeszcze nie jest zarejestrowany
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length === 0) {
          navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
        }
      });
    }
  }, []);

  useEffect(() => {
    if (user) fetch(user.id);
  }, [user, fetch]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (
      !skipProfileGuard &&
      !authLoading &&
      !profileLoading &&
      user &&
      profile &&
      !profile.profile_complete &&
      pathname !== "/settings"
    ) {
      router.push("/settings");
    }
  }, [skipProfileGuard, authLoading, profileLoading, user, profile, pathname, router]);

  const isLoading = authLoading || (user && profileLoading);

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-slate-900"
        style={{ background: "radial-gradient(ellipse at top, #3b0a0a 0%, #0f172a 70%)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden animate-pulse border-2 border-yellow-800/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Salve Maria" className="w-full h-full object-cover" />
          </div>
          <p className="text-yellow-200/60 text-sm" style={{ fontFamily: "Georgia, serif" }}>
            Salve Maria
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <main className="flex-1 pb-20 overflow-auto">{children}</main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
