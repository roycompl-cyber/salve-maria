-- Run in Supabase SQL Editor

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists phone      text,
  add column if not exists street     text,
  add column if not exists house_no   text,
  add column if not exists postal     text,
  add column if not exists city       text,
  add column if not exists profile_complete boolean default false;
