"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { signInWithPassword, supabase } from "@/lib/supabase-auth";

// Schema de validação
const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginFormCombined({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se há um parâmetro de redirecionamento
  const redirectTo = searchParams.get("redirect") || "/";

  // Verificar se o usuário acabou de se registrar
  const registered = searchParams.get("registered") === "true";

  // Mostrar toast se o usuário acabou de se registrar (usando useEffect para garantir que seja exibido apenas uma vez)
  useEffect(() => {
    if (registered) {
      // Usar um pequeno delay para garantir que o toast seja exibido apenas uma vez
      const timer = setTimeout(() => {
        toast.success(
          "Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o sistema."
        );
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [registered]);

  // Inicializar formulário
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Função para lidar com o envio do formulário
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);

    try {
      // Fazer login
      const result = await signInWithPassword(data.email, data.password);

      console.log("Resultado do login:", result);

      if (!result || !result.user) {
        throw new Error("Falha ao obter dados do usuário após login");
      }

      // Aguardar um pequeno delay para garantir que a sessão foi persistida
      console.log("Aguardando persistência da sessão antes de redirecionar...");

      // Verificar a sessão antes do delay
      const sessionBefore = await supabase.auth.getSession();
      console.log(
        "Sessão antes do delay:",
        sessionBefore.data.session ? "Existe" : "Não existe"
      );

      // Aguardar para garantir que a sessão seja persistida
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verificar a sessão após o delay
      const sessionAfter = await supabase.auth.getSession();
      console.log(
        "Sessão após o delay:",
        sessionAfter.data.session ? "Existe" : "Não existe"
      );

      // Armazenar informação de login no localStorage para uso posterior
      console.log("Login bem-sucedido! Armazenando informação no localStorage");
      localStorage.setItem("isLoggedIn", "true");

      // Definir cookie isLoggedIn para o middleware
      document.cookie = "isLoggedIn=true; path=/";

      // Mostrar mensagem de sucesso
      toast.success("Login realizado com sucesso! Redirecionando...");

      // Aguardar um pouco para a mensagem ser exibida
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Redirecionar para a página inicial ou para a página solicitada
      console.log("Redirecionando para:", redirectTo);
      window.location.href = redirectTo || "/";
    } catch (error) {
      console.error("Erro completo durante login:", error);

      // Mostrar mensagem de erro
      if (error instanceof Error) {
        toast.error(`Erro: ${error.message}`);
      } else {
        toast.error("Erro ao fazer login. Tente novamente.");
      }
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-6"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Senha</FormLabel>
                      <Button
                        variant="link"
                        className="p-0 h-auto text-xs"
                        type="button"
                        onClick={async () => {
                          const email = form.getValues("email");
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
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
