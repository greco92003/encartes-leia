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
              "flex items-center gap-2 !bg-background !border-2 !border-primary text-foreground hover:!bg-primary/10 hover:!text-primary dark:!bg-background dark:!border-primary dark:text-foreground dark:hover:!bg-primary/10 dark:hover:!text-primary",
              pathname === "/" &&
                "!bg-primary/20 !text-primary !border-primary dark:!bg-primary/20 dark:!text-primary dark:!border-primary"
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
              "flex items-center gap-2 !bg-background !border-2 !border-primary text-foreground hover:!bg-primary/10 hover:!text-primary dark:!bg-background dark:!border-primary dark:text-foreground dark:hover:!bg-primary/10 dark:hover:!text-primary",
              pathname === "/especial-das-carnes" &&
                "!bg-primary/20 !text-primary !border-primary dark:!bg-primary/20 dark:!text-primary dark:!border-primary"
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
              "flex items-center gap-2 !bg-background !border-2 !border-primary text-foreground hover:!bg-primary/10 hover:!text-primary dark:!bg-background dark:!border-primary dark:text-foreground dark:hover:!bg-primary/10 dark:hover:!text-primary",
              pathname === "/ofertas-horti-fruti" &&
                "!bg-primary/20 !text-primary !border-primary dark:!bg-primary/20 dark:!text-primary dark:!border-primary"
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
              "flex items-center gap-2 !bg-background !border-2 !border-primary text-foreground hover:!bg-primary/10 hover:!text-primary dark:!bg-background dark:!border-primary dark:text-foreground dark:hover:!bg-primary/10 dark:hover:!text-primary",
              pathname === "/encarte-virtual" &&
                "!bg-primary/20 !text-primary !border-primary dark:!bg-primary/20 dark:!text-primary dark:!border-primary"
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
                "flex items-center gap-2 !bg-background !border-2 !border-slate-400 text-foreground hover:!bg-slate-400/10 hover:!text-slate-400 dark:!bg-background dark:!border-slate-400 dark:text-foreground dark:hover:!bg-slate-400/10 dark:hover:!text-slate-400",
                pathname === "/adicionar-produtos" &&
                  "!bg-slate-400/20 !text-slate-400 !border-slate-400 dark:!bg-slate-400/20 dark:!text-slate-400 dark:!border-slate-400"
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
                "flex items-center gap-2 !bg-background !border-2 !border-slate-400 text-foreground hover:!bg-slate-400/10 hover:!text-slate-400 dark:!bg-background dark:!border-slate-400 dark:text-foreground dark:hover:!bg-slate-400/10 dark:hover:!text-slate-400",
                pathname === "/upload-de-imagens" &&
                  "!bg-slate-400/20 !text-slate-400 !border-slate-400 dark:!bg-slate-400/20 dark:!text-slate-400 dark:!border-slate-400"
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
                "flex items-center gap-2 !bg-background !border-2 !border-slate-600 text-foreground hover:!bg-slate-600/10 hover:!text-slate-600 dark:!bg-background dark:!border-slate-600 dark:text-foreground dark:hover:!bg-slate-600/10 dark:hover:!text-slate-600",
                pathname === "/admin" &&
                  "!bg-slate-600/20 !text-slate-600 !border-slate-600 dark:!bg-slate-600/20 dark:!text-slate-600 dark:!border-slate-600"
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
            className="flex items-center gap-2 bg-background border-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:bg-destructive/20 dark:border-destructive dark:text-destructive dark:hover:bg-destructive/30"
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
