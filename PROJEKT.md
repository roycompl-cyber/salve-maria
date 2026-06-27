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
- **Zewnętrzne API**: polskakatolicka.org (artykuły, petycje) — scraping HTML, cache w Supabase `content_cache`
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
| `app_settings` | Konfiguracja globalna | `key`, `value` (JSON string) — patrz lista kluczy poniżej |
| `scheduled_notifications` | Zaplanowane powiadomienia push | `cron_time`, `cron_days`, `send_at`, `active` |
| `push_log` | Historia wysłanych push | `title`, `body`, `type`, `sent_at` |
| `content_cache` | Cache wielofunkcyjny | `key`, `data` (JSONB). Klucze: `"articles"`, `"petitions"`, `"error_log"`, `"stats_YYYY-MM-DD"` |

### Klucze app_settings

| Klucz | Typ wartości | Opis |
|-------|-------------|------|
| `tiles_config` | `Record<mod, {order,hidden,label,colorPreset}>` | Układ kafelków strony głównej |
| `superadmin_ids` | `string[]` | User IDs z prawami superadmina (ponad CHECK constraint) |
| `admin_groups` | `AdminGroup[]` | Role adminów: `{id, name, permissions: TileKey[]}` |
| `admin_group_members` | `Record<groupId, userId[]>` | Przypisanie userów do ról adminów |
| `admin_tile_permissions` | `Record<TileKey, groupId[]>` | Które role mają dostęp do kafelka w panelu |
| `plinio_quote_overrides` | `Record<day, {quote, source}>` | Nadpisania cytatów Plinio (dzień 1–364) |
| `plinio_config` | `{pageTitle, pageSubtitle, authorBio}` | Konfiguracja strony Myśl na dziś |
| `catechism_qa_overrides` | `Record<"chapterId_n", {q, a}>` | Nadpisania Q&A katechizmu (np. `"I_1"`) |
| `catechism_config` | `{pageTitle, pageSubtitle, introQuote, introText, introFooter}` | Konfiguracja strony Katechizm |
| `civilitas_config` | `{pageTitle, pageSubtitle, intro, conclusion}` | Konfiguracja strony savoir-vivre |
| `civilitas_section_overrides` | `Record<sectionNum, string>` | Nadpisania treści sekcji poradnika (np. `"I"`) w formacie markdown-like |

### Ważne ograniczenia
- `profiles.role` — CHECK constraint: **tylko** `"admin"` lub `"donor"` (nie `"user"`!)
- `profiles` — **brak** kolumny `updated_at`
- `tiles_config` — klucze muszą być nazwami modułów, nie liczbami (zabezpieczenie w API `VALID_MODS`)

### Moduły kafelków (nazwy kluczy)
`prayers`, `gospel`, `catechism`, `petitions`, `articles`, `announcements`, `chat`, `reminders`, `savoir`, `about`, `watch`, `book`, `plinio`, `share`

### ALL_TILE_KEYS (uprawnienia panelu admina)
`src/lib/admin-permissions.ts` — lista sekcji panelu, do których można przypisać uprawnienia ról:
`notifications`, `messages`, `users`, `prayers`, `tiles`, `modules`, `plinio`, `catechism`, `civilitas`, `referral`, `bypass`, `settings`, `stats`, `errors`, `login`

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
│   │   ├── admin/page.tsx              ← Panel administracyjny (DUŻY plik — wszystkie sekcje)
│   │   ├── reminders/page.tsx          ← Ustawienia przypomnień modlitewnych
│   │   ├── settings/page.tsx           ← Profil, wygląd, push, hasło
│   │   ├── login/page.tsx              ← Logowanie (hasło / magic link / reset)
│   │   ├── plinio/page.tsx             ← Myśl na dziś (cytat Plinio Corrêa de Oliveira)
│   │   ├── catechism/page.tsx          ← Katechizm kard. Gasparriego (Q&A, wyszukiwanie)
│   │   ├── savoir-vivre/page.tsx       ← Civilitas — poradnik etykiety (23 sekcje)
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── tiles/              ← GET/POST konfiguracji kafelków (filtr VALID_MODS)
│   │   │   │   ├── users/              ← GET/POST/PATCH/DELETE użytkowników
│   │   │   │   ├── users/[id]/         ← PUT edycja, DELETE usuwa auth + profil
│   │   │   │   ├── users/reset-password/ ← POST wysyła e-mail resetowania hasła
│   │   │   │   ├── errors/             ← DELETE czyści error_log
│   │   │   │   ├── stats/              ← GET statystyki odwiedzin
│   │   │   │   ├── prayers/            ← Lista modlitw
│   │   │   │   ├── settings/           ← Ustawienia kontaktu
│   │   │   │   ├── plinio/             ← GET/POST/DELETE cytatów i config Plinio
│   │   │   │   ├── catechism/          ← GET/POST/DELETE Q&A overrides i config Katechizmu
│   │   │   │   └── civilitas/          ← GET/POST/DELETE sekcji i config Civilitas
│   │   │   ├── plinio/                 ← GET publiczny: cytat na dziś + config
│   │   │   ├── catechism/              ← GET publiczny: config + qaOverrides
│   │   │   ├── civilitas/              ← GET publiczny: config + sectionOverrides
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
│   │   └── Icon.tsx                    ← Własne SVG ikony (nie Lucide) dla głównych elementów
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
│       ├── security.ts                 ← getEffectiveRole (superadmin via app_settings), requireAdmin, rateLimit
│       ├── admin-permissions.ts        ← ALL_TILE_KEYS, AdminGroup type
│       ├── plinio-quotes.ts            ← 364 cytaty Plinio (hardcoded, overrides z DB)
│       ├── civilitas-sections.ts       ← 23 sekcje poradnika, blocksToText/textToBlocks
│       └── supabase/                   ← Klienty Supabase (server/client)
├── public/
│   ├── katechizm.json                  ← Dane Q&A katechizmu (statyczny plik JSON)
│   ├── sw-custom.js                    ← SW: cache statyczne, push handler, notificationclick→postMessage
│   ├── fanfare.wav                     ← Fanfara maryjna (3.84s, 44100Hz mono)
│   └── manifest.json                   ← PWA manifest (osobne wpisy "any" i "maskable" dla ikon)
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

### Sekcje panelu (section state)
- **Ogłoszenia** (`notifications`) — push natychmiastowy i zaplanowany
- **Wiadomości** (`messages`) — komunikator z użytkownikami
- **Użytkownicy** (`users`) — lista, dodawanie (inline form), edycja (inline form), reset hasła, usuwanie
- **Modlitwy** (`prayers`) — zarządzanie modlitewnikiem
- **Kafelki** (`tiles`) — kolejność, etykiety, widoczność, kolor — efekt widoczny na stronie głównej
- **Myśl na dziś** (`plinio`) — tab "Cytaty" (edycja/przywracanie per dzień 1–364) + tab "Treści strony"
- **Katechizm** (`catechism`) — tab "Q&A" (edycja per rozdział/pytanie) + tab "Treści strony"
- **Civilitas** (`civilitas`) — tab "Treści strony" (wstęp, zakończenie) + tab "Sekcje" (edycja 23 sekcji)
- **Dostęp adminów** (`access`) — role (dawne grupy) + przypisanie uprawnień do sekcji panelu
- **Ustawienia** (`settings`) — dane kontaktowe fundacji
- **Statystyki** (`stats`) — odwiedziny per URL per dzień
- **Błędy** (`errors`) — ostatnie 100 błędów JS klientów

### System ról adminów
- Superadmin: user ID w `app_settings['superadmin_ids']` → `getEffectiveRole()` zwraca `"superadmin"`
- Admin: `profiles.role === "admin"` (CHECK constraint: tylko `"admin"` lub `"donor"`)
- Role (grupy): tworzone w sekcji "Dostęp adminów", przechowywane w `admin_groups`
- Uprawnienia: które role widzą które sekcje panelu (`admin_tile_permissions`)
- Funkcja `getEffectiveRole(userId, dbRole)` w `src/lib/security.ts`

### Palety kolorów kafelków
12 presetów: `red`, `blue`, `violet`, `green`, `teal`, `orange`, `indigo`, `yellow`, `purple`, `sage`, `rose`, `pink`

### Edycja treści modułów
Każdy z modułów Plinio / Katechizm / Civilitas ma:
- Publiczne API (`/api/plinio`, `/api/catechism`, `/api/civilitas`) — bez auth, zwraca dane + overrides
- Prywatne API (`/api/admin/plinio` itd.) — wymaga roli admin
- Dane domyślne hardcoded w lib (`plinio-quotes.ts`, `katechizm.json`, `civilitas-sections.ts`)
- Overrides w `app_settings` — nadpisują domyślne bez zmiany kodu

### Format treści sekcji Civilitas (civilitas-sections.ts)
```
## Nagłówek H3
- punkt listy nieuporządkowanej
1. punkt listy numerowanej
> linia cytatu
zwykły tekst = akapit
```
Funkcje `blocksToText()` i `textToBlocks()` konwertują między tym formatem a typowanymi blokami.

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

## Obrazki artykułów i petycji

Obrazki ładowane z `polskakatolicka.org` wymagają `referrerPolicy="no-referrer"` na tagach `<img>`.
Serwis ma hotlinking protection — blokuje requesty z obcym nagłówkiem `Referer`.
Dotyczy: `src/app/page.tsx`, `src/app/articles/page.tsx`, `src/app/petitions/page.tsx`.

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
