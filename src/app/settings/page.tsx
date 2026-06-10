"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { CheckCircle2, Loader2, User, Phone, MapPin, Mail } from "lucide-react";

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

  const isFirstTime = !profile?.profile_complete;

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

  return (
    <AppShell skipProfileGuard>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5 animate-fade-in">
        {/* Header */}
        <div>
          {isFirstTime ? (
            <>
              <h1 className="text-xl font-bold text-yellow-200" style={{ fontFamily: "Georgia, serif" }}>
                Uzupełnij swój profil
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Prosimy o podanie danych przed skorzystaniem z aplikacji.
                Są one potrzebne do wystawiania poświadczeń darowizn.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
                Mój profil
              </h1>
              <p className="text-slate-400 text-sm mt-1">Twoje dane osobowe i adresowe</p>
            </>
          )}
        </div>

        {/* Email (read-only) */}
        <div>
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
      </div>
    </AppShell>
  );
}
