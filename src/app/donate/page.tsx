"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useLocale } from "@/hooks/useLocale";
import { mockCampaigns } from "@/lib/mock-data";
import { formatCurrency, progressPercent, daysLeft } from "@/lib/utils";
import { Heart, CreditCard, Building2, Smartphone, CheckCircle2, Lock } from "lucide-react";

const PRESET_AMOUNTS = [20, 50, 100, 200, 500];

export default function DonatePage() {
  const { t } = useLocale();
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [frequency, setFrequency] = useState<"one_time" | "monthly">("one_time");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | "blik">("card");
  const [success, setSuccess] = useState(false);

  const finalAmount = isCustom ? parseFloat(customAmount) || 0 : amount;

  function handleDonate() {
    if (finalAmount < 1) return;
    setSuccess(true);
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white">{t("donate.title")}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{t("donate.subtitle")}</p>
        </div>

        {/* Success */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={24} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-semibold">{t("donate.thank_you")}</p>
              <p className="text-green-300 text-xs mt-0.5">Twoja darowizna: {formatCurrency(finalAmount)}</p>
            </div>
          </div>
        )}

        {/* Frequency toggle */}
        <div className="flex bg-slate-800 rounded-xl p-1">
          {(["one_time", "monthly"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                frequency === f ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t(`donate.${f}`)}
            </button>
          ))}
        </div>

        {/* Amount presets */}
        <div>
          <p className="text-slate-300 text-sm font-medium mb-3">{t("donate.choose_amount")}</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESET_AMOUNTS.slice(0, 5).map((preset) => (
              <button
                key={preset}
                onClick={() => { setAmount(preset); setIsCustom(false); setCustomAmount(""); }}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  !isCustom && amount === preset
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {preset} zł
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                isCustom ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Inna
            </button>
          </div>
          {isCustom && (
            <div className="relative">
              <input
                type="number"
                placeholder={t("donate.enter_amount")}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min="1"
                className="w-full bg-slate-800 border border-blue-500 rounded-xl py-3 px-4 pr-12 text-white placeholder-slate-500 focus:outline-none text-center text-lg font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">zł</span>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div>
          <p className="text-slate-300 text-sm font-medium mb-3">Metoda płatności</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "card" as const, icon: CreditCard, label: t("donate.card") },
              { key: "blik" as const, icon: Smartphone, label: t("donate.blik") },
              { key: "transfer" as const, icon: Building2, label: t("donate.transfer") },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all ${
                  paymentMethod === key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Transfer details */}
        {paymentMethod === "transfer" && (
          <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-slate-300 text-xs font-medium">{t("donate.account_number")}</p>
            <p className="text-white font-mono text-sm bg-slate-700 rounded-lg px-3 py-2">
              PL 12 3456 7890 1234 5678 9012 3456
            </p>
            <p className="text-slate-400 text-xs">Tytuł przelewu: DAROWIZNA {finalAmount} PLN</p>
          </div>
        )}

        {/* Donate button */}
        {paymentMethod !== "transfer" && (
          <button
            onClick={handleDonate}
            disabled={finalAmount < 1}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-lg"
          >
            <Heart size={20} fill="white" />
            {t("donate.donate_button")} {finalAmount > 0 ? `— ${formatCurrency(finalAmount)}` : ""}
          </button>
        )}

        <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs">
          <Lock size={12} />
          {t("donate.secure")}
        </div>

        {/* Active campaigns */}
        <div>
          <h2 className="text-white font-bold text-base mb-3">{t("donate.campaigns")}</h2>
          <div className="space-y-3">
            {mockCampaigns.map((campaign) => {
              const pct = progressPercent(campaign.current_amount, campaign.goal_amount);
              return (
                <div key={campaign.id} className="bg-slate-800 rounded-2xl p-4">
                  <h3 className="text-white font-semibold text-sm">{campaign.title}</h3>
                  <p className="text-slate-400 text-xs mt-1">{campaign.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white font-medium">{formatCurrency(campaign.current_amount)}</span>
                      <span className="text-slate-400">{t("donate.goal")}: {formatCurrency(campaign.goal_amount)}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="text-blue-400 font-medium">{pct}% celu</span>
                      {campaign.ends_at && (
                        <span className="text-orange-400">{daysLeft(campaign.ends_at)} {t("donate.days_left")}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { setAmount(50); setIsCustom(false); }}
                    className="mt-3 w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium py-2 rounded-xl transition-colors"
                  >
                    {t("donate.support_campaign")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
