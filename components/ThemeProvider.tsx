"use client";
import { useEffect } from "react";

export default function ThemeProvider({ profile, children }: { profile: any; children: React.ReactNode }) {
  useEffect(() => {
    if (!profile) return;
    const root = document.documentElement;
    if (profile.theme_mode === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    if (profile.theme_color) root.style.setProperty("--brand", profile.theme_color);
  }, [profile]);
  return <>{children}</>;
}
