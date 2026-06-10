"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { useAuth } from "@/hooks/useAuth";
import { mockCampaigns } from "@/lib/mock-data";
import { PKArticle } from "@/lib/polskakatolicka";
import { formatCurrency, progressPercent, daysLeft, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Heart, BookMarked, ChevronRight, Calendar, Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function HomePage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [articles, setArticles] = useState<PKArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setArticles(data.slice(0, 3)))
      .finally(() => setArticlesLoading(false));
  }, []);

  const greeting = profile?.first_name || user?.email?.split("@")[0] || "Darczyńco";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 animate-fade-in">
        {/* Hero greeting */}
        <div className="rounded-2xl p-5 shadow-xl" style={{ background: "linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)" }}>
          <p className="text-red-200 text-sm font-medium">{t("home.greeting")},</p>
          <h1 className="text-yellow-100 text-2xl font-bold mt-0.5 capitalize" style={{ fontFamily: "Georgia, serif" }}>{greeting}</h1>
          <p className="text-red-200 text-sm mt-1">{t("home.subtitle")}</p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/donate"
              className="flex-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-100 font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-yellow-700/30"
            >
              <Heart size={16} fill="currentColor" />
              {t("home.donate_now")}
            </Link>
            <Link
              href="/prayers"
              className="flex-1 bg-white/10 hover:bg-white/20 text-red-100 font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <BookMarked size={16} />
              {t("home.pray_now")}
            </Link>
          </div>
        </div>

        {/* Latest articles */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">{t("home.latest")}</h2>
            <Link href="/articles" className="text-blue-400 text-sm flex items-center gap-0.5 hover:text-blue-300">
              {t("home.see_all")} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {articlesLoading && (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Ładowanie...</span>
              </div>
            )}
            {!articlesLoading && articles.slice(0, 2).map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="flex gap-3 bg-slate-800 rounded-2xl p-4 hover:bg-slate-700 transition-colors"
              >
                {article.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.image_url}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-slate-700"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">
                    Artykuł
                  </span>
                  <h3 className="text-white font-semibold mt-1 leading-tight text-sm line-clamp-2">{article.title}</h3>
                  <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                    <Calendar size={11} />
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Active campaigns */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">{t("home.campaigns")}</h2>
            <Link href="/donate" className="text-blue-400 text-sm flex items-center gap-0.5 hover:text-blue-300">
              {t("home.see_all")} <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {mockCampaigns.map((campaign) => {
              const pct = progressPercent(campaign.current_amount, campaign.goal_amount);
              return (
                <div key={campaign.id} className="bg-slate-800 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm">{campaign.title}</h3>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{campaign.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {t("donate.raised")}: <span className="text-white font-medium">{formatCurrency(campaign.current_amount)}</span>
                      </span>
                      <span className="text-slate-400">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-500">{t("donate.goal")}: {formatCurrency(campaign.goal_amount)}</span>
                      {campaign.ends_at && (
                        <span className="text-orange-400">{daysLeft(campaign.ends_at)} {t("donate.days_left")}</span>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/donate"
                    className="mt-3 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium py-2 rounded-xl flex items-center justify-center transition-colors"
                  >
                    {t("donate.support_campaign")}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
