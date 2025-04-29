"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está autenticado com um token de redefinição de senha
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          toast.error("Sessão inválida ou expirada. Solicite um novo link de redefinição de senha.");
          router.push("/login");
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        toast.error("Erro ao verificar sessão. Redirecionando para login.");
        router.push("/login");
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Senha atualizada com sucesso!");
      
      // Fazer logout para forçar novo login com a nova senha
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      console.error("Erro ao atualizar senha:", error);
      if (error instanceof Error) {
        toast.error(`Erro ao atualizar senha: ${error.message}`);
      } else {
        toast.error("Erro ao atualizar senha. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4">Verificando sessão...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Atualizar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <label htmlFor="password">Nova Senha</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Senha"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
