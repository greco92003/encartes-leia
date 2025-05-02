"use server";

import { supabase } from "@/lib/supabase-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return NextResponse.json(
        { error: `Erro ao listar buckets: ${bucketsError.message}` },
        { status: 500 }
      );
    }
    
    // Verificar se o bucket específico existe
    const bucket = buckets.find(b => b.name === "imagens");
    
    if (!bucket) {
      return NextResponse.json(
        { error: `Bucket "imagens" não encontrado. Buckets disponíveis: ${buckets.map(b => b.name).join(", ")}` },
        { status: 404 }
      );
    }
    
    // Tentar listar arquivos no bucket para verificar permissões
    const { data: files, error: filesError } = await supabase.storage
      .from("imagens")
      .list();
      
    if (filesError) {
      return NextResponse.json(
        { error: `Erro ao listar arquivos no bucket: ${filesError.message}` },
        { status: 500 }
      );
    }
    
    // Verificar a sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json(
        { error: `Erro ao verificar sessão: ${sessionError.message}` },
        { status: 401 }
      );
    }
    
    // Retornar informações sobre o bucket e a sessão
    return NextResponse.json({
      success: true,
      bucket: {
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        created_at: bucket.created_at,
      },
      files: files.length,
      session: {
        active: !!sessionData.session,
        user: sessionData.session?.user?.email || null,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar políticas de armazenamento:", error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 }
    );
  }
}
