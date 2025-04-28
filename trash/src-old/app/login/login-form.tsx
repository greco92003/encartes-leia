"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInAction } from "./actions";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase-auth";

export function ServerLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      // Mostrar mensagem de sucesso antes de chamar a server action
      toast.success("Verificando credenciais...");

      // Chamar a server action - se for bem-sucedido, o redirecionamento ocorrerá no servidor
      const result = await signInAction(formData);

      // Verificar o resultado da server action
      if (result) {
        if (result.success === false) {
          // Se houve erro, mostrar mensagem
          setError(result.error || "Erro desconhecido durante o login");
          toast.error(result.error || "Erro desconhecido durante o login");
        } else if (result.success === true && result.redirect) {
          // Se foi bem-sucedido e tem redirecionamento, redirecionar
          toast.success("Login realizado com sucesso! Redirecionando...");

          // Aguardar um pequeno delay para garantir que a sessão foi persistida
          setTimeout(() => {
            router.replace(result.redirect as string);
          }, 500);
        }
      }
    } catch (error) {
      console.error("Erro durante o login:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro desconhecido durante o login";
      setError(errorMessage);
      toast.error(`Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Acesse sua conta</CardTitle>
          <CardDescription>
            Digite seu email e senha para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="flex flex-col gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                placeholder="seu@email.com"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs"
                  type="button"
                  onClick={async () => {
                    const emailInput = document.getElementById(
                      "email"
                    ) as HTMLInputElement;
                    const email = emailInput?.value;

                    if (!email) {
                      toast.error("Digite seu email primeiro");
                      return;
                    }

                    try {
                      setIsLoading(true);
                      const { error } =
                        await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/update-password`,
                        });

                      if (error) throw error;

                      toast.success(
                        "Email de redefinição de senha enviado. Verifique sua caixa de entrada."
                      );
                    } catch (error) {
                      console.error(
                        "Erro ao enviar email de redefinição:",
                        error
                      );
                      toast.error(
                        "Erro ao enviar email de redefinição. Tente novamente."
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  Esqueceu a senha?
                </Button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                disabled={isLoading}
                required
              />
            </div>
            {error && <div className="text-sm text-red-500">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <div className="mt-4 text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Cadastre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
