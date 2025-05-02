import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza um texto removendo acentos e caracteres especiais
 * Útil para comparações de texto que ignoram acentuação
 * @param text Texto a ser normalizado
 * @returns Texto sem acentos
 */
export function normalizeText(text: string): string {
  // Remove acentos usando decomposição Unicode NFD e removendo os caracteres diacríticos
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
