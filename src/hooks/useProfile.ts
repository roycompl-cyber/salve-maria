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

    const current = get().profile;
    const safeData = {
      first_name: data.first_name ?? current?.first_name ?? null,
      last_name: data.last_name ?? current?.last_name ?? null,
      phone: data.phone ?? current?.phone ?? null,
      street: data.street ?? current?.street ?? null,
      house_no: data.house_no ?? current?.house_no ?? null,
      postal: data.postal ?? current?.postal ?? null,
      city: data.city ?? current?.city ?? null,
      profile_complete: isComplete,
    };

    const { error } = await supabase
      .from("profiles")
      .update(safeData)
      .eq("id", user.id);

    if (error) return error.message;

    set({ profile: { ...get().profile!, ...safeData } });
    return null;
  },

  reset: () => set({ profile: null, loading: false }),
}));
