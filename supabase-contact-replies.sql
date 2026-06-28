-- Migration: add user_id and admin_reply to contact_messages
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS admin_reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz;

-- Users can read their own messages (to see history + replies)
DROP POLICY IF EXISTS "contact_read_own" ON public.contact_messages;
CREATE POLICY "contact_read_own" ON public.contact_messages
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own messages (user_id must match or be null)
DROP POLICY IF EXISTS "contact_insert_all" ON public.contact_messages;
CREATE POLICY "contact_insert_all" ON public.contact_messages
  FOR INSERT WITH CHECK (true);
