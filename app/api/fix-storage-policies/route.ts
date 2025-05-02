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
      // Tentar criar o bucket se não existir
      const { data: newBucket, error: createError } = await supabase.storage.createBucket("imagens", {
        public: true
      });
      
      if (createError) {
        return NextResponse.json(
          { error: `Erro ao criar bucket "imagens": ${createError.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: "Bucket 'imagens' criado com sucesso",
        bucket: newBucket
      });
    }
    
    // Verificar as políticas RLS
    const { data: policies, error: policiesError } = await supabase.rpc("get_policies", {
      table_name: "objects",
      schema_name: "storage"
    });
    
    // Criar políticas RLS se necessário
    const createPoliciesResult = await supabase.rpc("create_storage_policies");
    
    // Verificar a sessão atual
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Retornar informações sobre o bucket, políticas e a sessão
    return NextResponse.json({
      success: true,
      bucket: {
        id: bucket.id,
        name: bucket.name,
        public: bucket.public,
        created_at: bucket.created_at,
      },
      policies: policies || [],
      policies_created: !!createPoliciesResult,
      session: {
        active: !!sessionData.session,
        user: sessionData.session?.user?.email || null,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar/corrigir políticas de armazenamento:", error);
    return NextResponse.json(
      { error: `Erro interno: ${error instanceof Error ? error.message : "Erro desconhecido"}` },
      { status: 500 }
    );
  }
}
