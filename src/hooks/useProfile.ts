"use client";
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { UserProfile } from "@/types";

interface ProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  fetch: (userId: string) => Promise<void>;
  update: (data: Partial<UserProfile>) => Promise<string | null>;
  reset: () => void;
}

export const useProfile = create<ProfileStore>()((set, get) => ({
  profile: null,
  loading: false,

  fetch: async (userId: string) => {
    set({ loading: true });
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    set({ profile: data as UserProfile | null, loading: false });
  },

  update: async (data: Partial<UserProfile>) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Nie zalogowano";

    const isComplete = !!(
      data.first_name?.trim() &&
      data.last_name?.trim() &&
      data.phone?.trim() &&
      data.street?.trim() &&
      data.house_no?.trim() &&
      data.postal?.trim() &&
      data.city?.trim()
    );

    const { error } = await supabase
      .from("profiles")
      .update({ ...data, profile_complete: isComplete })
      .eq("id", user.id);

    if (error) return error.message;

    set({ profile: { ...get().profile!, ...data, profile_complete: isComplete } });
    return null;
  },

  reset: () => set({ profile: null, loading: false }),
}));
