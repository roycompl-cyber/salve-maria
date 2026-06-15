"use client";
import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PKCampaign } from "@/lib/polskakatolicka";
import { ChevronRight, Loader2, Heart, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<PKCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const user = useAuth((s) => s.user);
  const profile = useProfile((s) => s.profile);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCampaigns(data);
        else setError("Błąd ładowania kampanii");
      })
      .catch(() => setError("Brak połączenia"))
      .finally(() => setLoading(false));
  }, []);

  function handleSupport(c: PKCampaign) {
    const params = new URLSearchParams({ donation_url: c.donation_url });
    if (profile?.first_name) params.set("name", profile.first_name);
    if (profile?.last_name) params.set("surname", profile.last_name);
    if (user?.email) params.set("email", user.email);
    if (profile?.phone) params.set("phone", profile.phone);
    if (profile?.street) params.set("address2", profile.street);
    if (profile?.house_no) params.set("address3", profile.house_no);
    if (profile?.postal) params.set("postal", profile.postal);
    if (profile?.city) params.set("city", profile.city);
    window.open(`/api/petitions/donation-prefill?${params.toString()}`, "_blank");
  }

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-6 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
              Wesprzyj akcje
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Wspieraj ważne inicjatywy</p>
          </div>
          <a
            href="http://polskakatolicka.org/pl/petycje"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            polskakatolicka.org <ExternalLink size={11} />
          </a>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-amber-500 animate-spin" />
            <p className="text-slate-400 text-sm">Ładowanie kampanii...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {campaigns.length === 0 && (
              <p className="text-center py-12 text-slate-500">Brak aktywnych kampanii</p>
            )}
            {campaigns.map((campaign) => (
              <div
                key={campaign.slug}
                className="block bg-slate-800 rounded-2xl overflow-hidden"
              >
                <div className="flex gap-3 p-4">
                  {campaign.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={campaign.image_url}
                      alt=""
                      className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-700"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-end">
                      <ChevronRight size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
                    </div>
                    <h2 className="text-white font-semibold mt-1.5 text-sm leading-tight line-clamp-2" style={{ fontFamily: "Georgia, serif" }}>
                      {campaign.title}
                    </h2>
                    {campaign.excerpt && (
                      <p className="text-slate-400 text-xs mt-1 line-clamp-2">{campaign.excerpt}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSupport(campaign)}
                  className="w-full bg-amber-700/20 border-t border-amber-800/30 px-4 py-2 flex items-center justify-between hover:bg-amber-700/30 transition-colors"
                >
                  <span className="text-amber-300 text-xs font-medium">Wesprzyj</span>
                  <Heart size={14} className="text-amber-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
