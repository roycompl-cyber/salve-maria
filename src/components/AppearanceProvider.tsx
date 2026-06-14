"use client";
import { useEffect } from "react";
import { applyBrightness } from "@/hooks/useAppearance";

type Theme = "dark" | "light";
type FontSize = "small" | "medium" | "large";

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "19px",
};

export default function AppearanceProvider() {
  useEffect(() => {
    try {
      const theme = (JSON.parse(localStorage.getItem("app_theme") ?? '"dark"') ?? "dark") as Theme;
      const fontSize = (JSON.parse(localStorage.getItem("app_font_size") ?? '"medium"') ?? "medium") as FontSize;
      const brightness = (JSON.parse(localStorage.getItem("app_brightness") ?? "0") ?? 0) as number;
      document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize] ?? "16px";
      document.documentElement.classList.toggle("theme-light", theme === "light");
      applyBrightness(brightness, theme);
    } catch {}
  }, []);

  return null;
}
