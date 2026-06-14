"use client";
import { useState, useEffect, useCallback } from "react";

const KEY = "salve_prayer_favorites_v1";

function load(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); }
  catch { return []; }
}

function save(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(load());
    setMounted(true);

    // synchronizacja między kartami / po powrocie do aplikacji
    const sync = () => setFavorites(load());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      save(next);
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => mounted && favorites.includes(id), [favorites, mounted]);

  return { favorites, toggle, isFav, mounted };
}
