"use client";
import { useEffect } from "react";
import { applyBrightness, type ColorTheme } from "@/hooks/useAppearance";

type FontSize = "small" | "medium" | "large";
const FONT_SIZE_MAP: Record<FontSize, string> = { small: "14px", medium: "16px", large: "19px" };
const COLOR_THEME_CLASSES: ColorTheme[] = ["klasyczny", "morski", "bordo", "nocny"];

export default function AppearanceProvider() {
  useEffect(() => {
    try {
      const ct = (JSON.parse(localStorage.getItem("app_color_theme") ?? '"klasyczny"') ?? "klasyczny") as ColorTheme;
      const fontSize = (JSON.parse(localStorage.getItem("app_font_size") ?? '"medium"') ?? "medium") as FontSize;
      const brightness = (JSON.parse(localStorage.getItem("app_brightness") ?? "0") ?? 0) as number;
      document.documentElement.style.setProperty("--app-font-size", FONT_SIZE_MAP[fontSize] ?? "16px");
      const el = document.documentElement;
      el.classList.remove("theme-light");
      COLOR_THEME_CLASSES.forEach(c => el.classList.remove(`theme-${c}`));
      if (ct !== "klasyczny") el.classList.add(`theme-${ct}`);
      applyBrightness(brightness, "dark");
    } catch {}
  }, []);

  return null;
}
