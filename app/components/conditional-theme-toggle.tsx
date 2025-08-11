"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function ConditionalThemeToggle() {
  const pathname = usePathname();

  // Não mostrar o theme-toggle nas páginas de login e encarte virtual
  const hideThemeToggle =
    pathname.startsWith("/login") || pathname.startsWith("/encarte-virtual");

  if (hideThemeToggle) {
    return null;
  }

  return <ThemeToggle />;
}
