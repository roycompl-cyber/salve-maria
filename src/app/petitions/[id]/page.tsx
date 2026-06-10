"use client";
import { use, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { PKPetition } from "@/lib/polskakatolicka";
import Link from "next/link";
import {
  ArrowLeft, Share2, Users, PenLine, ExternalLink, Loader2,
  CheckCircle2, ChevronDown, ChevronUp, Heart,
} from "lucide-react";

const SIGNED_KEY = "salve_signed_petitions";

function getSignedSlugs(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SIGNED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function markSigned(slug: string) {
  const existing = getSignedSlugs();
  if (!existing.includes(slug)) {
    localStorage.setItem(SIGNED_KEY, JSON.stringify([...existing, slug]));
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
  const [formOpen, setFormOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [postal, setPostal] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    fetch(`/api/petitions/slug?slug=${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setPetition(data))
      .catch(() => setError("Nie udało się załadować petycji"))
      .finally(() => setLoading(false));

    setAlreadySigned(getSignedSlugs().includes(id));
  }, [id]);

  // Pre-fill from profile
  useEffect(() => {
    if (!profile) return;
    setName(profile.first_name ?? "");
    setSurname(profile.last_name ?? "");
    setEmail(profile.email ?? user?.email ?? "");
    setPhone(profile.phone ?? "");
    setAddress2(profile.street ?? "");
    setAddress3(profile.house_no ?? "");
    setPostal(profile.postal ?? "");
    setCity(profile.city ?? "");
  }, [profile, user]);

  async function handleShare() {
    if (!petition) return;
    if (navigator.share) {
      await navigator.share({ title: petition.title, text: petition.excerpt, url: petition.source_url });
    }
  }

  function buildDonationUrl(amount: string) {
    const p = new URLSearchParams({
      donation_url: petition?.donation_url ?? "",
      amount,
      name, surname, email, phone,
      address2, address3, postal, city,
    });
    return `/api/petitions/donation-prefill?${p.toString()}`;
  }

  function handleDonate() {
    const amount = selectedAmount ? String(selectedAmount) : customAmount;
    if (!amount) return;
    window.open(buildDonationUrl(amount), "_blank", "noopener");
  }

  function buildPrefillUrl() {
    const p = new URLSearchParams({
      slug: id, name, surname, email, phone,
      address2, address3, postal, city,
    });
    return `/api/petitions/prefill?${p.toString()}`;
  }

  function handleSign() {
    markSigned(id);
    setAlreadySigned(true);
    // Open prefill page — browser submits the form directly to polskakatolicka.org
    window.open(buildPrefillUrl(), "_blank", "noopener");
  }

  const inputCls = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors";
  const labelCls = "block text-xs text-slate-400 mb-1";

  return (
    <AppShell>
      <div className="max-w-lg mx-auto animate-fade-in">
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
              // eslint-disable-next-line @next/next/no-img-element
              <img src={petition.image_url} alt={petition.title}
                className="w-full object-cover max-h-52 bg-slate-800"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                <div className="space-y-3">
                  {petition.content.split("\n\n").filter(Boolean).map((para, i) => (
                    <p key={i} className="text-slate-300 text-sm leading-relaxed">{para}</p>
                  ))}
                </div>
              )}

              {/* Sign section */}
              <div className="rounded-2xl overflow-hidden border border-slate-700">
                {/* Header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-800 transition-colors"
                  onClick={() => !alreadySigned && setFormOpen(!formOpen)}
                  disabled={alreadySigned}
                >
                  <span className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
                    {alreadySigned ? <CheckCircle2 size={16} className="text-green-400" /> : <PenLine size={16} />}
                    {alreadySigned ? "Petycja podpisana" : "Podpisz petycję"}
                  </span>
                  {!alreadySigned && (formOpen
                    ? <ChevronUp size={16} className="text-slate-400" />
                    : <ChevronDown size={16} className="text-slate-400" />
                  )}
                </button>

                {/* Already signed */}
                {alreadySigned && (
                  <div className="bg-slate-900 px-4 pt-5 pb-4 flex flex-col items-center gap-2 text-center">
                    <CheckCircle2 size={36} className="text-green-400" />
                    <p className="text-white font-bold">Dziękujemy za podpis!</p>
                    <p className="text-slate-400 text-sm">Możesz też wesprzeć działalność fundacji darowizną.</p>
                  </div>
                )}

                {/* Form */}
                {formOpen && !alreadySigned && (
                  <div className="px-4 py-4 bg-slate-900 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Imię *</label>
                        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Jan" />
                      </div>
                      <div>
                        <label className={labelCls}>Nazwisko *</label>
                        <input className={inputCls} value={surname} onChange={e => setSurname(e.target.value)} placeholder="Kowalski" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>E-mail *</label>
                      <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jan@example.com" />
                    </div>
                    <div>
                      <label className={labelCls}>Telefon</label>
                      <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="600000000" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Ulica / Wieś</label>
                        <input className={inputCls} value={address2} onChange={e => setAddress2(e.target.value)} placeholder="ul. Główna" />
                      </div>
                      <div>
                        <label className={labelCls}>Nr domu</label>
                        <input className={inputCls} value={address3} onChange={e => setAddress3(e.target.value)} placeholder="1a" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Kod pocztowy</label>
                        <input className={inputCls} value={postal} onChange={e => setPostal(e.target.value)} placeholder="00-000" />
                      </div>
                      <div>
                        <label className={labelCls}>Miejscowość</label>
                        <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="Warszawa" />
                      </div>
                    </div>

                    <button
                      onClick={handleSign}
                      disabled={!name || !surname || !email}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                      style={{ background: "linear-gradient(135deg, #92400e, #b45309)" }}
                    >
                      <PenLine size={16} />
                      Podpisz petycję
                    </button>

                    <p className="text-slate-600 text-[10px] text-center leading-relaxed">
                      Dane zostaną przekazane do polskakatolicka.org wyłącznie w celu zarejestrowania Twojego podpisu.
                    </p>
                  </div>
                )}
              </div>

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
