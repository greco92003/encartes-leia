/**
 * Utilitários para autenticação com Supabase
 */

import { supabase } from "./supabase-client";

// Re-exportar o cliente Supabase para uso em outros componentes
export { supabase };

// Tipos para autenticação
export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  is_approved?: boolean;
  created_at?: string;
};

/**
 * Faz login com email e senha
 * @param email Email do usuário
 * @param password Senha do usuário
 * @returns Resultado da autenticação
 */
export async function signInWithPassword(email: string, password: string) {
  console.log("Tentando fazer login com email:", email);

  try {
    // Passo 1: Autenticar o usuário
    console.log("Iniciando autenticação com Supabase...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    console.log(
      "Resposta da autenticação:",
      data ? "Sucesso" : "Falha",
      error ? `Erro: ${error.message}` : ""
    );

    if (error) {
      console.error("Erro de autenticação:", error);
      throw new Error(error.message);
    }

    console.log("Login bem-sucedido, usuário autenticado");

    // Se não tiver usuário, retornar erro
    if (!data.user) {
      console.error("Usuário não encontrado após autenticação");
      throw new Error("Usuário não encontrado após autenticação");
    }

    // Passo 2: Verificar se é o admin (simplificado)
    if (email === "greco92003@gmail.com") {
      console.log("Usuário admin identificado, permitindo acesso");

      // Retornar usuário admin sem verificar perfil
      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: "Greco Marques",
          role: "admin",
          is_approved: true,
        } as AuthUser,
        session: data.session,
      };
    }

    // Passo 3: Para outros usuários, verificar se estão aprovados
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
      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          name: profileData.name,
          role: profileData.role || "user",
          is_approved: profileData.is_approved,
        } as AuthUser,
        session: data.session,
      };
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
      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          role: "user",
          is_approved: true,
        } as AuthUser,
        session: data.session,
      };
    }
  } catch (error) {
    console.error("Exceção durante o login:", error);
    throw error;
  }
}

/**
 * Faz cadastro com email e senha
 * @param email Email do usuário
 * @param password Senha do usuário
 * @param name Nome do usuário
 * @returns Resultado do cadastro
 */
export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // Criar perfil do usuário
  if (data.user) {
    console.log("Tentando criar perfil para usuário:", data.user.id);

    try {
      const { data: insertData, error: profileError } = await supabase
        .from("public.profiles")
        .insert([
          {
            id: data.user.id,
            email: data.user.email,
            name,
            role: "user",
            is_approved: false, // Usuário precisa ser aprovado pelo admin
          },
        ])
        .select();

      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);

        // Verificar se a tabela existe
        const { error: tableError } = await supabase
          .from("public.profiles")
          .select("*")
          .limit(1);

        if (tableError) {
          console.error("Erro ao verificar tabela profiles:", tableError);
        } else {
          console.log("Tabela profiles existe e está acessível");
        }

        // Registrar o erro, mas não lançar exceção para evitar notificações duplicadas
        console.warn(
          `Erro ao criar perfil de usuário: ${profileError.message}`
        );
        // O usuário foi criado, mas o perfil não. Isso será tratado quando o usuário fizer login.
      }

      console.log("Perfil criado com sucesso:", insertData);
    } catch (error) {
      console.error("Exceção ao criar perfil:", error);
      // Registrar o erro, mas não lançar exceção para evitar notificações duplicadas
      console.warn(
        `Erro ao criar perfil de usuário: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
      // O usuário foi criado, mas o perfil não. Isso será tratado quando o usuário fizer login.
    }
  }

  return { user: data.user, session: data.session };
}

/**
 * Faz logout do usuário
 */
export async function signOut() {
  // Limpar localStorage
  localStorage.removeItem("isLoggedIn");

  // Limpar cookie isLoggedIn
  document.cookie =
    "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // Fazer logout no Supabase
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Obtém a sessão atual do usuário
 * @returns Sessão atual
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

/**
 * Obtém o usuário atual
 * @returns Usuário atual
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  // Buscar informações adicionais do perfil
  const { data: profileData, error: profileError } = await supabase
    .from("public.profiles")
    .select("name, role, is_approved")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Erro ao buscar perfil:", profileError);
    return null;
  }

  // Se não encontrou o perfil ou houve erro, retornar um perfil básico em memória
  // Isso evita erros de permissão ao tentar criar um perfil no banco de dados
  if (!profileData || profileError) {
    console.log(
      "Perfil não encontrado ou erro de permissão, usando perfil básico em memória"
    );

    // Criar um perfil básico em memória (sem tentar salvar no banco de dados)
    const isAdmin = data.user.email === "greco92003@gmail.com";

    return {
      id: data.user.id,
      email: data.user.email || "",
      name: data.user.email?.split("@")[0] || "Usuário",
      role: isAdmin ? "admin" : "user",
      is_approved: isAdmin, // Admin é aprovado automaticamente, outros usuários não
    };
  }

  return {
    id: data.user.id,
    email: data.user.email || "",
    name: profileData?.name,
    role: profileData?.role || "user",
    is_approved: profileData?.is_approved,
  };
}

/**
 * Aprova um usuário
 * @param userId ID do usuário a ser aprovado
 */
export async function approveUser(userId: string) {
  const { error } = await supabase
    .from("public.profiles")
    .update({ is_approved: true })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Lista usuários pendentes de aprovação
 * @returns Lista de usuários pendentes
 */
export async function getPendingUsers() {
  const { data, error } = await supabase
    .from("public.profiles")
    .select("*")
    .eq("is_approved", false)
    .eq("role", "user");

  if (error) {
    throw new Error(error.message);
  }

  return data as AuthUser[];
}

/**
 * Verifica se o usuário atual é admin
 * @returns true se for admin, false caso contrário
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}
