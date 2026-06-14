# Salve Maria — Dokumentacja projektu

## Linki

| Zasób | URL |
|-------|-----|
| Aplikacja (produkcja) | https://salve-maria.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/agkkluoyzmoqjspeyxep |
| Vercel Dashboard | https://vercel.com/robert-s-projectos/salve-maria |
| Repozytorium kodu | /Users/admin/fundacja-pwa |

---

## Stack techniczny

- **Framework**: Next.js 16 (App Router), TypeScript
- **Baza danych**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel (plan Hobby)
- **Stylowanie**: Tailwind CSS
- **Push notifications**: Web Push API (VAPID) + `web-push` npm
- **PWA**: Service Worker (`public/sw-custom.js`), manifest (`public/manifest.json`)
- **Zewnętrzne API**: polskakatolicka.pl (artykuły, petycje)
- **TTS**: Web Speech API (`ArticlePlayer` — czytanie modlitw i artykułów)

---

## Zmienne środowiskowe (.env.local i Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://agkkluoyzmoqjspeyxep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPzHQ4IqmL-SmQQIwop0WT-MBjGEyECMJzCyriuQSBr68h8...
VAPID_PRIVATE_KEY=LwIiprXQrQwBjU4DPJSp0LVH7ZFsVF2WMSa4uw3sIvI
CRON_SECRET=salve-maria-cron-2026
```

> Pełne wartości w pliku `/Users/admin/fundacja-pwa/.env.local`
> Te same muszą być ustawione w Vercel → Settings → Environment Variables

---

## Baza danych Supabase

### Tabele

| Tabela | Opis | Kluczowe kolumny |
|--------|------|-----------------|
| `profiles` | Dane użytkowników | `id`, `role` (tylko `"admin"` lub `"donor"`!), `first_name`, `last_name`, `phone`, `street`, `house_no`, `postal`, `city`, `profile_complete` |
| `push_subscriptions` | Subskrypcje Web Push | `endpoint`, `p256dh`, `auth`, `reminder_config` (JSONB), `reminder_fired` (JSONB), `news_notifications`, `action_notifications` |
| `app_settings` | Konfiguracja globalna | `key`, `value` (JSON string). Klucz `tiles_config` = układ kafelków |
| `scheduled_notifications` | Zaplanowane powiadomienia push | `cron_time`, `cron_days`, `send_at`, `active` |
| `push_log` | Historia wysłanych push | `title`, `body`, `type`, `sent_at` |
| `content_cache` | Cache wielofunkcyjny | `key`, `data` (JSONB). Klucze: `"articles"`, `"petitions"`, `"error_log"`, `"stats_YYYY-MM-DD"` |

### Ważne ograniczenia
- `profiles.role` — CHECK constraint: **tylko** `"admin"` lub `"donor"` (nie `"user"`!)
- `profiles` — **brak** kolumny `updated_at`
- `tiles_config` — klucze muszą być nazwami modułów, nie liczbami (zabezpieczenie w API `VALID_MODS`)

### Moduły kafelków (nazwy kluczy)
`prayers`, `gospel`, `catechism`, `petitions`, `articles`, `announcements`, `chat`, `reminders`, `savoir`, `about`, `watch`, `book`

### Cron w Supabase (pg_cron)
Przypomnienia modlitewne co minutę:
```sql
-- Sprawdź aktualny job:
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'prayer-reminders';

-- Jeśli trzeba ponownie ustawić:
SELECT cron.schedule(
  'prayer-reminders',
  '* * * * *',
  $$
  SELECT net.http_get(
    url     := 'https://salve-maria.vercel.app/api/cron/reminders',
    headers := '{"Authorization": "Bearer salve-maria-cron-2026"}'::jsonb
  );
  $$
);

-- Usuń job:
SELECT cron.unschedule('prayer-reminders');
```

---

## Struktura plików

```
fundacja-pwa/
├── src/
│   ├── app/
│   │   ├── page.tsx                    ← Strona główna (kafelki z tilesConfig + artykuły/petycje)
│   │   ├── layout.tsx                  ← Root layout (AppearanceProvider)
│   │   ├── admin/page.tsx              ← Panel administracyjny
│   │   ├── reminders/page.tsx          ← Ustawienia przypomnień modlitewnych
│   │   ├── settings/page.tsx           ← Profil, wygląd, push, hasło
│   │   ├── login/page.tsx              ← Logowanie (hasło / magic link / reset)
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── tiles/              ← GET/POST konfiguracji kafelków (filtr VALID_MODS)
│   │   │   │   ├── users/              ← GET/POST/PATCH/DELETE użytkowników
│   │   │   │   ├── users/[id]/         ← DELETE usuwa auth + profil
│   │   │   │   ├── errors/             ← DELETE czyści error_log
│   │   │   │   ├── stats/              ← GET statystyki odwiedzin
│   │   │   │   ├── prayers/            ← Lista modlitw
│   │   │   │   └── settings/           ← Ustawienia kontaktu
│   │   │   ├── push/
│   │   │   │   ├── subscribe/          ← POST rejestracja / DELETE wyrejestrowanie
│   │   │   │   ├── send/               ← POST wysyłka push (admin)
│   │   │   │   └── reminders/          ← POST sync reminder_config do DB
│   │   │   ├── cron/
│   │   │   │   ├── push/               ← Cron 9:00 dzienny (Vercel): zaplanowane notyfikacje
│   │   │   │   └── reminders/          ← Cron minutowy (pg_cron): przypomnienia modlitewne
│   │   │   ├── errors/                 ← POST zapis błędu klienta
│   │   │   └── track/                  ← POST zliczanie odwiedzin
│   ├── components/
│   │   ├── AppShell.tsx                ← Auth guard, profile guard, error monitoring, SW rejestracja
│   │   ├── AppearanceProvider.tsx      ← Synchroniczny odczyt motywu/jasności (brak flash)
│   │   ├── PrayerReminderProvider.tsx  ← Alarmy modlitewne, SW postMessage listener
│   │   ├── PushOnboardingBanner.tsx    ← Baner push (pojawia się raz po zalogowaniu)
│   │   ├── InstallPrompt.tsx           ← Przewodnik instalacji PWA (iOS/Android)
│   │   ├── ArticlePlayer.tsx           ← TTS: czytanie modlitw/artykułów (PL + łacina→włoski)
│   │   ├── BottomNav.tsx
│   │   ├── TopBar.tsx
│   │   └── Icon.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                  ← Stan sesji Supabase
│   │   ├── useProfile.ts               ← Profil użytkownika (Zustand store)
│   │   ├── useAppearance.ts            ← Motyw, jasność, rozmiar czcionki
│   │   ├── useFavorites.ts             ← Ulubione modlitwy (localStorage, sync między kartami)
│   │   ├── useOfflineArticles.ts       ← Artykuły z cache (stale-while-revalidate)
│   │   ├── usePushAutoSubscribe.ts     ← Cicha re-subskrypcja gdy zgoda już udzielona
│   │   └── useLocale.ts                ← i18n (aktywny tylko PL)
│   └── lib/
│       ├── reminders.ts                ← Presety alarmów, AudioContext unlock, fanfara WAV
│       ├── error-monitoring.ts         ← sanitizeErrorReport, reportClientError
│       ├── security.ts                 ← adminClient, requireAdmin, rateLimit, warsawParts, isLastAdmin
│       └── supabase/                   ← Klienty Supabase (server/client)
├── public/
│   ├── sw-custom.js                    ← SW: cache statyczne, push handler, notificationclick→postMessage
│   ├── fanfare.wav                     ← Fanfara maryjna (3.84s, 44100Hz mono)
│   └── manifest.json                   ← PWA manifest
├── next.config.ts                      ← CSP, security headers, image domains
└── vercel.json                         ← Vercel crons (push 9:00 — backup dla pg_cron)
```

---

## Deployment

```bash
cd /Users/admin/fundacja-pwa

# Sprawdź TypeScript:
npx tsc --noEmit

# Build lokalny:
npm run build

# Deploy na produkcję:
npx vercel --prod
```

---

## Panel administracyjny

URL: https://salve-maria.vercel.app/admin
Wymaga konta z rolą `"admin"` w tabeli `profiles`.

### Sekcje panelu
- **Ogłoszenia** — push natychmiastowy i zaplanowany (cron lub jednorazowy)
- **Wiadomości** — komunikator z użytkownikami
- **Użytkownicy** — lista, dodawanie, edycja roli, usuwanie (usuwa auth + profil)
- **Modlitwy** — zarządzanie modlitewnikiem
- **Kafelki** — kolejność (`order`), etykiety, widoczność (`hidden`), kolor (`colorPreset`) — efekt widoczny na stronie głównej
- **Ustawienia kontaktu** — dane kontaktowe fundacji
- **Statystyki** — odwiedziny per URL per dzień
- **Błędy** — ostatnie 100 błędów JS klientów

### Palety kolorów kafelków
12 presetów: `red`, `blue`, `violet`, `green`, `teal`, `orange`, `indigo`, `yellow`, `purple`, `sage`, `rose`, `pink`

---

## System wyglądu

Konfiguracja w `localStorage`:
- `app_theme` — `"dark"` | `"light"`
- `app_font_size` — `"small"` | `"medium"` | `"large"` → `14px` | `16px` | `19px`
- `app_brightness` — `0–100` (suwak jasności/przyciemnienia)

`AppearanceProvider` (w `layout.tsx`) czyta wartości synchronicznie → brak flash motywu przy ładowaniu.
Filtr CSS `brightness()` na `.brightness-wrap` przez CSS variable `--app-b`.
Obrazy dostają kontr-filtr by nie duplikować efektu.

---

## Przypomnienia modlitewne — architektura

### Przepływ danych
1. Użytkownik ustawia alarm w `/reminders`
2. Config → `localStorage` + `POST /api/push/reminders` → `push_subscriptions.reminder_config`
3. **pg_cron** co minutę → `/api/cron/reminders` → sprawdza "due" (okno 10 min) → Web Push (VAPID)
4. OS dostarcza powiadomienie (działa przy wyłączonym ekranie)
5. Kliknięcie: app otwarta → SW `postMessage({type:"PRAYER_ALARM"})` → modal; app zamknięta → `openWindow(url)`
6. `PrayerReminderProvider` pokazuje modal z fanfarą + wibracją

### Ochrona przed duplikatami
- `reminder_fired` w DB — blokuje push z crona (format `{presetId: "Mon Jun 14 2026"}`)
- `salve_reminders_fired_v1` w localStorage — blokuje alarm w przeglądarce
- `alarmRef` w Provider — `check()` nie uruchamia się gdy modal jest widoczny
- `dismiss()` wywołuje `markFired()` — alarm nie wróci w ciągu dnia

### Presety
| ID | Tytuł | Godzina |
|----|-------|---------|
| `angelus-12` | Anioł Pański | 12:00 |
| `koronka-15` | Koronka do Miłosierdzia | 15:00 |
| `angelus-18` | Anioł Pański | 18:00 |
| `rozaniec-20` | Różaniec | 20:00 |
| `apel-21` | Apel Jasnogórski | 21:00 |
| `poranna-07` | Modlitwa poranna | 07:00 |
| `loretanska-maj` | Litania Loretańska | 18:00 (tylko maj) |
| `serce-czerwiec` | Litania do Serca | 18:00 (tylko czerwiec) |

### Test crona
```bash
curl -H "Authorization: Bearer salve-maria-cron-2026" \
  https://salve-maria.vercel.app/api/cron/reminders
```

---

## Onboarding push

`PushOnboardingBanner` w `AppShell` (tylko gdy `profile_complete === true`):

| `Notification.permission` | Zachowanie |
|---------------------------|-----------|
| `"default"` | Baner po 2.5s z przyciskami Włącz / Może później |
| `"granted"` | Cicha subskrypcja, baner się nie pokazuje |
| `"denied"` | Nic — system zablokował |

Klucz `salve_push_onboard_v1` w localStorage. Wartości: `"granted"`, `"denied"`, `"later"`, `"auto"`.

---

## Monitoring błędów

`AppShell` łapie `window.onerror` i `unhandledrejection` → `POST /api/errors`.
Sanityzacja: maskowane e-maile i parametry URL, max 500 znaków.
Bufor: 100 ostatnich błędów w `content_cache["error_log"]`.
Czyszczenie z panelu admina: `DELETE /api/admin/errors`.

---

## Statystyki odwiedzin

`POST /api/track` przy każdej zmianie ścieżki (w `AppShell`).
Klucz: `stats_2026-06-14`. Format: `{ "/prayers": { count: 42, title: "..." } }`.
Rate limit: 120 żądań/min/IP.

---

## Najczęstsze problemy

### Push nie dociera
1. `SELECT * FROM cron.job WHERE jobname = 'prayer-reminders';`
2. Test curl (patrz wyżej)
3. Sprawdź `reminder_config IS NOT NULL` w `push_subscriptions`
4. Subskrypcje wygasłe (410) są usuwane automatycznie

### Kafelki w złej kolejności
```sql
SELECT value FROM app_settings WHERE key = 'tiles_config';
```
Klucze muszą być nazwami modułów (strings), nie liczbami.

### Użytkownik wraca po usunięciu
`DELETE /api/admin/users/[id]` → `admin.auth.admin.deleteUser(id)` musi być wywołane.

### Alarmy wielokrotne
`markFired` + `reminder_fired` w DB blokują duplikaty. Po wyczyszczeniu danych — alarm odpali się raz (prawidłowe).

---

## Nowy wątek Claude — prompt startowy

```
Pracuję nad projektem Salve Maria — katolicka PWA (Next.js 16, Supabase, Vercel).
Kod: /Users/admin/fundacja-pwa
Produkcja: https://salve-maria.vercel.app
Dokumentacja: /Users/admin/fundacja-pwa/PROJEKT.md

Przeczytaj PROJEKT.md i powiedz co wiesz o projekcie zanim zaczniemy.
```
