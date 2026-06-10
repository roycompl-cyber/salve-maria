-- Run this in Supabase SQL Editor

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  role text default 'donor' check (role in ('donor', 'admin')),
  full_name text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Push subscriptions
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  prayer_reminder_enabled boolean default false,
  prayer_reminder_time text default '07:00',
  news_notifications boolean default true,
  action_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- Articles (optional — can use mock data first)
create table if not exists public.articles (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  excerpt text,
  content text not null,
  image_url text,
  category text not null,
  author text not null,
  published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now()
);

alter table public.articles enable row level security;

create policy "Anyone can read published articles"
  on public.articles for select
  using (published = true);

create policy "Admins can manage articles"
  on public.articles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Prayers catalog
create table if not exists public.prayers (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  category text not null,
  language text default 'pl' check (language in ('pl', 'la', 'en')),
  tags text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.prayers enable row level security;

create policy "Authenticated users can read prayers"
  on public.prayers for select
  using (auth.role() = 'authenticated');

-- Donations log (without sensitive payment data)
create table if not exists public.donation_intents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  amount_pln numeric not null,
  frequency text default 'one_time' check (frequency in ('one_time', 'monthly')),
  campaign_id uuid,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.donation_intents enable row level security;

create policy "Users can see own donations"
  on public.donation_intents for select
  using (auth.uid() = user_id);

create policy "Users can create donations"
  on public.donation_intents for insert
  with check (auth.uid() = user_id);
