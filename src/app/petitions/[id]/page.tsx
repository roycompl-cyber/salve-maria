"use client";
import { use, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { PKPetition } from "@/lib/polskakatolicka";
import Link from "next/link";
import {
  ArrowLeft, Share2, Users, PenLine, ExternalLink, Loader2,
  CheckCircle2, Heart,
} from "lucide-react";
import ArticlePlayer from "@/components/ArticlePlayer";

const SIGNED_KEY = "salve_signed_petitions_v2";

function getSignedMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SIGNED_KEY) ?? "{}"); }
  catch { return {}; }
}
function markSigned(slug: string) {
  const map = getSignedMap();
  if (!map[slug]) {
    map[slug] = new Date().toISOString();
    localStorage.setItem(SIGNED_KEY, JSON.stringify(map));
  }
}

export default function PetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { profile } = useProfile();

  const [petition, setPetition] = useState<PKPetition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [alreadySigned, setAlreadySigned] = useState(false);
  const [currentPara, setCurrentPara] = useState(-1);

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  useEffect(() => {
    fetch(`/api/petitions/slug?slug=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setPetition(data))
      .catch(() => setError("Nie udało się załadować petycji"))
      .finally(() => setLoading(false));
    setAlreadySigned(!!getSignedMap()[id]);
  }, [id]);

  async function handleShare() {
    if (!petition) return;
    if (navigator.share) await navigator.share({ title: petition.title, text: petition.excerpt, url: petition.source_url });
  }

  function handleSign() {
    if (alreadySigned) return;
    const p = new URLSearchParams({
      slug: id,
      name: profile?.first_name ?? "",
      surname: profile?.last_name ?? "",
      email: profile?.email ?? user?.email ?? "",
      phone: profile?.phone ?? "",
      address2: profile?.street ?? "",
      address3: profile?.house_no ?? "",
      postal: profile?.postal ?? "",
      city: profile?.city ?? "",
    });
    markSigned(id);
    setAlreadySigned(true);
    window.location.href = `/api/petitions/prefill?${p.toString()}`;
  }

  function handleDonate() {
    const amount = selectedAmount ? String(selectedAmount) : customAmount;
    if (!amount || !petition) return;
    window.open(petition.donation_url || petition.source_url, "_blank", "noopener");
  }

  return (
    <AppShell>
      <div className="max-w-lg md:max-w-3xl mx-auto animate-fade-in">
        {/* Back bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/petitions" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Petycje
          </Link>
          <div className="flex items-center gap-1">
            {petition && (
              <a href={petition.source_url} target="_blank" rel="noopener noreferrer"
                className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                title="Otwórz na polskakatolicka.org">
                <ExternalLink size={16} />
              </a>
            )}
            <button onClick={handleShare} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="text-amber-500 animate-spin" />
            <p className="text-slate-400 text-sm">Ładowanie petycji...</p>
          </div>
        )}

        {error && (
          <div className="px-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm text-center">{error}</div>
          </div>
        )}

        {petition && (
          <div className="pb-6">
            {petition.image_url && (
              <div className="px-4 mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={petition.image_url} alt={petition.title}
                  className="w-full rounded-2xl object-cover max-h-56 bg-slate-800"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
            )}

            <div className="px-4 pt-4 space-y-4">
              <span className="text-xs font-medium text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <PenLine size={11} /> Petycja
              </span>

              <h1 className="text-white text-xl font-bold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                {petition.title}
              </h1>

              {petition.signature_count > 0 && (
                <div className="bg-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={18} className="text-amber-400" />
                    <span className="text-white font-bold text-lg">{petition.signature_count.toLocaleString("pl-PL")}</span>
                    <span className="text-slate-400 text-sm">osób już podpisało</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${Math.min((petition.signature_count / 10000) * 100, 100)}%`, background: "linear-gradient(90deg, #b45309, #d97706)" }} />
                  </div>
                </div>
              )}

              {petition.excerpt && (
                <p className="text-slate-300 text-base font-medium leading-relaxed border-l-2 border-amber-600 pl-3">
                  {petition.excerpt}
                </p>
              )}

              {petition.content && (
                <ArticlePlayer title={petition.title} content={petition.content} onParagraphChange={setCurrentPara} />
              )}

              {petition.content && (
                <div className="space-y-3">
                  {[petition.title, ...petition.content.split("\n\n").filter(Boolean)].slice(1).map((para, i) => {
                    const absIdx = i + 1;
                    return (
                      <p
                        key={absIdx}
                        id={`para-${absIdx}`}
                        className="text-slate-300 text-sm leading-relaxed rounded-xl transition-all duration-300"
                        style={currentPara === absIdx ? { backgroundColor: "rgba(180,83,9,0.15)", padding: "8px 10px", color: "#fcd9a0" } : {}}
                      >
                        {para}
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Sign section */}
              {alreadySigned ? (
                <div className="bg-slate-800 rounded-2xl px-4 py-5 flex flex-col items-center gap-2 text-center border border-green-700/30">
                  <CheckCircle2 size={32} className="text-green-400" />
                  <p className="text-white font-bold">Dziękujemy za podpis!</p>
                  <p className="text-slate-400 text-sm">Możesz też wesprzeć działalność fundacji darowizną.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSign}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #92400e, #b45309)" }}
                  >
                    <PenLine size={16} /> Podpisz petycję
                  </button>
                  <p className="text-slate-600 text-[10px] text-center">
                    Zostaniesz przekierowany na stronę petycji z wypełnionymi danymi z Twojego profilu.
                  </p>
                </div>
              )}

              {/* Donation panel — shown after signing */}
              {alreadySigned && (
                <div className="rounded-2xl border border-amber-700/40 overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-900/50 to-red-900/40 px-4 py-3.5 flex items-center gap-2">
                    <Heart size={16} className="text-amber-400" />
                    <span className="text-amber-200 font-semibold text-sm">Wesprzyj fundację darowizną</span>
                  </div>
                  <div className="bg-slate-900 px-4 py-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(petition.donation_amounts.length ? petition.donation_amounts : [60, 90, 120, 250, 500, 1200]).map((amt) => (
                        <button
                          key={amt}
                          onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
                          className="py-2.5 rounded-xl text-sm font-bold transition-all border"
                          style={
                            selectedAmount === amt
                              ? { background: "linear-gradient(135deg,#92400e,#b45309)", color: "#fff", borderColor: "#b45309" }
                              : { background: "transparent", color: "#94a3b8", borderColor: "#334155" }
                          }
                        >
                          {amt} zł
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Inna kwota (zł)"
                        value={customAmount}
                        onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <span className="text-slate-400 text-sm">zł</span>
                    </div>

                    <button
                      onClick={handleDonate}
                      disabled={!selectedAmount && !customAmount}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #7f1d1d, #991b1b)" }}
                    >
                      <Heart size={16} />
                      Wesprzyj{selectedAmount ? ` ${selectedAmount} zł` : customAmount ? ` ${customAmount} zł` : ""}
                    </button>

                    <p className="text-slate-600 text-[10px] text-center">
                      Zostaniesz przekierowany do bezpiecznej płatności przez PayU na polskakatolicka.org
                    </p>
                  </div>
                </div>
              )}

              {petition.content_html && (
                <div className="pt-5 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Powiązane treści</p>
                  <div className="article-html-content" dangerouslySetInnerHTML={{ __html: petition.content_html }} />
                </div>
              )}

              <a href={petition.source_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-amber-400 text-xs transition-colors pt-2 pb-4">
                Źródło: polskakatolicka.org <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
