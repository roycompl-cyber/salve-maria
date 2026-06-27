"use client";
import { useEffect, useRef, useState } from "react";

export type Theme = "dark" | "light";
export type ColorTheme = "klasyczny" | "morski" | "bordo" | "nocny";
export type FontSize = "small" | "medium" | "large";

const COLOR_THEME_CLASSES: ColorTheme[] = ["klasyczny", "morski", "bordo", "nocny"];

function applyColorTheme(ct: ColorTheme) {
  const el = document.documentElement;
  COLOR_THEME_CLASSES.forEach(c => el.classList.remove(`theme-${c}`));
  if (ct !== "klasyczny") el.classList.add(`theme-${ct}`);
  // Klasyczny = domyślny ciemny (brak dodatkowej klasy), light mode off
  el.classList.remove("theme-light");
}

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
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("klasyczny");
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [brightness, setBrightnessState] = useState<number>(0);
  const [mounted, setMounted] = useState(false);
  const prevColorThemeRef = useRef<ColorTheme | null>(null);

  useEffect(() => {
    const t = load<Theme>("app_theme", "dark");
    const ct = load<ColorTheme>("app_color_theme", "klasyczny");
    const f = load<FontSize>("app_font_size", "medium");
    const b = load<number>("app_brightness", 0);
    setThemeState(t);
    setColorThemeState(ct);
    setFontSizeState(f);
    setBrightnessState(b);
    applyColorTheme(ct);
    applyBrightness(b, "dark");
    document.documentElement.style.setProperty("--app-font-size", FONT_SIZE_MAP[f]);
    prevColorThemeRef.current = ct;
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.style.setProperty("--app-font-size", FONT_SIZE_MAP[fontSize]);
    localStorage.setItem("app_font_size", JSON.stringify(fontSize));
  }, [fontSize, mounted]);

  useEffect(() => {
    if (!mounted) return;
    applyBrightness(brightness, "dark");
    localStorage.setItem("app_brightness", JSON.stringify(brightness));
  }, [brightness, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (prevColorThemeRef.current === colorTheme) return;
    prevColorThemeRef.current = colorTheme;
    applyColorTheme(colorTheme);
    setBrightnessState(0);
    localStorage.setItem("app_brightness", "0");
    applyBrightness(0, "dark");
    localStorage.setItem("app_color_theme", JSON.stringify(colorTheme));
  }, [colorTheme, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    theme, colorTheme, fontSize, brightness,
    setTheme: setThemeState,
    setColorTheme: setColorThemeState,
    setFontSize: setFontSizeState,
    setBrightness: setBrightnessState,
  };
}
