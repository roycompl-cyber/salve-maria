-- Zdjęcia z kampanii nadsyłane przez userów (billboardy, wolontariusze, demonstracje)
create table if not exists public.campaign_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  image_path  text not null,        -- ścieżka w bucket "campaign-photos"
  category    text not null default 'inne',  -- billboard | wolontariat | demonstracja | inne
  caption     text,
  status      text not null default 'pending', -- pending | approved | rejected
  created_at  timestamptz default now(),
  reviewed_at timestamptz
);
alter table public.campaign_photos enable row level security;

-- User widzi tylko swoje zdjęcia (każdy status), admin widzi wszystko
create policy "campaign_photos_select_own" on public.campaign_photos for select
  using (auth.uid() = user_id or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Zalogowany user może wstawić zdjęcie tylko jako siebie, ze statusem pending
create policy "campaign_photos_insert_own" on public.campaign_photos for insert
  with check (auth.uid() = user_id and status = 'pending');

-- Tylko admin może zmieniać status / usuwać
create policy "campaign_photos_update_admin" on public.campaign_photos for update
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "campaign_photos_delete_admin" on public.campaign_photos for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Bucket na zdjęcia (prywatny — dostęp tylko przez podpisane URL-e z API)
insert into storage.buckets (id, name, public)
values ('campaign-photos', 'campaign-photos', false)
on conflict (id) do nothing;

-- Zalogowany user może wgrywać pliki tylko do własnego podkatalogu {user_id}/...
create policy "campaign_photos_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'campaign-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Odczyt plików tylko przez service role (API generuje podpisane URL-e) — brak policy dla anon/authenticated select
create policy "campaign_photos_storage_admin_all" on storage.objects for all
  using (
    bucket_id = 'campaign-photos'
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
