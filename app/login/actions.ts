"use server";

import { supabase } from "@/lib/supabase-client";

export async function signInAction(formData: FormData) {
  try {
    // Fazer login com email e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });

    // Se houver erro, lançar exceção
    if (error) {
      console.error("Erro de autenticação:", error);
      throw new Error(error.message);
    }

    // Se não tiver usuário, lançar exceção
    if (!data.user) {
      console.error("Usuário não encontrado após autenticação");
      throw new Error("Usuário não encontrado após autenticação");
    }

    // Verificar se é o admin (simplificado)
    if (data.user.email === "greco92003@gmail.com") {
      console.log("Usuário admin identificado, permitindo acesso");

      // Redirecionar para a página inicial
      console.log("Redirecionando para a página inicial");
      return { success: true, redirect: "/" };
    }

    // Para outros usuários, verificar se estão aprovados
    try {
      console.log("Verificando perfil para usuário não-admin");

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from("public.profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      console.log("Resultado da busca de perfil:", profileData);

      // Se não tiver perfil, criar um
      if (!profileData) {
        console.log("Perfil não encontrado, criando perfil básico");

        // Criar perfil básico
        await supabase.from("public.profiles").insert([
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split("@")[0] || "Usuário",
            role: "user",
            is_approved: false, // Usuários normais precisam de aprovação
          },
        ]);

        // Fazer logout e informar que precisa de aprovação
        await supabase.auth.signOut();
        throw new Error(
          "Conta criada. Aguardando aprovação pelo administrador."
        );
      }

      // Se o usuário não estiver aprovado, fazer logout
      if (profileData.is_approved === false) {
        console.log("Usuário não aprovado, fazendo logout");
        await supabase.auth.signOut();
        throw new Error("Conta aguardando aprovação pelo administrador.");
      }

      // Usuário aprovado, permitir acesso
      console.log("Usuário aprovado, permitindo acesso");
      return { success: true, redirect: "/" };
    } catch (profileError) {
      console.error("Erro ao processar perfil:", profileError);

      // Se for erro de aprovação, propagar o erro
      if (
        profileError instanceof Error &&
        profileError.message.includes("aprovação")
      ) {
        throw profileError;
      }

      // Para outros erros, permitir login para não bloquear o usuário
      console.log("Erro não crítico, permitindo acesso");
      return { success: true, redirect: "/" };
    }
  } catch (error) {
    console.error("Exceção durante o login:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido durante o login",
    };
  }
}
