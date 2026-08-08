"use client";

import { useState } from "react";

type ColorTheme = "dark" | "light";

const themeStorageKey = "villiers-98-theme-v1";

const currentTheme = (): ColorTheme => document.documentElement.dataset.theme === "light" ? "light" : "dark";

const applyTheme = (theme: ColorTheme) => {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#f3eee4" : "#070a11");
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ColorTheme>(() => typeof document === "undefined" ? "dark" : currentTheme());

  const toggleTheme = () => {
    const nextTheme: ColorTheme = currentTheme() === "light" ? "dark" : "light";
    applyTheme(nextTheme);
    setTheme(nextTheme);
    try {
      window.localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // Le changement reste actif pendant la session si le stockage est bloqué.
    }
  };

  const isLight = theme === "light";

  return <button
    type="button"
    className="theme-toggle"
    role="switch"
    aria-checked={isLight}
    aria-label="Mode jour"
    title={isLight ? "Passer en mode nuit" : "Passer en mode jour"}
    onClick={toggleTheme}
    suppressHydrationWarning
  >
    <span className="theme-toggle-icon" aria-hidden="true">{isLight ? "☀️" : "🌙"}</span>
    <span className="theme-toggle-label">{isLight ? "Jour" : "Nuit"}</span>
    <span className="theme-toggle-track" aria-hidden="true"><i /></span>
  </button>;
}
