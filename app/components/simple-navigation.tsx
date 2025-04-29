"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Beef,
  Citrus,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function SimpleNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex justify-center mb-6">
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/">
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 bg-white border-2 border-[#9e4e5a] text-slate-800 hover:bg-[#d8b5bd] hover:text-slate-900",
              pathname === "/" && "bg-[#d8b5bd]"
            )}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Ofertas Final de Semana</span>
          </Button>
        </Link>

        <Link href="/especial-das-carnes">
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 bg-white border-2 border-[#9e4e5a] text-slate-800 hover:bg-[#d8b5bd] hover:text-slate-900",
              pathname === "/especial-das-carnes" && "bg-[#d8b5bd]"
            )}
          >
            <Beef className="h-4 w-4" />
            <span>Especial das Carnes</span>
          </Button>
        </Link>

        <Link href="/ofertas-horti-fruti">
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 bg-white border-2 border-[#9e4e5a] text-slate-800 hover:bg-[#d8b5bd] hover:text-slate-900",
              pathname === "/ofertas-horti-fruti" && "bg-[#d8b5bd]"
            )}
          >
            <Citrus className="h-4 w-4" />
            <span>Ofertas Horti-Fruti</span>
          </Button>
        </Link>

        <Link href="/encarte-virtual">
          <Button
            variant="outline"
            className={cn(
              "flex items-center gap-2 bg-white border-2 border-[#9e4e5a] text-slate-800 hover:bg-[#d8b5bd] hover:text-slate-900",
              pathname === "/encarte-virtual" && "bg-[#d8b5bd]"
            )}
          >
            <Newspaper className="h-4 w-4" />
            <span>Encarte Virtual</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
