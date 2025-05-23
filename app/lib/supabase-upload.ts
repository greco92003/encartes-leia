"use client";

import { supabase, supabaseConfig } from "./supabase-client";
import { getCurrentUser } from "./supabase-auth";
import { API_ENDPOINTS, getApiUrl } from "./api-config";

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

// Armazenamento local para produtos que não puderam ser adicionados à planilha
interface PendingProduct {
  productName: string;
  imageUrl: string;
  timestamp: number;
}

// Função para salvar produtos pendentes no localStorage
function savePendingProduct(productName: string, imageUrl: string): void {
  try {
    // Verificar se estamos no navegador
    if (typeof window === "undefined") return;

    // Obter produtos pendentes existentes
    const pendingProductsJson = localStorage.getItem("pendingProducts") || "[]";
    const pendingProducts: PendingProduct[] = JSON.parse(pendingProductsJson);

    // Adicionar novo produto pendente
    pendingProducts.push({
      productName,
      imageUrl,
      timestamp: Date.now(),
    });

    // Salvar de volta no localStorage
    localStorage.setItem("pendingProducts", JSON.stringify(pendingProducts));
    console.log(
      `Produto "${productName}" salvo localmente para sincronização posterior.`
    );
  } catch (error) {
    console.error("Erro ao salvar produto pendente:", error);
  }
}

// Função para adicionar o produto à planilha do Google (aba produtos)
export async function addProductToSheet(
  productName: string,
  imageUrl: string
): Promise<{
  success: boolean;
  message?: string;
  uploadedToSupabase?: boolean;
}> {
  try {
    // Verificar se estamos em ambiente de produção
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    // Se estamos em produção e a URL contém vercel.app, usar o fallback local
    // Este é um workaround temporário para o erro no servidor Vercel
    if (isProduction && window.location.hostname.includes("vercel.app")) {
      console.log(
        "Detectado ambiente de produção Vercel. Usando fallback local."
      );
      savePendingProduct(productName, imageUrl);
      return {
        success: false,
        message:
          "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
        uploadedToSupabase: true,
      };
    }

    // Usar a configuração centralizada para garantir que a requisição seja enviada para o servidor correto
    const apiUrl = API_ENDPOINTS.ADD_PRODUCT_TO_SHEET;
    console.log(`Enviando requisição para: ${apiUrl}`);
    console.log(
      `Dados: Nome do produto: ${productName}, URL da imagem: ${imageUrl.substring(
        0,
        50
      )}...`
    );

    // Adicionar um timeout para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          imageUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Limpar o timeout se a requisição for bem-sucedida

      console.log(`Resposta recebida com status: ${response.status}`);

      if (!response.ok) {
        console.error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );
        let errorDetails = "";
        try {
          const errorText = await response.text();
          console.error(`Detalhes do erro: ${errorText}`);
          errorDetails = errorText;

          // Se o erro for 500 e estamos em produção, usar o fallback local
          if (response.status === 500 && isProduction) {
            console.log("Erro 500 em produção. Usando fallback local.");
            savePendingProduct(productName, imageUrl);
            return {
              success: false,
              message:
                "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
              uploadedToSupabase: true,
            };
          }
        } catch (e) {
          console.error("Erro ao ler detalhes do erro:", e);
        }

        throw new Error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log(`Resultado da requisição:`, result);

      if (result.success) {
        console.log("Produto adicionado à planilha com sucesso:", result);
        return { success: true };
      } else {
        console.warn("Falha ao adicionar produto à planilha:", result.message);

        // Se o erro for relacionado à planilha e estamos em produção, usar o fallback local
        if (isProduction) {
          console.log("Erro na planilha em produção. Usando fallback local.");
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        return {
          success: false,
          message:
            result.message ||
            "Erro desconhecido ao adicionar produto à planilha",
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId); // Limpar o timeout em caso de erro

      if (fetchError.name === "AbortError") {
        console.error(
          "Timeout na requisição para adicionar produto à planilha"
        );

        // Se timeout e estamos em produção, usar o fallback local
        if (isProduction) {
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        return {
          success: false,
          message:
            "Timeout na requisição. A operação demorou muito para ser concluída.",
        };
      }

      throw fetchError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error("Erro ao adicionar produto à planilha:", error);

    // Verificar se estamos em ambiente de produção
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    // Se estamos em produção, usar o fallback local
    if (isProduction) {
      console.log("Erro em produção. Usando fallback local.");
      savePendingProduct(productName, imageUrl);
      return {
        success: false,
        message:
          "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
        uploadedToSupabase: true,
      };
    }

    // Tentar novamente com uma abordagem alternativa se for um erro de rede
    if (error instanceof TypeError && error.message.includes("fetch")) {
      try {
        console.log("Tentando abordagem alternativa devido a erro de rede...");

        // Tentar uma abordagem alternativa usando a função getApiUrl
        const fallbackUrl = getApiUrl("add-product-to-sheet");

        console.log(`Tentando URL alternativa: ${fallbackUrl}`);

        const fallbackResponse = await fetch(fallbackUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productName,
            imageUrl,
          }),
        });

        const fallbackResult = await fallbackResponse.json();

        if (fallbackResult.success) {
          console.log(
            "Produto adicionado à planilha com sucesso (fallback):",
            fallbackResult
          );
          return { success: true };
        } else {
          console.warn(
            "Falha ao adicionar produto à planilha (fallback):",
            fallbackResult.message
          );
          return {
            success: false,
            message:
              fallbackResult.message ||
              "Erro desconhecido ao adicionar produto à planilha",
          };
        }
      } catch (fallbackError) {
        console.error("Erro na abordagem alternativa:", fallbackError);
      }
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao adicionar produto à planilha",
    };
  }
}

// Função para adicionar o produto diretamente à aba "produtos" da planilha do Google
export async function addProductToProdutosTab(
  productName: string,
  imageUrl: string
): Promise<{
  success: boolean;
  message?: string;
  uploadedToSupabase?: boolean;
}> {
  try {
    // Verificar se estamos em ambiente de produção
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    // Se estamos em produção e a URL contém vercel.app, usar o fallback local
    if (isProduction && window.location.hostname.includes("vercel.app")) {
      console.log(
        "Detectado ambiente de produção Vercel. Usando fallback local."
      );
      savePendingProduct(productName, imageUrl);
      return {
        success: false,
        message:
          "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
        uploadedToSupabase: true,
      };
    }

    // Usar a configuração centralizada para a nova API simplificada
    const apiUrl = API_ENDPOINTS.ADD_TO_PRODUTOS_TAB;
    console.log(
      `Enviando requisição para aba "produtos" (API simplificada): ${apiUrl}`
    );
    console.log(
      `Dados: Nome do produto: ${productName}, URL da imagem: ${imageUrl.substring(
        0,
        50
      )}...`
    );

    // Log adicional para depuração
    console.log("API_ENDPOINTS:", API_ENDPOINTS);
    console.log("API_BASE_URL:", API_ENDPOINTS.ADD_TO_PRODUTOS_TAB);

    // Adicionar um timeout para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    try {
      console.log("Enviando requisição para:", apiUrl);
      console.log(
        "Corpo da requisição:",
        JSON.stringify({
          productName,
          imageUrl: imageUrl.substring(0, 50) + "...",
        })
      );

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          imageUrl,
        }),
        signal: controller.signal,
      });

      console.log("Resposta recebida:", response.status, response.statusText);

      clearTimeout(timeoutId); // Limpar o timeout se a requisição for bem-sucedida

      console.log(`Resposta recebida com status: ${response.status}`);

      if (!response.ok) {
        console.error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );

        // Se estamos em produção, usar o fallback local
        if (isProduction) {
          console.log("Erro na API. Usando fallback local.");
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        throw new Error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log(`Resultado da requisição para aba "produtos":`, result);

      if (result.success) {
        console.log("Produto adicionado à aba 'produtos' com sucesso:", result);
        return { success: true };
      } else {
        console.warn(
          "Falha ao adicionar produto à aba 'produtos':",
          result.message
        );

        // Se o erro for relacionado à planilha e estamos em produção, usar o fallback local
        if (isProduction) {
          console.log("Erro na planilha em produção. Usando fallback local.");
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        return {
          success: false,
          message:
            result.message ||
            "Erro desconhecido ao adicionar produto à aba 'produtos'",
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId); // Limpar o timeout em caso de erro

      if (fetchError.name === "AbortError") {
        console.error(
          "Timeout na requisição para adicionar produto à aba 'produtos'"
        );

        // Se timeout e estamos em produção, usar o fallback local
        if (isProduction) {
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        return {
          success: false,
          message:
            "Timeout na requisição. A operação demorou muito para ser concluída.",
        };
      }

      throw fetchError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error("Erro ao adicionar produto à aba 'produtos':", error);

    // Verificar se estamos em ambiente de produção
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    // Se estamos em produção, usar o fallback local
    if (isProduction) {
      console.log("Erro em produção. Usando fallback local.");
      savePendingProduct(productName, imageUrl);
      return {
        success: false,
        message:
          "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
        uploadedToSupabase: true,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao adicionar produto à aba 'produtos'",
    };
  }
}

// Função para adicionar o produto à aba "add" da planilha do Google
export async function addProductToAddTab(
  productName: string,
  imageUrl: string
): Promise<{
  success: boolean;
  message?: string;
  uploadedToSupabase?: boolean;
}> {
  try {
    // Verificar se estamos em ambiente de produção
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    // Se estamos em produção e a URL contém vercel.app, usar o fallback local
    if (isProduction && window.location.hostname.includes("vercel.app")) {
      console.log(
        "Detectado ambiente de produção Vercel. Usando fallback local."
      );
      savePendingProduct(productName, imageUrl);
      return {
        success: false,
        message:
          "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
        uploadedToSupabase: true,
      };
    }

    // Usar a configuração centralizada para a nova API simplificada
    const apiUrl = API_ENDPOINTS.ADD_TO_ADD_TAB;
    console.log(
      `Enviando requisição para aba "add" (API simplificada): ${apiUrl}`
    );
    console.log(
      `Dados: Nome do produto: ${productName}, URL da imagem: ${imageUrl.substring(
        0,
        50
      )}...`
    );

    // Log adicional para depuração
    console.log("API_ENDPOINTS:", API_ENDPOINTS);
    console.log("API_BASE_URL:", API_ENDPOINTS.ADD_TO_ADD_TAB);

    // Adicionar um timeout para a requisição
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    try {
      console.log("Enviando requisição para:", apiUrl);
      console.log(
        "Corpo da requisição:",
        JSON.stringify({
          productName,
          imageUrl: imageUrl.substring(0, 50) + "...",
        })
      );

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName,
          imageUrl,
        }),
        signal: controller.signal,
      });

      console.log("Resposta recebida:", response.status, response.statusText);

      clearTimeout(timeoutId); // Limpar o timeout se a requisição for bem-sucedida

      console.log(`Resposta recebida com status: ${response.status}`);

      if (!response.ok) {
        console.error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );

        // Se estamos em produção, usar o fallback local
        if (isProduction) {
          console.log("Erro na API. Usando fallback local.");
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        throw new Error(
          `Erro na resposta: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log(`Resultado da requisição para aba "add":`, result);

      if (result.success) {
        console.log("Produto adicionado à aba 'add' com sucesso:", result);
        return { success: true };
      } else {
        console.warn("Falha ao adicionar produto à aba 'add':", result.message);

        // Se o erro for relacionado à planilha e estamos em produção, usar o fallback local
        if (isProduction) {
          console.log("Erro na planilha em produção. Usando fallback local.");
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        return {
          success: false,
          message:
            result.message ||
            "Erro desconhecido ao adicionar produto à aba 'add'",
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId); // Limpar o timeout em caso de erro

      if (fetchError.name === "AbortError") {
        console.error(
          "Timeout na requisição para adicionar produto à aba 'add'"
        );

        // Se timeout e estamos em produção, usar o fallback local
        if (isProduction) {
          savePendingProduct(productName, imageUrl);
          return {
            success: false,
            message:
              "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
            uploadedToSupabase: true,
          };
        }

        return {
          success: false,
          message:
            "Timeout na requisição. A operação demorou muito para ser concluída.",
        };
      }

      throw fetchError; // Re-throw para ser capturado pelo catch externo
    }
  } catch (error) {
    console.error("Erro ao adicionar produto à aba 'add':", error);

    // Verificar se estamos em ambiente de produção
    const isProduction =
      typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1";

    // Se estamos em produção, usar o fallback local
    if (isProduction) {
      console.log("Erro em produção. Usando fallback local.");
      savePendingProduct(productName, imageUrl);
      return {
        success: false,
        message:
          "Produto salvo localmente. A sincronização com a planilha será feita posteriormente.",
        uploadedToSupabase: true,
      };
    }

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao adicionar produto à aba 'add'",
    };
  }
}

// Função para fazer upload de múltiplas imagens
export async function uploadImages(
  files: File[],
  options?: { onlyAddTab?: boolean; useProdutosTab?: boolean }
): Promise<
  {
    fileName: string;
    publicUrl: string;
    addedToSheet: boolean;
    uploadedToSupabase: boolean;
    errorMessage?: string;
  }[]
> {
  const results: {
    fileName: string;
    publicUrl: string;
    addedToSheet: boolean;
    uploadedToSupabase: boolean;
    errorMessage?: string;
  }[] = [];

  // Determinar se devemos usar apenas a aba "add" ou a aba "produtos"
  const onlyAddTab = options?.onlyAddTab || false;
  const useProdutosTab = options?.useProdutosTab || false;

  if (useProdutosTab) {
    console.log(
      "Modo de upload de imagens: usando aba 'produtos' (sem sincronização com aba 'add')"
    );
  } else if (onlyAddTab) {
    console.log(
      "Modo de upload de imagens: apenas aba 'add' (sem sincronização com aba 'produtos')"
    );
  } else {
    console.log(
      "Modo de upload de imagens: sincronização completa (abas 'add' e 'produtos')"
    );
  }

  for (const file of files) {
    const publicUrl = await uploadImage(file);
    if (publicUrl) {
      // Extrair o nome do produto do nome do arquivo
      const productName = extractProductNameFromFileName(file.name);

      let addTabResult = { success: true };
      let productsTabResult = { success: true };

      // Se estamos usando a aba "produtos", adicionar apenas a ela
      if (useProdutosTab) {
        productsTabResult = await addProductToProdutosTab(
          productName,
          publicUrl
        );
      }
      // Caso contrário, seguir a lógica anterior
      else {
        // Adicionar o produto à aba "add" da planilha
        addTabResult = await addProductToAddTab(productName, publicUrl);

        // Adicionar à aba "produtos" apenas se não estiver no modo onlyAddTab
        if (!onlyAddTab) {
          // Também adicionar à aba "produtos" para manter compatibilidade
          productsTabResult = await addProductToSheet(productName, publicUrl);
        }
      }

      // Consideramos sucesso se pelo menos uma das operações foi bem-sucedida
      const success = addTabResult.success || productsTabResult.success;

      // Mensagem de erro (se houver)
      let errorMessage = "";
      if (!useProdutosTab && !addTabResult.success) {
        errorMessage = `Erro na aba "add": ${
          addTabResult.message || "Erro desconhecido"
        }`;
      }

      if ((useProdutosTab || !onlyAddTab) && !productsTabResult.success) {
        errorMessage += errorMessage ? " | " : "";
        errorMessage += `Erro na aba "produtos": ${
          productsTabResult.message || "Erro desconhecido"
        }`;
      }

      results.push({
        fileName: file.name,
        publicUrl,
        addedToSheet: success,
        uploadedToSupabase: true,
        errorMessage: success ? undefined : errorMessage,
      });
    } else {
      // Se o upload para o Supabase falhou
      results.push({
        fileName: file.name,
        publicUrl: "",
        addedToSheet: false,
        uploadedToSupabase: false,
        errorMessage: "Falha ao fazer upload da imagem para o Supabase",
      });
    }
  }

  return results;
}
