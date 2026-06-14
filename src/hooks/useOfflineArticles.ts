"use client";
import { useEffect, useState } from "react";
import { PKArticle } from "@/lib/polskakatolicka";

const STORAGE_KEY = "offline_articles";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readCache(): { articles: PKArticle[]; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function writeCache(articles: PKArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ articles, savedAt: Date.now() }));
  } catch {}
}

export function useOfflineArticles() {
  const [articles, setArticles] = useState<PKArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  useEffect(() => {
    // Natychmiast pokaż cache jeśli jest
    const cache = readCache();
    if (cache?.articles.length) {
      setArticles(cache.articles);
      setCachedAt(cache.savedAt);
      setLoading(false);
    }

    const stale = !cache || Date.now() - cache.savedAt > MAX_AGE_MS;

    // Pobierz świeże dane (zawsze, nie tylko gdy stale — stale-while-revalidate)
    fetch("/api/articles")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: PKArticle[]) => {
        if (!Array.isArray(data)) return;
        setArticles(data);
        setCachedAt(Date.now());
        setOffline(false);
        writeCache(data);
      })
      .catch(() => {
        if (!cache?.articles.length) setLoading(false);
        setOffline(true);
      })
      .finally(() => setLoading(false));
  }, []);

  return { articles, loading, offline, cachedAt };
}

export function getArticleFromCache(slug: string): PKArticle | null {
  try {
    const cache = readCache();
    return cache?.articles.find(a => a.slug === slug) ?? null;
  } catch { return null; }
}
