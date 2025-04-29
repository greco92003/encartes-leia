"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart,
  Beef,
  Citrus,
  Upload,
  UserCog,
  LogOut,
  Newspaper,
  PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getCurrentUser, signOut, AuthUser } from "@/lib/supabase-auth";
// Importação simplificada para evitar problemas de carregamento
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout. Tente novamente.");
    }
  };

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

        {user && (
          <Link href="/adicionar-produtos">
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2 bg-slate-100 border-2 border-slate-400 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
                pathname === "/adicionar-produtos" && "bg-slate-200"
              )}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Adicionar Produtos</span>
            </Button>
          </Link>
        )}

        {user?.role === "admin" && (
          <Link href="/upload-de-imagens">
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2 bg-slate-100 border-2 border-slate-400 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
                pathname === "/upload-de-imagens" && "bg-slate-200"
              )}
            >
              <Upload className="h-4 w-4" />
              <span>Upload de Imagens</span>
            </Button>
          </Link>
        )}

        {user?.role === "admin" && (
          <Link href="/admin">
            <Button
              variant="outline"
              className={cn(
                "flex items-center gap-2 bg-slate-100 border-2 border-slate-400 text-slate-700 hover:bg-slate-200 hover:text-slate-900",
                pathname === "/admin" && "bg-slate-200"
              )}
            >
              <UserCog className="h-4 w-4" />
              <span>Painel Admin</span>
            </Button>
          </Link>
        )}

        {user && (
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-red-50 border-2 border-red-300 text-red-700 hover:bg-red-100 hover:text-red-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        )}
      </div>
    </div>
  );
}
