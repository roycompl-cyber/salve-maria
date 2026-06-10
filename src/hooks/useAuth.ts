"use client";
import { create } from "zustand";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthStore {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthStore>()((set) => ({
  user: null,
  loading: true,
  init: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    set({ user: data.user, loading: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
