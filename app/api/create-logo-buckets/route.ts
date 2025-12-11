import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-client";

export async function POST() {
  try {
    // Lista de buckets para logos que precisamos criar
    const logoBuckets = [
      {
        name: "logos-atacado",
        description:
          "Bucket para armazenar logos do atacado (ex: logo principal da empresa)",
      },
      {
        name: "logos-ofertas",
        description:
          "Bucket para armazenar logos das ofertas (ex: HORTI FRUTI, ESPECIAL DAS CARNES)",
      },
    ];

    const results = [];

    // Verificar buckets existentes primeiro
    const { data: existingBuckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      return NextResponse.json(
        { error: `Erro ao listar buckets existentes: ${listError.message}` },
        { status: 500 }
      );
    }

    const existingBucketNames = existingBuckets.map((bucket) => bucket.name);

    // Criar cada bucket se não existir
    for (const bucketConfig of logoBuckets) {
      if (existingBucketNames.includes(bucketConfig.name)) {
        results.push({
          bucket: bucketConfig.name,
          status: "already_exists",
          message: `Bucket '${bucketConfig.name}' já existe`,
        });
        continue;
      }

      // Criar o bucket
      const { data: newBucket, error: createError } =
        await supabase.storage.createBucket(bucketConfig.name, {
          public: true, // Permitir acesso público para visualização dos logos
          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
          fileSizeLimit: 5242880, // 5MB limit
        });

      if (createError) {
        results.push({
          bucket: bucketConfig.name,
          status: "error",
          message: `Erro ao criar bucket '${bucketConfig.name}': ${createError.message}`,
        });
        continue;
      }

      results.push({
        bucket: bucketConfig.name,
        status: "created",
        message: `Bucket '${bucketConfig.name}' criado com sucesso`,
        data: newBucket,
      });
    }

    // Nota: As políticas RLS precisam ser criadas manualmente no Supabase Dashboard
    // ou através do SQL Editor, pois as funções RPC podem não estar disponíveis
    const policyResults = [
      {
        message:
          "Políticas RLS devem ser criadas manualmente no Supabase Dashboard",
        instructions: [
          "1. Acesse o Supabase Dashboard",
          "2. Vá para Authentication > Policies",
          "3. Crie políticas para storage.objects para cada bucket criado",
          "4. Use as mesmas políticas do bucket 'imagens' como referência",
        ],
      },
    ];

    return NextResponse.json({
      success: true,
      message: "Processo de criação de buckets concluído",
      buckets: results,
      policies: policyResults,
      summary: {
        total_buckets: logoBuckets.length,
        created: results.filter((r) => r.status === "created").length,
        already_existed: results.filter((r) => r.status === "already_exists")
          .length,
        errors: results.filter((r) => r.status === "error").length,
      },
    });
  } catch (error) {
    console.error("Erro geral ao criar buckets de logos:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor ao criar buckets de logos",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
