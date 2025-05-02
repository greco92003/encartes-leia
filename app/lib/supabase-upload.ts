"use client";

import { supabase, supabaseConfig } from "./supabase-client";
import { getCurrentUser } from "./supabase-auth";

// Usar o nome do bucket confirmado via API Supabase
const bucketName = "imagens";

// IMPORTANTE: Esta é uma chave anônima (não a chave de serviço) para permitir o build
// Em produção, configure a variável de ambiente NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel

// Função para normalizar o nome do arquivo (remover acentos e caracteres especiais)
function normalizeFileName(fileName: string): string {
  // Remove acentos
  const normalized = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Substitui espaços por hífens e remove caracteres especiais
  return normalized
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-_.]/g, "")
    .replace(/\-+/g, "-"); // Remove hífens duplicados
}

// Função para fazer o upload de uma imagem
export async function uploadImage(file: File): Promise<string | null> {
  try {
    // Verificar se o usuário está autenticado e é admin
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Usuário não autenticado. Faça login para continuar.");
    }

    if (currentUser.role !== "admin") {
      throw new Error("Apenas administradores podem fazer upload de imagens.");
    }

    console.log(
      "Usuário autenticado:",
      currentUser.email,
      "Role:",
      currentUser.role
    );

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
    const fileNameWithoutExt = file.name.substring(
      0,
      file.name.lastIndexOf(".")
    );

    // Normaliza o nome do arquivo
    const normalizedFileName =
      normalizeFileName(fileNameWithoutExt) + "." + fileExt;

    console.log("Tentando fazer upload do arquivo:", normalizedFileName);

    // Determina o tipo MIME com base na extensão do arquivo
    let contentType;
    switch (fileExt) {
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "png":
        contentType = "image/png";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
      default:
        contentType = "application/octet-stream";
    }

    // Verificar a sessão atual
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error("Sessão expirada. Faça login novamente.");
    }

    console.log("Sessão ativa:", !!sessionData.session);

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(normalizedFileName, file, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Erro do Supabase ao fazer upload:", error);
      throw error;
    }

    // Gera o URL público da imagem
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(normalizedFileName);

    console.log("Upload concluído com sucesso. URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    console.error(`Erro ao fazer upload da imagem ${file.name}:`, error);
    // Registrar detalhes adicionais para depuração
    if (error && typeof error === "object" && "message" in error) {
      console.error(`Mensagem de erro detalhada: ${(error as Error).message}`);
    }
    return null;
  }
}

// Função para extrair o nome do produto do nome do arquivo
export function extractProductNameFromFileName(fileName: string): string {
  // Remove a extensão do arquivo
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

  // Retorna o nome sem a extensão (este será o nome do produto)
  return nameWithoutExt;
}

// Função para adicionar o produto à planilha do Google
export async function addProductToSheet(
  productName: string,
  imageUrl: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch("/api/add-product-to-sheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productName,
        imageUrl,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("Produto adicionado à planilha com sucesso:", result);
      return { success: true };
    } else {
      console.warn("Falha ao adicionar produto à planilha:", result.message);
      return {
        success: false,
        message:
          result.message || "Erro desconhecido ao adicionar produto à planilha",
      };
    }
  } catch (error) {
    console.error("Erro ao adicionar produto à planilha:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao adicionar produto à planilha",
    };
  }
}

// Função para fazer upload de múltiplas imagens
export async function uploadImages(
  files: File[]
): Promise<
  {
    fileName: string;
    publicUrl: string;
    addedToSheet: boolean;
    errorMessage?: string;
  }[]
> {
  const results: {
    fileName: string;
    publicUrl: string;
    addedToSheet: boolean;
    errorMessage?: string;
  }[] = [];

  for (const file of files) {
    const publicUrl = await uploadImage(file);
    if (publicUrl) {
      // Extrair o nome do produto do nome do arquivo
      const productName = extractProductNameFromFileName(file.name);

      // Adicionar o produto à planilha
      const sheetResult = await addProductToSheet(productName, publicUrl);

      results.push({
        fileName: file.name,
        publicUrl,
        addedToSheet: sheetResult.success,
        errorMessage: sheetResult.message,
      });
    }
  }

  return results;
}
