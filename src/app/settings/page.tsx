"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { CheckCircle2, Loader2, User, Phone, MapPin, Mail, Lock, Eye, EyeOff, Bell, Palette, ShieldCheck } from "lucide-react";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { urlBase64ToUint8Array } from "@/lib/utils";
import { useAppearance, type FontSize } from "@/hooks/useAppearance";

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

function Field({ label, value, onChange, type = "text", placeholder, maxLength, required, icon }: FieldProps) {
  return (
    <div>
      <label className="block text-slate-300 text-xs font-medium mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-600 transition-colors"
          style={{ paddingLeft: icon ? "2.5rem" : "1rem", paddingRight: "1rem" }}
        />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, fetch, update } = useProfile();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street: "",
    house_no: "",
    postal: "",
    city: "",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Zmiana hasła
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Powiadomienia push
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushError, setPushError] = useState("");
  const [activeSection, setActiveSection] = useState<"profile" | "appearance" | "notifications" | "security">("profile");

  const { colorTheme, fontSize, brightness, setColorTheme, setFontSize, setBrightness } = useAppearance();
  const isFirstTime = !profile?.profile_complete;
  const initials = `${profile?.first_name?.[0] ?? user?.email?.[0] ?? "S"}${profile?.last_name?.[0] ?? ""}`.toUpperCase();

  // Sprawdź stan subskrypcji push
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;
    setPushSupported(true);
    navigator.serviceWorker.getRegistrations().then(regs => {
      const reg = regs[0];
      if (!reg) return;
      reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) fetch(user.id);
  }, [user, fetch]);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        phone: profile.phone ?? "",
        street: profile.street ?? "",
        house_no: profile.house_no ?? "",
        postal: profile.postal ?? "",
        city: profile.city ?? "",
      });
    }
  }, [profile]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  function validatePhone(p: string) {
    return /^\d{9}$/.test(p.replace(/\s/g, ""));
  }

  function validatePostal(p: string) {
    return /^\d{2}-\d{3}$/.test(p);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validatePhone(form.phone)) {
      setError("Numer telefonu musi mieć dokładnie 9 cyfr.");
      return;
    }
    if (form.postal && !validatePostal(form.postal)) {
      setError("Kod pocztowy musi być w formacie XX-XXX.");
      return;
    }

    setSaving(true);
    const err = await update(form);
    setSaving(false);

    if (err) {
      setError(err);
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    if (isFirstTime) {
      router.push("/");
    }
  }

  async function handleTogglePush() {
    setPushLoading(true);
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      const reg = regs[0];
      if (!reg) {
        setPushSupported(false);
        setPushLoading(false);
        return;
      }

      const existing = await reg.pushManager.getSubscription();

      if (existing) {
        // Wyłącz
        await existing.unsubscribe();
        await window.fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        setPushEnabled(false);
      } else {
        // Włącz — poproś o zgodę
        const perm = Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
        if (perm !== "granted") {
          setPushLoading(false);
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        });
        await window.fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: sub,
            settings: {
              news_notifications: true,
              action_notifications: true,
              prayer_reminder_enabled: false,
              prayer_reminder_time: "07:00",
            },
          }),
        });
        setPushEnabled(true);
      }
    } catch (e) {
      setPushError(e instanceof Error ? e.message : String(e));
    }
    setPushLoading(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(""); setPwdSaved(false);
    if (pwdForm.next.length < 8) { setPwdError("Hasło musi mieć co najmniej 8 znaków."); return; }
    if (pwdForm.next !== pwdForm.confirm) { setPwdError("Hasła nie są identyczne."); return; }
    setPwdSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pwdForm.next });
    setPwdSaving(false);
    if (error) { setPwdError(error.message); return; }
    setPwdSaved(true);
    setPwdForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setPwdSaved(false), 3000);
  }

  return (
    <AppShell skipProfileGuard>
      <div className="max-w-lg md:max-w-3xl mx-auto px-4 md:px-8 py-4 md:py-7 space-y-5 animate-fade-in">
        {/* Header */}
        <div className="settings-hero overflow-hidden rounded-3xl border border-amber-700/25 bg-slate-800/60">
          <div className="p-5 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-yellow-100 border border-yellow-700/30 shadow-lg"
              style={{ background: "linear-gradient(145deg,#7f1d1d,#b45309)" }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
          {isFirstTime ? (
            <>
              <h1 className="text-xl font-bold text-yellow-100" style={{ fontFamily: "Georgia, serif" }}>
                Uzupełnij swój profil
              </h1>
              <p className="text-slate-400 text-xs mt-1">Dokończ konfigurację, aby korzystać z aplikacji.</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white leading-tight break-words" style={{ fontFamily: "Georgia, serif" }}>
                <span className="block">{profile?.first_name}</span>
                <span className="block">{profile?.last_name}</span>
              </h1>
              <p className="text-slate-400 text-xs mt-1 truncate">{user?.email}</p>
            </>
          )}
            </div>
          </div>
          {!isFirstTime && (
            <div className="grid grid-cols-4 border-t border-slate-700/70 bg-slate-900/35">
              {([
                { key: "profile", label: "Profil", icon: <User size={17} /> },
                { key: "appearance", label: "Wygląd", icon: <Palette size={17} /> },
                { key: "notifications", label: "Alerty", icon: <Bell size={17} /> },
                { key: "security", label: "Hasło", icon: <ShieldCheck size={17} /> },
              ] as const).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`relative flex flex-col items-center gap-1 py-3 text-[11px] transition-colors ${
                    activeSection === item.key ? "text-yellow-300 bg-yellow-500/5" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {activeSection === item.key && <span className="absolute bottom-0 inset-x-3 h-0.5 rounded-full bg-yellow-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {(isFirstTime || activeSection === "profile") && (
        <section className="space-y-5 animate-fade-in">
        {/* Email (read-only) */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-800/30 p-4">
          <label className="block text-slate-300 text-xs font-medium mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
            Adres e-mail
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="email"
              value={user?.email ?? ""}
              readOnly
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Dane osobowe */}
          <div className="bg-slate-800/50 rounded-2xl p-4 space-y-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} /> Dane osobowe
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Imię"
                value={form.first_name}
                onChange={set("first_name")}
                placeholder="Jan"
                required
              />
              <Field
                label="Nazwisko"
                value={form.last_name}
                onChange={set("last_name")}
                placeholder="Kowalski"
                required
              />
            </div>
            <Field
              label="Telefon komórkowy"
              value={form.phone}
              onChange={(v) => set("phone")(v.replace(/[^\d\s]/g, "").slice(0, 11))}
              type="tel"
              placeholder="123456789"
              maxLength={9}
              required
              icon={<Phone size={15} />}
            />
          </div>

          {/* Adres */}
          <div className="bg-slate-800/50 rounded-2xl p-4 space-y-4">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} /> Adres zamieszkania
            </p>
            <Field
              label="Ulica / Wieś"
              value={form.street}
              onChange={set("street")}
              placeholder="ul. Kwiatowa"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Nr domu / mieszkania"
                value={form.house_no}
                onChange={set("house_no")}
                placeholder="12a/3"
                required
              />
              <Field
                label="Kod pocztowy"
                value={form.postal}
                onChange={(v) => {
                  const digits = v.replace(/\D/g, "").slice(0, 5);
                  set("postal")(digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits);
                }}
                placeholder="00-000"
                required
              />
            </div>
            <Field
              label="Miejscowość"
              value={form.city}
              onChange={set("city")}
              placeholder="Warszawa"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-2xl font-bold text-base text-white transition-all flex items-center justify-center gap-2.5 shadow-lg"
            style={{ background: saving || saved ? undefined : "linear-gradient(135deg, #7f1d1d, #b45309)", backgroundColor: saved ? "#166534" : saving ? "#334155" : undefined }}
          >
            {saved ? (
              <><CheckCircle2 size={20} /> Zapisano!</>
            ) : saving ? (
              <><Loader2 size={20} className="animate-spin" /> Zapisywanie...</>
            ) : (
              isFirstTime ? "Zapisz i przejdź do aplikacji" : "Zapisz zmiany"
            )}
          </button>
        </form>
        </section>
        )}

        {/* Wygląd */}
        {!isFirstTime && activeSection === "appearance" && (
          <section className="bg-slate-800/50 rounded-3xl p-5 space-y-6 border border-slate-700 animate-fade-in">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Icon name="palette" size={12} /> Wygląd
            </p>

            {/* Motyw kolorystyczny */}
            <div>
              <p className="text-slate-300 text-sm mb-3">Motyw kolorystyczny</p>
              <div className="grid grid-cols-2 gap-2.5">
                {([
                  {
                    key: "klasyczny",
                    label: "Klasyczny",
                    desc: "Granatowy + amber",
                    swatch: ["#0f172a", "#1e293b", "#d97706"],
                  },
                  {
                    key: "morski",
                    label: "Morski",
                    desc: "Ocean + błękit",
                    swatch: ["#041d2e", "#092d47", "#0ea5e9"],
                  },
                  {
                    key: "bordo",
                    label: "Bordo",
                    desc: "Wino + róż",
                    swatch: ["#160710", "#260c1b", "#e11d48"],
                  },
                  {
                    key: "nocny",
                    label: "Nocny",
                    desc: "OLED + indygo",
                    swatch: ["#000000", "#111111", "#818cf8"],
                  },
                ] as { key: import("@/hooks/useAppearance").ColorTheme; label: string; desc: string; swatch: string[] }[]).map(({ key, label, desc, swatch }) => (
                  <button
                    key={key}
                    onClick={() => setColorTheme(key)}
                    className={`flex flex-col gap-2 p-3 rounded-2xl border-2 transition-all text-left ${
                      colorTheme === key
                        ? "border-yellow-500 bg-yellow-500/5"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    {/* Swatch */}
                    <div className="flex gap-1 items-center">
                      <span className="w-7 h-7 rounded-lg flex-shrink-0" style={{ backgroundColor: swatch[0], border: `2px solid ${swatch[2]}33` }}/>
                      <span className="w-5 h-5 rounded-md flex-shrink-0" style={{ backgroundColor: swatch[1] }}/>
                      <span className="w-3 h-3 rounded-full flex-shrink-0 ml-0.5" style={{ backgroundColor: swatch[2] }}/>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white leading-none">{label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                    </div>
                    {colorTheme === key && (
                      <span className="text-[10px] text-yellow-400 font-medium">Aktywny</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Jasność */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-slate-300 text-sm flex items-center gap-1.5">
                  <span className="text-base">☀️</span>
                  Jasność
                </p>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#f59e0b" }}>
                  {brightness}%
                </span>
              </div>
              {/* Suwak */}
              <div className="relative">
                <input
                  type="range"
                  min={0} max={100} step={5}
                  value={brightness}
                  onChange={e => setBrightness(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #d97706 0%, #d97706 ${brightness}%, #334155 ${brightness}%, #334155 100%)`,
                    WebkitAppearance: "none",
                  }}
                />
              </div>
              {/* Etykiety osi */}
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-500">Domyślna</span>
                {[25, 50, 75].map(v => (
                  <button key={v} onClick={() => setBrightness(v)}
                    className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors">{v}%</button>
                ))}
                <span className="text-[10px] text-slate-500">Max</span>
              </div>
              {brightness > 0 && (
                <button onClick={() => setBrightness(0)}
                  className="mt-2 text-xs text-slate-500 hover:text-amber-400 transition-colors underline underline-offset-2">
                  Przywróć domyślną
                </button>
              )}
            </div>

            {/* Rozmiar czcionki */}
            <div>
              <p className="text-slate-300 text-sm mb-2 flex items-center gap-1.5"><Icon name="type" size={14} /> Rozmiar tekstu</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { key: "small",  label: "Mały",   size: "text-xs" },
                  { key: "medium", label: "Średni", size: "text-sm" },
                  { key: "large",  label: "Duży",   size: "text-base" },
                ] as { key: FontSize; label: string; size: string }[]).map(({ key, label, size }) => (
                  <button
                    key={key}
                    onClick={() => setFontSize(key)}
                    className={`py-3 rounded-xl border-2 transition-all ${
                      fontSize === key ? "border-yellow-500 bg-yellow-500/10 text-yellow-300" : "border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className={`${size} font-medium`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Powiadomienia push */}
        {!isFirstTime && activeSection === "notifications" && (
          <section className="bg-slate-800/50 rounded-3xl p-5 border border-slate-700 animate-fade-in">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Icon name="bell" size={12} /> Powiadomienia push
            </p>
            {pushError && (
              <p className="text-red-400 text-xs mb-2 break-all">{pushError}</p>
            )}
            {!pushSupported ? (
              <p className="text-slate-400 text-sm">
                Powiadomienia push działają tylko po zainstalowaniu aplikacji na ekranie głównym telefonu.{" "}
                <span className="text-yellow-500">Dodaj aplikację do ekranu głównego i wróć tutaj.</span>
              </p>
            ) : (
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-white text-sm font-medium">Otrzymuj powiadomienia od Fundacji</p>
                  <p className="text-slate-400 text-xs mt-0.5">Aktualności, petycje, przypomnienia o modlitwie</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pushLoading && <Loader2 size={14} className="text-slate-400 animate-spin" />}
                  <button
                    type="button"
                    onClick={handleTogglePush}
                    disabled={pushLoading}
                    style={{ width: 52, height: 28, borderRadius: 14, flexShrink: 0, position: "relative", transition: "background 0.2s", background: pushEnabled ? "#991b1b" : "#475569" }}
                  >
                    <span style={{
                      position: "absolute",
                      top: 3, left: pushEnabled ? 27 : 3,
                      width: 22, height: 22,
                      borderRadius: "50%",
                      background: "#fff",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      transition: "left 0.2s",
                      display: "block",
                    }} />
                  </button>
                </div>
              </label>
            )}
          </section>
        )}

        {/* Zmiana hasła */}
        {!isFirstTime && activeSection === "security" && (
          <form onSubmit={handlePasswordChange} className="space-y-4 animate-fade-in">
            <div className="bg-slate-800/50 rounded-3xl p-5 space-y-4 border border-slate-700">
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={12} /> Zmiana hasła
              </p>

              {["next", "confirm"].map((field) => (
                <div key={field}>
                  <label className="block text-slate-300 text-xs font-medium mb-1.5" style={{ fontFamily: "Georgia, serif" }}>
                    {field === "next" ? "Nowe hasło" : "Powtórz nowe hasło"}
                    <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={pwdForm[field as "next" | "confirm"]}
                      onChange={e => setPwdForm(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={field === "next" ? "Min. 8 znaków" : "Powtórz hasło"}
                      required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-yellow-600 transition-colors"
                    />
                    {field === "confirm" && (
                      <button
                        type="button"
                        onClick={() => setShowPwd(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {pwdError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{pwdError}</div>
              )}
              {pwdSaved && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> Hasło zostało zmienione.
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={pwdSaving}
              className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg"
              style={{ background: pwdSaving ? "#334155" : "linear-gradient(135deg, #1e3a5f, #1e40af)" }}
            >
              {pwdSaving ? <><Icon name="loader" size={18} className="animate-spin" /> Zmiana hasła…</> : <><Icon name="lock" size={18} /> Zmień hasło</>}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
