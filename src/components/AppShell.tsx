"use client";
import { Suspense, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";
import InstallPrompt from "./InstallPrompt";
import PrayerReminderProvider from "./PrayerReminderProvider";
import PushOnboardingBanner from "./PushOnboardingBanner";
import { reportClientError } from "@/lib/error-monitoring";

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
      navigator.serviceWorker.register("/sw-custom.js", { scope: "/" }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (user) fetch(user.id);
  }, [user, fetch]);

  useEffect(() => {
    if (!pathname) return;
    const title = document.title || pathname;
    window.fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, title }),
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportClientError({
        message: event.message || "Nieznany błąd JavaScript",
        path: window.location.pathname,
        source: "window",
        userAgent: navigator.userAgent,
      });
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason instanceof Error
        ? event.reason.message
        : String(event.reason || "Nieobsłużony błąd operacji");
      reportClientError({
        message,
        path: window.location.pathname,
        source: "promise",
        userAgent: navigator.userAgent,
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

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
    <>
      {/* brightness-wrap NIE może zawierać elementów position:fixed —
          CSS filter tworzy nowy containing block i psuje fixed positioning */}
      <div className="brightness-wrap flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pb-20 overflow-auto">{children}</main>
      </div>
      {/* BottomNav, InstallPrompt i PrayerReminderProvider są poza brightness-wrap,
          dostaną filtr jasności przez osobną regułę CSS (--app-b) */}
      <BottomNav />
      <InstallPrompt />
      <Suspense><PrayerReminderProvider /></Suspense>
      {profile?.profile_complete && <PushOnboardingBanner userId={user?.id} />}
    </>
  );
}
