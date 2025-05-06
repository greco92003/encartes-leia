import { NextResponse } from "next/server";
import { serverAddProductToProdutos } from "@/lib/server-add-to-produtos";

// Função para gerar um nome de produto aleatório
function generateRandomProductName(): string {
  const prefixes = [
    "Arroz",
    "Feijão",
    "Macarrão",
    "Açúcar",
    "Café",
    "Leite",
    "Óleo",
    "Sal",
    "Farinha",
    "Biscoito",
  ];
  
  const brands = [
    "Premium",
    "Especial",
    "Tradicional",
    "Gourmet",
    "Clássico",
    "Selecionado",
    "Natural",
    "Orgânico",
    "Integral",
    "Light",
  ];
  
  const sizes = [
    "500g",
    "1kg",
    "2kg",
    "5kg",
    "250ml",
    "500ml",
    "1L",
    "2L",
    "5L",
    "Pacote",
  ];
  
  const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const randomBrand = brands[Math.floor(Math.random() * brands.length)];
  const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  
  return `${randomPrefix} ${randomBrand} ${randomSize} - Teste ${randomNumber}`;
}

// Função para gerar uma URL de imagem aleatória
function generateRandomImageUrl(): string {
  const baseUrl = "https://zqeypptzvwelnlkqbcco.supabase.co/storage/v1/object/public/imagens/";
  const randomId = Math.floor(Math.random() * 10000);
  return `${baseUrl}produto-teste-${randomId}.png`;
}

// Rota para adicionar um produto aleatório à aba "produtos"
export async function GET(request: Request) {
  try {
    // Gerar um nome de produto aleatório
    const productName = generateRandomProductName();
    
    // Gerar uma URL de imagem aleatória
    const imageUrl = generateRandomImageUrl();
    
    console.log(`Tentando adicionar produto aleatório à aba "produtos"...`);
    console.log(`Nome do produto: ${productName}`);
    console.log(`URL da imagem: ${imageUrl}`);
    
    // Chamar a função do servidor para adicionar o produto à aba "produtos"
    const result = await serverAddProductToProdutos(productName, imageUrl);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Produto aleatório adicionado com sucesso à aba "produtos"`,
        productName,
        imageUrl,
        updatedRange: result.updatedRange,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || `Erro ao adicionar produto aleatório à aba "produtos"`,
          productName,
          imageUrl,
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
