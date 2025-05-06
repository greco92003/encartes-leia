import { NextResponse } from "next/server";
import { serverAddProductToProdutos } from "@/lib/server-add-to-produtos";

export async function POST(request: Request) {
  try {
    // Obter os dados do corpo da requisição
    const body = await request.json();
    const { productName, imageUrl } = body;

    if (!productName || !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          message: "Nome do produto e URL da imagem são obrigatórios",
        },
        { status: 400 }
      );
    }

    console.log(`Recebido pedido para adicionar produto à aba "produtos":`, {
      productName,
      imageUrl: imageUrl.substring(0, 30) + "...",
    });

    // Chamar a função do servidor para adicionar o produto à aba "produtos"
    const result = await serverAddProductToProdutos(productName, imageUrl);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message || "Produto adicionado com sucesso à aba produtos",
        productName,
        imageUrl,
        updatedRange: result.updatedRange,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Erro ao adicionar produto à aba produtos",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao processar requisição:", error);
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
