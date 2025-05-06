import { NextResponse } from "next/server";
import { serverAddProductToAddTab } from "@/lib/server-add-to-add-tab";

// Função para depurar o problema de adição de produtos à aba "add"
export async function GET(request: Request) {
  try {
    console.log("Iniciando depuração da adição de produtos à aba 'add'...");

    // Produto de teste
    const productName = "Produto de Teste Debug " + new Date().toISOString();
    const imageUrl = "https://example.com/test-image-debug.png";

    console.log(
      `Tentando adicionar produto de teste à aba "add" usando a função serverAddProductToAddTab...`
    );
    console.log(`Nome do produto: ${productName}`);
    console.log(`URL da imagem: ${imageUrl}`);

    // Chamar a função serverAddProductToAddTab diretamente
    const result = await serverAddProductToAddTab(productName, imageUrl);

    console.log("Resultado da função addProductToAddTab:", result);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Produto adicionado com sucesso à aba 'add'",
        result,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Falha ao adicionar produto à aba 'add'",
        result,
      });
    }
  } catch (error) {
    console.error("Erro ao processar requisição de depuração:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
