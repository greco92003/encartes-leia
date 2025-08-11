"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [initialTheme, setInitialTheme] = useState("system");

  useEffect(() => {
    setMounted(true);

    // Verificar se é a primeira visita (não há tema salvo)
    const savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
      // Detectar preferência do navegador
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const browserTheme = prefersDark ? "dark" : "light";
      setInitialTheme(browserTheme);

      // Salvar a preferência detectada para evitar flash
      localStorage.setItem("theme", browserTheme);
    } else {
      setInitialTheme(savedTheme);
    }
  }, []);

  // Evitar hidratação mismatch
  if (!mounted) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        {children}
        <Toaster position="top-center" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme}
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      {children}
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
