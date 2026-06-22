"use client";
import { useEffect, useRef, useState } from "react";

export type Theme = "dark" | "light";
export type FontSize = "small" | "medium" | "large";

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "19px",
};

function load<T>(key: string, fallback: T): T {
  try { return (JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback) as T; }
  catch { return fallback; }
}

/**
 * Suwak 0–100 → wartość CSS brightness().
 * Ciemny: 0 = domyślny (0.78 ≈ lekko ciemny), 50 = neutralny (1.0), 100 = bardzo jasny (1.60)
 * Jasny:  0 = domyślny (1.00), 100 = mocno przyciemniony (0.55)
 */
export function brightnessFromSlider(value: number, theme: Theme): number {
  if (theme === "dark") return 0.78 + (value / 100) * 0.82;
  return 1.0 - (value / 100) * 0.45;
}

export function applyBrightness(value: number, theme: Theme) {
  const b = brightnessFromSlider(value, theme);
  // Ustawiamy CSS variable — filtr nakłada globals.css na .brightness-wrap
  // i na nav.fixed osobno, żeby nie łamać position:fixed
  document.documentElement.style.setProperty("--app-b", b.toFixed(3));
  document.body.style.filter = "none"; // upewniamy się że body nie ma filtra

  // Kontr-filtr na obrazy (w obrębie brightness-wrap): przywraca oryginalną jasność
  const inv = (1 / b).toFixed(3);
  let style = document.getElementById("_brightness_img_fix") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "_brightness_img_fix";
    document.head.appendChild(style);
  }
  style.textContent = `
    .brightness-wrap img:not(.brightness-ok),
    .brightness-wrap video,
    .brightness-wrap canvas,
    .brightness-wrap .no-brightness { filter: brightness(${inv}) !important; }
  `;
}

function applyTheme(theme: Theme, brightness: number) {
  document.documentElement.classList.toggle("theme-light", theme === "light");
  applyBrightness(brightness, theme);
}

export function useAppearance() {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [brightness, setBrightnessState] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  // śledzi poprzedni motyw żeby odróżnić pierwsze uruchomienie od realnej zmiany
  const prevThemeRef = useRef<Theme | null>(null);

  useEffect(() => {
    const t = load<Theme>("app_theme", "dark");
    const f = load<FontSize>("app_font_size", "medium");
    const b = load<number>("app_brightness", 0);
    setThemeState(t);
    setFontSizeState(f);
    setBrightnessState(b);
    applyTheme(t, b);
    document.documentElement.style.setProperty("--app-font-size", FONT_SIZE_MAP[f]);
    prevThemeRef.current = t;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty("--app-font-size", FONT_SIZE_MAP[fontSize]);
    localStorage.setItem("app_font_size", JSON.stringify(fontSize));
  }, [fontSize, mounted]);

  useEffect(() => {
    if (!mounted) return;
    applyBrightness(brightness, theme);
    localStorage.setItem("app_brightness", JSON.stringify(brightness));
  }, [brightness, theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    // uruchomienie po mount z tym samym motywem — nie resetuj jasności
    if (prevThemeRef.current === theme) return;
    prevThemeRef.current = theme;
    // realna zmiana motywu przez użytkownika → reset brightness
    const b = 0;
    setBrightnessState(b);
    localStorage.setItem("app_brightness", "0");
    applyTheme(theme, b);
    localStorage.setItem("app_theme", JSON.stringify(theme));
  }, [theme, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    theme, fontSize, brightness,
    setTheme: setThemeState,
    setFontSize: setFontSizeState,
    setBrightness: setBrightnessState,
  };
}
