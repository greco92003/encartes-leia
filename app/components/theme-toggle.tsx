"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Evita mismatch de hidratação
    return null;
  }

  const checked = theme === "dark"; // focamos em alternar light/dark explicitamente

  return (
    <div
      className="flex items-center gap-2"
      role="group"
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 text-card-foreground" aria-hidden="true" />
      <Switch
        aria-label="Alternar entre tema claro e escuro"
        checked={checked}
        onCheckedChange={(isDark) => setTheme(isDark ? "dark" : "light")}
      />
      <Moon className="h-4 w-4 text-card-foreground" aria-hidden="true" />
    </div>
  );
}
