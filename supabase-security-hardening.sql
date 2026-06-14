-- Run once in Supabase SQL Editor before deploying the hardened API.
-- Prevents authenticated users from elevating their own role through PostgREST.

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and (
    new.role is distinct from old.role
    or new.id is distinct from old.id
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Protected profile fields cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own safe profile fields"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Make ownership checks explicit for inserts and updates.
drop policy if exists "Users can manage own subscriptions" on public.push_subscriptions;
create policy "Users can view own subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);
create policy "Users can insert own subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);
create policy "Users can update own subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Users can delete own subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Public clients read only explicitly public settings.
drop policy if exists "settings_read_all" on public.app_settings;
create policy "settings_read_public"
  on public.app_settings for select
  using (key in ('contact_email', 'contact_thanks_msg', 'contact_topics', 'tiles_config'));

-- Contact messages must pass through the rate-limited API route.
drop policy if exists "contact_insert_all" on public.contact_messages;

-- Internal tables are never writable directly by anon/authenticated clients.
alter table public.content_cache enable row level security;
alter table public.push_log enable row level security;

drop policy if exists "push_log_read_authenticated" on public.push_log;
create policy "push_log_read_authenticated"
  on public.push_log for select
  using (auth.role() = 'authenticated');

drop policy if exists "push_log_write_admin" on public.push_log;
create policy "push_log_write_admin"
  on public.push_log for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Vercel Hobby runs cron only daily. Supabase invokes scheduled push every minute.
-- Before running, configure app.settings.cron_secret to the rotated CRON_SECRET.
select cron.unschedule(jobid)
from cron.job
where jobname = 'scheduled-push';

select cron.schedule(
  'scheduled-push',
  '* * * * *',
  $$
  select net.http_get(
    url := 'https://salve-maria.vercel.app/api/cron/push',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || current_setting('app.settings.cron_secret', true)
    )
  );
  $$
);
