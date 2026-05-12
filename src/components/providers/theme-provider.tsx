"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark";
type ColorTheme = "purple" | "blue" | "green" | "rose" | "amber";

interface ThemeContextType {
  mode: Mode;
  colorTheme: ColorTheme;
  setMode: (mode: Mode) => void;
  setColorTheme: (theme: ColorTheme) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("light");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("purple");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem("theme-mode") as Mode;
    const savedColor = localStorage.getItem("theme-color") as ColorTheme;

    if (savedMode) setMode(savedMode);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setMode("dark");

    if (savedColor) setColorTheme(savedColor);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    // Handle Dark Mode
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Handle Color Themes
    root.classList.forEach(cls => {
      if (cls.startsWith("theme-")) root.classList.remove(cls);
    });
    root.classList.add(`theme-${colorTheme}`);

    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme-color", colorTheme);
  }, [mode, colorTheme, mounted]);

  const toggleMode = () => setMode(prev => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ mode, colorTheme, setMode, setColorTheme, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
