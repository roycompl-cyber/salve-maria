-- Zaplanowane powiadomienia push
create table if not exists public.scheduled_notifications (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  type         text not null default 'news',
  url          text default '',
  -- jednorazowe: send_at, cykliczne: cron_time + cron_days
  send_at      timestamptz,          -- jednorazowe
  cron_time    text,                 -- np. '15:00' dla codziennych
  cron_days    text[] default '{}',  -- ['mon','tue',...] lub ['*'] dla codziennych
  active       boolean default true,
  last_sent_at timestamptz,
  created_at   timestamptz default now()
);
alter table public.scheduled_notifications enable row level security;
create policy "sched_notif_admin" on public.scheduled_notifications for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Ustawienia aplikacji (klucz-wartość)
create table if not exists public.app_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);
alter table public.app_settings enable row level security;
create policy "settings_read_all"  on public.app_settings for select using (true);
create policy "settings_write_admin" on public.app_settings for all
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Domyślne ustawienia
insert into public.app_settings (key, value) values
  ('contact_email',        'kontakt@skargi.pl'),
  ('contact_thanks_msg',   'Dziękujemy za wiadomość. Odpiszemy najszybciej jak to możliwe.'),
  ('contact_topics',       'Pytanie ogólne,Wsparcie finansowe,Petycje,Modlitwa wstawiennicza,Inne')
on conflict (key) do nothing;

-- Wiadomości z komunikatora
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null,
  message    text not null,
  read       boolean default false,
  created_at timestamptz default now()
);
alter table public.contact_messages enable row level security;
create policy "contact_insert_all" on public.contact_messages for insert with check (true);
create policy "contact_read_admin" on public.contact_messages for select
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "contact_update_admin" on public.contact_messages for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
