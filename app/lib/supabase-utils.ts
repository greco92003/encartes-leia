/**
 * Utilitários para interação com o Supabase
 */

import { SUPABASE } from "./config";
import { supabase, supabaseConfig } from "./supabase-client";

/**
 * Faz upload de uma imagem para o bucket do Supabase
 * @param file Arquivo a ser enviado
 * @param path Caminho dentro do bucket (opcional)
 * @returns URL pública da imagem
 */
export async function uploadImage(file: File, path?: string): Promise<string> {
  try {
    // Gerar um nome de arquivo único baseado no timestamp e nome original
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}-${file.name.replace(/\s+/g, "-")}`;

    // Caminho completo no bucket
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Fazer upload do arquivo
    const { data, error } = await supabase.storage
      .from(SUPABASE.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Obter a URL pública do arquivo
    const { data: urlData } = supabase.storage
      .from(SUPABASE.BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    throw error;
  }
}

/**
 * Lista todas as imagens em um bucket do Supabase
 * @param path Caminho dentro do bucket (opcional)
 * @returns Lista de arquivos com URLs públicas
 */
export async function listImages(path?: string) {
  try {
    // Listar arquivos no bucket
    const { data, error } = await supabase.storage
      .from(SUPABASE.BUCKET_NAME)
      .list(path || "", {
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      throw error;
    }

    // Filtrar apenas arquivos (não pastas) e gerar URLs públicas
    const files = data
      .filter((item) => !item.id.endsWith("/"))
      .map((file) => {
        const filePath = path ? `${path}/${file.name}` : file.name;
        const { data: urlData } = supabase.storage
          .from(SUPABASE.BUCKET_NAME)
          .getPublicUrl(filePath);

        return {
          name: file.name,
          size: file.metadata.size,
          created_at: file.created_at,
          url: urlData.publicUrl,
        };
      });

    return files;
  } catch (error) {
    console.error("Erro ao listar imagens:", error);
    throw error;
  }
}

/**
 * Remove uma imagem do bucket do Supabase
 * @param path Caminho do arquivo a ser removido
 * @returns Resultado da operação
 */
export async function removeImage(path: string) {
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE.BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }

    return { success: true, message: "Imagem removida com sucesso", data };
  } catch (error) {
    console.error("Erro ao remover imagem:", error);
    throw error;
  }
}
