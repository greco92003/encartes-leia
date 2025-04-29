import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log("API Login: Tentando fazer login com email:", email);

    // Fazer login com email e senha
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Se houver erro, retornar erro
    if (error) {
      console.error("API Login: Erro de autenticação:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    // Se não tiver usuário, retornar erro
    if (!data.user) {
      console.error("API Login: Usuário não encontrado após autenticação");
      return NextResponse.json(
        { success: false, message: "Usuário não encontrado após autenticação" },
        { status: 401 }
      );
    }

    console.log("API Login: Login bem-sucedido, usuário autenticado");

    // Verificar se o usuário está aprovado
    try {
      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("API Login: Erro ao buscar perfil do usuário:", profileError);
        // Permitir login mesmo sem perfil para não bloquear o usuário
        return NextResponse.json({
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            role: "user",
            is_approved: true,
          },
          session: data.session,
        });
      }

      // Se o usuário não estiver aprovado, fazer logout
      if (profileData.is_approved === false) {
        console.log("API Login: Usuário não aprovado, fazendo logout");
        await supabase.auth.signOut();
        return NextResponse.json(
          { success: false, message: "Conta aguardando aprovação pelo administrador." },
          { status: 403 }
        );
      }

      // Usuário aprovado, permitir acesso
      console.log("API Login: Usuário aprovado, permitindo acesso");
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: profileData.name,
          role: profileData.role,
          is_approved: profileData.is_approved,
        },
        session: data.session,
      });
    } catch (profileError) {
      console.error("API Login: Erro ao processar perfil:", profileError);

      // Para outros erros, permitir login para não bloquear o usuário
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: "user",
          is_approved: true,
        },
        session: data.session,
      });
    }
  } catch (error) {
    console.error("API Login: Exceção durante o login:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
